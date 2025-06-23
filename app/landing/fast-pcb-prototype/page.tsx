import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  Clock, 
  Shield, 
  CheckCircle, 
  Star,
  ArrowRight,
  Zap,
  Award,
  Users,
  Phone
} from "lucide-react";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fast PCB Prototype - 24-48 Hour Turnaround | SpeedXPCB',
  description: 'Get fast PCB prototypes in 24-48 hours with SpeedXPCB. Professional PCB manufacturing, instant quotes, and worldwide shipping. Trusted by 10,000+ engineers.',
  keywords: [
    'fast PCB prototype',
    '24 hour PCB prototype', 
    'quick turn PCB',
    'rapid PCB manufacturing',
    'fast PCB fabrication',
    'PCB prototype service',
    'urgent PCB prototype',
    'same day PCB'
  ],
  openGraph: {
    title: 'Fast PCB Prototype - 24-48 Hour Turnaround | SpeedXPCB',
    description: 'Get fast PCB prototypes in 24-48 hours. Professional quality, instant quotes, worldwide shipping.',
    images: ['/landing/fast-pcb-prototype-og.jpg'],
  },
  alternates: {
    canonical: 'https://speedxpcb.com/landing/fast-pcb-prototype',
  },
}

export default function FastPCBPrototypePage() {
  const features = [
    {
      icon: Clock,
      title: "24-48 Hour Delivery",
      description: "Lightning-fast prototyping with industry-leading turnaround times",
      highlight: "Express Service"
    },
    {
      icon: Shield,
      title: "100% Quality Guaranteed", 
      description: "Rigorous testing and inspection for every single board",
      highlight: "Zero Defects"
    },
    {
      icon: Zap,
      title: "Instant Online Quote",
      description: "Get pricing in seconds with our advanced quoting system",
      highlight: "No Waiting"
    },
    {
      icon: Award,
      title: "Professional Grade",
      description: "IPC standards compliance with advanced manufacturing",
      highlight: "Certified"
    }
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      company: "TechStart Inc",
      role: "Hardware Engineer", 
      content: "SpeedXPCB delivered our prototype in 36 hours when we had a critical deadline. Amazing quality and service!",
      rating: 5,
      avatar: "/testimonials/sarah.jpg"
    },
    {
      name: "Michael Rodriguez",
      company: "Innovation Labs",
      role: "CTO",
      content: "We've used SpeedXPCB for over 50 prototypes. Consistent quality and the fastest delivery in the industry.",
      rating: 5,
      avatar: "/testimonials/michael.jpg"
    }
  ]

  const stats = [
    { number: "24h", label: "Fastest Delivery" },
    { number: "10K+", label: "Happy Customers" },
    { number: "99.8%", label: "Quality Rate" },
    { number: "150+", label: "Countries Served" }
  ]

  const processSteps = [
    {
      step: "01",
      title: "Upload Files",
      description: "Upload your Gerber files and get instant quote",
      icon: "📁"
    },
    {
      step: "02", 
      title: "Confirm Order",
      description: "Review specifications and confirm your order",
      icon: "✅"
    },
    {
      step: "03",
      title: "Fast Production", 
      description: "We manufacture your PCB with express priority",
      icon: "⚡"
    },
    {
      step: "04",
      title: "Quick Shipping",
      description: "Express shipping to your location worldwide",
      icon: "🚀"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        
        {/* Trust Badges */}
        <div className="relative max-w-7xl mx-auto mb-8">
          <div className="flex justify-center items-center gap-8 flex-wrap">
            <Badge className="bg-green-100 text-green-800 px-4 py-2">
              <Shield className="w-4 h-4 mr-2" />
              ISO 9001 Certified
            </Badge>
            <Badge className="bg-blue-100 text-blue-800 px-4 py-2">
              <Users className="w-4 h-4 mr-2" />
              10,000+ Customers
            </Badge>
            <Badge className="bg-purple-100 text-purple-800 px-4 py-2">
              <Star className="w-4 h-4 mr-2" />
              4.9/5 Rating
            </Badge>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                Fast PCB Prototype
                <span className="block text-blue-600">24-48 Hours</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Need PCB prototypes urgently? Get professional-grade PCB manufacturing 
                with the fastest turnaround in the industry. Quality guaranteed.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/quote2">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4">
                    Get Instant Quote
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="text-lg px-8 py-4">
                  <Phone className="mr-2 w-5 h-5" />
                  Call Engineer Now
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stat.number}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8 shadow-xl">
                <Image
                  src="/landing/fast-pcb-hero.jpg"
                  alt="Fast PCB Prototype Manufacturing"
                  width={600}
                  height={400}
                  className="w-full h-auto rounded-lg"
                />
              </div>
              
              {/* Floating Badge */}
              <div className="absolute -top-4 -right-4 bg-red-500 text-white px-4 py-2 rounded-full font-bold animate-pulse">
                24H Express
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose SpeedXPCB for Fast Prototypes?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Industry-leading speed without compromising on quality
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-blue-100 hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <Badge className="mb-3 bg-blue-600 text-white">
                    {feature.highlight}
                  </Badge>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple 4-Step Process
            </h2>
            <p className="text-lg text-gray-600">
              From upload to delivery in record time
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {processSteps.map((step, index) => (
              <div key={index} className="text-center relative">
                {/* Connector Line */}
                {index < processSteps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-blue-200 z-0"></div>
                )}
                
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 relative">
                    {step.step}
                  </div>
                  <div className="text-4xl mb-4">{step.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/quote2">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4">
                Start Your Fast Prototype Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-lg text-gray-600">
              Real feedback from engineers who trust SpeedXPCB
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 text-lg italic">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      width={48}
                      height={48}
                      className="rounded-full mr-4"
                    />
                    <div>
                      <div className="font-bold text-gray-900">{testimonial.name}</div>
                      <div className="text-gray-600">{testimonial.role}, {testimonial.company}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready for Your Fast PCB Prototype?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join 10,000+ engineers who trust SpeedXPCB for urgent projects. 
            Get your quote now and see why we're the fastest in the industry.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/quote2">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4">
                Get Instant Quote Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-4">
              <Phone className="mr-2 w-5 h-5" />
              Talk to Engineer
            </Button>
          </div>

          <div className="mt-8 text-sm opacity-80">
            ✓ No setup fees ✓ Instant quotes ✓ 24/7 support ✓ Worldwide shipping
          </div>
        </div>
      </section>

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "Fast PCB Prototype Service",
            "description": "Professional fast PCB prototype manufacturing with 24-48 hour turnaround",
            "provider": {
              "@type": "Organization",
              "name": "SpeedXPCB",
              "url": "https://speedxpcb.com"
            },
            "serviceType": "PCB Manufacturing",
            "areaServed": "Worldwide",
            "offers": {
              "@type": "Offer",
              "description": "Fast PCB prototype manufacturing",
              "availability": "https://schema.org/InStock"
            },
            "aggregateRating": {
              "@type": "AggregateRating", 
              "ratingValue": "4.9",
              "ratingCount": "2500",
              "bestRating": "5"
            }
          })
        }}
      />
    </div>
  )
} 