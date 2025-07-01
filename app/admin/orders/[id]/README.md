# 管理员订单详情页面架构

## 概述

本页面提供了可扩展的多产品类型订单管理功能，支持PCB、钢网、SMT等不同产品类型的统一管理。

## 核心特性

### 多产品类型支持
- ✅ **PCB制造**: 完整的PCB规格审核、价格计算、交期管理
- ✅ **钢网制造**: 完整的钢网规格审核、价格计算、交期管理  
- 🔄 **SMT贴片**: 开发中，预留接口
- 🔄 **混合订单**: 支持PCB+SMT等组合订单

### 架构设计

#### 1. 产品类型检测与管理
```typescript
// utils/productTypeUtils.ts
export enum ProductType {
  PCB = 'pcb',
  STENCIL = 'stencil', 
  SMT = 'smt',
  PCB_SMT = 'pcb_smt',
  HYBRID = 'hybrid'
}

// 自动检测订单产品类型
const productType = detectProductType(order);
```

#### 2. 组件化规格审核
- `PCBSpecReview.tsx` - PCB规格审核组件
- `StencilSpecReview.tsx` - 钢网规格审核组件
- 未来可扩展：`SMTSpecReview.tsx`、`HybridSpecReview.tsx`

#### 3. 统一计算结果面板
```typescript
// components/CalculationResultPanels.tsx
<CalculationResultPanels 
  order={order}           // 完整订单数据
  pcbFormData={pcbData}   // 向后兼容
  calculationNotes={notes}
  deliveryNotes={deliveryNotes}
  shippingNotes={shippingNotes}
/>
```

#### 4. 动态订单概览
- 根据产品类型显示相应的字段标签
- 自动适配不同产品的文件下载功能
- 产品类型标识徽章

#### 5. 可扩展文件管理系统
```typescript
// utils/fileUploadUtils.ts
export enum FileType {
  GERBER = 'gerber',           // PCB制造文件
  STENCIL_DESIGN = 'stencil_design', // 钢网设计文件
  SMT_BOM = 'smt_bom',         // SMT物料清单
  // 支持多种文件类型...
}

// 产品文件配置
export const productFileConfigs: Record<ProductType, FileConfig[]> = {
  [ProductType.PCB]: [/* PCB相关文件配置 */],
  [ProductType.STENCIL]: [/* 钢网相关文件配置 */],
  [ProductType.SMT]: [/* SMT相关文件配置 */]
};
```

- 支持不同产品类型的文件验证规则
- 自动文件完整性检查
- 按文件类别分组显示
- 文件上传状态跟踪

## 扩展指南

### 添加新产品类型

1. **更新产品类型枚举**
```typescript
// utils/productTypeUtils.ts
export enum ProductType {
  // 现有类型...
  NEW_PRODUCT = 'new_product'
}
```

2. **添加产品类型配置**
```typescript
export const productTypeConfig = {
  [ProductType.NEW_PRODUCT]: {
    type: ProductType.NEW_PRODUCT,
    label: '新产品',
    description: '新产品制造',
    specField: 'new_product_spec',
    calculatorType: 'new_product'
  }
};
```

3. **创建规格审核组件**
```typescript
// components/NewProductSpecReview.tsx
export function NewProductSpecReview({ specData, shippingAddress }) {
  // 新产品规格审核逻辑
}
```

4. **添加计算器支持**
```typescript
// CalculationResultPanels.tsx
function NewProductPriceCalculation({ specData, calculationNotes }) {
  // 新产品价格计算逻辑
}

function NewProductDeliveryCalculation({ specData }) {
  // 新产品交期计算逻辑
}
```

5. **更新主页面渲染逻辑**
```typescript
// page.tsx - 技术规格审核部分
case ProductType.NEW_PRODUCT:
  if (specData) {
    return (
      <NewProductSpecReview 
        specData={specData}
        shippingAddress={order?.shipping_address}
      />
    );
  }
  break;
```

### 数据库字段约定

每种产品类型应该有对应的规格字段：
- `pcb_spec` - PCB规格数据
- `stencil_spec` - 钢网规格数据  
- `smt_spec` - SMT规格数据
- `new_product_spec` - 新产品规格数据

### 文件字段约定

每种文件类型都有对应的URL字段：
- `gerber_file_url` - Gerber文件
- `stencil_design_file_url` - 钢网设计文件
- `smt_bom_file_url` - SMT物料清单
- `drill_file_url` - 钻孔文件
- `dxf_file_url` - DXF文件
- `specification_file_url` - 规格文档
- `file_upload_status` - 文件上传状态(JSONB)
- `file_validation_results` - 文件验证结果(JSONB)

