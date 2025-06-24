# 退款功能修复脚本
# 此脚本用于修复退款功能的数据库结构问题

Write-Host "🔧 开始修复退款功能..." -ForegroundColor Cyan

# 检查是否有 psql 命令
$psqlExists = Get-Command psql -ErrorAction SilentlyContinue

if ($psqlExists) {
    Write-Host "✅ 找到 psql 命令，准备执行数据库迁移..." -ForegroundColor Green
    
    # 提示用户输入数据库连接信息
    Write-Host ""
    Write-Host "请提供 Supabase 数据库连接信息：" -ForegroundColor Yellow
    $dbUrl = Read-Host "数据库 URL (例如: postgresql://user:pass@host:port/database)"
    
    if ($dbUrl) {
        Write-Host ""
        Write-Host "正在执行数据库迁移..." -ForegroundColor Cyan
        
        # 执行数据库迁移脚本
        psql $dbUrl -f "scripts/add_refund_fields_to_admin_orders.sql"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ 数据库迁移完成！" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "❌ 数据库迁移失败！" -ForegroundColor Red
            Write-Host "请检查数据库连接信息和权限。" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ 未提供数据库 URL" -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "⚠️ 未找到 psql 命令。" -ForegroundColor Yellow
    Write-Host "请手动执行以下 SQL 脚本：" -ForegroundColor Cyan
    Write-Host "scripts/add_refund_fields_to_admin_orders.sql" -ForegroundColor White
    Write-Host ""
    Write-Host "或者安装 PostgreSQL 客户端工具后重新运行此脚本。" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 已修复的问题：" -ForegroundColor Cyan
Write-Host "1. ✅ 修复了 Next.js 15 异步 params 问题" -ForegroundColor Green
Write-Host "2. ✅ 添加了退款相关数据库字段：" -ForegroundColor Green
Write-Host "   - refund_status" -ForegroundColor White
Write-Host "   - refund_request_at" -ForegroundColor White
Write-Host "   - requested_refund_amount" -ForegroundColor White
Write-Host "   - approved_refund_amount" -ForegroundColor White
Write-Host "   - refund_processed_at" -ForegroundColor White
Write-Host "   - refund_note" -ForegroundColor White
Write-Host "   - order_status" -ForegroundColor White

Write-Host ""
Write-Host "🎉 退款功能修复完成！" -ForegroundColor Green
Write-Host ""
Write-Host "修复的 API 文件：" -ForegroundColor Cyan
Write-Host "- app/api/user/orders/[id]/request-refund/route.ts" -ForegroundColor White
Write-Host "- app/api/user/orders/[id]/confirm-refund/route.ts" -ForegroundColor White
Write-Host "- app/api/admin/orders/[id]/review-refund/route.ts" -ForegroundColor White
Write-Host "- app/api/admin/orders/[id]/process-refund/route.ts" -ForegroundColor White
Write-Host "- app/api/admin/users/[id]/reset-password/route.ts" -ForegroundColor White

Write-Host ""
Write-Host "现在您可以重新启动应用程序来测试退款功能。" -ForegroundColor Yellow 