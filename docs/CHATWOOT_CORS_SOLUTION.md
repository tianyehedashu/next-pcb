# Chatwoot CORS 问题解决方案

## 问题描述

您遇到的错误：
```
请求网址: http://www.leodennis.top:3000/packs/js/sdk.js
引荐来源网址政策: strict-origin-when-cross-origin
```

这是一个典型的跨域资源共享（CORS）问题，由浏览器的同源策略引起。

## 问题原因

1. **同源策略限制**: 浏览器阻止从不同域名加载脚本资源
2. **CORS 头缺失**: Chatwoot 服务器未配置正确的 CORS 响应头
3. **引荐来源网址政策**: 现代浏览器的安全策略更加严格
4. **HTTP vs HTTPS**: 混合内容问题可能导致加载失败

## 解决方案

### 方案一：本地 SDK 文件（推荐 ⭐）

**这是最简单、最可靠的解决方案，完全避免 CORS 问题。**

#### 1. 下载 SDK 到本地

```powershell
# 创建目录
mkdir public/chatwoot

# 下载 SDK 文件
Invoke-WebRequest -Uri "http://www.leodennis.top:3000/packs/js/sdk.js" -OutFile "public/chatwoot/sdk.js"
```

#### 2. 使用本地加载器

项目已包含 `lib/chatwoot-sdk-loader-local.ts`，它会从本地加载 SDK：

```typescript
import { loadChatwootSdkLocal } from '@/lib/chatwoot-sdk-loader-local';

// 使用本地 SDK（无 CORS 问题）
const { sdk } = await loadChatwootSdkLocal(baseUrl, websiteToken, settings);
```

#### 3. 自动更新脚本

使用提供的 PowerShell 脚本定期更新 SDK：

```powershell
# 更新 SDK
./scripts/update-chatwoot-sdk.ps1

# 强制更新
./scripts/update-chatwoot-sdk.ps1 -Force

# 不创建备份
./scripts/update-chatwoot-sdk.ps1 -Backup:$false
```

#### 4. 测试

访问 `/test-local-chatwoot` 页面测试本地 SDK 是否正常工作。

### 方案二：服务器端配置

#### 1. Nginx 配置

如果您使用 Nginx 作为反向代理，添加以下配置：

```nginx
server {
    listen 80;
    server_name www.leodennis.top;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS 头配置
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With";
        add_header Access-Control-Allow-Credentials true;
        
        # 处理预检请求
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE";
            add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With";
            add_header Access-Control-Max-Age 86400;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 200;
        }
    }
    
    # 特别处理 SDK 文件
    location /packs/js/sdk.js {
        proxy_pass http://localhost:3000/packs/js/sdk.js;
        add_header Access-Control-Allow-Origin *;
        add_header Content-Type application/javascript;
        add_header Cache-Control "public, max-age=3600";
    }
}
```

#### 2. Apache 配置

如果使用 Apache，在 `.htaccess` 或虚拟主机配置中添加：

```apache
<IfModule mod_headers.c>
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
    Header always set Access-Control-Allow-Credentials "true"
</IfModule>

# 处理预检请求
RewriteEngine On
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]
```

#### 3. Chatwoot Docker 配置

如果使用 Docker 部署 Chatwoot，在 `docker-compose.yml` 中添加环境变量：

```yaml
services:
  rails:
    environment:
      - CORS_ORIGINS=*
      - FRONTEND_URL=http://www.leodennis.top:3000
```

### 方案二：使用 HTTPS（强烈推荐）

现代浏览器对 HTTPS 的 CORS 支持更好，建议升级到 HTTPS：

#### 1. 获取 SSL 证书

使用 Let's Encrypt 免费证书：

```bash
# 安装 certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d www.leodennis.top

# 自动续期
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

#### 2. 更新环境变量

```env
NEXT_PUBLIC_CHATWOOT_BASE_URL=https://www.leodennis.top:3000
```

#### 3. Nginx HTTPS 配置

```nginx
server {
    listen 443 ssl http2;
    server_name www.leodennis.top;
    
    ssl_certificate /etc/letsencrypt/live/www.leodennis.top/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.leodennis.top/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        
        # CORS 头
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type";
    }
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name www.leodennis.top;
    return 301 https://$server_name$request_uri;
}
```

### 方案三：客户端代理（已实现）

我们已经为您创建了一个 API 代理来解决 CORS 问题：

#### 1. 使用代理加载器

```typescript
import { loadChatwootSdkWithProxy } from '@/lib/chatwoot-sdk-loader-with-proxy';

// 在组件中使用
const { sdk } = await loadChatwootSdkWithProxy(baseUrl, websiteToken, settings);
```

#### 2. 代理 API 端点

访问 `/api/chatwoot-proxy/sdk` 来获取 SDK 文件，这个端点会：
- 代理请求到 Chatwoot 服务器
- 添加正确的 CORS 头
- 设置适当的缓存策略

### 方案四：临时解决方案

#### 1. 浏览器设置（仅用于测试）

**Chrome:**
```bash
# 启动时禁用 CORS（仅用于开发测试）
chrome.exe --user-data-dir=/tmp/chrome_dev_session --disable-web-security --disable-features=VizDisplayCompositor
```

**注意**: 这种方法仅适用于开发测试，不要在生产环境使用。

#### 2. 使用浏览器扩展

安装 "CORS Unblock" 或类似的浏览器扩展来临时禁用 CORS 检查。

## 测试和验证

### 1. 访问测试页面

访问 `/chatwoot-cors-fix` 页面来测试 CORS 修复效果。

### 2. 浏览器开发者工具

打开浏览器开发者工具，检查：
- **Console**: 查看是否有 CORS 错误
- **Network**: 检查 SDK 请求的响应头
- **Application**: 验证 Chatwoot 是否正确加载

### 3. 手动测试

在浏览器控制台运行：

```javascript
// 测试 SDK 是否加载
console.log('Chatwoot SDK:', !!window.chatwootSDK);
console.log('Chatwoot API:', !!window.$chatwoot);

// 测试聊天功能
if (window.$chatwoot) {
  window.$chatwoot.toggle('open');
}
```

## 推荐实施顺序

1. **立即实施**: 使用我们提供的代理方案（方案三）
2. **短期目标**: 配置服务器端 CORS 头（方案一）
3. **长期目标**: 升级到 HTTPS（方案二）

## 常见问题

### Q: 为什么直接访问 SDK URL 返回 404？

A: 这可能是因为：
- Chatwoot 服务未正确启动
- 路由配置问题
- 资源文件未正确编译

### Q: 配置了 CORS 头但仍然有问题？

A: 检查：
- 是否重启了 Web 服务器
- 配置语法是否正确
- 是否有其他中间件覆盖了 CORS 头

### Q: HTTPS 证书配置后无法访问？

A: 确认：
- 证书路径是否正确
- 防火墙是否开放 443 端口
- DNS 解析是否正确

## 联系支持

如果问题仍然存在，请提供：
- 浏览器控制台的完整错误信息
- 网络请求的详细信息
- 服务器配置文件
- Chatwoot 版本信息

这样我们可以提供更精确的解决方案。 