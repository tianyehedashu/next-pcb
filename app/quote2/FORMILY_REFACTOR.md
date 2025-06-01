# Formily 表单重构：从 PCBFieldRule 到 Schema 模式

## 问题分析

你的问题很有见地！当前使用 `PCBFieldRule` 的方式确实不是 Formily 的最佳实践。

### 当前实现的问题

1. **混合了业务逻辑和 UI 逻辑**：`PCBFieldRule` 把字段配置、组件映射、业务规则混在一起
2. **不符合 Formily 设计理念**：Formily 推荐使用 Schema 统一管理表单结构
3. **维护困难**：规则分散在多个地方，难以统一管理和调试
4. **类型安全性差**：手动处理 reactions，容易出错

## 最佳实践重构方案

### 1. 使用 Formily ISchema

```typescript
// 新方案：app/quote2/schema/pcbFormilySchema.ts
export const pcbFormilySchema: ISchema = {
  type: "object",
  properties: {
    thickness: {
      type: "number",
      title: "Thickness",
      "x-component": "Select",
      "x-component-props": {
        unit: "mm"
      },
      default: 1.6,
      required: true,
      "x-reactions": {
        dependencies: ["layers", "outerCopperWeight", "innerCopperWeight"],
        fulfill: {
          state: {
            componentProps: "{{getThicknessOptions($deps)}}"
          }
        }
      }
    }
  }
};
```

### 2. 分离动态逻辑

```typescript
// app/quote2/schema/formilyHelpers.ts
export function getThicknessOptions([layers, outerCopper, innerCopper]: [number, string, string]) {
  // 业务逻辑独立管理
  const all = [0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.6, 2.0, 2.4, 3.0, 3.2];
  let filtered = all;
  
  // 层数和铜厚限制逻辑
  if (layers >= 16) {
    filtered = filtered.filter(v => v >= 2);
  }
  // ...更多业务规则
  
  return {
    options: filtered.map(value => ({ label: `${value}mm`, value }))
  };
}
```

### 3. 使用 SchemaField 渲染

```typescript
// 新的页面实现
const SchemaField = createSchemaField({
  components: {
    Input, Select, Checkbox, // ...组件映射
  },
  scope: FormilyHelpers, // 注入辅助函数
});

export default function QuotePageFormily() {
  return (
    <FormProvider form={form}>
      <SchemaField schema={pcbFormilySchema} />
    </FormProvider>
  );
}
```

## 优势对比

### 当前方案 (PCBFieldRule)
```typescript
// ❌ 问题：混合了太多职责
export type PCBFieldRule<T = unknown> = {
  label: string;
  component: ComponentType;
  options: T[] | ((form: PcbQuoteForm) => T[]);
  default: T | ((form: PcbQuoteForm) => T);
  required: boolean;
  shouldShow?: (form: PcbQuoteForm) => boolean;
  shouldDisable?: (form: PcbQuoteForm) => boolean;
  // ...更多混合的配置
};

// ❌ 手动处理联动，容易出错
function AutoField({ name }: { name: FieldName }) {
  const rule: PCBFieldRule = pcbFieldRules[name];
  // 手动处理 reactions
  reactions={(field) => {
    if (typeof rule.options === "function") {
      const dynamicOptions = rule.options(form);
      field.componentProps.options = dynamicOptions;
    }
    // ...更多手动逻辑
  }}
}
```

### 新方案 (Formily Schema)
```typescript
// ✅ 优势：职责分离，符合 Formily 设计理念
export const pcbFormilySchema: ISchema = {
  type: "object",
  properties: {
    thickness: {
      // 清晰的字段定义
      type: "number",
      title: "Thickness", 
      "x-component": "Select",
      // 声明式的联动规则
      "x-reactions": {
        dependencies: ["layers", "outerCopperWeight", "innerCopperWeight"],
        fulfill: {
          state: {
            componentProps: "{{getThicknessOptions($deps)}}"
          }
        }
      }
    }
  }
};

// ✅ 业务逻辑独立，易测试
export function getThicknessOptions([layers, outerCopper, innerCopper]) {
  // 纯函数，易于测试和维护
}
```

## 重构建议

### 1. 立即可行的重构
- 创建新的 Schema 文件 (`pcbFormilySchema.ts`)
- 将动态逻辑提取到独立的辅助函数中
- 逐步迁移字段配置

