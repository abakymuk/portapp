import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface VoyageDetailsProps {
  voyage: any;
}

export function VoyageDetails({ voyage }: VoyageDetailsProps) {
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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Основная информация */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Основная информация</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Судно
            </label>
            <p className="text-lg font-semibold">{voyage.vessel_name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Номер рейса
            </label>
            <p className="text-lg font-semibold">{voyage.voyage_no}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Статус
            </label>
            <div className="mt-1">{getStatusBadge(voyage.status)}</div>
          </div>
        </CardContent>
      </Card>

      {/* Времена */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Времена</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              ETA (Ожидаемое время прибытия)
            </label>
            <p className="text-lg font-semibold">
              {voyage.eta
                ? format(new Date(voyage.eta), "dd.MM.yyyy HH:mm", {
                    locale: ru,
                  })
                : "-"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              ETD (Ожидаемое время отбытия)
            </label>
            <p className="text-lg font-semibold">
              {voyage.etd
                ? format(new Date(voyage.etd), "dd.MM.yyyy HH:mm", {
                    locale: ru,
                  })
                : "-"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              ATA (Фактическое время прибытия)
            </label>
            <p className="text-lg font-semibold">
              {voyage.ata
                ? format(new Date(voyage.ata), "dd.MM.yyyy HH:mm", {
                    locale: ru,
                  })
                : "-"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              ATD (Фактическое время отбытия)
            </label>
            <p className="text-lg font-semibold">
              {voyage.atd
                ? format(new Date(voyage.atd), "dd.MM.yyyy HH:mm", {
                    locale: ru,
                  })
                : "-"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Местоположение и линия */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Местоположение</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Терминал
            </label>
            <p className="text-lg font-semibold">{voyage.terminal_name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Линия
            </label>
            <p className="text-lg font-semibold">{voyage.line_name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Контейнеры
            </label>
            <p className="text-lg font-semibold">
              {voyage.containers_available}/{voyage.containers_total}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
