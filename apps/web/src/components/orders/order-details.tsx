import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Package, Calendar, User, Mail, FileText } from "lucide-react";

interface OrderDetailsProps {
  order: any;
}

export function OrderDetails({ order }: OrderDetailsProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      draft: "outline",
      confirmed: "default",
      in_progress: "secondary",
      completed: "default",
      cancelled: "destructive",
    };

    const labels: Record<string, string> = {
      draft: "Черновик",
      confirmed: "Подтверждён",
      in_progress: "В работе",
      completed: "Завершён",
      cancelled: "Отменён",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Основная информация */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Основная информация</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Номер заказа:</span>
              <span className="font-mono">{order.order_no}</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-medium">Статус:</span>
              {getStatusBadge(order.status)}
            </div>

            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Создан:</span>
              <span>
                {format(new Date(order.created_at), "dd.MM.yyyy HH:mm", {
                  locale: ru,
                })}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {order.customer_name && (
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Клиент:</span>
                <span>{order.customer_name}</span>
              </div>
            )}

            {order.customer_email && (
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Email:</span>
                <span>{order.customer_email}</span>
              </div>
            )}

            {order.updated_at && (
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Обновлён:</span>
                <span>
                  {format(new Date(order.updated_at), "dd.MM.yyyy HH:mm", {
                    locale: ru,
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Примечания */}
      {order.notes && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Примечания</h3>
          <div className="flex items-start space-x-2">
            <FileText className="h-4 w-4 text-muted-foreground mt-1" />
            <div className="text-sm text-muted-foreground">{order.notes}</div>
          </div>
        </div>
      )}
    </div>
  );
}
