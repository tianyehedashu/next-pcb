# scripts/update-chatwoot-sdk.ps1
# 自动更新 Chatwoot SDK 脚本

param(
    [string]$BaseUrl = $env:NEXT_PUBLIC_CHATWOOT_BASE_URL,
    [switch]$Force = $false,
    [switch]$Backup = $true
)

# 颜色输出函数
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# 检查必要参数
if (-not $BaseUrl) {
    Write-ColorOutput "错误: 未设置 NEXT_PUBLIC_CHATWOOT_BASE_URL 环境变量" "Red"
    Write-ColorOutput "请设置环境变量或使用 -BaseUrl 参数" "Yellow"
    exit 1
}

# 设置路径
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$SdkDir = Join-Path $ProjectRoot "public/chatwoot"
$SdkFile = Join-Path $SdkDir "sdk.js"
$BackupDir = Join-Path $SdkDir "backups"
$SdkUrl = "$BaseUrl/packs/js/sdk.js"

Write-ColorOutput "🚀 Chatwoot SDK 更新工具" "Cyan"
Write-ColorOutput "================================" "Cyan"
Write-ColorOutput "Base URL: $BaseUrl" "Gray"
Write-ColorOutput "SDK URL: $SdkUrl" "Gray"
Write-ColorOutput "本地路径: $SdkFile" "Gray"
Write-ColorOutput ""

# 创建目录
if (-not (Test-Path $SdkDir)) {
    Write-ColorOutput "📁 创建 SDK 目录..." "Yellow"
    New-Item -ItemType Directory -Path $SdkDir -Force | Out-Null
}

if ($Backup -and -not (Test-Path $BackupDir)) {
    Write-ColorOutput "📁 创建备份目录..." "Yellow"
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

# 检查当前文件
$CurrentExists = Test-Path $SdkFile
if ($CurrentExists) {
    $CurrentSize = (Get-Item $SdkFile).Length
    $CurrentHash = Get-FileHash $SdkFile -Algorithm MD5
    Write-ColorOutput "📄 当前 SDK 文件信息:" "Green"
    Write-ColorOutput "   大小: $CurrentSize 字节" "Gray"
    Write-ColorOutput "   MD5: $($CurrentHash.Hash)" "Gray"
    Write-ColorOutput ""
}

# 备份当前文件
if ($CurrentExists -and $Backup) {
    $BackupName = "sdk_$(Get-Date -Format 'yyyyMMdd_HHmmss').js"
    $BackupPath = Join-Path $BackupDir $BackupName
    Write-ColorOutput "💾 备份当前文件到: $BackupName" "Yellow"
    Copy-Item $SdkFile $BackupPath
}

# 下载新文件
Write-ColorOutput "⬇️ 正在下载最新 SDK..." "Yellow"
try {
    $TempFile = Join-Path $env:TEMP "chatwoot_sdk_temp.js"
    
    # 使用 Invoke-WebRequest 下载
    $ProgressPreference = 'SilentlyContinue'  # 隐藏进度条
    Invoke-WebRequest -Uri $SdkUrl -OutFile $TempFile -UseBasicParsing
    
    # 检查下载的文件
    if (-not (Test-Path $TempFile)) {
        throw "下载失败: 临时文件不存在"
    }
    
    $NewSize = (Get-Item $TempFile).Length
    $NewHash = Get-FileHash $TempFile -Algorithm MD5
    
    Write-ColorOutput "✅ 下载成功!" "Green"
    Write-ColorOutput "📄 新 SDK 文件信息:" "Green"
    Write-ColorOutput "   大小: $NewSize 字节" "Gray"
    Write-ColorOutput "   MD5: $($NewHash.Hash)" "Gray"
    Write-ColorOutput ""
    
    # 检查是否有变化
    if ($CurrentExists -and $CurrentHash.Hash -eq $NewHash.Hash -and -not $Force) {
        Write-ColorOutput "ℹ️ SDK 文件没有变化，跳过更新" "Cyan"
        Write-ColorOutput "   使用 -Force 参数强制更新" "Gray"
        Remove-Item $TempFile -Force
        exit 0
    }
    
    # 移动文件到目标位置
    Move-Item $TempFile $SdkFile -Force
    Write-ColorOutput "✅ SDK 更新完成!" "Green"
    
    # 显示变化信息
    if ($CurrentExists) {
        $SizeDiff = $NewSize - $CurrentSize
        $SizeChange = if ($SizeDiff -gt 0) { "+$SizeDiff" } else { "$SizeDiff" }
        Write-ColorOutput "📊 变化信息:" "Cyan"
        Write-ColorOutput "   大小变化: $SizeChange 字节" "Gray"
        Write-ColorOutput "   哈希变化: $($CurrentHash.Hash) → $($NewHash.Hash)" "Gray"
    }
    
} catch {
    Write-ColorOutput "❌ 下载失败: $($_.Exception.Message)" "Red"
    
    # 如果有备份，提供恢复选项
    if ($CurrentExists -and $Backup) {
        Write-ColorOutput "💡 如需恢复，请运行:" "Yellow"
        Write-ColorOutput "   Copy-Item '$BackupPath' '$SdkFile' -Force" "Gray"
    }
    
    exit 1
}

# 清理旧备份（保留最近 5 个）
if ($Backup -and (Test-Path $BackupDir)) {
    $Backups = Get-ChildItem $BackupDir -Filter "sdk_*.js" | Sort-Object LastWriteTime -Descending
    if ($Backups.Count -gt 5) {
        $ToDelete = $Backups | Select-Object -Skip 5
        Write-ColorOutput "🧹 清理旧备份文件..." "Yellow"
        $ToDelete | ForEach-Object {
            Write-ColorOutput "   删除: $($_.Name)" "Gray"
            Remove-Item $_.FullName -Force
        }
    }
}

Write-ColorOutput ""
Write-ColorOutput "🎉 更新完成!" "Green"
Write-ColorOutput "💡 建议:" "Cyan"
Write-ColorOutput "   1. 测试聊天功能是否正常" "Gray"
Write-ColorOutput "   2. 检查浏览器控制台是否有错误" "Gray"
Write-ColorOutput "   3. 如有问题，可从备份恢复" "Gray"
Write-ColorOutput "" 