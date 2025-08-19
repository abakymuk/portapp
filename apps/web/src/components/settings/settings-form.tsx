"use client";

import { useState } from "react";
import { useClerkUser } from "@/hooks/use-clerk-user";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { updateProfile } from "@/actions/profile";

export function SettingsForm() {
  const { profile } = useClerkUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    timezone: profile?.timezone || "UTC",
    language: profile?.language || "ru",
    theme: "system",
    notifications_enabled: true,
  });

  if (!profile) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await updateProfile({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        phone: profile.phone || "",
        position: profile.position || "",
        timezone: formData.timezone,
        language: formData.language,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess("Настройки успешно обновлены");
      }
    } catch (err) {
      setError("Произошла ошибка при обновлении настроек");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="timezone">Часовой пояс</Label>
          <select
            id="timezone"
            value={formData.timezone}
            onChange={(e) =>
              setFormData({ ...formData, timezone: e.target.value })
            }
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="UTC">UTC</option>
            <option value="Europe/Moscow">Москва (UTC+3)</option>
            <option value="Europe/London">Лондон (UTC+0)</option>
            <option value="America/New_York">Нью-Йорк (UTC-5)</option>
            <option value="Asia/Tokyo">Токио (UTC+9)</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="language">Язык</Label>
          <select
            id="language"
            value={formData.language}
            onChange={(e) =>
              setFormData({ ...formData, language: e.target.value })
            }
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="theme">Тема</Label>
        <select
          id="theme"
          value={formData.theme}
          onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="system">Системная</option>
          <option value="light">Светлая</option>
          <option value="dark">Темная</option>
        </select>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Сохранение...
          </>
        ) : (
          "Сохранить настройки"
        )}
      </Button>
    </form>
  );
}
