-- 游客报价表
CREATE TABLE IF NOT EXISTS guest_quotes (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  pcb_spec JSONB NOT NULL,
  shipping_address JSONB,
  status VARCHAR(50) DEFAULT 'pending',
  admin_quote_price DECIMAL(10,2),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_guest_quotes_email ON guest_quotes(email);
CREATE INDEX IF NOT EXISTS idx_guest_quotes_status ON guest_quotes(status);
CREATE INDEX IF NOT EXISTS idx_guest_quotes_created_at ON guest_quotes(created_at);

-- 添加更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_guest_quotes_updated_at 
    BEFORE UPDATE ON guest_quotes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 