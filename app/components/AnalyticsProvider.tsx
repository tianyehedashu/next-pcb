'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ANALYTICS_CONFIG } from '@/lib/analytics/config';
import { analytics } from '@/lib/analytics/analytics-manager';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isInitialized, setIsInitialized] = useState(false);

  // Track route changes
  useEffect(() => {
    if (isInitialized) {
      analytics.trackPageView(pathname);
    }
  }, [pathname, isInitialized]);

  // Initialize analytics after scripts load
  const handleScriptsLoad = () => {
    setIsInitialized(true);
    if (ANALYTICS_CONFIG.DEBUG) {
      console.log('📊 Analytics scripts loaded');
    }
  };

  return (
    <>
      {/* Google Analytics 4 */}
      {ANALYTICS_CONFIG.GA4.enabled && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_CONFIG.GA4.measurementId}`}
            strategy="afterInteractive"
            onLoad={handleScriptsLoad}
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${ANALYTICS_CONFIG.GA4.measurementId}', {
                page_path: window.location.pathname,
                debug_mode: ${ANALYTICS_CONFIG.DEBUG}
              });
            `}
          </Script>
        </>
      )}

      {/* Google Tag Manager */}
      {ANALYTICS_CONFIG.GTM.enabled && (
        <>
          <Script id="google-tag-manager" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${ANALYTICS_CONFIG.GTM.containerId}');
            `}
          </Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${ANALYTICS_CONFIG.GTM.containerId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        </>
      )}

      {/* Microsoft Clarity */}
      {ANALYTICS_CONFIG.CLARITY.enabled && (
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${ANALYTICS_CONFIG.CLARITY.projectId}");
          `}
        </Script>
      )}

      {/* Hotjar */}
      {ANALYTICS_CONFIG.HOTJAR.enabled && (
        <Script id="hotjar" strategy="afterInteractive">
          {`
            (function(h,o,t,j,a,r){
              h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
              h._hjSettings={hjid:${ANALYTICS_CONFIG.HOTJAR.hjid},hjsv:${ANALYTICS_CONFIG.HOTJAR.hjsv}};
              a=o.getElementsByTagName('head')[0];
              r=o.createElement('script');r.async=1;
              r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
              a.appendChild(r);
            })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
          `}
        </Script>
      )}

      {/* Vercel Analytics */}
      {ANALYTICS_CONFIG.VERCEL.enabled && (
        <Script id="vercel-analytics" strategy="afterInteractive">
          {`
            window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
          `}
        </Script>
      )}

      {/* Development Debug Panel */}
      {ANALYTICS_CONFIG.DEBUG && <AnalyticsDebugPanel />}

      {children}
    </>
  );
}

// Debug panel component for development
function AnalyticsDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(analytics.getStatus());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!ANALYTICS_CONFIG.DEBUG) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        📊 Analytics Debug
      </button>
      
      {isOpen && (
        <div className="absolute bottom-12 right-0 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
          <h3 className="font-bold text-gray-900 mb-3">Analytics Status</h3>
          
          {status && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Google Analytics 4:</span>
                <span className={status.ga4_enabled ? 'text-green-600' : 'text-red-600'}>
                  {status.ga4_enabled ? '✅ Enabled' : '❌ Disabled'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span>Microsoft Clarity:</span>
                <span className={status.clarity_enabled ? 'text-green-600' : 'text-red-600'}>
                  {status.clarity_enabled ? '✅ Enabled' : '❌ Disabled'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span>Mixpanel:</span>
                <span className={status.mixpanel_enabled ? 'text-green-600' : 'text-red-600'}>
                  {status.mixpanel_enabled ? '✅ Enabled' : '❌ Disabled'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span>PostHog:</span>
                <span className={status.posthog_enabled ? 'text-green-600' : 'text-red-600'}>
                  {status.posthog_enabled ? '✅ Enabled' : '❌ Disabled'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span>User Identified:</span>
                <span className={status.user_identified ? 'text-green-600' : 'text-yellow-600'}>
                  {status.user_identified ? '✅ Yes' : '⚠️ No'}
                </span>
              </div>
            </div>
          )}
          
          <div className="mt-4 pt-3 border-t">
            <button
              onClick={() => {
                console.log('Analytics Status:', analytics.getStatus());
                analytics.trackEvent('debug_panel_clicked', {
                  event_category: 'debug',
                  event_label: 'status_check',
                });
              }}
              className="w-full bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded text-sm transition-colors"
            >
              Test Event Tracking
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 