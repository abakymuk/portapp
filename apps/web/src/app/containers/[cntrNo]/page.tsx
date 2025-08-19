import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContainerDetails } from "@/components/containers/container-details";
import { ContainerEvents } from "@/components/containers/container-events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ContainerPageProps {
  params: {
    cntrNo: string;
  };
}

export default async function ContainerPage({ params }: ContainerPageProps) {
  const supabase = await createClient();

  // Получение данных контейнера
  const { data: container, error } = await supabase
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
    .eq("cntr_no", params.cntrNo)
    .single();

  if (error || !container) {
    console.error("Error fetching container:", error);
    notFound();
  }

  return (
    <div className="p-8 space-y-8">
      {/* Заголовок */}
      <div className="flex items-center space-x-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/containers">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к поиску
          </Link>
        </Button>
        <div className="flex items-center space-x-2">
          <Package className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {container.cntr_no}
            </h1>
            <p className="text-muted-foreground">
              Детальная информация о контейнере
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Информация о контейнере */}
        <Card>
          <CardHeader>
            <CardTitle>Информация о контейнере</CardTitle>
          </CardHeader>
          <CardContent>
            <ContainerDetails container={container} />
          </CardContent>
        </Card>

        {/* История событий */}
        <Card>
          <CardHeader>
            <CardTitle>История событий</CardTitle>
          </CardHeader>
          <CardContent>
            <ContainerEvents events={container.container_events || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
