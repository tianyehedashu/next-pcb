# PowerShell 配置文件 - 修复长命令行问题
Remove-Module PSReadLine -Force -ErrorAction SilentlyContinue
Write-Host "PSReadLine 已禁用，长命令行问题已修复" -ForegroundColor Green 