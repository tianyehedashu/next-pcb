# MCP 工具启用故障排除指南

## 问题现象
- Cursor显示 "0个工具被启用"
- MCP服务器配置看起来正确但不工作

## 根本原因
根据我们的诊断，主要原因包括：

### 1. Windows 配置格式错误
原配置使用了错误的格式（通过 cmd 调用 npx）：
```json
{
  "mcpServers": {
    "supabase": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@supabase/mcp-server-supabase@latest", "--access-token", "token"]
    }
  }
}
```

**在 Windows 下应该直接使用 `npx` 作为命令，而不是通过 `cmd` 调用。**

### 2. 缺少必要参数
- 缺少 `--project-ref` 参数
- 环境变量设置不正确

## 解决方案

### 正确的MCP配置
文件位置：`c:\Users\59239\.cursor\mcp.json`

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=vwhrmcwmmaslyieqgiav"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "sbp_3b77ed809593e2a503b260165079054d8e1ba50e"
      }
    }
  }
}
```

### 配置要点说明

1. **command**: 直接使用 `"npx"`，不需要 `"cmd"`
2. **--read-only**: 安全模式，防止意外修改数据库
3. **--project-ref**: 使用项目引用ID而不是完整URL
4. **env**: 环境变量方式传递访问令牌（更安全）

### 验证步骤

1. **测试MCP服务器是否可以启动**：
```powershell
$env:SUPABASE_ACCESS_TOKEN="sbp_3b77ed809593e2a503b260165079054d8e1ba50e"
npx -y @supabase/mcp-server-supabase@latest --read-only --project-ref=vwhrmcwmmaslyieqgiav
```

2. **重启Cursor**：
   - 完全关闭Cursor
   - 重新启动
   - 检查 Settings/MCP 状态

3. **检查Cursor MCP日志**：
   - 在Cursor中打开开发者工具（Ctrl+Shift+I）
   - 查看控制台输出
   - 查找MCP相关错误信息

## 常见问题与解决方案

### 问题1：spawn npx ENOENT
**原因**：Cursor找不到npx命令
**解决方案**：
1. 确保Node.js正确安装：`node --version`
2. 确保npx可用：`npx --version`
3. 如果使用nvm，使用完整路径：
```json
{
  "command": "C:\\Users\\<username>\\AppData\\Roaming\\nvm\\v<version>\\npx.cmd"
}
```

### 问题2：MCP server times out
**原因**：网络连接或服务器响应问题
**解决方案**：
1. 检查网络连接
2. 验证项目引用ID是否正确
3. 确认访问令牌是否有效

### 问题3：Terminal window opens and closes quickly
**原因**：MCP服务器启动失败
**解决方案**：
1. 在项目根目录下手动测试命令
2. 检查所有参数是否正确
3. 使用Process Monitor查看具体错误

## 高级故障排除

### 使用Process Monitor诊断
1. 下载并安装Process Monitor
2. 设置过滤器：Process Name contains "npx"
3. 在Cursor中刷新MCP服务器
4. 查看Process Monitor中的详细执行信息

### 手动验证MCP连接
```powershell
# 设置环境变量
$env:SUPABASE_ACCESS_TOKEN="your_token_here"

# 测试连接
npx -y @modelcontextprotocol/inspector npx -y @supabase/mcp-server-supabase@latest --read-only --project-ref=vwhrmcwmmaslyieqgiav
```

## 备用方案

如果MCP仍然无法工作，可以：

1. **直接在Supabase控制台创建表**：
   - 访问 https://supabase.com/dashboard/project/vwhrmcwmmaslyieqgiav/sql
   - 执行 SQL 脚本：`lib/data/migrations/20241201_add_content_management.sql`

2. **使用Supabase CLI**：
```bash
supabase login
supabase projects list
supabase db push --project-ref vwhrmcwmmaslyieqgiav
```

## 相关文件
- MCP配置：`c:\Users\59239\.cursor\mcp.json`
- SQL脚本：`lib/data/migrations/20241201_add_content_management.sql`
- PowerShell修复脚本：`fix-powershell-readlines.ps1`

## 更新记录
- 2024-12-01: 修正MCP配置格式
- 2024-12-01: 添加PowerShell长命令行修复方案
- 2024-12-01: 创建完整的CMS数据库表结构 