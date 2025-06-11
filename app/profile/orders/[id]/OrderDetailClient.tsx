"use client";
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Pencil, Package, Clock, DollarSign, MapPin, FileText, AlertCircle } from 'lucide-react';
import DownloadButton from '@/app/components/custom-ui/DownloadButton';
import { OrderStatusHistory } from '@/app/components/custom-ui/OrderStatusHistory';
import { quoteSchema, QuoteFormData } from '@/app/quote2/schema/quoteSchema';

// 订单接口定义 - 对应数据库 pcb_quotes 表
interface Order {
  id: string;
  user_id: string | null;
  email: string;
  phone: string | null;
  shipping_address: any; // JSONB
  pcb_spec: any; // JSONB - PCB技术规格
  gerber_file_url: string | null;
  admin_quote_price: number | null;
  admin_notes: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  customs: any; // JSONB - 报关信息
  // 关联的管理员订单信息
  admin_orders?: Array<{
    id: string;
    status: string;
    pcb_price: number | null;
    admin_price: number | null;
    cny_price: number | null;
    currency: string;
    exchange_rate: number;
    due_date: string | null;
    delivery_date: string | null;
    admin_note: string | null;
    [key: string]: any;
  }>;
}

interface OrderDetailClientProps {
  orderId: string;
}