### 2. 长期规划
- 完全移除 `PCBFieldRule` 类型
- 使用 Formily 的表单验证替代 Zod（或结合使用）
- 建立统一的表单配置管理模式

### 3. 迁移策略
```typescript
// 步骤1：保持向后兼容，新增 Schema 版本
// app/quote2/page-formily.tsx

// 步骤2：逐步迁移现有字段
// 优先迁移复杂的联动字段

// 步骤3：完成迁移后移除旧代码
```

## ✅ **完整的 Zod 集成方案**

### 问题：缺失字段和不充分的校验

你的观察完全正确！原始的 `quoteSchema` 确实缺少了很多重要字段。我已经完善了 zod schema：

### 完善后的 Zod Schema 特性

1. **✅ 完整字段覆盖**：
   ```typescript
   // 新增了所有缺失字段
   hdi: z.nativeEnum(HdiType).optional(),
   holeCount: z.number().int().min(0).optional(),
   halfHole: z.string().optional(),
   edgeCover: z.string().optional(),
   shippingAddress: addressSchema, // 完整地址校验
   customs: customsDeclarationSchema.optional(),
   customsNote: z.string().max(500).optional(),
   userNote: z.string().max(1000).optional(),
   // ...更多字段
   ```

2. **✅ 强类型校验**：
   ```typescript
   // 使用 enum 替代 string
   pcbType: z.nativeEnum(PcbType, { required_error: "Material type is required" }),
   layers: z.number().int().min(1).max(20, "Max 20 layers"),
   thickness: z.number().positive().min(0.1).max(10),
   ```

3. **✅ 条件校验规则**：
   ```typescript
   .refine((data) => {
     // 单片出货必须有数量
     if (data.shipmentType === ShipmentType.Single && !data.singleCount) {
       return false;
     }
     return true;
   }, {
     message: "Single count is required when shipment type is single",
     path: ["singleCount"],
   })
   .refine((data) => {
     // ENIG 表面处理必须选择厚度
     if (data.surfaceFinish === SurfaceFinish.Enig && !data.surfaceFinishEnigType) {
       return false;
     }
     return true;
   }, {
     message: "ENIG thickness is required when surface finish is ENIG",
     path: ["surfaceFinishEnigType"],
   })
   ```

4. **✅ 嵌套对象校验**：
   ```typescript
   // 地址校验
   const addressSchema = z.object({
     country: z.string().min(1, "Country is required"),
     city: z.string().min(1, "City is required"),
     address: z.string().min(1, "Address is required"),
     zipCode: z.string().min(1, "Zip code is required"),
     contactName: z.string().min(1, "Contact name is required"),
   });

   // 报关信息校验
   const customsDeclarationSchema = z.object({
     declarationMethod: z.string().optional(),
     taxId: z.string().optional(),
     companyName: z.string().optional(),
     customsNote: z.string().max(500).optional(),
   });
   ```

### Formily + Zod 最佳实践

```typescript
// 表单提交时使用 zod 进行最终校验
const handleSubmit = async (values: QuoteFormData) => {
  try {
    // 🎯 双重保障：Formily 实时校验 + Zod 最终校验
    const validatedData = quoteSchema.parse(values);
    console.log("✅ 表单校验通过:", validatedData);
    
    // 调用API提交数据
    await submitQuote(validatedData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ 数据校验失败:", error.issues);
      // 显示具体的校验错误信息
    }
  }
};
```

### 对比原始实现

**之前 (不完整)：**
- ❌ 缺少 20+ 重要字段
- ❌ 简单的 string 校验
- ❌ 没有条件校验
- ❌ 缺少嵌套对象校验

**现在 (完整)：**
- ✅ 覆盖所有 `PcbQuoteForm` 字段  
- ✅ 强类型 enum 校验
- ✅ 复杂条件校验规则
- ✅ 完整嵌套对象校验
- ✅ Formily Schema 与 Zod 无缝集成

## 总结

使用 Formily Schema 的方式确实是更好的选择，它提供了：

1. **更好的可维护性**：Schema 统一管理，逻辑分离
2. **更强的类型安全**：Formily 内置类型支持
3. **更清晰的架构**：符合 Formily 设计理念
4. **更好的开发体验**：声明式配置，减少手动处理
5. **完整的数据校验**：Formily 实时校验 + Zod 最终校验的双重保障

建议按照上述方案逐步重构，这将大大提升代码质量、开发效率和维护性！ 