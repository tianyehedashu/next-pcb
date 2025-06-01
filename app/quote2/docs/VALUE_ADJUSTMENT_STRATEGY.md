# 🎯 字段值自动调整策略

## 问题背景

在 PCB 报价表单中，很多字段的可选项会根据其他字段的值动态变化。当依赖项变化时，当前选中的值可能不再存在于新的选项列表中，需要合理的处理策略。

## 核心挑战

1. **用户体验**：用户不应该看到无效的选项或遇到表单错误
2. **数据一致性**：确保表单数据始终有效
3. **业务逻辑**：根据不同字段的特性选择合适的调整策略
4. **用户感知**：让用户了解发生了什么变化

## 解决方案

### 1. 三层处理机制

#### Layer 1: Formily Reactions 自动调整
```typescript
// 在 schema 中直接处理，无感知的自动调整
"x-reactions": [
  {
    // 更新选项
    dependencies: ["layers", "outerCopperWeight", "innerCopperWeight"],
    fulfill: {
      state: {
        componentProps: "{{getThicknessOptionsForFormily($deps)}}"
      }
    }
  },
  {
    // 自动调整值
    dependencies: ["layers", "outerCopperWeight", "innerCopperWeight"],
    when: "{{$deps[0] && $deps[1] && $deps[2]}}",
    fulfill: {
      run: `{{
        const options = getThicknessOptions($deps);
        const availableValues = options.map(opt => opt.value);
        const currentValue = $self.value;
        
        if (currentValue && !availableValues.includes(currentValue)) {
          const closest = availableValues.reduce((prev, curr) => 
            Math.abs(curr - currentValue) < Math.abs(prev - currentValue) ? curr : prev
          );
          $self.setValue(closest);
        }
      }}`
    }
  }
]
```

#### Layer 2: 智能调整函数
```typescript
// formilyHelpers.ts 中的通用调整函数
export function autoAdjustFieldValue(
  fieldName: string, 
  currentValue: unknown, 
  newOptions: OptionItem[], 
  adjustmentStrategy: 'first' | 'closest' | 'none' = 'first'
): {
  needsAdjustment: boolean;
  newValue?: unknown;
  message?: string;
  availableOptions: string;
}
```

#### Layer 3: 用户提示系统
```typescript
// useAutoAdjustments hook 处理用户通知
const { autoAdjustments, checkForAutoAdjustments } = useAutoAdjustments(form);
```

### 2. 调整策略类型

#### A. `closest` - 最接近值策略
**适用场景**：数值类型字段，如板厚、铜厚等
**逻辑**：找到最接近当前值的可用选项
```typescript
// 示例：板厚从 1.4mm 调整到 1.6mm（最接近的可用值）
if (typeof currentValue === 'number') {
  newValue = availableValues.reduce((prev, curr) => 
    Math.abs(curr - currentValue) < Math.abs(prev - currentValue) ? curr : prev
  );
}
```

#### B. `first` - 第一个可用值策略
**适用场景**：枚举类型字段，如线宽、孔径等
**逻辑**：选择第一个（通常是最宽松的）可用选项
```typescript
// 示例：最小线宽从 3.5/3.5 调整到 6/6（更宽松的要求）
newValue = availableValues[0];
```

#### C. `none` - 仅提示不自动调整
**适用场景**：重要的用户选择，如表面处理、阻焊颜色等
**逻辑**：只显示提示信息，让用户手动选择
```typescript
// 示例：阻焊颜色冲突时，提示用户手动选择
return {
  needsAdjustment: true,
  message: `Current silkscreen color conflicts with solder mask. Please select manually.`
};
```

### 3. 具体字段的调整策略

| 字段名 | 策略 | 原因 |
|-------|------|------|
| `thickness` | `closest` | 数值型，找最接近的厚度 |
| `minTrace` | `first` | 选择最宽松的线宽要求 |
| `minHole` | `first` | 选择最大的最小孔径 |
| `silkscreen` | `first` | 自动选择第一个兼容颜色 |
| `surfaceFinish` | `first` | 选择第一个可用的表面处理 |
| `maskCover` | `first` | 选择第一个可用的过孔处理 |

