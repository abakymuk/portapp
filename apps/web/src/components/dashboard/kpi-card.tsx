import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
  title: string;
  metric: string;
  description: string;
}

export async function KPICard({ title, metric, description }: KPICardProps) {
  const supabase = await createClient();

  let value: string | number = "0";
  let trend = "neutral" as "up" | "down" | "neutral";
  let trendValue = 0;

  try {
    switch (metric) {
      case "today_voyages":
        const { count: voyagesCount } = await supabase
          .from("mv_upcoming_voyages")
          .select("*", { count: "exact", head: true })
          .gte("eta", new Date().toISOString().split("T")[0])
          .lt(
            "eta",
            new Date(Date.now() + 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0]
          );

        value = voyagesCount?.toString() || "0";
        break;

      case "available_containers":
        const { count: containersCount } = await supabase
          .from("containers")
          .select("*", { count: "exact", head: true })
          .eq("last_known_status", "available");

        value = containersCount?.toString() || "0";
        break;

      case "avg_dwell":
        const { data: dwellData } = await supabase
          .from("mv_dwell")
          .select("dwell_hours")
          .not("dwell_hours", "is", null)
          .limit(100);

        if (dwellData && dwellData.length > 0) {
          const avgDwell =
            dwellData.reduce((sum, item) => sum + (item.dwell_hours || 0), 0) /
            dwellData.length;
          value = avgDwell.toFixed(1);
        }
        break;

      case "active_orders":
        const { count: ordersCount } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .in("status", ["submitted", "in_process"]);

        value = ordersCount?.toString() || "0";
        break;
    }
  } catch (error) {
    console.error("Error fetching KPI data:", error);
  }

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case "neutral":
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {getTrendIcon()}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend !== "neutral" && (
          <p className="text-xs text-muted-foreground mt-1">
            {trend === "up" ? "+" : "-"}
            {trendValue}% с прошлой недели
          </p>
        )}
      </CardContent>
    </Card>
  );
}
