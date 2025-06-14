"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TestEditApiPage() {
  const [quoteId, setQuoteId] = useState('aba642d6-1a20-4ac5-a466-4fbc8fdf5fa0');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testGetQuote = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

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
        setResult(data);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Test Edit API</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test GET /api/quote/[id]</CardTitle>
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
          
          <Button 
            onClick={testGetQuote} 
            disabled={loading || !quoteId}
            className="w-full"
          >
            {loading ? 'Loading...' : 'Test Get Quote'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>API Response</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 