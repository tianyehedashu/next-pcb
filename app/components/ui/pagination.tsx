import React from "react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ total, page, pageSize, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  // 生成页码数组，最多显示5页，当前页居中
  let pages: number[] = [];
  if (totalPages <= 5) {
    pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  } else {
    if (page <= 3) {
      pages = [1, 2, 3, 4, -1, totalPages];
    } else if (page >= totalPages - 2) {
      pages = [1, -1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    } else {
      pages = [1, -1, page - 1, page, page + 1, -1, totalPages];
    }
  }

  return (
    <div className="flex items-center justify-center gap-2 py-6 select-none">
      <Button
        size="sm"
        variant="outline"
        className="rounded-full px-3"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        Prev
      </Button>
      {pages.map((p, idx) =>
        p === -1 ? (
          <span key={"ellipsis-" + idx} className="px-2 text-slate-400">...</span>
        ) : (
          <Button
            key={p}
            size="sm"
            variant={p === page ? "default" : "outline"}
            className={`rounded-full px-3 ${p === page ? "font-bold shadow" : ""}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </Button>
        )
      )}
      <Button
        size="sm"
        variant="outline"
        className="rounded-full px-3"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </div>
  );
} 