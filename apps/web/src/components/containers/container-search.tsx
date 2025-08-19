"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, Package } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

interface ContainerSearchProps {
  initialQuery?: string;
}

export function ContainerSearch({ initialQuery }: ContainerSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery || "");
  const debouncedQuery = useDebounce(query, 300);

  // Обновление URL при изменении поиска
  const updateSearch = useCallback(
    (newQuery: string) => {
      const params = new URLSearchParams(searchParams);

      if (newQuery.trim()) {
        params.set("q", newQuery.trim());
      } else {
        params.delete("q");
      }

      router.push(`/containers?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Обработка изменения поиска
  const handleQueryChange = (value: string) => {
    setQuery(value);
  };

  // Обработка отправки формы
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearch(query);
  };

  // Автоматическое обновление при debounce
  useEffect(() => {
    if (debouncedQuery !== initialQuery) {
      updateSearch(debouncedQuery);
    }
  }, [debouncedQuery, initialQuery, updateSearch]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="search">Номер контейнера или BOL</Label>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="MSCU1234567 или MSC123456789..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Введите номер контейнера (например: MSCU1234567) или номер BOL
        </p>
      </div>

      <div className="flex items-center space-x-4">
        <Button type="submit" disabled={!query.trim()}>
          <Search className="h-4 w-4 mr-2" />
          Найти
        </Button>

        {query && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setQuery("");
              updateSearch("");
            }}
          >
            Очистить
          </Button>
        )}
      </div>

      {/* Примеры поиска */}
      <div className="pt-4 border-t">
        <h4 className="text-sm font-medium mb-2">Примеры поиска:</h4>
        <div className="flex flex-wrap gap-2">
          {["MSCU1234567", "MAEU3456789", "CMA7890123"].map((example) => (
            <Button
              key={example}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery(example);
                updateSearch(example);
              }}
            >
              <Package className="h-3 w-3 mr-1" />
              {example}
            </Button>
          ))}
        </div>
      </div>
    </form>
  );
}
