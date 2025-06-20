"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from "@/components/ui/use-toast";
import { sendTestEmailAction } from './actions';
import { Mail, AlertCircle, Info } from 'lucide-react';

export default function TestAdminEmailPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [genericSubject, setGenericSubject] = useState('🧪 Test Email - Admin Notification System');
  const [genericHtml, setGenericHtml] = useState('<p>This is a test email to verify that the admin email notification system is working properly.</p>');

  const orderSubject = '🔄 Order Modification Notification - Test';
  const orderHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937;">Order Modification Notification (Test)</h2>
      <p>This is a test email simulating a user modifying an order.</p>
      <p><strong>Order ID:</strong> test-order-12345</p>
      <p><strong>Status Change:</strong> Reviewed → Pending</p>
      <p>If you received this, the notification logic for order updates is working.</p>
    </div>
  `;

  const handleSend = async (subject: string, html: string) => {
    setIsLoading(true);
    const result = await sendTestEmailAction(subject, html);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: "✅ Success",
        description: `Email with subject "${subject}" sent successfully! Please check admin mailboxes.`,
      });
    } else {
      toast({
        title: "❌ Error",
        description: `Failed to send email: ${result.error}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Email Notification Test</h1>
        <p className="text-gray-600">A tool to test and verify the admin email notification functionality.</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Custom Email Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Send a custom email to all administrators.
            </p>
            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                value={genericSubject}
                onChange={(e) => setGenericSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Email HTML Content</Label>
              <Textarea
                id="message"
                value={genericHtml}
                onChange={(e) => setGenericHtml(e.target.value)}
                rows={5}
              />
            </div>
            <Button onClick={() => handleSend(genericSubject, genericHtml)} disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Custom Email'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Order Notification Simulation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Simulate the notification email sent when a user modifies an order.
            </p>
            <Button onClick={() => handleSend(orderSubject, orderHtml)} disabled={isLoading} variant="outline">
               {isLoading ? 'Sending...' : 'Send Order Notification Test'}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
           <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Info className="h-5 w-5" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-700">
            <p>
              Both buttons on this page use a single Server Action (`sendTestEmailAction`).
              This action securely calls the `sendAdminNotification` utility on the server-side,
              which handles fetching admin emails and sending the email via SMTP.
              There are no direct API calls from this client page.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 