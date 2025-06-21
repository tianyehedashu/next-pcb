import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  Zap, 
  Shield, 
  Users, 
  Globe,
  Award,
  Clock,
  CheckCircle,
  ArrowRight,
  Factory,
  Headphones,
  TrendingUp
} from "lucide-react";

export const metadata = {
  title: "About SpeedXPCB | Leading PCB Manufacturing Company",
  description: "Learn about SpeedXPCB's mission, values, and commitment to delivering high-quality PCB manufacturing services worldwide since 2010.",
  keywords: "SpeedXPCB, PCB manufacturer, about us, company history, PCB fabrication, electronics manufacturing",
};

export default function AboutPage() {
  const advantages = [
    {
      icon: Zap,
      title: "Fast Turnaround",
      description: "Industry-leading delivery times with 24-48 hour prototypes and express production options.",
      highlight: "24-48h",
      color: "text-yellow-600",
      bgColor: "from-yellow-50 to-orange-50"
    },
    {
      icon: Shield,
      title: "Quality Assurance",
      description: "Rigorous testing and inspection processes ensure every board meets the highest standards.",
      highlight: "100% Tested",
      color: "text-green-600",
      bgColor: "from-green-50 to-emerald-50"
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      description: "Expert engineering support available around the clock to assist with your projects.",
      highlight: "24/7 Available",
      color: "text-blue-600",
      bgColor: "from-blue-50 to-indigo-50"
    },
    {
      icon: Globe,
      title: "Global Shipping",
      description: "Reliable logistics network delivering to over 150 countries with tracking and insurance.",
      highlight: "150+ Countries",
      color: "text-purple-600",
      bgColor: "from-purple-50 to-violet-50"
    }
  ];

  const milestones = [
    { year: "2010", title: "Company Founded", desc: "Started as a small PCB fabrication facility in Shenzhen" },
    { year: "2013", title: "ISO Certification", desc: "Achieved ISO 9001:2015 quality management certification" },
    { year: "2016", title: "Global Expansion", desc: "Opened international offices and expanded to 50+ countries" },
    { year: "2019", title: "Advanced Technology", desc: "Invested in HDI and flex-rigid PCB manufacturing capabilities" },
    { year: "2022", title: "Industry 4.0", desc: "Implemented smart manufacturing and AI-driven quality control" },
    { year: "2024", title: "Market Leader", desc: "Serving 10,000+ customers worldwide with 99.8% satisfaction rate" }
  ];

  const stats = [
    { number: "10,000+", label: "Happy Customers", icon: Users },
    { number: "1M+", label: "PCBs Delivered", icon: Factory },
    { number: "99.8%", label: "Quality Rate", icon: Award },
    { number: "150+", label: "Countries Served", icon: Globe }
  ];

  const values = [
    {
      title: "Innovation",
      description: "Continuously investing in cutting-edge technology and manufacturing processes to stay ahead of industry trends.",
      icon: "🚀"
    },
    {
      title: "Quality",
      description: "Uncompromising commitment to quality through rigorous testing, advanced equipment, and skilled craftsmanship.",
      icon: "🎯"
    },
    {
      title: "Customer Focus",
      description: "Building long-term partnerships by understanding customer needs and exceeding expectations consistently.",
      icon: "🤝"
    },
    {
      title: "Sustainability",
      description: "Environmental responsibility through green manufacturing practices and sustainable supply chain management.",
      icon: "🌱"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-6 bg-blue-100 text-blue-800 hover:bg-blue-200">
                Trusted Since 2010
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Leading the Future of
                <span className="block text-blue-600">PCB Manufacturing</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                For over a decade, SpeedXPCB has been at the forefront of PCB innovation, 
                delivering exceptional quality and service to customers worldwide.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/services">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    Our Services
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8 shadow-xl">
                <Image
                  src="/pcb-hero.svg"
                  alt="PCB Manufacturing"
                  width={500}
                  height={400}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company Stats */}
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

      {/* Why Choose Us */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose SpeedXPCB?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our commitment to excellence, innovation, and customer satisfaction sets us apart in the industry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {advantages.map((advantage, index) => (
              <Card key={index} className={`bg-gradient-to-br ${advantage.bgColor} border-0 hover:shadow-xl transition-all duration-300`}>
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${advantage.color} bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0`}>
                      <advantage.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900">{advantage.title}</h3>
                        <Badge className={`${advantage.color} bg-white border-0 font-semibold`}>
                          {advantage.highlight}
                        </Badge>
                      </div>
                      <p className="text-gray-600 leading-relaxed">{advantage.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Company Values */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Core Values
            </h2>
            <p className="text-lg text-gray-600">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center p-8 hover:shadow-lg transition-shadow duration-300">
                <div className="text-4xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{value.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Company Timeline */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Journey
            </h2>
            <p className="text-lg text-gray-600">
              Key milestones in our growth and innovation
            </p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 md:left-1/2 transform md:-translate-x-px top-0 bottom-0 w-0.5 bg-blue-200"></div>
            
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div key={index} className={`relative flex items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  {/* Timeline dot */}
                  <div className="absolute left-4 md:left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-md z-10"></div>
                  
                  {/* Content */}
                  <div className={`ml-12 md:ml-0 md:w-1/2 ${index % 2 === 0 ? 'md:pr-12' : 'md:pl-12'}`}>
                    <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge className="bg-blue-100 text-blue-800 text-lg font-bold px-3 py-1">
                          {milestone.year}
                        </Badge>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{milestone.title}</h3>
                      <p className="text-gray-600">{milestone.desc}</p>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How We Work */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How We Work
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our streamlined process ensures quality, efficiency, and transparency from initial quote to final delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Customer Registration Focus",
                description: "We encourage quick registration for the best user experience - instant dashboard access and saved preferences.",
                icon: "👥"
              },
              {
                step: "02", 
                title: "Professional Engineering Review",
                description: "Expert team provides official pricing and design optimization suggestions directly in customer dashboards.",
                icon: "🔍"
              },
              {
                step: "03",
                title: "Streamlined Order Process",
                description: "Registered customers enjoy one-click ordering with saved addresses and payment preferences.",
                icon: "⚡"
              },
              {
                step: "04",
                title: "Production & Real-Time Updates",
                description: "Manufacturing starts after payment with live tracking and production photos in customer dashboards.",
                icon: "🚀"
              }
            ].map((item, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-all duration-300 group">
                <div className="text-4xl mb-4">{item.icon}</div>
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4 group-hover:bg-blue-700 transition-colors">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/services#how-to-order">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                View Detailed Process
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            Our Mission
          </h2>
          <blockquote className="text-2xl text-gray-600 italic leading-relaxed mb-8">
            "To empower innovation worldwide by delivering exceptional PCB manufacturing 
            solutions that exceed expectations in quality, speed, and service."
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-0.5 bg-blue-600"></div>
            <span className="text-sm text-gray-500 font-medium">SpeedXPCB Leadership Team</span>
            <div className="w-12 h-0.5 bg-blue-600"></div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Partner with Us?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of satisfied customers who trust SpeedXPCB for their PCB manufacturing needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/quote2">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                Get Started Today
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/content">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