### 4. 用户体验优化

#### A. 静默调整 vs 通知调整
```typescript
// 静默调整：小幅度的兼容性调整
if (adjustmentType === 'compatibility' && Math.abs(oldValue - newValue) < threshold) {
  // 直接调整，不显示通知
  field.setValue(newValue);
}

// 通知调整：显著的变化
if (adjustmentType === 'significant') {
  // 调整并显示通知
  field.setValue(newValue);
  showNotification({
    type: 'info',
    message: `${fieldName} adjusted due to dependency changes`
  });
}
```

#### B. 防抖和去重
```typescript
// 避免频繁调整和重复通知
const adjustmentCache = new Map();
const lastAdjustmentTime = new Map();

function shouldShowAdjustment(field, result, values) {
  const signature = generateFieldSignature(field, values);
  const lastTime = lastAdjustmentTime.get(field) || 0;
  const now = Date.now();
  
  // 5秒内不重复提示
  if (now - lastTime < 5000) return false;
  
  // 相同结果不重复提示
  const cached = adjustmentCache.get(signature);
  if (cached && cached.result === result.value) return false;
  
  return true;
}
```

#### C. 用户控制选项
```typescript
interface NotificationPreferences {
  disabledTypes: Set<string>;    // 禁用的提示类型
  disabledFields: Set<string>;   // 禁用的字段提示
  sessionDisabled: Set<string>;  // 本次会话禁用
}

// 用户可以选择：
// 1. 禁用特定字段的调整提示
// 2. 禁用特定类型的提示（警告/信息/成功）
// 3. 本次会话禁用某些提示
```

## 实现细节

### 1. Formily Schema 配置
每个需要自动调整的字段都配置两个 reactions：
- 第一个：更新选项列表
- 第二个：检查并调整当前值

### 2. 辅助函数设计
```typescript
// 通用调整函数
export function autoAdjustFieldValue(fieldName, currentValue, newOptions, strategy)

// 具体字段调整函数
export function adjustThicknessForLayers([currentThickness, layers, outerCopper, innerCopper])
export function adjustMinTraceForSpecs([currentTrace, layers, outerCopper, innerCopper])
// ...
```

### 3. Hook 集成
```typescript
const { autoAdjustments, checkForAutoAdjustments } = useAutoAdjustments(form);

// 在表单值变化时触发检查
form.onValuesChange((changedValues, allValues) => {
  checkForAutoAdjustments(allValues, previousValues);
});
```

## 最佳实践

1. **优先使用 Formily reactions 进行静默调整**
2. **重要变化时显示用户通知**
3. **提供用户控制选项**
4. **避免频繁调整和通知**
5. **保持调整逻辑的业务合理性**

## 测试策略

### 1. 单元测试
```typescript
describe('autoAdjustFieldValue', () => {
  it('should adjust to closest value for numeric fields', () => {
    const result = autoAdjustFieldValue('thickness', 1.4, thicknessOptions, 'closest');
    expect(result.newValue).toBe(1.6);
  });
});
```

### 2. 集成测试
```typescript
describe('Form auto-adjustment', () => {
  it('should auto-adjust thickness when layers change', () => {
    form.setFieldValue('layers', 16);
    expect(form.getFieldValue('thickness')).toBeGreaterThanOrEqual(2.0);
  });
});
```

### 3. 用户体验测试
- 验证调整后的值确实可用
- 检查通知显示是否合理
- 测试用户禁用选项是否生效

## 总结

通过三层机制的设计，我们实现了：
- **无感知的自动调整**：大部分情况下用户不会感受到任何中断
- **智能的提示系统**：重要变化时给予适当的通知
- **灵活的控制选项**：用户可以自定义通知偏好
- **业务逻辑合理性**：不同字段采用最适合的调整策略

