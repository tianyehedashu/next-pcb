# 扩展文件格式支持文档

## 🎯 支持格式大幅扩展

我们已经大幅扩展了文件上传功能，现在支持几乎所有主流 CAD 软件的输出格式！

## 📁 压缩文件格式

- ✅ **ZIP** (.zip) - 使用 JSZip 库
- ✅ **RAR** (.rar) - 使用 libarchive.js 库

## 🔧 Gerber 文件格式

### 标准 Gerber 格式
- `.gbr` - 标准 Gerber 文件
- `.ger` - Gerber 文件
- `.art` - Artwork 文件
- `.pho` - Photo plot 文件
- `.ph` - Photo plot 文件

### 铜层文件
- **顶层**: `.gtl`, `.cmp`, `.top`, `.f_cu`
- **底层**: `.gbl`, `.sol`, `.bot`, `.bottom`, `.b_cu`
- **内层**: `.g1` 到 `.g32` (支持 32 层板)
- **Protel 格式**: `.g1l`, `.g2l`, `.g3l`, `.g4l`, `.g5l`, `.g6l`

### 阻焊层 (Solder Mask)
- **顶层**: `.gts`, `.stc`, `.tsm`, `.smt`, `.sst`, `.f_mask`
- **底层**: `.gbs`, `.sts`, `.bsm`, `.smb`, `.ssb`, `.b_mask`
- **内层**: `.g1s`, `.g2s`, `.g3s`, `.g4s`, `.g5s`, `.g6s`

### 丝印层 (Silkscreen)
- **顶层**: `.gto`, `.plc`, `.tsk`, `.f_silks`
- **底层**: `.gbo`, `.pls`, `.bsk`, `.b_silks`
- **内层**: `.g1o`, `.g2o`, `.g3o`, `.g4o`, `.g5o`, `.g6o`

### 助焊层 (Solder Paste)
- **顶层**: `.gtp`, `.crc`, `.tsp`, `.spt`, `.f_paste`
- **底层**: `.gbp`, `.crs`, `.bsp`, `.spb`, `.b_paste`
- **内层**: `.g1p`, `.g2p`, `.g3p`, `.g4p`, `.g5p`, `.g6p`

### 机械层和外形
- **外形**: `.gko`, `.gml`, `.outline`, `.oln`
- **机械层**: `.gm1` 到 `.gm16`
- **KiCad**: `.edge_cuts`, `.margin`

## 🔩 钻孔文件格式

- `.drl` - 标准钻孔文件
- `.drr` - 钻孔报告
- `.xln` - Excellon 格式
- `.nc` - 数控文件
- `.tap` - Tape 文件
- `.exc` - Excellon 文件
- `.drill` - 钻孔文件
- `.txt` - 文本格式钻孔文件

## 🏭 CAD 软件专用格式

### Altium Designer
- 完整支持所有 Altium 输出格式
- 机械层 `.gm1` - `.gm16`
- 所有层类型的完整支持

### Eagle CAD
- `.cmp` - Component 层
- `.sol` - Solder 层
- `.stc`, `.sts` - Stop layers
- `.plc`, `.pls` - Place layers
- `.crc`, `.crs` - Cream layers

### KiCad
- `.f_cu`, `.b_cu` - 铜层
- `.f_mask`, `.b_mask` - 阻焊层
- `.f_silks`, `.b_silks` - 丝印层
- `.f_paste`, `.b_paste` - 助焊层
- `.edge_cuts` - 边缘切割
- `.eco1_user`, `.eco2_user` - ECO 层
- `.dwgs_user`, `.cmts_user` - 用户层

### PADS
- `.top`, `.bot` - 顶底层
- `.smt`, `.smb` - 阻焊层
- `.sst`, `.ssb` - 阻焊层
- `.spt`, `.spb` - 助焊层

## 📊 生产辅助文件

### Pick & Place 文件
- `.pnp` - Pick and Place
- `.xy` - XY 坐标文件
- `.pos` - Position 文件
- `.pick` - Pick 文件
- `.place` - Place 文件
- `.placement` - Placement 文件

