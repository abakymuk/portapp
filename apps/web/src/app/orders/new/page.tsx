import { CreateOrderForm } from "@/components/orders/create-order-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewOrderPage() {
  return (
    <div className="p-8 space-y-8">
      {/* Заголовок */}
      <div className="flex items-center space-x-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/orders">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к заказам
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Новый заказ</h1>
          <p className="text-muted-foreground">
            Создание нового заказа с товарами
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Создание заказа</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateOrderForm />
        </CardContent>
      </Card>
    </div>
  );
}
