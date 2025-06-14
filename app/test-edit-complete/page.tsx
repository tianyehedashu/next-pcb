"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabaseClient';

interface Quote {
  id: string;
  status: string;
  user_id: string | null;
  email: string;
  phone?: string;
  pcb_spec?: Record<string, unknown>;
  shipping_address?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export default function TestEditCompletePage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // 获取当前用户
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // 获取最近的订单列表
  const fetchQuotes = async () => {
    setLoading(true);
    setError(null);

    try {
      // 直接从数据库获取订单列表
      const { data, error: dbError } = await supabase
        .from('pcb_quotes')
        .select('id, status, user_id, email, phone, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (dbError) {
        throw new Error(dbError.message);
      }

      setQuotes(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quotes');
    } finally {
      setLoading(false);
    }
  };

  // 获取单个订单详情
  const fetchQuoteDetail = async (quoteId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/quote/${quoteId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(`HTTP ${response.status}: ${data.error || 'Unknown error'}`);
        setSelectedQuote(null);
      } else {
        setSelectedQuote(data);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      setSelectedQuote(null);
    } finally {
      setLoading(false);
    }
  };

  // 测试编辑功能
  const testEditQuote = async (quoteId: string) => {
    if (!selectedQuote) return;

    setLoading(true);
    setError(null);

    try {
      const updateData = {
        ...selectedQuote.pcb_spec,
        phone: selectedQuote.phone || '+1234567890',
        email: selectedQuote.email,
        shippingAddress: selectedQuote.shipping_address,
        gerberFileUrl: null,
        cal_values: {},
        // 测试更新一个字段
        pcbNote: `Updated at ${new Date().toISOString()}`
      };

      const response = await fetch(`/api/quote/${quoteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(`Edit failed - HTTP ${response.status}: ${data.error || 'Unknown error'}`);
      } else {
        setError(null);
        // 重新获取更新后的数据
        await fetchQuoteDetail(quoteId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'quoted': return 'bg-blue-100 text-blue-800';
      case 'created': return 'bg-green-100 text-green-800';
      case 'reviewed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canEdit = (quote: Quote) => {
    if (!user) return false;
    
    // 管理员可以编辑大部分状态
    if ((user as any).role === 'admin') {
      return !['completed', 'cancelled', 'delivered'].includes(quote.status);
    }
    
    // 用户只能编辑特定状态
    if (quote.user_id === user.id) {
      return ['created', 'pending', 'reviewed'].includes(quote.status);
    }
    
    return false;
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">Complete Edit Function Test</h1>
      
      {/* 用户信息 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Current User</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-2">
              <p><strong>ID:</strong> {user.id as string}</p>
              <p><strong>Email:</strong> {user.email as string}</p>
              <p><strong>Role:</strong> {(user as any).role || 'user'}</p>
            </div>
          ) : (
            <p>Not logged in</p>
          )}
        </CardContent>
      </Card>

      {/* 获取订单列表 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Step 1: Fetch Quotes</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={fetchQuotes} 
            disabled={loading}
            className="mb-4"
          >
            {loading ? 'Loading...' : 'Fetch Recent Quotes'}
          </Button>
          
          {quotes.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Available Quotes:</h4>
              {quotes.slice(0, 5).map((quote) => (
                <div key={quote.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(quote.status)}>
                      {quote.status}
                    </Badge>
                    <span className="text-sm font-mono">{quote.id.slice(0, 8)}...</span>
                    <span className="text-sm text-gray-600">{quote.email}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fetchQuoteDetail(quote.id)}
                      disabled={loading}
                    >
                      Get Detail
                    </Button>
                    {canEdit(quote) && (
                      <Badge variant="secondary">Editable</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 订单详情 */}
      {selectedQuote && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Step 2: Quote Detail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quote ID</Label>
                <p className="font-mono text-sm">{selectedQuote.id}</p>
              </div>
              <div>
                <Label>Status</Label>
                <Badge className={getStatusColor(selectedQuote.status)}>
                  {selectedQuote.status}
                </Badge>
              </div>
              <div>
                <Label>Email</Label>
                <p>{selectedQuote.email}</p>
              </div>
              <div>
                <Label>Phone</Label>
                <p>{selectedQuote.phone || 'N/A'}</p>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <Label>PCB Specifications</Label>
              <pre className="bg-gray-100 p-3 rounded-lg text-xs overflow-auto max-h-40">
                {JSON.stringify(selectedQuote.pcb_spec, null, 2)}
              </pre>
            </div>

            {canEdit(selectedQuote) && (
              <div className="pt-4">
                <Button
                  onClick={() => testEditQuote(selectedQuote.id)}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? 'Updating...' : 'Test Edit Quote'}
                </Button>
                <p className="text-sm text-gray-600 mt-2">
                  This will update the pcbNote field with current timestamp
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 错误显示 */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* 编辑链接测试 */}
      <Card>
        <CardHeader>
          <CardTitle>Step 3: Test Edit Links</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Test the actual edit page with different quote IDs:
          </p>
          <div className="space-y-2">
            {quotes.slice(0, 3).map((quote) => (
              <div key={quote.id} className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">{quote.id.slice(0, 8)}... ({quote.status})</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`/quote2?edit=${quote.id}`, '_blank')}
                >
                  Open Edit Page
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 