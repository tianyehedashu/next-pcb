/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useParams } from 'next/navigation';
import { quoteSchema, QuoteFormData } from '@/app/quote2/schema/quoteSchema';
import { calcProductionCycle } from '@/lib/productCycleCalc-v3';
import { calcPcbPriceV3 } from '@/lib/pcb-calc-v3';
import { Order, AdminOrder } from '@/app/admin/types/order';
import { Textarea } from "@/components/ui/textarea";
import { CreditCard, Loader2, Info, CheckCircle, Calculator, Truck, Calendar, DollarSign, FileText, User, Package, Settings, Clock, AlertCircle, Send } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// 导入拆分的组件
import { PageHeader } from './components/PageHeader';
import { OrderOverview } from './components/OrderOverview';
import { PCBSpecReview } from './components/PCBSpecReview';
import { CalculationResultPanels } from './components/CalculationResultPanels';
import { ReviewStatusPanel } from './components/ReviewStatusPanel';
import { PriceManagementPanel } from './components/PriceManagementPanel';
import { ManagementActionsPanel } from './components/ManagementActionsPanel';

function getAdminOrders(admin_orders: unknown): AdminOrder[] {
  if (!admin_orders) return [];
  if (Array.isArray(admin_orders)) return admin_orders as AdminOrder[];
  return [admin_orders as AdminOrder];
}

// 状态颜色映射
const getStatusColor = (status: string) => {
  const statusColors: Record<string, string> = {
    'created': 'bg-blue-100 text-blue-800',
    'reviewed': 'bg-yellow-100 text-yellow-800',
    'paid': 'bg-green-100 text-green-800',
    'in_production': 'bg-purple-100 text-purple-800',
    'shipped': 'bg-indigo-100 text-indigo-800',
    'completed': 'bg-emerald-100 text-emerald-800',
    'cancelled': 'bg-red-100 text-red-800',
    'pending': 'bg-orange-100 text-orange-800',
  };
  return statusColors[status] || 'bg-gray-100 text-gray-800';
};

