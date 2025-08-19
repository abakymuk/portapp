import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";
import { Package, Calendar, DollarSign, ShoppingCart } from "lucide-react";

interface OrderCardProps {
  order: any;
}

export function OrderCard({ order }: OrderCardProps) {
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

  const items = order.order_items || [];
  const totalItems = items.reduce(
    (sum: number, item: any) => sum + item.quantity,
    0
  );
  const totalValue = items.reduce(
    (sum: number, item: any) => sum + (item.total_price || 0),
    0
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">{order.order_no}</CardTitle>
          </div>
          {getStatusBadge(order.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Основная информация */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Создан:</span>
              <span>
                {format(new Date(order.created_at), "dd.MM.yyyy HH:mm", {
                  locale: ru,
                })}
              </span>
            </div>

            {order.customer_name && (
              <div className="flex items-center space-x-2 text-sm">
                <span className="font-medium">Клиент:</span>
                <span>{order.customer_name}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Товары:</span>
              <span>{totalItems} шт.</span>
            </div>

            <div className="flex items-center space-x-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Сумма:</span>
              <span>{totalValue.toLocaleString("ru-RU")} ₽</span>
            </div>
          </div>

          <div className="space-y-2">
            {order.notes && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Примечания:</span>
                <p className="truncate">{order.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Действия */}
        <div className="flex items-center space-x-2 pt-2 border-t">
          <Button asChild variant="outline" size="sm">
            <Link href={`/orders/${order.id}`}>Подробнее</Link>
          </Button>

          {order.status === "draft" && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/orders/${order.id}/edit`}>Редактировать</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