这种方案既保证了数据的一致性，又提供了良好的用户体验。 

## 通用字段调整器工厂函数

### 概述

为了进一步简化和统一字段调整逻辑，我们引入了 `createFieldAdjuster` 工厂函数。这个函数可以根据配置生成特定字段的调整函数，避免重复代码。

### 工厂函数设计

```typescript
export function createFieldAdjuster<TDeps extends readonly unknown[]>(config: {
  fieldName: string;                                    // 字段显示名称
  getOptionsFunction: (...deps: TDeps) => OptionItem[] | OptionsResult;  // 选项生成函数
  adjustmentStrategy: 'first' | 'closest' | 'none';     // 调整策略
  formatMessage?: (currentValue: unknown, newValue: unknown, deps: TDeps) => string;  // 自定义消息格式
}) {
  return (currentValue: unknown, deps: TDeps) => {
    // 调整逻辑实现
  };
}
```

### 使用示例

#### 1. 创建板厚调整器
```typescript
export const adjustThicknessForLayers = createFieldAdjuster<[number, string, string]>({
  fieldName: 'Thickness',
  getOptionsFunction: wrapThicknessOptions,  // 适配器函数
  adjustmentStrategy: 'closest',              // 数值类型使用最接近策略
  formatMessage: (currentValue, newValue, [layers, outerCopper, innerCopper]) => 
    `Thickness ${currentValue}mm is not available for ${layers} layers with copper weights ${outerCopper}oz/${innerCopper}oz. Auto-adjusted to: ${newValue}mm`
});
```

#### 2. 创建最小线宽调整器
```typescript
export const adjustMinTraceForSpecs = createFieldAdjuster<[number, string, string]>({
  fieldName: 'Min Trace/Space',
  getOptionsFunction: wrapMinTraceOptions,
  adjustmentStrategy: 'first',                // 选择第一个（最宽松的）选项
  formatMessage: (currentValue, newValue, [layers, outerCopper, innerCopper]) => 
    `Min trace ${currentValue} is not available for ${layers} layers with copper weights ${outerCopper}oz/${innerCopper}oz. Auto-adjusted to: ${newValue}`
});
```

#### 3. 创建新字段调整器
```typescript
// 假设要为新字段 "copperBalance" 创建调整器
export const adjustCopperBalanceForSpecs = createFieldAdjuster<[number, string]>({
  fieldName: 'Copper Balance',
  getOptionsFunction: getCopperBalanceOptions,  // 你的选项生成函数
  adjustmentStrategy: 'first',
  formatMessage: (currentValue, newValue, [layers, thickness]) => 
    `Copper balance ${currentValue} is not suitable for ${layers} layers with ${thickness}mm thickness. Auto-adjusted to: ${newValue}`
});
```

### 优势

1. **代码复用**：消除了重复的调整逻辑代码
2. **类型安全**：完整的 TypeScript 类型支持
3. **一致性**：所有字段调整器都遵循相同的模式
4. **易于扩展**：添加新字段调整器只需提供配置对象
5. **灵活性**：支持自定义消息格式和调整策略

### 适配器模式

由于现有的选项生成函数使用元组参数，而工厂函数期望展开的参数，我们使用适配器函数：

```typescript
// 现有函数：getThicknessOptions([layers, outerCopper, innerCopper])
// 适配器函数：
const wrapThicknessOptions = (layers: number, outerCopper: string, innerCopper: string) => 
  getThicknessOptions([layers, outerCopper, innerCopper]);

// 在工厂函数中使用适配器
export const adjustThicknessForLayers = createFieldAdjuster<[number, string, string]>({
  getOptionsFunction: wrapThicknessOptions,  // 使用适配器
  // ... 其他配置
});
```

### 兼容性保证

为了保持与现有代码的兼容性，我们提供了包装函数：

