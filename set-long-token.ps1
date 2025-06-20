# 分段设置长环境变量，避免PSReadLine问题
Write-Host "PowerShell 长命令行解决方案 - 分段设置" -ForegroundColor Green

# 先尝试禁用PSReadLine
Remove-Module PSReadLine -Force -ErrorAction SilentlyContinue
Write-Host "✓ PSReadLine 已禁用" -ForegroundColor Yellow

# 分段设置Supabase Token
Write-Host "`n正在分段设置 SUPABASE_ACCESS_TOKEN..." -ForegroundColor Cyan

$token1 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6"
$token2 = "InZ3aHJtY3dtbWFzbHlpZXFnaWF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6"  
$token3 = "MTc0NTY1OTI3OCwiZXhwIjoyMDYxMjM1Mjc4fQ.u3gtpJNllT_GlL45FnOh-qm8pjLELg2qD3k76z73XAQ"

$env:SUPABASE_ACCESS_TOKEN = $token1 + $token2 + $token3

Write-Host "✓ SUPABASE_ACCESS_TOKEN 设置完成" -ForegroundColor Green
Write-Host "Token长度: $($env:SUPABASE_ACCESS_TOKEN.Length) 字符" -ForegroundColor Cyan

# 验证设置
Write-Host "`n验证设置:" -ForegroundColor Yellow
Write-Host "Token前20字符: $($env:SUPABASE_ACCESS_TOKEN.Substring(0,20))..." -ForegroundColor White
Write-Host "Token后20字符: ...$($env:SUPABASE_ACCESS_TOKEN.Substring($env:SUPABASE_ACCESS_TOKEN.Length-20))" -ForegroundColor White

Write-Host "`n现在可以运行 MCP 命令了：" -ForegroundColor Green
Write-Host "npx -y `"@supabase/mcp-server-supabase@latest`"" -ForegroundColor White

Write-Host "`n或者测试连接：" -ForegroundColor Yellow  
Write-Host "echo `"{\`"jsonrpc\`":\`"2.0\`",\`"id\`":1,\`"method\`":\`"tools/list\`"}`" | npx -y `"@supabase/mcp-server-supabase@latest`"" -ForegroundColor White 