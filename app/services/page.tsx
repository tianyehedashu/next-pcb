import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  Zap, 
  Shield, 
  Cog, 
  CheckCircle, 
  Clock, 
  Award,
  ArrowRight,
  Layers,
  Cpu,
  Settings
} from "lucide-react";

export const metadata = {
  title: "PCB Manufacturing Services | SpeedXPCB",
  description: "Professional PCB fabrication, assembly, and one-stop solutions. From prototype to mass production with fast turnaround and quality guarantee.",
  keywords: "PCB manufacturing, PCB fabrication, PCB assembly, SMT, THT, prototype PCB, mass production",
};

export default function ServicesPage() {
  const services = [
    {
      title: "PCB Fabrication",
      icon: Layers,
      description: "High-quality PCB manufacturing from single layer to complex HDI boards",
      features: [
        "1-32 layer PCBs",
        "HDI & Flex-Rigid",
        "Fast turnaround (24-48h)",
        "IPC Class 2/3 standards",
        "Advanced materials support",
        "Blind/buried vias"
      ],
      capabilities: {
        "Min. Trace/Space": "0.075mm/0.075mm",
        "Min. Via Size": "0.1mm",
        "Board Thickness": "0.2-6.0mm",
        "Copper Weight": "0.5-6oz",
        "Surface Finish": "HASL, OSP, ENIG, Immersion Silver"
      },
      bgColor: "from-blue-50 to-indigo-50",
      iconColor: "text-blue-600",
      borderColor: "border-blue-200"
    },
    {
      title: "PCB Assembly",
      icon: Cpu,
      description: "Professional SMT and THT assembly with comprehensive testing",
      features: [
        "SMT & THT assembly",
        "Component sourcing",
        "Functional testing",
        "X-ray inspection",
        "Conformal coating",
        "Box build assembly"
      ],
      capabilities: {
        "Min. Component": "01005 (0.4x0.2mm)",
        "BGA Pitch": "0.3mm",
        "Assembly Accuracy": "±0.02mm",
        "Test Coverage": "100% electrical test",
        "Lead Time": "3-7 days"
      },
      bgColor: "from-green-50 to-emerald-50",
      iconColor: "text-green-600",
      borderColor: "border-green-200"
    },
    {
      title: "One-Stop Solution",
      icon: Settings,
      description: "Complete PCB project management from design to delivery",
      features: [
        "Design review & DFM",
        "Component procurement",
        "Supply chain management",
        "Quality assurance",
        "Global logistics",
        "After-sales support"
      ],
      capabilities: {
        "Project Management": "Dedicated PM",
        "Design Support": "Free DFM review",
        "Component Sourcing": "Authorized distributors",
        "Quality System": "ISO 9001:2015",
        "Shipping": "150+ countries"
      },
      bgColor: "from-purple-50 to-violet-50",
      iconColor: "text-purple-600",
      borderColor: "border-purple-200"
    }
  ];

  const industries = [
    { name: "Consumer Electronics", icon: "📱" },
    { name: "Automotive", icon: "🚗" },
    { name: "Industrial Control", icon: "🏭" },
    { name: "Medical Devices", icon: "🏥" },
    { name: "Telecommunications", icon: "📡" },
    { name: "Aerospace", icon: "✈️" },
    { name: "IoT & Wearables", icon: "⌚" },
    { name: "LED Lighting", icon: "💡" }
  ];

  const certifications = [
    { name: "ISO 9001:2015", desc: "Quality Management" },
    { name: "IPC-A-610", desc: "Assembly Standards" },
    { name: "IPC-A-600", desc: "PCB Standards" },
    { name: "UL Certified", desc: "Safety Standards" },
    { name: "RoHS Compliant", desc: "Environmental" },
    { name: "IATF 16949", desc: "Automotive Quality" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-800 hover:bg-blue-200">
            Professional PCB Services
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Complete PCB
            <span className="block text-blue-600">Manufacturing Solutions</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            From prototype to mass production, we deliver high-quality PCB fabrication, 
            assembly, and complete project management services with fast turnaround times.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/quote2">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Get Instant Quote
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline">
                Consult Engineer
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Core Services
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive PCB solutions tailored to your specific requirements
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className={`bg-gradient-to-br ${service.bgColor} border-2 ${service.borderColor} hover:shadow-xl transition-all duration-300`}>
                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 ${service.iconColor} bg-white rounded-lg flex items-center justify-center mb-4 shadow-sm`}>
                    <service.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    {service.title}
                  </CardTitle>
                  <p className="text-gray-600">{service.description}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Features */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Key Features</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {service.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Capabilities */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Technical Capabilities</h4>
                    <div className="space-y-2">
                      {Object.entries(service.capabilities).map(([key, value], idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">{key}:</span>
                          <span className="font-medium text-gray-900">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Industries We Serve */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Industries We Serve
            </h2>
            <p className="text-lg text-gray-600">
              Trusted by companies across diverse industries worldwide
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {industries.map((industry, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow duration-300">
                <div className="text-4xl mb-3">{industry.icon}</div>
                <h3 className="font-semibold text-gray-900">{industry.name}</h3>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quality & Certifications */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Quality & Certifications
            </h2>
            <p className="text-lg text-gray-600">
              Committed to the highest quality standards and industry certifications
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certifications.map((cert, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow duration-300">
                <Award className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">{cert.name}</h3>
                <p className="text-sm text-gray-600">{cert.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Overview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Process
            </h2>
            <p className="text-lg text-gray-600">
              Streamlined workflow for efficient project delivery
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Quote & Design Review", desc: "Upload files, get instant quote, free DFM analysis" },
              { step: "02", title: "Production Planning", desc: "Material sourcing, production scheduling, quality planning" },
              { step: "03", title: "Manufacturing", desc: "Fabrication, assembly, testing with real-time updates" },
              { step: "04", title: "Quality & Delivery", desc: "Final inspection, packaging, global shipping" }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Order */}
      <section id="how-to-order" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How to Order
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Simple, transparent ordering process designed for efficiency and clarity. 
              From quote to delivery in just a few easy steps.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Steps */}
            <div className="space-y-8">
              {[
                {
                  step: "01",
                  title: "Quick Registration & Upload",
                  description: "Create your free account in seconds and upload your Gerber files. Registered users get instant access to pricing, order history, and faster checkout.",
                  details: ["30-second registration", "Instant DFM analysis", "Real-time price calculation", "Order history access"]
                },
                {
                  step: "02", 
                  title: "Professional Review & Official Pricing",
                  description: "Our engineering team reviews your design and provides official pricing. You'll see the quote directly in your dashboard and receive email notification.",
                  details: ["Expert engineering review", "Dashboard quote display", "Design optimization suggestions", "Email notifications"]
                },
                {
                  step: "03",
                  title: "One-Click Order Placement",
                  description: "Review your quote and place your order with just one click. Your shipping address and preferences are already saved for convenience.",
                  details: ["Saved shipping addresses", "One-click ordering", "Preferred payment methods", "Order confirmation"]
                },
                {
                  step: "04",
                  title: "Payment & Real-Time Tracking",
                  description: "Pay securely via Stripe and production begins immediately. Track every step of your order through your personalized dashboard.",
                  details: ["Secure Stripe payment", "Immediate production start", "Real-time order tracking", "Production photo updates"]
                }
              ].map((item, index) => (
                <div key={index} className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold">
                      {item.step}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 mb-3">{item.description}</p>
                    <ul className="space-y-1">
                      {item.details.map((detail, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Options */}
            <div className="space-y-6">
              <Card className="p-6 border-2 border-blue-200 bg-blue-50">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  Getting Started Options
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-lg border border-blue-200 bg-blue-50">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-bold">RECOMMENDED</span>
                      Create Free Account
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">Best experience - instant quotes, order tracking, and faster checkout</p>
                    <Link href="/auth?signup=1">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        Sign Up Free
                      </Button>
                    </Link>
                  </div>
                  <div className="p-4 bg-white rounded-lg border">
                    <h4 className="font-semibold text-gray-900 mb-2">Already Have Account?</h4>
                    <p className="text-sm text-gray-600 mb-3">Sign in to access your quotes and orders</p>
                    <Link href="/auth">
                      <Button variant="outline" className="w-full">
                        Sign In
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">What You Need to Provide</h3>
                <div className="space-y-3">
                  {[
                    { item: "Free Account", desc: "30-second registration for best experience", required: true },
                    { item: "Gerber Files", desc: "Complete fabrication data", required: true },
                    { item: "PCB Specifications", desc: "Layer count, size, quantity", required: true },
                    { item: "Shipping Address", desc: "Saved to your account for convenience", required: true },
                    { item: "Phone Number", desc: "Optional for faster contact", required: false },
                    { item: "BOM & Assembly Files", desc: "Only for assembly projects", required: false }
                  ].map((req, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{req.item}</span>
                        {req.required && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Required</span>}
                      </div>
                      <span className="text-sm text-gray-600">{req.desc}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6 bg-green-50 border-green-200">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  Why Register with Us
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Instant quotes in your dashboard
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Order history and reorder easily
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Saved addresses and preferences
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Real-time order tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Priority customer support
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Your PCB Project?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Get instant quotes, professional guidance, and fast turnaround for all your PCB needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/quote2">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                Get PCB Quote
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/content/guides">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                Technical Guides
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 