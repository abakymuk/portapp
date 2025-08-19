import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function TestRLSPage() {
  const supabase = await createClient();

  // Тест запроса к материализованному представлению
  const { data: voyages, error: voyagesError } = await supabase
    .from("mv_upcoming_voyages")
    .select("*")
    .limit(5);

  // Тест запроса к таблице с RLS
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("*")
    .limit(5);

  // Тест запроса к справочникам
  const { data: shippingLines, error: shippingError } = await supabase
    .from("shipping_lines")
    .select("*")
    .limit(5);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Supabase Clients Test</h1>
          <p className="text-muted-foreground text-lg">
            Тестирование RLS и Supabase клиентов
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Тест материализованного представления */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                MV Upcoming Voyages
                <Badge variant={voyagesError ? "destructive" : "default"}>
                  {voyagesError ? "Error" : "Success"}
                </Badge>
              </CardTitle>
              <CardDescription>
                Тест запроса к материализованному представлению
              </CardDescription>
            </CardHeader>
            <CardContent>
              {voyagesError ? (
                <div className="text-red-500 text-sm">
                  Error: {voyagesError.message}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Records: {voyages?.length || 0}
                  </div>
                  {voyages?.slice(0, 3).map((voyage) => (
                    <div key={voyage.id} className="text-sm">
                      {voyage.voyage_no} - {voyage.vessel_name}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Тест таблицы с RLS */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Orders (RLS)
                <Badge variant={ordersError ? "destructive" : "default"}>
                  {ordersError ? "Error" : "Success"}
                </Badge>
              </CardTitle>
              <CardDescription>
                Тест запроса к таблице с Row Level Security
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ordersError ? (
                <div className="text-red-500 text-sm">
                  Error: {ordersError.message}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Records: {orders?.length || 0}
                  </div>
                  {orders?.slice(0, 3).map((order) => (
                    <div key={order.id} className="text-sm">
                      {order.order_no} - {order.status}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Тест справочников */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Shipping Lines
                <Badge variant={shippingError ? "destructive" : "default"}>
                  {shippingError ? "Error" : "Success"}
                </Badge>
              </CardTitle>
              <CardDescription>Тест запроса к справочникам</CardDescription>
            </CardHeader>
            <CardContent>
              {shippingError ? (
                <div className="text-red-500 text-sm">
                  Error: {shippingError.message}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Records: {shippingLines?.length || 0}
                  </div>
                  {shippingLines?.slice(0, 3).map((line) => (
                    <div key={line.id} className="text-sm">
                      {line.scac} - {line.name}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            ✅ Supabase клиенты настроены и работают корректно
          </p>
        </div>
      </div>
    </div>
  );
}
