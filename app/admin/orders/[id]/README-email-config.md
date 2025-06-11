# 邮件配置指南

## 概述

管理员订单页面的邮件通知功能现在支持灵活配置，不再写死为QQ邮箱，可以使用多种邮件服务提供商。

## 支持的邮件服务

系统支持以下邮件服务提供商的自动配置：

- **Gmail** - 企业级首选
- **QQ邮箱** - 国内常用
- **163邮箱** - 网易邮箱
- **腾讯企业邮箱** - 企业用户
- **阿里云邮箱** - 企业用户
- **Outlook/Hotmail** - 微软邮箱
- **自定义SMTP** - 其他邮件服务

## 环境变量配置

### 推荐配置（通用SMTP）

```env
# 通用SMTP配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
SMTP_FROM_NAME=PCB Manufacturing
```

### 常见服务商配置

#### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### QQ邮箱
```env
SMTP_HOST=smtp.qq.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@qq.com
SMTP_PASS=your-authorization-code
```

#### 163邮箱
```env
SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@163.com
SMTP_PASS=your-authorization-code
```

### 兼容性配置

系统仍然兼容旧的QQ邮箱配置：
```env
QQ_EMAIL_USER=your-email@qq.com
QQ_EMAIL_AUTH_CODE=your-authorization-code
```

## 配置优先级

1. **显式SMTP配置** - `SMTP_HOST` + `SMTP_USER`
2. **兼容配置** - `QQ_EMAIL_USER` + `QQ_EMAIL_AUTH_CODE`
3. **错误提示** - 如果都没有配置

## 配置说明

### 必需变量
- `SMTP_HOST` - SMTP服务器地址
- `SMTP_USER` - 登录用户名（通常是邮箱地址）
- `SMTP_PASS` - 登录密码或授权码

### 可选变量
- `SMTP_PORT` - SMTP端口（默认587，SSL使用465）
- `SMTP_SECURE` - 是否使用SSL/TLS（465端口自动为true）
- `SMTP_FROM` - 发件人邮箱（默认使用SMTP_USER）
- `SMTP_FROM_NAME` - 发件人名称（默认"PCB Manufacturing"）

## 实现特点

### 智能配置
- 自动检测端口对应的SSL设置
- 支持多种配置方式的降级处理
- 提供清晰的错误提示

### 向后兼容
- 完全兼容现有的QQ邮箱配置
- 无需修改现有环境变量
- 平滑升级路径

### 灵活性
- 支持任意SMTP服务器
- 可自定义发件人信息
- 支持企业邮箱配置

## 使用示例

### 企业Gmail配置
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=orders@yourcompany.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=Your Company PCB Service
```

### 腾讯企业邮箱
```env
SMTP_HOST=smtp.exmail.qq.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=service@yourcompany.com
SMTP_PASS=your-password
SMTP_FROM_NAME=PCB Manufacturing Service
```

## 故障排除

### 常见问题

1. **Gmail认证失败**
   - 需要使用应用专用密码，不是普通登录密码
   - 确保开启了两步验证

2. **QQ邮箱连接失败**
   - 需要开启SMTP服务并获取授权码
   - 使用授权码而不是QQ密码

3. **企业邮箱配置**
   - 联系IT部门获取SMTP服务器配置
   - 确认是否需要特殊的认证方式

### 调试建议

1. 检查环境变量是否正确设置
2. 确认网络可以访问SMTP服务器
3. 验证邮箱账号和密码/授权码
4. 查看控制台日志了解详细错误

## 安全建议

1. **使用环境变量** - 永远不要在代码中硬编码密码
2. **应用专用密码** - Gmail等使用应用专用密码而非主密码
3. **权限最小化** - 邮箱账号只赋予发送邮件的权限
4. **定期轮换** - 定期更新邮件密码和授权码 