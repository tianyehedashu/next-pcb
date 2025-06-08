-- 启用 RLS
ALTER TABLE admin_orders ENABLE ROW LEVEL SECURITY;

-- 删除现有的策略
DROP POLICY IF EXISTS "Enable view access for admins" ON admin_orders;
DROP POLICY IF EXISTS "Enable update access for admins" ON admin_orders;
DROP POLICY IF EXISTS "Enable insert access for admins" ON admin_orders;
DROP POLICY IF EXISTS "Enable delete access for admins" ON admin_orders;

-- 创建统一的策略，允许管理员执行所有操作
CREATE POLICY "Enable all operations for admins" ON admin_orders
    FOR ALL
    TO authenticated
    USING (
        auth.role() = 'service_role' OR 
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    )
    WITH CHECK (
        auth.role() = 'service_role' OR 
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- 为 profiles 表启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 删除现有的 profiles 表策略
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- 创建字段级别的访问策略
-- 1. 允许用户查看自己的所有字段
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- 2. 允许用户更新自己的非敏感字段
CREATE POLICY "Users can update own non-sensitive fields"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND
        -- 不允许修改这些字段
        NEW.role = OLD.role AND
        NEW.id = OLD.id AND
        NEW.created_at = OLD.created_at
    );

-- 3. 允许用户插入自己的资料
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 4. 允许管理员管理所有用户资料
CREATE POLICY "Admins can manage all profiles"
    ON profiles FOR ALL
    USING (
        auth.role() = 'service_role' OR 
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- 创建函数来防止用户修改自己的角色
CREATE OR REPLACE FUNCTION prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
    -- 如果是 service_role，允许修改所有字段
    IF (auth.role() = 'service_role') THEN
        RETURN NEW;
    END IF;

    -- 如果用户尝试修改自己的角色，抛出错误
    IF (OLD.role IS DISTINCT FROM NEW.role) THEN
        RAISE EXCEPTION '不允许修改用户角色';
    END IF;

    -- 允许修改其他字段
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
DROP TRIGGER IF EXISTS prevent_role_change_trigger ON profiles;
CREATE TRIGGER prevent_role_change_trigger
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION prevent_role_change();