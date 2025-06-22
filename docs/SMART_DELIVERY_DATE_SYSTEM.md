# 智能交期系统文档

## 概述

智能交期系统是一个考虑节假日和工作日的交期计算工具，能够准确计算PCB订单的预计完成日期。

## 核心功能

### 🎯 智能计算
- 自动排除中国法定节假日
- 跳过周末（周六、周日）
- 处理调休工作日
- 仅计算实际工作日

### ⚡ 加急处理
- 支持加急订单设置
- 自动减少1-2个工作日
- 最少保证1天生产时间
- 加急标记和提示

### 📅 节假日配置
- 内置2024-2025年中国法定节假日
- 包含春节、清明、劳动节、端午、中秋、国庆等
- 自动处理调休工作日安排
- 可扩展的节假日配置

## 文件结构

```
lib/utils/deliveryDateCalculator.ts    # 核心计算逻辑
app/admin/orders/[id]/components/      # 管理面板组件
├── PriceManagementPanel.tsx          # 集成交期管理
app/test-smart-delivery/               # 测试页面
└── page.tsx                          # 功能演示
```

## API 接口

### calculateSmartDeliveryDate()

计算智能交期的核心函数。

```typescript
function calculateSmartDeliveryDate(
  productionDays: number,      // 生产天数（工作日）
  startDate: Date = new Date(), // 开始日期，默认今天
  isUrgent: boolean = false    // 是否加急
): DeliveryCalculationResult
```

#### 参数说明
- `productionDays`: 需要的生产工作日天数
- `startDate`: 计算开始日期，默认为当前日期
- `isUrgent`: 是否为加急订单，加急会减少1-2个工作日

#### 返回值类型
```typescript
interface DeliveryCalculationResult {
  deliveryDate: string;          // 预计交期 (YYYY-MM-DD)
  actualWorkingDays: number;     // 实际工作日天数
  totalCalendarDays: number;     // 总日历天数
  skippedDays: string[];         // 跳过的节假日/周末
  reason: string[];              // 计算说明
  isUrgent?: boolean;            // 是否为加急订单
}
```

### checkIsWorkingDay()

检查指定日期是否为工作日。

```typescript
function checkIsWorkingDay(date: Date): boolean
```

### getNextWorkingDay()

获取指定日期后的下一个工作日。

```typescript
function getNextWorkingDay(date: Date): Date
```

### calculateWorkingDaysBetween()

计算两个日期之间的工作日天数。

```typescript
function calculateWorkingDaysBetween(startDate: Date, endDate: Date): number
```

## 使用示例

### 基础用法

```typescript
import { calculateSmartDeliveryDate } from '@/lib/utils/deliveryDateCalculator';

// 计算5个工作日的交期
const result = calculateSmartDeliveryDate(5);
console.log('预计交期:', result.deliveryDate);
console.log('实际工作日:', result.actualWorkingDays);
console.log('总天数:', result.totalCalendarDays);
```

### 加急订单

```typescript
// 加急订单，减少交期
const urgentResult = calculateSmartDeliveryDate(5, new Date(), true);
console.log('加急交期:', urgentResult.deliveryDate);
console.log('是否加急:', urgentResult.isUrgent);
```

### 指定开始日期

```typescript
// 从明天开始计算
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

const result = calculateSmartDeliveryDate(7, tomorrow);
```

### 工作日检查

```typescript
import { checkIsWorkingDay, getNextWorkingDay } from '@/lib/utils/deliveryDateCalculator';

const someDate = new Date('2024-01-01'); // 元旦
const isWorking = checkIsWorkingDay(someDate); // false
const nextWorking = getNextWorkingDay(someDate); // 下一个工作日
```

## 管理界面集成

### 价格管理面板

在 `PriceManagementPanel.tsx` 中集成了智能交期功能：

#### 功能特性
1. **生产天数输入**: 支持数字输入和自动计算
2. **加急选项**: 复选框控制加急状态
3. **预计交期显示**: 日期选择器显示计算结果
4. **工作日验证**: 实时检查选择日期是否为工作日
5. **智能提醒**: 非工作日时显示警告
6. **计算说明**: 显示详细的计算过程

#### 交互逻辑
- 修改生产天数时自动重新计算交期
- 切换加急状态时立即更新交期
- 手动选择交期时验证是否为工作日
- 显示计算过程和跳过的日期

## 节假日配置

### 2024年节假日
- 元旦: 1月1日
- 春节: 2月10-17日
- 清明节: 4月4-6日
- 劳动节: 5月1-3日
- 端午节: 6月10日
- 中秋节: 9月15-17日
- 国庆节: 10月1-7日

### 2025年节假日
- 元旦: 1月1日
- 春节: 1月28日-2月4日
- 清明节: 4月5-7日
- 劳动节: 5月1-3日
- 端午节: 5月31日
- 国庆节: 10月1-7日
- 中秋节: 10月6日

### 调休工作日
系统自动处理调休工作日，例如：
- 2024年2月4日、18日（春节调休）
- 2024年4月7日、28日（清明、劳动节调休）
- 2024年9月14日、29日（中秋、国庆调休）

## 测试页面

访问 `/test-smart-delivery` 页面可以测试所有功能：

### 测试功能
1. **交期计算器**
   - 输入生产天数
   - 切换加急状态
   - 查看详细计算结果

2. **工作日检查器**
   - 选择任意日期
   - 检查是否为工作日
   - 查看下一个工作日

3. **功能演示**
   - 实时计算和验证
   - 详细的计算过程
   - 跳过日期清单

## 最佳实践

### 1. 生产天数设置
- 建议最少设置1天生产时间
- 常规订单通常5-10个工作日
- 复杂订单可设置更长时间

### 2. 加急处理
- 仅在确实可以加急时使用
- 加急会自动减少1-2个工作日
- 最少保证1天生产时间

### 3. 交期验证
- 总是验证计算结果是否合理
- 注意节假日对交期的影响
- 手动调整时检查是否为工作日

### 4. 客户沟通
- 向客户说明交期计算逻辑
- 提醒节假日可能影响交期
- 提供详细的计算说明

## 扩展和维护

### 添加新年度节假日
1. 更新 `HOLIDAYS_2024_2025` 数组
2. 添加对应的调休工作日
3. 更新 `getHolidayName()` 函数

### 国际化支持
未来可以扩展支持其他国家的节假日：
- 美国节假日
- 欧洲节假日
- 其他地区节假日

### 性能优化
- 节假日配置可以移到配置文件
- 大量计算时可以考虑缓存
- 前端计算减少服务器负载

## 故障排除

### 常见问题

#### 1. 计算结果不正确
- 检查生产天数输入
- 验证开始日期设置
- 确认节假日配置

#### 2. 工作日判断错误
- 检查日期格式
- 验证节假日配置
- 确认调休设置

#### 3. 加急功能异常
- 检查加急逻辑
- 验证最小天数限制
- 确认UI状态同步

### 调试方法
1. 使用测试页面验证功能
2. 查看控制台日志输出
3. 检查计算过程详情
4. 验证节假日配置

## 更新日志

### v1.0.0 (2024-12-19)
- ✅ 智能交期计算核心功能
- ✅ 节假日和工作日处理
- ✅ 加急订单支持
- ✅ 管理界面集成
- ✅ 测试页面和文档
- ✅ 工作日验证和提醒

### 未来计划
- 🔄 国际化节假日支持
- 🔄 自定义节假日配置
- 🔄 历史交期数据分析
- 🔄 智能交期推荐 