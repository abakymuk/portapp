import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";

interface ArrivalsListProps {
  searchParams: { [key: string]: string | undefined };
}

export async function ArrivalsList({ searchParams }: ArrivalsListProps) {
  const supabase = await createClient();

  // Построение запроса с фильтрами
  let query = supabase
    .from("mv_upcoming_voyages")
    .select("*", { count: "exact" })
    .order("eta", { ascending: true });

  // Применение фильтров
  if (searchParams.date_from) {
    query = query.gte("eta", searchParams.date_from);
  }

  if (searchParams.date_to) {
    query = query.lte("eta", searchParams.date_to);
  }

  if (searchParams.terminal && searchParams.terminal !== "all") {
    query = query.eq("terminal_id", searchParams.terminal);
  }

  if (searchParams.line && searchParams.line !== "all") {
    query = query.eq("line_id", searchParams.line);
  }

  if (searchParams.search) {
    query = query.ilike("voyage_no", `%${searchParams.search}%`);
  }

  // Пагинация
  const page = parseInt(searchParams.page || "1");
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.range(from, to);

  const { data: voyages, error, count } = await query;

  if (error) {
    console.error("Error fetching voyages:", error);
    return <div>Ошибка загрузки данных</div>;
  }

  const totalPages = count ? Math.ceil(count / pageSize) : 0;

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      scheduled: "default",
      arrived: "secondary",
      departed: "outline",
      canceled: "destructive",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status === "scheduled" && "Запланирован"}
        {status === "arrived" && "Прибыл"}
        {status === "departed" && "Отбыл"}
        {status === "canceled" && "Отменён"}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Судно</TableHead>
            <TableHead>Рейс</TableHead>
            <TableHead>ETA</TableHead>
            <TableHead>ETD</TableHead>
            <TableHead>Терминал</TableHead>
            <TableHead>Линия</TableHead>
            <TableHead>Контейнеры</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {voyages?.map((voyage) => (
            <TableRow key={voyage.id}>
              <TableCell className="font-medium">
                {voyage.vessel_name}
              </TableCell>
              <TableCell>{voyage.voyage_no}</TableCell>
              <TableCell>
                {voyage.eta
                  ? format(new Date(voyage.eta), "dd.MM.yyyy HH:mm", {
                      locale: ru,
                    })
                  : "-"}
              </TableCell>
              <TableCell>
                {voyage.etd
                  ? format(new Date(voyage.etd), "dd.MM.yyyy HH:mm", {
                      locale: ru,
                    })
                  : "-"}
              </TableCell>
              <TableCell>{voyage.terminal_name}</TableCell>
              <TableCell>{voyage.line_name}</TableCell>
              <TableCell>
                {voyage.containers_available}/{voyage.containers_total}
              </TableCell>
              <TableCell>{getStatusBadge(voyage.status)}</TableCell>
              <TableCell>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/arrivals/${voyage.id}`}>Детали</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {(!voyages || voyages.length === 0) && (
        <div className="text-center py-8 text-muted-foreground">
          Рейсы не найдены
        </div>
      )}

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Показано {from + 1}-{Math.min(to + 1, count || 0)} из {count} рейсов
          </div>
          <div className="flex items-center space-x-2">
            {page > 1 && (
              <Button asChild variant="outline" size="sm">
                <Link
                  href={`/arrivals?${new URLSearchParams({
                    ...searchParams,
                    page: (page - 1).toString(),
                  })}`}
                >
                  Назад
                </Link>
              </Button>
            )}
            <span className="text-sm">
              Страница {page} из {totalPages}
            </span>
            {page < totalPages && (
              <Button asChild variant="outline" size="sm">
                <Link
                  href={`/arrivals?${new URLSearchParams({
                    ...searchParams,
                    page: (page + 1).toString(),
                  })}`}
                >
                  Вперёд
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
