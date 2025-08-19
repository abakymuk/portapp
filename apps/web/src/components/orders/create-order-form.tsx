"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { createOrder } from "@/actions/orders";

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export function CreateOrderForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    notes: "",
  });
  const [items, setItems] = useState<OrderItem[]>([]);

  // Добавление товара
  const addItem = () => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      product_name: "",
      quantity: 1,
      unit_price: 0,
      total_price: 0,
    };
    setItems([...items, newItem]);
  };

  // Удаление товара
  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  // Обновление товара
  const updateItem = (id: string, field: keyof OrderItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          // Пересчёт общей стоимости
          if (field === "quantity" || field === "unit_price") {
            updatedItem.total_price =
              updatedItem.quantity * updatedItem.unit_price;
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  // Отправка формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      alert("Добавьте хотя бы один товар");
      return;
    }

    setLoading(true);

    try {
      const result = await createOrder({
        ...formData,
        items: items.map((item) => ({
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      });

      if (result.success && result.orderId) {
        router.push(`/orders/${result.orderId}`);
      } else {
        alert("Ошибка создания заказа: " + result.error);
      }
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Ошибка создания заказа");
    } finally {
      setLoading(false);
    }
  };

  const totalOrderValue = items.reduce(
    (sum, item) => sum + item.total_price,
    0
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Основная информация */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customer_name">Имя клиента *</Label>
          <Input
            id="customer_name"
            value={formData.customer_name}
            onChange={(e) =>
              setFormData({ ...formData, customer_name: e.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customer_email">Email клиента</Label>
          <Input
            id="customer_email"
            type="email"
            value={formData.customer_email}
            onChange={(e) =>
              setFormData({ ...formData, customer_email: e.target.value })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Примечания</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>

      {/* Товары */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Товары</CardTitle>
            <Button type="button" onClick={addItem} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Добавить товар
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Добавьте товары к заказу
            </p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-4 items-end"
                >
                  <div className="col-span-5">
                    <Label>Название товара *</Label>
                    <Input
                      value={item.product_name}
                      onChange={(e) =>
                        updateItem(item.id, "product_name", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Количество *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          "quantity",
                          parseInt(e.target.value) || 0
                        )
                      }
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Цена за ед. *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          "unit_price",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Сумма</Label>
                    <Input
                      value={item.total_price.toLocaleString("ru-RU") + " ₽"}
                      readOnly
                      className="bg-muted"
                    />
                  </div>

                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="flex justify-end pt-4 border-t">
                <div className="text-lg font-semibold">
                  Итого: {totalOrderValue.toLocaleString("ru-RU")} ₽
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Кнопки */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/orders")}
        >
          Отмена
        </Button>
        <Button type="submit" disabled={loading || items.length === 0}>
          {loading ? "Создание..." : "Создать заказ"}
        </Button>
      </div>
    </form>
  );
}
