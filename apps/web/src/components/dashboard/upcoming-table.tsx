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
import Link from "next/link";

// Отдельный компонент для статуса
function StatusBadge({ status }: { status: string }) {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    scheduled: "default",
    arrived: "secondary",
    departed: "outline",
    canceled: "destructive",
  };

  const labels = {
    scheduled: "Запланирован",
    arrived: "Прибыл",
    departed: "Отбыл",
    canceled: "Отменён",
  };

  return (
    <Badge
      variant={variants[status] || "default"}
      className="text-xs px-1.5 py-0.5"
    >
      {labels[status as keyof typeof labels] || status}
    </Badge>
  );
}

// Отдельный компонент для строки таблицы
function VoyageRow({ voyage }: { voyage: any }) {
  return (
    <TableRow>
      <TableCell className="font-medium text-xs">
        <div className="truncate" title={voyage.vessel_name}>
          {voyage.vessel_name}
        </div>
      </TableCell>
      <TableCell className="text-xs">{voyage.voyage_no}</TableCell>
      <TableCell className="text-xs">
        {voyage.eta ? format(new Date(voyage.eta), "dd.MM HH:mm") : "-"}
      </TableCell>
      <TableCell className="text-xs">
        <div className="truncate" title={voyage.terminal_name}>
          {voyage.terminal_name}
        </div>
      </TableCell>
      <TableCell className="text-xs">
        {voyage.containers_available}/{voyage.containers_total}
      </TableCell>
      <TableCell>
        <StatusBadge status={voyage.status} />
      </TableCell>
      <TableCell>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-6 px-2 text-xs"
        >
          <Link href={`/arrivals/${voyage.id}`}>Детали</Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}

export async function UpcomingTable() {
  const supabase = await createClient();

  const { data: voyages, error } = await supabase
    .from("mv_upcoming_voyages")
    .select("*")
    .gte("eta", new Date().toISOString())
    .lte("eta", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
    .order("eta", { ascending: true })
    .limit(10);

  if (error) {
    console.error("Error fetching voyages:", error);
    return <div>Ошибка загрузки данных</div>;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Судно</TableHead>
            <TableHead className="w-[80px]">Рейс</TableHead>
            <TableHead className="w-[100px]">ETA</TableHead>
            <TableHead className="w-[140px]">Терминал</TableHead>
            <TableHead className="w-[80px]">Конт.</TableHead>
            <TableHead className="w-[100px]">Статус</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {voyages?.map((voyage) => (
            <VoyageRow key={voyage.id} voyage={voyage} />
          ))}
        </TableBody>
      </Table>

      {(!voyages || voyages.length === 0) && (
        <div className="text-center py-8 text-muted-foreground">
          Нет рейсов в ближайшие 7 дней
        </div>
      )}
    </div>
  );
}
