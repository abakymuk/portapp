import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TestClerkPage() {
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

  // Получаем профили пользователей (если есть)
  const { data: profiles, error: profilesError } = await supabase
    .from("user_profiles")
    .select("*")
    .order("created_at");

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Тест интеграции с Clerk
        </h1>
        <p className="text-muted-foreground">
          Проверка работы схемы пользователей с Clerk
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

      {/* Профили пользователей */}
      <Card>
        <CardHeader>
          <CardTitle>Профили пользователей (Clerk)</CardTitle>
        </CardHeader>
        <CardContent>
          {profilesError ? (
            <p className="text-red-600">
              Ошибка загрузки профилей: {profilesError.message}
            </p>
          ) : (
            <div className="space-y-2">
              {profiles && profiles.length > 0 ? (
                profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div>
                      <p className="font-medium">
                        {profile.first_name} {profile.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Clerk ID: {profile.clerk_user_id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Создан:{" "}
                        {new Date(profile.created_at).toLocaleDateString(
                          "ru-RU"
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {profile.is_active ? "Активен" : "Неактивен"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">
                  Профили пользователей не найдены. Зарегистрируйтесь через
                  Clerk для создания профиля.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Информация о схеме */}
      <Card>
        <CardHeader>
          <CardTitle>Информация о схеме</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Обновленные таблицы:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>
                  <code>user_profiles</code> - профили пользователей (TEXT ID
                  для Clerk)
                </li>
                <li>
                  <code>user_roles</code> - роли пользователей
                </li>
                <li>
                  <code>user_org_memberships</code> - членство в организациях
                  (TEXT user_id)
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Новые функции:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>
                  <code>sync_clerk_user_profile()</code> - синхронизация профиля
                  с Clerk
                </li>
                <li>
                  <code>delete_clerk_user_profile()</code> - удаление профиля
                  при удалении в Clerk
                </li>
                <li>
                  <code>get_user_primary_org(user_id TEXT)</code> - основная
                  организация
                </li>
                <li>
                  <code>get_user_orgs(user_id TEXT)</code> - все организации
                  пользователя
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Webhook интеграция:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>
                  <code>/api/webhooks/clerk</code> - endpoint для синхронизации
                </li>
                <li>Автоматическое создание профилей при регистрации</li>
                <li>Автоматическое обновление при изменении данных</li>
                <li>Автоматическое удаление при удалении пользователя</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">RLS политики:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Временно разрешены для всех пользователей</li>
                <li>Будет обновлено после интеграции с Clerk middleware</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
