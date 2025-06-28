# 📊 Analytics Setup Guide

这是一个完整的网站分析与优化集成方案，包含多个免费和付费工具的集成。

## 🚀 快速开始

### 1. 环境变量配置

在项目根目录创建 `.env.local` 文件，并添加以下配置：

```bash
# === Google Analytics 4 (必需) ===
# 从 Google Analytics 管理后台获取 Measurement ID
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX

# === Microsoft Clarity (强烈推荐 - 免费) ===
# 从 https://clarity.microsoft.com/ 获取项目 ID
NEXT_PUBLIC_CLARITY_PROJECT_ID=xxxxxxxxxx

# === Google Tag Manager (可选 - 推荐) ===
# 从 Google Tag Manager 获取容器 ID
NEXT_PUBLIC_GTM_CONTAINER_ID=GTM-XXXXXXXXX

# === Mixpanel (可选 - 高级事件追踪) ===
# 从 Mixpanel 设置页面获取项目令牌
NEXT_PUBLIC_MIXPANEL_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# === PostHog (可选 - 开源替代方案) ===
# 注册 https://posthog.com/ 或自建
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# === Hotjar (可选 - 热图和录屏) ===
# 从 Hotjar 设置页面获取站点 ID
NEXT_PUBLIC_HOTJAR_ID=xxxxxxx
NEXT_PUBLIC_HOTJAR_SV=6

# === 开发设置 ===
NEXT_PUBLIC_ANALYTICS_DEBUG=false
```

### 2. 工具优先级建议

#### 🎯 **第一优先级（必须）**
1. **Google Analytics 4** - 核心流量分析
2. **Microsoft Clarity** - 免费用户行为分析

#### 🔧 **第二优先级（推荐）**
3. **Google Tag Manager** - 统一标签管理
4. **Google Search Console** - SEO 性能监控

#### 📈 **第三优先级（高级功能）**
5. **Mixpanel** - 深度事件追踪
6. **Hotjar** - 热图和用户录屏
7. **PostHog** - 开源产品分析

## 🔧 工具设置步骤

### Google Analytics 4 设置

