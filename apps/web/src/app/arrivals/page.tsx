import { Suspense } from "react";
import { ArrivalsList } from "@/components/arrivals/arrivals-list";
import { ArrivalsFilters } from "@/components/arrivals/arrivals-filters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SearchParams {
  date_from?: string;
  date_to?: string;
  terminal?: string;
  line?: string;
  search?: string;
  page?: string;
}

export default async function ArrivalsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Рейсы</h1>
        <p className="text-muted-foreground">
          Список всех рейсов с фильтрацией и поиском
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Фильтры</CardTitle>
        </CardHeader>
        <CardContent>
          <ArrivalsFilters
            searchParams={searchParams as { [key: string]: string | undefined }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Список рейсов</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<ArrivalsListSkeleton />}>
            <ArrivalsList
              searchParams={
                searchParams as { [key: string]: string | undefined }
              }
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

function ArrivalsListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center space-x-4 p-4 border rounded-lg"
        >
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
