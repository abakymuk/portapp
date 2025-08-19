import { createClient } from "@/lib/supabase/server";
import { ContainerCard } from "@/components/containers/container-card";
import { Badge } from "@/components/ui/badge";
import { Package, AlertCircle } from "lucide-react";

interface ContainerResultsProps {
  query: string;
}

export async function ContainerResults({ query }: ContainerResultsProps) {
  const supabase = await createClient();

  // Поиск контейнеров
  const { data: containers, error } = await supabase
    .from("containers")
    .select(
      `
      *,
      voyages (
        id,
        vessel_name,
        voyage_no,
        eta,
        etd,
        status
      ),
      container_events (
        event_type,
        event_time,
        payload
      )
    `
    )
    .or(`cntr_no.ilike.%${query}%,bill_of_lading.ilike.%${query}%`)
    .order("last_status_time", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error searching containers:", error);
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-600">Ошибка поиска</p>
      </div>
    );
  }

  if (!containers || containers.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">Контейнеры не найдены</p>
        <p className="text-sm text-muted-foreground mt-1">
          Попробуйте другой номер контейнера или BOL
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Найдено {containers.length} контейнеров
        </p>
        <Badge variant="outline">{containers.length} результатов</Badge>
      </div>

      <div className="grid gap-4">
        {containers.map((container) => (
          <ContainerCard key={container.id} container={container} />
        ))}
      </div>
    </div>
  );
}
