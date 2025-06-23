-- 确保 contacts 表存在并包含所有必要字段
-- 如果表不存在，创建它；如果存在，添加缺失的字段

-- 创建表（如果不存在）
CREATE TABLE IF NOT EXISTS contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    project_type TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 添加缺失的字段（如果表已存在但缺少字段）
DO $$ 
BEGIN
    -- 添加 company 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contacts' AND column_name = 'company') THEN
        ALTER TABLE contacts ADD COLUMN company TEXT;
    END IF;
    
    -- 添加 project_type 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contacts' AND column_name = 'project_type') THEN
        ALTER TABLE contacts ADD COLUMN project_type TEXT;
    END IF;
END $$;

-- 创建索引
CREATE INDEX IF NOT EXISTS contacts_email_idx ON contacts(email);
CREATE INDEX IF NOT EXISTS contacts_created_at_idx ON contacts(created_at);
CREATE INDEX IF NOT EXISTS contacts_company_idx ON contacts(company);
CREATE INDEX IF NOT EXISTS contacts_project_type_idx ON contacts(project_type);

-- 启用 RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- 删除现有策略（如果存在）
DROP POLICY IF EXISTS "Allow admins to view all contacts" ON contacts;
DROP POLICY IF EXISTS "Allow anyone to create contacts" ON contacts;
DROP POLICY IF EXISTS "Allow admins to update contacts" ON contacts;
DROP POLICY IF EXISTS "Allow admins to delete contacts" ON contacts;

-- 创建策略：只允许管理员查看所有记录
CREATE POLICY "Allow admins to view all contacts" 
ON contacts FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- 创建策略：允许任何人（包括匿名用户）创建记录
CREATE POLICY "Allow anyone to create contacts" 
ON contacts FOR INSERT 
TO public 
WITH CHECK (true);

-- 创建策略：只允许管理员更新记录
CREATE POLICY "Allow admins to update contacts" 
ON contacts FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- 创建策略：只允许管理员删除记录
CREATE POLICY "Allow admins to delete contacts" 
ON contacts FOR DELETE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- 确保权限正确设置
GRANT SELECT, INSERT ON contacts TO anon;
GRANT SELECT, INSERT ON contacts TO authenticated;
GRANT ALL PRIVILEGES ON contacts TO service_role;

-- 添加列注释
COMMENT ON TABLE contacts IS 'Customer contact form submissions';
COMMENT ON COLUMN contacts.name IS 'Customer name';
COMMENT ON COLUMN contacts.email IS 'Customer email address';
COMMENT ON COLUMN contacts.phone IS 'Customer phone number (optional)';
COMMENT ON COLUMN contacts.company IS 'Customer company name (optional)';
COMMENT ON COLUMN contacts.project_type IS 'Type of PCB project: prototype, small-batch, medium-batch, mass-production, pcb-assembly, design-service, other';
COMMENT ON COLUMN contacts.message IS 'Customer message/inquiry';
COMMENT ON COLUMN contacts.created_at IS 'Timestamp when the contact form was submitted';
COMMENT ON COLUMN contacts.updated_at IS 'Timestamp when the record was last updated';

-- 创建触发器来自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 删除现有触发器（如果存在）
DROP TRIGGER IF EXISTS update_contacts_updated_at_trigger ON contacts;

-- 创建触发器
CREATE TRIGGER update_contacts_updated_at_trigger
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_contacts_updated_at(); 