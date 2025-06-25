# PowerShell 脚本：添加订单取消相关字段
# 文件: apply-cancellation-fields.ps1

Write-Host "🚀 开始执行订单取消字段迁移..." -ForegroundColor Green

# 检查 psql 是否可用
try {
    $psqlVersion = psql --version
    Write-Host "✅ 找到 PostgreSQL 客户端: $psqlVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ 错误: 找不到 psql 命令。请确保 PostgreSQL 客户端已安装并在 PATH 中。" -ForegroundColor Red
    exit 1
}

# 获取数据库连接信息
$env:PGPASSWORD = ""
$dbHost = "localhost"
$dbPort = "5432"
$dbName = "next_pcb"
$dbUser = "postgres"

# 提示用户输入数据库信息
Write-Host "📋 请输入数据库连接信息:" -ForegroundColor Yellow
$userInput = Read-Host "数据库主机 (默认: localhost)"
if ($userInput) { $dbHost = $userInput }

$userInput = Read-Host "数据库端口 (默认: 5432)"
if ($userInput) { $dbPort = $userInput }

$userInput = Read-Host "数据库名称 (默认: next_pcb)"
if ($userInput) { $dbName = $userInput }

$userInput = Read-Host "数据库用户 (默认: postgres)"
if ($userInput) { $dbUser = $userInput }

$dbPassword = Read-Host "数据库密码" -AsSecureString
$env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))

Write-Host "🔌 连接数据库: $dbHost:$dbPort/$dbName (用户: $dbUser)" -ForegroundColor Cyan

# 测试数据库连接
try {
    $connectionTest = psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c "SELECT 1;" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 数据库连接失败: $connectionTest" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ 数据库连接成功" -ForegroundColor Green
} catch {
    Write-Host "❌ 数据库连接失败: $_" -ForegroundColor Red
    exit 1
}

# 执行迁移脚本
$scriptPath = "scripts/add_cancellation_fields_to_pcb_quotes.sql"

if (-not (Test-Path $scriptPath)) {
    Write-Host "❌ 错误: 找不到迁移脚本文件 $scriptPath" -ForegroundColor Red
    exit 1
}

Write-Host "📄 执行迁移脚本: $scriptPath" -ForegroundColor Cyan

try {
    $migrationResult = psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $scriptPath 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 迁移脚本执行成功！" -ForegroundColor Green
        Write-Host "📋 执行结果:" -ForegroundColor Yellow
        Write-Host $migrationResult -ForegroundColor White
    } else {
        Write-Host "❌ 迁移脚本执行失败:" -ForegroundColor Red
        Write-Host $migrationResult -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ 执行迁移脚本时发生错误: $_" -ForegroundColor Red
    exit 1
}

# 验证字段是否成功添加
Write-Host "🔍 验证字段是否成功添加..." -ForegroundColor Cyan

$verificationQueries = @(
    "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'pcb_quotes' AND column_name = 'cancelled_at';",
    "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'pcb_quotes' AND column_name = 'cancellation_reason';",
    "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'pcb_quotes' AND column_name = 'cancelled_by';",
    "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'pcb_quotes' AND column_name = 'can_be_uncancelled';"
)

$expectedFields = @("cancelled_at", "cancellation_reason", "cancelled_by", "can_be_uncancelled")
$successCount = 0

foreach ($i in 0..($verificationQueries.Length - 1)) {
    $query = $verificationQueries[$i]
    $field = $expectedFields[$i]
    
    try {
        $result = psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -t -A -c $query 2>&1
        
        if ($result -and $result.Trim() -ne "") {
            Write-Host "   ✅ $field 字段已成功添加" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "   ❌ $field 字段未找到" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ❌ 验证 $field 字段时出错: $_" -ForegroundColor Red
    }
}

# 验证索引
Write-Host "🔍 验证索引是否成功创建..." -ForegroundColor Cyan

$indexQueries = @(
    "SELECT indexname FROM pg_indexes WHERE tablename = 'pcb_quotes' AND indexname = 'idx_pcb_quotes_cancelled_at';",
    "SELECT indexname FROM pg_indexes WHERE tablename = 'pcb_quotes' AND indexname = 'idx_pcb_quotes_status_cancelled';"
)

$expectedIndexes = @("idx_pcb_quotes_cancelled_at", "idx_pcb_quotes_status_cancelled")

foreach ($i in 0..($indexQueries.Length - 1)) {
    $query = $indexQueries[$i]
    $index = $expectedIndexes[$i]
    
    try {
        $result = psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -t -A -c $query 2>&1
        
        if ($result -and $result.Trim() -ne "") {
            Write-Host "   ✅ $index 索引已成功创建" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $index 索引未找到" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ❌ 验证 $index 索引时出错: $_" -ForegroundColor Red
    }
}

# 最终结果
if ($successCount -eq 4) {
    Write-Host ""
    Write-Host "🎉 恭喜！所有取消相关字段都已成功添加到 pcb_quotes 表。" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 添加的字段:" -ForegroundColor Yellow
    Write-Host "   - cancelled_at (取消时间)" -ForegroundColor White
    Write-Host "   - cancellation_reason (取消原因)" -ForegroundColor White
    Write-Host "   - cancelled_by (取消操作者)" -ForegroundColor White
    Write-Host "   - can_be_uncancelled (是否可撤销)" -ForegroundColor White
    Write-Host ""
    Write-Host "🚀 现在可以使用订单取消功能了！" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️  警告: 部分字段可能未成功添加。请检查上面的错误信息。" -ForegroundColor Yellow
    Write-Host "成功添加的字段数: $successCount / 4" -ForegroundColor Yellow
}

# 清理环境变量
$env:PGPASSWORD = $null

Write-Host ""
Write-Host "✨ 迁移脚本执行完成！" -ForegroundColor Green 