#!/usr/bin/env pwsh

# Stripe Webhook Debug Script
# This script helps test the payment webhook functionality

Write-Host "🚀 Starting Stripe Webhook Debug Session" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Yellow

# Check if Stripe CLI is installed
try {
    $stripeVersion = stripe --version
    Write-Host "✅ Stripe CLI Version: $stripeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Stripe CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   scoop install stripe" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📝 Available Commands:" -ForegroundColor Cyan
Write-Host "1. Forward webhooks to local development server" -ForegroundColor White
Write-Host "2. Create test payment intent" -ForegroundColor White
Write-Host "3. Trigger webhook events" -ForegroundColor White
Write-Host "4. Listen to all Stripe events" -ForegroundColor White

Write-Host ""
Write-Host "💡 Usage Examples:" -ForegroundColor Cyan

Write-Host ""
Write-Host "🔗 1. Forward webhooks (run this first):" -ForegroundColor Yellow
Write-Host "stripe listen --forward-to localhost:3000/api/payment/webhook" -ForegroundColor White

Write-Host ""
Write-Host "💳 2. Create test payment intent:" -ForegroundColor Yellow
Write-Host 'stripe payment_intents create --amount=2000 --currency=usd --metadata=quote_id="test-123"' -ForegroundColor White

Write-Host ""
Write-Host "🎯 3. Trigger specific events:" -ForegroundColor Yellow
Write-Host "stripe trigger payment_intent.succeeded" -ForegroundColor White
Write-Host "stripe trigger payment_intent.payment_failed" -ForegroundColor White
Write-Host "stripe trigger payment_intent.canceled" -ForegroundColor White

Write-Host ""
Write-Host "📊 4. Monitor events:" -ForegroundColor Yellow
Write-Host "stripe events list --limit=10" -ForegroundColor White

Write-Host ""
Write-Host "⚠️  Important Notes:" -ForegroundColor Red
Write-Host "- Make sure your local server is running on port 3000" -ForegroundColor White
Write-Host "- Set STRIPE_WEBHOOK_SECRET from the listen command output" -ForegroundColor White
Write-Host "- Check the webhook endpoint: /api/payment/webhook" -ForegroundColor White

Write-Host ""
Write-Host "🔍 Debugging Tips:" -ForegroundColor Cyan
Write-Host "- Check webhook logs: stripe events list" -ForegroundColor White
Write-Host "- Verify endpoint: stripe webhooks list" -ForegroundColor White
Write-Host "- Test with curl: stripe events retrieve evt_xxx --expand data.object" -ForegroundColor White

Write-Host ""
Write-Host "================================================" -ForegroundColor Yellow
Write-Host "Ready to debug! Copy and run the commands above." -ForegroundColor Green 