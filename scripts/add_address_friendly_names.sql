-- 为 user_addresses 表添加友好名称字段
-- 这个脚本用于更新现有的数据库结构

-- 添加友好名称字段
ALTER TABLE public.user_addresses 
ADD COLUMN IF NOT EXISTS country_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS state_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS city_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS courier_name VARCHAR(100);

-- 添加注释说明字段用途
COMMENT ON COLUMN public.user_addresses.country_name IS '国家友好名称，如 "United States"';
COMMENT ON COLUMN public.user_addresses.state_name IS '州/省友好名称，如 "California"';
COMMENT ON COLUMN public.user_addresses.city_name IS '城市友好名称，如 "Los Angeles"';
COMMENT ON COLUMN public.user_addresses.courier_name IS '快递公司友好名称，如 "DHL"';

-- 为现有数据填充一些常见的友好名称（可选）
-- 国家映射
UPDATE public.user_addresses 
SET country_name = CASE 
  WHEN country = 'US' THEN 'United States'
  WHEN country = 'CN' THEN 'China'
  WHEN country = 'CA' THEN 'Canada'
  WHEN country = 'GB' THEN 'United Kingdom'
  WHEN country = 'DE' THEN 'Germany'
  WHEN country = 'FR' THEN 'France'
  WHEN country = 'JP' THEN 'Japan'
  WHEN country = 'AU' THEN 'Australia'
  WHEN country = 'SG' THEN 'Singapore'
  WHEN country = 'KR' THEN 'South Korea'
  WHEN country = 'IN' THEN 'India'
  WHEN country = 'BR' THEN 'Brazil'
  WHEN country = 'MX' THEN 'Mexico'
  WHEN country = 'IT' THEN 'Italy'
  WHEN country = 'ES' THEN 'Spain'
  WHEN country = 'NL' THEN 'Netherlands'
  WHEN country = 'SE' THEN 'Sweden'
  WHEN country = 'NO' THEN 'Norway'
  WHEN country = 'DK' THEN 'Denmark'
  WHEN country = 'FI' THEN 'Finland'
  ELSE country
END
WHERE country_name IS NULL OR country_name = '';

-- 快递公司映射
UPDATE public.user_addresses 
SET courier_name = CASE 
  WHEN courier = 'dhl' THEN 'DHL'
  WHEN courier = 'fedex' THEN 'FedEx'
  WHEN courier = 'ups' THEN 'UPS'
  WHEN courier = 'tnt' THEN 'TNT'
  WHEN courier = 'ems' THEN 'EMS'
  ELSE courier
END
WHERE courier_name IS NULL OR courier_name = '';

-- 创建索引以提高查询性能（可选）
CREATE INDEX IF NOT EXISTS idx_user_addresses_country_name ON public.user_addresses(country_name);
CREATE INDEX IF NOT EXISTS idx_user_addresses_state_name ON public.user_addresses(state_name);
CREATE INDEX IF NOT EXISTS idx_user_addresses_city_name ON public.user_addresses(city_name); 