import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, DollarSign } from "lucide-react";

interface OrderItemsProps {
  items: any[];
}

export function OrderItems({ items }: OrderItemsProps) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="h-8 w-8 mx-auto mb-2" />
        <p>Товары не найдены</p>
      </div>
    );
  }

  const totalValue = items.reduce(
    (sum, item) => sum + (item.total_price || 0),
    0
  );
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Товары заказа</h3>
        <Badge variant="outline">{items.length} товаров</Badge>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Товар</TableHead>
            <TableHead className="text-right">Количество</TableHead>
            <TableHead className="text-right">Цена за ед.</TableHead>
            <TableHead className="text-right">Сумма</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{item.product_name}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">{item.quantity} шт.</TableCell>
              <TableCell className="text-right">
                {item.unit_price?.toLocaleString("ru-RU")} ₽
              </TableCell>
              <TableCell className="text-right font-medium">
                {item.total_price?.toLocaleString("ru-RU")} ₽
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Итого */}
      <div className="flex justify-end pt-4 border-t">
        <div className="space-y-2 text-right">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>Всего товаров: {totalItems} шт.</span>
          </div>
          <div className="flex items-center space-x-2 text-lg font-semibold">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span>Итого: {totalValue.toLocaleString("ru-RU")} ₽</span>
          </div>
        </div>
      </div>
    </div>
  );
}
