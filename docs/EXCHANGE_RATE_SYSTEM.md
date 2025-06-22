# 汇率管理系统

## 概述

本系统提供了完整的汇率管理功能，包括数据存储、外部API同步、管理界面和统一的汇率服务。全项目统一使用此系统获取汇率数据。

## 系统架构

### 1. 数据层
- **exchange_rates 表**: 存储汇率数据
- **exchange_rate_history 表**: 记录汇率变更历史
- **RLS 策略**: 确保数据安全访问

### 2. 服务层
- **外部汇率API服务** (`lib/services/external-exchange-rate.ts`)
- **统一汇率服务** (`lib/services/exchange-rate-service.ts`)
- **运费计算器集成** (`lib/shipping-calculator.ts`)

### 3. API层
- **管理员API** (`/api/admin/exchange-rates/*`)
- **公共查询API** (`/api/exchange-rates`)
- **同步API** (`/api/admin/exchange-rates/sync`)

### 4. 界面层
- **管理员界面** (`/admin/exchange-rates`)

## 功能特性

### ✅ 已实现功能

1. **汇率数据管理**
   - CRUD操作（创建、读取、更新、删除）
   - 汇率激活/停用状态管理
   - 汇率来源标记（手动/API）

2. **外部API集成**
   - ExchangeRate-API（免费，无需API Key）
   - Fixer.io（需要API Key）
   - CurrencyLayer（需要API Key）
   - 支持批量同步汇率

3. **统一汇率服务**
   - 缓存机制（5分钟缓存）
   - 降级机制（使用过期缓存）
   - 货币转换功能
   - 批量获取汇率

4. **管理界面**
   - 汇率列表和编辑
   - 外部API同步
   - API配置状态检查

5. **历史记录**
   - 自动记录汇率变更
   - 变更原因跟踪

## 支持的货币

- CNY (Chinese Yuan) - 人民币
- USD (US Dollar) - 美元
- EUR (Euro) - 欧元
- GBP (British Pound) - 英镑
- JPY (Japanese Yen) - 日元
- KRW (South Korean Won) - 韩元
- SGD (Singapore Dollar) - 新加坡元
- HKD (Hong Kong Dollar) - 港元

## 使用方法

### 1. 数据库初始化

```sql
-- 执行数据库脚本
\i db/exchange_rates.sql
```

### 2. 环境变量配置（可选）

```bash
# Fixer.io API Key (可选)
FIXER_API_KEY=your_fixer_api_key_here

# CurrencyLayer API Key (可选)
CURRENCYLAYER_API_KEY=your_currencylayer_api_key_here
```

### 3. 在代码中使用汇率服务

```typescript
import { getExchangeRate, convertCurrency } from '@/lib/services/exchange-rate-service';

// 获取汇率
const rate = await getExchangeRate('USD', 'CNY');
console.log(`1 USD = ${rate?.rate} CNY`);

// 货币转换
const result = await convertCurrency(100, 'USD', 'CNY');
console.log(`100 USD = ${result?.convertedAmount} CNY`);
```

### 4. 管理汇率

访问 `/admin/exchange-rates` 页面进行汇率管理：

- **查看汇率列表**: 显示所有汇率及其状态
- **添加汇率**: 手动添加新的汇率对
- **编辑汇率**: 修改现有汇率的值或状态
- **删除汇率**: 删除不需要的汇率
- **同步汇率**: 从外部API批量同步最新汇率

## API接口

### 公共接口

#### GET /api/exchange-rates
获取所有激活的汇率

参数：
- `base_currency`: 基础货币（可选）
- `target_currency`: 目标货币（可选）

#### GET /api/exchange-rates?base_currency=USD&target_currency=CNY
获取特定汇率对

### 管理员接口

#### GET /api/admin/exchange-rates
获取所有汇率（需要管理员权限）

#### POST /api/admin/exchange-rates
创建新汇率

#### PATCH /api/admin/exchange-rates/[id]
更新汇率

#### DELETE /api/admin/exchange-rates/[id]
删除汇率

#### POST /api/admin/exchange-rates/sync
从外部API同步汇率

## 外部API配置

### ExchangeRate-API
- **免费使用**: 无需API Key
- **限制**: 每月1500次请求
- **文档**: https://exchangerate-api.com/docs/free

### Fixer.io
- **免费版**: 每月100次请求
- **注册**: https://fixer.io/
- **配置**: 设置 `FIXER_API_KEY` 环境变量

