# 📊 Analytics Usage Examples

## 🚀 快速开始示例

### 基础使用

```tsx
import { useAnalytics } from '@/lib/analytics';

export function QuoteForm() {
  const analytics = useAnalytics();

  const handleSubmit = (quoteData) => {
    // 追踪报价提交
    analytics.trackQuoteSubmit({
      quote_id: quoteData.id,
      pcb_type: quoteData.pcb_type,
      layers: quoteData.layers,
      quantity: quoteData.quantity,
      value: quoteData.total_price,
      user_type: user ? 'registered' : 'guest',
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 表单内容 */}
    </form>
  );
}
```

### 简化API使用

```tsx
import { quickSetup } from '@/lib/analytics';

// PCB业务相关事件
quickSetup.pcb.quoteStarted();
quickSetup.pcb.gerberUploaded(3);
quickSetup.pcb.calculatorUsed('impedance');

// 网站常用事件
quickSetup.website.contactFormSubmitted('general');
quickSetup.website.articleViewed('pcb-design-guide', 'PCB Design Best Practices');
quickSetup.website.ctaClicked('Get Quote Now', 'hero-section');

// 错误追踪
quickSetup.errors.apiError('/api/quote', 500, 'Server Error');
quickSetup.errors.formError('quote-form', 'quantity', 'Invalid quantity');
```

## 📝 实际业务场景示例

### 1. 报价系统集成

```tsx
// app/quote2/page.tsx
import { useAnalytics } from '@/lib/analytics';

export function QuotePage() {
  const analytics = useAnalytics();

  useEffect(() => {
    // 页面访问追踪
    analytics.trackPageView();
    analytics.trackFormStart('pcb-quote-form');
  }, []);

  const handleFileUpload = (files: File[]) => {
    analytics.trackCustomEvent('gerber_upload_start', {
      file_count: files.length,
      total_size: files.reduce((sum, file) => sum + file.size, 0),
    });
  };

  const handleQuoteGenerated = (quote: Quote) => {
    analytics.trackQuoteSubmit({
      quote_id: quote.id,
      pcb_type: quote.board_type,
      layers: quote.layers,
      quantity: quote.quantity,
      value: quote.total_price,
      user_type: user ? 'registered' : 'guest',
      gerber_analyzed: quote.gerber_analysis?.analyzed || false,
      delivery_option: quote.delivery_option,
    });

    // Microsoft Clarity 标记
    analytics.trackCustomEvent('quote_milestone', {
      milestone: 'quote_generated',
      quote_value: quote.total_price,
    });
  };

  return (
    <QuoteFormComponent 
      onFileUpload={handleFileUpload}
      onQuoteGenerated={handleQuoteGenerated}
    />
  );
}
```

### 2. 电商订单追踪

```tsx
// app/payment/[orderId]/PaymentPageClient.tsx
import { useAnalytics } from '@/lib/analytics';

export function PaymentPageClient() {
  const analytics = useAnalytics();

  const handlePaymentStart = (amount: number) => {
    analytics.trackCheckoutStart(amount);
    
    // Mixpanel 漏斗分析
    analytics.trackCustomEvent('checkout_started', {
      order_value: amount,
      payment_method: 'stripe',
      currency: 'USD',
    });
  };

  const handlePaymentSuccess = (order: Order) => {
    // 核心转化事件
    analytics.trackPurchase(
      order.id, 
      order.items.map(item => ({
        id: item.quote_id,
        name: `PCB Order - ${item.pcb_type}`,
        category: 'PCB Manufacturing',
        price: item.price,
        quantity: item.quantity,
      })),
      order.total_amount
    );

    // 设置用户属性
    analytics.identifyUser({
      id: order.user_id,
      type: 'registered',
      email: order.billing_email,
    });

    // Microsoft Clarity 里程碑
    analytics.trackCustomEvent('conversion_completed', {
      order_id: order.id,
      customer_type: order.user.first_order ? 'new' : 'returning',
      order_value: order.total_amount,
    });
  };

  const handlePaymentError = (error: PaymentError) => {
    analytics.trackError('payment_failed', error.message, {
      error_code: error.code,
      payment_method: error.payment_method,
      order_amount: error.amount,
    });
  };

  return (
    <PaymentForm 
      onPaymentStart={handlePaymentStart}
      onPaymentSuccess={handlePaymentSuccess}
      onPaymentError={handlePaymentError}
    />
  );
}
```

