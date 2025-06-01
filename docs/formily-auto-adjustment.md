# Formily 表单自动调整功能说明

## 功能概述
自动调整功能会在字段依赖项变化导致当前值不在可选项中时，自动选择合适的选项。该功能通过智能算法选择最合适的值，提升用户体验。

## 核心函数

### 1. `runSmartAdjustment($self)`
根据字段类型智能调整当前值：
- **厚度字段**: 选择最接近当前数值的选项
- **字符串字段**: 尝试部分匹配，失败则选择第一个选项  
- **其他字段**: 选择第一个可用选项

### 2. `runSmartAdjustmentWithCheck($self)`
检查当前值是否在可选项中，无效时选择第一个可选项。主要用于条件显示的字段。

### 3. `runSmartAdjustmentSync($self)`
同步版本的调整函数，立即执行不含异步处理。

## 使用场景

### 厚度自动调整
```javascript
// 当层数从4改为2时，如果当前厚度不适用，自动选择最接近的厚度
layers: 4 → 2
thickness: "2.0" → "1.6" // 自动选择最接近的有效厚度
```

### 丝印颜色自动调整
```javascript
// 当阻焊颜色改变时，自动避免与阻焊相同的丝印颜色
solderMask: "Green" → "Red"  
silkscreen: "Green" → "White" // 自动换成不冲突的颜色
```

### 条件字段自动调整
```javascript
// 当边缘电镀开启时，自动选择边缘覆盖选项
edgePlating: false → true
edgeCover: undefined → "Yes" // 自动选择默认选项
```

## 实现原理

### 双重 Reactions 机制
每个需要自动调整的字段都配置了两个 x-reactions：
1. **选项更新 Reaction**: 根据依赖项更新可选项
2. **值调整 Reaction**: 检查并调整当前值

### 防重入机制
使用 `$self.adjusting` 标记防止循环调用和重复执行。

### 异步执行顺序控制
通过 `setTimeout` 确保选项更新在值调整之前完成：

```javascript
// Schema 配置
"x-reactions": [
  {
    // 选项更新 - 立即执行
    dependencies: ["layers", "outerCopperWeight", "innerCopperWeight"],
    fulfill: {
      state: {
        componentProps: "{{getThicknessOptionsForFormily($deps)}}"
      }
    }
  },
  {
    // 值调整 - 延迟执行确保选项已更新
    dependencies: ["layers", "outerCopperWeight", "innerCopperWeight"],
    when: "{{$deps.length > 0}}",
    fulfill: {
      run: "{{setTimeout(() => runSmartAdjustment($self), 0)}}"
    }
  }
]
```

### 选项为空处理机制
当检测到选项为空时，延迟重试确保选项加载完成：

```javascript
// 如果选项还没有更新完成，稍等一下再执行
if (currentOptions.length === 0) {
  console.log(`[Auto-Adjustment] ${$self.path}: 选项为空，延迟重试`);
  $self.adjusting = false;
  setTimeout(() => {
    runSmartAdjustment($self);
  }, 10);
  return;
}
```

## 配置指南

### 添加自动调整到新字段

1. **导入必要函数**:
```javascript
import { runSmartAdjustment, runSmartAdjustmentWithCheck } from './formilyHelpers';
```

2. **配置 x-reactions**:
```javascript
fieldName: {
  type: "string",
  title: "字段标题",
  "x-component": "TabSelect",
  "x-reactions": [
    {
      dependencies: ["dependency1", "dependency2"],
      fulfill: {
        state: {
          componentProps: "{{getFieldOptions($deps)}}"
        }
      }
    },
    {
      dependencies: ["dependency1", "dependency2"], 
      when: "{{$deps.length > 0}}",
      fulfill: {
        run: "{{setTimeout(() => runSmartAdjustment($self), 0)}}"
      }
    }
  ]
}
```

## 重要注意事项

### 执行顺序问题及解决方案
**问题**: 当多个 x-reactions 有相同依赖项时，Formily 的执行顺序不确定，可能导致值调整在选项更新之前执行，出现 `currentOptions.length === 0` 的情况。

**解决方案**:
1. **使用 setTimeout 延迟执行**: 通过 `setTimeout(() => runSmartAdjustment($self), 0)` 确保值调整在下一个事件循环中执行，保证选项已更新。

2. **增加重试机制**: 当检测到选项为空时，延迟重试而不是直接返回：
```javascript
if (currentOptions.length === 0) {
  $self.adjusting = false;
  setTimeout(() => runSmartAdjustment($self), 10);
  return;
}
```

3. **完善调试信息**: 添加详细的日志输出，便于排查执行顺序问题：
```javascript
console.log(`[Auto-Adjustment] ${$self.path}: 开始调整`);
console.log(`[Auto-Adjustment] 当前值: ${currentValue}`);
console.log(`[Auto-Adjustment] 可用选项数量: ${currentOptions.length}`);
```

### 依赖项检查
确保依赖项数据完整有效，避免传递 null 或 undefined 值。

### 性能考虑
- 使用防重入机制避免不必要的重复执行
- 合理设置延迟时间，平衡响应速度和稳定性

### 用户体验
- 提供清晰的调试日志便于开发调试
- 确保自动调整逻辑符合用户预期
- 避免频繁的值变更导致用户困惑

## 测试建议

### 基础功能测试
1. **依赖项变化测试**: 验证依赖项变化时是否正确触发调整
2. **选项匹配测试**: 验证当前值在新选项中存在时不进行调整
3. **选项不匹配测试**: 验证当前值不在新选项中时正确选择新值

### 执行顺序测试
1. **选项更新顺序**: 验证选项更新在值调整之前完成
2. **空选项处理**: 验证当选项为空时的重试机制
3. **并发调整**: 验证多个字段同时调整时的稳定性

### 边界情况测试
1. **依赖项为空**: 验证依赖项为 null/undefined 时的处理
2. **选项生成失败**: 验证选项生成函数异常时的降级处理
3. **循环依赖**: 验证避免字段间循环调整的机制

### 性能测试
1. **重复调整**: 验证防重入机制的有效性
2. **延迟执行**: 验证 setTimeout 延迟不会影响用户体验
3. **内存泄漏**: 验证长时间使用时的内存稳定性 