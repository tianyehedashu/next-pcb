# PCB 材料类型架构设计

## 当前状态

目前系统仅支持 **FR-4** 材料类型，这是最常用的PCB基板材料，适合大多数电子产品应用。

### 现有实现
- `PcbType` 枚举：只包含 `FR4 = 'FR-4'`
- 单一表单配置：所有字段都基于FR-4材料设计
- Material Type 字段显示为选项卡形式，当前只有一个选项

## 设计挑战

不同PCB材料类型需要完全不同的表单配置：

### FR-4 (标准阻燃材料)
- **特点**：通用性强，工艺成熟，成本低
- **专用字段**：`useShengyiMaterial`、`tg`、`hdi`
- **层数**：支持1-20层
- **厚度范围**：0.2mm - 3.2mm
- **表面处理**：支持所有类型

### Aluminum (铝基板)
- **特点**：散热性能优异，适合大功率应用
- **专用字段**：`thermalConductivity`、`aluminumThickness`
- **层数**：通常只支持单层
- **厚度范围**：0.8mm - 3.0mm
- **表面处理**：只支持HASL、OSP等

### Rogers (高频材料)
- **特点**：低损耗，适合高频应用
- **专用字段**：`dielectricConstant`、`lossTangent`
- **工艺限制**：某些表面处理不适用
- **成本**：较高

### Flex (柔性板)
- **特点**：可弯曲，适合可穿戴设备
- **专用字段**：`bendRadius`、`flexZones`、`coverlay`
- **层数**：通常1-4层
- **工艺特殊性**：不支持某些表面处理

### Rigid-Flex (刚柔结合)
- **特点**：结合刚性和柔性区域
- **专用字段**：`rigidLayers`、`flexLayers`、`transitionZones`
- **复杂性**：需要同时配置刚性区和柔性区参数

## 推荐架构方案

### 方案1：材料专用Schema (推荐)
```typescript
// 为每种材料类型创建独立的schema文件
schemas/
  ├── fr4Schema.ts       // FR-4 专用配置
  ├── aluminumSchema.ts  // 铝基板专用配置
  ├── rogersSchema.ts    // Rogers 专用配置
  ├── flexSchema.ts      // 柔性板专用配置
  └── rigidFlexSchema.ts // 刚柔结合专用配置

// 根据材料类型动态加载对应schema
const getSchemaByMaterial = (pcbType: PcbType) => {
  switch(pcbType) {
    case PcbType.FR4: return fr4Schema;
    case PcbType.Aluminum: return aluminumSchema;
    // ... 其他材料类型
  }
}
```

**优点**：
- 每种材料有清晰独立的配置
- 避免复杂的条件逻辑
- 易于维护和扩展
- 类型安全

**缺点**：
- 代码重复（共同字段需要在多个schema中定义）
- 初期开发工作量较大

### 方案2：基础Schema + 材料扩展
```typescript
// 基础schema包含所有材料共有字段
const baseSchema = {
  layers, thickness, dimensions, shipment, ...
}

// 材料专用扩展
const materialExtensions = {
  [PcbType.FR4]: { useShengyiMaterial, tg, hdi },
  [PcbType.Aluminum]: { thermalConductivity, aluminumThickness },
  // ...
}

// 运行时合并
const finalSchema = mergeSchemas(baseSchema, materialExtensions[pcbType]);
```

**优点**：
- 减少代码重复
- 共有字段统一管理
- 材料专用字段独立维护

**缺点**：
- 动态合并逻辑复杂
- 运行时类型检查困难

### 方案3：单一Schema + 条件显示
```typescript
// 所有字段都在一个schema中，使用条件控制显示
const unifiedSchema = {
  // FR-4 专用字段
  useShengyiMaterial: {
    "x-reactions": {
      dependencies: ["pcbType"],
      fulfill: { state: { visible: "{{$deps[0] === 'FR-4'}}" } }
    }
  },
  // 铝基板专用字段
  thermalConductivity: {
    "x-reactions": {
      dependencies: ["pcbType"],
      fulfill: { state: { visible: "{{$deps[0] === 'Aluminum'}}" } }
    }
  }
}
```

**优点**：
- 实现简单
- 所有配置集中管理

**缺点**：
- 随着材料类型增加，条件逻辑变得复杂
- schema文件变得庞大
- 性能影响（所有字段都需要加载）

## 实施建议

### 阶段1：当前状态 (已完成)
- ✅ 只支持FR-4材料
- ✅ 简化的enum定义
- ✅ 单一表单配置

### 阶段2：架构准备
- ✅ 创建 `materialSchemas.ts` 配置管理
- ✅ 定义材料配置接口
- ✅ 建立可扩展的基础架构

### 阶段3：逐步扩展 (未来)
1. **添加铝基板支持**
   - 创建 `aluminumSchema.ts`
   - 更新 `PcbType` 枚举
   - 实现材料选择逻辑

2. **添加其他材料类型**
   - Rogers、Flex、Rigid-Flex
   - 每种材料独立开发和测试

3. **优化用户体验**
   - 材料选择导向页面
   - 根据用途推荐材料类型
   - 材料对比功能

## 技术实现细节

### 当前文件结构
```
app/quote2/schema/
├── shared-types.ts          // 共用类型定义
├── pcbFormilySchema.ts     // 当前FR-4表单配置
├── materialSchemas.ts      // 材料配置管理（新增）
└── quoteSchema.ts          // Zod验证schema
```

### 数据库考虑
- 现有表结构主要基于FR-4设计
- 未来可能需要材料特定的字段表
- 建议使用 JSON 字段存储材料专用参数

### 前端组件影响
- `QuoteForm` 组件需要支持动态schema加载
- 可能需要材料选择向导组件
- 表单验证逻辑需要适配不同材料

## 总结

当前的单一FR-4支持方案符合业务现状，同时我们已经建立了可扩展的架构基础。推荐采用**材料专用Schema**方案，在需要支持新材料类型时，可以独立开发对应的表单配置，确保代码质量和用户体验。 