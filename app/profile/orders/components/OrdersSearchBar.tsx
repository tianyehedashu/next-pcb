import React from 'react';
import { Search, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/app/components/ui/date-picker";
import { STATUS_OPTIONS, SEARCH_COLUMNS } from '../constants/orderConstants';
import type { OrdersFilters } from '../types/orderTypes';

interface OrdersSearchBarProps {
  filters: OrdersFilters;
  totalCount: number;
  filteredCount: number;
  hasSearchResults: boolean;
  loading: boolean;
  refreshing: boolean;
  onSearchKeywordChange: (keyword: string) => void;
  onSearchColumnChange: (column: string) => void;
  onBackendSearch: (term: string) => void;
  onClearSearch: () => void;
  onStatusFilter: (status: string) => void;
  onToggleCancelled: (show: boolean) => void;
  onRefresh: () => void;
  onDateChange: (date: Date | undefined, field: "dateStart" | "dateEnd") => void;
}

export default function OrdersSearchBar({
  filters,
  totalCount,
  filteredCount,
  hasSearchResults,
  loading,
  refreshing,
  onSearchKeywordChange,
  onSearchColumnChange,
  onBackendSearch,
  onClearSearch,
  onStatusFilter,
  onToggleCancelled,
  onRefresh,
  onDateChange,
}: OrdersSearchBarProps) {
  return (
    <div className="space-y-4">
      {/* 搜索栏 - 响应式布局 */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* 搜索列选择 - 移动端全宽，桌面端固定宽度 */}
        <div className="w-full sm:w-[140px]">
          <Select
            value={filters.searchColumn}
            onValueChange={onSearchColumnChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Search by" />
            </SelectTrigger>
            <SelectContent>
              {SEARCH_COLUMNS.map((column) => (
                <SelectItem key={column.value} value={column.value}>
                  {column.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 搜索输入框 - 响应式 */}
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder={`Search by ${
              SEARCH_COLUMNS.find((col) => col.value === filters.searchColumn)
                ?.label || "Order ID"
            }...`}
            value={filters.searchKeyword}
            onChange={(e) => onSearchKeywordChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onBackendSearch(filters.searchKeyword)}
            className="pl-10 pr-10 w-full"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          {filters.searchKeyword && (
            <button
              onClick={onClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* 操作按钮 - 响应式 */}
        <div className="flex gap-2 sm:gap-3">
          <Button 
            onClick={() => onBackendSearch(filters.searchKeyword)}
            disabled={loading}
            variant="outline"
            className="flex-1 sm:flex-initial sm:px-6"
          >
            <span className="sm:hidden">Search</span>
            <span className="hidden sm:inline">Search</span>
          </Button>
          
          <Button 
            onClick={onRefresh}
            disabled={loading || refreshing}
            variant="outline"
            size="icon"
            className="shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 筛选选项 - 响应式布局 */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
        <div className="w-full sm:w-[200px]">
          <Select value={filters.statusFilter} onValueChange={onStatusFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="relative">
            <DatePicker
              date={filters.dateStart}
              onDateChange={(date) => onDateChange(date, "dateStart")}
              placeholder="Start Date"
            />
            {filters.dateStart && (
              <button
                onClick={() => onDateChange(undefined, "dateStart")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                title="Clear start date"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="relative">
            <DatePicker
              date={filters.dateEnd}
              onDateChange={(date) => onDateChange(date, "dateEnd")}
              placeholder="End Date"
            />
            {filters.dateEnd && (
              <button
                onClick={() => onDateChange(undefined, "dateEnd")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                title="Clear end date"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          {(filters.dateStart || filters.dateEnd) && (
            <Button
              variant="outline"
              onClick={() => {
                onDateChange(undefined, "dateStart");
                onDateChange(undefined, "dateEnd");
              }}
              size="sm"
              className="whitespace-nowrap"
              title="Clear date filters"
            >
              Clear Dates
            </Button>
          )}
          <Button
            variant={filters.showCancelledOrders ? "default" : "outline"}
            onClick={() => onToggleCancelled(!filters.showCancelledOrders)}
            size="sm"
            className="w-full sm:w-auto whitespace-nowrap"
          >
            {filters.showCancelledOrders ? 'Hide' : 'Show'} Cancelled
          </Button>
        </div>
      </div>

      {/* 搜索状态提示 - 响应式 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-gray-600">
        <div className="space-y-1">
          {hasSearchResults ? (
            <p className="break-words">
              <span className="font-medium">{filteredCount}</span> of{' '}
              <span className="font-medium">{totalCount}</span> orders{' '}
              {filters.searchKeyword && (
                <span className="block sm:inline">
                  matching "{filters.searchKeyword}" in{' '}
                  <span className="font-medium">
                    {SEARCH_COLUMNS.find(col => col.value === filters.searchColumn)?.label}
                  </span>
                </span>
              )}
            </p>
          ) : (
            <p>
              Showing <span className="font-medium">{filteredCount}</span> orders
            </p>
          )}
          
          {filters.backendSearchTerm && (
            <p className="text-blue-600 break-words">
              ✓ Backend search: "{filters.backendSearchTerm}" in{' '}
              <span className="font-medium">
                {SEARCH_COLUMNS.find(col => col.value === filters.searchColumn)?.label}
              </span>
              {filters.backendSearchTerm !== filters.searchKeyword && (
                <span className="text-gray-500 ml-2 block sm:inline">
                  (different from current input)
                </span>
              )}
            </p>
          )}
          
          {(filters.dateStart || filters.dateEnd) && (
            <p className="text-green-600 break-words">
              ✓ Date filter: {filters.dateStart ? filters.dateStart.toLocaleDateString() : 'Any'} - {filters.dateEnd ? filters.dateEnd.toLocaleDateString() : 'Any'}
            </p>
          )}
        </div>
        
        <div className="text-xs sm:text-right">
          {loading && <span className="text-blue-600">Loading...</span>}
          {refreshing && <span className="text-green-600">Refreshing...</span>}
        </div>
      </div>
    </div>
  );
} 