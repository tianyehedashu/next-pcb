# Chatwoot 集成指南

本文档为项目中的 Chatwoot 功能提供了一份全面的集成、使用与开发指南。

---

## 1. Chatwoot 是什么？

[Chatwoot](https://www.chatwoot.com/) 是一个开源的客户沟通平台。它提供了一套功能强大的实时聊天解决方案，让企业可以通过网站、App 等多种渠道与客户建立联系，从而提供实时的客户支持，提升用户满意度。

**核心优势:**

- **实时在线聊天 (Live Chat)**: 为您的网站提供一个现代化、易于集成的聊天窗口。
- **多渠道整合**: 将来自网站、邮件、社交媒体等不同平台的客户对话统一汇集到一个收件箱中，方便客服团队统一处理。
- **自动化与效率**: 支持快捷回复、自动分配对话等功能，提升客服团队的工作效率。
- **开源与私有化部署**: 您可以将 Chatwoot 部署在自己的服务器上，完全掌控客户数据和系统架构，确保数据安全与合规。
- **丰富的 API**: 提供了强大的客户端和服务端 API，可以与现有业务系统（如用户系统、订单系统）深度集成。

---

## 2. 核心概念解读

为了更好地理解 Chatwoot 的配置和使用，以下是一些您会经常遇到的核心概念：

- **Inbox (收件箱)**
  - **是什么**：一个"收件箱"是处理来自特定来源的所有消息的地方。每个收件箱都独立于其他收件箱。
  - **类比**：您可以把它想象成一个部门的专用邮箱。例如，您可以为"销售部"创建一个收件箱（处理售前咨询），再为"技术支持部"创建另一个收件箱（处理售后问题）。

- **Channel (渠道)**
  - **是什么**：指客户与您联系的具体途径。Chatwoot 支持多种渠道。
  - **示例**：我们之前创建的"**网站 (Website)**"就是一个渠道。其他常见的渠道还包括电子邮件 (Email)、Facebook Messenger、WhatsApp 等。每个您创建的渠道，都会关联到一个收件箱。

- **Agent (客服 / 代理)**
  - **是什么**：指您团队中使用 Chatwoot 平台回复客户消息的成员。
  - **职责**：您需要将客服"分配"到特定的收件箱，他们才能看到并回复该收件箱中的消息。

- **Conversation (对话)**
  - **是什么**：指客服与一位客户之间的一系列完整的消息交流。一个对话可以包含多条消息，并且有自己的状态（如：开启、已解决、等待中）。
  - **类比**：就像微信里的一个聊天窗口。

- **Contact (联系人)**
  - **是什么**：指与您开始对话的客户或访客。
  - **关联**：当我们在项目中调用 `setUser` 方法时，实际上就是在为当前这个匿名的网站访客创建一个具名的"联系人"，或者将他与一个已存在的"联系人"关联起来。客服可以在联系人面板看到我们通过 `setCustomAttributes` 设置的所有自定义属性。

---

## 3. 沟通流程、场景与多渠道集成

### A. 网站访客与客服的基础沟通流程

以下是网站上一位匿名访客与客服完成一次沟通的典型流程：

1.  **访客发起对话**:
    - 访客在我们的网站上浏览，点击右下角的聊天图标，打开聊天窗口。
    - 访客输入问题（例如"你们的 PCB 加急服务最快多久？"）并发送。

2.  **Chatwoot 创建对话**:
    - Chatwoot 系统收到消息后，立即在对应的**收件箱 (Inbox)** 中创建一个状态为"开启 (Open)"的新**对话 (Conversation)**。

3.  **通知客服**:
    - 所有被分配到该收件箱的**客服 (Agents)** 都会在他们的 Chatwoot 后台看到这个新对话，并可能收到桌面或声音通知。

4.  **客服响应**:
    - 一位在线的客服点击该对话，将其"认领"到自己名下。此时，其他客服就知道此对话已有人处理。
    - 客服在 Chatwoot 的回复框中输入答案，并发送。

5.  **完成沟通**:
    - 回复内容会实时显示在访客网站的聊天窗口中。
    - 双方可以继续来回沟通，直到问题解决。
    - 问题解决后，客服会将此对话的状态标记为"已解决 (Resolved)"。如果访客后续再次发送消息，对话会自动重新打开。

### B. 典型业务场景示例

**场景一：售前咨询 (匿名访客)**

- **访客**: "你好，我正在看你们的 `4层板` 报价页面，如果我需要添加阻抗控制，费用怎么计算？"
- **客服**:
    - **(看到的信息)**: 客服在后台不仅能看到访客的消息，还能看到访客当前正在浏览的页面是 `https://next-pbc.com/quote?layer=4` (需要前端通过 `setCustomAttributes` 将当前 URL 传给 Chatwoot)。
    - **(如何回应)**: "您好！很高兴为您服务。4层板的阻抗控制是免费提供的。您可以在报价页面的'特殊工艺'选项中勾选'阻抗控制'，然后上传您的层压结构文件即可。如果您需要报价方面的协助，我可以帮您创建一份草稿询价单。"
- **价值**: 客服能够结合访客的上下文提供精准服务，提高了销售转化的可能性。

**场景二：售后支持 (已登录用户)**

- **访客 (已登录用户`李经理`)**: "我的订单 `PCB20231101-005` 生产到哪个阶段了？"
- **客服**:
    - **(看到的信息)**: 由于用户已登录，我们的系统通过 `setUser` 和 `setCustomAttributes` 传递了信息。客服在对话界面右侧的**联系人 (Contact)** 面板立刻能看到：
        - **姓名**: 李经理
        - **邮箱**: li.jingli@example.com
        - **自定义属性**:
            - `用户ID`: usr_12345
            - `公司名称`: 某某科技有限公司
            - `最近订单号`: PCB20231101-005
    - **(如何回应)**: "李经理您好！我马上为您查询。请稍等... 您的订单 `PCB20231101-005` 目前已经完成钻孔工序，正在进行沉铜电镀，预计明天可以进入线路制作环节。一切顺利！"
- **价值**: 无需反复询问用户身份和订单号，服务体验专业、高效，提升了客户满意度和忠诚度。

### C. 多渠道集成 (以 Facebook 为例)

Chatwoot 强大的地方在于它能将所有客户沟通渠道统一管理。

- **如何集成 Facebook**:
    1. 在 Chatwoot 后台，进入 **设置 (Settings)** > **收件箱 (Inboxes)** > **添加收件箱 (Add Inbox)**。
    2. 选择渠道为 **"Messenger"**。
    3. 按照屏幕提示，您将被引导至 Facebook 进行授权，选择您要关联的 Facebook 公共主页。
    4. 授权成功后，完成创建。

- **集成后的工作流程**:
    - **客户**: 通过 Facebook Messenger 给您的公司主页发送了一条消息。
    - **客服**: 这条消息会像网站访客的消息一样，直接出现在 Chatwoot 的收件箱中，并带有 Facebook 图标以作区分。
    - **客服**: 客服人员无需登录 Facebook，直接在 Chatwoot 界面内回复。
    - **客户**: 客户会在他的 Facebook Messenger 中收到客服的回复。

- **价值**: 客服团队只需在一个平台上工作，就能处理来自公司网站、Facebook 主页、电子邮件等所有渠道的客户咨询，极大地提升了工作效率，并确保不会遗漏任何客户消息。

### D. 不同角色的价值与使用方式

- **对于网站访客 / 潜在客户**:
    - **即时与便捷**: 无需离开当前页面，就能快速获得问题的答案，体验流畅。
    - **个性化服务**: 如果是已登录用户，能感受到 VIP 般的无缝服务，无需重复自己的身份信息。
    - **建立信任**: 能够与真人实时沟通，相比冰冷的邮件和表单，更能建立起对品牌的信任感。

- **对于客服人员**:
    - **高效的工作台**: 拥有一个统一的仪表盘来处理所有渠道的对话，避免在多个应用之间切换。
    - **全面的客户视图**: 通过自动识别和自定义属性，可以立刻了解客户的背景信息，提供更有针对性的服务。
    - **强大的辅助工具**: 可以使用**快捷回复 (Canned Responses)** 回答常见问题，通过**私密便签 (Private Notes)** 与其他同事协作讨论一个复杂问题，或使用**标签 (Labels)** 对话进行分类（如"紧急"、"功能建议"）。

### E. 移动端办公 (Mobile App)

Chatwoot 提供了功能完善的官方手机 App，支持 **iOS** 和 **Android** 平台，让客服人员可以随时随地处理客户咨询。

- **App 的使用者**: **仅限客服人员 (Agents)**。客户仍然通过网站聊天窗口等渠道发起沟通。
- **核心价值**: 让客服团队摆脱了电脑的束缚，可以实现移动办公，极大地提高了响应速度和灵活性。
- **主要功能**:
    - 接收新消息的实时推送通知。
    - 直接在 App 中回复对话。
    - 管理对话状态、分配任务、添加标签。
    - 查看完整的客户资料和自定义属性。
- **下载地址**:
    - **Apple App Store (iOS)**: `https://apps.apple.com/app/chatwoot/id1495796682`
    - **Google Play Store (Android)**: `https://play.google.com/store/apps/details?id=com.chatwoot.app`

### F. 查看聊天历史：对话的连续性

一个常见且核心的需求是：**已登录用户能否看到他之前的聊天记录？**
答案是：**能，这是 Chatwoot 的一项关键特性。**

- **实现原理**:
  实现对话连续性的核心在于 `setUser` API 调用中的 `identifier` 字段。这个字段相当于用户在 Chatwoot 系统中的"永久身份证号"。只要我们能保证每次用户登录后，都使用同一个、唯一的 `identifier` 来识别他，Chatwoot 就会自动拉取所有与该 `identifier` 关联的历史对话。

- **我们的实现**:
  在我们的项目中，我们使用的 `identifier` 正是用户在我们自己数据库中的**唯一用户 ID (`user.id`)**。这是一个完美的选择，因为它对于每个用户来说都是永久且不变的。

  ```tsx
  // 在 ChatwootUserSyncer 组件中...
  setUser({
    identifier: user.id, // <--- 核心！使用用户数据库 ID 作为永久标识
    name: user.display_name,
    email: user.email,
  });
  ```

- **效果**:
  用户在公司电脑上与客服的对话，回到家后用自己的笔记本电脑登录网站，打开聊天窗口，之前的对话记录会完整无缺地呈现在他眼前，提供了无缝的沟通体验。

- **匿名对话的合并**:
  如果一个访客在未登录时就开始聊天，之后再登录。Chatwoot 能够智能地将他登录前的匿名对话与登录后的身份进行合并，确保了沟通历史的完整性。

---

## 4. 本项目的集成架构

为了在 Next.js 项目中实现最佳性能和可维护性，我们采用了一套基于 **React Context** 和 **自定义 Hook** 的现代化集成方案。

### 核心设计思想：

这种架构的核心思想是**"一次加载，全局共享"**。
- **避免重复加载**: 我们通过一个全局的 `ChatwootProvider` 在应用根组件加载一次 Chatwoot 的 SDK，避免了在不同页面间切换时重复请求和初始化脚本，显著提升了性能。
- **状态集中管理**: 所有与 Chatwoot 相关的状态（如是否加载成功、是否准备就绪、API 实例等）都由 `ChatwootProvider` 统一管理。
- **简化业务逻辑**: 业务组件无需关心 Chatwoot 的加载细节。它们只需要通过 `useChatwootOptimized` 这个 Hook，就能轻松地获取到所需的状态和 API，让组件代码更简洁、更专注于业务本身。

### 架构组成：

1.  **环境配置 (`.env.local`)**:
    这是集成的第一步，也是最关键的一步。所有配置都通过环境变量完成，以实现开发、测试、生产环境的隔离。
    - `NEXT_PUBLIC_CHATWOOT_BASE_URL`: 您部署的 Chatwoot 实例 URL（例如 `https://chat.yourdomain.com`）。
    - `NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN`: 您在 Chatwoot 中创建的网站渠道（Inbox）的唯一标识 Token。

2.  **SDK 加载器 (`lib/chatwoot-optimized.ts`)**:
    该文件负责执行最核心的任务：动态创建 `<script>` 标签，将 Chatwoot 的 `sdk.js` 异步加载到页面中，并设置好全局 `window.chatwootSettings`。

3.  **全局提供者 (`components/ChatwootProvider.tsx`)**:
    一个 React Context Provider 组件，它包裹了整个应用的根布局。它负责调用 SDK 加载器、监听加载状态，并通过 Context 向下层所有组件提供 Chatwoot 的状态和 API。

4.  **自定义 Hook (`lib/hooks/useChatwootOptimized.ts`)**:
    这是业务开发中最常使用的工具。通过调用 `useChatwootOptimized()`，任何客户端组件都可以轻松地：
    - 获取 `chatwootAPI` 实例来调用官方 SDK 的所有方法。
    - 通过 `isReady` 和 `hasError` 状态判断 Chatwoot 的可用性。
    - 使用封装好的 `setUser` 和 `setCustomAttributes` 等便捷函数。

5.  **UI 组件 (`components/ChatwootWidgetOptimized.tsx`)**:
    这是一个简单的客户端组件，放置在 `ChatwootProvider` 内部。它负责在 Chatwoot 加载时显示一个加载提示，并在加载失败时提供友好的错误信息。

---

## 5. 已支持功能详解

当前集成方案已支持 Chatwoot 的核心功能，并针对本项目业务场景进行了优化。

- **动态异步加载**:
  聊天窗口的脚本采用异步加载，不会阻塞页面主要内容的渲染，保证了页面的高性能。

- **用户识别 (User Identification)**:
  当用户登录后，我们可以将其业务系统中的身份信息传递给 Chatwoot。
  - **作用**: 客服在后台可以直接看到用户的姓名、邮箱等信息，甚至可以点击链接跳转到我们系统的后台查看该用户的完整资料，极大地提高了沟通效率。
  - **调用**: `chatwootAPI.setUser({ identifier: user.id, name: user.name, email: user.email })`

- **自定义属性 (Custom Attributes)**:
  我们可以将更丰富的业务数据附加到用户上，为客服提供更全面的上下文。
  - **作用**: 这对于客服快速理解用户背景至关重要。例如，客服可以立刻看到用户的会员等级、当前正在处理的订单号、最近一次的购买日期等。
  - **示例**:
    ```javascript
    setCustomAttributes({
      '用户等级': 'VIP 客户',
      '当前订单号': 'PCB-20231027-001',
      '公司名称': user.companyName,
      '询价单数量': user.quoteCount,
    });
    ```

- **控制聊天窗口**:
  可以通过代码来控制聊天窗口的打开、关闭。
  - **作用**: 可以在特定的按钮（如"联系客服"）上绑定事件，点击后直接拉起聊天窗口。
  - **调用**: `chatwootAPI.toggle('open')` 或 `chatwootAPI.toggle('close')`。

- **健壮的错误处理**:
  如果因为网络问题或配置错误导致 `sdk.js` 加载失败，系统不会崩溃，而会在 UI 上给出提示，并在控制台打印详细的错误信息，便于快速定位问题。

---

## 6. 首次配置：从 Chatwoot 平台获取凭证

在将 Chatwoot 集成到项目之前，您需要先在 Chatwoot 官方平台或您的私有化部署实例中进行一次性配置，以获取必要的凭证。

**目标**：获取以下两个关键信息，用于后续的项目配置。
- **`Base URL`** (服务地址)
- **`Website Token`** (网站渠道令牌)

---

### 步骤 1：登录并创建"网站"渠道 (Inbox)

1.  **登录您的 Chatwoot 账户**。
    - 官方云服务地址为 `https://app.chatwoot.com`。
    - 如果您是私有化部署，请访问您自己的服务器地址。这个地址本身就是我们需要的 `Base URL`。

2.  **创建收件箱 (Inbox)**。
    - 导航至左侧菜单的 **设置 (Settings)** > **收件箱 (Inboxes)**。
    - 点击页面右上角的 **"添加收件箱 (Add Inbox)"** 按钮。

3.  **选择渠道类型**。
    - 在弹出的渠道列表中，选择 **"网站 (Website)"**。

### 步骤 2：填写网站信息并添加客服

1.  **填写渠道详情**：
    - **Website Name**: 为您的网站渠道命名，例如 `speedxPCB 项目官网`。
    - **Website Domain**: 填写您网站的域名。**在开发环境下，可以填写 `http://localhost:3000`**。
    - 其他设置可保持默认，点击 **"创建下一步 (Create Next)"**。

2.  **添加客服代理 (Add Agents)**：
    - 选择至少一位客服人员来负责处理来自这个网站的咨询。
    - 点击 **"添加代理并完成 (Add agents and finish)"**。

### 步骤 3：获取 Base URL 和 Website Token

1.  **找到代码片段**：
    - 完成以上步骤后，Chatwoot 会展示一段用于嵌入网站的 JavaScript 代码。**您无需完整复制代码**，只需从中提取关键信息。

2.  **提取凭证**：
    - 在这段代码中，找到 `baseUrl` 和 `websiteToken` 这两行。这两个值就是我们最终需要配置到项目中的凭证。

    **代码片段示例:**
    ```javascript
    (function(d,t) {
        var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
        g.src="https://app.chatwoot.com/packs/js/sdk.js";
        g.defer = true;
        g.async = true;
        s.parentNode.insertBefore(g,s);
        g.onload=function(){
          window.chatwootSDK.run({
            websiteToken: 'a1b2c3d4e5f6g7h8i9j0', // <--- 这是 Website Token
            baseUrl: 'https://app.chatwoot.com'      // <--- 这是 Base URL
          })
        }
      })(document,"script");
    ```
    - **`baseUrl`**: `https://app.chatwoot.com` 就是您需要的服务地址。
    - **`websiteToken`**: `a1b2c3d4e5f6g7h8i9j0` 就是您需要的网站令牌。

**请妥善保存这两个值，下一步将在项目中使用它们。**

---

## 7. 开发使用指南

### 步骤 1: 在项目中配置环境变量

1.  在项目**根目录**下，找到或新建一个名为 `.env.local` 的文件。

2.  打开该文件，将您在上一个章节获取到的 `Base URL` 和 `Website Token` 填入其中，格式如下：

    ```env
    NEXT_PUBLIC_CHATWOOT_BASE_URL="【在此填入您的 Base URL】"
    NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN="【在此填入您的 Website Token】"
    ```

    **正确示例:**
    ```env
    NEXT_PUBLIC_CHATWOOT_BASE_URL="https://app.chatwoot.com"
    NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN="a1b2c3d4e5f6g7h8i9j0"
    ```
    > **警告**:
    > - 值的两边不要有额外的引号或空格。
    > - 每次修改 `.env.local` 文件后，您**必须重启**开发服务器 ( `pnpm dev` )，配置才能生效。

### 步骤 2: 全局布局 (已完成)

`ChatwootProvider` 和 `ChatwootWidgetOptimized` 已经被配置在 `app/layout.tsx` 中，确保了 Chatwoot 在所有页面都可用。您通常无需修改此配置。

```tsx
// app/layout.tsx
import { ChatwootProvider } from '@/components/ChatwootProvider';
import { ChatwootWidgetOptimized } from '@/components/ChatwootWidgetOptimized';

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <ChatwootProvider>
          {/* 其他 Provider 和页面内容 */}
          {children}
          {/* Chatwoot UI 组件 */}
          <ChatwootWidgetOptimized />
        </ChatwootProvider>
      </body>
    </html>
  );
}
```

### 步骤 3: 在组件中使用

在**任何客户端组件 (`'use client'`)** 中，通过 `useChatwootOptimized` Hook 来与 Chatwoot 交互。

**场景一：用户登录后，立即识别用户并设置其业务信息**

假设您有一个在用户登录后会加载的组件，可以用 `useEffect` 来同步用户信息。

```tsx
'use client';

import { useEffect } from 'react';
import { useChatwootOptimized } from '@/lib/hooks/useChatwootOptimized';
import { useUserStore } from '@/lib/stores/user-store'; // 假设使用 Zustand store 获取用户信息

export default function ChatwootUserSyncer() {
  const { isReady, setUser, setCustomAttributes } = useChatwootOptimized();
  const { user } = useUserStore();

  useEffect(() => {
    // 确保 Chatwoot 就绪且用户已登录
    if (isReady && user) {
      // 1. 识别用户核心身份
      setUser({
        identifier: user.id, // 用户的唯一 ID
        name: user.display_name,
        email: user.email,
        avatar_url: user.avatar_url, // 头像地址
      });

      // 2. 设置丰富的自定义业务属性
      setCustomAttributes({
        '用户ID': user.id,
        '公司': user.company_name,
        '电话': user.phone_number,
        '最近登录IP': user.last_sign_in_ip,
      });
    }
  }, [isReady, user, setUser, setCustomAttributes]);

  return null; // 该组件仅用于同步数据，不渲染任何 UI
}
```

**场景二：点击"联系技术支持"按钮，直接打开聊天窗口**

```tsx
'use client';

import { useChatwootOptimized } from '@/lib/hooks/useChatwootOptimized';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

export default function ContactSupportButton() {
  const { isReady, chatwootAPI } = useChatwootOptimized();

  const handleOpenChat = () => {
    if (isReady && chatwootAPI) {
      // 如果聊天窗口已打开，则聚焦；如果已关闭，则打开
      chatwootAPI.toggle('open');
    } else {
      // 异常处理
      alert('在线聊天功能暂不可用，请稍后重试。');
    }
  };

  return (
    <Button onClick={handleOpenChat} disabled={!isReady} variant="outline">
      <MessageCircle className="mr-2 h-4 w-4" />
      联系技术支持
    </Button>
  );
}
```

---

## 8. 高级用法

### 监听 Chatwoot 事件

Chatwoot SDK 会通过 `window` 对象派发事件。您可以在 `useEffect` 中监听这些事件来响应聊天状态的变化。

**示例：当聊天窗口被打开时，在控制台打印一条消息**

```tsx
useEffect(() => {
  if (!isReady) return;

  const onChatwootEvent = (event) => {
    console.log('Chatwoot event received:', event.detail);
  };
  
  window.addEventListener('chatwoot:on-message', onChatwootEvent);
  window.addEventListener('chatwoot:on-conversation-status-change', onChatwootEvent);

  // 组件卸载时，务必清理监听器
  return () => {
    window.removeEventListener('chatwoot:on-message', onChatwootEvent);
    window.removeEventListener('chatwoot:on-conversation-status-change', onChatwootEvent);
  };
}, [isReady]);
```
> 常见的事件包括 `on-message`, `on-conversation-status-change` 等。

---

## 9. 故障排查与最佳实践

### 常见问题 (FAQ)

如果您发现聊天窗口无法加载，请参考 **`docs/CHATWOOT_TROUBLESHOOTING.md`**，或按以下步骤自查：

1.  **首要检查：环境变量**
    - `.env.local` 文件中的 `NEXT_PUBLIC_CHATWOOT_BASE_URL` 和 `NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN` 是否存在？
    - 值是否正确？有没有多余的空格或斜杠？
    - 修改 `.env.local`后，**是否重启了开发服务器 (`pnpm dev`)**？

2.  **网络问题**
    - 在浏览器中直接访问 `[您的 BASE_URL]/sdk.js`，看看是否能正常加载 JS 文件。
    - 检查本机的防火墙、代理或 VPN 设置，是否阻碍了对 Chatwoot 服务器的访问。

3.  **浏览器插件**
    - 广告拦截插件（如 uBlock Origin, AdGuard）可能会误判并拦截 `sdk.js` 的加载。尝试暂时禁用它们。

4.  **Chatwoot 服务器问题**
    - 如果是私有化部署，请检查您的 Chatwoot 服务是否运行正常，查看其后台日志有无报错。

### 最佳实践

- **切勿泄露敏感信息**: 不要在 `setCustomAttributes` 中传递密码、API Secret Key 等高度敏感的信息。
- **适度使用自定义属性**: 只传递对客服沟通有价值的信息，避免数据冗余。
- **在 `useEffect` 中调用 API**: 始终在 `useEffect` 中调用 `setUser` 等方法，并添加 `isReady` 作为依赖项，确保在 SDK 准备就绪后才执行。
- **统一管理**: 尽量将用户身份同步的逻辑收敛到一个专用组件中（如示例中的 `ChatwootUserSyncer`），而不是分散在各个页面。 

```
<script>
  (function(d,t) {
    var BASE_URL="http://0.0.0.0:3000";
    var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
    g.src=BASE_URL+"/packs/js/sdk.js";
    g.defer = true;
    g.async = true;
    s.parentNode.insertBefore(g,s);
    g.onload=function(){
      window.chatwootSDK.run({
        websiteToken: 'gxR8eLmxDgikP7ACaY6EeNVW',
        baseUrl: BASE_URL
      })
    }
  })(document,"script");
</script>
```