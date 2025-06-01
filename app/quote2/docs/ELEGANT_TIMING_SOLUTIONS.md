# 🚀 优雅的异步调整解决方案

## 问题分析

在 Formily reactions 中，`componentProps` 和 `run` 函数可能在同一个事件循环中执行，导致智能调整函数访问到的 `dataSource` 还是旧的空数组。

## 🎯 解决方案对比

### ❌ 方案1：setTimeout (不够优雅)
```javascript
run: "{{$deps[0] && (() => { setTimeout(() => runSmartAdjustment($self), 0); })()}}"
```
**缺点**：
- 不直观，使用定时器处理非时间相关逻辑
- 固定延迟，可能过早或过晚
- 代码意图不明确

### ✅ 方案2：Promise.resolve().then() (更语义化)
```javascript
run: "{{$deps[0] && (() => { Promise.resolve().then(() => runSmartAdjustment($self)); })()}}"
```
**优点**：
- 使用微任务队列，语义更清晰
- 延迟最小，但确保在当前同步代码后执行
- 代码意图明确：等待当前同步操作完成

### 🔥 方案3：主动检查 + requestAnimationFrame (最可靠但复杂)
```javascript
run: "{{$deps[0] && runSmartAdjustmentWithCheck($self, $deps)}}"
```
**优点**：
- 主动检查 dataSource 是否准备就绪
- 使用 requestAnimationFrame 等待渲染周期
- 有重试机制，最多3次
- 最可靠，无需猜测延迟时间

**缺点**：
- 重试机制感觉像 hack
- 代码复杂度较高

### 🚀 方案4：分离关注点 (最优雅，推荐)
```javascript
// 分成两个独立的 reactions
"x-reactions": [
  // Reaction 1: 只负责更新选项
  {
    dependencies: ["layers", "outerCopperWeight", "innerCopperWeight"],
    fulfill: {
      state: {
        componentProps: "{{getThicknessOptionsForFormily($deps)}}"
      }
    }
  },
  // Reaction 2: 监听选项变化，调整值
  {
    dependencies: ["layers", "outerCopperWeight", "innerCopperWeight", "~dataSource"],
    when: "{{$deps[0] && $deps[1] && $deps[2] && $deps[3] && $deps[3].length > 0}}",
    fulfill: {
      run: "{{runSmartAdjustmentSync($self)}}"
    }
  }
]
```

## 🚀 推荐的最佳实践：分离关注点

### 1. 核心思想

**问题根源**：我们试图在同一个 reaction 中处理两件事
- 更新选项（componentProps）  
- 调整值（run）

**解决方案**：分离这两个职责，让 Formily 自己处理执行顺序

### 2. 实现方式

```typescript
// 新的同步调整函数 - 不需要异步处理
export function runSmartAdjustmentSync($self: FormilyField): void {
  if (!$self?.path || typeof $self.value === 'undefined' || $self.adjusting) {
    return;
  }

  const currentOptions = $self.dataSource || [];
  
  // 此时 dataSource 已经被第一个 reaction 更新过了
  if (currentOptions.length === 0) return;

  const fieldPath = $self.path.toString();
  const fieldName = fieldPath.split('.').pop();
  const currentValue = $self.value;
  const availableValues = currentOptions.map((opt: OptionItem) => opt.value);
  const isCurrentValueValid = currentValue != null && availableValues.includes(currentValue);
  
  if (currentValue != null && !isCurrentValueValid) {
    let newValue: FieldValue;
    
    // 智能选择逻辑...
    if (fieldName === 'thickness' || fieldPath.includes('thickness')) {
      const numericCurrent = typeof currentValue === 'number' ? currentValue : parseFloat(String(currentValue));
      const numericValues = availableValues.filter((v: string | number) => typeof v === 'number').map(Number);
      
      if (!isNaN(numericCurrent) && numericValues.length > 0) {
        newValue = numericValues.reduce((prev: number, curr: number) => 
          Math.abs(curr - numericCurrent) < Math.abs(prev - numericCurrent) ? curr : prev
        );
      } else {
        newValue = availableValues[0];
      }
    } else if (typeof currentValue === 'string') {
      newValue = availableValues.find((val: string | number) => 
        typeof val === 'string' && val.includes(currentValue)
      ) || availableValues[0];
    } else {
      newValue = availableValues[0];
    }
    
    if (newValue !== undefined && newValue !== currentValue && $self.setValue) {
      $self.setValue(newValue);
    }
  }
}
```

### 3. 在 Schema 中的应用

```typescript
thickness: {
  type: "string",
  title: "Board Thickness",
  "x-component": "TabSelect",
  "x-reactions": [
    // 第一步：更新选项
    {
      dependencies: ["layers", "outerCopperWeight", "innerCopperWeight"],
      fulfill: {
        state: {
          componentProps: "{{getThicknessOptionsForFormily($deps)}}"
        }
      }
    },
    // 第二步：基于新选项调整值
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

### 4. 关键优势

1. **✅ 职责分离**：每个 reaction 只做一件事
2. **✅ 无异步复杂性**：完全依赖 Formily 的同步机制
3. **✅ 无重试机制**：不需要猜测时序
4. **✅ 代码清晰**：意图明确，易于理解
5. **✅ 可靠性高**：利用 Formily 原生的依赖管理

### 5. 依赖说明

- `~dataSource`：监听 dataSource 的变化
- `when` 条件：确保所有依赖都准备好且 dataSource 不为空时才执行调整

## 🎨 在项目中的应用

### 当前使用的字段
- `thickness` - 板厚调整
- `minTrace` - 最小线宽调整  
- `minHole` - 最小孔径调整
- `silkscreen` - 丝印颜色调整

### 迁移建议

```javascript
// 从单一复杂 reaction
"x-reactions": {
  dependencies: ["layers", "outerCopperWeight", "innerCopperWeight"],
  fulfill: {
    state: { componentProps: "{{getThicknessOptionsForFormily($deps)}}" },
    run: "{{$deps[0] && (() => { setTimeout(() => runSmartAdjustment($self), 0); })()}}"
  }
}

// 改为分离的简单 reactions
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

## 🚀 进一步优化

### 1. 使用 Formily 的 effects 系统

```typescript
const form = createForm({
  effects: () => {
    onFieldReact('thickness', (field) => {
      // 在这里处理智能调整
      const dependencies = [
        field.query('layers').value,
        field.query('outerCopperWeight').value,
        field.query('innerCopperWeight').value
      ];
      
      if (dependencies.every(Boolean)) {
        // 执行调整逻辑
      }
    });
  }
});
```

### 2. 使用 Formily 的生命周期钩子

```typescript
"x-reactions": [{
  dependencies: ["layers", "outerCopperWeight", "innerCopperWeight"],
  when: "{{$deps.every(Boolean)}}",
  fulfill: {
    state: {
      componentProps: "{{getThicknessOptionsForFormily($deps)}}"
    }
  }
}, {
  dependencies: ["layers", "outerCopperWeight", "innerCopperWeight"],
  when: "{{$deps.every(Boolean)}}",
  fulfill: {
    run: "{{runSmartAdjustmentWithCheck($self, $deps)}}"
  }
}]
```

## 总结

**推荐使用方案4**：**分离关注点**，它提供了：
- ✅ 最清晰的代码结构
- ✅ 最简单的实现方式
- ✅ 最好的可维护性
- ✅ 完全依赖 Formily 原生机制

**核心理念**：不要试图 hack 系统，而是配合系统的设计理念工作。 