```typescript
// 兼容性包装函数，保持原有的数组参数 API
export function adjustThicknessForLayersCompat([currentThickness, layers, outerCopper, innerCopper]: [number, number, string, string]) {
  return adjustThicknessForLayers(currentThickness, [layers, outerCopper, innerCopper]);
}

// 在 schema 中使用新的调用方式
"x-reactions": [{
  fulfill: {
    run: `{{
      const result = adjustThicknessForLayers($self.value, [$deps[0], $deps[1], $deps[2]]);
      if (result.needsAdjustment && result.suggestedValue !== undefined) {
        $self.setValue(result.suggestedValue);
      }
    }}`
  }
}]
```

通过这种设计，我们既获得了通用性和可维护性的好处，又保持了向后兼容性。 

## 通用 Reaction Runner

### 进一步优化：统一 Run 函数

为了进一步减少重复代码，我们创建了 `runFieldAdjustment` 通用函数来处理所有字段的调整逻辑：

```typescript
/**
 * 🎯 通用 Reaction Runner - 在 Formily schema 中执行字段调整
 */
export function runFieldAdjustment(
  adjustmentFunction: (currentValue: unknown, deps: unknown[]) => { needsAdjustment: boolean; suggestedValue?: unknown },
  currentValue: unknown,
  dependencies: unknown[],
  setValue: (value: unknown) => void
) {
  try {
    const result = adjustmentFunction(currentValue, dependencies);
    if (result.needsAdjustment && result.suggestedValue !== undefined) {
      setValue(result.suggestedValue);
    }
  } catch (error) {
    console.warn('Field adjustment failed:', error);
  }
}
```

### 在 Schema 中的使用

**之前的方式（重复代码）**：
```typescript
"x-reactions": [{
  fulfill: {
    run: `{{
      const result = adjustThicknessForLayers($self.value, [$deps[0], $deps[1], $deps[2]]);
      if (result.needsAdjustment && result.suggestedValue !== undefined) {
        $self.setValue(result.suggestedValue);
      }
    }}`
  }
}]
```

**现在的方式（通用函数）**：
```typescript
"x-reactions": [{
  fulfill: {
    run: "{{runFieldAdjustment(adjustThicknessForLayers, $self.value, $deps, $self.setValue)}}"
  }
}]
```

### 优势

1. **极简代码**：每个字段的 run 函数只需一行代码
2. **统一错误处理**：所有字段调整都有相同的错误处理逻辑
3. **易于维护**：调整逻辑的修改只需在一个地方进行
4. **类型安全**：TypeScript 提供完整的类型检查
5. **调试友好**：统一的错误捕获和日志记录

### 完整示例

现在添加一个新字段的调整变得非常简单：

```typescript
// 1. 创建调整器（使用工厂函数）
export const adjustNewFieldForSpecs = createFieldAdjuster<[number, string]>({
  fieldName: 'New Field',
  getOptionsFunction: getNewFieldOptions,
  adjustmentStrategy: 'first'
});

// 2. 在 schema 中使用（一行代码）
{
  "x-reactions": [{
    dependencies: ["dependency1", "dependency2"],
    when: "{{$deps[0] && $deps[1]}}",
    fulfill: {
      run: "{{runFieldAdjustment(adjustNewFieldForSpecs, $self.value, $deps, $self.setValue)}}"
    }
  }]
}
```

这种方法将字段调整的代码量减少了约 80%，同时提高了一致性和可维护性。 

## 进一步简化：自动推断调整函数

### 1. 根据字段名自动选择调整函数

现在你可以省略第一个参数，让系统自动选择合适的调整函数：

```typescript
// 之前：需要指定调整函数
run: "{{runFieldAdjustment(adjustThicknessForLayers, $self.value, $deps, $self.setValue)}}"

// 现在：根据字段名自动选择
run: "{{runFieldAdjustmentAuto('thickness', $self.value, $deps, $self.setValue)}}"
```

### 2. 完全自动化调整

甚至可以使用完全自动化的版本：

