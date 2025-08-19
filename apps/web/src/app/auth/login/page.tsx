import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Вход в систему</h1>
          <p className="text-muted-foreground">
            Войдите в свой аккаунт для доступа к PortOps
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Вход</CardTitle>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Нет аккаунта?{" "}
            <Link
              href="/auth/register"
              className="text-primary hover:underline"
            >
              Зарегистрироваться
            </Link>
          </p>
          <p className="text-sm text-muted-foreground">
            <Link href="/auth/reset" className="text-primary hover:underline">
              Забыли пароль?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
