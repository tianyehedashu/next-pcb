# 对于 HTTP/HTTPS 协议的仓库
git -c http.proxy="socks5h://127.0.0.1:1080" push origin main

# 对于 SSH 协议的仓库（需结合 nc 或 socat 工具）
# 方法一：使用 nc（netcat）
git -c core.sshCommand='ssh -o ProxyCommand="nc -x 127.0.0.1:1080 %h %p"' push origin main

# 方法二：使用 socat（需先安装 socat）
git -c core.sshCommand='ssh -o ProxyCommand="socat - SOCKS4A:127.0.0.1:%h:%p,socksport=1080"' push origin main



git branch --unset-upstream


在Git中，你可以通过配置来避免每次推送或拉取代码时都输入用户名和密码。以下是几种常见的配置方法：


### **1. 使用凭证存储（Credential Storage）**
Git提供了多种凭证存储方式，其中最方便的是 **缓存凭证** 和 **永久存储凭证**。


#### **方法一：临时缓存密码（推荐）**
将密码临时缓存在内存中，避免频繁输入（默认缓存15分钟）：
```bash
git config --global credential.helper cache
```
若想自定义缓存时间（例如1小时，单位为秒）：
```bash
git config --global credential.helper 'cache --timeout=3600'
```


#### **方法二：永久存储密码（不安全，慎用）**
将密码以明文形式存储在文件中（不推荐在共享设备上使用）：
```bash
git config --global credential.helper store
```
密码会被存储在 `~/.git-credentials` 文件中，格式为：
```plaintext
https://用户名:密码@github.com
```


#### **方法三：使用系统密钥链（安全，推荐）**
利用操作系统的密钥管理工具（如 macOS Keychain、Windows Credential Manager）存储密码：

```bash
# macOS
git config --global credential.helper osxkeychain

# Windows
git config --global credential.helper wincred

# Linux（需安装 libsecret）
git config --global credential.helper /usr/share/git-core/git-credential-libsecret
```


### **2. 验证配置**
查看当前的凭证存储配置：
```bash
git config --global --get credential.helper
```


### **3. 清除已存储的密码**
若想删除已存储的凭证：
```bash
# 清除缓存的凭证
git credential-cache exit

# 手动删除存储的凭证文件
rm ~/.git-credentials  # 仅针对使用 store 方式的情况
```


### **4. 使用 SSH 替代 HTTPS（终极方案）**
SSH 协议无需每次输入密码，只需配置 SSH Key：

#### **步骤 1：生成 SSH Key**
```bash
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

#### **步骤 2：将公钥添加到 GitHub/GitLab**
```bash
cat ~/.ssh/id_rsa.pub  # 复制输出的内容
```
在代码托管平台的设置中添加 SSH Key。

#### **步骤 3：切换远程仓库 URL**
将 HTTPS 地址替换为 SSH 地址：
```bash
git remote set-url origin git@github.com:用户名/仓库名.git
```
git 密码存储
git config --global credential.helper store

### **推荐方案对比**
| 方法               | 安全性 | 便利性 | 适用场景               |
|--------------------|--------|--------|------------------------|
| 缓存凭证（cache）  | 中     | 高     | 短期使用同一设备        |
| 系统密钥链         | 高     | 高     | 个人设备               |
| SSH 密钥           | 最高   | 高     | 长期使用，无需输入密码 |
| 明文存储（store）  | 低     | 高     | 仅推荐个人私有设备使用 |


### **注意事项**
- **安全风险**：避免在共享设备上使用明文存储密码。
- **多账户支持**：若需要管理多个 Git 账户，可使用 `~/.ssh/config` 配置不同的 SSH Key。
- **HTTPS vs SSH**：SSH 更安全，HTTPS 更易用（尤其是在代理环境下）。

通过以上配置，你可以根据需求选择最适合的方式来管理 Git 凭证。