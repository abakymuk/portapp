import { Suspense } from "react";
import { ContainerSearch } from "@/components/containers/container-search";
import { ContainerResults } from "@/components/containers/container-results";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SearchParams {
  q?: string;
}

export default async function ContainersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Поиск контейнеров</h1>
        <p className="text-muted-foreground">
          Поиск по номеру контейнера или BOL
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Поиск</CardTitle>
        </CardHeader>
        <CardContent>
          <ContainerSearch initialQuery={searchParams.q} />
        </CardContent>
      </Card>

      {searchParams.q && (
        <Card>
          <CardHeader>
            <CardTitle>Результаты поиска</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ContainerResultsSkeleton />}>
              <ContainerResults query={searchParams.q} />
            </Suspense>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ContainerResultsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-4 border rounded-lg space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}
