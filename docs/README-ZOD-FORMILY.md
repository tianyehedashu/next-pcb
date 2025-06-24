# 🎯 Zod + Formily 完美集成指南

## 概述

本项目实现了 **Zod** 和 **Formily** 的完美集成，让您享受到两个库的最佳特性：

- **Zod**: 强大的数据验证、类型推导、默认值管理
- **Formily**: 灵活的表单渲染、交互逻辑、动态联动

## 🚀 核心特性

### ✅ 类型安全
- 基于 Zod Schema 的完整类型推导
- TypeScript 全程支持，避免运行时错误

### ✅ 数据验证
- 实时验证（输入过程中的宽松验证）
- 提交验证（提交时的严格验证）
- 详细的错误信息展示

### ✅ 默认值管理
- 自动从 Zod Schema 提取默认值
- 安全的默认值回退机制

### ✅ 简洁的 API
- 一行代码即可创建完整的表单系统
- 提供多种使用模式（简单、高级、自定义）

## 📁 文件结构

```
app/quote2/schema/
├── zodFormilyIntegration.ts    # 核心集成逻辑
├── quoteSchema.ts              # Zod 验证 Schema
├── pcbFormilySchema.ts         # Formily UI Schema
└── shared-types.ts             # 共享类型定义

app/quote2/examples/
└── zodFormilyUsage.tsx         # 使用示例
```

## 🎯 基础使用

### 1. 最简单的使用方式

```tsx
import { useZodFormily } from '../schema/zodFormilyIntegration';
import { quoteSchema } from '../schema/quoteSchema';
import { pcbFormilySchema } from '../schema/pcbFormilySchema';

function MyForm() {
  const { form, handleSubmit } = useZodFormily({
    zodSchema: quoteSchema,
    formilySchema: pcbFormilySchema
  });

  return (
    <FormProvider form={form}>
      <SchemaField name="pcbType" schema={pcbFormilySchema} />
      <SchemaField name="layers" schema={pcbFormilySchema} />
      
      <Button onClick={() => {
        form.submit((values) => {
          handleSubmit(values, (validatedData) => {
            console.log('验证通过的数据:', validatedData);
          });
        });
      }}>
        提交
      </Button>
    </FormProvider>
  );
}
```

### 2. 完整功能使用

```tsx
function AdvancedForm() {
  const {
    form,
    schema,
    validationState,
    handleValidation,
    handleSubmit,
    defaultValues
  } = useZodFormily<QuoteFormData>({
    zodSchema: quoteSchema,
    formilySchema: pcbFormilySchema
  });

  // 处理提交
  const onSubmit = async (validatedData: QuoteFormData) => {
    // 这里的 validatedData 已经通过 Zod 验证
    console.log('✅ 验证通过:', validatedData);
  };

  // 处理重置
  const handleReset = () => {
    form.setInitialValues(defaultValues);
    form.reset();
  };

  return (
    <FormProvider form={form}>
      {/* 验证状态显示 */}
      <div className="validation-status">
        状态: {validationState.isValid ? '有效' : '无效'}
        {validationState.errors?.map(error => (
          <div key={error.path.join('.')}>
            {error.path.join('.')}: {error.message}
          </div>
        ))}
      </div>

      {/* 表单字段 */}
      <SchemaField name="pcbType" schema={schema} />
      <SchemaField name="layers" schema={schema} />

      {/* 操作按钮 */}
      <Button onClick={() => form.submit((values) => handleSubmit(values, onSubmit))}>
        提交表单
      </Button>
      <Button onClick={handleReset}>重置</Button>
      <Button onClick={() => handleValidation(form.values)}>手动验证</Button>
    </FormProvider>
  );
}
```

## 🔧 工具函数

### enumToFormilyOptions

将 TypeScript 枚举转换为 Formily 选项格式：

```tsx
import { enumToFormilyOptions } from '../schema/zodFormilyIntegration';
import { PcbType, ShipmentType } from '../schema/shared-types';

// 基础使用
const pcbTypeOptions = enumToFormilyOptions(PcbType);
// 结果: [{ label: "FR-4", value: "FR-4" }, ...]

// 带标签格式化
const shipmentOptions = enumToFormilyOptions(
  ShipmentType,
  (value) => value === ShipmentType.Single ? '单片出货' : '拼板出货'
);
// 结果: [{ label: "单片出货", value: "single" }, { label: "拼板出货", value: "panel" }]
```

### getZodDefaultValues

安全地从 Zod Schema 提取默认值：

