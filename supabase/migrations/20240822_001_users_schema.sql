-- DB-005: Users Schema
-- Создание схемы пользователей платформы

-- 1. Профили пользователей (расширение auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  position TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'ru',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Роли пользователей
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Членство пользователей в организациях
CREATE TABLE IF NOT EXISTS user_org_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES user_roles(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, org_id)
);

-- 4. Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON user_profiles (is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_login ON user_profiles (last_login_at);
CREATE INDEX IF NOT EXISTS idx_user_org_memberships_user ON user_org_memberships (user_id);
CREATE INDEX IF NOT EXISTS idx_user_org_memberships_org ON user_org_memberships (org_id);
CREATE INDEX IF NOT EXISTS idx_user_org_memberships_primary ON user_org_memberships (user_id, is_primary);

-- 5. RLS политики
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_org_memberships ENABLE ROW LEVEL SECURITY;

-- Политики для user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_org_memberships uom
      JOIN user_roles ur ON uom.role_id = ur.id
      WHERE uom.user_id = auth.uid() AND ur.name = 'admin'
    )
  );

-- Политики для user_roles
CREATE POLICY "Everyone can view roles" ON user_roles
  FOR SELECT USING (true);

-- Политики для user_org_memberships
CREATE POLICY "Users can view own memberships" ON user_org_memberships
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Org admins can view org members" ON user_org_memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_org_memberships uom
      JOIN user_roles ur ON uom.role_id = ur.id
      WHERE uom.user_id = auth.uid() 
      AND uom.org_id = user_org_memberships.org_id 
      AND ur.name = 'admin'
    )
  );

-- 6. Функции для работы с пользователями
CREATE OR REPLACE FUNCTION get_user_primary_org(user_uuid UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT org_id 
    FROM user_org_memberships 
    WHERE user_id = user_uuid AND is_primary = true
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_orgs(user_uuid UUID)
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
  WHERE uom.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_role_in_org(user_uuid UUID, org_uuid UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT ur.name
    FROM user_org_memberships uom
    JOIN user_roles ur ON uom.role_id = ur.id
    WHERE uom.user_id = user_uuid AND uom.org_id = org_uuid
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- 8. Комментарии
COMMENT ON TABLE user_profiles IS 'Профили пользователей платформы';
COMMENT ON TABLE user_roles IS 'Роли пользователей';
COMMENT ON TABLE user_org_memberships IS 'Членство пользователей в организациях';
