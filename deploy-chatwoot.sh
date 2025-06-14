#!/bin/bash

# Bash 脚本: 在 Ubuntu 上使用 Docker 部署 Chatwoot (端口已修改为 3001)
# 使用方法:
# 1. 确保你已经安装了 Docker 和 Docker Compose。
# 2. 将此脚本保存为 deploy-chatwoot.sh。
# 3. 在终端中给它执行权限: chmod +x deploy-chatwoot.sh
# 4. 运行脚本: ./deploy-chatwoot.sh

# --- 配置 ---
CHATWOOT_DIR="chatwoot-local" # Chatwoot 项目将被克隆到的目录名
CHATWOOT_PORT="3001" # Chatwoot 将要使用的端口
FRONTEND_URL="http://你的Ubuntu服务器IP:$CHATWOOT_PORT" # <--- 重要：请将这里替换为你 Ubuntu 的 IP 地址

# --- 脚本开始 ---
echo "🚀 开始在本地部署 Chatwoot..."

# 检查 Git 是否安装
if ! command -v git &> /dev/null
then
    echo "❌ 错误: Git 未安装。请运行 'sudo apt-get install git'。"
    exit
fi

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null
then
    echo "❌ 错误: Docker 未安装。请先安装 Docker。"
    exit
fi

# 检查 Docker Compose 是否可用
if ! docker compose version &> /dev/null
then
    echo "❌ 错误: Docker Compose 未找到。请确保 Docker 已正确安装并正在运行。"
    exit
fi

echo "✅ 环境检查通过 (Git, Docker, Docker Compose)"

# 1. 克隆 Chatwoot 仓库
if [ -d "$CHATWOOT_DIR" ]; then
    echo "📁 目录 '$CHATWOOT_DIR' 已存在，跳过克隆。"
else
    echo "📥 正在从 GitHub 克隆 Chatwoot..."
    git clone https://github.com/chatwoot/chatwoot.git $CHATWOOT_DIR
    if [ $? -ne 0 ]; then
        echo "❌ 克隆失败。"
        exit
    fi
fi

# 进入 Chatwoot 目录
cd $CHATWOOT_DIR

# 2. 修改 Docker Compose 端口配置
if [ -f "docker-compose.yml" ]; then
    echo "🐳 正在修改 docker-compose.yml，将端口从 3000 改为 $CHATWOOT_PORT..."
    # 使用 sed 直接修改端口映射
    sed -i "s/\"3000:3000\"/\"$CHATWOOT_PORT:3000\"/" docker-compose.yml
else
    echo "❌ 错误: docker-compose.yml 未找到。"
    exit
fi

# 3. 配置环境变量
if [ -f ".env" ]; then
    echo "📄 .env 文件已存在，跳过创建。"
else
    echo "⚙️  正在从 .env.example 创建 .env 配置文件..."
    cp .env.example .env
fi

echo "🔑 正在自动更新 .env 文件中的 FRONTEND_URL..."
sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=$FRONTEND_URL|" .env
echo "✅ .env 文件已配置为 $FRONTEND_URL"

# 4. 构建 Docker 镜像 (这一步可能需要一些时间)
echo "🏗️  正在构建 Docker 镜像，这可能需要几分钟..."
docker compose build
if [ $? -ne 0 ]; then
    echo "❌ Docker 镜像构建失败。"
    exit
fi

# 5. 准备数据库
echo "🗄️  正在准备数据库..."
docker compose run --rm rails bundle exec rails db:chatwoot_prepare
if [ $? -ne 0 ]; then
    echo "❌ 数据库准备失败。"
    exit
fi

# 6. 启动服务
echo "🚀 正在后台启动 Chatwoot 服务..."
docker compose up -d
if [ $? -ne 0 ]; then
    echo "❌ Chatwoot 启动失败。"
    exit
fi

echo "🎉 恭喜！Chatwoot 应该已经在你的 Ubuntu 服务器上成功运行！"
echo ""
echo "--- 操作指南 ---"
echo "1. 在浏览器中打开: $FRONTEND_URL"
echo "2. 你会看到 Chatwoot 的初始账户设置页面，请创建一个管理员账户。"
echo "3. 登录后，创建一个新的 'Website' 类型的 Inbox。"
echo "4. 在 Inbox 的设置页面，复制新的 'Website Token'。"
echo "5. 更新你的 Windows 开发机上的 Next.js 项目的 .env.local 文件:"
echo "   NEXT_PUBLIC_CHATWOOT_BASE_URL=$FRONTEND_URL"
echo "   NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN=粘贴你刚刚复制的新Token"
echo "6. 重启你的 Next.js 开发服务器。"
echo ""
echo "要停止 Chatwoot 服务，请在此目录 ($CHATWOOT_DIR) 运行: docker compose down"
echo "-----------------" 