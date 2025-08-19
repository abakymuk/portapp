import { Suspense } from "react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { UpcomingTable } from "@/components/dashboard/upcoming-table";
import { DwellChart } from "@/components/dashboard/dwell-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Компонент заголовка
function DashboardHeader() {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            PortOps Dashboard
          </h1>
          <p className="text-muted-foreground">
            Мониторинг рейсов и контейнеров в порту
          </p>
        </div>
        <div className="flex space-x-2">
          <Button asChild variant="outline">
            <Link href="/arrivals">Все рейсы</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/containers">Поиск контейнеров</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/orders">Заказы</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// Компонент KPI секции
function KPISection() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Suspense fallback={<KPISkeleton />}>
        <KPICard
          title="Рейсы сегодня"
          metric="today_voyages"
          description="Количество рейсов сегодня"
        />
      </Suspense>

      <Suspense fallback={<KPISkeleton />}>
        <KPICard
          title="Доступные контейнеры"
          metric="available_containers"
          description="Контейнеры готовые к вывозу"
        />
      </Suspense>

      <Suspense fallback={<KPISkeleton />}>
        <KPICard
          title="Средний dwell"
          metric="avg_dwell"
          description="Среднее время простоя (часы)"
        />
      </Suspense>

      <Suspense fallback={<KPISkeleton />}>
        <KPICard
          title="Активные заказы"
          metric="active_orders"
          description="Заказы в работе"
        />
      </Suspense>
    </div>
  );
}

// Компонент таблицы рейсов
function VoyagesCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ближайшие рейсы</CardTitle>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<TableSkeleton />}>
          <UpcomingTable />
        </Suspense>
      </CardContent>
    </Card>
  );
}

// Компонент графика
function DwellCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dwell Time Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<ChartSkeleton />}>
          <DwellChart />
        </Suspense>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <DashboardHeader />
      <KPISection />

      <div className="grid gap-8 md:grid-cols-2">
        <VoyagesCard />
        <DwellCard />
      </div>
    </div>
  );
}

function KPISkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return <Skeleton className="h-64 w-full" />;
}
