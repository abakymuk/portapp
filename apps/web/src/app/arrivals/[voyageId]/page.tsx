import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VoyageDetails } from "@/components/arrivals/voyage-details";
import { ContainersList } from "@/components/arrivals/containers-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface VoyagePageProps {
  params: {
    voyageId: string;
  };
}

export default async function VoyagePage({ params }: VoyagePageProps) {
  const supabase = await createClient();

  // Получение данных рейса
  const { data: voyage, error } = await supabase
    .from("mv_upcoming_voyages")
    .select("*")
    .eq("id", params.voyageId)
    .single();

  if (error || !voyage) {
    console.error("Error fetching voyage:", error);
    notFound();
  }

  // Получение контейнеров рейса
  const { data: containers, error: containersError } = await supabase
    .from("containers")
    .select(
      `
      *,
      container_events (
        event_type,
        event_time,
        payload
      )
    `
    )
    .eq("voyage_id", params.voyageId)
    .order("cntr_no");

  if (containersError) {
    console.error("Error fetching containers:", containersError);
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Заголовок */}
      <div className="flex items-center space-x-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/arrivals">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к списку
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {voyage.vessel_name}
          </h1>
          <p className="text-muted-foreground">Рейс {voyage.voyage_no}</p>
        </div>
      </div>

      {/* Информация о рейсе */}
      <VoyageDetails voyage={voyage} />

      {/* Контейнеры */}
      <Card>
        <CardHeader>
          <CardTitle>Контейнеры рейса ({containers?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <ContainersList containers={containers || []} />
        </CardContent>
      </Card>
    </div>
  );
}
