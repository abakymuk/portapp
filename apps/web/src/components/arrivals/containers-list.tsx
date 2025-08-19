import { Badge } from "@/components/ui/badge";
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

interface ContainersListProps {
  containers: any[];
}

export function ContainersList({ containers }: ContainersListProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      available: "default",
      in_transit: "secondary",
      delivered: "outline",
      damaged: "destructive",
    };

    const labels = {
      available: "Доступен",
      in_transit: "В пути",
      delivered: "Доставлен",
      damaged: "Повреждён",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getSizeBadge = (size: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      "20": "default",
      "40": "secondary",
      "45": "outline",
    };

    return (
      <Badge variant={variants[size] || "default"} className="text-xs">
        {size}'
      </Badge>
    );
  };

  if (!containers || containers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Контейнеры не найдены
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Номер контейнера</TableHead>
            <TableHead>Размер</TableHead>
            <TableHead>Тип</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Вес (кг)</TableHead>
            <TableHead>Последнее событие</TableHead>
            <TableHead>Время события</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {containers.map((container) => {
            // Получаем последнее событие
            const lastEvent = container.container_events?.[0];

            return (
              <TableRow key={container.id}>
                <TableCell className="font-medium">
                  {container.cntr_no}
                </TableCell>
                <TableCell>{getSizeBadge(container.size)}</TableCell>
                <TableCell>{container.type}</TableCell>
                <TableCell>
                  {getStatusBadge(container.last_known_status)}
                </TableCell>
                <TableCell>{container.weight_kg || "-"}</TableCell>
                <TableCell>
                  {lastEvent ? (
                    <span className="text-sm">
                      {lastEvent.event_type === "arrival" && "Прибытие"}
                      {lastEvent.event_type === "departure" && "Отбытие"}
                      {lastEvent.event_type === "delivery" && "Доставка"}
                      {lastEvent.event_type === "pickup" && "Забор"}
                    </span>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  {lastEvent?.event_time
                    ? format(
                        new Date(lastEvent.event_time),
                        "dd.MM.yyyy HH:mm",
                        { locale: ru }
                      )
                    : "-"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