### BOM (物料清单)
- `.bom` - Bill of Materials
- `.cpl` - Component list
- `.cmp_list` - Component list

### 报告文件
- `.rep` - 报告文件
- `.rul` - 规则文件
- `.ldp` - Layer definition
- `.apr` - Aperture 文件
- `.apr_lib` - Aperture library
- `.extrep` - Extract report
- `.reports` - 报告文件

### 文档文件
- `.tx1` - `.tx10` - 文本层
- `.doc` - 文档文件
- `.readme` - 说明文件
- `.notes` - 注释文件

## 🔧 制造文件

### 路由/铣削
- `.route` - 路由文件
- `.edgerout` - 边缘路由
- `.slots` - 槽孔文件
- `.cutout` - 切割文件
- `.mill` - 铣削文件
- `.rout` - 路由文件

### 测试文件
- `.tst` - 测试文件
- `.test` - 测试文件
- `.fab` - 制造文件
- `.assembly` - 装配文件

## 🎯 智能识别特性

### 文件内容分析
- 自动检测 Gerber 文件头
- 识别 Excellon 钻孔格式
- 检测 Pick & Place 数据格式
- 识别 BOM 表格结构

### 文件名模式识别
- 支持无扩展名文件的智能识别
- 通过文件名关键词判断类型
- 支持各种命名约定

### 多 CAD 兼容
- 自动适配不同 CAD 软件的命名规则
- 支持混合格式的项目文件
- 智能层类型分类

## 📈 支持统计

- **总支持格式**: 150+ 种文件扩展名
- **CAD 软件**: Altium, Eagle, KiCad, PADS, Protel, DXP 等
- **文件类型**: Gerber, 钻孔, 报告, BOM, Pick&Place, 文档等
- **压缩格式**: ZIP, RAR

## 🚀 使用优势

1. **无需格式转换**: 直接支持原生 CAD 输出
2. **智能识别**: 自动判断文件类型和用途
3. **完整支持**: 从设计到生产的全流程文件
4. **错误容忍**: 支持不规范命名的文件
5. **高兼容性**: 支持所有主流 CAD 软件

## 💡 使用建议

1. **推荐压缩**: 建议使用 ZIP 或 RAR 打包所有文件
2. **保持命名**: 尽量保持 CAD 软件的原始文件命名
3. **包含完整**: 上传完整的制造文件包（Gerber + 钻孔 + 报告）
4. **检查结果**: 上传后检查识别结果是否准确

---

**更新状态**: ✅ 所有格式支持已完成并测试
**兼容性**: 支持所有主流 CAD 软件输出
**建议**: 现在可以处理几乎任何 PCB 相关文件！

## 🐛 调试信息

如果遇到"No valid files found in the archive"错误，可以检查以下常见情况：

### 测试案例
以下是一些测试文件名，应该都能被正确识别：

#### 用户反馈的案例
- `5810-795191-007 EB 150W Digital.G1` ✅ (内层文件，大写扩展名)
- `5810-795191-007 EB 150W Digital.G2` ✅ (内层文件，大写扩展名)
- `report.REP` ✅ (报告文件，大写扩展名)
- `document.TX1` ✅ (文档文件，大写扩展名)
- `drill.TXT` ✅ (钻孔文件，大写扩展名)

#### 数字扩展名测试
- `file.1` ✅ (纯数字扩展名)
- `file.2` ✅ (纯数字扩展名)
- `file.001` ✅ (纯数字扩展名)

#### 特殊命名模式
- `pcb-top-copper.dat` ✅ (包含关键词)
- `board_drill_file` ✅ (包含关键词)
- `component-list.csv` ✅ (包含关键词)

### 调试步骤
1. 检查浏览器控制台的日志输出
2. 确认ZIP/RAR文件中的文件列表
3. 查看哪些文件被标记为无效
4. 检查文件名是否包含特殊字符或路径

### 如果仍有问题
如果某个文件名没有被识别，可能需要进一步扩展识别规则。请提供具体的文件名例子。 