# PCB 报价公式分析与建议

## 1. 公式整体结构

本项目的PCB报价公式采用参数化、全字段参与的方式，参考了PCBWay、JLCPCB等主流PCB打样网站的计价规则，并结合了实际工厂经验。所有表单字段（基础信息、工艺信息、服务信息）均纳入计价，便于灵活维护和扩展。

公式主结构如下：

- **基础价**（20元）
- **面积单价**（面积 × 0.05元/mm²）
- **层数加价**（每多2层+8元）
- **各参数加价**（见下文详细分解）
- **数量折扣**（批量越大单价越低）
- **最低价保护**（最低30元）

## 2. 字段影响详解

### 基础信息（BaseInfoSection）
- **pcbType**：板材类型。FR-4不加价，铝基板、Rogers、柔性板、刚柔结合板等特殊板材分别加价30~60元。
- **layers**：层数。2层起步，每多2层+8元。
- **thickness**：板厚。未单独加价（可补充：超厚/超薄板可加价）。
- **boardColor**：板色。绿色不加价，其他颜色+5元。
- **hdi**：HDI工艺。1step/2step/3step分别加价30/50/80元。
- **tg**：TG值。TG170不加价，TG150/TG135分别+10/20元。
- **panelCount**：拼板数。每多1块+5元。
- **shipmentType**：出货方式。单片不加价，拼板/代理拼板+10/20元。
- **singleLength/singleWidth**：尺寸。面积越大总价越高。
- **singleCount**：单板数。影响总数量。
- **border**：工艺边。无边+10元，有边不加价。

### 工艺信息（ProcessInfoSection）
- **copperWeight**：铜厚。1oz不加价，每多1oz+10元。
- **minTrace**：最小线宽线距。6/6及以上不加价，更小线宽+10~30元。
- **minHole**：最小孔径。0.3mm不加价，更小孔径+10~20元。
- **solderMask**：阻焊色。绿色不加价，其他+5元。
- **silkscreen**：字符色。白/黑不加价。
- **surfaceFinish**：表面处理。HASL不加价，其他工艺+5~15元。
- **impedance**：阻抗控制。需要时+20元。
- **castellated**：半孔。需要时+10元。
- **goldFingers**：金手指。需要时+20元。
- **edgePlating**：边镀金。需要时+20元。
- **halfHole**：半孔数量。每侧+5元。
- **edgeCover**：边覆盖。每侧+5元。
- **maskCover**：阻焊覆盖。plug/plug_flat+10元。
- **flyingProbe**：飞针测试。需要时+10元。

### 服务信息（ServiceInfoSection）
- **testMethod**：测试方式。免费不加价，付费+10元。
- **prodCap**：产能确认。手动+10元。
- **productReport**：产品报告。每项+5元。
- **rejectBoard**：不良板处理。拒收+10元。
- **yyPin**：阴阳针。需要+10元。
- **customerCode**：客户加码。加码+10元，指定位置+15元。
- **payMethod**：付款方式。手动+5元。
- **qualityAttach**：质检附件。全检+20元。
- **smt**：SMT贴片。需要+50元。

### 数量折扣
- 50~99片：95折
- 100~499片：9折
- 500~999片：85折
- 1000片及以上：8折

### 最低价保护
- 总价最低为30元

## 3. 补充完善建议

1. **板厚加价**：目前未对thickness字段做加价，建议对超厚/超薄板（如0.6mm、3.2mm等）适当加价。
2. **特殊字符色**：如后续支持更多字符色，可补充加价项。
3. **特殊工艺**：如盲埋孔、特殊阻焊、特殊叠层等，可继续扩展加价项。
4. **多币种/多地区**：如需支持国际化，建议将单价、加价项参数化。
5. **明细展示**：可在前端展示每项加价明细，提升用户信任。
6. **后端统一**：如业务复杂，建议将计价逻辑后端化，前端仅展示。
7. **动态配置**：可将加价项维护在配置文件或数据库，便于运营灵活调整。
8. **最低起订量**：如有MOQ需求，可增加最低起订量逻辑。
9. **工厂/渠道差异**：如有多工厂/多渠道，可按工厂/渠道切换加价表。

## 4. 总结

本公式已覆盖绝大多数PCB打样/小批量场景，结构清晰、易维护、易扩展。后续可根据实际业务需求灵活调整和补充。

如需进一步优化或有特殊业务场景，建议结合实际工厂报价规则持续完善。

## 5. 新版计价公式核心逻辑

新版计价公式已支持"单片出货"与"联片出货"两种模式，具体如下：

### 出货形式联动逻辑

- **单片出货（Single Piece）**
  - 数量（qty）：`singleCount`，单位为 Pcs
  - 面积（area）：`singleLength * singleWidth`，为单片尺寸
  - 总价 = 单片单价 × 数量 × 折扣

- **联片出货（Panel by file / Panel Agent）**
  - 数量（qty）：`singleCount`，单位为 Set（套）
  - 面积（area）：`singleLength * singleWidth`，为联片尺寸
  - 若有 `panelSetCount` 字段，则总数量 = `singleCount * panelSetCount`（即总单片数）
  - 总价 = 联片单价 × 总数量 × 折扣

- **其它参数**
  - 层数、板材、工艺、表面处理等所有字段均参与加价，详见下方"全字段加价项"。
  - 数量折扣：批量越大单价越低，折扣规则见代码注释。
  - 最低价保护：总价最低为30元。

### 公式伪代码

```ts
if (shipmentType === 'single') {
  qty = singleCount;
  area = singleLength * singleWidth;
} else if (shipmentType === 'panel' || shipmentType === 'panel_agent') {
  qty = singleCount;
  area = singleLength * singleWidth;
  if (panelSetCount) {
    qty = qty * panelSetCount;
  }
}
// price = (基础价 + 面积 + 层数 + ...所有参数加价) * qty * 折扣
```

## 6. 主要参数说明
- `singleCount`：单片/联片数量（Pcs/Set）
- `singleLength`、`singleWidth`：单片/联片尺寸
- `panelSetCount`：每套联片包含的单片数（如有）
- 其它参数见代码注释

## 7. 典型场景举例
- 单片出货：10片 5x5cm，qty=10，area=25
- 联片出货：5套 10x10cm，每套含4片，qty=5*4=20，area=100

## 8. 维护建议
- 若有新出货类型或panel规则，需同步调整UI、详情页和计价公式
- 详情页、表单、计价公式三者参数需完全一致

---

其余全字段加价项、折扣、最低价保护等逻辑详见源码注释。 