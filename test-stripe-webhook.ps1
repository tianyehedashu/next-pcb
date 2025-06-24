#!/usr/bin/env pwsh

# Quick Stripe Webhook Test Script
param(
    [switch]$Setup,
    [switch]$Test,
    [switch]$Monitor,
    [string]$EventType = "payment_intent.succeeded"
)

function Show-Usage {
    Write-Host "Stripe Webhook Testing Script" -ForegroundColor Cyan
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\test-stripe-webhook.ps1 -Setup    # Initial setup and webhook forwarding"
    Write-Host "  .\test-stripe-webhook.ps1 -Test     # Trigger test events"
    Write-Host "  .\test-stripe-webhook.ps1 -Monitor  # Monitor webhook events"
    Write-Host ""
    Write-Host "Event Types:" -ForegroundColor Yellow
    Write-Host "  payment_intent.succeeded"
    Write-Host "  payment_intent.payment_failed"
    Write-Host "  payment_intent.canceled"
}

if ($Setup) {
    Write-Host "🚀 Setting up Stripe Webhook forwarding..." -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ API 版本已修复: 2024-06-20 (稳定版本)" -ForegroundColor Green
    Write-Host "✅ 使用官方推荐的 Next.js App Router 处理方式" -ForegroundColor Green
    Write-Host ""
    Write-Host "1. 重启开发服务器以应用新的 API 版本" -ForegroundColor Yellow
    Write-Host "   停止服务器 (Ctrl+C) 然后重新运行: pnpm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "2. 启动 webhook 转发:" -ForegroundColor Yellow
    Write-Host "   stripe listen --forward-to localhost:3000/api/payment/webhook" -ForegroundColor White
    Write-Host ""
    Write-Host "3. 复制新的 webhook secret 并设置:" -ForegroundColor Yellow
    Write-Host '   $env:STRIPE_WEBHOOK_SECRET="whsec_新的secret"' -ForegroundColor White
    Write-Host ""
    Write-Host "4. 保持转发会话运行，在新终端中测试" -ForegroundColor Yellow
}
elseif ($Test) {
    Write-Host "🧪 Testing Stripe Webhook Events..." -ForegroundColor Green
    Write-Host ""
    Write-Host "Testing Event: $EventType" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Commands to run:" -ForegroundColor Yellow
    
    switch ($EventType) {
        "payment_intent.succeeded" {
            Write-Host "# Create a test payment intent first" -ForegroundColor Gray
            Write-Host 'stripe payment_intents create --amount=2000 --currency=usd --metadata[quote_id]="debug-test-123"' -ForegroundColor White
            Write-Host ""
            Write-Host "# Then trigger the success event" -ForegroundColor Gray
            Write-Host "stripe trigger payment_intent.succeeded" -ForegroundColor White
        }
        "payment_intent.payment_failed" {
            Write-Host "stripe trigger payment_intent.payment_failed" -ForegroundColor White
        }
        "payment_intent.canceled" {
            Write-Host "stripe trigger payment_intent.canceled" -ForegroundColor White
        }
        default {
            Write-Host "stripe trigger $EventType" -ForegroundColor White
        }
    }
    
    Write-Host ""
    Write-Host "After triggering, check:" -ForegroundColor Yellow
    Write-Host "- Your webhook forwarding terminal for incoming events" -ForegroundColor White
    Write-Host "- Your application logs for processing results" -ForegroundColor White
    Write-Host "- Database for updated order statuses" -ForegroundColor White
}
elseif ($Monitor) {
    Write-Host "📊 Monitoring Stripe Events..." -ForegroundColor Green
    Write-Host ""
    Write-Host "Commands to monitor events:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "# List recent events" -ForegroundColor Gray
    Write-Host "stripe events list --limit=5" -ForegroundColor White
    Write-Host ""
    Write-Host "# Monitor events in real-time" -ForegroundColor Gray
    Write-Host "stripe listen --print-json" -ForegroundColor White
    Write-Host ""
    Write-Host "# Check webhook endpoints" -ForegroundColor Gray
    Write-Host "stripe webhooks list" -ForegroundColor White
}
else {
    Show-Usage
}

Write-Host ""
Write-Host "💡 Pro Tips:" -ForegroundColor Cyan
Write-Host "- Keep webhook forwarding running in one terminal" -ForegroundColor White
Write-Host "- Use another terminal for triggering events" -ForegroundColor White
Write-Host "- Check application logs for detailed webhook processing" -ForegroundColor White
Write-Host "- Verify database changes after each test" -ForegroundColor White 