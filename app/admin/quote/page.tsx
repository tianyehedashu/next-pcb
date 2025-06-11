"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderStatus } from '@/types/form';
import { toUSD } from "@/lib/utils";

interface Quote {
  id: string;
  status: OrderStatus;
  created_at: string | null;
  admin_quote_price: number | null;
  email: string;
  phone: string | null;
  user_id: string | null;
}

const statusFilters = [
  { value: "all", label: "全部" },
  { value: OrderStatus.Created, label: "待处理" },
  { value: OrderStatus.Reviewed, label: "已报价" },
  { value: OrderStatus.Rejected, label: "已拒绝" },
  { value: OrderStatus.Paid, label: "已接受" },
];

const statusStyles: Record<OrderStatus, string> = {
  [OrderStatus.Draft]: "bg-gray-100 text-gray-800",
  [OrderStatus.Created]: "bg-yellow-100 text-yellow-800",
  [OrderStatus.Reviewed]: "bg-blue-100 text-blue-800",
  [OrderStatus.Unpaid]: "bg-orange-100 text-orange-800",
  [OrderStatus.PaymentPending]: "bg-purple-100 text-purple-800",
  [OrderStatus.PartiallyPaid]: "bg-yellow-100 text-yellow-800",
  [OrderStatus.PaymentFailed]: "bg-red-100 text-red-800",
  [OrderStatus.PaymentCancelled]: "bg-gray-100 text-gray-800",
  [OrderStatus.Paid]: "bg-green-100 text-green-800",
  [OrderStatus.InProduction]: "bg-indigo-100 text-indigo-800",
  [OrderStatus.QualityCheck]: "bg-pink-100 text-pink-800",
  [OrderStatus.ReadyForShipment]: "bg-teal-100 text-teal-800",
  [OrderStatus.Shipped]: "bg-cyan-100 text-cyan-800",
  [OrderStatus.Delivered]: "bg-emerald-100 text-emerald-800",
  [OrderStatus.Completed]: "bg-green-100 text-green-800",
  [OrderStatus.Cancelled]: "bg-red-100 text-red-800",
  [OrderStatus.OnHold]: "bg-gray-100 text-gray-800",
  [OrderStatus.Rejected]: "bg-red-100 text-red-800",
  [OrderStatus.Refunded]: "bg-gray-100 text-gray-800",
};

export default function QuoteListPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchQuotes = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        status: selectedStatus,
        search: searchQuery,
      });

      const response = await fetch(`/api/admin/quotes?${queryParams}`);
      const data = await response.json();

      setQuotes(data.quotes);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch quotes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [currentPage, selectedStatus, searchQuery]);

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    setCurrentPage(1);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">报价管理</h1>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="搜索报价号、邮箱或电话..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                {statusFilters.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>报价列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">报价号</th>
                    <th className="text-left py-3 px-4">联系方式</th>
                    <th className="text-left py-3 px-4">创建时间</th>
                    <th className="text-left py-3 px-4">状态</th>
                    <th className="text-left py-3 px-4">报价金额</th>
                    <th className="text-left py-3 px-4">用户类型</th>
                    <th className="text-left py-3 px-4">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((quote) => (
                    <tr key={quote.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{quote.id}</td>
                      <td className="py-3 px-4">
                        <div>{quote.email}</div>
                        {quote.phone && <div className="text-sm text-gray-500">{quote.phone}</div>}
                      </td>
                      <td className="py-3 px-4">{quote.created_at ? new Date(quote.created_at).toLocaleString() : '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-sm ${statusStyles[quote.status]}`}>
                          {quote.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">{quote.admin_quote_price ? toUSD(quote.admin_quote_price) : '-'}</td>
                      <td className="py-3 px-4">{quote.user_id ? '已注册用户' : '游客'}</td>
                      <td className="py-3 px-4">
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/admin/quote/${quote.id}`)}
                        >
                          查看详情
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && quotes.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              暂无报价记录
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                上一页
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                下一页
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 