1. 访问 [Google Analytics](https://analytics.google.com/)
2. 创建新的 GA4 属性
3. 获取 Measurement ID（格式：G-XXXXXXXXXX）
4. 设置转化目标：
   - Quote Submission
   - Order Completion
   - User Registration
   - Content Engagement

### Microsoft Clarity 设置

1. 访问 [Microsoft Clarity](https://clarity.microsoft.com/)
2. 添加新网站
3. 获取项目 ID
4. 自动获得：
   - 用户会话录屏
   - 热图分析
   - 点击分析
   - 滚动深度

### Google Tag Manager 设置

1. 访问 [Google Tag Manager](https://tagmanager.google.com/)
2. 创建新容器
3. 获取容器 ID（格式：GTM-XXXXXXXXX）
4. 配置标签：
   - Google Analytics
   - 转化追踪
   - 自定义事件

### Mixpanel 设置

1. 注册 [Mixpanel](https://mixpanel.com/)
2. 创建新项目
3. 获取项目令牌
4. 设置漏斗分析：
   - 访问首页 → 查看报价页 → 提交报价 → 完成订单

## 📝 使用方法

### 在组件中使用分析

```tsx
import { useAnalytics } from '@/hooks/useAnalytics';

export function QuoteForm() {
  const analytics = useAnalytics();

  const handleQuoteSubmit = (quoteData) => {
    // 追踪报价提交
    analytics.trackQuoteSubmit({
      quote_id: quoteData.id,
      pcb_type: quoteData.pcb_type,
      layers: quoteData.layers,
      quantity: quoteData.quantity,
      value: quoteData.total_price,
      user_type: user ? 'registered' : 'guest',
      gerber_analyzed: quoteData.gerber_analyzed,
    });

    // 提交表单逻辑...
  };

  return (
    <form onSubmit={handleQuoteSubmit}>
      {/* 表单内容 */}
    </form>
  );
}
```

### 常用追踪事件

```tsx
// 页面浏览
analytics.trackPageView();

// 按钮点击
analytics.trackButtonClick('Get Quote', 'hero-section');

// 表单交互
analytics.trackFormStart('contact-form');
analytics.trackFormSubmit('contact-form', true);

// 内容查看
analytics.trackContentView('article', articleId, articleTitle);

// 错误追踪
analytics.trackError('api_error', errorMessage, { endpoint: '/api/quote' });

// 聊天交互
analytics.trackChatOpen('header-button');
analytics.trackChatMessage('sent');

// 电商事件
analytics.trackPurchase(orderId, items, totalValue);
```

## 📊 数据分析仪表板

### Google Analytics 4 关键指标
- **流量来源分析**
- **用户行为流**
- **转化漏斗**
- **收入追踪**

### Microsoft Clarity 分析重点
- **用户会话录屏**：观察用户真实操作
- **热图分析**：了解页面热点区域
- **错误点击**：发现 UI 问题
- **页面滚动**：优化内容布局

### Mixpanel 高级分析
- **用户群体分析**
- **留存率分析**
- **漏斗转化率**
- **A/B 测试结果**

## 🎯 关键业务指标 (KPIs)

### 网站性能指标
- **页面加载时间**
- **跳出率**
- **会话时长**
- **页面浏览深度**

### 业务转化指标
- **报价请求率**：访客 → 报价请求
- **报价转化率**：报价请求 → 订单
- **客户获取成本** (CAC)
- **客户生命周期价值** (LTV)

### 用户体验指标
- **表单完成率**
- **错误率**
- **聊天启动率**
- **用户满意度**

## 🔍 调试和测试

### 开发环境调试

在开发环境中，设置 `NEXT_PUBLIC_ANALYTICS_DEBUG=true` 启用调试面板。

调试面板会显示：
- 各工具启用状态
- 用户识别状态
- 实时事件日志

### 测试分析事件

```tsx
// 测试事件发送
analytics.trackCustomEvent('test_event', {
  test_property: 'test_value',
  timestamp: new Date().toISOString(),
});
```

### 验证数据流

1. **Google Analytics**：实时报告查看事件
2. **Microsoft Clarity**：会话录屏中查看标签
3. **Mixpanel**：Live View 查看实时事件
4. **浏览器开发者工具**：网络面板查看请求

## 🚨 隐私合规

### GDPR 合规
- 所有工具都支持 IP 匿名化
- 用户可以选择退出追踪
- 明确的隐私政策声明

### Cookie 管理
- 使用 `localStorage` 存储用户偏好
- 尊重用户的 Do Not Track 设置
- 提供清晰的 Cookie 同意选项

## 📈 优化建议

### 性能优化
- 异步加载所有分析脚本
- 使用 `strategy="afterInteractive"` 延迟加载
- 最小化数据传输量

### 数据质量
- 设置数据过滤器排除内部流量
- 定期审查和清理数据
- 确保事件命名一致性

### 成本控制
- 优先使用免费工具（GA4 + Clarity）
- 根据业务规模选择付费工具
- 定期评估工具 ROI

## 🔄 维护和更新

### 定期检查
- 每月检查数据质量
- 每季度评估工具性能
- 每年更新分析策略

### 新功能添加
- 关注工具更新和新功能
- 根据业务需求添加新的追踪事件
- 持续优化用户体验

## 📞 支持和文档

- [Google Analytics 4 文档](https://developers.google.com/analytics/devguides/collection/ga4)
- [Microsoft Clarity 帮助](https://docs.microsoft.com/en-us/clarity/)
- [Mixpanel 开发者文档](https://developer.mixpanel.com/)
- [PostHog 文档](https://posthog.com/docs)

---

通过这个全面的分析系统，你将能够：
- 📊 深入了解用户行为
- 🎯 优化转化漏斗
- 💡 做出数据驱动的决策
- 🚀 持续改进网站性能 