import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";
import { Package, Ship, Calendar, MapPin } from "lucide-react";

interface ContainerCardProps {
  container: any;
}

export function ContainerCard({ container }: ContainerCardProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      in_transit: "default",
      discharged: "secondary",
      available: "outline",
      picked_up: "destructive",
      hold: "destructive",
    };

    const labels: Record<string, string> = {
      in_transit: "В пути",
      discharged: "Выгружен",
      available: "Доступен",
      picked_up: "Забран",
      hold: "На удержании",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const voyage = container.voyages;
  const events = container.container_events || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">{container.cntr_no}</CardTitle>
          </div>
          {getStatusBadge(container.last_known_status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Основная информация */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Тип:</span>
              <span>{container.iso_type || "Не указан"}</span>
            </div>

            {container.bill_of_lading && (
              <div className="flex items-center space-x-2 text-sm">
                <Ship className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">BOL:</span>
                <span>{container.bill_of_lading}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {voyage && (
              <>
                <div className="flex items-center space-x-2 text-sm">
                  <Ship className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Рейс:</span>
                  <span>{voyage.voyage_no}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="font-medium">Судно:</span>
                  <span>{voyage.vessel_name}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Время последнего статуса */}
        {container.last_status_time && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Последнее обновление:</span>
            <span>
              {format(
                new Date(container.last_status_time),
                "dd.MM.yyyy HH:mm",
                { locale: ru }
              )}
            </span>
          </div>
        )}

        {/* Последние события */}
        {events.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Последние события:</h4>
            <div className="space-y-1">
              {events.slice(0, 3).map((event: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 text-xs text-muted-foreground"
                >
                  <MapPin className="h-3 w-3" />
                  <span className="capitalize">{event.event_type}</span>
                  <span>•</span>
                  <span>
                    {format(new Date(event.event_time), "dd.MM.yyyy HH:mm", {
                      locale: ru,
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Действия */}
        <div className="flex items-center space-x-2 pt-2 border-t">
          <Button asChild variant="outline" size="sm">
            <Link href={`/containers/${container.cntr_no}`}>Подробнее</Link>
          </Button>

          {voyage && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/arrivals/${voyage.id}`}>Рейс</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
