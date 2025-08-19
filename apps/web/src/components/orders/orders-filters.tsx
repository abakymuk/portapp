"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, X } from "lucide-react";

interface OrdersFiltersProps {
  searchParams: Record<string, string | undefined>;
}

export function OrdersFilters({ searchParams }: OrdersFiltersProps) {
  const router = useRouter();
  const currentSearchParams = useSearchParams();

  // Локальное состояние фильтров
  const [filters, setFilters] = useState({
    status: searchParams.status || "all",
    date_from: searchParams.date_from || "",
    date_to: searchParams.date_to || "",
    search: searchParams.search || "",
  });

  // Обновление URL при изменении фильтров
  const updateFilters = useCallback(
    (newFilters: typeof filters) => {
      const params = new URLSearchParams(currentSearchParams);

      Object.entries(newFilters).forEach(([key, value]) => {
        if (value && value !== "all") {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      router.push(`/orders?${params.toString()}`);
    },
    [router, currentSearchParams]
  );

  // Обработка изменения фильтра
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    updateFilters(newFilters);
  };

  // Очистка фильтров
  const clearFilters = () => {
    const clearedFilters = {
      status: "all",
      date_from: "",
      date_to: "",
      search: "",
    };
    setFilters(clearedFilters);
    updateFilters(clearedFilters);
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === "status") {
      return value !== "all";
    }
    return value !== "";
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Поиск */}
        <div className="lg:col-span-2">
          <Label htmlFor="search">Поиск по номеру заказа</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="ORD-2024-001..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Статус */}
        <div>
          <Label htmlFor="status">Статус</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange("status", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Все статусы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="draft">Черновик</SelectItem>
              <SelectItem value="confirmed">Подтверждён</SelectItem>
              <SelectItem value="in_progress">В работе</SelectItem>
              <SelectItem value="completed">Завершён</SelectItem>
              <SelectItem value="cancelled">Отменён</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Дата от */}
        <div>
          <Label htmlFor="date_from">Дата от</Label>
          <Input
            id="date_from"
            type="date"
            value={filters.date_from}
            onChange={(e) => handleFilterChange("date_from", e.target.value)}
          />
        </div>

        {/* Дата до */}
        <div>
          <Label htmlFor="date_to">Дата до</Label>
          <Input
            id="date_to"
            type="date"
            value={filters.date_to}
            onChange={(e) => handleFilterChange("date_to", e.target.value)}
          />
        </div>
      </div>

      {/* Кнопки управления */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {hasActiveFilters ? "Активные фильтры" : "Нет активных фильтров"}
          </span>
        </div>

        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Очистить фильтры
          </Button>
        )}
      </div>
    </div>
  );
}
