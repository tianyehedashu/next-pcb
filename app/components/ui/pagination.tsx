"use client";

import React from 'react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  
  // 计算当前页的显示范围
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);
  
  // 生成页码按钮
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5; // 最多显示5个页码
    
    if (totalPages <= maxVisible) {
      // 如果总页数少于等于5，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 如果总页数大于5，显示当前页周围的页码
      const start = Math.max(1, page - 2);
      const end = Math.min(totalPages, start + maxVisible - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };
  
  const pageNumbers = getPageNumbers();

  if (total === 0) {
    return null; // 如果没有数据，不显示分页
  }

  return (
    <div className="flex flex-col items-center space-y-4 py-6">
      {/* 当前页条数显示 */}
      <div className="text-sm text-gray-600 font-medium">
        Showing {startItem}-{endItem} of {total} items
      </div>
      
      {/* 分页控件 */}
      <div className="flex items-center justify-center flex-wrap gap-2">
        {/* 前一页按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 flex items-center gap-1"
        >
          <span>←</span>
          <span className="hidden sm:inline">Previous</span>
        </Button>
        
        {/* 页码按钮 */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((pageNum) => (
            <Button
              key={pageNum}
              variant={pageNum === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNum)}
              className="min-w-[40px] h-8"
            >
              {pageNum}
            </Button>
          ))}
        </div>
        
        {/* 后一页按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 flex items-center gap-1"
        >
          <span className="hidden sm:inline">Next</span>
          <span>→</span>
        </Button>
      </div>
      
      {/* 页面信息 */}
      <div className="text-xs text-gray-500 text-center">
        Page {page} of {totalPages}
      </div>
    </div>
  );
} 