### 3. 内容管理系统追踪

```tsx
// app/content/[slug]/page.tsx
export async function ContentPage({ params }: { params: { slug: string } }) {
  // 服务端不追踪，在客户端组件中处理
  return <ContentPageClient slug={params.slug} />;
}

function ContentPageClient({ slug }: { slug: string }) {
  const analytics = useAnalytics();
  const [article, setArticle] = useState<Article | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    if (article) {
      // 内容查看追踪
      analytics.trackContentView('article', article.id, article.title);
      
      // 详细的内容分析
      analytics.trackCustomEvent('article_opened', {
        article_id: article.id,
        article_category: article.category?.name,
        article_type: article.type,
        estimated_reading_time: Math.ceil(article.content.length / 1000),
        author: article.author?.company_name,
      });
    }
  }, [article]);

  // 阅读进度追踪
  useEffect(() => {
    const milestones = [25, 50, 75, 90, 100];
    const milestone = milestones.find(m => readingProgress >= m && readingProgress < m + 5);
    
    if (milestone) {
      analytics.trackCustomEvent('reading_progress', {
        article_id: article?.id,
        progress_percentage: milestone,
        time_spent: Date.now() - pageStartTime,
      });
    }
  }, [readingProgress]);

  const handleShare = (method: string) => {
    analytics.trackContentShare(article?.id || '', method);
  };

  const handleDownload = (format: string) => {
    analytics.trackDownload(`${article?.title}.${format}`, format);
    
    analytics.trackCustomEvent('content_download', {
      article_id: article?.id,
      download_format: format,
      article_category: article?.category?.name,
    });
  };

  return (
    <article>
      {/* 内容渲染 */}
      <ShareButtons onShare={handleShare} />
      <DownloadButton onDownload={handleDownload} />
    </article>
  );
}
```

### 4. 用户认证追踪

```tsx
// app/auth/page.tsx
import { useAnalytics } from '@/lib/analytics';

export function AuthPage() {
  const analytics = useAnalytics();

  const handleSignup = async (userData: SignupData) => {
    try {
      const user = await signup(userData);
      
      // 用户注册追踪
      analytics.trackUserSignup('email');
      analytics.identifyUser({
        id: user.id,
        email: user.email,
        type: 'registered',
        company: userData.company,
      });

      // 详细的注册分析
      analytics.trackCustomEvent('user_registered', {
        signup_method: 'email',
        company_provided: !!userData.company,
        referrer: document.referrer,
        registration_source: localStorage.getItem('registration_source'),
      });

    } catch (error) {
      analytics.trackError('signup_failed', error.message, {
        form_data: {
          has_company: !!userData.company,
          email_domain: userData.email.split('@')[1],
        },
      });
    }
  };

  const handleLogin = async (credentials: LoginData) => {
    try {
      const user = await login(credentials);
      
      analytics.trackUserLogin('email');
      analytics.identifyUser({
        id: user.id,
        email: user.email,
        type: user.role === 'admin' ? 'admin' : 'registered',
      });

    } catch (error) {
      analytics.trackError('login_failed', error.message, {
        login_method: 'email',
      });
    }
  };

  return (
    <AuthForm 
      onSignup={handleSignup}
      onLogin={handleLogin}
    />
  );
}
```

### 5. 客服系统集成

```tsx
// app/components/ChatwootProvider.tsx
import { useAnalytics } from '@/lib/analytics';

export function ChatwootProvider({ children }: { children: ReactNode }) {
  const analytics = useAnalytics();

  useEffect(() => {
    // Chatwoot 事件监听
    window.addEventListener('chatwoot:ready', () => {
      console.log('Chatwoot is ready');
    });

    window.addEventListener('chatwoot:opened', () => {
      analytics.trackChatOpen('widget');
      analytics.trackCustomEvent('support_chat_opened', {
        source: 'chatwoot_widget',
        page: window.location.pathname,
        user_type: user ? 'registered' : 'guest',
      });
    });

    window.addEventListener('chatwoot:closed', () => {
      analytics.trackCustomEvent('support_chat_closed', {
        source: 'chatwoot_widget',
        session_duration: chatSession.duration,
      });
    });

    return () => {
      // 清理事件监听器
    };
  }, []);

  return <>{children}</>;
}
```

