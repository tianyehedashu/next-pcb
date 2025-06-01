# 🚀 简化的 Formily + Zod 架构方案

## 核心思路

**Formily 专注 UI 渲染，Zod 专注数据验证**

- ✅ Formily：表单渲染、交互逻辑、动态联动
- ✅ Zod：数据验证、类型推断、默认值
- ❌ 避免：复杂的 Zod 提取逻辑

## 简化前后对比

### ❌ 复杂版本（之前）
```typescript
// 复杂的 Zod 提取逻辑
function extractEnumOptions(zodType: ZodType): Array<{ label: string; value: string | number }> {
  if (zodType instanceof ZodDefault) {
    return extractEnumOptions(zodType._def.innerType);
  }
  if (zodType instanceof ZodEnum) {
    return zodType.options.map((value: unknown) => ({ 
      label: String(value), 
      value: value as string | number
    }));
  }
  if (zodType instanceof ZodNativeEnum) {
    return Object.values(zodType._def.values).map((value: unknown) => ({ 
      label: String(value), 
      value: value as string | number
    }));
  }
  return [];
}

function getEnumOptionsFromZod(fieldName: string): Array<{ label: string; value: string | number }> {
  const fieldSchema = getZodFieldSchema(fieldName);
  if (!fieldSchema) {
    console.warn(`No schema found for field: ${fieldName}`);
    return [];
  }
  const options = extractEnumOptions(fieldSchema);
  return options;
}

// 在 Schema 中使用
pcbType: {
  type: "string",
  title: "Material Type", 
  enum: getEnumOptionsFromZod("pcbType"), // 复杂！
  "x-component": "TabSelect"
}
```

### ✅ 简化版本（现在）
```typescript
// 简单的枚举转换
function enumToOptions<T extends Record<string, string | number>>(enumObj: T) {
  return Object.values(enumObj).map(value => ({ 
    label: String(value), 
    value 
  }));
}

// 在 Schema 中使用
pcbType: {
  type: "string",
  title: "Material Type", 
  enum: enumToOptions(PcbType), // 简单直接！
  "x-component": "TabSelect"
}
```

## 架构分工

### 🎯 Zod 负责（quoteSchema.ts）
```typescript
export const quoteSchema = z.object({
  pcbType: z.nativeEnum(PcbType).default(PcbType.FR4),
  layers: z.number().min(1).max(20).default(2),
  thickness: z.number().positive(),
  // ... 其他验证规则
}).refine((data) => {
  // 复杂的跨字段验证
  if (data.layers >= 4 && !data.innerCopperWeight) {
    return false;
  }
  return true;
}, {
  message: "4层以上必须指定内层铜厚"
});
```

### 🎯 Formily 负责（pcbFormilySchema.ts）
```typescript
export const pcbFormilySchema: ISchema = {
  type: "object",
  properties: {
    pcbType: {
      type: "string",
      title: "Material Type", 
      enum: enumToOptions(PcbType), // 直接使用枚举
      "x-component": "TabSelect"
    },
    
    innerCopperWeight: {
      type: "string", 
      title: "Inner Copper Weight",
      enum: enumToOptions(InnerCopperWeight),
      "x-component": "Select",
      "x-reactions": {
        dependencies: ["layers"],
        fulfill: {
          state: {
            visible: "{{$deps[0] >= 4}}", // UI 交互逻辑
            disabled: "{{$deps[0] < 4}}"
          }
        }
      }
    }
  }
};
```

### 🎯 表单组件中的使用
```typescript
import { Form } from '@formily/react';
import { pcbFormilySchema } from './schema/pcbFormilySchema';
import { quoteSchema } from './schema/quoteSchema';

export function QuoteForm() {
  const handleSubmit = (values: any) => {
    // 使用 Zod 进行最终验证
    const result = quoteSchema.safeParse(values);
    if (!result.success) {
      console.error('验证失败:', result.error);
      return;
    }
    
    // 提交验证通过的数据
    console.log('提交数据:', result.data);
  };

  return (
    <Form
      schema={pcbFormilySchema}
      onSubmit={handleSubmit}
    />
  );
}
```

## 优势总结

### ✅ 简化后的优势
1. **代码更简洁**：移除了复杂的 Zod 提取逻辑
2. **维护更容易**：枚举变更时只需更新一处
3. **性能更好**：避免了运行时的复杂解析
4. **类型安全**：TypeScript 自动推断枚举类型
5. **职责清晰**：Formily 管 UI，Zod 管验证

### ✅ 保留的优势
1. **Zod 验证**：复杂的业务规则验证
2. **类型推断**：自动生成 TypeScript 类型
3. **默认值**：统一的默认值管理
4. **Formily 交互**：丰富的 UI 交互能力

## 最佳实践

1. **枚举定义**：在 `shared-types.ts` 中统一定义
2. **简单转换**：使用 `enumToOptions` 转换为 Formily 格式
3. **动态逻辑**：复杂的动态选项放在 `formilyHelpers.ts`
4. **验证分离**：表单提交时使用 Zod 验证
5. **类型安全**：利用 TypeScript 确保类型一致性

这样的架构既保持了代码的简洁性，又充分发挥了 Zod 和 Formily 各自的优势！ 