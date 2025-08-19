import { createClient } from "@/lib/supabase/server";
import { OrderCard } from "@/components/orders/order-card";
import { Badge } from "@/components/ui/badge";
import { Package, AlertCircle } from "lucide-react";

interface OrdersListProps {
  searchParams: Record<string, string | undefined>;
}

export async function OrdersList({ searchParams }: OrdersListProps) {
  const supabase = await createClient();

  // Построение запроса с фильтрами
  let query = supabase
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
    .order("created_at", { ascending: false });

  // Применение фильтров
  if (searchParams.status && searchParams.status !== "all") {
    query = query.eq("status", searchParams.status);
  }

  if (searchParams.date_from) {
    query = query.gte("created_at", searchParams.date_from);
  }

  if (searchParams.date_to) {
    query = query.lte("created_at", searchParams.date_to);
  }

  if (searchParams.search) {
    query = query.ilike("order_no", `%${searchParams.search}%`);
  }

  // Пагинация
  const page = parseInt(searchParams.page || "1");
  const pageSize = 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: orders, error, count } = await query.range(from, to);

  if (error) {
    console.error("Error fetching orders:", error);
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-600">Ошибка загрузки заказов</p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">Заказы не найдены</p>
        <p className="text-sm text-muted-foreground mt-1">
          Попробуйте изменить фильтры или создать новый заказ
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Найдено {count || orders.length} заказов
        </p>
        <Badge variant="outline">{orders.length} на странице</Badge>
      </div>

      <div className="grid gap-4">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}
