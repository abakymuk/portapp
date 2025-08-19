-- DB-005: Clerk Integration
-- Обновление схемы пользователей для интеграции с Clerk

-- 1. Сначала удаляем RLS политики, которые зависят от колонки id
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

-- 2. Удаляем внешний ключ на auth.users
ALTER TABLE user_profiles 
  DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

-- 3. Обновляем таблицу user_profiles для работы с Clerk
ALTER TABLE user_profiles 
  ALTER COLUMN id TYPE TEXT,
  ADD COLUMN IF NOT EXISTS clerk_user_id TEXT UNIQUE;

-- 4. Удаляем политики для user_org_memberships
DROP POLICY IF EXISTS "Users can view own memberships" ON user_org_memberships;
DROP POLICY IF EXISTS "Org admins can view org members" ON user_org_memberships;

-- 5. Удаляем внешний ключ для user_org_memberships
ALTER TABLE user_org_memberships 
  DROP CONSTRAINT IF EXISTS user_org_memberships_user_id_fkey;

-- 6. Обновляем таблицу user_org_memberships
ALTER TABLE user_org_memberships 
  ALTER COLUMN user_id TYPE TEXT;

-- 7. Обновляем функции для работы с TEXT вместо UUID
CREATE OR REPLACE FUNCTION get_user_primary_org(user_id TEXT)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT org_id 
    FROM user_org_memberships 
    WHERE user_id = user_id AND is_primary = true
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_orgs(user_id TEXT)
RETURNS TABLE(org_id UUID, org_name TEXT, role_name TEXT, is_primary BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uom.org_id,
    o.name as org_name,
    ur.name as role_name,
    uom.is_primary
  FROM user_org_memberships uom
  JOIN orgs o ON uom.org_id = o.id
  JOIN user_roles ur ON uom.role_id = ur.id
  WHERE uom.user_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_role_in_org(user_id TEXT, org_uuid UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT ur.name
    FROM user_org_memberships uom
    JOIN user_roles ur ON uom.role_id = ur.id
    WHERE uom.user_id = user_id AND uom.org_id = org_uuid
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Добавляем функции для синхронизации с Clerk
CREATE OR REPLACE FUNCTION sync_clerk_user_profile(
  clerk_user_id TEXT,
  first_name TEXT DEFAULT NULL,
  last_name TEXT DEFAULT NULL,
  avatar_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO user_profiles (id, clerk_user_id, first_name, last_name, avatar_url)
  VALUES (clerk_user_id, clerk_user_id, first_name, last_name, avatar_url)
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION delete_clerk_user_profile(clerk_user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM user_profiles WHERE id = clerk_user_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Создаем новые RLS политики (временно разрешаем всем)
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (true);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (true);

-- Политики для user_org_memberships (временно разрешаем всем)
CREATE POLICY "Users can view own memberships" ON user_org_memberships
  FOR SELECT USING (true);

CREATE POLICY "Org admins can view org members" ON user_org_memberships
  FOR SELECT USING (true);

-- TODO: Обновить политики после интеграции с Clerk middleware
