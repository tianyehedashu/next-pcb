@echo off
echo PowerShell 长命令行问题解决方案
echo.
echo 方案1: 使用此CMD窗口执行长命令
echo 方案2: 使用预配置的PowerShell会话
echo 方案3: 分段执行长命令
echo.
echo 当前在CMD环境中，可以安全执行长命令：
echo.

choice /c 123 /m "请选择方案 (1=CMD, 2=新PowerShell, 3=分段)"

if errorlevel 3 goto segment
if errorlevel 2 goto newps
if errorlevel 1 goto cmd

:cmd
echo.
echo === 在CMD中执行 ===
echo 设置环境变量:
set SUPABASE_ACCESS_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3aHJtY3dtbWFzbHlpZXFnaWF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTY1OTI3OCwiZXhwIjoyMDYxMjM1Mjc4fQ.u3gtpJNllT_GlL45FnOh-qm8pjLELg2qD3k76z73XAQ
echo.
echo 环境变量已设置！现在可以运行：
echo npx -y "@supabase/mcp-server-supabase@latest"
echo.
pause
exit

:newps
echo.
echo === 启动无PSReadLine的PowerShell ===
powershell -NoProfile -Command "Remove-Module PSReadLine -Force -ErrorAction SilentlyContinue; $env:SUPABASE_ACCESS_TOKEN='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3aHJtY3dtbWFzbHlpZXFnaWF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTY1OTI3OCwiZXhwIjoyMDYxMjM1Mjc4fQ.u3gtpJNllT_GlL45FnOh-qm8pjLELg2qD3k76z73XAQ'; Write-Host 'Token设置完成！'; $Host.UI.ReadLine()"
pause
exit

:segment
echo.
echo === 分段设置方案 ===
echo 在PowerShell中分段执行：
echo.
echo $token1 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6"
echo $token2 = "InZ3aHJtY3dtbWFzbHlpZXFnaWF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6"
echo $token3 = "MTc0NTY1OTI3OCwiZXhwIjoyMDYxMjM1Mjc4fQ.u3gtpJNllT_GlL45FnOh-qm8pjLELg2qD3k76z73XAQ"
echo $env:SUPABASE_ACCESS_TOKEN = $token1 + $token2 + $token3
echo.
pause
exit 