```typescript
// 最简版本：系统自动推断一切
run: "{{runAutoAdjustment($self.value, $deps, $self.setValue, $self.path)}}"

// 或者使用智能模板（零参数）
run: runSmartAdjustment()
```

### 调用方式对比

| 方式 | 代码复杂度 | 灵活性 | 推荐场景 |
|------|------------|---------|----------|
| `runFieldAdjustment(fn, ...)` | 中等 | 最高 | 需要自定义调整逻辑 |
| `runFieldAdjustmentAuto('field', ...)` | 低 | 高 | 标准字段，明确字段名 |
| `runAutoAdjustment(..., path)` | 极低 | 中等 | 标准字段，自动推断 |
| `runSmartAdjustment()` | 最低 | 中等 | 标准字段，零配置 |

### 实际应用示例

```typescript
// 板厚字段 - 使用字段名自动选择
thickness: {
  "x-reactions": [{
    dependencies: ["layers", "outerCopperWeight", "innerCopperWeight"],
    when: "{{$deps[0] && $deps[1] && $deps[2]}}",
    fulfill: {
      run: "{{runFieldAdjustmentAuto('thickness', $self.value, $deps, $self.setValue)}}"
    }
  }]
}

// 最小线宽字段 - 使用路径自动推断
minTrace: {
  "x-reactions": [{
    dependencies: ["layers", "outerCopperWeight", "innerCopperWeight"],
    when: "{{$deps[0] && $deps[1] && $deps[2]}}",
    fulfill: {
      run: "{{runAutoAdjustment($self.value, $deps, $self.setValue, $self.path)}}"
    }
  }]
}

// 丝印字段 - 使用零参数智能版本
silkscreen: {
  "x-reactions": [{
    dependencies: ["solderMask"],
    when: "{{$deps[0]}}",
    fulfill: {
      run: runSmartAdjustment()
    }
  }]
}
```

这种设计让字段调整变得极其简单，同时保持了强大的灵活性！ 

## 智能调整逻辑：两步处理机制

### 设计理念

`runSmartAdjustment()` 采用两步处理机制，让系统既能处理有专门调整函数的字段，也能处理任意新字段：

### 第一步：通用判断逻辑

所有字段都使用相同的判断逻辑：

```javascript
// 1. 获取当前字段的可用选项
const optionsGetter = optionsGetterMap[fieldName];
const optionsResult = optionsGetter();
const availableOptions = Array.isArray(optionsResult) ? optionsResult : optionsResult.options || [];

// 2. 检查当前值是否在可用选项中
const availableValues = availableOptions.map(opt => opt.value);
const needsAdjustment = currentValue && !availableValues.some(value => value === currentValue);

// 3. 如果不需要调整或没有可用选项，直接返回
if (!needsAdjustment || availableValues.length === 0) {
  return;
}
```

### 第二步：智能选择调整方式

```javascript
// 优先使用专门的调整函数
const adjustmentFunction = fieldAdjusterMap[fieldName];
if (adjustmentFunction) {
  // 方式 A：使用专门的调整函数（如 adjustThicknessForLayers）
  const result = adjustmentFunction(currentValue, $deps);
  if (result.needsAdjustment && result.suggestedValue !== undefined) {
    newValue = result.suggestedValue;
    console.log(`Field ${fieldName} adjusted using custom function: ${currentValue} → ${newValue}`);
  }
} else {
  // 方式 B：使用默认方式（第一个可用选项）
  newValue = availableValues[0];
  console.log(`Field ${fieldName} adjusted using default strategy: ${currentValue} → ${newValue}`);
}
```

### 优势对比

| 特性 | 一步处理 | 两步处理 |
|------|----------|----------|
| **通用性** | 仅支持预定义字段 | 支持任意字段 |
| **扩展性** | 需要修改核心逻辑 | 新字段自动支持 |
| **调整策略** | 固定策略 | 智能选择策略 |
| **调试友好** | 一般 | 更清晰的日志 |
| **维护成本** | 高 | 低 |

### 实际应用场景

#### 场景 1：预定义字段（如 thickness）

