"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/browser";
import { Search, Filter, X } from "lucide-react";

interface ArrivalsFiltersProps {
  searchParams: { [key: string]: string | undefined };
}

export function ArrivalsFilters({ searchParams }: ArrivalsFiltersProps) {
  const router = useRouter();
  const currentSearchParams = useSearchParams();

  const [terminals, setTerminals] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [lines, setLines] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  // Локальное состояние фильтров
  const [filters, setFilters] = useState({
    date_from: searchParams.date_from || "",
    date_to: searchParams.date_to || "",
    terminal: searchParams.terminal || "all",
    line: searchParams.line || "all",
    search: searchParams.search || "",
  });

  // Загрузка справочников
  useEffect(() => {
    async function loadReferences() {
      const supabase = createClient();

      try {
        const [terminalsResult, linesResult] = await Promise.all([
          supabase.from("terminals").select("id, name").order("name"),
          supabase.from("shipping_lines").select("id, name").order("name"),
        ]);

        if (terminalsResult.data) setTerminals(terminalsResult.data);
        if (linesResult.data) setLines(linesResult.data);
      } catch (error) {
        console.error("Error loading references:", error);
      } finally {
        setLoading(false);
      }
    }

    loadReferences();
  }, []);

  // Обновление URL при изменении фильтров
  const updateFilters = useCallback(
    (newFilters: typeof filters) => {
      const params = new URLSearchParams(currentSearchParams);

      Object.entries(newFilters).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      // Сброс страницы при изменении фильтров
      params.delete("page");

      router.push(`/arrivals?${params.toString()}`);
    },
    [router, currentSearchParams]
  );

  // Обработчики изменений
  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    updateFilters(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      date_from: "",
      date_to: "",
      terminal: "all",
      line: "all",
      search: "",
    };
    setFilters(clearedFilters);
    updateFilters(clearedFilters);
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'terminal' || key === 'line') {
      return value !== "all";
    }
    return value !== "";
  });

  if (loading) {
    return <div>Загрузка фильтров...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Поиск */}
        <div className="lg:col-span-2">
          <Label htmlFor="search">Поиск по номеру рейса</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="MSC123E..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="pl-10"
            />
          </div>
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

        {/* Терминал */}
        <div>
          <Label htmlFor="terminal">Терминал</Label>
          <Select
            value={filters.terminal}
            onValueChange={(value) => handleFilterChange("terminal", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Все терминалы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все терминалы</SelectItem>
              {terminals.map((terminal) => (
                <SelectItem key={terminal.id} value={terminal.id}>
                  {terminal.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Линия */}
        <div>
          <Label htmlFor="line">Линия</Label>
          <Select
            value={filters.line}
            onValueChange={(value) => handleFilterChange("line", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Все линии" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все линии</SelectItem>
              {lines.map((line) => (
                <SelectItem key={line.id} value={line.id}>
                  {line.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