```tsx
import { getZodDefaultValues } from '../schema/zodFormilyIntegration';

const defaultValues = getZodDefaultValues(quoteSchema);
// 自动提取所有字段的默认值
```

## 🎨 Schema 定义最佳实践

### 1. Zod Schema（数据层）

```tsx
// quoteSchema.ts - 专注数据验证和类型
export const quoteSchema = z.object({
  pcbType: z.nativeEnum(PcbType).default(PcbType.FR4),
  layers: z.number().int().min(1).max(20).default(2),
  thickness: z.number().positive().default(1.6),
  
  // 条件验证
}).refine((data) => {
  if (data.layers >= 4 && !data.innerCopperWeight) {
    return false;
  }
  return true;
}, {
  message: "4层以上必须指定内层铜厚",
  path: ["innerCopperWeight"],
});
```

### 2. Formily Schema（UI层）

```tsx
// pcbFormilySchema.ts - 专注 UI 渲染和交互
export const pcbFormilySchema: ISchema = {
  type: "object",
  properties: {
    pcbType: {
      type: "string",
      title: "PCB Type",
      "x-component": "TabSelect",
      "x-component-props": {
        options: enumToFormilyOptions(PcbType)
      }
    },
    
    innerCopperWeight: {
      type: "string",
      title: "Inner Copper Weight",
      "x-component": "Select",
      // 条件显示
      "x-reactions": {
        dependencies: ["layers"],
        fulfill: {
          state: {
            visible: "{{$deps[0] >= 4}}"
          }
        }
      }
    }
  }
};
```

## 🎪 高级功能

### 1. 自定义验证时机

```tsx
const { form, validateRealTime, validateForSubmit } = useZodFormily(config);

// 实时验证（宽松）
form.onFieldValueChange('*', (field) => {
  validateRealTime(form.values);
});

// 提交验证（严格）
form.onSubmit((values) => {
  const result = validateForSubmit(values);
  if (result.success) {
    // 提交数据
  }
});
```

### 2. 条件字段处理

```tsx
// 在 Formily Schema 中使用条件逻辑
"x-reactions": {
  dependencies: ["shipmentType"],
  fulfill: {
    state: {
      visible: "{{$deps[0] === 'panel'}}"
    }
  }
}

// 在 React 组件中使用条件渲染
<FormConsumer>
  {(form) => {
    const shipmentType = form.values.shipmentType;
    return shipmentType === ShipmentType.Panel && (
      <SchemaField name="panelSet" schema={schema} />
    );
  }}
</FormConsumer>
```

### 3. 错误处理

```tsx
const { validationState } = useZodFormily(config);

// 显示验证错误
{validationState.errors?.map((error, index) => (
  <div key={index} className="error">
    字段 {error.path.join('.')}: {error.message}
  </div>
))}
```

## 🔄 迁移指南

### 从纯 Formily 迁移

1. **保留现有的 Formily Schema**
2. **添加对应的 Zod Schema**
3. **使用 `useZodFormily` 替换 `createForm`**

```tsx
// 之前
const form = createForm({
  initialValues: { ... }
});

// 之后
const { form } = useZodFormily({
  zodSchema: yourZodSchema,
  formilySchema: yourFormilySchema
});
```

### 从纯 Zod 迁移

1. **保留现有的 Zod Schema**
2. **创建对应的 Formily Schema**
3. **使用集成 Hook**

## 📝 注意事项

### ✅ 推荐做法

- Zod Schema 专注数据验证逻辑
- Formily Schema 专注 UI 渲染逻辑
- 使用 `enumToFormilyOptions` 转换枚举
- 分离验证时机（实时 vs 提交）

### ❌ 避免的做法

- 不要在 Zod Schema 中混入 UI 逻辑
- 不要在 Formily Schema 中重复定义验证规则
- 不要忽略类型安全（充分利用 TypeScript）

## 🎯 完整示例

查看 `app/quote2/examples/zodFormilyUsage.tsx` 获取完整的使用示例，包括：

- 基础集成示例
- 高级功能示例
- 条件字段处理
- 错误处理
- 工具函数使用

## 🚀 最佳实践总结

1. **分离关注点**: Zod 管数据，Formily 管 UI
2. **类型安全**: 充分利用 TypeScript 类型推导
3. **渐进式采用**: 可以逐步迁移现有代码
4. **性能优化**: 合理使用 `React.useMemo` 和 `React.useCallback`
5. **错误处理**: 提供友好的用户体验 