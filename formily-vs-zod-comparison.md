# Formily vs Zod 验证能力对比

## 当前混合架构的优势

### Zod 负责的部分 ✅
```typescript
// 复杂的条件验证
.refine((data) => {
  if (data.shipmentType === ShipmentType.Single && !data.singleCount) {
    return false;
  }
  return true;
}, {
  message: "Single count is required when shipment type is single",
  path: ["singleCount"],
})

// 类型安全的枚举
pcbType: z.nativeEnum(PcbType, { required_error: "Material type is required" })

// 自动类型推导
export type QuoteFormData = z.infer<typeof quoteSchema>;
```

### Formily 负责的部分 ✅
```typescript
// UI 交互和动态行为
"x-reactions": {
  dependencies: ["layers"],
  fulfill: {
    state: {
      visible: "{{$deps[0] >= 4}}"
    }
  }
}

// 组件渲染
"x-component": "TabSelect"
```

## 如果只用 Formily 的问题

### 1. 验证能力有限 ❌
```typescript
// Formily 的验证相对简单
{
  type: "string",
  required: true,
  "x-validator": "required" // 只能做基础验证
}

// 复杂的跨字段验证很困难
// 无法轻松实现 Zod 的 .refine() 功能
```

### 2. 类型安全性差 ❌
```typescript
// 没有自动类型推导
// 需要手动维护 TypeScript 类型
interface FormData {
  pcbType: string; // 手动定义，容易出错
  layers: number;
  // ... 50+ 字段都要手动维护
}
```

### 3. 枚举管理混乱 ❌
```typescript
// 枚举选项分散在各个地方
pcbType: {
  enum: [{ label: "FR-4", value: "FR-4" }] // 硬编码
}

// 无法统一管理和复用
```

## 推荐的最佳实践

### 保持当前混合架构，但可以优化

```typescript
// 1. 简化 Formily Schema，直接使用枚举
export const pcbFormilySchema: ISchema = {
  type: "object",
  properties: {
    pcbType: {
      type: "string",
      title: "Material Type",
      // 直接使用枚举，不从 Zod 提取
      enum: Object.values(PcbType).map(value => ({ 
        label: value, 
        value 
      })),
      "x-component": "TabSelect"
    }
  }
};

// 2. Zod 专注于验证和类型
export const quoteSchema = z.object({
  pcbType: z.nativeEnum(PcbType).default(PcbType.FR4),
  // ... 其他字段
});

// 3. 在表单提交时使用 Zod 验证
const handleSubmit = (values: any) => {
  const result = quoteSchema.safeParse(values);
  if (!result.success) {
    // 处理验证错误
    return;
  }
  // 提交验证通过的数据
  submitData(result.data);
};
```

## 结论

**建议保持 Zod + Formily 的混合架构**，但可以简化：

1. **Formily**：专注 UI 渲染和交互
2. **Zod**：专注数据验证和类型安全
3. **移除复杂的提取逻辑**：直接在 Formily 中使用枚举
4. **在关键节点使用 Zod 验证**：表单提交、API 调用等 