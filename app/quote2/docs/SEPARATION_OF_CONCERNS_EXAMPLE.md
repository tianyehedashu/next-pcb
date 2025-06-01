# 🚀 分离关注点方案：实际应用示例

## 核心理念

**不要在同一个 reaction 中做两件事！**

❌ **错误方式**：在一个 reaction 中既更新选项又调整值
✅ **正确方式**：分成两个 reaction，各司其职

## 🎯 实际案例对比

### ❌ 旧方式：单一复杂 reaction

```typescript
thickness: {
  type: "string",
  title: "Board Thickness",
  "x-component": "TabSelect",
  "x-reactions": {
    dependencies: ["layers", "outerCopperWeight", "innerCopperWeight"],
    fulfill: {
      state: {
        componentProps: "{{getThicknessOptionsForFormily($deps)}}"
      },
      // 😵 问题：可能在选项更新前执行，导致 dataSource 为空
      run: "{{$deps[0] && (() => { setTimeout(() => runSmartAdjustment($self), 0); })()}}"
    }
  }
}
```

**问题**：
- `componentProps` 和 `run` 可能同时执行
- `runSmartAdjustment` 访问到的 `dataSource` 可能还是空的
- 需要 `setTimeout` 这种 hack 方式

### ✅ 新方式：分离关注点

```typescript
thickness: {
  type: "string",
  title: "Board Thickness",
  "x-component": "TabSelect",
  "x-reactions": [
    // 🎯 Reaction 1：只负责更新选项
    {
      dependencies: ["layers", "outerCopperWeight", "innerCopperWeight"],
      fulfill: {
        state: {
          componentProps: "{{getThicknessOptionsForFormily($deps)}}"
        }
      }
    },
    // 🎯 Reaction 2：监听选项变化，调整值
    {
      dependencies: ["layers", "outerCopperWeight", "innerCopperWeight", "~dataSource"],
      when: "{{$deps[0] && $deps[1] && $deps[2] && $deps[3] && $deps[3].length > 0}}",
      fulfill: {
        run: "{{runSmartAdjustmentSync($self)}}"
      }
    }
  ]
}
```

**优势**：
- ✅ 职责明确：每个 reaction 只做一件事
- ✅ 时序保证：第二个 reaction 确保 `dataSource` 已更新
- ✅ 无异步：完全同步执行，无需猜测延迟
- ✅ 易维护：代码清晰，逻辑简单

## 🔧 其他字段的应用

### 1. minTrace（最小线宽）

```typescript
minTrace: {
  type: "string",
  title: "Min Trace/Space",
  "x-component": "TabSelect",
  "x-reactions": [
    {
      dependencies: ["layers", "outerCopperWeight", "innerCopperWeight"],
      fulfill: {
        state: {
          componentProps: "{{getMinTraceOptions($deps)}}"
        }
      }
    },
    {
      dependencies: ["layers", "outerCopperWeight", "innerCopperWeight", "~dataSource"],
      when: "{{$deps[0] && $deps[1] && $deps[2] && $deps[3] && $deps[3].length > 0}}",
      fulfill: {
        run: "{{runSmartAdjustmentSync($self)}}"
      }
    }
  ]
}
```

### 2. minHole（最小孔径）

```typescript
minHole: {
  type: "string",
  title: "Min Hole",
  "x-component": "TabSelect",
  "x-reactions": [
    {
      dependencies: ["layers", "thickness"],
      fulfill: {
        state: {
          componentProps: "{{getMinHoleOptions($deps)}}"
        }
      }
    },
    {
      dependencies: ["layers", "thickness", "~dataSource"],
      when: "{{$deps[0] && $deps[1] && $deps[2] && $deps[2].length > 0}}",
      fulfill: {
        run: "{{runSmartAdjustmentSync($self)}}"
      }
    }
  ]
}
```

### 3. silkscreen（丝印颜色）

```typescript
silkscreen: {
  type: "string",
  title: "Silk Screen",
  "x-component": "TabSelect",
  "x-reactions": [
    {
      dependencies: ["solderMask"],
      fulfill: {
        state: {
          componentProps: "{{getSilkscreenOptions($deps)}}"
        }
      }
    },
    {
      dependencies: ["solderMask", "~dataSource"],
      when: "{{$deps[0] && $deps[1] && $deps[1].length > 0}}",
      fulfill: {
        run: "{{runSmartAdjustmentSync($self)}}"
      }
    }
  ]
}
```

## 🎨 关键技术点

### 1. `~dataSource` 依赖

```javascript
dependencies: ["layers", "outerCopperWeight", "innerCopperWeight", "~dataSource"]
```

- `~dataSource`：监听字段的 dataSource 属性变化
- 确保在选项更新后才执行调整逻辑

### 2. `when` 条件

```javascript
when: "{{$deps[0] && $deps[1] && $deps[2] && $deps[3] && $deps[3].length > 0}}"
```

- 确保所有依赖项都有值
- 确保 dataSource 不为空且有选项
- 只有条件满足时才执行调整

### 3. 同步调整函数

```typescript
export function runSmartAdjustmentSync($self: FormilyField): void {
  // 无需异步处理，dataSource 已经准备就绪
  const currentOptions = $self.dataSource || [];
  if (currentOptions.length === 0) return;
  
  // 执行调整逻辑...
}
```

- 完全同步执行
- 无需重试机制
- 代码简洁清晰

## 🚀 迁移步骤

### Step 1：创建同步调整函数
```typescript
// 在 formilyHelpers.ts 中已添加
export function runSmartAdjustmentSync($self: FormilyField): void {
  // 实现...
}
```

### Step 2：更新 schema 导出
```typescript
// 在 pcbFormilySchema.ts 中导出
export const { 
  // ...其他函数
  runSmartAdjustmentSync 
} = formilyHelpers;
```

### Step 3：替换字段配置
```typescript
// 从单一 reaction
"x-reactions": {
  dependencies: ["layers", "outerCopperWeight", "innerCopperWeight"],
  fulfill: {
    state: { componentProps: "{{getThicknessOptionsForFormily($deps)}}" },
    run: "{{$deps[0] && (() => { setTimeout(() => runSmartAdjustment($self), 0); })()}}"
  }
}

// 改为分离 reactions
"x-reactions": [
  {
    dependencies: ["layers", "outerCopperWeight", "innerCopperWeight"],
    fulfill: {
      state: { componentProps: "{{getThicknessOptionsForFormily($deps)}}" }
    }
  },
  {
    dependencies: ["layers", "outerCopperWeight", "innerCopperWeight", "~dataSource"],
    when: "{{$deps[0] && $deps[1] && $deps[2] && $deps[3] && $deps[3].length > 0}}",
    fulfill: {
      run: "{{runSmartAdjustmentSync($self)}}"
    }
  }
]
```

## 🎯 总结

**分离关注点方案的核心优势**：

1. **🎯 职责明确**：每个 reaction 只做一件事
2. **🔒 时序保证**：利用 Formily 的依赖系统确保执行顺序
3. **🚀 性能更好**：无异步开销，完全同步执行
4. **🛠️ 易维护**：代码清晰，逻辑简单
5. **💡 符合框架理念**：配合 Formily 而不是 hack 它

这是最优雅、最可靠的解决方案！ 