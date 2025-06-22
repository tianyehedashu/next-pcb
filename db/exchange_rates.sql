-- 汇率设置表
CREATE TABLE IF NOT EXISTS exchange_rates (
  id SERIAL PRIMARY KEY,
  base_currency VARCHAR(3) NOT NULL DEFAULT 'CNY', -- 基础货币，默认人民币
  target_currency VARCHAR(3) NOT NULL, -- 目标货币
  rate DECIMAL(10, 6) NOT NULL, -- 汇率，支持6位小数
  source VARCHAR(50), -- 汇率来源 (manual, api_fixer, api_exchangerate, etc.)
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- 确保同一基础货币和目标货币组合的唯一性
  UNIQUE(base_currency, target_currency)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currencies ON exchange_rates(base_currency, target_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_active ON exchange_rates(is_active);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_updated ON exchange_rates(last_updated);

-- 插入基础汇率数据
INSERT INTO exchange_rates (base_currency, target_currency, rate, source, is_active) VALUES
-- 美元相关
('USD', 'CNY', 7.200000, 'manual', true),
('USD', 'EUR', 0.850000, 'manual', true),
('USD', 'GBP', 0.750000, 'manual', true),
('USD', 'JPY', 110.000000, 'manual', true),
('USD', 'HKD', 7.800000, 'manual', true),

-- 人民币相关
('CNY', 'USD', 0.138889, 'manual', true),
('CNY', 'EUR', 0.118056, 'manual', true),
('CNY', 'GBP', 0.104167, 'manual', true),
('CNY', 'JPY', 15.277778, 'manual', true),
('CNY', 'HKD', 1.083333, 'manual', true),

-- 欧元相关
('EUR', 'USD', 1.176471, 'manual', true),
('EUR', 'CNY', 8.470588, 'manual', true),
('EUR', 'GBP', 0.882353, 'manual', true),
('EUR', 'JPY', 129.411765, 'manual', true),
('EUR', 'HKD', 9.176471, 'manual', true)

ON CONFLICT (base_currency, target_currency) DO UPDATE SET
  rate = EXCLUDED.rate,
  source = EXCLUDED.source,
  is_active = EXCLUDED.is_active,
  last_updated = NOW();

-- 汇率历史记录表（可选，用于跟踪汇率变化）
CREATE TABLE IF NOT EXISTS exchange_rate_history (
  id SERIAL PRIMARY KEY,
  base_currency VARCHAR(3) NOT NULL,
  target_currency VARCHAR(3) NOT NULL,
  old_rate DECIMAL(10, 6),
  new_rate DECIMAL(10, 6) NOT NULL,
  source VARCHAR(50),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  changed_by UUID REFERENCES auth.users(id),
  reason TEXT -- 变更原因
);

-- 创建历史记录索引
CREATE INDEX IF NOT EXISTS idx_exchange_rate_history_currencies ON exchange_rate_history(base_currency, target_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rate_history_date ON exchange_rate_history(changed_at);

-- RLS 策略 (Row Level Security)
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rate_history ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "Admin can manage exchange rates" ON exchange_rates;
DROP POLICY IF EXISTS "Users can view active exchange rates" ON exchange_rates;
DROP POLICY IF EXISTS "Anonymous can view active exchange rates" ON exchange_rates;
DROP POLICY IF EXISTS "Everyone can view all exchange rates" ON exchange_rates;
DROP POLICY IF EXISTS "Admin can view exchange rate history" ON exchange_rate_history;
DROP POLICY IF EXISTS "System can insert exchange rate history" ON exchange_rate_history;

-- 管理员可以查看和修改所有汇率
CREATE POLICY "Admin can manage exchange rates" ON exchange_rates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 所有人（包括匿名用户）都可以查看所有汇率（用于报价功能）
CREATE POLICY "Everyone can view all exchange rates" ON exchange_rates
  FOR SELECT USING (true);

-- 管理员可以查看和管理汇率历史
CREATE POLICY "Admin can view exchange rate history" ON exchange_rate_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 系统触发器可以插入汇率历史记录
CREATE POLICY "System can insert exchange rate history" ON exchange_rate_history
  FOR INSERT WITH CHECK (true);

-- 创建触发器函数（如果不存在）
CREATE OR REPLACE FUNCTION update_exchange_rates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_exchange_rate_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- 只在汇率实际发生变化时记录
  IF OLD.rate != NEW.rate THEN
    INSERT INTO exchange_rate_history (
      base_currency, 
      target_currency, 
      old_rate, 
      new_rate, 
      source, 
      changed_by,
      reason
    ) VALUES (
      NEW.base_currency,
      NEW.target_currency,
      OLD.rate,
      NEW.rate,
      NEW.source,
      auth.uid(),
      CASE 
        WHEN NEW.source != OLD.source THEN 'Source changed from ' || OLD.source || ' to ' || NEW.source
        ELSE 'Rate updated'
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 删除可能存在的旧触发器
DROP TRIGGER IF EXISTS update_exchange_rates_updated_at ON exchange_rates;
DROP TRIGGER IF EXISTS log_exchange_rate_changes ON exchange_rates;

-- 创建触发器
CREATE TRIGGER update_exchange_rates_updated_at
  BEFORE UPDATE ON exchange_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_exchange_rates_updated_at();

CREATE TRIGGER log_exchange_rate_changes
  AFTER UPDATE ON exchange_rates
  FOR EACH ROW
  EXECUTE FUNCTION log_exchange_rate_changes(); 