// 价格格式化
const formatPrice = (price: number | string | null | undefined, currency = 'CNY') => {
  if (!price) return '¥0.00';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '¥0.00';
  
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '¥';
  return `${symbol}${num.toFixed(2)}`;
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [pcbFormData, setPcbFormData] = useState<QuoteFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminOrderEdits, setAdminOrderEdits] = useState<Record<string, unknown>[]>([]);
  const [calculationNotes, setCalculationNotes] = useState<string[]>([]);
  const [deliveryNotes, setDeliveryNotes] = useState<string[]>([]);
  const [shippingNotes, setShippingNotes] = useState<{
    basicInfo: string;
    weightInfo: string;
    costBreakdown: string[];
  }>({
    basicInfo: '',
    weightInfo: '',
    costBreakdown: []
  });
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [editedFields, setEditedFields] = useState<Partial<AdminOrder>>({});
  
  const [isReviewingRefund, setIsReviewingRefund] = useState(false);
  const [refundReviewAmount, setRefundReviewAmount] = useState<string>("");
  const [refundReviewReason, setRefundReviewReason] = useState("");
  
  const [isProcessingStripeRefund, setIsProcessingStripeRefund] = useState(false);
  
  // 定义默认值
  const adminOrderDefaultValues = {
    status: 'created',
    payment_status: 'unpaid',
    pcb_price: '',
    admin_price: '',
    cny_price: '',
    due_date: '',
    pay_time: '',
    production_days: '',
    delivery_date: '',
    currency: 'USD',
    exchange_rate: 7.2,
    ship_price: '',
    custom_duty: '',
    coupon: 0,
    admin_note: '',
    surcharges: [],
  };

  // 获取订单数据
  const fetchOrder = useCallback(async (): Promise<Order | undefined> => {
    if (!orderId) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/orders?detailId=${orderId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch order');
      }
      const data: Order = await response.json();
      setOrder(data);
      if (data.pcb_spec && typeof data.pcb_spec === 'object') {
        const specForForm = {
          ...data.pcb_spec,
          shippingAddress: data.shipping_address || (data.pcb_spec as any).shippingAddress,
        };

        let result = quoteSchema.safeParse(specForForm);

        if (!result.success) {
          console.error("解析合并的 pcb_spec 失败，正在回退:", result.error);
          result = quoteSchema.safeParse(data.pcb_spec);
        }
        
        if (result.success) {
          setPcbFormData(result.data);
        } else {
          setPcbFormData(null);
          console.error("解析 pcb_spec 失败:", result.error);
        }
      } else {
        setPcbFormData(null);
      }
      return data;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      toast.error(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  useEffect(() => {
    if (order?.admin_orders) {
      const adminOrders = getAdminOrders(order.admin_orders);
      setAdminOrderEdits(
        adminOrders.map(admin => ({
          ...admin,
          due_date: admin.due_date ? String(admin.due_date).split('T')[0] : '',
          delivery_date: admin.delivery_date ? String(admin.delivery_date).split('T')[0] : '',
          surcharges: Array.isArray(admin.surcharges) ? admin.surcharges : [],
          admin_note: admin.admin_note ? String(admin.admin_note) : '',
        }))
      );
    } else {
      setAdminOrderEdits([adminOrderDefaultValues]);
    }
  }, [order?.admin_orders]);

  // 自动计算价格、交期和运费
  useEffect(() => {
    if (pcbFormData) {
      // 自动计算价格
      try {
        const result = calcPcbPriceV3(pcbFormData);
        const pcb_price = Number(result.total).toFixed(2);
        
        setAdminOrderEdits(prev => [
          {
            ...prev[0],
            pcb_price,
          },
        ]);
        
        setCalculationNotes(result.notes || []);
        
      } catch (error) {
        console.error('自动计算PCB价格失败:', error);
        setCalculationNotes(['PCB价格计算失败，请检查规格参数']);
      }

      // 自动计算交期
      try {
        const cycle = calcProductionCycle(pcbFormData, new Date(), pcbFormData?.delivery);
        const newProductionDays = String(cycle.cycleDays);
        
        setDeliveryNotes(cycle.reason || []);
        
        const today = new Date();
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + cycle.cycleDays);
        const deliveryDate = targetDate.toISOString().split('T')[0];
        
        setAdminOrderEdits(prev => [
          {
            ...prev[0],
            production_days: newProductionDays,
            delivery_date: deliveryDate,
          },
        ]);
        
      } catch (error) {
        console.error('自动计算交期失败:', error);
        setDeliveryNotes(['交期计算失败，请检查规格参数']);
      }

      // 自动计算运费明细
      try {
        const singleWeight = pcbFormData.singleDimensions ? 
          ((pcbFormData.singleDimensions.length * pcbFormData.singleDimensions.width * Number(pcbFormData.thickness || 1.6) * 1.8) / 1000000) : 0;
        const totalWeight = singleWeight * (pcbFormData.singleCount || pcbFormData.panelSet || 1);
        const packageWeight = 0.2; // 包装重量
        const finalWeight = totalWeight + packageWeight;
        
        const basicShipping = 10.00;
        const weightSurcharge = finalWeight > 0.5 ? 5.00 : 0.00;
        const packageFee = 0.00;
        const totalShipping = basicShipping + weightSurcharge + packageFee;
        
        setShippingNotes({
          basicInfo: `总重量: ${finalWeight.toFixed(3)} kg，预估运费: ¥${totalShipping.toFixed(2)}`,
          weightInfo: `单片重量: ${singleWeight.toFixed(3)} kg，数量: ${pcbFormData.singleCount || pcbFormData.panelSet || 1}`,
          costBreakdown: [
            `基础运费: ¥${basicShipping.toFixed(2)} (500g以内)`,
            `重量附加费: ¥${weightSurcharge.toFixed(2)} ${finalWeight > 0.5 ? '(超重)' : '(标准)'}`,
            `包装费: ¥${packageFee.toFixed(2)} (标准包装)`,
            `快递公司: 联邦快递 (FedEx)`,
            `预计时效: 3-5个工作日`
          ]
        });
        
        // 更新运费到管理订单
        setAdminOrderEdits(prev => [
          {
            ...prev[0],
            ship_price: totalShipping.toFixed(2),
          },
        ]);
        
      } catch (error) {
        console.error('自动计算运费失败:', error);
        setShippingNotes({
          basicInfo: '运费计算失败',
          weightInfo: '无法计算重量信息',
          costBreakdown: ['运费计算失败，请检查规格参数']
        });
      }
    }
  }, [pcbFormData]);

  // 计算是否已创建管理员订单
  const isAdminOrderCreated = !!order?.admin_orders;
  const adminOrder = order ? getAdminOrders(order.admin_orders)[0] : null;

  // 保存功能
  const handleSave = async (values: Record<string, unknown>, options?: { sendNotification?: boolean; notificationType?: string }) => {
    if (!orderId) return;
    try {
      const cleanedValues = JSON.parse(JSON.stringify(values));
      
      if (cleanedValues.surcharges) {
        if (typeof cleanedValues.surcharges === 'string') {
          try {
            cleanedValues.surcharges = JSON.parse(cleanedValues.surcharges);
          } catch {
            cleanedValues.surcharges = [];
          }
        } else if (!Array.isArray(cleanedValues.surcharges)) {
          cleanedValues.surcharges = [];
        }
      } else {
        cleanedValues.surcharges = [];
      }

      if (cleanedValues.admin_note !== undefined && cleanedValues.admin_note !== null) {
        cleanedValues.admin_note = String(cleanedValues.admin_note);
      } else {
        cleanedValues.admin_note = '';
      }

      if (options?.sendNotification) {
        cleanedValues.sendNotification = true;
        cleanedValues.notificationType = options.notificationType || 'order_updated';
        cleanedValues.userEmail = order?.email;
        
        if (!order?.email) {
          toast.warning('⚠️ 用户邮箱不存在，将跳过邮件通知', {
            description: '订单将正常保存，但不会发送邮件通知给客户',
            duration: 4000
          });
        }
      }
      
      const method = isAdminOrderCreated ? 'PATCH' : 'POST';
      const response = await fetch(`/api/admin/orders/${orderId}/admin-order`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedValues),
      });
      
      if (!response.ok) {
        let errorMessage = isAdminOrderCreated ? '保存失败' : '创建失败';
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage += `：${errorData.error}`;
          }
        } catch {
          errorMessage += `：HTTP ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      const successMessage = isAdminOrderCreated ? '✅ 管理员订单保存成功' : '✅ 管理员订单创建成功';
      const emailMessage = options?.sendNotification ? ' 并已发送邮件通知' : '';
      toast.success(successMessage + emailMessage, {
        description: isAdminOrderCreated ? '订单信息已更新' : '管理员订单已创建',
        duration: 3000
      });
      
      const updatedOrder = await fetchOrder();
      
      if (updatedOrder?.admin_orders) {
        const adminOrders = getAdminOrders(updatedOrder.admin_orders);
        setAdminOrderEdits(adminOrders.map(admin => ({ 
          ...admin,
          due_date: admin.due_date ? String(admin.due_date).split('T')[0] : '',
          delivery_date: admin.delivery_date ? String(admin.delivery_date).split('T')[0] : '',
          surcharges: Array.isArray(admin.surcharges) ? admin.surcharges : [],
          admin_note: admin.admin_note ? String(admin.admin_note) : '',
        })));
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : (isAdminOrderCreated ? '保存失败，请重试' : '创建失败，请重试');
      toast.error(errorMessage, {
        duration: 5000,
        action: {
          label: '关闭',
          onClick: () => {}
        }
      });
    }
  };

  // 价格计算更新函数
  const updatePriceCalculation = (values: Record<string, unknown>) => {
    const pcb_price = Number(values.pcb_price) || 0;
    const ship_price = Number(values.ship_price) || 0;
    const custom_duty = Number(values.custom_duty) || 0;
    const coupon = Number(values.coupon) || 0;
    
    // 处理附加费用
    let surcharges: Array<{name: string, amount: number}> = [];
    if (Array.isArray(values.surcharges)) {
      surcharges = values.surcharges;
    } else if (typeof values.surcharges === 'string') {
      try {
        surcharges = JSON.parse(values.surcharges);
      } catch {
        surcharges = [];
      }
    }
    const surchargeTotal = surcharges.reduce((sum: number, s: {name: string, amount: number}) => sum + Number(s.amount || 0), 0);
    
    // 计算人民币总价
    const cny_price = (pcb_price + ship_price + custom_duty + surchargeTotal - coupon).toFixed(2);
    
    // 汇率换算
    const currency = values.currency as string || 'USD';
    const exchange_rate = Number(values.exchange_rate) || 7.2;
    const admin_price = currency === 'CNY' ? cny_price : (Number(cny_price) / exchange_rate).toFixed(2);
    
    setAdminOrderEdits(prev => [
      {
        ...prev[0],
        ...values,
        cny_price,
        admin_price,
      },
    ]);
  };

  // 计算功能
  const handleCalcPCB = () => {
    if (!pcbFormData) {
      toast.error('❌ PCB规格数据不完整，无法计算价格');
      return;
    }
    
    try {
      const result = calcPcbPriceV3(pcbFormData);
      const pcb_price = Number(result.total).toFixed(2);
      
      const values = { ...adminOrderEdits[0], pcb_price };
      updatePriceCalculation(values);
      
      setCalculationNotes(result.notes || []);
      
      toast.success(`🔧 PCB价格重新计算完成：¥${pcb_price}`);
      
    } catch (error) {
      console.error('PCB价格计算失败:', error);
      toast.error('PCB价格计算失败，请检查PCB规格参数');
    }
  };

  const handleCalcDelivery = () => {
    if (!pcbFormData) return;
    
    try {
      const cycle = calcProductionCycle(pcbFormData, new Date(), pcbFormData?.delivery);
      const newProductionDays = String(cycle.cycleDays);
      
      setDeliveryNotes(cycle.reason || []);
      
      const today = new Date();
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + cycle.cycleDays);
      const deliveryDate = targetDate.toISOString().split('T')[0];
      
      setAdminOrderEdits(prev => [
        {
          ...prev[0],
          production_days: newProductionDays,
          delivery_date: deliveryDate,
        },
      ]);
      
      toast.success(`📅 交期重新计算完成：${newProductionDays}天`);
      
    } catch (error) {
      console.error('计算交期失败:', error);
      toast.error('计算交期失败，请检查PCB规格参数');
    }
  };

  // 重新计算所有
  const handleRecalc = () => {
    if (!pcbFormData) return;
    
    try {
      // 先计算PCB价格
      const result = calcPcbPriceV3(pcbFormData);
      const pcb_price = Number(result.total).toFixed(2);
      
      // 计算交期
      const cycle = calcProductionCycle(pcbFormData, new Date(), pcbFormData?.delivery);
      const production_days = String(cycle.cycleDays);
      
      const today = new Date();
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + cycle.cycleDays);
      const delivery_date = targetDate.toISOString().split('T')[0];
      
      // 估算运费
      const totalArea = Number(pcbFormData.singleDimensions?.length || 0) * Number(pcbFormData.singleDimensions?.width || 0) * Number(pcbFormData.singleCount || 1) / 10000;
      const isUrgent = pcbFormData.delivery === 'urgent';
      
      let estimatedShippingCost = 0;
      if (totalArea <= 0.1) {
        estimatedShippingCost = isUrgent ? 150 : 80;
      } else if (totalArea <= 0.5) {
        estimatedShippingCost = isUrgent ? 250 : 120;
      } else {
        estimatedShippingCost = isUrgent ? 350 : 180;
      }
      
      // 更新所有计算结果
      const values = {
        ...adminOrderEdits[0],
        pcb_price,
        production_days,
        delivery_date,
        ship_price: estimatedShippingCost,
      };
      
      updatePriceCalculation(values);
      setCalculationNotes(result.notes || []);
      setDeliveryNotes(cycle.reason || []);
      
      toast.success('🔄 重新计算完成', {
        description: '所有价格、交期、运费明细已更新',
        duration: 3000
      });
      
    } catch (error) {
      console.error('重新计算失败:', error);
      toast.error('重新计算失败，请检查PCB规格参数');
    }
  };

  const handleRefundReview = async (action: 'approve' | 'reject') => {
    setIsReviewingRefund(true);
    try {
      if (action === 'approve' && (isNaN(parseFloat(refundReviewAmount)) || parseFloat(refundReviewAmount) < 0)) {
        throw new Error("Please enter a valid, non-negative refund amount.");
      }
      if (!refundReviewReason) {
        throw new Error("Please provide a reason for the decision.");
      }

      const response = await fetch(`/api/admin/orders/${orderId}/review-refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          amount: parseFloat(refundReviewAmount || "0"),
          reason: refundReviewReason,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to review refund.');
      
      toast.success(`The refund has been successfully ${action}d.`);
      fetchOrder();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsReviewingRefund(false);
    }
  };

  const handleProcessStripeRefund = async () => {
    setIsProcessingStripeRefund(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/process-refund`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to process Stripe refund.');

      toast.success('Stripe refund processed successfully!');
      fetchOrder();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsProcessingStripeRefund(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载订单信息中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p className="text-lg font-semibold">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-600">
          <Package className="w-12 h-12 mx-auto mb-4" />
          <p className="text-lg font-semibold">订单未找到</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* 页面标题 */}
      <PageHeader order={order} adminOrder={adminOrder} />

      {/* 主要内容区域 - 紧凑布局 */}
      <div className="grid grid-cols-12 gap-3">
        {/* 左侧：订单详情 */}
        <div className="col-span-9 space-y-3">
          {/* 订单概览 */}
          <OrderOverview order={order} pcbFormData={pcbFormData} adminOrder={adminOrder} />

                         {/* PCB技术规格审核 + 计算结果 */}
          <div className="grid grid-cols-12 gap-3">
            {/* 左侧：PCB技术规格审核 */}
            <div className="col-span-8">
              <PCBSpecReview pcbFormData={pcbFormData} />
                <div className="p-0">
                 {pcbFormData ? (
                   <div className="border-t">
                     {/* 基本参数表格 */}
                     <div className="bg-blue-50 px-4 py-2 border-b">
                       <h4 className="text-sm font-semibold text-blue-800">基本参数</h4>
                     </div>
                     <div className="grid grid-cols-6 text-xs">
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">板材类型</div>
                       <div className="border-r border-b p-2 text-center font-semibold">{pcbFormData.pcbType || 'FR-4'}</div>
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">板子层数</div>
                       <div className="border-r border-b p-2 text-center font-semibold">{pcbFormData.layers || '-'}</div>
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">板厚</div>
                       <div className="border-b p-2 text-center font-semibold">{pcbFormData.thickness || '1.6'} mm</div>
                       
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">板子长度</div>
                       <div className="border-r border-b p-2 text-center font-semibold">
                         {pcbFormData.singleDimensions?.length || '-'} mm
                       </div>
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">板子宽度</div>
                       <div className="border-r border-b p-2 text-center font-semibold">
                         {pcbFormData.singleDimensions?.width || '-'} mm
                       </div>
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">面积</div>
                       <div className="border-b p-2 text-center font-semibold">
                         {pcbFormData.singleDimensions ? 
                           ((pcbFormData.singleDimensions.length * pcbFormData.singleDimensions.width) / 100).toFixed(2) + ' cm²' : '-'}
                       </div>
                       
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">数量类型</div>
                       <div className="border-r border-b p-2 text-center font-semibold">
                         {pcbFormData.shipmentType === 'single' ? '单片' : 
                          pcbFormData.shipmentType === 'panel_by_gerber' ? 'Gerber拼板' :
                          pcbFormData.shipmentType === 'panel_by_speedx' ? 'SpeedX拼板' : '-'}
                       </div>
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">订购数量</div>
                       <div className="border-r border-b p-2 text-center font-semibold">
                         {pcbFormData.shipmentType === 'single' ? 
                           `${pcbFormData.singleCount || '-'} pcs` :
                           `${pcbFormData.panelSet || '-'} set`}
                       </div>
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">板子重量</div>
                       <div className="border-b p-2 text-center font-semibold">
                         {pcbFormData.singleDimensions ? 
                           ((pcbFormData.singleDimensions.length * pcbFormData.singleDimensions.width * Number(pcbFormData.thickness || 1.6) * 1.8) / 1000000).toFixed(3) + ' kg' : '-'}
                       </div>
                       
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">HDI类型</div>
                       <div className="border-r border-b p-2 text-center font-semibold text-red-600">
                         {pcbFormData.hdi || '无'}
                       </div>
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">TG等级</div>
                       <div className="border-r border-b p-2 text-center font-semibold">{pcbFormData.tg || 'Standard'}</div>
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">不同设计数</div>
                       <div className="border-b p-2 text-center font-semibold">{pcbFormData.differentDesignsCount || '1'}</div>
                     </div>

                     {/* 工艺参数 */}
                     <div className="bg-orange-50 px-4 py-2 border-b">
                       <h4 className="text-sm font-semibold text-orange-800">工艺参数</h4>
                     </div>
                     <div className="grid grid-cols-6 text-xs">
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">外层铜厚</div>
                       <div className="border-r border-b p-2 text-center font-semibold">{pcbFormData.outerCopperWeight || '1'} oz</div>
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">内层铜厚</div>
                       <div className="border-r border-b p-2 text-center font-semibold">
                         {Number(pcbFormData.layers) >= 4 ? (pcbFormData.innerCopperWeight || '0.5') + ' oz' : 'N/A'}
                       </div>
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">最小线宽/线距</div>
                       <div className="border-b p-2 text-center font-semibold">{pcbFormData.minTrace || '6/6'} mil</div>
                       
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">最小过孔</div>
                       <div className="border-r border-b p-2 text-center font-semibold">{pcbFormData.minHole || '0.3'} mm</div>
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">阻焊颜色</div>
                       <div className="border-r border-b p-2 text-center font-semibold">{pcbFormData.solderMask || 'Green'}</div>
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">丝印颜色</div>
                       <div className="border-b p-2 text-center font-semibold">{pcbFormData.silkscreen || 'White'}</div>
                       
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">表面处理</div>
                       <div className="border-r border-b p-2 text-center font-semibold">{pcbFormData.surfaceFinish || 'HASL'}</div>
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">ENIG厚度</div>
                       <div className="border-r border-b p-2 text-center font-semibold">
                         {pcbFormData.surfaceFinish === 'ENIG' ? (pcbFormData.surfaceFinishEnigType || 'Standard') : 'N/A'}
                       </div>
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">过孔工艺</div>
                       <div className="border-b p-2 text-center font-semibold">{pcbFormData.maskCover || 'Tented'}</div>
                     </div>

                     {/* 特殊工艺 */}
                     <div className="bg-purple-50 px-4 py-2 border-b">
                       <h4 className="text-sm font-semibold text-purple-800">特殊工艺</h4>
                     </div>
                     <div className="grid grid-cols-6 text-xs">
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">阻抗控制</div>
                       <div className="border-r border-b p-2 text-center font-semibold text-red-600">
                         {pcbFormData.impedance ? '需要' : '不需要'}
                       </div>
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">金手指</div>
                       <div className="border-r border-b p-2 text-center font-semibold text-red-600">
                         {pcbFormData.goldFingers ? '需要' : '不需要'}
                       </div>
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">金手指斜边</div>
                       <div className="border-b p-2 text-center font-semibold">
                         {pcbFormData.goldFingers && pcbFormData.goldFingersBevel ? '需要' : '不需要'}
                       </div>
                       
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">边缘电镀</div>
                       <div className="border-r border-b p-2 text-center font-semibold text-red-600">
                         {pcbFormData.edgePlating ? '需要' : '不需要'}
                       </div>
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">边缘覆盖</div>
                       <div className="border-r border-b p-2 text-center font-semibold">
                         {pcbFormData.edgePlating ? (pcbFormData.edgeCover || 'No') : 'N/A'}
                       </div>
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">UL标记</div>
                       <div className="border-b p-2 text-center font-semibold">
                         {pcbFormData.ulMark ? '需要' : '不需要'}
                       </div>
                     </div>

                     {/* 拼板信息 */}
                     {(pcbFormData.shipmentType === 'panel_by_gerber' || pcbFormData.shipmentType === 'panel_by_speedx') && (
                       <>
                         <div className="bg-indigo-50 px-4 py-2 border-b">
                           <h4 className="text-sm font-semibold text-indigo-800">拼板信息</h4>
                         </div>
                         <div className="grid grid-cols-6 text-xs">
                           <div className="border-r border-b p-2 bg-gray-50 font-medium">拼板类型</div>
                           <div className="border-r border-b p-2 text-center font-semibold">
                             {pcbFormData.shipmentType === 'panel_by_gerber' ? 'Gerber拼板' : 'SpeedX拼板'}
                           </div>
                           <div className="border-r border-b p-2 bg-gray-50 font-medium">拼板尺寸</div>
                           <div className="border-r border-b p-2 text-center font-semibold">
                             {pcbFormData.panelDimensions ? 
                               `${pcbFormData.panelDimensions.row}×${pcbFormData.panelDimensions.column}` : '-'}
                           </div>
                           <div className="border-r border-b p-2 bg-gray-50 font-medium">拼板数量</div>
                           <div className="border-b p-2 text-center font-semibold">{pcbFormData.panelSet || '-'} set</div>
                           
                           {pcbFormData.shipmentType === 'panel_by_speedx' && (
                             <>
                               <div className="border-r border-b p-2 bg-gray-50 font-medium">工艺边</div>
                               <div className="border-r border-b p-2 text-center font-semibold">
                                 {pcbFormData.breakAwayRail || 'None'}
                               </div>
                               <div className="border-r border-b p-2 bg-gray-50 font-medium">工艺边宽度</div>
                               <div className="border-r border-b p-2 text-center font-semibold">
                                 {pcbFormData.breakAwayRail !== 'None' ? (pcbFormData.border || '5') + 'mm' : 'N/A'}
                               </div>
                               <div className="border-r border-b p-2 bg-gray-50 font-medium">分离方式</div>
                               <div className="border-b p-2 text-center font-semibold">
                                 {pcbFormData.breakAwayRail !== 'None' ? (pcbFormData.borderCutType || 'V-Cut') : 'N/A'}
                               </div>
                             </>
                           )}
                           
                           {pcbFormData.pcbNote && (
                             <>
                               <div className="border-r border-b p-2 bg-gray-50 font-medium">拼板备注</div>
                               <div className="border-b p-2 text-center font-semibold col-span-5 text-left px-3">
                                 {pcbFormData.pcbNote}
                               </div>
                             </>
                           )}
                         </div>
                       </>
                     )}

                     {/* 测试与质量 */}
                     <div className="bg-green-50 px-4 py-2 border-b">
                       <h4 className="text-sm font-semibold text-green-800">测试与质量</h4>
                     </div>
                     <div className="grid grid-cols-6 text-xs">
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">电测方式</div>
                       <div className="border-r border-b p-2 text-center font-semibold">{pcbFormData.testMethod || 'Flying Probe'}</div>
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">工作Gerber</div>
                       <div className="border-r border-b p-2 text-center font-semibold">{pcbFormData.workingGerber || 'Yes'}</div>
                                               <div className="border-r border-b p-2 bg-gray-50 font-medium">质量要求</div>
                        <div className="border-b p-2 text-center font-semibold">Standard</div>
                       
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">IPC等级</div>
                       <div className="border-r border-b p-2 text-center font-semibold">{pcbFormData.ipcClass || 'IPC Class 2'}</div>
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">不良品处理</div>
                       <div className="border-r border-b p-2 text-center font-semibold">
                         {pcbFormData.crossOuts === 'Not Accept' ? '不接受' : '接受'}
                       </div>
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">数据冲突处理</div>
                       <div className="border-b p-2 text-center font-semibold">
                         {pcbFormData.ifDataConflicts || 'Contact Customer'}
                       </div>
                       
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">产品报告</div>
                       <div className="border-b p-2 text-center font-semibold col-span-5 text-left px-3">
                         {Array.isArray(pcbFormData.productReport) ? 
                           pcbFormData.productReport.join(', ') : (pcbFormData.productReport || 'None')}
                       </div>
                     </div>

                     {/* 交付信息 */}
                     <div className="bg-yellow-50 px-4 py-2 border-b">
                       <h4 className="text-sm font-semibold text-yellow-800">交付信息</h4>
                     </div>
                     <div className="grid grid-cols-4 text-xs">
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">交付类型</div>
                       <div className="border-r border-b p-2 text-center font-semibold text-red-600">
                         {pcbFormData.delivery === 'urgent' ? '加急' : '标准'}
                       </div>
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">预计交期</div>
                       <div className="border-b p-2 text-center font-semibold">
                         {pcbFormData.delivery === 'urgent' ? '48小时' : '5-7天'}
                       </div>
                       
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">特殊要求</div>
                       <div className="border-b p-2 text-center font-semibold col-span-3 text-left px-3">
                         {pcbFormData.specialRequests || '无'}
                       </div>
                     </div>

                     {/* 费用明细 */}
                     <div className="bg-red-50 px-4 py-2 border-b">
                       <h4 className="text-sm font-semibold text-red-800">费用明细</h4>
                     </div>
                     <div className="grid grid-cols-4 text-xs">
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">PCB基础价</div>
                       <div className="border-r border-b p-2 text-center font-semibold">
                         {order.cal_values ? formatPrice((order.cal_values as any)?.pcbPrice || (order.cal_values as any)?.price, 'USD') : '-'}
                       </div>
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">工程费</div>
                       <div className="border-b p-2 text-center font-semibold">
                         {order.cal_values ? formatPrice((order.cal_values as any)?.engineeringFee || 0, 'USD') : '0.00'}
                       </div>
                       
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">加急费</div>
                       <div className="border-r border-b p-2 text-center font-semibold text-red-600">
                         {pcbFormData.delivery === 'urgent' ? 
                           (order.cal_values ? formatPrice((order.cal_values as any)?.urgentFee || 0, 'USD') : '50.00') : '0.00'}
                       </div>
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">阻抗费</div>
                       <div className="border-b p-2 text-center font-semibold text-red-600">
                         {pcbFormData.impedance ? '5.00' : '0.00'}
                       </div>
                       
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">总价(USD)</div>
                       <div className="border-r border-b p-2 text-center font-semibold text-red-600 text-sm">
                         {order.cal_values ? formatPrice((order.cal_values as any)?.totalPrice || (order.cal_values as any)?.price, 'USD') : '-'}
                       </div>
                       <div className="border-r border-b p-2 bg-gray-50 font-medium">管理员价格</div>
                       <div className="border-b p-2 text-center font-semibold text-red-600 text-sm">
                         {adminOrder ? formatPrice(adminOrder.admin_price, adminOrder.currency || 'USD') : '-'}
                       </div>
                     </div>

                     {/* 物流信息 */}
                     {pcbFormData.shippingAddress && (
                       <>
                         <div className="bg-cyan-50 px-4 py-2 border-b">
                           <h4 className="text-sm font-semibold text-cyan-800">物流信息</h4>
                         </div>
                         <div className="grid grid-cols-4 text-xs">
                           <div className="border-r border-b p-2 bg-gray-50 font-medium">收货人</div>
                           <div className="border-r border-b p-2 text-center font-semibold">
                             {(pcbFormData.shippingAddress as any).contactName || '-'}
                           </div>
                           <div className="border-r border-b p-2 bg-gray-50 font-medium">联系电话</div>
                           <div className="border-b p-2 text-center font-semibold">
                             {(pcbFormData.shippingAddress as any).phone || '-'}
                           </div>
                           
                           <div className="border-r border-b p-2 bg-gray-50 font-medium">收货地址</div>
                           <div className="border-b p-2 text-center font-semibold col-span-3">
                             {(pcbFormData.shippingAddress as any).address || '-'}, {(pcbFormData.shippingAddress as any).city || '-'}, {(pcbFormData.shippingAddress as any).country || '-'}
                           </div>
                           
                           <div className="border-r border-b p-2 bg-gray-50 font-medium">快递公司</div>
                           <div className="border-r border-b p-2 text-center font-semibold">
                             {(pcbFormData.shippingAddress as any).courier || '联邦通'}
                           </div>
                           <div className="border-r border-b p-2 bg-gray-50 font-medium">快递费</div>
                           <div className="border-b p-2 text-center font-semibold">0.00</div>
                         </div>
                       </>
                     )}

                     {/* 备注信息 */}
                     {(pcbFormData.userNote || pcbFormData.specialRequests) && (
                       <>
                         <div className="bg-gray-50 px-4 py-2 border-b">
                           <h4 className="text-sm font-semibold text-gray-800">备注信息</h4>
                         </div>
                         <div className="p-3 text-xs">
                           {pcbFormData.userNote && (
                             <div className="mb-2">
                               <span className="font-medium text-gray-600">用户备注：</span>
                               <span>{pcbFormData.userNote}</span>
                             </div>
                           )}
                           {pcbFormData.specialRequests && (
                             <div>
                               <span className="font-medium text-gray-600">特殊要求：</span>
                               <span>{pcbFormData.specialRequests}</span>
                             </div>
                           )}
                         </div>
                       </>
                     )}
                   </div>
                 ) : (
                   <div className="text-center py-8 text-red-600">
                     <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                     <p className="text-sm font-semibold">⚠️ 缺少PCB规格信息</p>
                     <p className="text-xs">无法进行技术审核，请联系客户补充完整的PCB规格</p>
                   </div>
                 )}
                 </div>
               </div>
             </div>
             
             {/* 右侧：计算结果面板 */}
             <div className="col-span-4 space-y-3">
               {/* 价格计算结果 */}
               <div className="bg-white border rounded">
                 <div className="bg-green-50 px-3 py-2 border-b">
                   <h3 className="text-sm font-semibold text-green-800 flex items-center gap-2">
                     <DollarSign className="w-4 h-4" />
                     价格计算结果
                     {pcbFormData && calculationNotes.length > 0 && (
                       <Badge variant="outline" className="ml-auto bg-green-100 text-green-700 border-green-300 text-xs">
                         ✓ 已自动计算
                       </Badge>
                     )}
                   </h3>
                 </div>
                 <div className="p-3">
                   {pcbFormData ? (
                     <>
                       <div className="grid grid-cols-2 gap-2 text-xs">
                         <div className="space-y-2">
                           <div className="flex justify-between">
                             <span className="text-gray-600">PCB基础价:</span>
                             <span className="font-semibold">
                               {(() => {
                                 try {
                                   const result = calcPcbPriceV3(pcbFormData);
                                   return `¥${Number(result.total).toFixed(2)}`;
                                 } catch {
                                   return '计算中...';
                                 }
                               })()}
                             </span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-gray-600">工程费:</span>
                             <span className="font-semibold">¥50.00</span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-gray-600">阻抗费:</span>
                             <span className={`font-semibold ${pcbFormData.impedance ? 'text-red-600' : 'text-gray-400'}`}>
                               {pcbFormData.impedance ? '¥50.00' : '¥0.00'}
                             </span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-gray-600">金手指费:</span>
                             <span className={`font-semibold ${pcbFormData.goldFingers ? 'text-red-600' : 'text-gray-400'}`}>
                               {pcbFormData.goldFingers ? '¥30.00' : '¥0.00'}
                             </span>
                           </div>
                         </div>
                         <div className="space-y-2">
                           <div className="flex justify-between">
                             <span className="text-gray-600">加急费:</span>
                             <span className={`font-semibold ${pcbFormData.delivery === 'urgent' ? 'text-red-600' : 'text-gray-400'}`}>
                               {pcbFormData.delivery === 'urgent' ? '¥100.00' : '¥0.00'}
                             </span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-gray-600">边缘电镀:</span>
                             <span className={`font-semibold ${pcbFormData.edgePlating ? 'text-red-600' : 'text-gray-400'}`}>
                               {pcbFormData.edgePlating ? '¥25.00' : '¥0.00'}
                             </span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-gray-600">运费:</span>
                             <span className="font-semibold">¥15.00</span>
                           </div>
                           <div className="flex justify-between pt-2 border-t border-gray-200">
                             <span className="text-gray-800 font-medium">预估总价:</span>
                             <span className="font-bold text-green-600">
                               {(() => {
                                 try {
                                   const result = calcPcbPriceV3(pcbFormData);
                                   let total = Number(result.total) + 50 + 15;
                                   if (pcbFormData.impedance) total += 50;
                                   if (pcbFormData.goldFingers) total += 30;
                                   if (pcbFormData.edgePlating) total += 25;
                                   if (pcbFormData.delivery === 'urgent') total += 100;
                                   return `¥${total.toFixed(2)}`;
                                 } catch {
                                   return '¥0.00';
                                 }
                               })()}
                             </span>
                           </div>
                         </div>
                       </div>
                       
                       <div className="mt-3 pt-3 border-t border-green-200 bg-green-50 rounded p-2">
                         <div className="text-xs font-medium text-green-800 mb-2">💰 价格计算明细</div>
                         <div className="space-y-1 text-xs text-green-700">
                           {calculationNotes.length > 0 ? (
                             calculationNotes.map((note, i) => (
                               <div key={i} className="bg-green-100 p-1.5 rounded text-xs">
                                 • {note}
                               </div>
                             ))
                           ) : (
                             <div className="text-green-600">点击&quot;计算价格&quot;查看详细计算过程</div>
                           )}
                         </div>
                       </div>
                     </>
                   ) : (
                     <div className="text-center text-gray-500 text-xs">
                       <Calculator className="w-6 h-6 mx-auto mb-1" />
                       <p>需要PCB规格才能计算价格</p>
                     </div>
                   )}
                 </div>
               </div>

               {/* 交期计算结果 */}
               <div className="bg-white border rounded">
                 <div className="bg-purple-50 px-3 py-2 border-b">
                   <h3 className="text-sm font-semibold text-purple-800 flex items-center gap-2">
                     <Clock className="w-4 h-4" />
                     交期计算结果
                     {pcbFormData && deliveryNotes.length > 0 && (
                       <Badge variant="outline" className="ml-auto bg-purple-100 text-purple-700 border-purple-300 text-xs">
                         ✓ 已自动计算
                       </Badge>
                     )}
                   </h3>
                 </div>
                 <div className="p-3">
                   {pcbFormData ? (
                     <>
                       <div className="space-y-2 text-xs">
                         <div className="flex justify-between">
                           <span className="text-gray-600">基础周期:</span>
                           <span className="font-semibold">
                             {pcbFormData.delivery === 'urgent' ? '2天' : '5天'}
                           </span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-gray-600">层数影响:</span>
                           <span className="font-semibold">
                             {Number(pcbFormData.layers) > 4 ? '+1天' : '标准'}
                           </span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-gray-600">特殊工艺:</span>
                           <span className="font-semibold">
                             {(pcbFormData.goldFingers || pcbFormData.edgePlating || pcbFormData.impedance) ? '+1-2天' : '无'}
                           </span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-gray-600">交付类型:</span>
                           <span className={`font-semibold ${pcbFormData.delivery === 'urgent' ? 'text-red-600' : 'text-green-600'}`}>
                             {pcbFormData.delivery === 'urgent' ? '加急48h' : '标准5-7天'}
                           </span>
                         </div>
                         <div className="flex justify-between pt-2 border-t border-gray-200">
                           <span className="text-gray-800 font-medium">总生产周期:</span>
                           <span className="font-bold text-purple-600">
                             {(() => {
                               try {
                                 const cycle = calcProductionCycle(pcbFormData, new Date(), pcbFormData?.delivery);
                                 return `${cycle.cycleDays}天`;
                               } catch {
                                 return '计算中...';
                               }
                             })()}
                           </span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-gray-600">预计完成:</span>
                           <span className="font-semibold text-purple-800">
                             {(() => {
                               try {
                                 const cycle = calcProductionCycle(pcbFormData, new Date(), pcbFormData?.delivery);
                                 const targetDate = new Date();
                                 targetDate.setDate(targetDate.getDate() + cycle.cycleDays);
                                 return targetDate.toLocaleDateString('zh-CN');
                               } catch {
                                 return '计算中...';
                               }
                             })()}
                           </span>
                         </div>
                       </div>
                       
                       {/* 交期计算明细 */}
                       <div className="mt-3 pt-3 border-t border-purple-200 bg-purple-50 rounded p-2">
                         <div className="text-xs font-medium text-purple-800 mb-2">⏰ 交期计算明细</div>
                         <div className="space-y-1 text-xs text-purple-700">
                           {deliveryNotes.length > 0 ? (
                             deliveryNotes.map((note, i) => (
                               <div key={i} className="bg-purple-100 p-1.5 rounded text-xs">
                                 • {note}
                               </div>
                             ))
                           ) : (
                             <div className="text-purple-600">点击&quot;计算交期&quot;查看详细计算过程</div>
                           )}
                         </div>
                       </div>
                     </>
                   ) : (
                     <div className="text-center text-gray-500 text-xs">
                       <Clock className="w-6 h-6 mx-auto mb-1" />
                       <p>需要PCB规格才能计算交期</p>
                     </div>
                   )}
                 </div>
               </div>

               {/* 重量和运费计算 */}
               <div className="bg-white border rounded">
                 <div className="bg-cyan-50 px-3 py-2 border-b">
                   <h3 className="text-sm font-semibold text-cyan-800 flex items-center gap-2">
                     <Package className="w-4 h-4" />
                     重量运费计算
                     {pcbFormData && shippingNotes.costBreakdown.length > 0 && (
                       <Badge variant="outline" className="ml-auto bg-cyan-100 text-cyan-700 border-cyan-300 text-xs">
                         ✓ 已自动计算
                       </Badge>
                     )}
                   </h3>
                 </div>
                 <div className="p-3">
                   {pcbFormData ? (
                     <>
                       <div className="space-y-2 text-xs">
                         <div className="flex justify-between">
                           <span className="text-gray-600">单片重量:</span>
                           <span className="font-semibold">
                             {pcbFormData.singleDimensions ? 
                               `${((pcbFormData.singleDimensions.length * pcbFormData.singleDimensions.width * Number(pcbFormData.thickness || 1.6) * 1.8) / 1000000).toFixed(3)} kg` : '-'}
                           </span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-gray-600">总重量:</span>
                           <span className="font-semibold">
                             {pcbFormData.singleDimensions ? 
                               `${(((pcbFormData.singleDimensions.length * pcbFormData.singleDimensions.width * Number(pcbFormData.thickness || 1.6) * 1.8) / 1000000) * (pcbFormData.singleCount || pcbFormData.panelSet || 1)).toFixed(3)} kg` : '-'}
                           </span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-gray-600">包装重量:</span>
                           <span className="font-semibold">约 +0.2 kg</span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-gray-600">快递方式:</span>
                           <span className="font-semibold">联邦快递</span>
                         </div>
                         <div className="flex justify-between pt-2 border-t border-gray-200">
                           <span className="text-gray-800 font-medium">预估运费:</span>
                           <span className="font-bold text-cyan-600">
                             {(() => {
                               if (shippingNotes.basicInfo.includes('预估运费')) {
                                 const match = shippingNotes.basicInfo.match(/预估运费: (¥[\d.]+)/);
                                 return match ? match[1] : '¥15.00';
                               }
                               return '¥15.00';
                             })()}
                           </span>
                         </div>
                       </div>
                       
                       {/* 运费计算明细 */}
                       <div className="mt-3 pt-3 border-t border-cyan-200 bg-cyan-50 rounded p-2">
                         <div className="text-xs font-medium text-cyan-800 mb-2">🚚 运费计算明细</div>
                         <div className="space-y-1 text-xs text-cyan-700">
                           {shippingNotes.costBreakdown.length > 0 ? (
                             shippingNotes.costBreakdown.map((note, i) => (
                               <div key={i} className="bg-cyan-100 p-1.5 rounded text-xs">
                                 • {note}
                               </div>
                             ))
                           ) : (
                             <div className="text-cyan-600">正在计算运费明细...</div>
                           )}
                         </div>
                       </div>
                     </>
                   ) : (
                     <div className="text-center text-gray-500 text-xs">
                       <Truck className="w-6 h-6 mx-auto mb-1" />
                       <p>需要PCB规格才能计算重量</p>
                     </div>
                   )}
                 </div>
               </div>

               {/* 价格对比 */}
               <div className="bg-white border rounded">
                 <div className="bg-orange-50 px-3 py-2 border-b">
                   <h3 className="text-sm font-semibold text-orange-800 flex items-center gap-2">
                     <AlertCircle className="w-4 h-4" />
                     价格对比
                   </h3>
                 </div>
                 <div className="p-3">
                   <div className="space-y-2 text-xs">
                     <div className="flex justify-between">
                       <span className="text-gray-600">客户询价:</span>
                       <span className="font-semibold text-blue-600">
                         {order.cal_values ? formatPrice((order.cal_values as any)?.totalPrice || (order.cal_values as any)?.price, 'USD') : '-'}
                       </span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-600">系统计算:</span>
                       <span className="font-semibold text-green-600">
                         {pcbFormData ? (
                           (() => {
                             try {
                               const result = calcPcbPriceV3(pcbFormData);
                               let total = Number(result.total) + 50 + 15;
                               if (pcbFormData.impedance) total += 50;
                               if (pcbFormData.goldFingers) total += 30;
                               if (pcbFormData.edgePlating) total += 25;
                               if (pcbFormData.delivery === 'urgent') total += 100;
                               return `¥${total.toFixed(2)}`;
                             } catch {
                               return '¥0.00';
                             }
                           })()
                         ) : '-'}
                       </span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-600">管理员价格:</span>
                       <span className="font-semibold text-purple-600">
                         {adminOrder ? formatPrice(adminOrder.admin_price, adminOrder.currency || 'CNY') : '待设置'}
                       </span>
                     </div>
                     <div className="flex justify-between pt-2 border-t border-gray-200">
                       <span className="text-gray-800 font-medium">差异:</span>
                       <span className="font-bold text-orange-600">
                         {order.cal_values && pcbFormData ? (
                           (() => {
                             try {
                               const customerPrice = (order.cal_values as any)?.totalPrice || (order.cal_values as any)?.price || 0;
                               const result = calcPcbPriceV3(pcbFormData);
                               let systemPrice = Number(result.total) + 50 + 15;
                               if (pcbFormData.impedance) systemPrice += 50;
                               if (pcbFormData.goldFingers) systemPrice += 30;
                               if (pcbFormData.edgePlating) systemPrice += 25;
                               if (pcbFormData.delivery === 'urgent') systemPrice += 100;
                               const diff = ((systemPrice - customerPrice * 7.2) / (customerPrice * 7.2) * 100);
                               return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`;
                             } catch {
                               return '计算中...';
                             }
                           })()
                         ) : '-'}
                       </span>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>

        {/* 右侧：管理员操作面板 - 紧凑布局 */}
        <div className="col-span-3 space-y-3">
          {/* 审核状态 - 紧凑表格 */}
          <div className="bg-white border rounded">
            <div className="bg-green-50 px-3 py-2 border-b">
              <h3 className="text-sm font-semibold text-green-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                审核状态
              </h3>
            </div>
            {pcbFormData ? (
              <div className="grid grid-cols-1 text-xs">
                <div className="flex justify-between p-2 border-b bg-gray-50">
                  <span>基本参数</span>
                  <Badge className="bg-green-100 text-green-700 text-xs">✓ 通过</Badge>
                </div>
                <div className="flex justify-between p-2 border-b">
                  <span>材料工艺</span>
                  <Badge className={pcbFormData.surfaceFinish === 'HASL' ? 'bg-green-100 text-green-700 text-xs' : 'bg-yellow-100 text-yellow-700 text-xs'}>
                    {pcbFormData.surfaceFinish === 'HASL' ? '✓ 通过' : '⚠ 注意'}
                  </Badge>
                </div>
                <div className="flex justify-between p-2 border-b bg-gray-50">
                  <span>特殊工艺</span>
                  <Badge className={pcbFormData.goldFingers || pcbFormData.edgePlating ? 'bg-orange-100 text-orange-700 text-xs' : 'bg-green-100 text-green-700 text-xs'}>
                    {pcbFormData.goldFingers || pcbFormData.edgePlating ? '⚠ 特殊' : '✓ 标准'}
                  </Badge>
                </div>
                <div className="flex justify-between p-2">
                  <span>文件完整</span>
                  <Badge className={pcbFormData.gerberUrl ? 'bg-green-100 text-green-700 text-xs' : 'bg-red-100 text-red-700 text-xs'}>
                    {pcbFormData.gerberUrl ? '✓ 完整' : '✗ 缺失'}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="p-3 text-center text-red-600 text-xs">
                <AlertCircle className="w-4 h-4 mx-auto mb-1" />
                <p>PCB规格缺失</p>
              </div>
            )}
          </div>

          {/* 价格管理 - 紧凑表格 */}
          <div className="bg-white border rounded">
            <div className="bg-blue-50 px-3 py-2 border-b">
              <h3 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                价格管理
              </h3>
            </div>
            <div className="p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <Label className="text-xs text-gray-500">PCB价格(¥)</Label>
                  <Input 
                    type="number"
                    placeholder="0.00"
                    value={String(adminOrderEdits[0]?.pcb_price || '')}
                    onChange={(e) => {
                      const values = { ...adminOrderEdits[0], pcb_price: e.target.value };
                      updatePriceCalculation(values);
                    }}
                    className="mt-1 h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">运费(¥)</Label>
                  <Input 
                    type="number"
                    placeholder="0.00"
                    value={String(adminOrderEdits[0]?.ship_price || '')}
                    onChange={(e) => {
                      const values = { ...adminOrderEdits[0], ship_price: e.target.value };
                      updatePriceCalculation(values);
                    }}
                    className="mt-1 h-7 text-xs"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <Label className="text-xs text-gray-500">关税(¥)</Label>
                  <Input 
                    type="number"
                    placeholder="0.00"
                    value={String(adminOrderEdits[0]?.custom_duty || '')}
                    onChange={(e) => {
                      const values = { ...adminOrderEdits[0], custom_duty: e.target.value };
                      updatePriceCalculation(values);
                    }}
                    className="mt-1 h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">优惠券(¥)</Label>
                  <Input 
                    type="number"
                    placeholder="0.00"
                    value={String(adminOrderEdits[0]?.coupon || '')}
                    onChange={(e) => {
                      const values = { ...adminOrderEdits[0], coupon: e.target.value };
                      updatePriceCalculation(values);
                    }}
                    className="mt-1 h-7 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <Label className="text-xs text-gray-500">汇率</Label>
                  <Input 
                    type="number"
                    placeholder="7.2"
                    value={String(adminOrderEdits[0]?.exchange_rate || '7.2')}
                    onChange={(e) => {
                      const values = { ...adminOrderEdits[0], exchange_rate: e.target.value };
                      updatePriceCalculation(values);
                    }}
                    className="mt-1 h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">币种</Label>
                  <select 
                    value={String(adminOrderEdits[0]?.currency || 'USD')}
                    onChange={(e) => {
                      const values = { ...adminOrderEdits[0], currency: e.target.value };
                      updatePriceCalculation(values);
                    }}
                    className="mt-1 h-7 text-xs border border-gray-300 rounded px-2"
                  >
                    <option value="USD">USD</option>
                    <option value="CNY">CNY</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              {/* 价格显示 */}
              <div className="bg-gray-50 p-2 rounded text-xs space-y-1">
                <div className="flex justify-between">
                  <span>人民币价格:</span>
                  <span className="font-semibold">¥{String(adminOrderEdits[0]?.cny_price || '0.00')}</span>
                </div>
                <div className="flex justify-between">
                  <span>管理员价格:</span>
                  <span className="font-semibold text-blue-600">
                    {String(adminOrderEdits[0]?.currency === 'CNY' ? '¥' : adminOrderEdits[0]?.currency === 'EUR' ? '€' : '$')}
                    {String(adminOrderEdits[0]?.admin_price || '0.00')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <Label className="text-xs text-gray-500">交期(天)</Label>
                  <Input 
                    type="number"
                    placeholder="0"
                    value={String(adminOrderEdits[0]?.production_days || '')}
                    onChange={(e) => {
                      setAdminOrderEdits(prev => [
                        { ...prev[0] || adminOrderDefaultValues, production_days: e.target.value }
                      ]);
                    }}
                    className="mt-1 h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">状态</Label>
                  <select 
                    value={String(adminOrderEdits[0]?.status || 'created')}
                    onChange={(e) => {
                      setAdminOrderEdits(prev => [
                        { ...prev[0] || adminOrderDefaultValues, status: e.target.value }
                      ]);
                    }}
                    className="mt-1 h-7 text-xs border border-gray-300 rounded px-2"
                  >
                    <option value="created">已创建</option>
                    <option value="reviewed">已审核</option>
                    <option value="paid">已付款</option>
                    <option value="in_production">生产中</option>
                    <option value="shipped">已发货</option>
                    <option value="completed">已完成</option>
                    <option value="cancelled">已取消</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-500">管理员备注</Label>
                <Textarea 
                  placeholder="添加备注..."
                  value={String(adminOrderEdits[0]?.admin_note || '')}
                  onChange={(e) => {
                    setAdminOrderEdits(prev => [
                      { ...prev[0] || adminOrderDefaultValues, admin_note: e.target.value }
                    ]);
                  }}
                  className="mt-1 text-xs"
                  rows={2}
                />
              </div>
              
              {/* 附加费用管理 */}
              <div className="border-t pt-2">
                <Label className="text-xs text-gray-500 mb-2 block">附加费用</Label>
                <div className="space-y-1">
                  {(() => {
                    let surcharges: Array<{name: string, amount: number}> = [];
                    try {
                      if (Array.isArray(adminOrderEdits[0]?.surcharges)) {
                        surcharges = adminOrderEdits[0].surcharges as Array<{name: string, amount: number}>;
                      } else if (typeof adminOrderEdits[0]?.surcharges === 'string') {
                        surcharges = JSON.parse(adminOrderEdits[0].surcharges);
                      }
                    } catch {
                      surcharges = [];
                    }
                    
                    return (
                      <>
                        {surcharges.map((surcharge, index) => (
                          <div key={index} className="flex items-center gap-1 text-xs">
                            <Input 
                              placeholder="费用名称"
                              value={surcharge.name}
                              onChange={(e) => {
                                const newSurcharges = [...surcharges];
                                newSurcharges[index] = { ...surcharge, name: e.target.value };
                                const values = { ...adminOrderEdits[0], surcharges: newSurcharges };
                                updatePriceCalculation(values);
                              }}
                              className="h-6 text-xs flex-1"
                            />
                            <Input 
                              type="number"
                              placeholder="0.00"
                              value={surcharge.amount}
                              onChange={(e) => {
                                const newSurcharges = [...surcharges];
                                newSurcharges[index] = { ...surcharge, amount: Number(e.target.value) };
                                const values = { ...adminOrderEdits[0], surcharges: newSurcharges };
                                updatePriceCalculation(values);
                              }}
                              className="h-6 text-xs w-16"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const newSurcharges = surcharges.filter((_, i) => i !== index);
                                const values = { ...adminOrderEdits[0], surcharges: newSurcharges };
                                updatePriceCalculation(values);
                              }}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const newSurcharges = [...surcharges, { name: '', amount: 0 }];
                            const values = { ...adminOrderEdits[0], surcharges: newSurcharges };
                            updatePriceCalculation(values);
                          }}
                          className="h-6 text-xs text-blue-600 hover:text-blue-800"
                        >
                          + 添加费用
                        </Button>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* 快速操作 */}
          <div className="bg-white border rounded">
            <div className="bg-orange-50 px-3 py-2 border-b">
              <h3 className="text-sm font-semibold text-orange-800 flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                管理操作
              </h3>
            </div>
            <div className="p-3 space-y-2">
              <div className="grid grid-cols-3 gap-1">
                <Button 
                  onClick={handleCalcPCB}
                  size="sm"
                  variant="outline"
                  className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                  disabled={!pcbFormData}
                >
                  <Calculator className="w-3 h-3 mr-1" />
                  重算价格
                </Button>
                <Button 
                  onClick={handleCalcDelivery}
                  size="sm"
                  variant="outline"
                  className="text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
                  disabled={!pcbFormData}
                >
                  <Clock className="w-3 h-3 mr-1" />
                  重算交期
                </Button>
                <Button 
                  onClick={handleRecalc}
                  size="sm"
                  variant="outline"
                  className="text-xs border-orange-200 text-orange-700 hover:bg-orange-50"
                  disabled={!pcbFormData}
                >
                  🔄 全部
                </Button>
              </div>
              <Button 
                onClick={() => handleSave(adminOrderEdits[0] || {})}
                size="sm"
                className="w-full bg-green-600 hover:bg-green-700 text-white text-xs"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    保存中
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {isAdminOrderCreated ? '保存订单' : '创建订单'}
                  </>
                )}
              </Button>
              <Button 
                variant="outline"
                size="sm"
                className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 text-xs"
                onClick={() => handleSave(adminOrderEdits[0] || {}, { sendNotification: true, notificationType: 'order_updated' })}
                disabled={isUpdating}
              >
                <Send className="w-3 h-3 mr-1" />
                保存并通知客户
              </Button>
            </div>
          </div>

          

          {/* 退款处理 */}
          {adminOrder?.refund_status === 'requested' && (
            <div className="bg-white border border-yellow-400 rounded">
              <div className="bg-yellow-50 px-3 py-2 border-b">
                <h3 className="text-sm font-semibold text-yellow-700 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  退款申请
                </h3>
                <p className="text-xs text-yellow-600">
                  申请金额: {formatPrice(adminOrder.requested_refund_amount, adminOrder.currency || 'CNY')}
                </p>
              </div>
              <div className="p-3 space-y-2">
                <div>
                  <Label className="text-xs">批准金额</Label>
                  <Input
                    type="number"
                    placeholder="输入退款金额"
                    value={refundReviewAmount}
                    onChange={(e) => setRefundReviewAmount(e.target.value)}
                    disabled={isReviewingRefund}
                    className="mt-1 h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">处理说明</Label>
                  <Textarea
                    placeholder="说明原因..."
                    value={refundReviewReason}
                    onChange={(e) => setRefundReviewReason(e.target.value)}
                    disabled={isReviewingRefund}
                    rows={2}
                    className="mt-1 text-xs"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRefundReview('reject')}
                    disabled={isReviewingRefund}
                    className="flex-1 text-xs"
                  >
                    拒绝
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleRefundReview('approve')}
                    disabled={isReviewingRefund}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-xs"
                  >
                    批准
                  </Button>
                </div>
              </div>
            </div>
          )}

          {adminOrder?.refund_status === 'processing' && (
            <div className="bg-white border border-green-400 rounded">
              <div className="bg-green-50 px-3 py-2 border-b">
                <h3 className="text-sm font-semibold text-green-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  处理退款
                </h3>
                <p className="text-xs text-green-600">
                  批准金额: {formatPrice(adminOrder.approved_refund_amount, adminOrder.currency || 'CNY')}
                </p>
              </div>
              <div className="p-3">
                <Button
                  onClick={handleProcessStripeRefund}
                  disabled={isProcessingStripeRefund}
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700 text-xs"
                >
                  {isProcessingStripeRefund ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <CreditCard className="mr-1 h-3 w-3" />
                  )}
                  Stripe退款
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 