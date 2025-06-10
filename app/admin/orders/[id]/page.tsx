/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { useParams } from 'next/navigation';
import { quoteSchema, QuoteFormData } from '@/app/quote2/schema/quoteSchema';
import { calcProductionCycle } from '@/lib/productCycleCalc-v3';
import { calcPcbPriceV3 } from '@/lib/pcb-calc-v3';
import { OrderOverviewTabs } from '@/app/admin/components/OrderOverviewTabs';
import { AdminOrderForm } from '@/app/admin/components/AdminOrderForm';
import { Order, AdminOrder } from '@/app/admin/types/order';

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
  const hasInitAdminOrderEdits = useRef(false);

  // 1. 定义默认值
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
    surcharges: [], // 现在是空数组，不是空字符串
    // 可根据实际表单字段补充更多默认值
  };

  // 获取订单数据
  const fetchOrder = async (): Promise<Order | undefined> => {
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
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    if (!hasInitAdminOrderEdits.current) {
      if (order?.admin_orders) {
        const adminOrders = getAdminOrders(order.admin_orders);
        setAdminOrderEdits(
          adminOrders.map(admin => ({ ...admin }))
        );
      } else {
        setAdminOrderEdits([adminOrderDefaultValues]);
      }
      hasInitAdminOrderEdits.current = true;
    }
  }, [order?.admin_orders]);

  // 计算是否已创建管理员订单
  const isAdminOrderCreated = !!order?.admin_orders;

  // 保存
  const handleSave = async (values: Record<string, unknown>) => {
    if (!orderId) return;
    try {
      const method = isAdminOrderCreated ? 'PATCH' : 'POST';
      const response = await fetch(`/api/admin/orders/${orderId}/admin-order`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error(isAdminOrderCreated ? '保存失败' : '创建失败');
      toast.success(isAdminOrderCreated ? '保存成功' : '创建成功');
      await fetchOrder(); // 等待后端返回最新数据
      hasInitAdminOrderEdits.current = false; // 让 useEffect 用新 order 初始化表单
    } catch {
      toast.error(isAdminOrderCreated ? '保存失败' : '创建失败');
    }
  };

  // 重新计算
  const handleRecalc = (values: Record<string, unknown>) => {
    if (!pcbFormData) return;
    let pcb_price = values.pcb_price as string || '';
    let cny_price = values.cny_price as string || '';
    let admin_price = values.admin_price as string || '';
    let newProductionDays = values.production_days as string || '';
    let priceNotes: string[] = [];
    const deliveryNotes: string[] = [];
    
    // 处理加价项：现在是数组格式
    let surcharges: Array<{name: string, amount: number}> = [];
    if (Array.isArray(values.surcharges)) {
      surcharges = values.surcharges;
    } else if (typeof values.surcharges === 'string') {
      // 兼容旧的JSON字符串格式
      try {
        surcharges = JSON.parse(values.surcharges);
      } catch {
        surcharges = [];
      }
    }
    
    // 1. 计算纯PCB价格
    try {
      const result = calcPcbPriceV3(pcbFormData);
      pcb_price = Number(result.total).toFixed(2);
      priceNotes = result.notes || [];
      // 注意：这里先不设置 cny_price，等所有费用计算完成后再设置
    } catch {}
    
    // 2. 计算生产天数和交期
    let deliveryDate = '';
    try {
      const cycle = calcProductionCycle(pcbFormData, new Date(), pcbFormData?.delivery);
      newProductionDays = String(cycle.cycleDays);
      
      // 保存交期计算备注
      setDeliveryNotes(cycle.reason || []);
      
      // 计算预计交期（当前日期 + 生产天数）
      const today = new Date();
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + cycle.cycleDays);
      deliveryDate = targetDate.toISOString().split('T')[0]; // 格式化为 YYYY-MM-DD
    } catch {}
    
    // 3. 计算运费（如果有收货地址信息）
    const estimatedShippingCost = Number(values.ship_price) || 0;
    if (pcbFormData.shippingAddress?.country && pcbFormData.shippingAddress?.courier) {
      try {
        import('@/lib/shipping-calculator').then(({ calculateShippingCost }) => {
          const shippingResult = calculateShippingCost(pcbFormData);
          const finalShippingCost = Math.round(shippingResult.finalCost * 7.2);
          
          // 保存详细运费备注
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
          
          // 重新计算总价（包含新的运费）
          const pcb_price = Number(values.pcb_price) || 0;
          const custom_duty = Number(values.custom_duty) || 0;
          const coupon = Number(values.coupon) || 0;
          
          // 处理加价项
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
          
          // 计算CNY总价 = PCB价格 + 运费 + 关税 + 加价项 - 优惠券
          const cny_price = (pcb_price + finalShippingCost + custom_duty + surchargeTotal - coupon).toFixed(2);
          
          // 重新计算admin_price（考虑汇率）
          const currency = values.currency as string || 'USD';
          const exchange_rate = Number(values.exchange_rate) || 7.2;
          const admin_price = currency === 'CNY' ? cny_price : (Number(cny_price) / exchange_rate).toFixed(2);
          
          setAdminOrderEdits([
            {
              ...values,
              ship_price: finalShippingCost,
              cny_price,
              admin_price,
            },
          ]);
        }).catch(() => {
          // 运费计算失败，使用简单估算
          const totalArea = Number(pcbFormData.singleDimensions?.length || 0) * Number(pcbFormData.singleDimensions?.width || 0) * Number(pcbFormData.singleCount || 1) / 10000;
          const isUrgent = pcbFormData.delivery === 'urgent';
          const simpleShippingCost = totalArea <= 0.1 ? (isUrgent ? 150 : 80) : totalArea <= 0.5 ? (isUrgent ? 250 : 120) : (isUrgent ? 350 : 180);
          
          setShippingNotes({
            basicInfo: '简单估算（缺少详细收货信息）',
            weightInfo: `PCB面积：${totalArea.toFixed(4)}㎡`,
            costBreakdown: [
              `包裹类型：${totalArea <= 0.1 ? '小件' : totalArea <= 0.5 ? '中件' : '大件'}包裹${isUrgent ? '（加急）' : '（标准）'}`,
              `估算运费：¥${simpleShippingCost}`
            ]
          });
        });
      } catch {}
    } else {
      // 没有收货地址信息，清空运费备注
      setShippingNotes({
        basicInfo: '',
        weightInfo: '',
        costBreakdown: []
      });
    }
    
    // 4. 计算管理员价格 = PCB价格 + 运费 + 关税 + 加价项（考虑汇率）
    const currency = values.currency as string || 'USD';
    const exchange_rate = Number(values.exchange_rate) || 7.2;
    const ship_price = estimatedShippingCost;
    const custom_duty = Number(values.custom_duty) || 0;
    const coupon = Number(values.coupon) || 0;
    const surchargeTotal = surcharges.reduce((sum: number, s: {name: string, amount: number}) => sum + Number(s.amount || 0), 0);
    
    // 所有费用都以CNY计算
    const totalCnyPrice = Number(pcb_price) + ship_price + custom_duty + surchargeTotal - coupon;
    
    // 根据币种转换最终价格
    const adminPriceNum = currency === 'CNY' ? totalCnyPrice : totalCnyPrice / exchange_rate;
    admin_price = adminPriceNum.toFixed(2);
    
    // 更新CNY价格为最终的人民币总价
    cny_price = totalCnyPrice.toFixed(2);
    
    // 处理管理员备注
    const admin_note = values.admin_note as string || '';
    
    // 保存所有计算备注
    setCalculationNotes(priceNotes);
    
    setAdminOrderEdits([
      {
        ...values,
        pcb_price,
        admin_price,
        cny_price,
        production_days: newProductionDays,
        delivery_date: deliveryDate,
        ship_price,
        admin_note,
        surcharges, // 现在直接使用数组，不需要转换为JSON字符串
      },
    ]);
    toast.success('已重新计算，所有明细已更新');
  };

  // 单独计算PCB价格
  const handleCalcPCB = (values: Record<string, unknown>) => {
    if (!pcbFormData) {
      toast.error('PCB规格数据不完整，无法计算价格');
      return;
    }
    
    let pcb_price = values.pcb_price as string || '';
    let priceNotes: string[] = [];
    
    try {
      // 1. 只计算纯PCB价格
      const result = calcPcbPriceV3(pcbFormData);
      pcb_price = Number(result.total).toFixed(2);
      priceNotes = result.notes || [];
      
      // 2. 重新计算cny_price（基于当前的其他费用）
      const ship_price = Number(values.ship_price) || 0;
      const custom_duty = Number(values.custom_duty) || 0;
      const coupon = Number(values.coupon) || 0;
      
      // 处理加价项
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
      
      // 计算CNY总价 = PCB价格 + 运费 + 关税 + 加价项 - 优惠券
      const cny_price = (Number(pcb_price) + ship_price + custom_duty + surchargeTotal - coupon).toFixed(2);
      
      // 重新计算admin_price（考虑汇率）
      const currency = values.currency as string || 'USD';
      const exchange_rate = Number(values.exchange_rate) || 7.2;
      const admin_price = currency === 'CNY' ? cny_price : (Number(cny_price) / exchange_rate).toFixed(2);
      
      // 3. 更新状态
      setAdminOrderEdits([
        {
          ...values,
          pcb_price,
          cny_price,
          admin_price,
        },
      ]);
      
      // 4. 单独保存计算备注
      setCalculationNotes(priceNotes);
      
      toast.success(`PCB价格计算完成：¥${pcb_price}，总价已更新：¥${cny_price}`);
      
    } catch (error) {
      console.error('PCB价格计算失败:', error);
      toast.error('PCB价格计算失败，请检查PCB规格');
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
      // 计算生产周期
      const cycle = calcProductionCycle(pcbFormData, new Date(), pcbFormData?.delivery);
      newProductionDays = String(cycle.cycleDays);
      
      // 保存交期计算备注
      setDeliveryNotes(cycle.reason || []);
      
      // 计算预计交期（当前日期 + 生产天数）
      const today = new Date();
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + cycle.cycleDays);
      deliveryDate = targetDate.toISOString().split('T')[0];
      
      // 使用完整的运费计算逻辑
      if (pcbFormData.shippingAddress?.country && pcbFormData.shippingAddress?.courier) {
        try {
          // 动态导入运费计算模块
          import('@/lib/shipping-calculator').then(({ calculateShippingCost }) => {
            const shippingResult = calculateShippingCost(pcbFormData);
            const finalShippingCost = Math.round(shippingResult.finalCost * 7.2); // 转换为人民币，假设汇率7.2
            
            // 保存详细运费备注
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
            
            setAdminOrderEdits([
              {
                ...values,
                production_days: newProductionDays,
                delivery_date: deliveryDate,
                ship_price: finalShippingCost,
              },
            ]);
            
            toast.success(
              `交期计算完成：${newProductionDays}天（${deliveryDate}）\n` +
              `运费详情：$${shippingResult.finalCost.toFixed(2)} (¥${finalShippingCost})\n` +
              `实际重量：${shippingResult.actualWeight}kg，体积重：${shippingResult.volumetricWeight}kg\n` +
              `计费重量：${shippingResult.chargeableWeight}kg，快递：${pcbFormData.shippingAddress.courier.toUpperCase()}`
            );
          }).catch(() => {
            // 如果运费计算失败，使用简单估算
            throw new Error('运费计算模块加载失败');
          });
          return; // 异步处理，提前返回
        } catch (shippingError) {
          console.warn('运费计算失败，使用简单估算:', shippingError);
        }
      }
      
      // 简单运费估算（备用方案）
      const totalArea = Number(pcbFormData.singleDimensions?.length || 0) * Number(pcbFormData.singleDimensions?.width || 0) * Number(pcbFormData.singleCount || 1) / 10000; // 转换为平方米
      const isUrgent = pcbFormData.delivery === 'urgent';
      
      // 运费估算逻辑
      if (totalArea <= 0.1) {
        estimatedShippingCost = isUrgent ? 150 : 80; // 小件
        shippingDetails = '小件包裹';
      } else if (totalArea <= 0.5) {
        estimatedShippingCost = isUrgent ? 250 : 120; // 中件
        shippingDetails = '中等包裹';
      } else {
        estimatedShippingCost = isUrgent ? 350 : 180; // 大件
        shippingDetails = '大件包裹';
      }
      
      shippingDetails += isUrgent ? '（加急）' : '（标准）';
      
      // 保存简单估算备注
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
      toast.error('计算交期失败，请检查PCB规格');
      return;
    }
    
    // 重新计算总价（包含新的运费）
    const pcb_price = Number(values.pcb_price) || 0;
    const custom_duty = Number(values.custom_duty) || 0;
    const coupon = Number(values.coupon) || 0;
    
    // 处理加价项
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
    
    // 计算CNY总价 = PCB价格 + 运费 + 关税 + 加价项 - 优惠券
    const cny_price = (pcb_price + estimatedShippingCost + custom_duty + surchargeTotal - coupon).toFixed(2);
    
    // 重新计算admin_price（考虑汇率）
    const currency = values.currency as string || 'USD';
    const exchange_rate = Number(values.exchange_rate) || 7.2;
    const admin_price = currency === 'CNY' ? cny_price : (Number(cny_price) / exchange_rate).toFixed(2);
    
    setAdminOrderEdits([
      {
        ...values,
        production_days: newProductionDays,
        delivery_date: deliveryDate,
        ship_price: estimatedShippingCost,
        cny_price,
        admin_price,
      },
    ]);
    
    toast.success(`交期计算完成：${newProductionDays}天（${deliveryDate}），运费估算：¥${estimatedShippingCost}${shippingDetails ? ` (${shippingDetails})` : ''}`);
  };

  // 单独计算运费
  const handleCalcShipping = (values: Record<string, unknown>) => {
    if (!pcbFormData) {
      toast.error('PCB规格数据不完整，无法计算运费');
      return;
    }
    
    let estimatedShippingCost = 0;
    let shippingDetails = '';
    
    try {
      // 优先使用完整的运费计算逻辑
      if (pcbFormData.shippingAddress?.country && pcbFormData.shippingAddress?.courier) {
        import('@/lib/shipping-calculator').then(({ calculateShippingCost }) => {
          const shippingResult = calculateShippingCost(pcbFormData);
          const finalShippingCost = Math.round(shippingResult.finalCost * 7.2); // 转换为人民币
          
          // 保存详细运费备注
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
          
          setAdminOrderEdits([
            {
              ...values,
              ship_price: finalShippingCost,
            },
          ]);
          
          toast.success(
            `运费计算完成：$${shippingResult.finalCost.toFixed(2)} (¥${finalShippingCost})\n` +
            `快递公司：${pcbFormData.shippingAddress.courier.toUpperCase()}\n` +
            `目的地：${pcbFormData.shippingAddress.country}\n` +
            `实际重量：${shippingResult.actualWeight}kg\n` +
            `体积重量：${shippingResult.volumetricWeight}kg\n` +
            `计费重量：${shippingResult.chargeableWeight}kg\n` +
            `基础运费：$${shippingResult.baseCost.toFixed(2)}\n` +
            `燃油附加费：$${shippingResult.fuelSurcharge.toFixed(2)}\n` +
            `旺季附加费：$${shippingResult.peakCharge.toFixed(2)}`
          );
        }).catch((error) => {
          console.error('运费计算失败:', error);
          toast.error('运费计算失败：' + error.message);
        });
        return;
      }
      
      // 简单估算（备用方案）
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
      
      // 保存简单估算备注
      setShippingNotes({
        basicInfo: '简单估算（缺少详细收货信息）',
        weightInfo: `PCB面积：${totalArea.toFixed(4)}㎡`,
        costBreakdown: [
          `包裹类型：${shippingDetails}`,
          `估算运费：¥${estimatedShippingCost}`
        ]
      });
      
      setAdminOrderEdits([
        {
          ...values,
          ship_price: estimatedShippingCost,
        },
      ]);
      
      toast.success(`运费估算完成：¥${estimatedShippingCost} (${shippingDetails})\n面积：${totalArea.toFixed(4)}㎡`);
      
    } catch (error) {
      console.error('运费计算失败:', error);
      toast.error('运费计算失败，请检查PCB规格和收货地址');
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
  };

  // PCB参数字段分组及条件显示配置
  // 类型声明
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
        { key: 'pcbNote', shouldShow: () => true },
        { key: 'gerberUrl', shouldShow: () => true },
        { key: 'shippingCostEstimation', shouldShow: () => true },
        { key: 'shippingAddress', shouldShow: () => true },
        { key: 'customs', shouldShow: () => true },
        { key: 'customsNote', shouldShow: () => true },
        { key: 'userNote', shouldShow: () => true },
      ],
    },
  ];

  if (loading) {
    return <div className="w-full p-2 md:p-4">Loading...</div>;
  }
  if (error) {
    return <div className="w-full p-2 md:p-4 text-red-600">Error: {error}</div>;
  }
  if (!order) {
    return <div className="w-full p-2 md:p-4">Order not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="container mx-auto px-4 py-6">
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
          <p className="text-gray-600">订单编号: {order.id}</p>
        </div>

        {/* 主内容区 */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* 左侧管理员表单 */}
          <div className="xl:col-span-3">
            {!isAdminOrderCreated && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-center gap-2 text-amber-800">
                  <span className="text-lg">⚠️</span>
                  <span className="font-medium">还未创建管理员订单</span>
                </div>
                <p className="text-sm text-amber-700 mt-1">请填写并创建管理员订单信息</p>
              </div>
            )}
            <div className="sticky top-6">
              <AdminOrderForm
                initialValues={adminOrderEdits[0] || {}}
                onSave={handleSave}
                onRecalc={handleRecalc}
                onCalcPCB={handleCalcPCB}
                onCalcDelivery={handleCalcDelivery}
                onCalcShipping={handleCalcShipping}
                readOnly={false}
                submitButtonText={isAdminOrderCreated ? '保存' : '创建'}
              />
            </div>
          </div>

          {/* 右侧信息区 */}
          <div className="xl:col-span-2 space-y-6">
            {/* 价格明细卡片 - 重新设计 */}
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
                          ¥{(order.cal_values as any)?.totalPrice || order.cal_values.price || '0'}
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <div className="text-sm text-blue-600 font-medium mb-1">PCB价格</div>
                        <div className="text-xl font-bold text-blue-700">
                          ¥{(order.cal_values as any)?.pcbPrice || order.cal_values.price || '0'}
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                        <div className="text-sm text-purple-600 font-medium mb-1">单价</div>
                        <div className="text-xl font-bold text-purple-700">
                          ¥{(order.cal_values as any)?.unitPrice || (order.cal_values.price && order.cal_values.totalQuantity ? (order.cal_values.price / order.cal_values.totalQuantity).toFixed(2) : '0')}
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

                    {/* 费用分解 */}
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
                            <span className="text-gray-600">多层铜厚</span>
                            <span className="font-semibold text-gray-900">¥{order.cal_values.priceDetail.multilayerCopperWeight || '0'}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-600">工程费用</span>
                            <span className="font-semibold text-gray-900">¥{order.cal_values.priceDetail.engFee || '0'}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-600">板厚费用</span>
                            <span className="font-semibold text-gray-900">¥{order.cal_values.priceDetail.thickness || '0'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 其他费用 - 使用默认值或显示暂无 */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        💳 其他费用
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-600">运费</span>
                          <span className="font-semibold text-gray-900">¥{(order.cal_values as any)?.shippingCost || '0'}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-600">税费</span>
                          <span className="font-semibold text-gray-900">¥{(order.cal_values as any)?.tax || '0'}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-600">折扣</span>
                          <span className="font-semibold text-gray-900">-¥{(order.cal_values as any)?.discount || '0'}</span>
                        </div>
                      </div>
                    </div>

                    {/* 时间信息 */}
                    {((order.cal_values as any)?.estimatedFinishDate || (order.cal_values as any)?.courierDays) && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                          ⏰ 时间信息
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(order.cal_values as any)?.estimatedFinishDate && (
                            <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                              <span className="text-indigo-600">预计完成</span>
                              <span className="font-semibold text-indigo-800">{(order.cal_values as any).estimatedFinishDate}</span>
                            </div>
                          )}
                          {(order.cal_values as any)?.courierDays && (
                            <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                              <span className="text-indigo-600">快递天数</span>
                              <span className="font-semibold text-indigo-800">{(order.cal_values as any).courierDays} 天</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 订单限制 */}
                    {(order.cal_values as any)?.courier && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                          📋 订单信息
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                            <span className="text-yellow-600">快递方式</span>
                            <span className="font-semibold text-yellow-800">{(order.cal_values as any).courier}</span>
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

            {/* 计算备注卡片 */}
            {calculationNotes.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-600 px-6 py-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    📋 价格计算明细
                    <span className="px-2 py-1 bg-white/20 text-white text-xs rounded-full font-medium">
                      {calculationNotes.length} 项
                    </span>
                  </h3>
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
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-800">
                      <span className="text-sm">ℹ️</span>
                      <span className="text-sm font-medium">审核提示</span>
                    </div>
                    <p className="text-xs text-amber-700 mt-1">
                      以上是系统根据PCB规格自动计算的价格明细，请仔细审核各项费用是否合理
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 交期计算备注卡片 */}
            {deliveryNotes.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    📅 交期计算明细
                    <span className="px-2 py-1 bg-white/20 text-white text-xs rounded-full font-medium">
                      {deliveryNotes.length} 项
                    </span>
                  </h3>
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
                  <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <div className="flex items-center gap-2 text-indigo-800">
                      <span className="text-sm">⏰</span>
                      <span className="text-sm font-medium">生产提示</span>
                    </div>
                    <p className="text-xs text-indigo-700 mt-1">
                      交期计算基于PCB规格、特殊工艺、面积等因素，实际生产时间可能因工厂排期而调整
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 运费计算备注卡片 */}
            {(shippingNotes.basicInfo || shippingNotes.costBreakdown.length > 0) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-red-600 px-6 py-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    🚚 运费计算明细
                    <span className="px-2 py-1 bg-white/20 text-white text-xs rounded-full font-medium">
                      详细
                    </span>
                  </h3>
                </div>
                <div className="p-6">
                  {/* 基础信息 */}
                  {shippingNotes.basicInfo && (
                    <div className="mb-4 p-3 bg-orange-50/50 rounded-lg border border-orange-100">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-orange-800">📦 运输方式</span>
                      </div>
                      <p className="text-sm text-gray-700">{shippingNotes.basicInfo}</p>
                    </div>
                  )}
                  
                  {/* 重量信息 */}
                  {shippingNotes.weightInfo && (
                    <div className="mb-4 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-blue-800">⚖️ 重量信息</span>
                      </div>
                      <p className="text-sm text-gray-700">{shippingNotes.weightInfo}</p>
                    </div>
                  )}
                  
                  {/* 费用明细 */}
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
                  
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <span className="text-sm">🚛</span>
                      <span className="text-sm font-medium">物流提示</span>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">
                      运费计算基于包裹重量、体积、目的地等因素，实际费用可能因汇率波动、燃油附加费调整而有所变动
                    </p>
                  </div>
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
          </div>
        </div>
      </div>
    </div>
  );
} 