### 添加新文件类型

1. **定义文件类型**
```typescript
// utils/fileUploadUtils.ts
export enum FileType {
  NEW_FILE_TYPE = 'new_file_type'
}
```

2. **配置文件规则**
```typescript
export const productFileConfigs = {
  [ProductType.NEW_PRODUCT]: [
    {
      type: FileType.NEW_FILE_TYPE,
      label: '新文件类型',
      description: '新文件类型描述',
      acceptedExtensions: ['.ext'],
      maxSize: 20,
      required: true,
      bucket: 'new_bucket',
      validationRules: [/* 验证规则 */]
    }
  ]
};
```

3. **添加数据库字段**
```sql
ALTER TABLE pcb_quotes 
ADD COLUMN new_file_type_url TEXT;
```

### 向后兼容性

当前设计保持向后兼容：
- 仍支持旧的`pcbFormData`参数传递
- 自动检测产品类型，默认为PCB
- 保持现有API接口不变

## 文件结构

```
app/admin/orders/[id]/
├── page.tsx                    # 主页面
├── utils/
│   ├── productTypeUtils.ts     # 产品类型工具
│   └── fileUploadUtils.ts      # 文件上传工具
├── components/
│   ├── OrderOverview.tsx       # 订单概览（多产品类型支持）
│   ├── OrderFileManager.tsx    # 文件管理组件（多产品类型）
│   ├── PCBSpecReview.tsx       # PCB规格审核
│   ├── StencilSpecReview.tsx   # 钢网规格审核
│   ├── CalculationResultPanels.tsx # 计算结果面板（多产品类型）
│   ├── ReviewStatusPanel.tsx   # 审核状态面板
│   ├── PriceManagementPanel.tsx # 价格管理面板
│   └── ManagementActionsPanel.tsx # 管理操作面板
└── README.md                   # 本文档
```

## 使用示例

### 钢网订单处理
```typescript
// 订单数据结构
{
  id: "order_123",
  product_type: "stencil",
  stencil_spec: {
    borderType: "framework",
    size: "420x520", 
    quantity: 10,
    thickness: 0.12,
    electropolishing: "electropolishing"
  },
  shipping_address: { ... }
}

// 自动检测为钢网类型，显示钢网规格审核组件
// 使用钢网计算器计算价格和交期
// 显示钢网特定的管理字段
```

### 混合订单处理  
```typescript
// PCB+SMT组合订单
{
  id: "order_456", 
  product_type: "pcb_smt",
  pcb_spec: { ... },
  smt_spec: { ... }
}

// 同时显示PCB和SMT规格审核组件
// 分别计算各产品类型的价格和交期
```

### 文件管理示例

```typescript
// 使用文件管理组件
<OrderFileManager 
  order={order}
  readOnly={false}
  onFileUpload={async (fileType, file) => {
    // 实现文件上传逻辑
    const uploadResult = await uploadFile(file, fileType);
    await updateOrderFile(order.id, fileType, uploadResult.url);
  }}
  onFileDelete={async (fileType) => {
    // 实现文件删除逻辑
    await deleteOrderFile(order.id, fileType);
  }}
/>

// 检查文件完整性
const fileValidation = validateOrderFiles(order, productType);
if (!fileValidation.isComplete) {
  console.log('缺少必需文件:', fileValidation.missingFiles);
}

// 验证单个文件
const validation = await validateFile(file, FileType.GERBER, ProductType.PCB);
if (!validation.valid) {
  console.log('文件验证失败:', validation.errors);
}
```

## 注意事项

1. **性能优化**: 大数据量时考虑懒加载组件
2. **错误处理**: 每个计算器都应有错误降级机制  
3. **类型安全**: 使用TypeScript严格类型检查
4. **测试覆盖**: 为每种产品类型添加单元测试

## 更新日志

- **v1.0**: 初始版本，支持PCB
- **v1.1**: 添加钢网支持，重构为多产品类型架构
- **v1.2**: 预留SMT和混合订单接口
- **v1.3**: 完善文件管理系统
  - 新增 `OrderFileManager` 组件，支持多产品类型文件管理
  - 新增 `fileUploadUtils.ts` 工具，提供文件验证和配置
  - 添加数据库字段支持多种文件类型
  - 实现文件完整性检查和状态跟踪
  - 支持文件分类显示和批量操作 