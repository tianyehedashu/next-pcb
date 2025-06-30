# ShippingEstimator 组件名称修复

## 🚨 问题描述

出现以下React组件大小写错误：
```
Error: <ShippingEstimator /> is using incorrect casing. Use PascalCase for React components, or lowercase for HTML elements.
```

## 🔍 问题根因

在 `stencilFormilySchema.ts` 中，运费估算字段使用了错误的组件名称：

```typescript
// ❌ 错误：使用了不存在的组件名
"x-component": "ShippingEstimator",
```

但在 `FormilyComponents.tsx` 中实际定义的组件名称是：

```typescript
// ✅ 正确：实际存在的组件名
ShippingCostEstimation: (props: FormilyFieldProps) => { ... }
```

## ✅ 修复方案

修改 `app/quote2/schema/stencilFormilySchema.ts` 中的组件引用：

```typescript
shippingCostEstimation: fullWidth({
  type: "object",
  title: "Shipping Cost Estimation",
- "x-component": "ShippingEstimator",     // 错误的组件名
+ "x-component": "ShippingCostEstimation", // 正确的组件名
  // ...
})
```

## 🎯 修复效果

- ✅ 消除了React组件大小写错误
- ✅ 钢网运费估算功能正常工作
- ✅ 与现有的PCB运费估算组件保持一致
- ✅ 不影响任何现有功能

## 📋 相关文件

- `app/quote2/schema/stencilFormilySchema.ts` - 修复的schema文件
- `app/quote2/components/FormilyComponents.tsx` - 组件定义文件

这是一个简单的命名不匹配问题，修复后钢网的运费估算功能可以正常使用了。 