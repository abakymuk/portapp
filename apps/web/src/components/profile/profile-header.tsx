"use client";

import { useClerkUser } from "@/hooks/use-clerk-user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Building } from "lucide-react";

export function ProfileHeader() {
  const { user, profile } = useClerkUser();

  if (!user || !profile) {
    return null;
  }

  const initials =
    profile.first_name && profile.last_name
      ? `${profile.first_name[0]}${profile.last_name[0]}`
      : user.emailAddresses[0]?.emailAddress[0]?.toUpperCase() || "U";

  return (
    <div className="flex flex-col space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Профиль</h1>
        <p className="text-muted-foreground">
          Управление личной информацией и настройками
        </p>
      </div>

      <div className="flex items-center space-x-6">
        <Avatar className="h-20 w-20">
          <AvatarImage
            src={profile.avatar_url || undefined}
            alt={user.emailAddresses[0]?.emailAddress || ""}
          />
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {profile.first_name && profile.last_name
                ? `${profile.first_name} ${profile.last_name}`
                : "Имя не указано"}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {user.emailAddresses[0]?.emailAddress}
            </span>
          </div>

          {profile.phone && (
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{profile.phone}</span>
            </div>
          )}

          {profile.position && (
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{profile.position}</span>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Badge variant={profile.is_active ? "default" : "secondary"}>
              {profile.is_active ? "Активен" : "Неактивен"}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
