import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { MapPin, Calendar, Clock } from "lucide-react";

interface ContainerEventsProps {
  events: any[];
}

export function ContainerEvents({ events }: ContainerEventsProps) {
  const getEventTypeLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      arrival: "Прибытие",
      departure: "Отбытие",
      discharge: "Выгрузка",
      loading: "Погрузка",
      delivery: "Доставка",
      pickup: "Забор",
      hold: "Удержание",
      release: "Освобождение",
    };

    return labels[eventType] || eventType;
  };

  const getEventTypeBadge = (eventType: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      arrival: "default",
      departure: "outline",
      discharge: "secondary",
      loading: "secondary",
      delivery: "default",
      pickup: "destructive",
      hold: "destructive",
      release: "outline",
    };

    return (
      <Badge variant={variants[eventType] || "default"} className="text-xs">
        {getEventTypeLabel(eventType)}
      </Badge>
    );
  };

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MapPin className="h-8 w-8 mx-auto mb-2" />
        <p>История событий пуста</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">История событий</h3>
        <Badge variant="outline">{events.length} событий</Badge>
      </div>

      <div className="space-y-3">
        {events.map((event, index) => (
          <div
            key={index}
            className="flex items-start space-x-3 p-3 border rounded-lg"
          >
            <div className="flex-shrink-0 mt-1">
              <MapPin className="h-4 w-4 text-blue-600" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                {getEventTypeBadge(event.event_type)}
                <span className="text-sm text-muted-foreground">
                  {format(new Date(event.event_time), "dd.MM.yyyy", {
                    locale: ru,
                  })}
                </span>
              </div>

              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  {format(new Date(event.event_time), "HH:mm", { locale: ru })}
                </span>
              </div>

              {event.payload && (
                <div className="mt-2 text-sm">
                  <details className="cursor-pointer">
                    <summary className="text-muted-foreground hover:text-foreground">
                      Детали события
                    </summary>
                    <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                      {JSON.stringify(event.payload, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
