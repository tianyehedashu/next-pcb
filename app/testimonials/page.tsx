import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { 
  Star,
  Quote,
  ArrowRight,
  CheckCircle,
  Users,
  Globe,
  Award,
  TrendingUp
} from "lucide-react";

export const metadata = {
  title: "Customer Testimonials | SpeedXPCB Success Stories",
  description: "Read success stories and testimonials from our satisfied customers worldwide. Discover why thousands trust SpeedXPCB for their PCB manufacturing needs.",
  keywords: "PCB testimonials, customer reviews, success stories, SpeedXPCB reviews, PCB manufacturing feedback",
};

export default function TestimonialsPage() {
  const featuredTestimonials = [
    {
      name: "Teng Chong",
      title: "Hardware Engineer",
      company: "TechStart Inc.",
      location: "USA",
      avatar: "/avatars/avatar1.jpg",
      rating: 5,
      quote: "SpeedXPCB delivered our prototype PCBs faster than expected and the quality was absolutely top-notch. Their engineering team provided excellent support throughout the entire process. We've been working with them for over 2 years now.",
      projectType: "IoT Device Prototype",
      orderValue: "$15,000+",
      featured: true
    },
    {
      name: "Mariann Weber",
      title: "Product Designer",
      company: "InnovateTech GmbH",
      location: "Germany",
      avatar: "/avatars/avatar2.jpg",
      rating: 5,
      quote: "The one-stop solution approach made our complex project much easier to manage. From PCB fabrication to component sourcing and assembly, everything was handled professionally. Excellent communication and quality control.",
      projectType: "Industrial Controller",
      orderValue: "$50,000+",
      featured: true
    },
    {
      name: "Kenny Lee",
      title: "CTO & Co-founder",
      company: "NextGen Robotics",
      location: "Singapore",
      avatar: "/avatars/avatar3.jpg",
      rating: 5,
      quote: "Professional team, reliable quality, and competitive pricing. SpeedXPCB has been instrumental in helping us scale from prototype to mass production. Their technical expertise saved us months of development time.",
      projectType: "Robotics Platform",
      orderValue: "$100,000+",
      featured: true
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      title: "R&D Manager",
      company: "MedTech Solutions",
      location: "Canada",
      avatar: null,
      rating: 5,
      quote: "Outstanding quality and attention to detail. Their medical-grade PCBs meet all our stringent requirements.",
      projectType: "Medical Device",
      orderValue: "$25,000+"
    },
    {
      name: "Carlos Rodriguez",
      title: "Electronics Engineer",
      company: "AutoDrive Systems",
      location: "Spain",
      avatar: null,
      rating: 5,
      quote: "Fast turnaround and excellent technical support. They helped optimize our design for better performance.",
      projectType: "Automotive ECU",
      orderValue: "$75,000+"
    },
    {
      name: "Yuki Tanaka",
      title: "Product Manager",
      company: "Smart Home Co.",
      location: "Japan",
      avatar: null,
      rating: 5,
      quote: "Consistent quality across large production runs. Their supply chain management is impressive.",
      projectType: "Smart Home Hub",
      orderValue: "$200,000+"
    },
    {
      name: "Emma Thompson",
      title: "Founder",
      company: "GreenTech Innovations",
      location: "UK",
      avatar: null,
      rating: 5,
      quote: "Eco-friendly processes and sustainable practices align perfectly with our company values.",
      projectType: "Solar Controller",
      orderValue: "$30,000+"
    },
    {
      name: "Michael Chen",
      title: "Lead Engineer",
      company: "Aerospace Dynamics",
      location: "Australia",
      avatar: null,
      rating: 5,
      quote: "Rigorous testing and quality control processes give us confidence in mission-critical applications.",
      projectType: "Avionics System",
      orderValue: "$150,000+"
    },
    {
      name: "Lisa Anderson",
      title: "Project Manager",
      company: "Telecom Solutions",
      location: "USA",
      avatar: null,
      rating: 5,
      quote: "24/7 support and global shipping capabilities make them our go-to PCB partner worldwide.",
      projectType: "5G Base Station",
      orderValue: "$300,000+"
    }
  ];

  const stats = [
    { number: "10,000+", label: "Happy Customers", icon: Users },
    { number: "99.8%", label: "Satisfaction Rate", icon: Award },
    { number: "4.9/5", label: "Average Rating", icon: Star },
    { number: "150+", label: "Countries Served", icon: Globe }
  ];

  const industries = [
    { name: "Consumer Electronics", count: "3,500+", icon: "📱" },
    { name: "Automotive", count: "2,100+", icon: "🚗" },
    { name: "Industrial", count: "1,800+", icon: "🏭" },
    { name: "Medical", count: "1,200+", icon: "🏥" },
    { name: "Telecommunications", count: "900+", icon: "📡" },
    { name: "Aerospace", count: "400+", icon: "✈️" }
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-800 hover:bg-blue-200">
            Customer Success Stories
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Trusted by
            <span className="block text-blue-600">Thousands Worldwide</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Discover why companies across the globe choose SpeedXPCB for their PCB manufacturing needs. 
            Real stories from real customers who've achieved success with our solutions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/quote2">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Start Your Success Story
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline">
                Speak with Expert
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Success Stories
            </h2>
            <p className="text-lg text-gray-600">
              In-depth testimonials from our valued customers
            </p>
          </div>

          <div className="space-y-8">
            {featuredTestimonials.map((testimonial, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-xl transition-all duration-300">
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                    {/* Customer Info */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 lg:p-12">
                      <div className="flex items-center gap-4 mb-6">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={testimonial.avatar} />
                          <AvatarFallback className="bg-blue-600 text-white text-lg font-semibold">
                            {testimonial.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{testimonial.name}</h3>
                          <p className="text-gray-600">{testimonial.title}</p>
                          <p className="text-sm text-gray-500">{testimonial.company}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">{renderStars(testimonial.rating)}</div>
                          <span className="text-sm text-gray-600">({testimonial.rating}/5)</span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-gray-600">Project: {testimonial.projectType}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-gray-600">Value: {testimonial.orderValue}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-gray-600">Location: {testimonial.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Testimonial Content */}
                    <div className="lg:col-span-2 p-8 lg:p-12 flex flex-col justify-center">
                      <Quote className="w-8 h-8 text-blue-600 mb-6" />
                      <blockquote className="text-xl text-gray-700 leading-relaxed mb-6 italic">
                        "{testimonial.quote}"
                      </blockquote>
                      <div className="flex items-center justify-between">
                        <Badge className="bg-blue-100 text-blue-800">
                          ⭐ Featured Review
                        </Badge>
                        <span className="text-sm text-gray-500">Verified Customer</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* More Testimonials Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              More Customer Reviews
            </h2>
            <p className="text-lg text-gray-600">
              What our customers say about working with SpeedXPCB
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="h-full hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={testimonial.avatar || undefined} />
                      <AvatarFallback className="bg-gray-600 text-white font-semibold">
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{testimonial.name}</h3>
                      <p className="text-sm text-gray-600">{testimonial.title}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 mb-2">{renderStars(testimonial.rating)}</div>
                </CardHeader>
                <CardContent>
                  <blockquote className="text-gray-700 mb-4 italic">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Project:</span>
                      <span className="font-medium">{testimonial.projectType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Order Value:</span>
                      <span className="font-medium">{testimonial.orderValue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Location:</span>
                      <span className="font-medium">{testimonial.location}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Industries We Serve */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted Across Industries
            </h2>
            <p className="text-lg text-gray-600">
              Serving diverse sectors with specialized PCB solutions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {industries.map((industry, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow duration-300">
                <div className="text-4xl mb-4">{industry.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{industry.name}</h3>
                <p className="text-blue-600 font-semibold">{industry.count} Projects</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Join Our Success Stories?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Experience the quality, speed, and service that thousands of customers trust for their PCB needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/quote2">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                Get Your Quote
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/services">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                View Services
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 