export default function OrderDetailClient({ orderId }: OrderDetailClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [pcbFormData, setPcbFormData] = useState<QuoteFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 编辑功能状态
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isEditingCustoms, setIsEditingCustoms] = useState(false);
  const [editedAddress, setEditedAddress] = useState<any>({});
  const [editedPhone, setEditedPhone] = useState('');
  const [editedCustoms, setEditedCustoms] = useState<any>({});

  // 获取订单详情
  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/orders/${orderId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch order');
      }
      
      const orderData: Order = await response.json();
      setOrder(orderData);

      // 解析PCB规格数据
      if (orderData.pcb_spec) {
        try {
          const result = quoteSchema.safeParse(orderData.pcb_spec);
          if (result.success) {
            setPcbFormData(result.data);
          } else {
            console.warn('PCB spec validation failed:', result.error);
            setPcbFormData(orderData.pcb_spec as QuoteFormData);
          }
        } catch (err) {
          console.warn('Failed to parse PCB spec:', err);
          setPcbFormData(orderData.pcb_spec as QuoteFormData);
        }
      }

      // 初始化编辑状态
      setEditedAddress(orderData.shipping_address || {});
      setEditedPhone(orderData.phone || '');
      setEditedCustoms(orderData.customs || {});
      
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      toast.error(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  // 判断是否可以编辑
  const canEdit = order && ['created', 'pending', 'reviewed'].includes(order.status || '');

  // 判断是否可以取消
  const canCancel = order && ['created', 'pending', 'reviewed', 'quoted'].includes(order.status || '');

  // 更新订单信息
  const updateOrder = async (updates: Partial<Order>) => {
    try {
      const response = await fetch(`/api/user/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update order');
      }

      toast.success('订单信息已更新');
      await fetchOrder(); // 重新获取最新数据
    } catch (err) {
      console.error('Error updating order:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update order');
    }
  };

  // 保存地址修改
  const handleSaveAddress = async () => {
    await updateOrder({ shipping_address: editedAddress });
    setIsEditingAddress(false);
  };

  // 保存电话修改
  const handleSavePhone = async () => {
    await updateOrder({ phone: editedPhone });
    setIsEditingPhone(false);
  };

  // 保存报关信息修改
  const handleSaveCustoms = async () => {
    await updateOrder({ customs: editedCustoms });
    setIsEditingCustoms(false);
  };

  // 取消订单
  const handleCancelOrder = async () => {
    if (!window.confirm('确定要取消这个订单吗？此操作不可撤销。')) {
      return;
    }

    try {
      const response = await fetch(`/api/user/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel order');
      }

      toast.success('订单已取消');
      router.push('/profile/orders');
    } catch (err) {
      console.error('Error cancelling order:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to cancel order');
    }
  };

  // 获取状态显示信息
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; description: string }> = {
      'created': { label: '已创建', color: 'bg-blue-100 text-blue-800', description: '报价申请已创建，等待处理' },
      'pending': { label: '处理中', color: 'bg-yellow-100 text-yellow-800', description: '正在处理报价申请' },
      'reviewed': { label: '已审核', color: 'bg-orange-100 text-orange-800', description: '报价已审核，等待确认' },
      'quoted': { label: '已报价', color: 'bg-green-100 text-green-800', description: '已提供报价，等待确认下单' },
      'confirmed': { label: '已确认', color: 'bg-purple-100 text-purple-800', description: '订单已确认，准备生产' },
      'in_production': { label: '生产中', color: 'bg-indigo-100 text-indigo-800', description: 'PCB正在生产中' },
      'shipped': { label: '已发货', color: 'bg-cyan-100 text-cyan-800', description: '订单已发货' },
      'delivered': { label: '已送达', color: 'bg-green-100 text-green-800', description: '订单已送达' },
      'completed': { label: '已完成', color: 'bg-emerald-100 text-emerald-800', description: '订单已完成' },
      'cancelled': { label: '已取消', color: 'bg-red-100 text-red-800', description: '订单已取消' },
    };
    
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800', description: '' };
  };

  // PCB参数显示映射
  const getPcbFieldDisplay = (key: string, value: any): string => {
    if (!value) return '-';
    
    const displayMap: Record<string, (val: any) => string> = {
      pcbType: (v) => v === 'FR-4' ? 'FR-4 Standard' : String(v),
      layers: (v) => `${v} Layers`,
      thickness: (v) => `${v}mm`,
      singleDimensions: (v) => v?.length && v?.width ? `${v.length} × ${v.width} cm` : '-',
      singleCount: (v) => `${v} pcs`,
      delivery: (v) => v === 'standard' ? 'Standard' : 'Urgent',
      surfaceFinish: (v) => {
        const map: Record<string, string> = {
          'HASL': 'HASL Lead Free',
          'ENIG': 'ENIG',
          'OSP': 'OSP',
          'Immersion Silver': 'Immersion Silver',
          'Immersion Tin': 'Immersion Tin'
        };
        return map[v] || String(v);
      },
      solderMask: (v) => {
        const map: Record<string, string> = {
          'Green': 'Green',
          'Blue': 'Blue', 
          'Red': 'Red',
          'Black': 'Black',
          'White': 'White'
        };
        return map[v] || String(v);
      },
      silkscreen: (v) => {
        const map: Record<string, string> = {
          'White': 'White',
          'Black': 'Black'
        };
        return map[v] || String(v);
      }
    };

    return displayMap[key] ? displayMap[key](value) : String(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载订单详情中...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">无法加载订单</h2>
          <p className="text-gray-600 mb-4">{error || '订单不存在'}</p>
          <Button onClick={() => router.push('/profile/orders')} variant="outline">
            返回订单列表
          </Button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status || '');
  const adminOrder = order.admin_orders?.[0]; // 获取管理员订单信息

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 页面标题和操作 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">订单详情</h1>
              <Badge className={statusInfo.color}>
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-gray-600">订单编号: {order.id}</p>
            <p className="text-sm text-gray-500">
              创建时间: {order.created_at ? new Date(order.created_at).toLocaleString('zh-CN') : '-'}
            </p>
          </div>
          
          <div className="flex gap-3 mt-4 sm:mt-0">
            <Button onClick={() => router.push('/profile/orders')} variant="outline">
              返回列表
            </Button>
            {canCancel && (
              <Button onClick={handleCancelOrder} variant="destructive">
                取消订单
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧主要内容 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 订单状态卡片 */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-3">
                <Package className="h-5 w-5 text-blue-600" />
                <CardTitle>订单状态</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <Badge className={`${statusInfo.color} text-sm px-3 py-1`}>
                    {statusInfo.label}
                  </Badge>
                  <span className="text-gray-600">{statusInfo.description}</span>
                </div>
                
                {/* 管理员订单状态 */}
                {adminOrder && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">管理员处理状态</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">处理状态: </span>
                        <span className="font-medium">{adminOrder.status || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">预计交付: </span>
                        <span className="font-medium">
                          {adminOrder.delivery_date ? new Date(adminOrder.delivery_date).toLocaleDateString('zh-CN') : '-'}
                        </span>
                      </div>
                    </div>
                    {adminOrder.admin_note && (
                      <div className="mt-3">
                        <span className="text-gray-500 text-sm">管理员备注: </span>
                        <div className="mt-1">
                          <div className="text-sm bg-blue-50 p-2 rounded border-l-2 border-blue-200 whitespace-pre-wrap">
                            {adminOrder.admin_note}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 价格信息卡片 */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-3">
                <DollarSign className="h-5 w-5 text-green-600" />
                <CardTitle>价格信息</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">管理员报价</div>
                    <div className="text-xl font-bold text-green-600">
                      ${order.admin_quote_price?.toFixed(2) || '待报价'}
                    </div>
                  </div>
                  
                  {adminOrder && (
                    <>
                      <div>
                        <div className="text-sm text-gray-500">PCB价格</div>
                        <div className="text-lg font-semibold">
                          {adminOrder.currency === 'CNY' ? '¥' : '$'}{adminOrder.pcb_price?.toFixed(2) || '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">总价</div>
                        <div className="text-lg font-semibold">
                          {adminOrder.currency === 'CNY' ? '¥' : '$'}{adminOrder.cny_price?.toFixed(2) || adminOrder.admin_price?.toFixed(2) || '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">汇率</div>
                        <div className="text-sm">
                          1 USD = {adminOrder.exchange_rate || 7.2} CNY
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 联系信息卡片 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <CardTitle>联系信息</CardTitle>
                </div>
                {canEdit && (
                  <Dialog open={isEditingPhone} onOpenChange={setIsEditingPhone}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>编辑联系信息</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="phone">联系电话</Label>
                          <Input
                            id="phone"
                            value={editedPhone}
                            onChange={(e) => setEditedPhone(e.target.value)}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsEditingPhone(false)}>
                            取消
                          </Button>
                          <Button onClick={handleSavePhone}>
                            保存
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-500">邮箱: </span>
                    <span className="font-medium">{order.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">电话: </span>
                    <span className="font-medium">{order.phone || '未填写'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 收货地址卡片 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-purple-600" />
                  <CardTitle>收货地址</CardTitle>
                </div>
                {canEdit && (
                  <Dialog open={isEditingAddress} onOpenChange={setIsEditingAddress}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>编辑收货地址</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="contactName">联系人</Label>
                          <Input
                            id="contactName"
                            value={editedAddress.contactName || ''}
                            onChange={(e) => setEditedAddress({...editedAddress, contactName: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">联系电话</Label>
                          <Input
                            id="phone"
                            value={editedAddress.phone || ''}
                            onChange={(e) => setEditedAddress({...editedAddress, phone: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="address">详细地址</Label>
                          <Textarea
                            id="address"
                            value={editedAddress.address || ''}
                            onChange={(e) => setEditedAddress({...editedAddress, address: e.target.value})}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="city">城市</Label>
                            <Input
                              id="city"
                              value={editedAddress.city || ''}
                              onChange={(e) => setEditedAddress({...editedAddress, city: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="zipCode">邮编</Label>
                            <Input
                              id="zipCode"
                              value={editedAddress.zipCode || ''}
                              onChange={(e) => setEditedAddress({...editedAddress, zipCode: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsEditingAddress(false)}>
                            取消
                          </Button>
                          <Button onClick={handleSaveAddress}>
                            保存
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
                {order.shipping_address ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{order.shipping_address.contactName || '-'}</span>
                      {order.shipping_address.phone && (
                        <span className="text-gray-600">({order.shipping_address.phone})</span>
                      )}
                    </div>
                    <div className="text-gray-700">
                      {[
                        order.shipping_address.address,
                        order.shipping_address.city,
                        order.shipping_address.state,
                        order.shipping_address.country,
                        order.shipping_address.zipCode
                      ].filter(Boolean).join(', ')}
                    </div>
                    {order.shipping_address.courier && (
                      <div className="text-sm text-gray-500">
                        快递方式: {order.shipping_address.courier}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">暂无收货地址信息</p>
                )}
              </CardContent>
            </Card>

            {/* PCB规格卡片 */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-3">
                <FileText className="h-5 w-5 text-orange-600" />
                <CardTitle>PCB技术规格</CardTitle>
              </CardHeader>
              <CardContent>
                {pcbFormData ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">板材类型: </span>
                      <span className="font-medium">{getPcbFieldDisplay('pcbType', pcbFormData.pcbType)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">层数: </span>
                      <span className="font-medium">{getPcbFieldDisplay('layers', pcbFormData.layers)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">板厚: </span>
                      <span className="font-medium">{getPcbFieldDisplay('thickness', pcbFormData.thickness)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">尺寸: </span>
                      <span className="font-medium">{getPcbFieldDisplay('singleDimensions', pcbFormData.singleDimensions)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">数量: </span>
                      <span className="font-medium">{getPcbFieldDisplay('singleCount', pcbFormData.singleCount)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">交期: </span>
                      <span className="font-medium">{getPcbFieldDisplay('delivery', pcbFormData.delivery)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">表面处理: </span>
                      <span className="font-medium">{getPcbFieldDisplay('surfaceFinish', pcbFormData.surfaceFinish)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">阻焊颜色: </span>
                      <span className="font-medium">{getPcbFieldDisplay('solderMask', pcbFormData.solderMask)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">丝印颜色: </span>
                      <span className="font-medium">{getPcbFieldDisplay('silkscreen', pcbFormData.silkscreen)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">铜厚: </span>
                      <span className="font-medium">{pcbFormData.outerCopperWeight} oz</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">PCB规格信息解析失败</p>
                )}
              </CardContent>
            </Card>

            {/* 报关信息卡片 */}
            {order.customs && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    <CardTitle>报关信息</CardTitle>
                  </div>
                  {canEdit && (
                    <Dialog open={isEditingCustoms} onOpenChange={setIsEditingCustoms}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>编辑报关信息</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="value">申报价值</Label>
                            <Input
                              id="value"
                              value={editedCustoms.value || ''}
                              onChange={(e) => setEditedCustoms({...editedCustoms, value: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="description">产品描述</Label>
                            <Textarea
                              id="description"
                              value={editedCustoms.description || ''}
                              onChange={(e) => setEditedCustoms({...editedCustoms, description: e.target.value})}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsEditingCustoms(false)}>
                              取消
                            </Button>
                            <Button onClick={handleSaveCustoms}>
                              保存
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-500">申报价值: </span>
                      <span className="font-medium">{order.customs.value || '-'} {order.customs.currency || 'USD'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">产品描述: </span>
                      <span className="font-medium">{order.customs.description || '-'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 备注信息卡片 */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-3">
                <FileText className="h-5 w-5 text-gray-600" />
                <CardTitle>备注信息</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.admin_notes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">管理员备注</h4>
                      <p className="text-gray-600 text-sm bg-blue-50 p-2 rounded">
                        {order.admin_notes}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧侧边栏 */}
          <div className="space-y-6">
            {/* 文件下载卡片 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  文件下载
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.gerber_file_url ? (
                  <DownloadButton 
                    filePath={order.gerber_file_url} 
                    bucket="gerber"
                    className="w-full"
                  >
                    下载 Gerber 文件
                  </DownloadButton>
                ) : (
                  <p className="text-gray-500 text-sm">暂无文件</p>
                )}
              </CardContent>
            </Card>

            {/* 时间信息卡片 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  时间信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">创建时间</div>
                  <div className="text-sm font-medium">
                    {order.created_at ? new Date(order.created_at).toLocaleString('zh-CN') : '-'}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500">更新时间</div>
                  <div className="text-sm font-medium">
                    {order.updated_at ? new Date(order.updated_at).toLocaleString('zh-CN') : '-'}
                  </div>
                </div>
                
                {adminOrder?.due_date && (
                  <div>
                    <div className="text-sm text-gray-500">预期完成</div>
                    <div className="text-sm font-medium">
                      {new Date(adminOrder.due_date).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                )}
                
                {adminOrder?.delivery_date && (
                  <div>
                    <div className="text-sm text-gray-500">预计交付</div>
                    <div className="text-sm font-medium">
                      {new Date(adminOrder.delivery_date).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 订单历史 */}
            <OrderStatusHistory orderId={order.id} />
          </div>
        </div>
      </div>
    </div>
  );
} 