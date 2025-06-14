"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

import { AlertCircle, CheckCircle, Mail, Users, Database } from 'lucide-react';

export default function TestAdminEmailPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [adminInfo, setAdminInfo] = useState<{
    adminCount: number;
    adminEmails: string[];
    admins: Array<{ id: string; role: string; email: string }>;
    timestamp: string;
  } | null>(null);
  const [customSubject, setCustomSubject] = useState('🧪 Test Email - Admin Notification System');
  const [customMessage, setCustomMessage] = useState('This is a test email to verify that the admin email notification system is working properly.');

  // 检查管理员信息
  const checkAdminInfo = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/admin/debug/admin-info', {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        setResult(`❌ Failed to get admin info: ${errorData.error || 'Unknown error'}`);
        return;
      }

      const data = await response.json();
      setAdminInfo(data);
      setResult(`✅ Successfully retrieved admin info!\n\nAdmin count: ${data.adminCount}\nAdmin emails: ${data.adminEmails.join(', ')}`);
    } catch (err) {
      setResult(`❌ Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // 测试直接发送邮件
  const testDirectEmail = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/notify-customer-service', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: customSubject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 28px;">🧪 Test Notification</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Admin Email Notification System Test</p>
              </div>
              
              <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 20px;">
                  <h2 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">📧 Test Message</h2>
                  <p style="color: #1f2937; margin: 0; line-height: 1.6;">${customMessage}</p>
                </div>
                
                <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 16px;">📊 Test Information</h3>
                  <ul style="color: #6b7280; margin: 0; padding-left: 20px; line-height: 1.8;">
                    <li><strong>Test Time:</strong> ${new Date().toLocaleString()}</li>
                    <li><strong>Function:</strong> Admin Email Notification System</li>
                    <li><strong>API Endpoint:</strong> /api/notify-customer-service</li>
                    <li><strong>Email Type:</strong> System Test Email</li>
                  </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <div style="background: #dcfce7; color: #166534; padding: 15px; border-radius: 8px; display: inline-block;">
                    <strong>✅ If you receive this email, the notification system is working properly!</strong>
                  </div>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 0;">
                  This is an automatically sent test email, please do not reply directly.<br>
                  If you have any questions, please contact technical support.
                </p>
              </div>
            </div>
          `
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setResult(`❌ Email sending failed: ${errorData.error || 'Unknown error'}`);
      } else {
        setResult('✅ Test email sent successfully! Please check admin mailboxes.\n\nIf admins receive the email, the notification system is working properly.');
      }
    } catch (err) {
      setResult(`❌ Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // 测试订单修改通知
  const testOrderNotification = async () => {
    setLoading(true);
    setResult('');

    try {
      const testOrderId = 'test-order-' + Date.now();
      
      const response = await fetch('/api/notify-customer-service', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: '🔄 Order Modification Notification - Test',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">🔄 Order Modification Notification</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">User order status has changed</p>
              </div>
              
              <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 20px;">
                  <h2 style="color: #92400e; margin: 0 0 15px 0;">📋 Order Information</h2>
                  <div style="color: #78350f;">
                    <p><strong>Order ID:</strong> ${testOrderId}</p>
                    <p><strong>Status Change:</strong> Reviewed → Pending</p>
                    <p><strong>Modification Time:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>Modification Reason:</strong> User modified order information</p>
                  </div>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="#" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    View Order Details
                  </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="color: #6b7280; font-size: 14px; text-align: center;">
                  This is an automatically sent test email, please do not reply directly.
                </p>
              </div>
            </div>
          `
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setResult(`❌ Order notification sending failed: ${errorData.error || 'Unknown error'}`);
      } else {
        setResult('✅ Order modification notification sent successfully! Please check admin mailboxes.');
      }
    } catch (err) {
      setResult(`❌ Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Email Notification Test</h1>
        <p className="text-gray-600">Test whether the admin email notification function is working properly</p>
      </div>

      <div className="grid gap-6">
        {/* 管理员信息检查 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Admin Information Check
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              First check if there are admin users in the database and their email addresses.
            </p>
            
            <Button
              onClick={checkAdminInfo}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <Users className="h-4 w-4 mr-2" />
              Check Admin Info
            </Button>

            {adminInfo && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Admin Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{adminInfo.adminCount} Admins</Badge>
                  </div>
                  <div>
                    <strong>Email Addresses:</strong>
                    <ul className="mt-1 ml-4">
                      {adminInfo.adminEmails.map((email: string, index: number) => (
                        <li key={index} className="text-blue-700">• {email}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 自定义邮件测试 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Custom Email Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Enter email subject"
                />
              </div>
              
              <div>
                <Label htmlFor="message">Email Content</Label>
                <Textarea
                  id="message"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Enter email content"
                  rows={3}
                />
              </div>
            </div>

            <Button
              onClick={testDirectEmail}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Test Email
            </Button>
          </CardContent>
        </Card>

        {/* 订单通知测试 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Order Notification Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Simulate notification emails sent to admins when users modify orders.
            </p>
            
            <Button
              onClick={testOrderNotification}
              disabled={loading}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Send Order Notification
            </Button>
          </CardContent>
        </Card>

        {/* 结果显示 */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.includes('✅') ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg overflow-auto">
                {result}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* 说明信息 */}
        <Card>
          <CardHeader>
            <CardTitle>💡 Usage Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                <strong className="text-gray-800">1. Check Admin Information:</strong>
                <p>Confirm that there are admin users in the database with valid email addresses.</p>
              </div>
              
              <div>
                <strong className="text-gray-800">2. Send Test Email:</strong>
                <p>Directly call the notify-customer-service API to send test emails.</p>
              </div>
              
              <div>
                <strong className="text-gray-800">3. Check Email Configuration:</strong>
                <p>Ensure SMTP configuration in environment variables is correct:</p>
                <ul className="ml-4 mt-1 space-y-1">
                  <li>• SMTP_HOST (default: smtp.qq.com)</li>
                  <li>• SMTP_PORT (default: 465)</li>
                  <li>• SMTP_USER or QQ_EMAIL_USER</li>
                  <li>• SMTP_PASS or QQ_EMAIL_AUTH_CODE</li>
                </ul>
              </div>
              
              <div>
                <strong className="text-gray-800">4. Common Issues:</strong>
                <ul className="ml-4 mt-1 space-y-1">
                  <li>• If no admins exist, set user role to 'admin' in profiles table</li>
                  <li>• Check if SMTP service is working properly</li>
                  <li>• Confirm admin email addresses are correct</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 