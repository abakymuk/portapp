import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrderDetails } from "@/components/orders/order-details";
import { OrderItems } from "@/components/orders/order-items";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface OrderPageProps {
  params: {
    orderId: string;
  };
}

export default async function OrderPage({ params }: OrderPageProps) {
  const supabase = await createClient();

  // Получение данных заказа
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      order_items (
        id,
        product_name,
        quantity,
        unit_price,
        total_price
      )
    `
    )
    .eq("id", params.orderId)
    .single();

  if (error || !order) {
    console.error("Error fetching order:", error);
    notFound();
  }

  return (
    <div className="p-8 space-y-8">
      {/* Заголовок */}
      <div className="flex items-center space-x-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/orders">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к заказам
          </Link>
        </Button>
        <div className="flex items-center space-x-2">
          <Package className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {order.order_no}
            </h1>
            <p className="text-muted-foreground">
              Детальная информация о заказе
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Информация о заказе */}
        <Card>
          <CardHeader>
            <CardTitle>Информация о заказе</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderDetails order={order} />
          </CardContent>
        </Card>

        {/* Товары заказа */}
        <Card>
          <CardHeader>
            <CardTitle>Товары заказа</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderItems items={order.order_items || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