### CurrencyLayer
- **免费版**: 每月1000次请求
- **注册**: https://currencylayer.com/
- **配置**: 设置 `CURRENCYLAYER_API_KEY` 环境变量

## 缓存机制

系统使用多层缓存提高性能：

1. **内存缓存**: 5分钟本地缓存
2. **Next.js 缓存**: API路由级别缓存
3. **降级机制**: 使用过期缓存作为备选

## 错误处理

1. **API不可用**: 自动降级到其他API源
2. **汇率不存在**: 返回null，由调用方处理
3. **网络错误**: 使用缓存数据或默认值

## 安全考虑

1. **权限控制**: 管理功能需要管理员权限
2. **RLS策略**: 数据库级别的行级安全
3. **输入验证**: API参数验证和清理
4. **错误信息**: 避免敏感信息泄露

## 监控和日志

系统提供详细的日志记录：

- 汇率获取和缓存状态
- 外部API调用结果
- 错误和异常情况
- 性能指标

## 故障排除

### 常见问题

1. **汇率获取失败**
   - 检查网络连接
   - 验证API Key配置
   - 查看API限制是否超额

2. **缓存不更新**
   - 清除缓存：调用 `clearExchangeRateCache()`
   - 重启应用程序

3. **权限错误**
   - 确认用户有管理员权限
   - 检查RLS策略配置

### 调试工具

```typescript
import { getExchangeRateCacheStatus } from '@/lib/services/exchange-rate-service';

// 查看缓存状态
const cacheStatus = getExchangeRateCacheStatus();
console.log('缓存状态:', cacheStatus);
```

## 扩展性

系统设计支持：

- 添加新的外部API源
- 支持更多货币类型
- 自定义汇率计算逻辑
- 定时自动同步任务

## 版本历史

- v1.0: 基础汇率管理功能
- v1.1: 外部API集成
- v1.2: 统一汇率服务
- v1.3: 管理界面完善 

## 🎯 汇率获取优先级

### 优先级策略

系统按以下优先级顺序获取汇率：

1. **CNY 固定汇率** (优先级 0)
   - CNY汇率固定为 1.0
   - 无需任何计算或获取

2. **管理员订单表汇率** (优先级 1 - 最高)
   - 使用管理员订单表中已存储的汇率
   - 避免不必要的API调用
   - 提高系统性能

3. **内存缓存汇率** (优先级 2)
   - 使用内存缓存中的汇率
   - 缓存有效期：1分钟
   - 减少频繁API调用

4. **内部API汇率** (优先级 3)
   - 从内部汇率API获取最新汇率
   - 确保汇率数据的实时性
   - 更新本地缓存

5. **系统默认汇率** (优先级 4 - 后备)
   - 当所有方式失败时使用
   - USD: 7.2, EUR: 7.8, CNY: 1.0

### 强制刷新机制

当用户点击🔄刷新按钮时：
- 跳过管理员订单表汇率和缓存
- 直接从内部API获取最新汇率
- 更新缓存和订单表汇率

## 🔧 核心组件

### 1. PriceManagementPanel (价格管理面板)

**位置：** `app/admin/orders/[id]/components/PriceManagementPanel.tsx`

**核心功能：**
- 多层级汇率获取逻辑
- 智能缓存机制
- 汇率来源显示
- 强制刷新功能

**关键方法：**
```typescript
const fetchExchangeRate = useCallback(async (currency: string, forceRefresh = false): Promise<number> => {
  // 1. CNY汇率固定为1.0
  if (currency === 'CNY') return 1.0;
  
  // 2. 优先使用管理员订单表中的汇率
  if (!forceRefresh && localData.exchange_rate && localData.currency === currency) {
    const adminRate = Number(localData.exchange_rate);
    if (adminRate > 0) return adminRate;
  }
  
  // 3. 检查内存缓存
  if (!forceRefresh && cached && isValid) {
    return cached.rate;
  }
  
  // 4. 从内部API获取
  return await fetchFromAPI(currency);
}, [exchangeRates, localData.exchange_rate, localData.currency]);
```

**汇率来源指示器：**
```typescript
// 显示当前汇率来源
{localData.exchange_rate && Number(localData.exchange_rate) > 0 ? (
  <span className="text-green-600">使用订单中的汇率</span>
) : exchangeRates[currentCurrency] ? (
  <span className="text-blue-600">使用API汇率</span>
) : (
  <span className="text-orange-600">使用默认汇率</span>
)}
```

