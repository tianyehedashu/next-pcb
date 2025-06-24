#!/usr/bin/env pwsh

# Webhook Secret Verification Script
Write-Host "🔐 Verifying Stripe Webhook Secret Configuration" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Yellow

Write-Host ""
Write-Host "📋 Diagnostic Steps:" -ForegroundColor Cyan

Write-Host ""
Write-Host "1️⃣ Check Current Environment Variable:" -ForegroundColor Yellow
$currentSecret = $env:STRIPE_WEBHOOK_SECRET
if ($currentSecret) {
    Write-Host "✅ STRIPE_WEBHOOK_SECRET is set" -ForegroundColor Green
    Write-Host "   Value: $currentSecret" -ForegroundColor White
    
    if ($currentSecret.StartsWith("whsec_")) {
        Write-Host "✅ Secret format looks correct (starts with whsec_)" -ForegroundColor Green
    } else {
        Write-Host "❌ Secret format is wrong (should start with whsec_)" -ForegroundColor Red
    }
} else {
    Write-Host "❌ STRIPE_WEBHOOK_SECRET is not set" -ForegroundColor Red
}

Write-Host ""
Write-Host "2️⃣ Check if stripe listen is running:" -ForegroundColor Yellow
try {
    $listenCheck = Get-Process | Where-Object { $_.ProcessName -eq "stripe" }
    if ($listenCheck) {
        Write-Host "✅ Stripe process found running" -ForegroundColor Green
    } else {
        Write-Host "❌ No stripe process found - make sure 'stripe listen' is running" -ForegroundColor Red
    }
} catch {
    Write-Host "⚠️  Could not check for stripe process" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "3️⃣ Quick Fix Commands:" -ForegroundColor Yellow

Write-Host ""
Write-Host "If webhook secret is wrong or missing:" -ForegroundColor Cyan
Write-Host "# Stop current stripe listen (Ctrl+C in that terminal)"
Write-Host "# Then run:"
Write-Host "stripe listen --forward-to localhost:3000/api/payment/webhook"
Write-Host ""
Write-Host "# Copy the webhook secret from the output, then set:"
Write-Host '$env:STRIPE_WEBHOOK_SECRET="whsec_NEW_SECRET_HERE"'

Write-Host ""
Write-Host "4️⃣ Test Webhook After Fix:" -ForegroundColor Yellow
Write-Host "stripe trigger payment_intent.succeeded" -ForegroundColor White

Write-Host ""
Write-Host "5️⃣ Alternative: Use a permanent webhook endpoint" -ForegroundColor Yellow
Write-Host "# Create a webhook endpoint in Stripe Dashboard:"
Write-Host "# 1. Go to https://dashboard.stripe.com/test/webhooks"
Write-Host "# 2. Click 'Add endpoint'"
Write-Host "# 3. Use URL: https://yourdomain.com/api/payment/webhook"
Write-Host "# 4. Select events: payment_intent.succeeded, payment_intent.payment_failed, payment_intent.canceled"
Write-Host "# 5. Copy the webhook secret from the endpoint details"

Write-Host ""
Write-Host "=================================================" -ForegroundColor Yellow

# Additional environment check
Write-Host ""
Write-Host "🔍 All Environment Variables:" -ForegroundColor Cyan
Get-ChildItem env: | Where-Object Name -like '*STRIPE*' | ForEach-Object {
    Write-Host "  $($_.Name): $($_.Value.Substring(0, [Math]::Min(20, $_.Value.Length)))..." -ForegroundColor White
} 