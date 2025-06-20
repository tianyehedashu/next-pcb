# PowerShell 长命令行问题修复指南

## 🎯 问题描述
当在PowerShell中输入很长的命令时，会出现以下错误：
```
System.ArgumentOutOfRangeException: 该值必须大于或等于零，且必须小于控制台缓冲区在该维度的大小。
参数名: top
实际值是 -1/-2。
```

这是由PSReadLine模块的显示bug导致的。

## ✅ 已实施的解决方案

### 1. **临时修复（当前会话）**
```powershell
Remove-Module PSReadLine -Force -ErrorAction SilentlyContinue
```

### 2. **永久修复（已配置）**
已创建PowerShell配置文件：
- 位置: `C:\Users\59239\Documents\WindowsPowerShell\profile.ps1`
- 内容: 自动禁用PSReadLine模块

### 3. **验证修复**
重启PowerShell后，会看到提示：
```
PSReadLine 已禁用，长命令行问题已修复
```

## 🚀 使用方法

### 立即使用（当前会话）
```powershell
# 如果遇到长命令行问题，执行：
Remove-Module PSReadLine -Force
```

### 永久解决
1. 重启PowerShell
2. 配置文件会自动生效
3. 长命令行问题将被永久修复

## 🔧 备用解决方案

如果问题仍然存在，可以尝试：

### 方案1: 使用CMD
```cmd
cmd
# 在CMD中运行命令
```

### 方案2: 使用批处理文件
将长命令保存为`.bat`文件：
```bat
@echo off
set SUPABASE_ACCESS_TOKEN=your_long_token_here
npx -y "@supabase/mcp-server-supabase@latest"
```

### 方案3: 使用Windows Terminal
- 下载安装Windows Terminal
- 通常没有PSReadLine相关问题

### 方案4: 分段执行
```powershell
# 分步设置环境变量
$env:SUPABASE_ACCESS_TOKEN = "token_part_1"
$env:SUPABASE_ACCESS_TOKEN += "token_part_2"
```

## 📊 问题原因分析

### PSReadLine模块问题
- PSReadLine是PowerShell的命令行编辑增强模块
- 在某些环境下处理长命令时会出现光标位置计算错误
- 导致控制台缓冲区越界异常

### 触发条件
- 命令长度超过特定阈值
- 包含特殊字符（如长token）
- 控制台窗口大小限制

## ✨ 修复效果

### 修复前
- 长命令无法正常输入
- 出现异常错误信息
- 影响开发效率

### 修复后
- ✅ 可以正常输入任意长度命令
- ✅ 没有异常错误
- ✅ 保持基本的命令行功能
- ⚠️ 失去PSReadLine的高级功能（如自动补全、语法高亮）

## 🔄 回滚方法

如果需要恢复PSReadLine功能：

### 临时恢复（当前会话）
```powershell
Import-Module PSReadLine
```

### 永久恢复
删除或重命名配置文件：
```powershell
Remove-Item "C:\Users\59239\Documents\WindowsPowerShell\profile.ps1"
```

## 📞 技术支持

如果问题仍然存在：
1. 检查PowerShell版本：`$PSVersionTable.PSVersion`
2. 检查PSReadLine版本：`Get-Module PSReadLine -ListAvailable`
3. 尝试更新PSReadLine：`Install-Module PSReadLine -Force`
4. 使用其他终端应用

---

**问题已解决！现在可以正常使用长命令行了。** ✨ 