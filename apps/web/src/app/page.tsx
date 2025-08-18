import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">PortOps MVP</h1>
          <p className="text-muted-foreground text-lg">
            Система управления портовыми операциями
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Next.js 15
                <Badge variant="secondary">v15.4.6</Badge>
              </CardTitle>
              <CardDescription>
                Современный React фреймворк с App Router
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Подробнее</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Tailwind CSS
                <Badge variant="outline">v4.1.12</Badge>
              </CardTitle>
              <CardDescription>Utility-first CSS фреймворк</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Настроить
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                shadcn/ui
                <Badge>Готово</Badge>
              </CardTitle>
              <CardDescription>
                Красивые и переиспользуемые компоненты
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full">
                Компоненты
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            ✅ Next.js 15 приложение успешно настроено с TypeScript, Tailwind
            CSS и shadcn/ui
          </p>
        </div>
      </div>
    </div>
  );
}
