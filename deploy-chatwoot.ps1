# PowerShell 脚本: 在本地使用 Docker 部署 Chatwoot
# 使用方法:
# 1. 确保你已经安装了 Docker 和 Docker Compose。
# 2. 在 PowerShell 终端中，导航到此脚本所在的目录。
# 3. 运行命令: .\deploy-chatwoot.ps1

# --- 配置 ---
$ChatwootDir = "chatwoot-local" # Chatwoot 项目将被克隆到的目录名

# --- 脚本开始 ---
Write-Host "🚀 开始在本地部署 Chatwoot..." -ForegroundColor Green

# 检查 Git 是否安装
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 错误: Git 未安装或未在 PATH 中。请先安装 Git。" -ForegroundColor Red
    exit
}

# 检查 Docker 是否安装
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 错误: Docker 未安装或未在 PATH 中。请先安装 Docker Desktop。" -ForegroundColor Red
    exit
}

# 检查 Docker Compose 是否可用
if (-not (docker-compose --version -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 错误: Docker Compose 未找到。请确保 Docker Desktop 已正确安装并正在运行。" -ForegroundColor Red
    exit
}

Write-Host "✅ 环境检查通过 (Git, Docker, Docker Compose)"

# 1. 克隆 Chatwoot 仓库
if (Test-Path -Path $ChatwootDir) {
    Write-Host "📁 目录 '$ChatwootDir' 已存在，跳过克隆。"
} else {
    Write-Host "📥 正在从 GitHub 克隆 Chatwoot..."
    git clone https://github.com/chatwoot/chatwoot.git $ChatwootDir
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 克隆失败。" -ForegroundColor Red
        exit
    }
}

# 进入 Chatwoot 目录
cd $ChatwootDir

# 2. 配置环境变量
if (Test-Path -Path ".env") {
    Write-Host "📄 .env 文件已存在，跳过创建。"
} else {
    Write-Host "⚙️  正在从 .env.example 创建 .env 配置文件..."
    Copy-Item .env.example .env
}

Write-Host "🔑 正在自动更新 .env 文件中的 FRONTEND_URL..."
# 使用 PowerShell 的 -replace 操作符来更新 FRONTEND_URL
(Get-Content .env) -replace 'FRONTEND_URL=.*', 'FRONTEND_URL=http://localhost:3000' | Set-Content .env
Write-Host "✅ .env 文件已配置为本地访问 (http://localhost:3000)"

# 3. 构建 Docker 镜像 (这一步可能需要一些时间)
Write-Host "🏗️  正在构建 Docker 镜像，这可能需要几分钟..."
docker-compose build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker 镜像构建失败。" -ForegroundColor Red
    exit
}

# 4. 准备数据库
Write-Host "🗄️  正在准备数据库..."
docker-compose run --rm rails bundle exec rails db:chatwoot_prepare
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 数据库准备失败。" -ForegroundColor Red
    exit
}

# 5. 启动服务
Write-Host "🚀 正在后台启动 Chatwoot 服务..."
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Chatwoot 启动失败。" -ForegroundColor Red
    exit
}

Write-Host "🎉 恭喜！Chatwoot 应该已经在本地成功运行！" -ForegroundColor Green
Write-Host ""
Write-Host "--- 操作指南 ---"
Write-Host "1. 在浏览器中打开: http://localhost:3000"
Write-Host "2. 你会看到 Chatwoot 的初始账户设置页面，请创建一个管理员账户。"
Write-Host "3. 登录后，创建一个新的 'Website' 类型的 Inbox。"
Write-Host "4. 在 Inbox 的设置页面，复制新的 'Website Token'。"
Write-Host "5. 更新你的 Next.js 项目的 .env.local 文件:"
Write-Host "   NEXT_PUBLIC_CHATWOOT_BASE_URL=http://localhost:3000"
Write-Host "   NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN=粘贴你刚刚复制的新Token"
Write-Host "6. 重启你的 Next.js 开发服务器。"
Write-Host ""
Write-Host "要停止 Chatwoot 服务，请在此目录 ($ChatwootDir) 运行: docker-compose down"
Write-Host "-----------------" 