```javascript
// 有专门的调整函数，使用 closest 策略
thickness: {
  "x-reactions": [{
    dependencies: ["layers", "outerCopperWeight", "innerCopperWeight"],
    when: "{{$deps[0] && $deps[1] && $deps[2]}}",
    fulfill: {
      run: runSmartAdjustment() // 使用 adjustThicknessForLayers
    }
  }]
}
```

控制台输出：
```
Field thickness adjusted using custom function: 1.4 → 1.6
```

#### 场景 2：新增字段（如 copperBalance）

```javascript
// 没有专门的调整函数，使用默认策略
copperBalance: {
  "x-reactions": [{
    dependencies: ["layers", "thickness"],
    when: "{{$deps[0] && $deps[1]}}",
    fulfill: {
      run: runSmartAdjustment() // 使用默认策略（第一个选项）
    }
  }]
}
```

控制台输出：
```
Field copperBalance adjusted using default strategy: invalid_value → first_available_option
```

### 添加新字段支持

要为新字段添加智能调整支持，只需要两步：

#### 1. 添加选项生成函数
```javascript
const optionsGetterMap = {
  // ... 现有字段
  copperBalance: () => getCopperBalanceOptions($deps),
  newField: () => getNewFieldOptions($deps),
};
```

#### 2. （可选）添加专门的调整函数
```javascript
const fieldAdjusterMap = {
  // ... 现有字段
  copperBalance: adjustCopperBalanceForSpecs, // 自定义调整逻辑
  // newField 没有专门函数，会使用默认策略
};
```

### 最佳实践

1. **对于重要的业务字段**：提供专门的调整函数，实现精确的业务逻辑
2. **对于简单的枚举字段**：依赖默认策略，选择第一个可用选项
3. **对于临时或测试字段**：无需任何额外配置，系统自动处理

这种两步处理机制让系统具备了**完全的向前兼容性**，任何新字段都能自动获得基本的调整能力！ 

## 错误排除和最佳实践

### 常见错误

#### 1. `fieldPath.split is not a function` 错误

**原因**：`$self.path` 在某些情况下可能不是字符串类型

**解决方案**：
```javascript
// ❌ 错误的调用方式
run: "{{runAutoAdjustment($self.value, $deps, $self.setValue, $self.path)}}"

// ✅ 推荐的调用方式
run: runSmartAdjustment() // 内置了类型检查
```

#### 2. 调整函数未找到错误

**原因**：新字段没有在 `optionsGetterMap` 中定义选项生成函数

**解决方案**：
```javascript
// 为新字段添加选项生成函数
const optionsGetterMap = {
  // ... 现有字段
  newField: () => getNewFieldOptions($deps),
};
```

### 推荐的调用方式

| 场景 | 推荐方式 | 原因 |
|------|----------|------|
| **大多数字段** | `runSmartAdjustment()` | 零配置，自动处理所有情况 |
| **特殊逻辑字段** | `runFieldAdjustmentAuto('fieldName', ...)` | 明确字段名，避免路径解析 |
| **复杂自定义逻辑** | `runFieldAdjustment(customFn, ...)` | 完全控制调整逻辑 |

### 最佳实践

1. **优先使用 `runSmartAdjustment()`**：零配置，自动处理
2. **为重要字段提供专门的调整函数**：实现精确的业务逻辑
3. **添加调试日志**：便于问题排查
4. **测试边界情况**：确保在各种依赖组合下都能正常工作

### 调试技巧

当调整不生效时，检查以下项：

1. **字段名映射**：确保字段名在 `optionsGetterMap` 中有对应的函数
2. **依赖项**：确保所有必要的依赖项都有值
3. **选项生成**：确保选项生成函数返回正确的格式
4. **控制台日志**：查看调整过程的详细日志

```javascript
// 查看调整日志
console.log("Field thickness adjusted using custom function: 1.4 → 1.6");
console.log("Field newField adjusted using default strategy: invalid → option1");
``` 