### 6. 错误边界和性能监控

```tsx
// app/components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';
import { analytics } from '@/lib/analytics';

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // 错误追踪
    analytics.trackError('react_error', error.message, {
      stack: error.stack,
      component_stack: errorInfo.componentStack,
      error_boundary: 'main',
      page: window.location.pathname,
    });

    // 发送到外部错误追踪服务
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong.</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 7. 性能监控

```tsx
// lib/performance-monitor.ts
import { analytics } from '@/lib/analytics';

export function initPerformanceMonitoring() {
  // Core Web Vitals
  if (typeof window !== 'undefined') {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS((metric) => {
        analytics.trackPerformance('CLS', metric.value);
      });

      getFID((metric) => {
        analytics.trackPerformance('FID', metric.value);
      });

      getFCP((metric) => {
        analytics.trackPerformance('FCP', metric.value);
      });

      getLCP((metric) => {
        analytics.trackPerformance('LCP', metric.value);
      });

      getTTFB((metric) => {
        analytics.trackPerformance('TTFB', metric.value);
      });
    });
  }

  // API 响应时间监控
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const startTime = performance.now();
    try {
      const response = await originalFetch(...args);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // 追踪 API 性能
      analytics.trackCustomEvent('api_performance', {
        endpoint: args[0],
        duration,
        status: response.status,
        success: response.ok,
      });

      return response;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      analytics.trackError('api_error', error.message, {
        endpoint: args[0],
        duration,
      });

      throw error;
    }
  };
}
```

## 📊 A/B 测试示例

```tsx
// lib/ab-testing.ts
import { analytics } from '@/lib/analytics';

export function trackABTest(testName: string, variant: string, userId?: string) {
  analytics.trackCustomEvent('ab_test_exposure', {
    test_name: testName,
    variant,
    user_id: userId,
  });

  // Microsoft Clarity 标记
  if (window.clarity) {
    window.clarity('set', `ab_${testName}`, variant);
  }
}

// 使用示例
export function HeroSection() {
  const variant = useABTest('hero_cta_text'); // 'control' | 'variant_a'
  
  useEffect(() => {
    trackABTest('hero_cta_text', variant);
  }, [variant]);

  const ctaText = variant === 'variant_a' ? 'Get Your Quote Now' : 'Request Quote';

  return (
    <section>
      <button onClick={() => analytics.trackButtonClick(ctaText, 'hero')}>
        {ctaText}
      </button>
    </section>
  );
}
```

## 🎯 关键指标仪表板

```tsx
// app/admin/analytics/page.tsx
import { useEffect, useState } from 'react';
import { getAnalyticsStatus, debug } from '@/lib/analytics';

export function AnalyticsDashboard() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    setStatus(getAnalyticsStatus());
  }, []);

  const handleTestAllTools = () => {
    debug.testAllTools();
  };

  const handleCheckStatus = () => {
    const toolsStatus = debug.checkToolsLoaded();
    console.log('Tools Status:', toolsStatus);
  };

  return (
    <div className="analytics-dashboard">
      <h2>Analytics Status</h2>
      
      {status && (
        <div className="status-grid">
          <div>GA4: {status.ga4_enabled ? '✅' : '❌'}</div>
          <div>Clarity: {status.clarity_enabled ? '✅' : '❌'}</div>
          <div>Mixpanel: {status.mixpanel_enabled ? '✅' : '❌'}</div>
          <div>User ID: {status.user_identified ? '✅' : '❌'}</div>
        </div>
      )}

      <div className="actions">
        <button onClick={handleTestAllTools}>Test All Tools</button>
        <button onClick={handleCheckStatus}>Check Status</button>
      </div>
    </div>
  );
}
```

通过这些示例，你可以看到如何在各种场景下集成和使用分析工具，确保获得有价值的用户行为洞察和业务数据。 