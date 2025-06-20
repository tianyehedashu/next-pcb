# 简单的token设置脚本
Write-Host "正在设置 Supabase Token..." -ForegroundColor Green

# 禁用PSReadLine
Remove-Module PSReadLine -Force -ErrorAction SilentlyContinue

# 分段设置token避免长命令行问题
$part1 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6"
$part2 = "InZ3aHJtY3dtbWFzbHlpZXFnaWF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6"  
$part3 = "MTc0NTY1OTI3OCwiZXhwIjoyMDYxMjM1Mjc4fQ.u3gtpJNllT_GlL45FnOh-qm8pjLELg2qD3k76z73XAQ"

$env:SUPABASE_ACCESS_TOKEN = $part1 + $part2 + $part3

Write-Host "Token设置完成!" -ForegroundColor Green
Write-Host "Token长度: $($env:SUPABASE_ACCESS_TOKEN.Length)" -ForegroundColor Yellow

Write-Host "`n现在可以运行MCP命令：" -ForegroundColor Cyan
Write-Host 'npx -y "@supabase/mcp-server-supabase@latest"' -ForegroundColor White 