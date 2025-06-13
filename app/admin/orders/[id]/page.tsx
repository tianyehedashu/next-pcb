/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useParams } from 'next/navigation';
import { quoteSchema, QuoteFormData } from '@/app/quote2/schema/quoteSchema';
import { calcProductionCycle } from '@/lib/productCycleCalc-v3';
import { calcPcbPriceV3 } from '@/lib/pcb-calc-v3';
import { OrderOverviewTabs } from '@/app/admin/components/OrderOverviewTabs';
import { AdminOrderForm } from '@/app/admin/components/AdminOrderForm';
import { Order, AdminOrder } from '@/app/admin/types/order';
import DownloadButton from '@/app/components/custom-ui/DownloadButton';
import { Textarea } from "@/components/ui/textarea";
import { CreditCard, Loader2, Info, CheckCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

function getAdminOrders(admin_orders: unknown): AdminOrder[] {
  if (!admin_orders) return [];
  if (Array.isArray(admin_orders)) return admin_orders as AdminOrder[];
  return [admin_orders as AdminOrder];
}

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
  const [showCalculationNotes, setShowCalculationNotes] = useState(true);
  const [showDeliveryNotes, setShowDeliveryNotes] = useState(true);
  const [showShippingNotes, setShowShippingNotes] = useState(true);
  const hasInitAdminOrderEdits = useRef(false);
  
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
    admin_note: '', // 确保默认值是字符串
    surcharges: [],
  };

  // 获取订单数据
  const fetchOrder = useCallback(async (): Promise<Order | undefined> => {
    if (!orderId) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/orders?id=${orderId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch order');
      }
      const data: Order = await response.json();
      setOrder(data);
      if (data.pcb_spec && typeof data.pcb_spec === 'object') {
        const result = quoteSchema.safeParse(data.pcb_spec);
        if (result.success) {
          setPcbFormData(result.data);
        } else {
          setPcbFormData(null);
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
          // 确保 admin_note 存在且为字符串类型
          admin_note: admin.admin_note ? String(admin.admin_note) : '',
        }))
      );
    } else {
      setAdminOrderEdits([adminOrderDefaultValues]);
    }
  }, [order?.admin_orders]);

  // 计算是否已创建管理员订单
  const isAdminOrderCreated = !!order?.admin_orders;

  // 处理状态变更（用于快速状态操作时同步表单）
  const handleStatusChange = (newStatus: string) => {
    setAdminOrderEdits(prev => 
      prev.map(edit => ({ ...edit, status: newStatus }))
    );
  };

  // 保存
  const handleSave = async (values: Record<string, unknown>, options?: { sendNotification?: boolean; notificationType?: string }) => {
    if (!orderId) return;
    try {
      // ❗️ 重要：将 Formily 的 Proxy 对象转换为普通对象
      const cleanedValues = JSON.parse(JSON.stringify(values));
      
      // 确保 surcharges 是一个有效的数组
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

      // 确保 admin_note 是字符串类型
      if (cleanedValues.admin_note !== undefined && cleanedValues.admin_note !== null) {
        cleanedValues.admin_note = String(cleanedValues.admin_note);
      } else {
        // 如果是 undefined 或 null，设置为空字符串
        cleanedValues.admin_note = '';
      }

      // 添加邮件通知选项和用户邮箱
      if (options?.sendNotification) {
        cleanedValues.sendNotification = true;
        cleanedValues.notificationType = options.notificationType || 'order_updated';
        // 从订单数据中获取用户邮箱
        cleanedValues.userEmail = order?.email;
        
        // 如果没有邮箱，显示警告但继续保存
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
          // 如果无法解析错误响应，使用HTTP状态信息
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
      
      // 重新获取订单数据
      const updatedOrder = await fetchOrder();
      
      // 强制重新初始化表单数据
      if (updatedOrder?.admin_orders) {
        const adminOrders = getAdminOrders(updatedOrder.admin_orders);
        setAdminOrderEdits(adminOrders.map(admin => ({ 
          ...admin,
          due_date: admin.due_date ? String(admin.due_date).split('T')[0] : '',
          delivery_date: admin.delivery_date ? String(admin.delivery_date).split('T')[0] : '',
          surcharges: Array.isArray(admin.surcharges) ? admin.surcharges : [],
          // 确保 admin_note 存在且为字符串类型
          admin_note: admin.admin_note ? String(admin.admin_note) : '',
        })));
      }
      
      hasInitAdminOrderEdits.current = true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : (isAdminOrderCreated ? '保存失败，请重试' : '创建失败，请重试');
      toast.error(errorMessage, {
        duration: 5000, // 显示5秒，让用户有时间阅读错误信息
        action: {
          label: '关闭',
          onClick: () => {}
        }
      });
    }
  };

  // 单独计算PCB价格
  const handleCalcPCB = (values: Record<string, unknown>) => {
    if (!pcbFormData) {
      toast.error('❌ PCB规格数据不完整，无法计算价格', {
        description: '请确保订单包含完整的PCB技术参数',
        duration: 4000
      });
      return;
    }
    
    let pcb_price = values.pcb_price as string || '';
    let priceNotes: string[] = [];
    
    try {
      const result = calcPcbPriceV3(pcbFormData);
      pcb_price = Number(result.total).toFixed(2);
      priceNotes = result.notes || [];
      
      const ship_price = Number(values.ship_price) || 0;
      const custom_duty = Number(values.custom_duty) || 0;
      const coupon = Number(values.coupon) || 0;
      
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
      
      const cny_price = (Number(pcb_price) + ship_price + custom_duty + surchargeTotal - coupon).toFixed(2);
      
      const currency = values.currency as string || 'USD';
      const exchange_rate = Number(values.exchange_rate) || 7.2;
      const admin_price = currency === 'CNY' ? cny_price : (Number(cny_price) / exchange_rate).toFixed(2);
      
      setAdminOrderEdits(prev => [
        {
          ...prev[0], // 保留现有的表单数据
          ...values,   // 包含用户输入的最新数据
          pcb_price,
          cny_price,
          admin_price,
        },
      ]);
      
      setCalculationNotes(priceNotes);
      setShowCalculationNotes(true);
      
      toast.success(`🔧 PCB价格计算完成`, {
        description: `PCB价格：¥${pcb_price}，总价已更新：¥${cny_price}`,
        duration: 3000
      });
      
    } catch (error) {
      console.error('PCB价格计算失败:', error);
      const errorMessage = error instanceof Error ? `PCB价格计算失败：${error.message}` : 'PCB价格计算失败，请检查PCB规格参数';
      toast.error(errorMessage, {
        duration: 4000,
        action: {
          label: '关闭',
          onClick: () => {}
        }
      });
    }
  };

  // 计算交期和运费
  const handleCalcDelivery = (values: Record<string, unknown>) => {
    if (!pcbFormData) return;
    
    let newProductionDays = values.production_days as string || '';
    let deliveryDate = '';
    let estimatedShippingCost = 0;
    let shippingDetails = '';
    
    try {
      const cycle = calcProductionCycle(pcbFormData, new Date(), pcbFormData?.delivery);
      newProductionDays = String(cycle.cycleDays);
      
      setDeliveryNotes(cycle.reason || []);
      
      const today = new Date();
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + cycle.cycleDays);
      deliveryDate = targetDate.toISOString().split('T')[0];
      
      if (pcbFormData.shippingAddress?.country && pcbFormData.shippingAddress?.courier) {
        try {
          import('@/lib/shipping-calculator').then(({ calculateShippingCost }) => {
            const shippingResult = calculateShippingCost(pcbFormData);
            const finalShippingCost = Math.round(shippingResult.finalCost * 7.2);
            
            setShippingNotes({
              basicInfo: `${pcbFormData.shippingAddress.courier.toUpperCase()} 到 ${pcbFormData.shippingAddress.country}`,
              weightInfo: `实际重量：${shippingResult.actualWeight}kg，体积重：${shippingResult.volumetricWeight}kg，计费重量：${shippingResult.chargeableWeight}kg`,
              costBreakdown: [
                `基础运费：$${shippingResult.baseCost.toFixed(2)}`,
                `燃油附加费：$${shippingResult.fuelSurcharge.toFixed(2)}`,
                `旺季附加费：$${shippingResult.peakCharge.toFixed(2)}`,
                `最终运费：$${shippingResult.finalCost.toFixed(2)} (¥${finalShippingCost})`
              ]
            });
            
            setAdminOrderEdits(prev => [
              {
                ...prev[0], // 保留现有的表单数据
                ...values,   // 包含用户输入的最新数据
                production_days: newProductionDays,
                delivery_date: deliveryDate,
                ship_price: finalShippingCost,
              },
            ]);
            
            toast.success(`📅 交期和运费计算完成`, {
              description: `交期：${newProductionDays}天（${deliveryDate}）\n运费：$${shippingResult.finalCost.toFixed(2)} (¥${finalShippingCost})`,
              duration: 3000
            });
          }).catch(() => {
            throw new Error('运费计算模块加载失败');
          });
          return;
        } catch (shippingError) {
          console.warn('运费计算失败，使用简单估算:', shippingError);
        }
      }
      
      const totalArea = Number(pcbFormData.singleDimensions?.length || 0) * Number(pcbFormData.singleDimensions?.width || 0) * Number(pcbFormData.singleCount || 1) / 10000;
      const isUrgent = pcbFormData.delivery === 'urgent';
      
      if (totalArea <= 0.1) {
        estimatedShippingCost = isUrgent ? 150 : 80;
        shippingDetails = '小件包裹';
      } else if (totalArea <= 0.5) {
        estimatedShippingCost = isUrgent ? 250 : 120;
        shippingDetails = '中等包裹';
      } else {
        estimatedShippingCost = isUrgent ? 350 : 180;
        shippingDetails = '大件包裹';
      }
      
      shippingDetails += isUrgent ? '（加急）' : '（标准）';
      
      setShippingNotes({
        basicInfo: '简单估算（缺少详细收货信息）',
        weightInfo: `PCB面积：${totalArea.toFixed(4)}㎡`,
        costBreakdown: [
          `包裹类型：${shippingDetails}`,
          `估算运费：¥${estimatedShippingCost}`
        ]
      });
      
    } catch (error) {
      console.error('计算交期失败:', error);
      const errorMessage = error instanceof Error ? `计算交期失败：${error.message}` : '计算交期失败，请检查PCB规格参数';
      toast.error(errorMessage, {
        duration: 4000,
        action: {
          label: '关闭',
          onClick: () => {}
        }
      });
      return;
    }
    
    const pcb_price = Number(values.pcb_price) || 0;
    const custom_duty = Number(values.custom_duty) || 0;
    const coupon = Number(values.coupon) || 0;
    
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
    
    const cny_price = (pcb_price + estimatedShippingCost + custom_duty + surchargeTotal - coupon).toFixed(2);
    
    const currency = values.currency as string || 'USD';
    const exchange_rate = Number(values.exchange_rate) || 7.2;
    const admin_price = currency === 'CNY' ? cny_price : (Number(cny_price) / exchange_rate).toFixed(2);
    
    setAdminOrderEdits(prev => [
      {
        ...prev[0], // 保留现有的表单数据
        ...values,   // 包含用户输入的最新数据
        production_days: newProductionDays,
        delivery_date: deliveryDate,
        ship_price: estimatedShippingCost,
        cny_price,
        admin_price,
      },
    ]);
    
    toast.success(`📅 交期和运费估算完成`, {
      description: `交期：${newProductionDays}天（${deliveryDate}）\n运费估算：¥${estimatedShippingCost}${shippingDetails ? ` (${shippingDetails})` : ''}`,
      duration: 3000
    });
    setShowDeliveryNotes(true);
    setShowShippingNotes(true);
  };

  // 单独计算运费
  const handleCalcShipping = (values: Record<string, unknown>) => {
    if (!pcbFormData) {
      toast.error('❌ PCB规格数据不完整，无法计算运费', {
        description: '请确保订单包含完整的PCB技术参数和收货地址',
        duration: 4000
      });
      return;
    }
    
    let estimatedShippingCost = 0;
    let shippingDetails = '';
    
    try {
      if (pcbFormData.shippingAddress?.country && pcbFormData.shippingAddress?.courier) {
        import('@/lib/shipping-calculator').then(({ calculateShippingCost }) => {
          const shippingResult = calculateShippingCost(pcbFormData);
          const finalShippingCost = Math.round(shippingResult.finalCost * 7.2);
          
          const courierDisplay = (pcbFormData.shippingAddress as any).courierName || pcbFormData.shippingAddress.courier;
          const countryDisplay = (pcbFormData.shippingAddress as any).countryName || pcbFormData.shippingAddress.country;
          
          setShippingNotes({
            basicInfo: `${courierDisplay?.toUpperCase()} 到 ${countryDisplay}`,
            weightInfo: `实际重量：${shippingResult.actualWeight}kg，体积重：${shippingResult.volumetricWeight}kg，计费重量：${shippingResult.chargeableWeight}kg`,
            costBreakdown: [
              `基础运费：$${shippingResult.baseCost.toFixed(2)}`,
              `燃油附加费：$${shippingResult.fuelSurcharge.toFixed(2)}`,
              `旺季附加费：$${shippingResult.peakCharge.toFixed(2)}`,
              `最终运费：$${shippingResult.finalCost.toFixed(2)} (¥${finalShippingCost})`
            ]
          });
          setShowShippingNotes(true);
          
          setAdminOrderEdits(prev => [
            {
              ...prev[0], // 保留现有的表单数据
              ...values,   // 包含用户输入的最新数据
              ship_price: finalShippingCost,
            },
          ]);
          
          toast.success(`🚚 运费计算完成`, {
            description: `运费：$${shippingResult.finalCost.toFixed(2)} (¥${finalShippingCost})\n快递：${courierDisplay?.toUpperCase()} → ${countryDisplay}`,
            duration: 3000
          });
        }).catch((error) => {
          console.error('运费计算失败:', error);
          const errorMessage = error instanceof Error ? `运费计算失败：${error.message}` : '运费计算失败，请检查运输信息';
          toast.error(errorMessage, {
            duration: 4000,
            action: {
              label: '关闭',
              onClick: () => {}
            }
          });
        });
        return;
      }
      
      const totalArea = Number(pcbFormData.singleDimensions?.length || 0) * Number(pcbFormData.singleDimensions?.width || 0) * Number(pcbFormData.singleCount || 1) / 10000;
      const isUrgent = pcbFormData.delivery === 'urgent';
      
      if (totalArea <= 0.1) {
        estimatedShippingCost = isUrgent ? 150 : 80;
        shippingDetails = '小件包裹';
      } else if (totalArea <= 0.5) {
        estimatedShippingCost = isUrgent ? 250 : 120;
        shippingDetails = '中等包裹';
      } else {
        estimatedShippingCost = isUrgent ? 350 : 180;
        shippingDetails = '大件包裹';
      }
      
      shippingDetails += isUrgent ? '（加急）' : '（标准）';
      
      setShippingNotes({
        basicInfo: '简单估算（缺少详细收货信息）',
        weightInfo: `PCB面积：${totalArea.toFixed(4)}㎡`,
        costBreakdown: [
          `包裹类型：${shippingDetails}`,
          `估算运费：¥${estimatedShippingCost}`
        ]
      });
      setShowShippingNotes(true);
      
      setAdminOrderEdits(prev => [
        {
          ...prev[0], // 保留现有的表单数据
          ...values,   // 包含用户输入的最新数据
          ship_price: estimatedShippingCost,
        },
      ]);
      
      toast.success(`🚚 运费估算完成`, {
        description: `运费：¥${estimatedShippingCost} (${shippingDetails})\nPCB面积：${totalArea.toFixed(4)}㎡`,
        duration: 3000
      });
      
    } catch (error) {
      console.error('运费计算失败:', error);
      const errorMessage = error instanceof Error ? `运费计算失败：${error.message}` : '运费计算失败，请检查PCB规格和收货地址';
      toast.error(errorMessage, {
        duration: 4000,
        action: {
          label: '关闭',
          onClick: () => {}
        }
      });
    }
  };

  // 重新计算所有
  const handleRecalc = (values: Record<string, unknown>) => {
    if (!pcbFormData) return;
    
    // 先计算PCB价格
    let pcb_price = values.pcb_price as string || '';
    let priceNotes: string[] = [];
    
    try {
      const result = calcPcbPriceV3(pcbFormData);
      pcb_price = Number(result.total).toFixed(2);
      priceNotes = result.notes || [];
      
      // 创建包含更新后PCB价格的values对象
      const updatedValues = {
        ...values,
        pcb_price,
      };
      
      // 计算其他价格信息
      const ship_price = Number(values.ship_price) || 0;
      const custom_duty = Number(values.custom_duty) || 0;
      const coupon = Number(values.coupon) || 0;
      
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
      
      const cny_price = (Number(pcb_price) + ship_price + custom_duty + surchargeTotal - coupon).toFixed(2);
      
      const currency = values.currency as string || 'USD';
      const exchange_rate = Number(values.exchange_rate) || 7.2;
      const admin_price = currency === 'CNY' ? cny_price : (Number(cny_price) / exchange_rate).toFixed(2);
      
      // 先更新PCB相关计算结果
      setAdminOrderEdits(prev => [
        {
          ...prev[0], // 保留现有的表单数据
          ...updatedValues, // 包含更新后的PCB价格
          cny_price,
          admin_price,
        },
      ]);
      
      setCalculationNotes(priceNotes);
      setShowCalculationNotes(true);
      
      // 然后计算交期，使用更新后的values
      setTimeout(() => handleCalcDelivery(updatedValues), 100);
      
      toast.success('🔄 重新计算完成', {
        description: '所有价格、交期、运费明细已更新',
        duration: 3000
      });
      
    } catch (error) {
      console.error('重新计算失败:', error);
      const errorMessage = error instanceof Error ? `重新计算失败：${error.message}` : '重新计算失败，请检查PCB规格参数';
      toast.error(errorMessage, {
        duration: 4000,
        action: {
          label: '关闭',
          onClick: () => {}
        }
      });
    }
  };

  // PCB参数字段中文映射
  const pcbFieldLabelMap: Record<string, string> = {
    pcbType: '板材类型',
    layers: '层数',
    thickness: '板厚',
    hdi: 'HDI类型',
    tg: 'TG值',
    shipmentType: '出货方式',
    singleDimensions: '单片尺寸',
    singleCount: '单片数量',
    panelDimensions: '拼板尺寸',
    panelSet: '拼板数量',
    differentDesignsCount: '不同设计数',
    border: '拼板边框',
    useShengyiMaterial: '是否生益板材',
    pcbNote: 'PCB备注',
    delivery: '交付类型',
    outerCopperWeight: '外层铜厚',
    innerCopperWeight: '内层铜厚',
    minTrace: '最小线宽/间距',
    minHole: '最小孔径',
    solderMask: '阻焊颜色',
    silkscreen: '丝印颜色',
    surfaceFinish: '表面处理',
    surfaceFinishEnigType: 'ENIG厚度',
    impedance: '阻抗控制',
    goldFingers: '金手指',
    goldFingersBevel: '斜边金手指',
    edgePlating: '边缘电镀',
    halfHole: '半孔数量',
    edgeCover: '边缘覆盖',
    maskCover: '过孔工艺',
    bga: 'BGA',
    holeCu25um: '孔铜25um',
    blueMask: '蓝色阻焊',
    holeCount: '孔数',
    testMethod: '电测方式',
    productReport: '产品报告',
    workingGerber: '工作Gerber',
    ulMark: 'UL标记',
    crossOuts: '可接受不良板',
    ipcClass: 'IPC等级',
    ifDataConflicts: '数据冲突处理',
    specialRequests: '特殊要求',
    gerberUrl: 'Gerber文件链接',
    shippingCostEstimation: '运费预估',
    shippingAddress: '收货地址',
    customs: '报关信息',
    customsNote: '报关备注',
    userNote: '用户备注',
  };

  // PCB参数值美化映射
  const pcbFieldValueMap: Record<string, (value: unknown) => string> = {
    pcbType: v => v === 'FR-4' ? 'FR-4（玻纤板）' : String(v),
    hdi: v => ({ None: '无', '1step': '一阶', '2step': '二阶', '3step': '三阶' }[String(v)] || String(v)),
    tg: v => ({ TG135: 'TG135', TG150: 'TG150', TG170: 'TG170' }[String(v)] || String(v)),
    shipmentType: v => ({ single: '单片', panel: '拼板' }[String(v)] || String(v)),
    border: v => ({ None: '无', '5': '5mm', '10': '10mm' }[String(v)] || String(v)),
    outerCopperWeight: v => v ? `${v} oz` : '',
    innerCopperWeight: v => v ? `${v} oz` : '',
    minTrace: v => v ? `${v} mil` : '',
    minHole: v => v ? `${v} mm` : '',
    solderMask: v => ({ 'Green': '绿色', 'Matt Green': '哑光绿', 'Blue': '蓝色', 'Red': '红色', 'Black': '黑色', 'Matt Black': '哑光黑', 'White': '白色', 'Yellow': '黄色' }[String(v)] || String(v)),
    silkscreen: v => ({ 'White': '白色', 'Black': '黑色', 'Yellow': '黄色' }[String(v)] || String(v)),
    surfaceFinish: v => ({ 'HASL': '有铅喷锡', 'Leadfree HASL': '无铅喷锡', 'ENIG': '沉金', 'OSP': 'OSP', 'Immersion Silver': '沉银', 'Immersion Tin': '沉锡' }[String(v)] || String(v)),
    surfaceFinishEnigType: v => ({ 'ENIG 1U': '1微英寸', 'ENIG 2U': '2微英寸', 'ENIG 3U': '3微英寸' }[String(v)] || String(v)),
    maskCover: v => ({ 'Tented Vias': '盖油', 'Opened Vias': '开窗', 'Solder Mask Plug (IV-B)': '塞孔', ' Non-Conductive Fill & Cap (VII)': '非导电填充+盖油' }[String(v)] || String(v)),
    edgeCover: v => ({ None: '无', Left: '左侧', Right: '右侧', Both: '两侧' }[String(v)] || String(v)),
    testMethod: v => ({ 'None': '免测', '100% FPT for Batches': '飞针测试', 'Test Fixture': '测试架' }[String(v)] || String(v)),
    productReport: v => Array.isArray(v) ? v.map(i => ({ 'None': '无', 'Production Report': '生产报告', 'Impedance Report': '阻抗报告' }[String(i)] || String(i))).join('，') : String(v),
    workingGerber: v => ({ 'Not Required': '不需要', 'Require Approval': '需要审批' }[String(v)] || String(v)),
    crossOuts: v => ({ 'Not Accept': '不接受', 'Accept': '接受' }[String(v)] || String(v)),
    ipcClass: v => ({ 'IPC Level 2 Standard': 'IPC 2级', 'IPC Level 3 Standard': 'IPC 3级' }[String(v)] || String(v)),
    ifDataConflicts: v => ({ 'Follow Order Parameters': '以订单为准', 'Follow Files': '以文件为准', 'Ask for Confirmation': '需确认' }[String(v)] || String(v)),
    delivery: v => ({ standard: '标准', urgent: '加急' }[String(v)] || String(v)),
    useShengyiMaterial: v => v ? '是' : '否',
    goldFingers: v => v ? '是' : '否',
    goldFingersBevel: v => v ? '是' : '否',
    edgePlating: v => v ? '是' : '否',
    bga: v => v ? '是' : '否',
    holeCu25um: v => v ? '是' : '否',
    blueMask: v => v ? '是' : '否',
    ulMark: v => v ? '是' : '否',
    singleDimensions: v => v && typeof v === 'object' && 'length' in v && 'width' in v ? `${(v as Record<string, unknown>).length} x ${(v as Record<string, unknown>).width} cm` : String(v),
    panelDimensions: v => v && typeof v === 'object' && 'row' in v && 'column' in v ? `${(v as Record<string, unknown>).row}行 x ${(v as Record<string, unknown>).column}列` : String(v),
    shippingAddress: v => {
      if (!v || typeof v !== 'object') return String(v);
      const addr = v as Record<string, unknown>;
      
      // 优先使用友好名称，回退到代码
      const country = (addr.countryName as string) || (addr.country_name as string) || (addr.country as string) || '';
      const state = (addr.stateName as string) || (addr.state_name as string) || (addr.state as string) || '';
      const city = (addr.cityName as string) || (addr.city_name as string) || (addr.city as string) || '';
      const courier = (addr.courierName as string) || (addr.courier_name as string) || (addr.courier as string) || '';
      const contactName = (addr.contactName as string) || (addr.contact_name as string) || '';
      
      return `${contactName} | ${country} ${state} ${city} | ${courier}`;
    },
    customs: v => {
      if (!v || typeof v !== 'object') return String(v);
      const customs = v as Record<string, unknown>;
      return `${customs.value || ''}${customs.currency || ''} - ${customs.description || ''}`;
    },
  };

  // PCB参数字段分组及条件显示配置
  interface PCBFieldConfig {
    key: keyof typeof pcbFieldLabelMap;
    shouldShow: (data: Record<string, unknown>) => boolean;
  }
  interface PCBFieldGroup {
    title: string;
    fields: PCBFieldConfig[];
  }

  const isPanel = (type?: string): boolean => !!type && type.startsWith('panel');

  const pcbFieldGroups: PCBFieldGroup[] = [
    {
      title: 'Basic Info',
      fields: [
        { key: 'pcbType', shouldShow: () => true },
        { key: 'layers', shouldShow: () => true },
        { key: 'hdi', shouldShow: data => data.pcbType === 'HDI' },
        { key: 'tg', shouldShow: () => true },
        { key: 'useShengyiMaterial', shouldShow: () => true },
      ],
    },
    {
      title: 'Dimensions & Panelization',
      fields: [
        { key: 'shipmentType', shouldShow: () => true },
        { key: 'singleDimensions', shouldShow: () => true },
        { key: 'singleCount', shouldShow: () => true },
        { key: 'panelDimensions', shouldShow: data => isPanel(String(data.shipmentType)) },
        { key: 'panelSet', shouldShow: data => isPanel(String(data.shipmentType)) },
        { key: 'differentDesignsCount', shouldShow: data => isPanel(String(data.shipmentType)) },
        { key: 'border', shouldShow: data => isPanel(String(data.shipmentType)) },
        { key: 'pcbNote', shouldShow: () => true },
      ],
    },
    {
      title: 'Material & Process',
      fields: [
        { key: 'thickness', shouldShow: () => true },
        { key: 'outerCopperWeight', shouldShow: () => true },
        { key: 'innerCopperWeight', shouldShow: data => !!data.innerCopperWeight },
        { key: 'minTrace', shouldShow: () => true },
        { key: 'minHole', shouldShow: () => true },
        { key: 'solderMask', shouldShow: () => true },
        { key: 'silkscreen', shouldShow: () => true },
        { key: 'surfaceFinish', shouldShow: () => true },
        { key: 'surfaceFinishEnigType', shouldShow: data => data.surfaceFinish === 'ENIG' },
        { key: 'impedance', shouldShow: () => true },
      ],
    },
    {
      title: 'Special Features',
      fields: [
        { key: 'goldFingers', shouldShow: () => true },
        { key: 'goldFingersBevel', shouldShow: data => !!data.goldFingers },
        { key: 'edgePlating', shouldShow: () => true },
        { key: 'halfHole', shouldShow: () => true },
        { key: 'edgeCover', shouldShow: () => true },
        { key: 'maskCover', shouldShow: () => true },
        { key: 'bga', shouldShow: () => true },
        { key: 'holeCu25um', shouldShow: () => true },
        { key: 'blueMask', shouldShow: () => true },
      ],
    },
    {
      title: 'Testing & Report',
      fields: [
        { key: 'holeCount', shouldShow: () => true },
        { key: 'testMethod', shouldShow: () => true },
        { key: 'productReport', shouldShow: () => true },
        { key: 'workingGerber', shouldShow: () => true },
        { key: 'ulMark', shouldShow: () => true },
        { key: 'crossOuts', shouldShow: () => true },
        { key: 'ipcClass', shouldShow: () => true },
        { key: 'ifDataConflicts', shouldShow: () => true },
      ],
    },
    {
      title: 'Logistics & Notes',
      fields: [
        { key: 'delivery', shouldShow: () => true },
        { key: 'specialRequests', shouldShow: () => true },
        { key: 'gerberUrl', shouldShow: () => true },
        { key: 'shippingAddress', shouldShow: () => true },
        { key: 'customs', shouldShow: () => true },
        { key: 'customsNote', shouldShow: () => true },
        { key: 'userNote', shouldShow: () => true },
      ],
    },
  ];

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
      fetchOrder(); // Refresh data
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
      fetchOrder(); // Refresh data
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsProcessingStripeRefund(false);
    }
  };
  
  const adminOrder = order ? getAdminOrders(order.admin_orders)[0] : null;

  if (loading) {
    return <div>Loading UI...</div>;
  }
  if (error) {
    return <div className="w-full p-2 md:p-4 text-red-600">Error: {error}</div>;
  }
  if (!order) {
    return <div className="w-full p-2 md:p-4">Order not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="max-w-[1600px] mx-auto px-2 py-6 w-full">
        {/* 页面标题区 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">📋</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">订单详情</h1>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              order.status === 'completed' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {order.status}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-1">
            <p className="text-gray-600">订单编号: {order.id}</p>
            {order.created_at && (
              <p className="text-gray-500 text-sm">
                创建时间: {new Date(order.created_at as string).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
        </div>

                {/* Gerber文件下载区域 */}
        {(() => {
          // 检查多个可能的Gerber文件来源
          const gerberUrl = pcbFormData?.gerberUrl || 
                           order.gerber_file_url || 
                           (pcbFormData as any)?.gerber ||
                           (order.pcb_spec as any)?.gerber ||
                           (order.pcb_spec as any)?.gerberUrl;
          
          const hasGerberFile = gerberUrl && typeof gerberUrl === 'string';
          const fileName = hasGerberFile ? (gerberUrl.split('/').pop() || 'Gerber File') : 'No Gerber file';
          
          return (
            <div className="mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    📄 Gerber Files
                  </h3>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        hasGerberFile ? 'bg-indigo-100' : 'bg-gray-100'
                      }`}>
                        <span className={`text-lg ${
                          hasGerberFile ? 'text-indigo-600' : 'text-gray-400'
                        }`}>🔧</span>
                      </div>
                      <div>
                        <div className={`font-medium ${
                          hasGerberFile ? 'text-gray-900' : 'text-gray-500'
                        }`}>{fileName}</div>
                        <div className="text-sm text-gray-500">
                          {hasGerberFile ? 'PCB manufacturing files' : 'No manufacturing files uploaded'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        {hasGerberFile ? (
                          <>
                            <div className="text-xs text-green-600 font-medium mb-1">✓ Available</div>
                            <DownloadButton 
                              filePath={gerberUrl}
                              bucket="gerber"
                              className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border-indigo-200"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Download
                            </DownloadButton>
                          </>
                        ) : (
                          <>
                            <div className="text-xs text-red-600 font-medium mb-1">✗ Not Available</div>
                            <div className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium">
                              No File
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 主内容区 */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* 左侧管理员表单 */}
          <div className="xl:col-span-3 space-y-6">
            {!isAdminOrderCreated && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-center gap-2 text-amber-800">
                  <span className="text-lg">⚠️</span>
                  <span className="font-medium">还未创建管理员订单</span>
                </div>
                <p className="text-sm text-amber-700 mt-1">请填写并创建管理员订单信息</p>
              </div>
            )}
            
            {/* 管理员表单 */}
            <div className="sticky top-24">
                          <AdminOrderForm
              initialValues={adminOrderEdits[0] || {}}
              onSave={handleSave}
              onRecalc={handleRecalc}
              onCalcPCB={handleCalcPCB}
              onCalcDelivery={handleCalcDelivery}
              onCalcShipping={handleCalcShipping}
              readOnly={false}
              submitButtonText={isAdminOrderCreated ? '保存' : '创建'}
              hideActionButtons={false}
              onStatusChange={handleStatusChange}
            />
            </div>
          </div>

          {/* 右侧信息区 */}
          <div className="xl:col-span-2 space-y-6">
            {/* 价格明细卡片 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  💰 价格明细
                </h3>
              </div>
              <div className="p-6">
                {order.cal_values ? (
                  <div className="space-y-6">
                    {/* 基础价格信息 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                        <div className="text-sm text-emerald-600 font-medium mb-1">总价</div>
                        <div className="text-2xl font-bold text-emerald-700">
                          ${(order.cal_values as any)?.totalPrice || order.cal_values.price || '0'}
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <div className="text-sm text-blue-600 font-medium mb-1">PCB价格</div>
                        <div className="text-xl font-bold text-blue-700">
                          ${(order.cal_values as any)?.pcbPrice || order.cal_values.price || '0'}
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                        <div className="text-sm text-purple-600 font-medium mb-1">单价</div>
                        <div className="text-xl font-bold text-purple-700">
                          ${(order.cal_values as any)?.unitPrice || (order.cal_values.price && order.cal_values.totalQuantity ? (order.cal_values.price / order.cal_values.totalQuantity).toFixed(2) : '0')}
                        </div>
                      </div>
                      
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                        <div className="text-sm text-orange-600 font-medium mb-1">数量</div>
                        <div className="text-xl font-bold text-orange-700">
                          {(order.cal_values as any)?.totalCount || order.cal_values.totalQuantity || '0'} 片
                        </div>
                      </div>
                      
                      <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-100">
                        <div className="text-sm text-cyan-600 font-medium mb-1">面积</div>
                        <div className="text-xl font-bold text-cyan-700">
                          {order.cal_values.totalArea || '0'} ㎡
                        </div>
                      </div>
                      
                      <div className="bg-pink-50 p-4 rounded-lg border border-pink-100">
                        <div className="text-sm text-pink-600 font-medium mb-1">交期</div>
                        <div className="text-xl font-bold text-pink-700">
                          {order.cal_values.leadTimeDays || '0'} 天
                        </div>
                      </div>
                    </div>

                    {/* 其他详细信息 */}
                    {order.cal_values.priceDetail && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                          📊 费用分解
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-600">基础价格</span>
                            <span className="font-semibold text-gray-900">¥{order.cal_values.priceDetail.basePrice || '0'}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-600">测试费用</span>
                            <span className="font-semibold text-gray-900">¥{order.cal_values.priceDetail.testMethod || '0'}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-600">工程费用</span>
                            <span className="font-semibold text-gray-900">¥{order.cal_values.priceDetail.engFee || '0'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <span className="text-4xl mb-2 block">📊</span>
                    <p>暂无价格信息</p>
                  </div>
                )}
              </div>
            </div>

            {/* 计算备注卡片 - 带关闭按钮 */}
            {calculationNotes.length > 0 && showCalculationNotes && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      📋 价格计算明细
                      <span className="px-2 py-1 bg-white/20 text-white text-xs rounded-full font-medium">
                        {calculationNotes.length} 项
                      </span>
                    </h3>
                    <button
                      onClick={() => setShowCalculationNotes(false)}
                      className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors"
                      title="关闭价格计算明细"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {calculationNotes.map((note: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                        <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <span className="text-gray-800 text-sm leading-relaxed">{note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 交期计算备注卡片 - 带关闭按钮 */}
            {deliveryNotes.length > 0 && showDeliveryNotes && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      📅 交期计算明细
                      <span className="px-2 py-1 bg-white/20 text-white text-xs rounded-full font-medium">
                        {deliveryNotes.length} 项
                      </span>
                    </h3>
                    <button
                      onClick={() => setShowDeliveryNotes(false)}
                      className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors"
                      title="关闭交期计算明细"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {deliveryNotes.map((note: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-violet-50/50 rounded-lg border border-violet-100">
                        <div className="w-6 h-6 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <span className="text-gray-800 text-sm leading-relaxed">{note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 运费计算备注卡片 - 带关闭按钮 */}
            {(shippingNotes.basicInfo || shippingNotes.costBreakdown.length > 0) && showShippingNotes && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-red-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      🚚 运费计算明细
                      <span className="px-2 py-1 bg-white/20 text-white text-xs rounded-full font-medium">
                        详细
                      </span>
                    </h3>
                    <button
                      onClick={() => setShowShippingNotes(false)}
                      className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors"
                      title="关闭运费计算明细"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  {shippingNotes.basicInfo && (
                    <div className="mb-4 p-3 bg-orange-50/50 rounded-lg border border-orange-100">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-orange-800">📦 运输方式</span>
                      </div>
                      <p className="text-sm text-gray-700">{shippingNotes.basicInfo}</p>
                    </div>
                  )}
                  
                  {shippingNotes.weightInfo && (
                    <div className="mb-4 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-blue-800">⚖️ 重量信息</span>
                      </div>
                      <p className="text-sm text-gray-700">{shippingNotes.weightInfo}</p>
                    </div>
                  )}
                  
                  {shippingNotes.costBreakdown.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-green-800">💰 费用明细</span>
                      </div>
                      {shippingNotes.costBreakdown.map((item: string, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-green-50/50 rounded-lg border border-green-100">
                          <div className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                            {i + 1}
                          </div>
                          <span className="text-gray-800 text-sm leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 订单信息卡片 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <OrderOverviewTabs
                order={order as unknown as Record<string, unknown>}
                pcbFieldGroups={pcbFieldGroups}
                pcbFieldLabelMap={pcbFieldLabelMap}
                pcbFieldValueMap={pcbFieldValueMap}
                hidePriceDetailsTab={true}
              />
            </div>

            {adminOrder?.refund_status === 'requested' && (
              <Card className="mt-6 border-yellow-400">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="text-yellow-500" />
                    <span>Refund Request Pending Review</span>
                  </CardTitle>
                  <CardDescription>
                    The user has requested a refund. Please review and approve or reject the request.
                    Estimated refund amount based on policy was: ${adminOrder.requested_refund_amount?.toFixed(2)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="refundAmount">Approved Refund Amount ({adminOrder.currency})</Label>
                    <Input
                      id="refundAmount"
                      type="number"
                      placeholder="Enter final refund amount"
                      value={refundReviewAmount}
                      onChange={(e) => setRefundReviewAmount(e.target.value)}
                      disabled={isReviewingRefund}
                    />
                  </div>
                  <div>
                    <Label htmlFor="refundReason">Reason for Decision</Label>
                    <Textarea
                      id="refundReason"
                      placeholder="Explain the reason for your approval or rejection..."
                      value={refundReviewReason}
                      onChange={(e) => setRefundReviewReason(e.target.value)}
                      disabled={isReviewingRefund}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => handleRefundReview('reject')}
                    disabled={isReviewingRefund}
                  >
                    {isReviewingRefund ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject'}
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => handleRefundReview('approve')}
                    disabled={isReviewingRefund}
                  >
                    {isReviewingRefund ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve'}
                  </Button>
                </CardFooter>
              </Card>
            )}

            {adminOrder?.refund_status === 'processing' && (
              <Card className="mt-6 border-green-400">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="text-green-500" />
                    <span>Ready to Process Refund</span>
                  </CardTitle>
                  <CardDescription>
                    The user has confirmed the refund amount of ${adminOrder.approved_refund_amount?.toFixed(2)}. You can now process the refund via Stripe.
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button
                    onClick={handleProcessStripeRefund}
                    disabled={isProcessingStripeRefund}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isProcessingStripeRefund ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="mr-2 h-4 w-4" />
                    )}
                    Process Refund via Stripe
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 