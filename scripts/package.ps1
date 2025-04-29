#!/usr/bin/env pwsh

# 错误处理
$ErrorActionPreference = "Stop"

# 输出函数
function Write-Step {
    param($Message)
    Write-Host "`n=== $Message ===" -ForegroundColor Cyan
}

function Write-Success {
    param($Message)
    Write-Host $Message -ForegroundColor Green
}

function Write-Error {
    param($Message)
    Write-Host "错误: $Message" -ForegroundColor Red
}

try {
    # 设置环境变量
    Write-Step "设置环境变量"
    $env:NODE_ENV = "production"
    Write-Success "环境变量设置完成"

    # 清理旧文件
    Write-Step "清理旧文件"
    if (Test-Path ".next") {
        Remove-Item ".next" -Recurse -Force
        Write-Success "已清理 .next 目录"
    }
    if (Test-Path "deploy.zip") {
        Remove-Item "deploy.zip" -Force
        Write-Success "已清理旧的 deploy.zip"
    }
    # if (Test-Path "node_modules") {
    #     Remove-Item "node_modules" -Recurse -Force
    #     Write-Success "已清理 node_modules"
    # }

    # 安装依赖
    Write-Step "安装依赖"
    pnpm install --frozen-lockfile
    if ($LASTEXITCODE -ne 0) { throw "依赖安装失败" }
    Write-Success "依赖安装完成"

    # 构建项目
    Write-Step "构建项目"
    pnpm build
    if ($LASTEXITCODE -ne 0) { throw "项目构建失败" }
    Write-Success "项目构建完成"

    # 创建需要打包的文件列表
    Write-Step "准备打包文件"
    $filesToPackage = @(
        ".next",
        "public",
        "package.json",
        "pnpm-lock.yaml",
        "next.config.ts",
        "tsconfig.json"
    )

    # 检查文件是否存在
    foreach ($file in $filesToPackage) {
        if (-not (Test-Path $file)) {
            throw "找不到必需的文件: $file"
        }
    }
    Write-Success "所有必需文件已确认存在"

    # 创建zip包
    Write-Step "创建部署包"
    Compress-Archive -Path $filesToPackage -DestinationPath "deploy.zip" -Force
    Write-Success "部署包创建成功: deploy.zip"

    # 输出包大小
    $packageSize = [Math]::Round((Get-Item deploy.zip).length / 1MB, 2)
    Write-Success "部署包大小: ${packageSize}MB"

    Write-Host "`n✨ 打包完成！" -ForegroundColor Cyan
} catch {
    Write-Error $_.Exception.Message
    Write-Host "`n❌ 打包失败！" -ForegroundColor Red
    exit 1
} 