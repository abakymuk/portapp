"use client";

import { useState, useEffect } from "react";
import { useClerkUser } from "@/hooks/use-clerk-user";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Building, Check, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

interface Organization {
  org_id: string;
  org_name: string;
  role_name: string;
  is_primary: boolean;
}

export function OrganizationsList() {
  const { user } = useClerkUser();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);

  useEffect(() => {
    const loadOrganizations = async () => {
      if (!user) return;

      try {
        const supabase = createClient();
        const { data } = await supabase.rpc("get_user_orgs", {
          user_id: user.id,
        });
        setOrganizations(data || []);
      } catch (error) {
        console.error("Error loading organizations:", error);
      } finally {
        setLoading(false);
      }
    };

    loadOrganizations();
  }, [user]);

  const handleSwitchOrg = async (orgId: string) => {
    setSwitching(orgId);
    try {
      // TODO: Реализовать переключение организации
      console.log("Switch to org:", orgId);
    } catch (error) {
      console.error("Error switching organization:", error);
    } finally {
      setSwitching(null);
    }
  };

  if (loading) {
    return <div>Загрузка организаций...</div>;
  }

  if (organizations.length === 0) {
    return (
      <div className="text-center py-8">
        <Building className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">Нет организаций</p>
        <Button variant="outline" size="sm" className="mt-2">
          <Plus className="h-4 w-4 mr-2" />
          Присоединиться к организации
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {organizations.map((org) => (
        <div
          key={org.org_id}
          className="flex items-center justify-between p-4 border rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                <Building className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{org.org_name}</p>
              <p className="text-sm text-muted-foreground">{org.role_name}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {org.is_primary && (
              <Badge variant="default">
                <Check className="h-3 w-3 mr-1" />
                Основная
              </Badge>
            )}

            {!org.is_primary && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSwitchOrg(org.org_id)}
                disabled={switching === org.org_id}
              >
                {switching === org.org_id ? "Переключение..." : "Переключиться"}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
