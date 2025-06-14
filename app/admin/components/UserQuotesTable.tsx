"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Order as Quote } from '../types/order'; // Using Order type as it maps to pcb_quotes
import { Pagination } from '@/app/components/ui/pagination';
import { Eye, FileText, Calendar, Loader2 } from 'lucide-react';

interface UserQuotesTableProps {
  userId: string;
}

export function UserQuotesTable({ userId }: UserQuotesTableProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 5, total: 0 });

  const fetchQuotes = useCallback(async () => {
    try {
      setLoading(true);
      // We use the same 'orders' endpoint, as quotes and orders are the same table
      const params = new URLSearchParams({
        userId,
        page: String(pagination.page),
        pageSize: String(pagination.pageSize),
      });
      const response = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch quotes');
      }
      const data = await response.json();
      setQuotes(data.items || []);
      setPagination(p => ({ ...p, total: data.total || 0 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId, pagination.page, pagination.pageSize]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const handlePageChange = (page: number) => {
    setPagination(p => ({ ...p, page }));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800' },
      pending: { variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800' },
      quoted: { variant: 'secondary' as const, className: 'bg-blue-100 text-blue-800' },
      approved: { variant: 'secondary' as const, className: 'bg-green-100 text-green-800' },
      rejected: { variant: 'secondary' as const, className: 'bg-red-100 text-red-800' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-gray-500">Loading quotes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="p-3 bg-red-100 rounded-full">
          <FileText className="h-6 w-6 text-red-600" />
        </div>
        <div className="text-center">
          <p className="text-red-600 font-medium">Error loading quotes</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="font-semibold text-gray-700">Quote ID</TableHead>
              <TableHead className="font-semibold text-gray-700">Status</TableHead>
              <TableHead className="font-semibold text-gray-700">Created</TableHead>
              <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.length > 0 ? (
              quotes.map((quote) => (
                <TableRow key={quote.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="font-mono text-sm font-medium text-blue-600">
                    #{quote.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(quote.status || 'draft')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {quote.created_at ? formatDate(quote.created_at) : 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      asChild 
                      variant="outline" 
                      size="sm"
                      className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                    >
                      <Link href={`/admin/quote/${quote.id}`} className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-gray-100 rounded-full">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">No quotes found</p>
                      <p className="text-gray-400 text-sm">This user hasn&apos;t requested any quotes yet</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {quotes.length > 0 && (
        <div className="flex justify-center">
          <Pagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
} 