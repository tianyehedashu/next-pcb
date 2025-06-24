"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PaymentDebugPage() {
  const [orderId, setOrderId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testPaymentIntent = async () => {
    if (!orderId.trim()) {
      setError('Please enter an Order ID');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('Testing payment intent creation for order:', orderId);
      
      const response = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderId.trim(),
          amount: 100, // Test amount
          currency: 'usd'
        })
      });

      const data = await response.json();
      
      setResult({
        status: response.status,
        ok: response.ok,
        data: data
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Payment Intent Debug Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Order ID</label>
            <Input
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Enter order ID to test"
            />
          </div>

          <Button 
            onClick={testPaymentIntent} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Testing...' : 'Test Payment Intent Creation'}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="space-y-4">
              <Alert variant={result.ok ? "default" : "destructive"}>
                <AlertDescription>
                  Status: {result.status} ({result.ok ? 'Success' : 'Error'})
                </AlertDescription>
              </Alert>
              
              <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Response Data:</h3>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600">
            <p><strong>Instructions:</strong></p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Enter a valid Order ID from your profile/orders page</li>
              <li>Click "Test Payment Intent Creation"</li>
              <li>Check the response to debug any issues</li>
              <li>Check browser console for detailed logs</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 