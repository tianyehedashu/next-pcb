# 递归查找所有 ts/tsx 文件
$files = Get-ChildItem -Path . -Recurse -Include *.ts,*.tsx | Where-Object { -not $_.PSIsContainer }
$logFile = "check-ts-log.txt"

# 清空旧日志
Set-Content -Path $logFile -Value ""

foreach ($file in $files) {
    $msg = "Checking $($file.FullName) ..."
    Write-Host $msg
    Add-Content -Path $logFile -Value $msg
    $startTime = Get-Date
    $job = Start-Job -ScriptBlock {
        param($f)
        pnpm exec tsc --noEmit --skipLibCheck $f 2>&1
    } -ArgumentList $file.FullName
    $finished = $job | Wait-Job -Timeout 30
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    if ($finished) {
        $output = Receive-Job $job
        if ($job.State -eq 'Completed' -and $LASTEXITCODE -eq 0) {
            $msg = "✅ $($file.FullName) 编译通过 ($duration 秒)"
        } else {
            $msg = "❌ $($file.FullName) 编译失败 ($duration 秒)"
        }
        Write-Host $msg
        Add-Content -Path $logFile -Value $msg
        if ($output) { Add-Content -Path $logFile -Value $output }
    } else {
        $msg = "⏰ $($file.FullName) 编译超时 (>30秒，已终止)"
        Write-Host $msg
        Add-Content -Path $logFile -Value $msg
        Add-Content -Path $logFile -Value "⚠️ 该文件编译异常缓慢，可能存在类型递归、类型过大或依赖问题。建议重点检查此文件的类型定义和依赖结构。"
        Stop-Job $job | Out-Null
    }
    Remove-Job $job | Out-Null
} 