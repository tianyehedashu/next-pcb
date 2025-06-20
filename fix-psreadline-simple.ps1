# 简单的 PSReadLine 修复方案
Write-Host "PowerShell 长命令行问题修复" -ForegroundColor Green

Write-Host "`n方案1: 临时禁用 PSReadLine (推荐)" -ForegroundColor Yellow
Write-Host "执行: Remove-Module PSReadLine -Force" -ForegroundColor White

Write-Host "`n方案2: 创建永久配置文件" -ForegroundColor Yellow
Write-Host "将在 PowerShell 配置文件中禁用 PSReadLine" -ForegroundColor White

$choice = Read-Host "`n选择方案 (1 或 2)"

if ($choice -eq "1") {
    Write-Host "正在禁用 PSReadLine..." -ForegroundColor Yellow
    Remove-Module PSReadLine -Force -ErrorAction SilentlyContinue
    Write-Host "完成! 长命令行问题已解决" -ForegroundColor Green
    Write-Host "注意: 此修复仅在当前会话中有效" -ForegroundColor Yellow
} elseif ($choice -eq "2") {
    Write-Host "正在创建永久配置..." -ForegroundColor Yellow
    
    # 确保配置文件目录存在
    $profileDir = Split-Path $PROFILE.CurrentUserAllHosts -Parent
    if (!(Test-Path $profileDir)) {
        New-Item -Path $profileDir -ItemType Directory -Force | Out-Null
    }
    
    # 添加配置到文件
    $configLine = "Remove-Module PSReadLine -Force -ErrorAction SilentlyContinue"
    Add-Content -Path $PROFILE.CurrentUserAllHosts -Value $configLine -Encoding UTF8
    
    Write-Host "完成! 配置已添加到: $($PROFILE.CurrentUserAllHosts)" -ForegroundColor Green
    Write-Host "重启 PowerShell 后永久生效" -ForegroundColor Yellow
    
    # 同时应用到当前会话
    Remove-Module PSReadLine -Force -ErrorAction SilentlyContinue
    Write-Host "当前会话也已修复" -ForegroundColor Green
} else {
    Write-Host "无效选择" -ForegroundColor Red
}

Write-Host "`n备用解决方案:" -ForegroundColor Cyan
Write-Host "1. 使用 CMD 代替 PowerShell"
Write-Host "2. 使用 Windows Terminal"
Write-Host "3. 将长命令保存为脚本文件" 