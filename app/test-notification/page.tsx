"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/components/ui/use-toast";
import { sendTestEmailAction } from '../test-admin-email/actions'; // Reusing the existing action

export default function TestNotificationPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('Generic Test Notification');
  const [htmlContent, setHtmlContent] = useState('<p>This is a generic test notification.</p>');
  const { toast } = useToast();

  const testOrderModification = async () => {
    setLoading(true);
    setResult('');

    try {
      // 测试修改一个reviewed状态的订单
      const quoteId = 'fffb7d09-6f73-4c19-9b7c-707c6ffc01c5';
      
      const response = await fetch(`/api/quote/${quoteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // 修改一个简单的字段来触发通知
          pcbNote: `测试修改 - ${new Date().toISOString()}`,
          email: 'denglietao@qq.com',
          phone: '+8618627104721',
          shippingAddress: {
            country: 'CN',
            state: '',
            city: '',
            address: '',
            zipCode: '',
            contactName: 'Test User',
            phone: '',
            courier: ''
          },
          gerberFileUrl: null,
          cal_values: {}
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        setResult(`❌ 修改失败: HTTP ${response.status} - ${data.error || 'Unknown error'}`);
      } else {
        setResult(`✅ 订单修改成功！\n\n订单ID: ${data.id}\n新状态: ${data.status}\n\n如果状态发生变化，管理员应该会收到邮件通知。\n请检查管理员邮箱。`);
      }
    } catch (err) {
      setResult(`❌ 网络错误: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    setLoading(true);
    const result = await sendTestEmailAction(subject, htmlContent);
    setLoading(false);

    if (result.success) {
      toast({
        title: "Success",
        description: "Test notification sent successfully!",
      });
    } else {
      toast({
        title: "Error",
        description: `Failed to send notification: ${result.error}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">订单修改通知测试</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>🔔 通知机制说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">✨ 新增功能</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 用户修改订单后，如果状态发生变化，自动发送邮件通知所有管理员</li>
              <li>• <Badge variant="outline">reviewed</Badge> 状态的订单被修改后会变为 <Badge variant="secondary">pending</Badge> 状态</li>
              <li>• <Badge variant="outline">quoted</Badge> 状态的订单被修改后也会变为 <Badge variant="secondary">pending</Badge> 状态</li>
              <li>• 邮件包含订单详情、状态变更信息和直接链接</li>
            </ul>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={testOrderModification}
              disabled={loading}
              className="h-20 flex flex-col items-center justify-center"
            >
              <span className="font-semibold">测试订单修改</span>
              <span className="text-sm">修改reviewed状态订单</span>
            </Button>
            
            <Button
              onClick={handleSendNotification}
              disabled={loading}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center"
            >
              <span className="font-semibold">测试直接通知</span>
              <span className="text-sm">发送测试邮件</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>测试结果</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm whitespace-pre-wrap">
              {result}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>📋 状态转换规则</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">用户编辑订单时的状态变化</h4>
              <div className="space-y-2 text-sm text-green-700">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">reviewed</Badge>
                  <span>→</span>
                  <Badge variant="secondary">pending</Badge>
                  <span className="text-xs">(需要重新审核)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">quoted</Badge>
                  <span>→</span>
                  <Badge variant="secondary">pending</Badge>
                  <span className="text-xs">(需要重新审核)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">created</Badge>
                  <span>→</span>
                  <Badge variant="outline">created</Badge>
                  <span className="text-xs">(状态不变)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">pending</Badge>
                  <span>→</span>
                  <Badge variant="outline">pending</Badge>
                  <span className="text-xs">(状态不变)</span>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">⚠️ 通知触发条件</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• 只有用户（非管理员）修改订单时才发送通知</li>
                <li>• 只有状态发生实际变化时才发送通知</li>
                <li>• 通知包含详细的状态变更信息和操作建议</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 