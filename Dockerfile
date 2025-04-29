# 基于官方node镜像，推荐使用LTS版本
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 启用 corepack 以支持 pnpm
RUN corepack enable

# 拷贝依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 拷贝全部源代码
COPY . .

# 构建Next.js生产环境
RUN pnpm build

# 生产环境镜像，减小体积
FROM node:20-alpine AS runner
WORKDIR /app

# 启用 corepack
RUN corepack enable

# 只拷贝生产依赖和构建产物
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.* ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/tsconfig.json ./

# 启动端口（阿里云会自动注入PORT环境变量）
ENV PORT=3000
EXPOSE 3000

# 启动命令
CMD ["pnpm", "start"] 