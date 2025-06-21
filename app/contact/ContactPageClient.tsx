"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useChatwoot } from "@/lib/hooks/useChatwoot";
import Link from "next/link";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  ArrowRight,
  MessageSquare,
  Headphones,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function ContactPageClient() {
  const { toggle: toggleChat, isLoaded: isChatwootLoaded } = useChatwoot();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    projectType: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const { error: contactError } = await supabase
        .from("contacts")
        .insert([
          {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            company: formData.company,
            project_type: formData.projectType,
            message: formData.message,
          },
        ]);

      if (contactError) throw contactError;

      setSuccess(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        projectType: "",
        message: "",
      });
    } catch (err: unknown) {
      let errorMsg = 'Failed to send message. Please try again.';
      if (err instanceof Error) {
        errorMsg = err.message;
      } else if (typeof err === 'string') {
        errorMsg = err;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const contactMethods = [
    {
      icon: Phone,
      title: "Call Us",
      description: "Speak directly with our PCB experts",
      primary: "1-888-812-1949",
      secondary: "Toll Free (Sales)",
      action: "tel:+18888121949",
      actionText: "Call Now",
      color: "text-green-600",
      bgColor: "from-green-50 to-emerald-50",
      borderColor: "border-green-200"
    },
    {
      icon: Mail,
      title: "Email Us",
      description: "Get detailed technical support",
      primary: "sales@speedxpcb.com",
      secondary: "Response within 2 hours",
      action: "mailto:sales@speedxpcb.com",
      actionText: "Send Email",
      color: "text-blue-600",
      bgColor: "from-blue-50 to-indigo-50",
      borderColor: "border-blue-200"
    },
    {
      icon: MessageSquare,
      title: "Live Chat",
      description: "Instant support for urgent queries",
      primary: "24/7 Available",
      secondary: "Average response: 2 minutes",
      action: "chat",
      actionText: isChatwootLoaded ? "Start Chat" : "Chat Loading...",
      color: "text-purple-600",
      bgColor: "from-purple-50 to-violet-50",
      borderColor: "border-purple-200"
    }
  ];

  const officeLocations = [
    {
      title: "Head Office",
      address: "2680 14th Avenue, Unit 1&2",
      city: "Markham, ON L3R 5B2",
      country: "Canada",
      phone: "1-888-812-1949",
      type: "Sales & Support"
    },
    {
      title: "Production Facility",
      address: "2nd Floor, No.6 building, Zhongyuntai Science Industrial Park",
      city: "Tangtou 1st Road, Shiyan Town, Baoan District",
      country: "Shenzhen, Guangdong, China",
      phone: "1-416-800-7540",
      type: "Manufacturing"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-800 hover:bg-blue-200">
            24/7 Expert Support
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Get in Touch with
            <span className="block text-blue-600">PCB Experts</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Ready to start your PCB project? Our experienced team is here to provide 
            technical guidance, instant quotes, and professional support for all your needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:+8618888121949">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Call Now: 861-888-812-1949
                <Phone className="ml-2 w-4 h-4" />
              </Button>
            </a>
            <Link href="/quote2">
              <Button size="lg" variant="outline">
                Get Instant Quote
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Multiple Ways to Reach Us
            </h2>
            <p className="text-lg text-gray-600">
              Choose the method that works best for you
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contactMethods.map((method, index) => (
              <Card key={index} className={`bg-gradient-to-br ${method.bgColor} border-2 ${method.borderColor} hover:shadow-xl transition-all duration-300 group`}>
                <CardContent className="p-8 text-center">
                  <div className={`w-16 h-16 ${method.color} bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                    <method.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{method.title}</h3>
                  <p className="text-gray-600 mb-4">{method.description}</p>
                  <div className="space-y-2 mb-6">
                    <p className="font-semibold text-gray-900">{method.primary}</p>
                    <p className="text-sm text-gray-600">{method.secondary}</p>
                  </div>
                  {method.action === "chat" ? (
                    <Button 
                      onClick={() => toggleChat('open')}
                      disabled={!isChatwootLoaded}
                      className={`w-full ${method.color} bg-white hover:bg-gray-50 border-2 border-current disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {method.actionText}
                    </Button>
                  ) : (
                    <a href={method.action}>
                      <Button className={`w-full ${method.color} bg-white hover:bg-gray-50 border-2 border-current`}>
                        {method.actionText}
                      </Button>
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Office Info */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Send Us a Message
                </h2>
                                 <p className="text-lg text-gray-600">
                   Fill out the form below and we&apos;ll get back to you within 2 hours during business hours.
                 </p>
              </div>

              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Your full name"
                          className="h-12"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <Input
                          required
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="your.email@company.com"
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Phone
                        </label>
                        <Input
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+1 (555) 123-4567"
                          className="h-12"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Company
                        </label>
                        <Input
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          placeholder="Your company name"
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Project Type
                      </label>
                      <select
                        value={formData.projectType}
                        onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                        className="w-full h-12 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select project type</option>
                        <option value="prototype">Prototype PCB</option>
                        <option value="small-batch">Small Batch (1-100 pcs)</option>
                        <option value="medium-batch">Medium Batch (100-1000 pcs)</option>
                        <option value="mass-production">Mass Production (1000+ pcs)</option>
                        <option value="pcb-assembly">PCB Assembly (PCBA)</option>
                        <option value="design-service">Design Service</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Message <span className="text-red-500">*</span>
                      </label>
                      <Textarea
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Tell us about your project requirements, timeline, and any specific questions you have..."
                        rows={6}
                        className="resize-none"
                      />
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <span className="text-red-700">{error}</span>
                      </div>
                    )}

                    {success && (
                      <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                                                 <span className="text-green-700">
                           Thank you for your message! We&apos;ll get back to you within 2 hours during business hours.
                         </span>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg font-semibold"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sending Message...
                        </>
                      ) : (
                        <>
                          Send Message
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Office Information */}
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Our Offices
                </h2>
                <p className="text-lg text-gray-600">
                  Visit us at our locations or contact our teams directly.
                </p>
              </div>

              <div className="space-y-6">
                {officeLocations.map((office, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">{office.title}</h3>
                            <Badge variant="outline" className="text-xs">
                              {office.type}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-1">{office.address}</p>
                          <p className="text-gray-600 mb-3">{office.city}, {office.country}</p>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-blue-600" />
                            <a href={`tel:${office.phone.replace(/[^0-9]/g, '')}`} className="text-blue-600 hover:text-blue-800 font-medium">
                              {office.phone}
                            </a>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Business Hours */}
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Clock className="w-6 h-6 text-blue-600" />
                      <h3 className="text-xl font-bold text-gray-900">Business Hours</h3>
                    </div>
                    <div className="space-y-2 text-gray-700">
                      <div className="flex justify-between">
                        <span>Monday - Friday:</span>
                        <span className="font-semibold">8:30 AM - 5:00 PM EST</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Saturday:</span>
                        <span className="font-semibold">9:00 AM - 2:00 PM EST</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sunday:</span>
                        <span className="font-semibold">Closed</span>
                      </div>
                      <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <Headphones className="w-4 h-4 inline mr-1" />
                          Emergency support available 24/7 for existing customers
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
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
             Don&apos;t wait! Get your instant quote now and experience the SpeedXPCB difference.
           </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/quote2">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                Get Instant Quote
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/services">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                View Our Services
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
