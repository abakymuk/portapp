import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TestUsersPage() {
  const supabase = await createClient();

  // Получаем роли пользователей
  const { data: roles, error: rolesError } = await supabase
    .from("user_roles")
    .select("*")
    .order("name");

  // Получаем организации
  const { data: orgs, error: orgsError } = await supabase
    .from("orgs")
    .select("*")
    .order("name");

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Тест схемы пользователей
        </h1>
        <p className="text-muted-foreground">
          Проверка работы схемы пользователей и RLS политик
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Роли пользователей */}
        <Card>
          <CardHeader>
            <CardTitle>Роли пользователей</CardTitle>
          </CardHeader>
          <CardContent>
            {rolesError ? (
              <p className="text-red-600">
                Ошибка загрузки ролей: {rolesError.message}
              </p>
            ) : (
              <div className="space-y-2">
                {roles?.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div>
                      <p className="font-medium">{role.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {role.description}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(role.created_at).toLocaleDateString("ru-RU")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Организации */}
        <Card>
          <CardHeader>
            <CardTitle>Организации</CardTitle>
          </CardHeader>
          <CardContent>
            {orgsError ? (
              <p className="text-red-600">
                Ошибка загрузки организаций: {orgsError.message}
              </p>
            ) : (
              <div className="space-y-2">
                {orgs?.map((org) => (
                  <div
                    key={org.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div>
                      <p className="font-medium">{org.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ID: {org.id}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Информация о схеме */}
      <Card>
        <CardHeader>
          <CardTitle>Информация о схеме</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Созданные таблицы:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>
                  <code>user_profiles</code> - профили пользователей
                </li>
                <li>
                  <code>user_roles</code> - роли пользователей
                </li>
                <li>
                  <code>user_org_memberships</code> - членство в организациях
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Созданные функции:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>
                  <code>get_user_primary_org(user_uuid)</code> - основная
                  организация пользователя
                </li>
                <li>
                  <code>get_user_orgs(user_uuid)</code> - все организации
                  пользователя
                </li>
                <li>
                  <code>get_user_role_in_org(user_uuid, org_uuid)</code> - роль
                  в организации
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">RLS политики:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>
                  Пользователи могут просматривать и редактировать свой профиль
                </li>
                <li>Администраторы могут просматривать все профили</li>
                <li>
                  Пользователи могут просматривать свои членства в организациях
                </li>
                <li>
                  Администраторы организаций могут просматривать участников
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
