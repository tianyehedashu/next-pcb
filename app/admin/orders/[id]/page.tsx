/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useParams } from 'next/navigation';
import { quoteSchema, QuoteFormData } from '@/app/quote2/schema/quoteSchema';
import { calcProductionCycle } from '@/lib/productCycleCalc-v3';
import { calcPcbPriceV3 } from '@/lib/pcb-calc-v3';
import { Order, AdminOrder } from '@/app/admin/types/order';
import { Textarea } from "@/components/ui/textarea";
import { CreditCard, Loader2, Info, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// 导入拆分的组件
import { PageHeader } from './components/PageHeader';
import { OrderOverview } from './components/OrderOverview';
import { PCBSpecReview } from './components/PCBSpecReview';
import { StencilSpecReview } from './components/StencilSpecReview';
import { CalculationResultPanels } from './components/CalculationResultPanels';
import { ReviewStatusPanel } from './components/ReviewStatusPanel';
import { PriceManagementPanel } from './components/PriceManagementPanel';
import { ManagementActionsPanel } from './components/ManagementActionsPanel';
import { AddressFormValue } from '@/app/quote2/components/AddressFormComponent';

function getAdminOrders(admin_orders: unknown): AdminOrder[] {
  if (!admin_orders) return [];
  if (Array.isArray(admin_orders)) return admin_orders as AdminOrder[];
  return [admin_orders as AdminOrder];
}

// 辅助函数
const getCurrencySymbol = (currency?: string) => {
  switch (currency) {
    case 'CNY': return '¥';
    case 'EUR': return '€';
    case 'USD':
    default: return '$';
  }
};

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

const getStatusLabel = (status: string) => {
  const statusLabels: Record<string, string> = {
    'created': '已创建',
    'reviewed': '已审核',
    'paid': '已付款',
    'in_production': '生产中',
    'shipped': '已发货',
    'completed': '已完成',
    'cancelled': '已取消',
    'pending': '待处理',
  };
  return statusLabels[status] || status;
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
  const [isReviewingRefund, setIsReviewingRefund] = useState(false);
  const [refundReviewAmount, setRefundReviewAmount] = useState<string>("");
  const [refundReviewReason, setRefundReviewReason] = useState("");
  const [isProcessingStripeRefund, setIsProcessingStripeRefund] = useState(false);
  
  // 移动端管理面板展开状态
  const [isMobilePanelExpanded, setIsMobilePanelExpanded] = useState(false);
  
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
    exchange_rate: '7.2',
    ship_price: '',
    custom_duty: '',
    coupon: '0',
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
          // 🔧 确保数据类型正确
          exchange_rate: String(admin.exchange_rate || (admin.currency === 'CNY' ? '1.0' : '7.2')),
          pcb_price: String(admin.pcb_price || ''),
          ship_price: String(admin.ship_price || ''),
          custom_duty: String(admin.custom_duty || ''),
          coupon: String(admin.coupon || '0'),
          currency: admin.currency || 'USD',
        }))
      );
    } else {
      setAdminOrderEdits([adminOrderDefaultValues]);
    }
  }, [order?.admin_orders]);

  // 价格计算更新函数
  const updatePriceCalculation = useCallback((values: Record<string, unknown>) => {
    const pcb_price = Number(values.pcb_price) || 0;
    const ship_price = Number(values.ship_price) || 0;
    const custom_duty = Number(values.custom_duty) || 0;
    const coupon = Number(values.coupon) || 0;
    
    console.log(`📊 价格计算输入: PCB=${pcb_price}, 运费=${ship_price}, 关税=${custom_duty}, 优惠券=${coupon}`);
    
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
    
    // 获取币种和汇率
    const currency = values.currency as string || 'USD';
    let exchange_rate = Number(values.exchange_rate) || 7.2;
    
    // 🔧 修复：CNY币种的汇率应该是1.0
    if (currency === 'CNY') {
      exchange_rate = 1.0;
    }
    
    // 重要修正：所有价格都已经是当前币种的价格，直接相加即可
    const totalInCurrentCurrency = (pcb_price + ship_price + custom_duty + surchargeTotal - coupon);
    
    // 计算人民币总价（用于显示）
    let cny_price: string;
    switch (currency) {
      case 'CNY':
        cny_price = totalInCurrentCurrency.toFixed(2);
        break;
      case 'USD':
        cny_price = (totalInCurrentCurrency * exchange_rate).toFixed(2);
        break;
      case 'EUR':
        cny_price = (totalInCurrentCurrency * exchange_rate).toFixed(2);
        break;
      default:
        cny_price = (totalInCurrentCurrency * exchange_rate).toFixed(2);
    }
    
    // 管理员价格就是当前币种的总价
    const admin_price = totalInCurrentCurrency.toFixed(2);
    
    setAdminOrderEdits(prev => [
      {
        ...prev[0],
        ...values,
        cny_price,
        admin_price,
      },
    ]);
  }, []);

  // 自动计算价格、交期和运费
  useEffect(() => {
    if (pcbFormData && adminOrderEdits[0]) {
      // 计算PCB价格和交期
      let pcb_price = '0.00';
      let result: any = { notes: [] };
      let production_days = '0';
      let delivery_date = new Date().toISOString().split('T')[0];
      let cycle: any = { reason: [] };
      
      // 自动计算价格
      try {
        result = calcPcbPriceV3(pcbFormData);
        const pcbPriceCNY = Number(result.total); // PCB价格计算返回人民币
        
        // 获取当前币种设置
        const currentCurrency = adminOrderEdits[0]?.currency || 'USD';
        const currentExchangeRate = Number(adminOrderEdits[0]?.exchange_rate) || 7.2;
        
        // 根据币种转换PCB价格
        switch (currentCurrency) {
          case 'CNY':
            pcb_price = pcbPriceCNY.toFixed(2);
            break;
          case 'USD':
            pcb_price = (pcbPriceCNY / currentExchangeRate).toFixed(2);
            break;
          case 'EUR':
            pcb_price = (pcbPriceCNY / currentExchangeRate).toFixed(2);
            break;
          default:
            pcb_price = (pcbPriceCNY / currentExchangeRate).toFixed(2);
        }
        
        setCalculationNotes([
          ...result.notes || [],
          `💡 PCB价格已转换为${currentCurrency}币种 (原始价格: ¥${pcbPriceCNY.toFixed(2)})`
        ]);
      } catch (error) {
        console.error('自动计算PCB价格失败:', error);
        setCalculationNotes(['PCB价格计算失败，请检查规格参数']);
      }

      // 自动计算交期
      try {
        cycle = calcProductionCycle(pcbFormData, new Date(), pcbFormData?.delivery);
        production_days = String(cycle.cycleDays);
        
        const today = new Date();
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + cycle.cycleDays);
        delivery_date = targetDate.toISOString().split('T')[0];
        
        setDeliveryNotes(cycle.reason || []);
       } catch (error) {
        console.error('自动计算交期失败:', error);
        setDeliveryNotes(['交期计算失败，请检查规格参数']);
      }

      // 自动计算运费 - 使用专业运费计算器
      try {
        // 检查是否有完整的运输信息
        if (pcbFormData.shippingAddress?.country && pcbFormData.shippingAddress?.courier) {
          // 使用专业运费计算（异步）
          import('@/lib/shipping-calculator').then(async ({ calculateShippingCost }) => {
            try {
              const shippingResult = await calculateShippingCost(pcbFormData);
              const shippingCostCNY = shippingResult.finalCost; // 🔧 现在返回人民币金额
              
              // 获取当前币种设置
              const currentCurrency = adminOrderEdits[0]?.currency || 'USD';
              const currentExchangeRate = Number(adminOrderEdits[0]?.exchange_rate) || 7.2;
              
              // 🔧 重要：运费计算现在返回人民币，需要根据当前币种转换存储
              let storedShippingCost: number;
              let displayShippingCost: string;
              
              console.log(`🚢 运费计算: 原始人民币金额 ¥${shippingCostCNY.toFixed(2)}, 目标币种: ${currentCurrency}, 汇率: ${currentExchangeRate}`);
              
              switch (currentCurrency) {
                case 'CNY':
                  // CNY币种：直接存储人民币金额
                  storedShippingCost = shippingCostCNY;
                  displayShippingCost = `¥${shippingCostCNY.toFixed(2)}`;
                  console.log(`💰 CNY存储: ¥${storedShippingCost.toFixed(2)}`);
                  break;
                case 'USD':
                  // USD币种：人民币转美元
                  storedShippingCost = shippingCostCNY / currentExchangeRate;
                  displayShippingCost = `$${storedShippingCost.toFixed(2)}`;
                  console.log(`💰 USD存储: $${storedShippingCost.toFixed(2)} (${shippingCostCNY} / ${currentExchangeRate})`);
                  break;
                case 'EUR':
                  // EUR币种：人民币转欧元
                  storedShippingCost = shippingCostCNY / currentExchangeRate;
                  displayShippingCost = `€${storedShippingCost.toFixed(2)}`;
                  console.log(`💰 EUR存储: €${storedShippingCost.toFixed(2)} (${shippingCostCNY} / ${currentExchangeRate})`);
                  break;
                default:
                  storedShippingCost = shippingCostCNY / 7.2; // 默认转为美元
                  displayShippingCost = `$${storedShippingCost.toFixed(2)}`;
                  console.log(`💰 默认USD存储: $${storedShippingCost.toFixed(2)}`);
              }
              
              // 更新所有计算结果
              setAdminOrderEdits(prev => [
                {
                  ...prev[0],
                  pcb_price,
                  production_days,
                  delivery_date,
                  ship_price: storedShippingCost.toFixed(2),
                },
              ]);
              
              // 更新运费显示信息
              const courierNames = {
                'dhl': 'DHL',
                'fedex': 'FedEx', 
                'ups': 'UPS'
              };
              const courierDisplay = courierNames[pcbFormData.shippingAddress.courier as keyof typeof courierNames] || pcbFormData.shippingAddress.courier.toUpperCase();
              
              setShippingNotes({
                basicInfo: `${courierDisplay} 到 ${pcbFormData.shippingAddress.country.toUpperCase()}，运费: ${displayShippingCost}`,
                weightInfo: `实际重量: ${shippingResult.actualWeight}kg，体积重: ${shippingResult.volumetricWeight}kg，计费重量: ${shippingResult.chargeableWeight}kg`,
                costBreakdown: [
                  `基础运费: ¥${shippingResult.baseCost.toFixed(2)} CNY`,
                  `燃油附加费: ¥${shippingResult.fuelSurcharge.toFixed(2)} CNY`,
                  `旺季附加费: ¥${shippingResult.peakCharge.toFixed(2)} CNY`,
                  `最终运费: ¥${shippingCostCNY.toFixed(2)} CNY`,
                  `存储金额: ${displayShippingCost} (${currentCurrency})`,
                  `预计时效: ${shippingResult.deliveryTime}`
                ]
              });
              
            } catch (error) {
              console.error('专业运费计算失败，使用简化估算:', error);
              // 使用简化估算
              const currentCurrency = adminOrderEdits[0]?.currency || 'USD';
              const currentExchangeRate = Number(adminOrderEdits[0]?.exchange_rate) || 7.2;
              
              const fallbackShippingCNY = 108; // 15美元 * 7.2汇率 = 108人民币
              let storedShippingCost: number;
              let displayShippingCost: string;
              
              switch (currentCurrency) {
                case 'CNY':
                  storedShippingCost = fallbackShippingCNY;
                  displayShippingCost = `¥${fallbackShippingCNY.toFixed(2)}`;
                  break;
                case 'USD':
                  storedShippingCost = fallbackShippingCNY / currentExchangeRate;
                  displayShippingCost = `$${(fallbackShippingCNY / currentExchangeRate).toFixed(2)}`;
                  break;
                case 'EUR':
                  storedShippingCost = fallbackShippingCNY / currentExchangeRate;
                  displayShippingCost = `€${(fallbackShippingCNY / currentExchangeRate).toFixed(2)}`;
                  break;
                default:
                  storedShippingCost = fallbackShippingCNY / 7.2;
                  displayShippingCost = `$${(fallbackShippingCNY / 7.2).toFixed(2)}`;
              }
              
              // 更新所有计算结果
              setAdminOrderEdits(prev => [
                {
                  ...prev[0],
                  pcb_price,
                  production_days,
                  delivery_date,
                  ship_price: storedShippingCost.toFixed(2),
                },
              ]);
              
              setShippingNotes({
                basicInfo: `简化估算，运费: ${displayShippingCost}`,
                weightInfo: `缺少详细运输信息，使用默认估算`,
                costBreakdown: [
                  `简化估算: ¥${fallbackShippingCNY.toFixed(2)} CNY`,
                  `存储金额: ${displayShippingCost} (${currentCurrency})`,
                  `建议：完善收货地址以获得精确运费`
                ]
              });
            }
          });
        } else {
          // 没有运输信息时的简化计算
          const singleWeight = pcbFormData.singleDimensions ? 
            ((pcbFormData.singleDimensions.length * pcbFormData.singleDimensions.width * Number(pcbFormData.thickness || 1.6) * 1.8) / 1000000) : 0;
          const totalWeight = singleWeight * (pcbFormData.singleCount || pcbFormData.panelSet || 1);
          const packageWeight = 0.2;
          const finalWeight = totalWeight + packageWeight;
          
          // 获取当前币种设置
          const currentCurrency = adminOrderEdits[0]?.currency || 'USD';
          const currentExchangeRate = Number(adminOrderEdits[0]?.exchange_rate) || 7.2;
          
          // 基于重量的简化估算（人民币基准）
          let estimatedShippingCNY = 72; // 基础¥72 (相当于$10)
          if (finalWeight > 0.5) estimatedShippingCNY += 36; // 超重+¥36 (相当于$5)
          if (finalWeight > 1.0) estimatedShippingCNY += 36; // 重包+¥36 (相当于$5)
          
          // 根据币种转换存储金额
          let storedShippingCost: number;
          let displayShippingCost: string;
          
          switch (currentCurrency) {
            case 'CNY':
              storedShippingCost = estimatedShippingCNY;
              displayShippingCost = `¥${estimatedShippingCNY.toFixed(2)}`;
              break;
            case 'USD':
              storedShippingCost = estimatedShippingCNY / currentExchangeRate;
              displayShippingCost = `$${(estimatedShippingCNY / currentExchangeRate).toFixed(2)}`;
              break;
            case 'EUR':
              storedShippingCost = estimatedShippingCNY / currentExchangeRate;
              displayShippingCost = `€${(estimatedShippingCNY / currentExchangeRate).toFixed(2)}`;
              break;
            default:
              storedShippingCost = estimatedShippingCNY / 7.2;
              displayShippingCost = `$${(estimatedShippingCNY / 7.2).toFixed(2)}`;
          }
          
          // 更新所有计算结果
          setAdminOrderEdits(prev => [
            {
              ...prev[0],
              pcb_price,
              production_days,
              delivery_date,
              ship_price: storedShippingCost.toFixed(2),
            },
          ]);
          
          setShippingNotes({
            basicInfo: `基于重量估算，运费: ${displayShippingCost}`,
            weightInfo: `总重量: ${finalWeight.toFixed(3)} kg（含包装）`,
            costBreakdown: [
              `基础运费: ¥72.00 CNY`,
              `重量附加费: ¥${(estimatedShippingCNY - 72).toFixed(2)} CNY`,
              `估算运费: ¥${estimatedShippingCNY.toFixed(2)} CNY`,
              `存储金额: ${displayShippingCost} (${currentCurrency})`,
              `建议：添加收货地址以获得精确运费`
            ]
          });
        }
        
      } catch (error) {
        console.error('自动计算运费失败:', error);
        setShippingNotes({
          basicInfo: '运费计算失败',
          weightInfo: '无法计算重量信息',
          costBreakdown: ['运费计算失败，请检查规格参数']
        });
      }
      
      // 在所有计算完成后，确保价格计算正确
      setTimeout(() => {
        const currentValues = adminOrderEdits[0];
        if (currentValues && (currentValues.pcb_price || currentValues.ship_price)) {
          updatePriceCalculation(currentValues);
        }
      }, 100);
    }
  }, [pcbFormData, updatePriceCalculation]);

  // 当币种或汇率变化时，重新计算价格
  useEffect(() => {
    if (adminOrderEdits[0] && (adminOrderEdits[0].pcb_price || adminOrderEdits[0].ship_price)) {
      // 延迟执行，确保状态更新完成
      const timeoutId = setTimeout(() => {
        updatePriceCalculation(adminOrderEdits[0]);
      }, 50);
      
      return () => clearTimeout(timeoutId);
    }
  }, [adminOrderEdits[0]?.currency, adminOrderEdits[0]?.exchange_rate, updatePriceCalculation]);

  // 计算是否已创建管理员订单
  const isAdminOrderCreated = !!order?.admin_orders;
  const adminOrder = order ? getAdminOrders(order.admin_orders)[0] : null;

  // 字段更新函数
  const handleFieldChange = (field: string, value: unknown) => {
    setAdminOrderEdits(prev => {
        const newEdits = [...prev];
        if (newEdits.length > 0) {
            newEdits[0] = {
                ...newEdits[0],
                [field]: value
            };
        }
        return newEdits;
    });
};

  // 运费重算回调（用于价格管理面板）
  const handleCalcShipping = useCallback(() => {
    if (!pcbFormData) {
      toast.error('❌ PCB规格数据不完整，无法计算运费');
      return;
    }
    
    // 触发运费重新计算的逻辑已经在PriceManagementPanel内部实现
    // 这里只需要更新运费显示信息
    console.log('🚢 价格管理面板触发运费重算');
  }, [pcbFormData]);

  // 计算功能
  const handleCalcPCB = () => {
    if (!pcbFormData) {
      toast.error('❌ PCB规格数据不完整，无法计算价格');
      return;
    }
    
    try {
      const result = calcPcbPriceV3(pcbFormData);
      const pcbPriceCNY = Number(result.total); // PCB价格计算返回人民币
      
      // 获取当前币种设置
      const currentCurrency = adminOrderEdits[0]?.currency || 'USD';
      const currentExchangeRate = Number(adminOrderEdits[0]?.exchange_rate) || 7.2;
      
      // 根据币种转换PCB价格
      let pcb_price: string;
      let currencySymbol: string;
      
      switch (currentCurrency) {
        case 'CNY':
          pcb_price = pcbPriceCNY.toFixed(2);
          currencySymbol = '¥';
          break;
        case 'USD':
          pcb_price = (pcbPriceCNY / currentExchangeRate).toFixed(2);
          currencySymbol = '$';
          break;
        case 'EUR':
          pcb_price = (pcbPriceCNY / currentExchangeRate).toFixed(2);
          currencySymbol = '€';
          break;
        default:
          pcb_price = (pcbPriceCNY / currentExchangeRate).toFixed(2);
          currencySymbol = '$';
      }
      
      const values = { ...adminOrderEdits[0], pcb_price };
      updatePriceCalculation(values);
      
      setCalculationNotes([
        ...result.notes || [],
        `💡 PCB价格已转换为${currentCurrency}币种 (原始价格: ¥${pcbPriceCNY.toFixed(2)})`
      ]);
      
      toast.success(`🔧 PCB价格重新计算完成：${currencySymbol}${pcb_price}`);
      
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
      const pcbPriceCNY = Number(result.total); // PCB价格计算返回人民币
      
      // 获取当前币种设置
      const currentCurrency = adminOrderEdits[0]?.currency || 'USD';
      const currentExchangeRate = Number(adminOrderEdits[0]?.exchange_rate) || 7.2;
      
      // 根据币种转换PCB价格
      let pcb_price: string;
      switch (currentCurrency) {
        case 'CNY':
          pcb_price = pcbPriceCNY.toFixed(2);
          break;
        case 'USD':
          pcb_price = (pcbPriceCNY / currentExchangeRate).toFixed(2);
          break;
        case 'EUR':
          pcb_price = (pcbPriceCNY / currentExchangeRate).toFixed(2);
          break;
        default:
          pcb_price = (pcbPriceCNY / currentExchangeRate).toFixed(2);
      }
      
      // 计算交期
      const cycle = calcProductionCycle(pcbFormData, new Date(), pcbFormData?.delivery);
      const production_days = String(cycle.cycleDays);
      
      const today = new Date();
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + cycle.cycleDays);
      const delivery_date = targetDate.toISOString().split('T')[0];
      
      // 计算运费 - 使用专业运费计算器
      if (pcbFormData.shippingAddress?.country && pcbFormData.shippingAddress?.courier) {
        // 使用专业运费计算（异步）
        import('@/lib/shipping-calculator').then(async ({ calculateShippingCost }) => {
          try {
            const shippingResult = await calculateShippingCost(pcbFormData);
            const shippingCostCNY = shippingResult.finalCost; // 🔧 现在返回人民币金额
            
            // 获取当前币种设置
            const currentCurrency = adminOrderEdits[0]?.currency || 'USD';
            const currentExchangeRate = Number(adminOrderEdits[0]?.exchange_rate) || 7.2;
            
            // 🔧 重要：运费计算现在返回人民币，需要根据当前币种转换存储
            let storedShippingCost: number;
            let displayShippingCost: string;
            
            console.log(`🚢 运费计算: 原始人民币金额 ¥${shippingCostCNY.toFixed(2)}, 目标币种: ${currentCurrency}, 汇率: ${currentExchangeRate}`);
            
            switch (currentCurrency) {
              case 'CNY':
                // CNY币种：直接存储人民币金额
                storedShippingCost = shippingCostCNY;
                displayShippingCost = `¥${shippingCostCNY.toFixed(2)}`;
                console.log(`💰 CNY存储: ¥${storedShippingCost.toFixed(2)}`);
                break;
              case 'USD':
                // USD币种：人民币转美元
                storedShippingCost = shippingCostCNY / currentExchangeRate;
                displayShippingCost = `$${storedShippingCost.toFixed(2)}`;
                console.log(`💰 USD存储: $${storedShippingCost.toFixed(2)} (${shippingCostCNY} / ${currentExchangeRate})`);
                break;
              case 'EUR':
                // EUR币种：人民币转欧元
                storedShippingCost = shippingCostCNY / currentExchangeRate;
                displayShippingCost = `€${storedShippingCost.toFixed(2)}`;
                console.log(`💰 EUR存储: €${storedShippingCost.toFixed(2)} (${shippingCostCNY} / ${currentExchangeRate})`);
                break;
              default:
                storedShippingCost = shippingCostCNY / 7.2; // 默认转为美元
                displayShippingCost = `$${storedShippingCost.toFixed(2)}`;
                console.log(`💰 默认USD存储: $${storedShippingCost.toFixed(2)}`);
            }
            
            // 更新所有计算结果
            const values = {
              ...adminOrderEdits[0],
              pcb_price,
              production_days,
              delivery_date,
              ship_price: storedShippingCost.toFixed(2),
            };
            
            updatePriceCalculation(values);
            setCalculationNotes([
              ...result.notes || [],
              `💡 PCB价格已转换为${currentCurrency}币种 (原始价格: ¥${pcbPriceCNY.toFixed(2)})`
            ]);
            setDeliveryNotes(cycle.reason || []);
            
            // 更新运费显示信息
            const courierNames = {
              'dhl': 'DHL',
              'fedex': 'FedEx', 
              'ups': 'UPS'
            };
            const courierDisplay = courierNames[pcbFormData.shippingAddress.courier as keyof typeof courierNames] || pcbFormData.shippingAddress.courier.toUpperCase();
            
            setShippingNotes({
              basicInfo: `${courierDisplay} 到 ${pcbFormData.shippingAddress.country.toUpperCase()}，运费: ${displayShippingCost}`,
              weightInfo: `实际重量: ${shippingResult.actualWeight}kg，体积重: ${shippingResult.volumetricWeight}kg，计费重量: ${shippingResult.chargeableWeight}kg`,
              costBreakdown: [
                `基础运费: ¥${shippingResult.baseCost.toFixed(2)} CNY`,
                `燃油附加费: ¥${shippingResult.fuelSurcharge.toFixed(2)} CNY`,
                `旺季附加费: ¥${shippingResult.peakCharge.toFixed(2)} CNY`,
                `最终运费: ¥${shippingCostCNY.toFixed(2)} CNY`,
                `存储金额: ${displayShippingCost} (${currentCurrency})`,
                `预计时效: ${shippingResult.deliveryTime}`
              ]
            });
            
            toast.success('🔄 重新计算完成', {
              description: `价格、交期、运费已更新 - 运费: ${displayShippingCost}`,
              duration: 3000
            });
            
          } catch (error) {
            console.error('专业运费计算失败，使用简化估算:', error);
            // 使用简化估算
            const currentCurrency = adminOrderEdits[0]?.currency || 'USD';
            const currentExchangeRate = Number(adminOrderEdits[0]?.exchange_rate) || 7.2;
            
            const fallbackShippingCNY = 108; // 15美元 * 7.2汇率 = 108人民币
            let storedShippingCost: number;
            let displayShippingCost: string;
            
            switch (currentCurrency) {
              case 'CNY':
                storedShippingCost = fallbackShippingCNY;
                displayShippingCost = `¥${fallbackShippingCNY.toFixed(2)}`;
                break;
              case 'USD':
                storedShippingCost = fallbackShippingCNY / currentExchangeRate;
                displayShippingCost = `$${(fallbackShippingCNY / currentExchangeRate).toFixed(2)}`;
                break;
              case 'EUR':
                storedShippingCost = fallbackShippingCNY / currentExchangeRate;
                displayShippingCost = `€${(fallbackShippingCNY / currentExchangeRate).toFixed(2)}`;
                break;
              default:
                storedShippingCost = fallbackShippingCNY / 7.2;
                displayShippingCost = `$${(fallbackShippingCNY / 7.2).toFixed(2)}`;
            }
            
            const values = {
              ...adminOrderEdits[0],
              pcb_price,
              production_days,
              delivery_date,
              ship_price: storedShippingCost.toFixed(2),
            };
            
            updatePriceCalculation(values);
            setCalculationNotes([
              ...result.notes || [],
              `💡 PCB价格已转换为${currentCurrency}币种 (原始价格: ¥${pcbPriceCNY.toFixed(2)})`
            ]);
            setDeliveryNotes(cycle.reason || []);
            
            toast.success('🔄 重新计算完成', {
              description: `价格、交期已更新，运费使用简化估算: ${displayShippingCost}`,
              duration: 3000
            });
          }
        });
      } else {
        // 没有运输信息时的简化估算
        const totalArea = Number(pcbFormData.singleDimensions?.length || 0) * Number(pcbFormData.singleDimensions?.width || 0) * Number(pcbFormData.singleCount || 1) / 10000;
        const isUrgent = pcbFormData.delivery === 'urgent';
        
        // 使用已获取的币种设置（避免重复获取）
        
        let estimatedShippingCNY = 72; // 基础¥72人民币 (相当于$10)
        if (totalArea <= 0.1) {
          estimatedShippingCNY = isUrgent ? 144 : 86; // 相当于$20或$12
        } else if (totalArea <= 0.5) {
          estimatedShippingCNY = isUrgent ? 252 : 130; // 相当于$35或$18
        } else {
          estimatedShippingCNY = isUrgent ? 360 : 180; // 相当于$50或$25
        }
        
        // 根据币种转换存储金额
        let storedShippingCost: number;
        let displayShippingCost: string;
        
        switch (currentCurrency) {
          case 'CNY':
            storedShippingCost = estimatedShippingCNY;
            displayShippingCost = `¥${estimatedShippingCNY.toFixed(2)}`;
            break;
          case 'USD':
            storedShippingCost = estimatedShippingCNY / currentExchangeRate;
            displayShippingCost = `$${(estimatedShippingCNY / currentExchangeRate).toFixed(2)}`;
            break;
          case 'EUR':
            storedShippingCost = estimatedShippingCNY / currentExchangeRate;
            displayShippingCost = `€${(estimatedShippingCNY / currentExchangeRate).toFixed(2)}`;
            break;
          default:
            storedShippingCost = estimatedShippingCNY / 7.2;
            displayShippingCost = `$${(estimatedShippingCNY / 7.2).toFixed(2)}`;
        }
        
        // 更新所有计算结果
        const values = {
          ...adminOrderEdits[0],
          pcb_price,
          production_days,
          delivery_date,
          ship_price: storedShippingCost.toFixed(2),
        };
        
        updatePriceCalculation(values);
        setCalculationNotes([
          ...result.notes || [],
          `💡 PCB价格已转换为${currentCurrency}币种 (原始价格: ¥${pcbPriceCNY.toFixed(2)})`
        ]);
        setDeliveryNotes(cycle.reason || []);
        
        toast.success('🔄 重新计算完成', {
          description: `价格、交期、运费已更新 - 运费估算: ${displayShippingCost}`,
          duration: 3000
        });
      }
      
    } catch (error) {
      console.error('重新计算失败:', error);
      toast.error('重新计算失败，请检查PCB规格参数');
    }
  };

  // 保存功能
  const handleSave = async (values: Record<string, unknown>, options?: { sendNotification?: boolean; notificationType?: string }) => {
    if (!orderId) return;
    try {
      const cleanedValues = JSON.parse(JSON.stringify(values));
      
      // 🔍 提交前币种检查：确保币种设置为美元
      if (cleanedValues.status === 'reviewed' && cleanedValues.currency !== 'USD') {
        toast.error('⚠️ 币种检查失败', {
          description: `订单提交前必须设置为美元(USD)，当前币种: ${cleanedValues.currency}`,
          duration: 5000
        });
        return; // 阻止保存
      }
      
      // 🔧 确保CNY币种时汇率为1.0
      if (cleanedValues.currency === 'CNY') {
        cleanedValues.exchange_rate = '1.0';
      }
      
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
          // 🔧 确保数据类型正确
          exchange_rate: String(admin.exchange_rate || (admin.currency === 'CNY' ? '1.0' : '7.2')),
          pcb_price: String(admin.pcb_price || ''),
          ship_price: String(admin.ship_price || ''),
          custom_duty: String(admin.custom_duty || ''),
          coupon: String(admin.coupon || '0'),
          currency: admin.currency || 'USD',
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

  // 退款审核处理函数
  const handleRefundReview = async (action: 'approve' | 'reject') => {
    setIsReviewingRefund(true);
    try {
      if (action === 'approve' && (isNaN(parseFloat(refundReviewAmount)) || parseFloat(refundReviewAmount) < 0)) {
        throw new Error("请输入有效的退款金额");
      }
      if (!refundReviewReason) {
        throw new Error("请提供处理说明");
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
      if (!response.ok) throw new Error(data.error || '退款审核失败');
      
      toast.success(`退款申请已${action === 'approve' ? '批准' : '拒绝'}`);
      fetchOrder(); // 刷新数据
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsReviewingRefund(false);
    }
  };

  // Stripe退款处理函数
  const handleProcessStripeRefund = async () => {
    setIsProcessingStripeRefund(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/process-refund`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Stripe退款处理失败');

      toast.success('Stripe退款处理成功！');
      fetchOrder(); // 刷新数据
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
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p className="text-lg font-semibold">订单未找到</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 md:p-4 space-y-3 md:space-y-4">
      {/* 页面标题 */}
      <PageHeader order={order} adminOrder={adminOrder} />

      {/* 移动端管理面板 - 只在小屏幕上显示 */}
      <div className="xl:hidden">
        <div className="bg-white border rounded-lg sticky top-2 z-10 shadow-md">
          <div 
            className="bg-gray-50 px-3 py-2 border-b cursor-pointer flex items-center justify-between"
            onClick={() => setIsMobilePanelExpanded(!isMobilePanelExpanded)}
          >
            <h3 className="text-sm font-semibold text-gray-800">管理面板</h3>
            <div className="flex items-center gap-2">
              {!isAdminOrderCreated && (
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">待创建</span>
              )}
              <svg 
                className={`w-4 h-4 transition-transform ${isMobilePanelExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          {isMobilePanelExpanded && (
            <div className="p-3 space-y-3 max-h-96 overflow-y-auto">
              {/* 价格管理 - 简化版 */}
              <div className="border rounded p-2">
                <h4 className="text-xs font-medium text-gray-700 mb-2">价格管理</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600">PCB价格:</span>
                    <div className="font-mono">{getCurrencySymbol(String(adminOrderEdits[0]?.currency || 'USD'))}{String(adminOrderEdits[0]?.pcb_price || '0.00')}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">运费:</span>
                    <div className="font-mono">{getCurrencySymbol(String(adminOrderEdits[0]?.currency || 'USD'))}{String(adminOrderEdits[0]?.ship_price || '0.00')}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">总价:</span>
                    <div className="font-mono font-semibold text-green-600">
                      {getCurrencySymbol(String(adminOrderEdits[0]?.currency || 'USD'))}{String(adminOrderEdits[0]?.admin_price || '0.00')}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">状态:</span>
                    <div className="text-sm">
                      <Badge className={getStatusColor(String(adminOrderEdits[0]?.status || 'created'))} variant="outline">
                        {getStatusLabel(String(adminOrderEdits[0]?.status || 'created'))}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* 管理操作按钮 */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRecalc}
                  disabled={!pcbFormData}
                  className="text-xs"
                >
                  🔄 重新计算
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSave(adminOrderEdits[0] || {})}
                  disabled={isUpdating}
                  className="text-xs bg-blue-600 hover:bg-blue-700"
                >
                  {isUpdating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : '💾 保存'}
                </Button>
              </div>
              
              {/* 详细设置按钮 */}
              <Button
                size="sm"
                variant="ghost"
                className="w-full text-xs text-gray-600"
                onClick={() => setIsMobilePanelExpanded(false)}
              >
                收起面板 ↑
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 主要内容区域 - 响应式布局 */}
      <div className="flex flex-col xl:grid xl:grid-cols-12 gap-3 md:gap-4">
        {/* 左侧：订单详情 */}
        <div className="xl:col-span-9 space-y-3 md:space-y-4">
          {/* 订单概览 */}
          <OrderOverview order={order} pcbFormData={pcbFormData} adminOrder={adminOrder} />

          {/* 技术规格审核 - 根据产品类型显示不同组件 */}
          {(() => {
            const productType = pcbFormData?.productType || 
              (pcbFormData?.borderType ? 'stencil' : 'pcb');
            
            if (productType === 'stencil') {
              return (
                <StencilSpecReview 
                  stencilFormData={pcbFormData as any}
                  shippingAddress={order?.shipping_address as any}
                />
              );
            } else {
              return (
                <PCBSpecReview 
                  pcbFormData={pcbFormData as QuoteFormData | null} 
                  shippingAddress={order?.shipping_address as AddressFormValue | null}
                />
              );
            }
          })()}
          
          {/* 价格管理 */}
          <PriceManagementPanel 
            adminOrderEdit={adminOrderEdits[0] || adminOrderDefaultValues}
            onUpdatePrice={updatePriceCalculation}
            onFieldChange={handleFieldChange}
            pcbFormData={pcbFormData as Record<string, unknown> | undefined}
            onCalcShipping={handleCalcShipping}
          />
        </div>

        {/* 右侧：管理员操作面板 - 只在大屏幕上显示 */}
        <div className="hidden xl:block xl:col-span-3 space-y-3 md:space-y-4">
          {/* 审核状态 */}
          <ReviewStatusPanel pcbFormData={pcbFormData} />

          {/* 计算结果面板 */}
          <CalculationResultPanels 
            pcbFormData={pcbFormData as QuoteFormData | null}
            calculationNotes={calculationNotes}
            deliveryNotes={deliveryNotes}
            shippingNotes={shippingNotes}
          />

          {/* 管理操作 */}
          <ManagementActionsPanel 
            pcbFormData={pcbFormData}
            isUpdating={isUpdating}
            isAdminOrderCreated={isAdminOrderCreated}
            onCalcPCB={handleCalcPCB}
            onCalcDelivery={handleCalcDelivery}
            onRecalc={handleRecalc}
            onSave={() => handleSave(adminOrderEdits[0] || {})}
            onSaveAndNotify={() => handleSave(adminOrderEdits[0] || {}, { sendNotification: true, notificationType: 'order_updated' })}
          />

          {/* 退款处理 */}
          {adminOrder?.refund_status === 'requested' && (
            <div className="bg-white border border-yellow-400 rounded">
              <div className="bg-yellow-50 px-3 py-2 border-b">
                <h3 className="text-sm font-semibold text-yellow-700 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  退款申请
                </h3>
                <p className="text-xs text-yellow-600">
                  申请金额: ¥{adminOrder.requested_refund_amount || '0.00'}
                </p>
              </div>
              <div className="p-3 space-y-2">
                <div>
                  <label className="text-xs">批准金额</label>
                  <input
                    type="number"
                    placeholder="输入退款金额"
                    value={refundReviewAmount}
                    onChange={(e) => setRefundReviewAmount(e.target.value)}
                    disabled={isReviewingRefund}
                    className="mt-1 h-7 text-xs w-full border border-gray-300 rounded px-2"
                  />
                </div>
                <div>
                  <label className="text-xs">处理说明</label>
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
                    disabled={isReviewingRefund}
                    className="flex-1 text-xs"
                    onClick={() => handleRefundReview('reject')}
                  >
                    {isReviewingRefund ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : '拒绝'}
                  </Button>
                  <Button
                    size="sm"
                    disabled={isReviewingRefund}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-xs"
                    onClick={() => handleRefundReview('approve')}
                  >
                    {isReviewingRefund ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : '批准'}
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
                  批准金额: ¥{adminOrder.approved_refund_amount || '0.00'}
                </p>
              </div>
              <div className="p-3">
                <Button
                  disabled={isProcessingStripeRefund}
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700 text-xs"
                  onClick={handleProcessStripeRefund}
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