import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { Carousel } from "@/app/components/custom-ui/carousel";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Professional PCB Manufacturing & Assembly Services',
  description: 'SpeedXPCB delivers fast, high-quality PCB manufacturing, fabrication, and assembly services worldwide. Get instant quotes, 24-48h prototypes, and reliable mass production. Trusted by 10,000+ customers.',
  keywords: [
    'PCB manufacturing service',
    'PCB fabrication company', 
    'fast PCB prototype',
    'PCB assembly service',
    'custom PCB manufacturer',
    'professional PCB',
    'quick turn PCB',
    'PCB manufacturing China',
    'HDI PCB fabrication',
    'flex rigid PCB'
  ],
  openGraph: {
    title: 'SpeedXPCB - Professional PCB Manufacturing & Assembly Services',
    description: 'Fast, high-quality PCB manufacturing with instant quotes and 24-48h prototypes. Trusted by 10,000+ customers worldwide.',
    images: ['/og-home.jpg'],
  },
  alternates: {
    canonical: 'https://speedxpcb.com',
  },
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Carousel Section */}
      <Carousel />

      {/* Hero Banner */}
      <section className="flex flex-col md:flex-row items-center justify-between px-8 py-16 bg-gradient-to-r from-blue-100 to-white">
        <div className="flex-1 flex flex-col gap-6">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">Your Trusted Partner for PCB Manufacturing</h1>
          <p className="text-lg text-slate-700 mb-4 max-w-xl">High-quality, fast-turn PCB fabrication and assembly for global innovators. From prototype to mass production, we deliver excellence every step of the way.</p>
          <div className="flex gap-4">
            <Button size="lg" asChild>
              <Link href="/quote2" prefetch>
                Get a Quote
              </Link>
            </Button>
            <Button variant="outline" size="lg">Learn More</Button>
          </div>
        </div>
        <div className="flex-1 flex justify-center mt-8 md:mt-0">
          <Image src="/pcb-hero.svg" alt="PCB Hero" width={400} height={300} className="rounded-xl shadow-lg" />
        </div>
      </section>

      {/* Services */}
      <section id="services" className="px-8 py-16 bg-white">
        <h2 className="text-3xl font-bold text-center mb-10">Our Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>PCB Fabrication</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">Precision manufacturing for single, double, and multi-layer PCBs with rapid turnaround and strict quality control.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>PCB Assembly</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">SMT & THT assembly, component sourcing, and functional testing for prototypes and large-scale production.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>One-Stop Solution</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">From design to delivery, we offer end-to-end PCB solutions tailored to your project needs.</p>
            </CardContent>
          </Card>
        </div>
        <div className="text-center mt-10">
          <Link href="/services">
            <Button size="lg" variant="outline">
              View All Services
            </Button>
          </Link>
        </div>
      </section>

      {/* Knowledge Center */}
      <section className="px-8 py-16 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">PCB Knowledge Center</h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Access our comprehensive library of technical guides, industry insights, and design resources to optimize your PCB projects.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
          <div className="text-center mt-8">
            <Link href="/content">
              <Button size="lg" variant="outline" className="bg-white hover:bg-gray-50">
                Visit Knowledge Center
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How to Order */}
      <section className="px-8 py-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How to Order</h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Simple and transparent ordering process. From quote to delivery in just 4 easy steps.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Quick Register",
                description: "30-second signup for instant dashboard access",
                icon: "👤"
              },
              {
                step: "02", 
                title: "Upload & Quote",
                description: "Upload files and get instant professional pricing",
                icon: "📋"
              },
              {
                step: "03",
                title: "One-Click Order",
                description: "Review quote and order with saved preferences",
                icon: "🛒"
              },
              {
                step: "04",
                title: "Track & Receive",
                description: "Real-time tracking with production photos",
                icon: "🚀"
              }
            ].map((item, index) => (
              <div key={index} className="text-center group">
                <div className="relative">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 group-hover:bg-blue-700 transition-colors">
                    {item.step}
                  </div>
                  <div className="text-4xl mb-4">{item.icon}</div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/services#how-to-order">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                View Detailed Process
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="why" className="px-8 py-16 bg-slate-100">
        <h2 className="text-3xl font-bold text-center mb-10">Why Choose SpeedXPCB?</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
          <div className="flex flex-col items-center text-center">
            <Image src="/fast.svg" alt="Fast" width={48} height={48} />
            <h3 className="font-semibold mt-4 mb-2">Fast Turnaround</h3>
            <p className="text-slate-600">Quick prototyping and on-time delivery worldwide.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <Image src="/quality.svg" alt="Quality" width={48} height={48} />
            <h3 className="font-semibold mt-4 mb-2">Quality Assurance</h3>
            <p className="text-slate-600">Strict QC process ensures every board meets the highest standards.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <Image src="/support.svg" alt="Support" width={48} height={48} />
            <h3 className="font-semibold mt-4 mb-2">24/7 Support</h3>
            <p className="text-slate-600">Expert support team ready to help you anytime, anywhere.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <Image src="/global.svg" alt="Global" width={48} height={48} />
            <h3 className="font-semibold mt-4 mb-2">Global Shipping</h3>
            <p className="text-slate-600">Reliable logistics to over 150 countries and regions.</p>
          </div>
        </div>
        <div className="text-center mt-10">
          <Link href="/about">
            <Button size="lg" variant="outline">
              Learn More About Us
            </Button>
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="px-8 py-16 bg-white">
        <h2 className="text-3xl font-bold text-center mb-10">What Our Clients Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar>
                <AvatarImage src="/avatar1.jpg" />
                <AvatarFallback>JS</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>Teng Chong</CardTitle>
                <span className="text-xs text-slate-500">USA, Hardware Engineer</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">"SpeedXPCB delivered our boards faster than expected and the quality was top-notch. Highly recommended!"</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar>
                <AvatarImage src="/avatar2.jpg" />
                <AvatarFallback>EM</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>Mariann</CardTitle>
                <span className="text-xs text-slate-500">Germany, Product Designer</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">"Excellent service and support. The one-stop solution made our project much easier."</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar>
                <AvatarImage src="/avatar3.jpg" />
                <AvatarFallback>LK</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>Kenny Lee</CardTitle>
                <span className="text-xs text-slate-500">Singapore, Startup CTO</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">"Professional team and reliable quality. Will definitely cooperate again!"</p>
            </CardContent>
          </Card>
        </div>
        <div className="text-center mt-10">
          <Link href="/testimonials">
            <Button size="lg" variant="outline">
              Read More Reviews
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
