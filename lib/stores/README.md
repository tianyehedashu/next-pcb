# Quote Store 计算属性使用指南

## 概述

Quote Store 提供了一套完整的计算属性系统，用于实时计算PCB报价相关的各种参数。这些计算属性会在表单数据变化时自动更新，为用户提供即时的反馈和估算。

## 计算属性列表

### 基础属性

| 属性名 | 类型 | 描述 |
|--------|------|------|
| `totalQuantity` | `number` | 总数量 |
| `singlePcbArea` | `number` | 单片PCB面积 (mm²) |
| `totalArea` | `number` | 总面积 (mm²) |
| `estimatedWeight` | `number` | 预估重量 (g) |

### 特性判断

| 属性名 | 类型 | 描述 |
|--------|------|------|
| `isMultiLayer` | `boolean` | 是否为多层板 (>2层) |
| `isHDI` | `boolean` | 是否使用HDI工艺 |
| `requiresImpedance` | `boolean` | 是否需要阻抗控制 |
| `hasSpecialFinish` | `boolean` | 是否使用特殊表面处理 |
| `hasAdvancedFeatures` | `boolean` | 是否包含高级特性 |

### 等级评估

| 属性名 | 类型 | 描述 |
|--------|------|------|
| `complexityLevel` | `'Simple' \| 'Standard' \| 'Complex' \| 'Advanced'` | 复杂度等级 |
| `priceCategory` | `'Economy' \| 'Standard' \| 'Premium' \| 'Ultra'` | 价格类别 |
| `productionDifficulty` | `number` | 生产难度 (1-10分) |

### 时间和成本

| 属性名 | 类型 | 描述 |
|--------|------|------|
| `estimatedLeadTime` | `{ cycleDays: number; reason: string[] }` | 预估交期信息（包含天数和原因） |
| `materialCost` | `number` | 材料成本估算 |
| `processingCost` | `number` | 加工成本估算 |

## 使用方法

### 1. 获取所有计算属性

```typescript
import { useQuoteCalculated } from '@/lib/stores/quote-store';

function MyComponent() {
  const calculated = useQuoteCalculated();
  
  return (
    <div>
      <p>复杂度: {calculated.complexityLevel}</p>
      <p>预估重量: {calculated.estimatedWeight.toFixed(1)}g</p>
      <p>交期: {calculated.estimatedLeadTime.cycleDays}天</p>
    </div>
  );
}
```

### 2. 获取单个计算属性

```typescript
import { useQuoteCalculatedProperty } from '@/lib/stores/quote-store';

function ComplexityBadge() {
  const complexityLevel = useQuoteCalculatedProperty('complexityLevel');
  const priceCategory = useQuoteCalculatedProperty('priceCategory');
  
  return (
    <div>
      <Badge>{complexityLevel}</Badge>
      <Badge>{priceCategory}</Badge>
    </div>
  );
}
```

### 3. 获取组合数据

```typescript
import { useQuoteSummary } from '@/lib/stores/quote-store';

function QuoteSummary() {
  const { formData, calculated, isValid, hasChanges } = useQuoteSummary();
  
  return (
    <div>
      <h3>{formData.pcbType} - {formData.layers}层</h3>
      <p>复杂度: {calculated.complexityLevel}</p>
      <p>状态: {isValid ? '有效' : '无效'}</p>
    </div>
  );
}
```

### 4. 手动更新计算属性

```typescript
import { useQuoteStore } from '@/lib/stores/quote-store';

function MyComponent() {
  const { updateCalculatedProperties } = useQuoteStore();
  
  const handleRefresh = () => {
    updateCalculatedProperties();
  };
  
  return <button onClick={handleRefresh}>刷新计算</button>;
}
```

## 计算逻辑

### 复杂度评分算法

复杂度评分基于以下因素：

1. **层数影响** (0-40分): `layers * 2`，最高40分
2. **HDI工艺** (0-20分): 
   - 1阶HDI: +10分
   - 2阶HDI: +15分  
   - 3阶HDI: +20分
3. **线宽线距** (0-15分):
   - 3.5/3.5mil: +15分
   - 4/4mil: +10分
   - 5/5mil: +5分
4. **孔径** (0-10分):
   - 0.15mm: +10分
   - 0.2mm: +7分
   - 0.25mm: +5分
5. **特殊工艺** (0-15分): 阻抗控制、金手指、BGA等

### 重量计算公式

```
总重量 = 基材重量 + 外层铜重量 + 内层铜重量

基材重量 = 面积(cm²) × 厚度(mm) × 数量 × FR4密度(1.85g/cm³)
外层铜重量 = 面积(cm²) × 铜厚(mm) × 2面 × 数量 × 铜密度(8.96g/cm³)  
内层铜重量 = 面积(cm²) × 铜厚(mm) × 内层数 × 数量 × 铜密度(8.96g/cm³)
```

### 交期计算逻辑

```
基础交期 = 3天
+ 层数影响: layers > 4时，每2层增加1天
+ HDI工艺: +2天
+ 特殊表面处理: +1天  
+ 数量影响: 每100片增加1天
+ 特殊工艺: 阻抗控制+1天，金手指+1天
```

## 工具函数

### 导入计算工具

```typescript
import { QuoteCalculationUtils } from '@/lib/stores/quote-calculations';

// 获取复杂度描述
const description = QuoteCalculationUtils.getComplexityDescription('Complex');

// 计算材料利用率
const utilization = QuoteCalculationUtils.calculateMaterialUtilization(formData);

// 获取推荐测试方法
const testMethod = QuoteCalculationUtils.getRecommendedTestMethod(formData);

// 计算环保评分
const envScore = QuoteCalculationUtils.calculateEnvironmentalScore(formData);
```

## 性能优化

1. **自动更新**: 计算属性在表单数据变化时自动更新
2. **选择器优化**: 使用专门的选择器hooks避免不必要的重渲染
3. **计算缓存**: Zustand自动处理状态缓存
4. **按需订阅**: 只订阅需要的计算属性

## 扩展指南

### 添加新的计算属性

1. 在 `CalculatedProperties` 接口中添加新属性
2. 在 `calculateProperties` 函数中实现计算逻辑
3. 如果逻辑复杂，在 `quote-calculations.ts` 中添加工具函数
4. 更新文档和类型定义

### 自定义计算逻辑

```typescript
// 在 quote-calculations.ts 中添加新函数
export const calculateCustomMetric = (formData: QuoteFormData): number => {
  // 自定义计算逻辑
  return result;
};

// 在 calculateProperties 中使用
const customMetric = calculateCustomMetric(formData);
```

## 注意事项

1. 计算属性是只读的，不要直接修改
2. 复杂计算应该放在工具函数中，保持store简洁
3. 确保计算函数的性能，避免在每次渲染时执行昂贵操作
4. 使用TypeScript确保类型安全
5. 添加单元测试验证计算逻辑的正确性 