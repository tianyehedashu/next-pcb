# 预计交期管理功能

## 功能概述

管理员现在可以灵活设置和管理订单的预计交期，支持自动计算和手动设置两种模式。

## 主要功能

### 1. 自动交期计算
- 基于PCB规格自动计算生产周期
- 支持复杂的交期计算规则（层数、面积、工艺等）
- 考虑加急服务、下单时间等因素

### 2. 手动交期设置
- 管理员可直接设置预计交期日期
- 支持生产天数输入，自动计算完成日期
- 灵活调整以应对特殊情况

### 3. 界面改进

#### 价格管理面板
```typescript
// 新增字段
{
  production_days: string | number;  // 生产天数
  delivery_date: string;             // 预计交期日期 (YYYY-MM-DD)
}
```

#### 管理员订单表单
- 预计交期字段支持日期选择器
- 生产天数可手动输入或自动计算
- 实时显示交期计算结果

## 使用方法

### 自动计算交期
1. 系统根据PCB规格自动计算生产周期
2. 考虑以下因素：
   - 基础交期（根据层数和面积查表）
   - 特殊工艺加时（HDI、阻抗控制等）
   - 材料和表面处理影响
   - 加急服务（可减少2天）
   - 下单时间（20:00后顺延1天）

### 手动设置交期
1. 在管理员订单页面找到"预计交期"字段
2. 可以通过以下方式设置：
   - 直接选择日期
   - 输入生产天数，系统自动计算日期
   - 使用"计算交期"按钮重新计算

### 交期计算示例
```javascript
// 基础计算逻辑
const today = new Date();
const targetDate = new Date(today);
targetDate.setDate(today.getDate() + productionDays);
const deliveryDate = targetDate.toISOString().split('T')[0];
```

## 技术实现

### 数据库字段
- `production_days`: 生产天数（整数）
- `delivery_date`: 预计交期日期（DATE格式）

### API支持
- 管理员订单创建/更新API支持交期字段
- 自动计算和手动设置都会保存到数据库

### 前端组件
- `PriceManagementPanel`: 包含交期设置界面
- `AdminOrderForm`: 支持交期字段编辑
- 自动计算逻辑集成在订单管理页面

## 测试页面

访问 `/test-delivery-date` 可以测试预计交期功能：
- 生产天数输入和自动计算
- 手动日期设置
- 自动/手动模式切换
- 实时结果显示

## 使用场景

### 标准流程
1. 客户提交PCB报价单
2. 系统自动计算预计交期
3. 管理员审核并可调整交期
4. 客户看到准确的交期信息

### 特殊情况
1. 复杂工艺需要额外时间
2. 生产排期调整
3. 加急订单处理
4. 节假日影响

## 注意事项

- 预计交期仅为估算，实际交期可能受生产排期影响
- 管理员应根据实际生产情况调整交期
- 交期变更应及时通知客户
- 系统会记录交期变更历史

## 相关文件

- `app/admin/orders/[id]/components/PriceManagementPanel.tsx` - 交期设置界面
- `app/admin/components/AdminOrderForm.tsx` - 订单表单
- `lib/productCycleCalc-v3.ts` - 交期计算逻辑
- `app/test-delivery-date/page.tsx` - 功能测试页面 