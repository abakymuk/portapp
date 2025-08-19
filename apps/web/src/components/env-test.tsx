"use client";

import { clientEnv } from "@/lib/env";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function EnvTest() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Environment Variables Test
          <Badge variant="outline">Client-side</Badge>
        </CardTitle>
        <CardDescription>
          Проверка доступности переменных окружения
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="font-medium">SUPABASE_URL:</span>
            <span className="text-muted-foreground">
              {clientEnv.SUPABASE_URL ? "✅ Available" : "❌ Missing"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">SUPABASE_ANON_KEY:</span>
            <span className="text-muted-foreground">
              {clientEnv.SUPABASE_ANON_KEY ? "✅ Available" : "❌ Missing"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">DEFAULT_TZ:</span>
            <span className="text-muted-foreground">
              {clientEnv.DEFAULT_TZ}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">NODE_ENV:</span>
            <span className="text-muted-foreground">{clientEnv.NODE_ENV}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">SERVICE_ROLE_KEY:</span>
            <span className="text-muted-foreground">
              {process.env.SUPABASE_SERVICE_ROLE_KEY
                ? "⚠️ Exposed (Security Risk!)"
                : "✅ Secure"}
            </span>
          </div>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            <strong>Security Check:</strong> SERVICE_ROLE_KEY не должен быть
            доступен на клиенте. Если он доступен, это означает проблему с
            безопасностью.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
