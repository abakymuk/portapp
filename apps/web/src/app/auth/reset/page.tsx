import { ResetForm } from "@/components/auth/reset-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ResetPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/auth/login">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к входу
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Восстановление пароля</h1>
          <p className="text-muted-foreground">
            Введите ваш email для получения инструкций
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Восстановление пароля</CardTitle>
          </CardHeader>
          <CardContent>
            <ResetForm />
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Вспомнили пароль?{" "}
            <Link href="/auth/login" className="text-primary hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
