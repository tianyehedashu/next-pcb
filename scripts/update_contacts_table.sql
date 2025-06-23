-- 更新 contacts 表，添加 company 和 project_type 字段
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS project_type TEXT;

-- 添加索引来提高查询性能
CREATE INDEX IF NOT EXISTS contacts_company_idx ON contacts(company);
CREATE INDEX IF NOT EXISTS contacts_project_type_idx ON contacts(project_type);

-- 添加注释
COMMENT ON COLUMN contacts.company IS 'Customer company name';
COMMENT ON COLUMN contacts.project_type IS 'Type of PCB project: prototype, small-batch, medium-batch, mass-production, pcb-assembly, design-service, other';

-- 确保表格权限正确
GRANT SELECT, INSERT ON contacts TO anon;
GRANT ALL PRIVILEGES ON contacts TO service_role; 