"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TestSimpleEditPage() {
  const [quoteId, setQuoteId] = useState('aba642d6-1a20-4ac5-a466-4fbc8fdf5fa0');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testGetQuote = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch(`/api/quote/${quoteId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        setResult(`❌ Error: HTTP ${response.status} - ${data.error}\n\nDetails: ${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`✅ Success: Quote found!\n\nID: ${data.id}\nStatus: ${data.status}\nEmail: ${data.email}\nHas Admin Order: ${data.admin_orders && data.admin_orders.length > 0 ? 'Yes' : 'No'}\n\nFull response:\n${JSON.stringify(data, null, 2)}`);
      }
    } catch (err) {
      setResult(`❌ Network Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const openEditPage = () => {
    window.open(`/quote2?edit=${quoteId}`, '_blank');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Simple Edit Test - Fixed</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Quote API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="quote-id">Quote ID</Label>
            <Input
              id="quote-id"
              value={quoteId}
              onChange={(e) => setQuoteId(e.target.value)}
              placeholder="Enter quote ID"
            />
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={testGetQuote} 
              disabled={loading || !quoteId}
            >
              {loading ? 'Testing...' : 'Test Get Quote'}
            </Button>
            
            <Button 
              onClick={openEditPage} 
              disabled={!quoteId}
              variant="outline"
            >
              Open Edit Page
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
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
          <CardTitle>Quick Test Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuoteId('aba642d6-1a20-4ac5-a466-4fbc8fdf5fa0')}
            >
              Test ID 1: aba642d6... (pending) ✅ Has admin_order
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuoteId('93b99dec-b9a1-40bc-af82-8a82b3337f47')}
            >
              Test ID 2: 93b99dec... (quoted) ❌ No admin_order
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuoteId('fffb7d09-6f73-4c19-9b7c-707c6ffc01c5')}
            >
              Test ID 3: fffb7d09... (reviewed) ❌ No admin_order
            </Button>
          </div>
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>✅ 修复完成：</strong> 已修复 admin_orders 表字段引用问题，移除了不存在的 order_status 字段。
              现在API应该可以正常处理有和没有管理员订单的情况。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 