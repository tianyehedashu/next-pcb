import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { Carousel } from "@/app/components/custom-ui/carousel";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SpeedXPCB - Fast PCB Flow, Flexible to Grow, Reliable as Pro',
  description: 'SpeedXPCB delivers fast, high-quality PCB manufacturing, fabrication, and assembly services worldwide. Get instant quotes, 24-48h prototypes, and reliable mass production. Trusted by 10,000+ customers.',
  keywords: [
    'SpeedXPCB',
    'PCB manufacturing service',
    'PCB fabrication company', 
    'fast PCB prototype',
    'PCB assembly service',
    'custom PCB manufacturer',
    'professional PCB',
    'quick turn PCB',
    'PCB manufacturing China',
    'HDI PCB fabrication',   
    'flex rigid PCB',
    'SMT assembly service',
    'multilayer PCB',
    'printed circuit board',
    'PCB design service',
    'electronic manufacturing',
    'prototype PCB',
    'mass production PCB',
    'quality PCB manufacturer',
    'ISO certified PCB'
  ],
  openGraph: {
    title: 'SpeedXPCB - Fast PCB Flow, Flexible to Grow, Reliable as Pro',
    description: 'Fast, high-quality PCB manufacturing with instant quotes and 24-48h prototypes. Trusted by 10,000+ customers worldwide.',
    images: ['/og-home.jpg'],
    type: 'website',
    locale: 'en_US',
    siteName: 'SpeedXPCB'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SpeedXPCB - Professional PCB Manufacturing Services',
    description: 'Get instant quotes for PCB manufacturing and assembly. Fast 24-48h delivery worldwide.',
    images: ['/og-home.jpg'],
  },
  alternates: {
    canonical: 'https://speedxpcb.com',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function Home() {
  // 结构化数据
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "PCB Manufacturing Services",
    "provider": {
      "@type": "Organization",
      "name": "SpeedXPCB"
    },
    "serviceType": ["PCB Fabrication", "PCB Assembly", "SMT Assembly"],
    "description": "Professional PCB manufacturing and assembly services",
    "areaServed": "Worldwide"
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How fast is PCB prototype delivery?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We offer 24-48h prototype delivery with instant quotes for fast turnaround projects."
        }
      },
      {
        "@type": "Question", 
        "name": "What PCB services do you offer?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We provide complete PCB fabrication, SMT assembly, component sourcing, and testing services."
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {/* Carousel Section - Full screen display */}
      <div className="relative">
        <Carousel />
      </div>
      
      <div className="min-h-screen flex flex-col bg-slate-50">

        {/* Services */}
        <section id="services" className="relative px-4 sm:px-6 lg:px-8 py-16 sm:py-20 pt-20 sm:pt-24 lg:pt-28 bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-hidden">
          {/* 背景装饰 */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-10 w-32 h-32 sm:w-64 sm:h-64 bg-blue-500 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-48 h-48 sm:w-96 sm:h-96 bg-purple-500 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10 max-w-7xl mx-auto">
            <header className="text-center mb-12 sm:mb-16">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                Professional Services
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-slate-900 via-blue-800 to-slate-900 bg-clip-text text-transparent px-4">
                World-Class PCB Manufacturing
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed px-4">
                From rapid prototyping to mass production, we deliver exceptional quality with industry-leading turnaround times
              </p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <Card className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border-0 bg-white/80 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-800 group-hover:text-blue-700 transition-colors">PCB Fabrication</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <p className="text-slate-600 mb-6 leading-relaxed">Precision manufacturing for single, double, and multi-layer PCBs with rapid turnaround and strict quality control.</p>
                  <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
                    <span>Learn More</span>
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border-0 bg-white/80 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-800 group-hover:text-purple-700 transition-colors">PCB Assembly</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <p className="text-slate-600 mb-6 leading-relaxed">SMT & THT assembly, component sourcing, and functional testing for prototypes and large-scale production.</p>
                  <div className="flex items-center text-purple-600 font-medium group-hover:text-purple-700 transition-colors">
                    <span>Learn More</span>
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border-0 bg-white/80 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-800 group-hover:text-green-700 transition-colors">One-Stop Solution</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <p className="text-slate-600 mb-6 leading-relaxed">From design to delivery, we offer end-to-end PCB solutions tailored to your project needs.</p>
                  <div className="flex items-center text-green-600 font-medium group-hover:text-green-700 transition-colors">
                    <span>Learn More</span>
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="text-center mt-12 sm:mt-16">
              <Link href="/services">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 sm:px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base">
                  Explore All Services
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Knowledge Center */}
        <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 px-4">PCB Knowledge Center</h2>
              <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto px-4">
                Access our comprehensive library of technical guides, industry insights, and design resources to optimize your PCB projects.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-2xl">📚</span>
                  </div>
                  <CardTitle className="group-hover:text-purple-600 transition-colors">Technical Guides</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">Step-by-step tutorials and best practices for PCB design, manufacturing, and assembly.</p>
                  <Link href="/content/guides" className="text-purple-600 hover:text-purple-800 font-medium">
                    Explore Guides →
                  </Link>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-2xl">📰</span>
                  </div>
                  <CardTitle className="group-hover:text-orange-600 transition-colors">Industry News</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">Stay updated with the latest PCB technology trends, market insights, and innovation updates.</p>
                  <Link href="/content/news" className="text-orange-600 hover:text-orange-800 font-medium">
                    Read News →
                  </Link>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-2xl">✍️</span>
                  </div>
                  <CardTitle className="group-hover:text-green-600 transition-colors">Design Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">In-depth articles, case studies, and technical specifications for advanced PCB projects.</p>
                  <Link href="/content/articles" className="text-green-600 hover:text-green-800 font-medium">
                    Browse Articles →
                  </Link>
                </CardContent>
              </Card>
            </div>
            <div className="text-center mt-6 sm:mt-8">
              <Link href="/content">
                <Button size="lg" variant="outline" className="bg-white hover:bg-gray-50 px-6 sm:px-8 text-sm sm:text-base">
                  Visit Knowledge Center
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* How to Order */}
        <section className="relative px-4 sm:px-6 lg:px-8 py-16 sm:py-20 bg-white overflow-hidden">
          {/* 背景装饰 */}
          <div className="absolute inset-0 opacity-3">
            <div className="absolute top-0 left-1/4 w-36 h-36 sm:w-72 sm:h-72 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-40 h-40 sm:w-80 sm:h-80 bg-gradient-to-r from-green-400 to-blue-400 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10 max-w-7xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-3 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Simple Process
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-slate-900 via-purple-800 to-slate-900 bg-clip-text text-transparent px-4">
                How to Order
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed px-4">
                Experience our streamlined ordering process designed for efficiency and transparency
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {[
                {
                  step: "01",
                  title: "Quick Register",
                  description: "30-second signup for instant dashboard access",
                  icon: "👤",
                  color: "from-blue-500 to-blue-600",
                  bgColor: "from-blue-50 to-blue-100"
                },
                {
                  step: "02", 
                  title: "Upload & Quote",
                  description: "Upload files and get instant professional pricing",
                  icon: "📋",
                  color: "from-purple-500 to-purple-600", 
                  bgColor: "from-purple-50 to-purple-100"
                },
                {
                  step: "03",
                  title: "One-Click Order",
                  description: "Review quote and order with saved preferences",
                  icon: "🛒",
                  color: "from-green-500 to-green-600",
                  bgColor: "from-green-50 to-green-100"
                },
                {
                  step: "04",
                  title: "Track & Receive",
                  description: "Real-time tracking with production photos",
                  icon: "🚀",
                  color: "from-orange-500 to-orange-600",
                  bgColor: "from-orange-50 to-orange-100"
                }
              ].map((item, index) => (
                <div key={index} className="group relative">
                  {/* 连接线 */}
                  {index < 3 && (
                    <div className="hidden lg:block absolute top-16 -right-4 w-8 h-0.5 bg-gradient-to-r from-slate-300 to-slate-200 z-0"></div>
                  )}
                  
                  <div className="relative bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-slate-100 group-hover:border-slate-200">
                    {/* 背景渐变 */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.bgColor} opacity-0 group-hover:opacity-30 rounded-2xl transition-opacity duration-500`}></div>
                    
                    <div className="relative z-10 text-center">
                      {/* 步骤编号 */}
                      <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br ${item.color} text-white rounded-2xl flex items-center justify-center text-lg sm:text-xl font-bold mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                        {item.step}
                      </div>
                      
                      {/* 图标 */}
                      <div className="text-3xl sm:text-4xl mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                        {item.icon}
                      </div>
                      
                      {/* 内容 */}
                      <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2 sm:mb-3 group-hover:text-slate-900">{item.title}</h3>
                      <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-12 sm:mt-16">
              <Link href="/services#how-to-order">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 text-sm sm:text-base">
                  Start Your Order Today
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section id="why" className="relative px-4 sm:px-6 lg:px-8 py-16 sm:py-20 bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 overflow-hidden">
          {/* 背景装饰 */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/4 left-10 w-32 h-32 sm:w-64 sm:h-64 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-10 w-40 h-40 sm:w-80 sm:h-80 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10 max-w-7xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-blue-100 text-green-700 px-3 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Why Choose Us
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-slate-900 via-green-800 to-slate-900 bg-clip-text text-transparent px-4">
                Trusted by Industry Leaders
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed px-4">
                Join thousands of satisfied customers who trust SpeedXPCB for their critical projects
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 text-center shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-slate-200/50">
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Image 
                      src="/icons/fast.svg" 
                      alt="Fast PCB Turnaround - Quick prototype delivery" 
                      width={40} 
                      height={40} 
                      loading="lazy"
                      className="brightness-0 invert"
                    />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-4 group-hover:text-blue-700 transition-colors">Fast Turnaround</h3>
                <p className="text-slate-600 leading-relaxed">Quick prototyping and on-time delivery worldwide with industry-leading speed.</p>
              </div>

              <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-slate-200/50">
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Image 
                      src="/icons/quality.svg" 
                      alt="Quality Assurance - Strict quality control process" 
                      width={40} 
                      height={40} 
                      loading="lazy"
                      className="brightness-0 invert"
                    />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-4 group-hover:text-purple-700 transition-colors">Quality Assurance</h3>
                <p className="text-slate-600 leading-relaxed">Strict QC process ensures every board meets the highest standards and certifications.</p>
              </div>

              <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-slate-200/50">
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Image 
                      src="/icons/support.svg" 
                      alt="24/7 Customer Support - Expert technical support" 
                      width={40} 
                      height={40} 
                      loading="lazy"
                      className="brightness-0 invert"
                    />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-4 group-hover:text-green-700 transition-colors">24/7 Support</h3>
                <p className="text-slate-600 leading-relaxed">Expert support team ready to help you anytime, anywhere with technical expertise.</p>
              </div>

              <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-slate-200/50">
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Image 
                      src="/icons/global.svg" 
                      alt="Global Shipping - Worldwide delivery service" 
                      width={40} 
                      height={40} 
                      loading="lazy"
                      className="brightness-0 invert"
                    />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-4 group-hover:text-orange-700 transition-colors">Global Shipping</h3>
                <p className="text-slate-600 leading-relaxed">Reliable logistics to over 150 countries and regions with tracked delivery.</p>
              </div>
            </div>
            
            <div className="text-center mt-16">
              <Link href="/about">
                <Button size="lg" className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  Discover Our Story
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="relative px-8 py-20 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 overflow-hidden">
          {/* 背景装饰 */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-20 left-1/3 w-96 h-96 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-1/3 w-80 h-80 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10 max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 px-5 py-2 rounded-full text-sm font-medium mb-6">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Customer Stories
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-pink-800 to-slate-900 bg-clip-text text-transparent">
                What Our Clients Say
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                Real feedback from customers who trust us with their most important projects
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="group relative bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="relative z-10 flex flex-row items-center gap-4 pb-4">
                  <div className="relative">
                    <Avatar className="w-14 h-14 ring-2 ring-blue-100 group-hover:ring-blue-200 transition-all">
                      <AvatarImage src="/avatars/avatar1.jpg" />
                      <AvatarFallback className="bg-blue-500 text-white font-semibold">TC</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg font-bold text-slate-800 group-hover:text-blue-700 transition-colors">Teng Chong</CardTitle>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      USA, Hardware Engineer
                    </div>
                  </div>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 pt-0">
                  <div className="text-2xl text-blue-500/20 mb-2">"</div>
                  <p className="text-slate-600 leading-relaxed italic mb-4">SpeedXPCB delivered our boards faster than expected and the quality was top-notch. Highly recommended for critical projects!</p>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Verified Purchase - 2 weeks ago
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="relative z-10 flex flex-row items-center gap-4 pb-4">
                  <div className="relative">
                    <Avatar className="w-14 h-14 ring-2 ring-purple-100 group-hover:ring-purple-200 transition-all">
                      <AvatarImage src="/avatars/avatar2.jpg" />
                      <AvatarFallback className="bg-purple-500 text-white font-semibold">MH</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg font-bold text-slate-800 group-hover:text-purple-700 transition-colors">Mariann</CardTitle>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Germany, Product Designer
                    </div>
                  </div>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 pt-0">
                  <div className="text-2xl text-purple-500/20 mb-2">"</div>
                  <p className="text-slate-600 leading-relaxed italic mb-4">Excellent service and support. The one-stop solution made our complex project much easier to manage.</p>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Verified Purchase - 1 month ago
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="relative z-10 flex flex-row items-center gap-4 pb-4">
                  <div className="relative">
                    <Avatar className="w-14 h-14 ring-2 ring-green-100 group-hover:ring-green-200 transition-all">
                      <AvatarImage src="/avatars/avatar3.jpg" />
                      <AvatarFallback className="bg-green-500 text-white font-semibold">KL</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg font-bold text-slate-800 group-hover:text-green-700 transition-colors">Kenny Lee</CardTitle>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Singapore, Startup CTO
                    </div>
                  </div>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 pt-0">
                  <div className="text-2xl text-green-500/20 mb-2">"</div>
                  <p className="text-slate-600 leading-relaxed italic mb-4">Professional team and reliable quality. Perfect partner for startups like ours. Will definitely cooperate again!</p>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Verified Purchase - 3 weeks ago
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="text-center mt-16">
              <Link href="/testimonials">
                <Button size="lg" className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  Read More Stories
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
