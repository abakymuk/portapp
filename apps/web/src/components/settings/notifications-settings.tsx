"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Bell, Mail, MessageSquare } from "lucide-react";

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  voyage_updates: boolean;
  container_status: boolean;
  order_updates: boolean;
  system_notifications: boolean;
}

export function NotificationsSettings() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [settings, setSettings] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: true,
    voyage_updates: true,
    container_status: true,
    order_updates: true,
    system_notifications: false,
  });

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // TODO: Реализовать сохранение настроек уведомлений
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Имитация API
      setSuccess("Настройки уведомлений сохранены");
    } catch (err) {
      setError("Ошибка при сохранении настроек");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Email уведомления</Label>
            <p className="text-sm text-muted-foreground">
              Получать уведомления на email
            </p>
          </div>
          <Switch
            checked={settings.email_notifications}
            onCheckedChange={() => handleToggle("email_notifications")}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Push уведомления</Label>
            <p className="text-sm text-muted-foreground">
              Получать push уведомления в браузере
            </p>
          </div>
          <Switch
            checked={settings.push_notifications}
            onCheckedChange={() => handleToggle("push_notifications")}
          />
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Типы уведомлений</h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm">Обновления рейсов</Label>
              </div>
              <Switch
                checked={settings.voyage_updates}
                onCheckedChange={() => handleToggle("voyage_updates")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm">Статус контейнеров</Label>
              </div>
              <Switch
                checked={settings.container_status}
                onCheckedChange={() => handleToggle("container_status")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm">Обновления заказов</Label>
              </div>
              <Switch
                checked={settings.order_updates}
                onCheckedChange={() => handleToggle("order_updates")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm">Системные уведомления</Label>
              </div>
              <Switch
                checked={settings.system_notifications}
                onCheckedChange={() => handleToggle("system_notifications")}
              />
            </div>
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Сохранение...
          </>
        ) : (
          "Сохранить настройки"
        )}
      </Button>
    </div>
  );
}
