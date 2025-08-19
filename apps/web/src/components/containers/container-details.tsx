import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Package, Ship, Calendar, MapPin, Weight, Ruler } from "lucide-react";

interface ContainerDetailsProps {
  container: any;
}

export function ContainerDetails({ container }: ContainerDetailsProps) {
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

  return (
    <div className="space-y-6">
      {/* Основная информация */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Основная информация</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Номер контейнера:</span>
              <span className="font-mono">{container.cntr_no}</span>
            </div>

            <div className="flex items-center space-x-2">
              <Ruler className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Тип:</span>
              <span>{container.iso_type || "Не указан"}</span>
            </div>

            {container.bill_of_lading && (
              <div className="flex items-center space-x-2">
                <Ship className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">BOL:</span>
                <span className="font-mono">{container.bill_of_lading}</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Статус:</span>
              {getStatusBadge(container.last_known_status)}
            </div>

            {container.weight_kg && (
              <div className="flex items-center space-x-2">
                <Weight className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Вес:</span>
                <span>{container.weight_kg} кг</span>
              </div>
            )}

            {container.last_status_time && (
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Последнее обновление:</span>
                <span>
                  {format(
                    new Date(container.last_status_time),
                    "dd.MM.yyyy HH:mm",
                    { locale: ru }
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Информация о рейсе */}
      {voyage && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Информация о рейсе</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Ship className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Номер рейса:</span>
                <span>{voyage.voyage_no}</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="font-medium">Судно:</span>
                <span>{voyage.vessel_name}</span>
              </div>
            </div>

            <div className="space-y-3">
              {voyage.eta && (
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">ETA:</span>
                  <span>
                    {format(new Date(voyage.eta), "dd.MM.yyyy HH:mm", {
                      locale: ru,
                    })}
                  </span>
                </div>
              )}

              {voyage.etd && (
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">ETD:</span>
                  <span>
                    {format(new Date(voyage.etd), "dd.MM.yyyy HH:mm", {
                      locale: ru,
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Дополнительная информация */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Дополнительная информация</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            {container.owner && (
              <div className="flex items-center space-x-2">
                <span className="font-medium">Владелец:</span>
                <span>{container.owner}</span>
              </div>
            )}

            {container.consignee && (
              <div className="flex items-center space-x-2">
                <span className="font-medium">Грузополучатель:</span>
                <span>{container.consignee}</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {container.origin && (
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Порт отправления:</span>
                <span>{container.origin}</span>
              </div>
            )}

            {container.destination && (
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Порт назначения:</span>
                <span>{container.destination}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
