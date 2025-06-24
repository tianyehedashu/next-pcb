#!/usr/bin/env pwsh

# Stripe Webhook Signature Fix Script
# This script helps diagnose and fix webhook signature verification issues

Write-Host "🔧 Stripe Webhook Signature Troubleshooting" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Yellow

Write-Host ""
Write-Host "📋 Step-by-Step Fix:" -ForegroundColor Cyan

Write-Host ""
Write-Host "1️⃣ Stop any existing webhook forwarding" -ForegroundColor Yellow
Write-Host "   Press Ctrl+C in your stripe listen terminal" -ForegroundColor White

Write-Host ""
Write-Host "2️⃣ Clear environment variables" -ForegroundColor Yellow
Write-Host '   $env:STRIPE_WEBHOOK_SECRET = $null' -ForegroundColor White

Write-Host ""
Write-Host "3️⃣ Start fresh webhook forwarding" -ForegroundColor Yellow
Write-Host "   stripe listen --forward-to localhost:3000/api/payment/webhook" -ForegroundColor White

Write-Host ""
Write-Host "4️⃣ Set the new webhook secret (copy from output above)" -ForegroundColor Yellow
Write-Host '   $env:STRIPE_WEBHOOK_SECRET="whsec_XXXXXXXXXXXXXXX"' -ForegroundColor White

Write-Host ""
Write-Host "5️⃣ Verify environment variable is set correctly" -ForegroundColor Yellow
Write-Host "   echo `$env:STRIPE_WEBHOOK_SECRET" -ForegroundColor White

Write-Host ""
Write-Host "6️⃣ Test with a simple event" -ForegroundColor Yellow
Write-Host "   stripe trigger payment_intent.succeeded" -ForegroundColor White

Write-Host ""
Write-Host "🔍 Common Issues & Solutions:" -ForegroundColor Red

Write-Host ""
Write-Host "❌ Issue: 'No signatures found matching the expected signature'" -ForegroundColor Red
Write-Host "✅ Solution: Make sure you're using the webhook secret from the CURRENT listen session" -ForegroundColor Green
Write-Host "   - Stop and restart 'stripe listen'" -ForegroundColor White
Write-Host "   - Copy the NEW webhook secret" -ForegroundColor White
Write-Host "   - Update your environment variable" -ForegroundColor White

Write-Host ""
Write-Host "❌ Issue: 'Request body was modified by middleware'" -ForegroundColor Red
Write-Host "✅ Solution: The webhook handler has been updated to use raw request body" -ForegroundColor Green
Write-Host "   - Restart your Next.js development server" -ForegroundColor White

Write-Host ""
Write-Host "❌ Issue: Environment variable not being read" -ForegroundColor Red
Write-Host "✅ Solution: Verify the variable is set in the correct terminal" -ForegroundColor Green
Write-Host "   - Set the variable in the same terminal where you run 'next dev'" -ForegroundColor White
Write-Host "   - Or add it to your .env.local file" -ForegroundColor White

Write-Host ""
Write-Host "🧪 Testing Commands:" -ForegroundColor Cyan

Write-Host ""
Write-Host "Test 1: Check if webhook endpoint is reachable" -ForegroundColor Yellow
Write-Host 'curl -X POST http://localhost:3000/api/payment/webhook -H "Content-Type: application/json" -d "{}"' -ForegroundColor White

Write-Host ""
Write-Host "Test 2: Use test webhook (bypasses signature verification)" -ForegroundColor Yellow
Write-Host "stripe listen --forward-to localhost:3000/api/payment/webhook-test" -ForegroundColor White
Write-Host "stripe trigger payment_intent.succeeded" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  This test endpoint skips signature verification - use only for debugging!" -ForegroundColor Red

Write-Host ""
Write-Host "Test 2: Check environment variables" -ForegroundColor Yellow
Write-Host "Get-ChildItem env: | Where-Object Name -like '*STRIPE*'" -ForegroundColor White

Write-Host ""
Write-Host "Test 3: Verify stripe CLI is working" -ForegroundColor Yellow
Write-Host "stripe events list --limit=1" -ForegroundColor White

Write-Host ""
Write-Host "📝 Current Webhook Secret from File:" -ForegroundColor Cyan
Write-Host "whsec_HnSrVkvniRMtNrawHlHIUJEXwFbJwq6A" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Note: This secret is only valid during an active 'stripe listen' session" -ForegroundColor Red

Write-Host ""
Write-Host "=============================================" -ForegroundColor Yellow
Write-Host "🚀 Ready to test! Follow the steps above." -ForegroundColor Green 