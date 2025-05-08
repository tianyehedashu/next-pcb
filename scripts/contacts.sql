CREATE TABLE contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX contacts_email_idx ON contacts(email);
CREATE INDEX contacts_created_at_idx ON contacts(created_at);

-- 添加 RLS 策略
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- 创建策略：只允许管理员查看所有记录
CREATE POLICY "Allow admins to view all contacts" 
ON contacts FOR SELECT 
TO authenticated 
USING (auth.role() = 'admin');

-- 创建策略：允许任何人创建记录
CREATE POLICY "Allow anyone to create contacts" 
ON contacts FOR INSERT 
TO public 
WITH CHECK (true);

-- 创建策略：只允许管理员更新记录
CREATE POLICY "Allow admins to update contacts" 
ON contacts FOR UPDATE 
TO authenticated 
USING (auth.role() = 'admin');

-- 创建策略：只允许管理员删除记录
CREATE POLICY "Allow admins to delete contacts" 
ON contacts FOR DELETE 
TO authenticated 
USING (auth.role() = 'admin');