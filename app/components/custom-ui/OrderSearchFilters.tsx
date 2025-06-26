"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, RotateCcw } from "lucide-react";

export interface SearchFilters {
  keyword: string;
  orderId: string;
  status: string;
  dateStart: Date | undefined;
  dateEnd: Date | undefined;
}

interface OrderSearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  onReset: () => void;
  loading: boolean;
}

export default function OrderSearchFilters({
  filters,
  onFiltersChange,
  onSearch,
  onReset,
  loading = false
}: OrderSearchFiltersProps): React.ReactElement {

  const handleInputChange = (field: keyof SearchFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value
    });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value
    });
  };

  const hasActiveFilters = filters.keyword || filters.orderId || filters.status !== 'all';

  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Keyword Search */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Keyword
          </label>
          <Input
            placeholder="Search email, phone, order ID..."
            value={filters.keyword}
            onChange={(e) => handleInputChange('keyword', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Order ID */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Order ID
          </label>
          <Input
            placeholder="Enter order ID..."
            value={filters.orderId}
            onChange={(e) => handleInputChange('orderId', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Status
          </label>
          <Select value={filters.status} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="created">Created</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="quoted">Quoted</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="in_production">In Production</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 invisible">
            Actions
          </label>
          <div className="flex gap-2">
            <Button
              onClick={onSearch}
              disabled={loading}
              className="flex items-center gap-2 flex-1"
              size="sm"
            >
              <Search className="h-4 w-4" />
              Search
            </Button>
            
            {hasActiveFilters && (
              <Button
                onClick={onReset}
                disabled={loading}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <span className="text-sm text-gray-600">Active filters:</span>
          {filters.keyword && (
            <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
              Keyword: {filters.keyword}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-blue-600" 
                onClick={() => handleInputChange('keyword', '')}
              />
            </span>
          )}
          {filters.orderId && (
            <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
              Order ID: {filters.orderId}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-blue-600" 
                onClick={() => handleInputChange('orderId', '')}
              />
            </span>
          )}
          {filters.status !== 'all' && (
            <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
              Status: {filters.status}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-blue-600" 
                onClick={() => handleStatusChange('all')}
              />
            </span>
          )}
        </div>
      )}
    </div>
  );
} 