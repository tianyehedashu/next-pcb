# PowerShell PSReadLine 问题修复脚本
Write-Host "=== PowerShell PSReadLine 问题修复 ===" -ForegroundColor Green

Write-Host "`n检查当前 PSReadLine 版本..." -ForegroundColor Yellow
try {
    $psReadLineVersion = Get-Module PSReadLine -ListAvailable | Select-Object -First 1 | Select-Object Version
    Write-Host "当前版本: $($psReadLineVersion.Version)" -ForegroundColor Cyan
} catch {
    Write-Host "无法获取 PSReadLine 版本" -ForegroundColor Red
}

Write-Host "`n=== 解决方案 1: 禁用 PSReadLine ===" -ForegroundColor Yellow
Write-Host "临时禁用 PSReadLine (当前会话有效):"
Write-Host "Remove-Module PSReadLine -Force" -ForegroundColor White

Write-Host "`n=== 解决方案 2: 更新 PSReadLine ===" -ForegroundColor Yellow
Write-Host "更新到最新版本:"
Write-Host "Install-Module PSReadLine -Force -SkipPublisherCheck" -ForegroundColor White

Write-Host "`n=== 解决方案 3: 重置 PSReadLine 配置 ===" -ForegroundColor Yellow
Write-Host "重置配置文件:"
Write-Host "Remove-Item `$PROFILE.CurrentUserAllHosts -Force -ErrorAction SilentlyContinue" -ForegroundColor White

Write-Host "`n=== 解决方案 4: 永久禁用 PSReadLine ===" -ForegroundColor Yellow
Write-Host "在 PowerShell 配置文件中添加:"
Write-Host "if (`$Host.Name -eq 'ConsoleHost') { Remove-Module PSReadLine -ErrorAction SilentlyContinue }" -ForegroundColor White

Write-Host "`n=== 推荐的立即修复方法 ===" -ForegroundColor Green
Write-Host "选择一个方法来立即修复问题:"
Write-Host "1. 禁用当前会话的 PSReadLine (推荐)" -ForegroundColor Cyan
Write-Host "2. 更新 PSReadLine 到最新版本" -ForegroundColor Cyan
Write-Host "3. 重置所有配置" -ForegroundColor Cyan
Write-Host "4. 查看详细信息" -ForegroundColor Cyan

$choice = Read-Host "`n请选择 (1-4)"

switch ($choice) {
    "1" {
        Write-Host "`n正在禁用 PSReadLine..." -ForegroundColor Yellow
        try {
            Remove-Module PSReadLine -Force -ErrorAction Stop
            Write-Host "✅ PSReadLine 已禁用，长命令行问题应该已解决" -ForegroundColor Green
            Write-Host "注意: 这只影响当前 PowerShell 会话" -ForegroundColor Yellow
        } catch {
            Write-Host "❌ 禁用失败: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    "2" {
        Write-Host "`n正在更新 PSReadLine..." -ForegroundColor Yellow
        try {
            Install-Module PSReadLine -Force -SkipPublisherCheck -Scope CurrentUser
            Write-Host "✅ PSReadLine 已更新，请重启 PowerShell" -ForegroundColor Green
        } catch {
            Write-Host "❌ 更新失败: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    "3" {
        Write-Host "`n正在重置配置..." -ForegroundColor Yellow
        try {
            # 备份现有配置
            if (Test-Path $PROFILE.CurrentUserAllHosts) {
                Copy-Item $PROFILE.CurrentUserAllHosts "$($PROFILE.CurrentUserAllHosts).backup"
                Write-Host "已备份现有配置到: $($PROFILE.CurrentUserAllHosts).backup" -ForegroundColor Cyan
            }
            
            # 创建新的配置文件
            $profileDir = Split-Path $PROFILE.CurrentUserAllHosts -Parent
            if (!(Test-Path $profileDir)) {
                New-Item -Path $profileDir -ItemType Directory -Force
            }
            
            # 创建基本配置文件，禁用有问题的 PSReadLine 功能
            $newProfile = @"
# PowerShell 配置文件 - 修复 PSReadLine 问题
if (`$Host.Name -eq 'ConsoleHost') {
    try {
        Import-Module PSReadLine -ErrorAction Stop
        
        # 设置安全的 PSReadLine 选项
        Set-PSReadLineOption -PredictionSource None
        Set-PSReadLineOption -EditMode Windows
        
        # 禁用可能导致问题的功能
        Set-PSReadLineKeyHandler -Key Tab -Function Complete
        Set-PSReadLineOption -MaximumHistoryCount 1000
        
        Write-Host "PSReadLine 已加载 (安全模式)" -ForegroundColor Green
    } catch {
        Write-Host "PSReadLine 加载失败，使用默认控制台" -ForegroundColor Yellow
    }
}
"@
            
            Set-Content -Path $PROFILE.CurrentUserAllHosts -Value $newProfile -Encoding UTF8
            Write-Host "✅ 配置已重置，请重启 PowerShell 以应用更改" -ForegroundColor Green
        } catch {
            Write-Host "❌ 重置失败: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    "4" {
        Write-Host "`n=== 详细诊断信息 ===" -ForegroundColor Yellow
        
        Write-Host "`nPowerShell 版本:" -ForegroundColor Cyan
        $PSVersionTable.PSVersion
        
        Write-Host "`n控制台窗口信息:" -ForegroundColor Cyan
        Write-Host "窗口宽度: $($Host.UI.RawUI.WindowSize.Width)"
        Write-Host "缓冲区宽度: $($Host.UI.RawUI.BufferSize.Width)"
        Write-Host "窗口高度: $($Host.UI.RawUI.WindowSize.Height)"
        Write-Host "缓冲区高度: $($Host.UI.RawUI.BufferSize.Height)"
        
        Write-Host "`nPSReadLine 信息:" -ForegroundColor Cyan
        try {
            Get-PSReadLineOption | Format-List
        } catch {
            Write-Host "无法获取 PSReadLine 选项"
        }
        
        Write-Host "`n配置文件位置:" -ForegroundColor Cyan
        Write-Host "AllUsersAllHosts: $($PROFILE.AllUsersAllHosts)"
        Write-Host "CurrentUserAllHosts: $($PROFILE.CurrentUserAllHosts)"
        Write-Host "AllUsersCurrentHost: $($PROFILE.AllUsersCurrentHost)"
        Write-Host "CurrentUserCurrentHost: $($PROFILE.CurrentUserCurrentHost)"
    }
    default {
        Write-Host "无效选择" -ForegroundColor Red
    }
}

Write-Host "`n=== 临时解决方案 ===" -ForegroundColor Yellow
Write-Host "如果问题仍然存在，可以尝试:"
Write-Host "1. 使用 CMD 而不是 PowerShell" -ForegroundColor White
Write-Host "2. 使用 Windows Terminal 或其他终端应用" -ForegroundColor White
Write-Host "3. 将长命令保存为 .bat 或 .ps1 文件执行" -ForegroundColor White

Write-Host "`n=== 完成 ===" -ForegroundColor Green 