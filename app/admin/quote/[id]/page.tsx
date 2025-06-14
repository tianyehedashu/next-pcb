"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DownloadButton from "@/app/components/custom-ui/DownloadButton";
import { toUSD } from "@/lib/utils";
import { PcbQuoteForm } from "@/types/pcbQuoteForm";
import { OrderStatus } from '@/types/form';

interface Quote {
  id: string;
  status: OrderStatus;
  created_at: string;
  admin_quote_price: number;
  email: string;
  phone: string | null;
  user_id: string | null;
  pcb_spec: PcbQuoteForm;
  gerber_file_url: string | null;
  admin_notes: string | null;
}

// 字段分组与友好名映射
const FIELD_GROUPS: { title: string; fields: { key: keyof PcbQuoteForm; label: string }[] }[] = [
  {
    title: "Base Info",
    fields: [
      { key: "pcbType", label: "Type" },
      { key: "layers", label: "Layers" },
      { key: "thickness", label: "Thickness" },
      { key: "hdi", label: "HDI" },
      { key: "tg", label: "TG" },
      { key: "panelSet", label: "Panel Count" },
      { key: "singleDimensions", label: "Single Size (cm)" },
      { key: "singleCount", label: "Single Count" },
      { key: "shipmentType", label: "Shipment" },
      { key: "border", label: "Border" },
      { key: "gerber", label: "Gerber" }
    ],
  },
  {
    title: "Process",
    fields: [
      { key: "outerCopperWeight", label: "Outer Copper" },
      { key: "innerCopperWeight", label: "Inner Copper" },
      { key: "surfaceFinish", label: "Surface" },
      { key: "minTrace", label: "Min Trace" },
      { key: "minHole", label: "Min Hole" },
      { key: "solderMask", label: "Solder Mask" },
      { key: "silkscreen", label: "Silkscreen" },
      { key: "goldFingers", label: "Gold Fingers" },
      { key: "castellated", label: "Castellated" },
      { key: "impedance", label: "Impedance" },
      { key: "edgePlating", label: "Edge Plating" },
      { key: "halfHole", label: "Half Hole" },
      { key: "edgeCover", label: "Edge Cover" },
      { key: "maskCover", label: "Mask Cover" },
      { key: "testMethod", label: "Test Method" },
    ],
  },
  {
    title: "Service",
    fields: [
      { key: "testMethod", label: "Test Method" },
      { key: "prodCap", label: "Production Cap." },
      { key: "productReport", label: "Product Report" },
      { key: "yyPin", label: "YY Pin" },
      { key: "customerCode", label: "Customer Code" },
      { key: "payMethod", label: "Pay Method" },
      { key: "qualityAttach", label: "Quality Attach" },
      { key: "smt", label: "SMT" },
    ],
  },
];

interface QuoteDetailProps {
  params: Promise<{
    id: string;
  }>;
}

export default function QuoteDetailPage({ params }: QuoteDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuote, setEditedQuote] = useState<Partial<Quote>>({});
  
  // 解包 params Promise
  const resolvedParams = use(params);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const response = await fetch(`/api/admin/quotes/${resolvedParams.id}`);
        const data = await response.json();
        setQuote(data);
        setEditedQuote(data);
      } catch (error) {
        console.error('Failed to fetch quote:', error);
        toast({
          title: "Error",
          description: "Failed to fetch quote details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuote();
  }, [resolvedParams.id, toast]);

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/admin/quotes/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedQuote),
      });

      if (!response.ok) {
        throw new Error('Failed to update quote');
      }

      const updatedQuote = await response.json();
      setQuote(updatedQuote);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Quote updated successfully",
      });
    } catch (error) {
      console.error('Failed to update quote:', error);
      toast({
        title: "Error",
        description: "Failed to update quote",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!quote) {
    return <div>Quote not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">报价详情</h1>
        <div className="flex gap-4">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditedQuote(quote);
                }}
              >
                取消
              </Button>
              <Button onClick={handleSave}>
                保存
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => router.back()}
              >
                返回列表
              </Button>
              <Button onClick={() => setIsEditing(true)}>
                编辑
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* 基本信息卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">报价号</p>
                <p className="font-medium">{quote.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">创建时间</p>
                <p className="font-medium">{new Date(quote.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">状态</p>
                {isEditing ? (
                  <Select
                    value={editedQuote.status}
                    onValueChange={(value) => setEditedQuote({ ...editedQuote, status: value as OrderStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择状态" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(OrderStatus).map(([key, value]) => (
                        <SelectItem key={key} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="font-medium">{quote.status}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">类型</p>
                <p className="font-medium">{quote.user_id ? '已注册用户' : '游客'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">联系方式</p>
                <p className="font-medium">{quote.email}</p>
                {quote.phone && <p className="text-sm text-gray-500">{quote.phone}</p>}
              </div>
              <div>
                <p className="text-sm text-gray-500">报价金额</p>
                {isEditing ? (
                  <Input
                    type="number"
                    value={editedQuote.admin_quote_price}
                    onChange={(e) => setEditedQuote({ ...editedQuote, admin_quote_price: parseFloat(e.target.value) })}
                  />
                ) : (
                  <p className="font-medium">{toUSD(quote.admin_quote_price)}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PCB规格卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>PCB规格</CardTitle>
          </CardHeader>
          <CardContent>
            {FIELD_GROUPS.map((group) => (
              <div key={group.title} className="mb-6">
                <h3 className="text-lg font-medium mb-4">{group.title}</h3>
                <div className="grid grid-cols-2 gap-4">
                  {group.fields.map((field) => (
                    <div key={field.key}>
                      <p className="text-sm text-gray-500">{field.label}</p>
                      <p className="font-medium">
                        {quote.pcb_spec[field.key]?.toString() || '-'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Gerber文件卡片 */}
        {quote.gerber_file_url && (
          <Card>
            <CardHeader>
              <CardTitle>Gerber文件</CardTitle>
            </CardHeader>
            <CardContent>
              <DownloadButton filePath={quote.gerber_file_url}>
                下载 Gerber 文件
              </DownloadButton>
            </CardContent>
          </Card>
        )}

        {/* 管理员备注卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>管理员备注</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={editedQuote.admin_notes || ''}
                onChange={(e) => setEditedQuote({ ...editedQuote, admin_notes: e.target.value })}
                placeholder="输入管理员备注..."
                className="min-h-[100px]"
              />
            ) : (
              <p className="whitespace-pre-wrap">{quote.admin_notes || '无备注'}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 