### 2. AdminOrderForm (管理员订单表单)

**位置：** `app/admin/components/AdminOrderForm.tsx`

**功能特性：**
- 币种切换时自动获取汇率
- 强制刷新API汇率
- 汇率输入验证

**汇率刷新逻辑：**
```typescript
const handleRefreshRate = async () => {
  // 强制从API获取最新汇率，不使用当前值或缓存
  const rate = await fetchInternalExchangeRate(currency, 'CNY');
  if (rate !== null) {
    onChange(rate);
    toast.success(`汇率已刷新：1 ${currency} = ${rate} CNY (来自最新API)`);
  }
};
```

## 📊 汇率管理面板

### 汇率显示区域

**功能特性：**
- 实时显示当前汇率值和来源
- 彩色指示器区分汇率来源：
  - 🟢 绿色：管理员订单表汇率
  - 🔵 蓝色：API缓存汇率
  - 🟠 橙色：系统默认汇率
- 强制刷新按钮获取最新API汇率

**智能提示：**
- 汇率修改时自动调整其他价格项
- CNY币种时显示"固定"标识
- 提供详细的操作说明

## 🚀 性能优化

### 缓存策略

1. **内存缓存**
   - 有效期：1分钟
   - 减少重复API调用
   - 自动失效机制

2. **管理员订单表优先**
   - 减少90%以上的不必要API调用
   - 提高页面加载速度
   - 保持数据一致性

### 智能加载

1. **条件获取**
   - 只在必要时才获取汇率
   - 已有汇率时跳过获取
   - 支持手动强制刷新

2. **异步处理**
   - 非阻塞汇率获取
   - 后台更新缓存
   - 用户友好的加载状态

## 🧪 测试功能

### 汇率优先级测试页面

**位置：** `/test-exchange-rate`

**功能特性：**
- 模拟不同场景的汇率获取
- 验证优先级逻辑
- 可视化汇率来源
- 测试强制刷新功能

**测试场景：**
1. 正常汇率获取流程
2. 强制刷新API汇率
3. 缓存失效处理
4. API失败后备机制
5. CNY固定汇率验证

## 🔒 安全性考虑

### 权限控制
- 只有管理员可以修改汇率设置
- 普通用户只能查看汇率信息
- API访问权限验证

### 数据验证
- 汇率数值范围验证
- 币种代码格式检查
- 防止非法数据注入

## 📈 监控和日志

### 汇率获取日志
```typescript
console.log(`🔄 使用管理员订单表中的汇率: ${currency} = ${adminRate}`);
console.log(`💾 使用缓存汇率: ${currency} = ${cached.rate}`);
console.log(`🌐 从API获取最新汇率: ${currency}`);
console.log(`✅ API汇率获取成功: ${currency} = ${rate}`);
```

### 错误处理
- API失败时自动降级
- 用户友好的错误提示
- 详细的错误日志记录

## 🎯 最佳实践

### 管理员操作建议

1. **优先使用订单表汇率**
   - 避免频繁刷新汇率
   - 保持价格稳定性
   - 减少系统负载

2. **适时刷新汇率**
   - 市场波动较大时刷新
   - 新建订单时获取最新汇率
   - 定期检查汇率准确性

3. **币种管理**
   - 及时更新汇率设置
   - 关注汇率变化趋势
   - 保持数据同步

### 系统维护

1. **定期检查**
   - 验证API连接状态
   - 检查缓存性能
   - 监控汇率准确性

2. **性能优化**
   - 调整缓存有效期
   - 优化API调用频率
   - 监控系统响应时间

## 📝 更新日志

### v2.1.0 - 汇率优先级优化
- ✅ 实现管理员订单表汇率优先使用
- ✅ 添加智能汇率来源指示器
- ✅ 优化强制刷新机制
- ✅ 增强性能和用户体验
- ✅ 添加详细的操作日志

### v2.0.0 - 多币种支持
- ✅ 支持USD、CNY、EUR多币种
- ✅ 实现自动汇率获取
- ✅ 添加汇率缓存机制
- ✅ 提供管理员汇率管理界面

### v1.0.0 - 基础汇率功能
- ✅ 基础汇率计算功能
- ✅ 静态汇率配置
- ✅ 简单的币种转换

---

**文档更新时间：** 2024年12月
**系统版本：** v2.1.0
**维护团队：** PCB制造平台开发组 