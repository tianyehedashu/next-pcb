"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { MapPin, Phone, Mail, User, Clock } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
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
            message: formData.message,
          },
        ]);

      if (contactError) throw contactError;

      setSuccess(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        message: "",
      });
    } catch (err: unknown) {
      let errorMsg = 'Unknown error';
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-blue-700 text-center mb-8">Contact SpeedXPCB</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 联系信息 */}
        <div className="space-y-6">
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-blue-700 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Our Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-gray-600">
                <p className="font-semibold">Head Office</p>
                <p>2680 14th Avenue, Unit 1&2</p>
                <p>Markham, ON L3R 5B2, Canada</p>
              </div>
              <div className="text-gray-600">
                <p className="font-semibold">Production Facility</p>
                <p>2nd Floor, No.6 building</p>
                <p>Zhongyuntai Science Industrial Park</p>
                <p>Tangtou 1st Road, Shiyan Town</p>
                <p>Baoan District, Shenzhen, Guangdong, China</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-blue-700 flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Contact Numbers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-gray-600">
                <p className="font-semibold">Sales (Toll Free)</p>
                <p>1-888-812-1949</p>
              </div>
              <div className="text-gray-600">
                <p className="font-semibold">Production</p>
                <p>1-416-800-7540</p>
              </div>
              <div className="text-gray-600">
                <p className="font-semibold">Fax</p>
                <p>1-416-800-7548</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-blue-700 flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-600">
                <p className="font-semibold">Sales</p>
                <p>sales@speedxpcb.com</p>
              </div>
              <div className="text-gray-600 mt-2">
                <p className="font-semibold">Support</p>
                <p>support@speedxpcb.com</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-blue-700 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Office Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-600">
                <p>Monday through Friday</p>
                <p>8:30AM to 5:00PM EST</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 联系表单 */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-blue-700 flex items-center gap-2">
              <User className="w-5 h-5" />
              Contact Us
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-blue-700">Name <span className="text-red-500">*</span></label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your name"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-blue-700">Email <span className="text-red-500">*</span></label>
                <Input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Your email"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-blue-700">Phone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Your phone number"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-blue-700">Message <span className="text-red-500">*</span></label>
                <Textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Your message"
                  rows={5}
                  className="mt-1"
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

              {success && (
                <div className="text-green-500 text-sm">
                  Thank you for your message. We will get back to you soon.
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 