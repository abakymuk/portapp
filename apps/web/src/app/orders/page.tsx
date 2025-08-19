import { Suspense } from "react";
import { OrdersList } from "@/components/orders/orders-list";
import { OrdersFilters } from "@/components/orders/orders-filters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

interface SearchParams {
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: string;
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Заказы</h1>
          <p className="text-muted-foreground">
            Управление заказами и товарами
          </p>
        </div>
        <Button asChild>
          <Link href="/orders/new">
            <Plus className="h-4 w-4 mr-2" />
            Новый заказ
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Фильтры</CardTitle>
        </CardHeader>
        <CardContent>
          <OrdersFilters
            searchParams={searchParams as Record<string, string | undefined>}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Список заказов</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<OrdersListSkeleton />}>
            <OrdersList
              searchParams={searchParams as Record<string, string | undefined>}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

function OrdersListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="p-4 border rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-3 w-48 bg-muted animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
}
