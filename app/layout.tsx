import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { Toaster } from "sonner";
import Providers from '@/app/components/Providers';
import { ChatwootProvider } from '@/app/components/ChatwootProvider';
import { AnalyticsProvider } from '@/app/components/AnalyticsProvider';
import { Metadata } from 'next';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
  fallback: ['system-ui', 'arial'],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  fallback: ['ui-monospace', 'monospace'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://speedxpcb.com'),
  title: {
    template: '%s | SpeedXPCB',
    default: 'SpeedXPCB - Professional PCB Manufacturing & Assembly Services',
  },
  description: 'SpeedXPCB offers fast, high-quality PCB manufacturing, fabrication, and assembly services worldwide. Get instant quotes, 24-48h prototypes, and reliable mass production.',
  keywords: [
    'PCB manufacturing',
    'PCB fabrication',
    'PCB assembly',
    'SMT assembly', 
    'PCB prototype',
    'fast PCB',
    'custom PCB',
    'professional PCB manufacturer',
    'HDI PCB',
    'flex PCB',
    'rigid PCB'
  ],
  authors: [{ name: 'SpeedXPCB Team' }],
  creator: 'SpeedXPCB',
  publisher: 'SpeedXPCB',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: [
    { url: '/icon', sizes: '32x32', type: 'image/png' },
    { url: '/apple-icon', sizes: '180x180', type: 'image/png' },
    { url: '/logos/speedxpcb-favicon-16x16.svg', sizes: '16x16', type: 'image/svg+xml' },
    { url: '/logos/speedxpcb-favicon-32x32.svg', sizes: '32x32', type: 'image/svg+xml' },
  ],
  openGraph: {
    title: 'SpeedXPCB - Professional PCB Manufacturing & Assembly Services',
    description: 'Fast, high-quality PCB manufacturing with instant quotes and 24-48h prototypes. Trusted by 10,000+ customers worldwide.',
    url: 'https://speedxpcb.com',
    siteName: 'SpeedXPCB',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'SpeedXPCB - Professional PCB Manufacturing Services',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SpeedXPCB - Professional PCB Manufacturing & Assembly Services',
    description: 'Fast, high-quality PCB manufacturing with instant quotes and 24-48h prototypes.',
    images: ['/og-image.jpg'],
    creator: '@speedxpcb',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://speedxpcb.com',
  },
  verification: {
    google: 'google-site-verification-code', // 需要添加实际的验证码
    yandex: 'yandex-verification-code',
    yahoo: 'yahoo-verification-code',
  },
  category: 'Electronics Manufacturing',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SpeedXPCB',
    description: 'Professional PCB manufacturing and assembly services with fast turnaround times and high quality standards.',
    url: 'https://speedxpcb.com',
    logo: 'https://speedxpcb.com/logos/speedxpcb-logo.svg',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: ['English', 'Chinese'],
    },
    sameAs: [
      'https://www.linkedin.com/company/speedxpcb',
      'https://twitter.com/speedxpcb',
      'https://www.facebook.com/speedxpcb'
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CN',
      addressLocality: 'Shenzhen',
    },
    foundingDate: '2010',
    numberOfEmployees: '500-1000',
    industry: 'Electronics Manufacturing',
    services: [
      'PCB Manufacturing',
      'PCB Assembly', 
      'SMT Assembly',
      'PCB Prototyping',
      'Mass Production'
    ]
  }

  return (
    <html lang="en">
      <head>
        {/* 预加载关键资源 */}
        <link rel="preload" href="/home/SpeedxPCB-bg1.png" as="image" type="image/png" />
        <link rel="preload" href="/logos/speedxpcb-logo.svg" as="image" type="image/svg+xml" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="canonical" href="https://speedxpcb.com" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon" />
        <meta name="theme-color" content="#1E40AF" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AnalyticsProvider>
          <ChatwootProvider>
            <Providers>
              <Navbar />
              <main className="pt-20">
                {children}
              </main>
              <Footer />
            </Providers>
          </ChatwootProvider>
          <Toaster />
        </AnalyticsProvider>
      </body>
    </html>
  );
}

