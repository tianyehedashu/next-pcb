"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface QuoteData {
  id: string;
  email: string;
  phone: string | null;
  status: string;
  created_at: string;
  pcb_spec: Record<string, any>;
  shipping_address: Record<string, any> | null;
  gerber_file_url: string | null;
}

export default function TestEditDataPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from('pcb_quotes')
        .select('id, email, phone, status, created_at, pcb_spec, shipping_address, gerber_file_url')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setQuotes(data || []);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuote = (quoteId: string) => {
    router.push(`/quote2?edit=${quoteId}`);
  };

  const handleNewQuote = () => {
    router.push('/quote2');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">Loading quotes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-8">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Quote Edit Data Initialization</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Test that the edit mode correctly initializes the form with data from the database.
            </p>
            <Button 
              onClick={handleNewQuote}
              className="mb-4"
              variant="outline"
            >
              Create New Quote
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Quotes (Click to Edit)</CardTitle>
          </CardHeader>
          <CardContent>
            {quotes.length === 0 ? (
              <p className="text-gray-500">No quotes found.</p>
            ) : (
              <div className="space-y-4">
                {quotes.map((quote) => (
                  <div 
                    key={quote.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleEditQuote(quote.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <span className="font-medium text-blue-600">
                            ID: {quote.id.slice(0, 8)}...
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            quote.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            quote.status === 'quoted' ? 'bg-blue-100 text-blue-800' :
                            quote.status === 'paid' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {quote.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Email: {quote.email}</div>
                          {quote.phone && <div>Phone: {quote.phone}</div>}
                          <div>Created: {new Date(quote.created_at).toLocaleDateString()}</div>
                          {quote.pcb_spec && (
                            <div>
                              PCB: {quote.pcb_spec.layers || 'N/A'} layers, 
                              {quote.pcb_spec.thickness || 'N/A'}mm thick
                            </div>
                          )}
                          {quote.gerber_file_url && (
                            <div className="text-green-600">✓ Has Gerber file</div>
                          )}
                          {quote.shipping_address && (
                            <div className="text-blue-600">✓ Has shipping address</div>
                          )}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditQuote(quote.id);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Test Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>1.</strong> Click on any quote above to edit it</p>
              <p><strong>2.</strong> Verify that the form is pre-filled with the correct data from the database</p>
              <p><strong>3.</strong> Check that PCB specifications, shipping address, and Gerber file are loaded</p>
              <p><strong>4.</strong> Verify that the form title shows "Edit PCB Quote" instead of "PCB Quote Request"</p>
              <p><strong>5.</strong> Make changes and submit to test the update functionality</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 