# PCB Quote Form Fields

This document describes all fields in the `pcb_quotes` table, which are used to store PCB quote requests submitted from the website form. Each field is explained with its type and meaning.

| Field Name      | Type      | Description |
|-----------------|-----------|-------------|
| id              | bigint    | 主键，自增。|
| pcbType         | text      | PCB基材类型（如FR-4、铝基、Rogers、柔性板、刚挠结合板）。|
| layers          | integer   | PCB层数（如2、4、6等）。|
| thickness       | text      | 板厚（毫米），如1.6。|
| hdi             | text      | HDI类型（高密度互连），如无、1阶、2阶、3阶。|
| tg              | text      | TG值（玻璃化转变温度），如TG170、TG150、TG135。|
| panelCount      | integer   | 文件中不同面板的数量。|
| shipmentType    | text      | 出货方式（单片、拼板、代理拼板）。|
| singleLength    | numeric   | 单块PCB长度（厘米）。|
| singleWidth     | numeric   | 单块PCB宽度（厘米）。|
| singleCount     | integer   | 单次下单的单块数量。|
| border          | text      | 工艺边宽度（毫米），如无、5、10。|
| surfaceFinish   | text      | 表面处理类型（如HASL、ENIG、OSP等）。|
| copperWeight    | text      | 铜厚（盎司）。|
| minTrace        | text      | 最小线宽/线距（mil），如6/6、4/4。|
| minHole         | text      | 最小孔径（毫米），如0.2、0.3。|
| solderMask      | text      | 阻焊颜色（如绿色、蓝色、红色等）。|
| silkscreen      | text      | 丝印颜色（如白色、黑色）。|
| goldFingers     | text      | 是否需要金手指（yes/no）。|
| castellated     | text      | 是否需要半孔（yes/no）。|
| impedance       | text      | 是否需要阻抗控制（yes/no）。|
| flyingProbe     | text      | 是否需要飞针测试（yes/no）。|
| quantity        | integer   | 下单数量。|
| delivery        | text      | 交付方式（如标准、加急）。|
| gerber          | text      | Gerber文件名或引用。|
| maskCover       | text      | 阻焊覆盖方式（如盖、开窗、塞孔、塞平）。|
| edgePlating     | text      | 是否需要板边电镀（yes/no）。|
| halfHole        | text      | 是否需要半孔（无、1、2等）。|
| edgeCover       | text      | 是否需要板边覆盖（无、1、2等）。|
| testMethod      | text      | 测试方式（免费、付费）。|
| prodCap         | text      | 生产能力确认（无、手动、自动）。|
| productReport   | jsonb     | 产品报告选项（数组，如出货报告、切割、样品）。|
| rejectBoard     | text      | 不良板处理（接受/拒绝）。|
| yyPin           | text      | 是否需要阴阳针（无/需要）。|
| customerCode    | text      | 客户编码（添加、指定位置、不添加）。|
| payMethod       | text      | 支付方式（自动/手动）。|
| qualityAttach   | text      | 附加品质要求（标准/全检）。|
| smt             | text      | 是否需要SMT贴片（需要/不需要）。|
| created_at      | timestamp | 记录创建时间（UTC）。|

---

**Note:**
- All fields are optional except `id` and `created_at` (auto-generated).
- `productReport` is a JSON array to support multiple selections.
- Field values should match the options provided in the website form for consistency. 