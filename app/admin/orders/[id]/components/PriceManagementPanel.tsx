import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, RefreshCw, Loader2, AlertCircle, Calculator, Calendar, Clock, Zap, CreditCard, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { calculateSmartDeliveryDate, checkIsWorkingDay } from '@/lib/utils/deliveryDateCalculator';

interface AdminOrderEdit {
  pcb_price?: string | number;
  ship_price?: string | number;
  custom_duty?: string | number;
  coupon?: string | number;
  exchange_rate?: string | number;
  currency?: string;
  cny_price?: string | number;
  admin_price?: string | number;
  production_days?: string | number;
  delivery_date?: string;
  status?: string;
  admin_note?: string;
  surcharges?: Array<{name: string, amount: number}>;
  is_urgent?: boolean;
  payment_status?: string;
  pay_time?: string;
  due_date?: string;
}

interface PriceManagementPanelProps {
  adminOrderEdit: AdminOrderEdit;
  onUpdatePrice: (values: Record<string, unknown>) => void;
  onFieldChange: (field: string, value: unknown) => void;
  pcbFormData?: Record<string, unknown>; // PCB规格数据，用于运费计算
  onCalcShipping?: () => void; // 运费重算回调
}



interface ExchangeRateCache {
  [key: string]: {
    rate: number;
    timestamp: number;
  };
}

// 汇率缓存有效期（1分钟）
const CACHE_DURATION = 1 * 60 * 1000;

export function PriceManagementPanel({ 
  adminOrderEdit, 
  onUpdatePrice, 
  onFieldChange,
  pcbFormData,
  onCalcShipping
}: PriceManagementPanelProps) {
  
  // 状态管理
  const [exchangeRates, setExchangeRates] = useState<ExchangeRateCache>({});
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);
  const [localData, setLocalData] = useState<AdminOrderEdit>(adminOrderEdit);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [dueDate, setDueDate] = useState('');

  // 获取币种符号
  const getCurrencySymbol = (currency?: string) => {
    switch (currency) {
      case 'CNY': return '¥';
      case 'EUR': return '€';
      case 'USD':
      default: return '$';
    }
  };

  // 获取币种名称
  const getCurrencyName = (currency?: string) => {
    switch (currency) {
      case 'CNY': return '人民币';
      case 'EUR': return '欧元';
      case 'USD': return '美元';
      default: return '美元';
    }
  };

  // 智能交期计算
  const handleAutoCalculateDelivery = useCallback((productionDays: number, isUrgent: boolean = false) => {
    try {
      const calculation = calculateSmartDeliveryDate(productionDays, new Date(), isUrgent);
      
      const updatedData = {
        ...localData,
        delivery_date: calculation.deliveryDate,
        is_urgent: isUrgent
      };
      
      setLocalData(updatedData);
      onFieldChange('delivery_date', calculation.deliveryDate);
      
      // 显示计算详情
      toast.success(`📅 交期已智能计算${isUrgent ? ' (加急模式)' : ''}`, {
        description: `预计交期: ${new Date(calculation.deliveryDate).toLocaleDateString('zh-CN')}
工作日: ${calculation.actualWorkingDays}天 | 总计: ${calculation.totalCalendarDays}天
${calculation.skippedDays.length > 0 ? `跳过: ${calculation.skippedDays.length}天节假日/周末` : ''}`,
        duration: 5000
      });
      
    } catch (error) {
      console.error('交期计算失败:', error);
      toast.error('交期计算失败，请手动设置');
    }
  }, [localData, onFieldChange]);

  // 获取汇率的优先级逻辑
  const fetchExchangeRate = useCallback(async (currency: string, forceRefresh = false): Promise<number> => {
    // CNY汇率固定为1.0
    if (currency === 'CNY') {
      return 1.0;
    }

    // 1. 优先使用管理员订单表中已存储的汇率
    if (!forceRefresh && localData.exchange_rate && localData.currency === currency) {
      const adminRate = Number(localData.exchange_rate);
      if (adminRate > 0) {
        console.log(`🔄 使用管理员订单表中的汇率: ${currency} = ${adminRate}`);
        return adminRate;
      }
    }

    // 2. 检查内存缓存（仅在强制刷新时跳过）
    if (!forceRefresh) {
      const cached = exchangeRates[currency];
      const now = Date.now();
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        console.log(`💾 使用缓存汇率: ${currency} = ${cached.rate}`);
        return cached.rate;
      }
    }

    // 3. 从内部API获取最新汇率
    try {
      setIsLoadingRates(true);
      setRateError(null);
      
      console.log(`🌐 从API获取最新汇率: ${currency}`);
      const response = await fetch(`/api/exchange-rates?base_currency=${currency}&target_currency=CNY`);
      if (!response.ok) {
        throw new Error(`获取汇率失败: ${response.status}`);
      }
      
      const data = await response.json();
      const rate = data.rate;
      
      // 更新缓存
      setExchangeRates(prev => ({
        ...prev,
        [currency]: {
          rate,
          timestamp: Date.now()
        }
      }));
      
      console.log(`✅ API汇率获取成功: ${currency} = ${rate}`);
      return rate;
    } catch (error) {
      console.error('获取汇率失败:', error);
      const errorMsg = error instanceof Error ? error.message : '网络错误';
      setRateError(errorMsg);
      
      // 4. 使用管理员订单表的汇率作为后备（如果存在）
      if (localData.exchange_rate && localData.currency === currency) {
        const adminRate = Number(localData.exchange_rate);
        if (adminRate > 0) {
          console.log(`⚠️ API失败，使用管理员订单表汇率: ${currency} = ${adminRate}`);
          toast.warning(`汇率API失败，使用订单中的汇率: ${adminRate}`);
          return adminRate;
        }
      }
      
      // 5. 最终后备：使用默认汇率
      const defaultRates: { [key: string]: number } = {
        'USD': 7.2,
        'EUR': 7.8,
        'CNY': 1.0
      };
      
      const defaultRate = defaultRates[currency] || 7.2;
      console.log(`🔄 使用默认汇率: ${currency} = ${defaultRate}`);
      toast.error(`汇率获取失败，使用默认汇率: ${defaultRate} (${errorMsg})`);
      return defaultRate;
    } finally {
      setIsLoadingRates(false);
    }
  }, [exchangeRates, localData.exchange_rate, localData.currency]);

  // 刷新汇率 - 强制从API获取最新汇率
  const refreshExchangeRate = useCallback(async (currency?: string) => {
    const targetCurrency = currency || localData.currency || 'USD';
    
    // 强制刷新，忽略管理员订单表中的汇率和缓存
    const rate = await fetchExchangeRate(targetCurrency, true);
    
    const updatedData = {
      ...localData,
      exchange_rate: rate.toString()
    };
    
    setLocalData(updatedData);
    onUpdatePrice(updatedData);
    
    toast.success(`${getCurrencyName(targetCurrency)}汇率已刷新: ${rate} (来自最新API)`);
  }, [localData, fetchExchangeRate, onUpdatePrice]);

  // 运费重算
  const handleShippingRecalc = useCallback(async () => {
    if (!pcbFormData) {
      toast.error('缺少PCB规格数据，无法计算运费');
      return;
    }

    try {
      setIsLoadingRates(true);
      
      const currentCurrency = localData.currency || 'USD';
      const currentExchangeRate = Number(localData.exchange_rate) || 7.2;
      
      // 优先使用专业运费计算器
      try {
        // 检查是否有运输地址信息
        const formDataObj = pcbFormData as Record<string, unknown>;
        const shippingAddr = formDataObj.shippingAddress as Record<string, unknown> | undefined;
        
        if (shippingAddr?.country && shippingAddr?.courier) {
          // 动态导入运费计算器
          const { calculateShippingCost } = await import('@/lib/shipping-calculator');
          const shippingResult = await calculateShippingCost(pcbFormData as Parameters<typeof calculateShippingCost>[0]);
          const shippingCostCNY = shippingResult.finalCost; // 运费计算器返回人民币金额
          
          // 根据币种转换存储金额
          let storedShippingCost: number;
          let displayShippingCost: string;
          
          console.log(`🚢 专业运费计算: 原始人民币金额 ¥${shippingCostCNY.toFixed(2)}, 目标币种: ${currentCurrency}, 汇率: ${currentExchangeRate}`);
          
          switch (currentCurrency) {
            case 'CNY':
              storedShippingCost = shippingCostCNY;
              displayShippingCost = `¥${shippingCostCNY.toFixed(2)}`;
              break;
            case 'USD':
              storedShippingCost = shippingCostCNY / currentExchangeRate;
              displayShippingCost = `$${storedShippingCost.toFixed(2)}`;
              break;
            case 'EUR':
              storedShippingCost = shippingCostCNY / currentExchangeRate;
              displayShippingCost = `€${storedShippingCost.toFixed(2)}`;
              break;
            default:
              storedShippingCost = shippingCostCNY / 7.2;
              displayShippingCost = `$${storedShippingCost.toFixed(2)}`;
          }
          
          // 更新运费
          const updatedData = {
            ...localData,
            ship_price: storedShippingCost.toFixed(2)
          };
          
          setLocalData(updatedData);
          onUpdatePrice(updatedData);
          
          // 获取快递公司显示名称
          const courierNames: Record<string, string> = {
            'dhl': 'DHL',
            'fedex': 'FedEx', 
            'ups': 'UPS'
          };
          const courierDisplay = courierNames[String(shippingAddr.courier)] || String(shippingAddr.courier).toUpperCase();
          
          toast.success(`📦 运费重新计算完成 (专业计算)`, {
            description: `${courierDisplay} 到 ${String(shippingAddr.country).toUpperCase()}\n运费: ${displayShippingCost}\n重量: ${shippingResult.chargeableWeight}kg\n时效: ${shippingResult.deliveryTime}`,
            duration: 5000
          });
          
          // 如果有外部回调，也调用它
          if (onCalcShipping) {
            onCalcShipping();
          }
          
          console.log(`✅ 专业运费计算成功: ${displayShippingCost}`);
          return;
        }
      } catch (shippingError) {
        console.warn('专业运费计算失败，使用简化估算:', shippingError);
        // 继续执行简化估算逻辑
      }
      
      // 简化估算逻辑（当专业计算不可用时）
      console.log('🔄 使用简化运费估算');
      
      // 基于PCB数量和面积的更精确估算
      let estimatedShippingCNY = 72; // 基础¥72
      
      // 如果有PCB规格数据，进行更精确的估算
      const formDataObj = pcbFormData as Record<string, unknown>;
      const singleDims = formDataObj.singleDimensions as Record<string, unknown> | undefined;
      
      if (singleDims && typeof singleDims.length === 'number' && typeof singleDims.width === 'number') {
        const singleArea = Number(singleDims.length || 0) * Number(singleDims.width || 0) / 100; // cm²
        const totalQuantity = Number(formDataObj.singleCount || 1) * Number(formDataObj.differentDesignsCount || 1);
        const totalArea = singleArea * totalQuantity / 100; // dm²
        const thickness = Number(formDataObj.thickness || 1.6);
        
        // 基于面积和厚度的重量估算
        const estimatedWeight = totalArea * thickness * 0.18; // kg (FR4密度约1.8g/cm³)
        const packageWeight = 0.2; // 包装重量
        const totalWeight = estimatedWeight + packageWeight;
        
        // 根据重量调整运费
        if (totalWeight <= 0.5) {
          estimatedShippingCNY = 72;  // ¥72 (约$10)
        } else if (totalWeight <= 1.0) {
          estimatedShippingCNY = 108; // ¥108 (约$15)
        } else if (totalWeight <= 2.0) {
          estimatedShippingCNY = 144; // ¥144 (约$20)
        } else {
          estimatedShippingCNY = 180 + Math.ceil((totalWeight - 2) * 36); // 每增加1kg+¥36
        }
        
        console.log(`📏 PCB规格估算: 面积${totalArea.toFixed(2)}dm², 重量${totalWeight.toFixed(3)}kg, 运费¥${estimatedShippingCNY}`);
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
          displayShippingCost = `$${storedShippingCost.toFixed(2)}`;
          break;
        case 'EUR':
          storedShippingCost = estimatedShippingCNY / currentExchangeRate;
          displayShippingCost = `€${storedShippingCost.toFixed(2)}`;
          break;
        default:
          storedShippingCost = estimatedShippingCNY / 7.2;
          displayShippingCost = `$${storedShippingCost.toFixed(2)}`;
      }
      
      // 更新运费
      const updatedData = {
        ...localData,
        ship_price: storedShippingCost.toFixed(2)
      };
      
      setLocalData(updatedData);
      onUpdatePrice(updatedData);
      
      toast.success(`📦 运费重新计算完成 (估算)`, {
        description: `运费: ${displayShippingCost}\n基于PCB规格智能估算\n建议: 完善收货地址以获得精确运费`,
        duration: 4000
      });
      
      // 如果有外部回调，也调用它
      if (onCalcShipping) {
        onCalcShipping();
      }
      
    } catch (error) {
      console.error('运费重算失败:', error);
      const errorMsg = error instanceof Error ? error.message : '运费计算失败';
      toast.error(`运费重算失败: ${errorMsg}`);
    } finally {
      setIsLoadingRates(false);
    }
  }, [pcbFormData, localData, onUpdatePrice, onCalcShipping]);

  // 币种切换处理
  const handleCurrencyChange = useCallback(async (newCurrency: string) => {
    const oldCurrency = localData.currency || 'USD';
    
    if (oldCurrency === newCurrency) return;

    try {
      // 获取新币种的汇率
      const newRate = await fetchExchangeRate(newCurrency);
      const oldRate = Number(localData.exchange_rate) || 7.2;
      
      // 计算转换比率
      let conversionRate = 1;
      
      // 旧币种转人民币
      if (oldCurrency === 'CNY') {
        conversionRate = 1; // CNY已经是人民币
      } else {
        conversionRate = oldRate; // 外币 * 汇率 = CNY
      }
      
      // 人民币转新币种
      if (newCurrency === 'CNY') {
        // 保持人民币金额不变
      } else {
        conversionRate = conversionRate / newRate; // CNY / 汇率 = 外币
      }
      
      // 转换所有价格字段
      const convertedData = {
        ...localData,
        currency: newCurrency,
        exchange_rate: newRate.toString(),
        pcb_price: localData.pcb_price ? (Number(localData.pcb_price) * conversionRate).toFixed(2) : '',
        ship_price: localData.ship_price ? (Number(localData.ship_price) * conversionRate).toFixed(2) : '',
        custom_duty: localData.custom_duty ? (Number(localData.custom_duty) * conversionRate).toFixed(2) : '',
        coupon: localData.coupon ? (Number(localData.coupon) * conversionRate).toFixed(2) : '0',
      };
      
      // 转换附加费用
      if (Array.isArray(localData.surcharges)) {
        convertedData.surcharges = localData.surcharges.map(surcharge => ({
          ...surcharge,
          amount: Number((surcharge.amount * conversionRate).toFixed(2))
        }));
      }
      
      setLocalData(convertedData);
      onUpdatePrice(convertedData);
      
      toast.success(`币种已切换至${getCurrencyName(newCurrency)}，价格已自动转换`);
    } catch (error) {
      console.error('币种切换失败:', error);
      toast.error('币种切换失败，请重试');
    }
  }, [localData, fetchExchangeRate, onUpdatePrice]);

  // 价格字段更新
  const handlePriceFieldChange = useCallback((field: string, value: string) => {
    // 特殊处理汇率变更：保持人民币总价不变，反向调整其他价格项
    if (field === 'exchange_rate') {
      const newRate = Number(value) || 1;
      const oldRate = Number(localData.exchange_rate) || 1;
      const currentCurrency = localData.currency || 'USD';
      
      // CNY币种时不允许修改汇率
      if (currentCurrency === 'CNY') {
        return;
      }
      
      // 如果汇率没有实际变化，直接更新
      if (Math.abs(newRate - oldRate) < 0.0001) {
        const updatedData = {
          ...localData,
          [field]: value
        };
        setLocalData(updatedData);
        onUpdatePrice(updatedData);
        return;
      }
      
      // 计算转换比率（保持人民币总价不变）
      const conversionRatio = oldRate / newRate;
      
      // 转换所有价格字段
      const updatedData = {
        ...localData,
        exchange_rate: value,
        pcb_price: localData.pcb_price ? (Number(localData.pcb_price) * conversionRatio).toFixed(2) : localData.pcb_price,
        ship_price: localData.ship_price ? (Number(localData.ship_price) * conversionRatio).toFixed(2) : localData.ship_price,
        custom_duty: localData.custom_duty ? (Number(localData.custom_duty) * conversionRatio).toFixed(2) : localData.custom_duty,
        coupon: localData.coupon ? (Number(localData.coupon) * conversionRatio).toFixed(2) : localData.coupon,
      };
      
      // 转换附加费用
      if (Array.isArray(localData.surcharges)) {
        updatedData.surcharges = localData.surcharges.map(surcharge => ({
          ...surcharge,
          amount: Number((surcharge.amount * conversionRatio).toFixed(2))
        }));
      }
      
      setLocalData(updatedData);
      onUpdatePrice(updatedData);
      
      // 显示提示信息
      toast.success(`🔄 汇率已调整，价格已按比例换算`, {
        description: `汇率: ${oldRate.toFixed(4)} → ${newRate.toFixed(4)}\n换算比例: ${conversionRatio.toFixed(4)}\n人民币总价保持不变`,
        duration: 4000
      });
      
    } else {
      // 其他字段的正常处理
      const updatedData = {
        ...localData,
        [field]: value
      };
      
      setLocalData(updatedData);
      onUpdatePrice(updatedData);
    }
  }, [localData, onUpdatePrice]);

  // 附加费用管理
  const handleSurchargeChange = useCallback((index: number, field: 'name' | 'amount', value: string | number) => {
    const surcharges = Array.isArray(localData.surcharges) ? [...localData.surcharges] : [];
    
    if (field === 'name') {
      surcharges[index] = { ...surcharges[index], name: value as string };
    } else {
      surcharges[index] = { ...surcharges[index], amount: Number(value) };
    }
    
    const updatedData = {
      ...localData,
      surcharges
    };
    
    setLocalData(updatedData);
    onUpdatePrice(updatedData);
  }, [localData, onUpdatePrice]);

  const addSurcharge = useCallback(() => {
    const surcharges = Array.isArray(localData.surcharges) ? [...localData.surcharges] : [];
    surcharges.push({ name: '', amount: 0 });
    
    const updatedData = {
      ...localData,
      surcharges
    };
    
    setLocalData(updatedData);
    onUpdatePrice(updatedData);
  }, [localData, onUpdatePrice]);

  const removeSurcharge = useCallback((index: number) => {
    const surcharges = Array.isArray(localData.surcharges) ? [...localData.surcharges] : [];
    surcharges.splice(index, 1);
    
    const updatedData = {
      ...localData,
      surcharges
    };
    
    setLocalData(updatedData);
    onUpdatePrice(updatedData);
  }, [localData, onUpdatePrice]);

  // 同步外部数据变化
  useEffect(() => {
    setLocalData(adminOrderEdit);
    // 同步日期状态
    if (adminOrderEdit.delivery_date) {
      setDeliveryDate(new Date(adminOrderEdit.delivery_date).toISOString().split('T')[0]);
    } else {
      setDeliveryDate('');
    }
    if (adminOrderEdit.due_date) {
      setDueDate(new Date(adminOrderEdit.due_date).toISOString().split('T')[0]);
    } else {
      setDueDate('');
    }
  }, [adminOrderEdit]);

  // 初始化时获取当前币种汇率（优先使用管理员订单表中的汇率）
  useEffect(() => {
    const currency = localData.currency || 'USD';
    
    // 如果是CNY，无需获取汇率
    if (currency === 'CNY') return;
    
    // 如果管理员订单表中已有汇率，则不需要额外获取
    if (localData.exchange_rate && Number(localData.exchange_rate) > 0) {
      console.log(`🎯 管理员订单表中已有汇率，无需获取: ${currency} = ${localData.exchange_rate}`);
      return;
    }
    
    // 如果缓存中没有汇率，才获取
    if (!exchangeRates[currency]) {
      console.log(`🔍 初始化获取汇率: ${currency}`);
      fetchExchangeRate(currency);
    }
  }, [localData.currency, localData.exchange_rate, exchangeRates, fetchExchangeRate]);

  const currentCurrency = localData.currency || 'USD';
  const currentRate = localData.exchange_rate || '7.2';
  const isCNY = currentCurrency === 'CNY';

  return (
    <div className="bg-white border rounded-lg">
      <div className="bg-gray-50 px-3 md:px-4 py-2 md:py-3 border-b">
        <h3 className="text-sm font-medium text-gray-800 flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          价格管理
          {isLoadingRates && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
        </h3>
      </div>
      
      <div className="p-3 md:p-4 space-y-3 md:space-y-4">
        {/* 币种和汇率设置 */}
        <div className="space-y-2 md:space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
            <div>
              <Label className="text-xs font-medium text-gray-700 mb-1 block">币种</Label>
              <select 
                value={currentCurrency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="h-8 text-xs border border-gray-300 rounded px-2 w-full bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="USD">美元 (USD)</option>
                <option value="CNY">人民币 (CNY)</option>
                <option value="EUR">欧元 (EUR)</option>
              </select>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-700 mb-1 block">
                汇率
                {isCNY && <span className="text-green-600 ml-1">(固定)</span>}
              </Label>
              <div className="flex gap-1">
                <Input 
                  type="number"
                  step="0.01"
                  value={currentRate}
                  onChange={(e) => handlePriceFieldChange('exchange_rate', e.target.value)}
                  disabled={isCNY}
                  className="h-8 text-xs flex-1"
                  placeholder="汇率"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => refreshExchangeRate()}
                  disabled={isLoadingRates || isCNY}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                  title="刷新汇率"
                >
                  {isLoadingRates ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          
          {/* 汇率状态指示 */}
          {!isCNY && (
            <div className="text-xs text-gray-500 flex items-center gap-1">
              {localData.exchange_rate && Number(localData.exchange_rate) > 0 ? (
                <>
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  <span>订单汇率</span>
                </>
              ) : exchangeRates[currentCurrency] ? (
                <>
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  <span>API汇率</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                  <span>默认汇率</span>
                </>
              )}
            </div>
          )}
          
          {rateError && (
            <div className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>汇率获取失败</span>
            </div>
          )}
        </div>

        {/* 价格字段 */}
        <div className="space-y-2 md:space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
            <div>
              <Label className="text-xs font-medium text-gray-700 mb-1 block">
                PCB价格 ({getCurrencySymbol(currentCurrency)})
              </Label>
              <Input 
                type="number"
                step="0.01"
                placeholder="0.00"
                value={localData.pcb_price || ''}
                onChange={(e) => handlePriceFieldChange('pcb_price', e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-700 mb-1 block">
                运费 ({getCurrencySymbol(currentCurrency)})
              </Label>
              <div className="flex gap-1">
                <Input 
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={localData.ship_price || ''}
                  onChange={(e) => handlePriceFieldChange('ship_price', e.target.value)}
                  className="h-8 text-xs flex-1"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleShippingRecalc}
                  disabled={isLoadingRates || !pcbFormData}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                  title="重新计算运费"
                >
                  {isLoadingRates ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Calculator className="w-3 h-3" />
                  )}
                </Button>
              </div>
              {!pcbFormData && (
                <div className="text-xs text-orange-500 mt-1">
                  需要PCB规格数据
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
            <div>
              <Label className="text-xs font-medium text-gray-700 mb-1 block">
                关税 ({getCurrencySymbol(currentCurrency)})
              </Label>
              <Input 
                type="number"
                step="0.01"
                placeholder="0.00"
                value={localData.custom_duty || ''}
                onChange={(e) => handlePriceFieldChange('custom_duty', e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-700 mb-1 block">
                优惠券 ({getCurrencySymbol(currentCurrency)})
              </Label>
              <Input 
                type="number"
                step="0.01"
                placeholder="0.00"
                value={localData.coupon || ''}
                onChange={(e) => handlePriceFieldChange('coupon', e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>

        {/* 附加费用 */}
        <div className="border-t pt-3">
          <Label className="text-xs font-medium text-gray-700 mb-2 block">
            附加费用 ({getCurrencySymbol(currentCurrency)})
          </Label>
          <div className="space-y-2">
            {Array.isArray(localData.surcharges) && localData.surcharges.map((surcharge, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input 
                  placeholder="费用名称"
                  value={surcharge.name}
                  onChange={(e) => handleSurchargeChange(index, 'name', e.target.value)}
                  className="h-7 text-xs flex-1"
                />
                <Input 
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={surcharge.amount}
                  onChange={(e) => handleSurchargeChange(index, 'amount', e.target.value)}
                  className="h-7 text-xs w-20"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeSurcharge(index)}
                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                >
                  ×
                </Button>
              </div>
            ))}
            <Button
              size="sm"
              variant="ghost"
              onClick={addSurcharge}
              className="h-7 text-xs text-blue-600 hover:text-blue-800"
            >
              + 添加费用
            </Button>
          </div>
        </div>

        {/* 价格汇总 */}
        <div className="border-t pt-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 border rounded-lg p-3">
              <div className="text-xs font-medium text-gray-600 mb-1">人民币总价</div>
              <div className="text-lg font-mono text-gray-900">
                ¥{localData.cny_price || '0.00'}
              </div>
            </div>
            <div className="bg-gray-50 border rounded-lg p-3">
              <div className="text-xs font-medium text-gray-600 mb-1">
                {getCurrencyName(currentCurrency)}总价
              </div>
              <div className="text-lg font-mono text-gray-900">
                {getCurrencySymbol(currentCurrency)}{localData.admin_price || '0.00'}
              </div>
            </div>
          </div>
        </div>

        {/* 交期管理 */}
        <div className="border-t pt-3">
          <Label className="text-xs font-medium text-gray-700 mb-3 block flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            交期管理
          </Label>
          
          {/* 加急订单选项 */}
          <div className="mb-3">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={localData.is_urgent || false}
                onChange={(e) => {
                  const isUrgent = e.target.checked;
                  const updatedData = { ...localData, is_urgent: isUrgent };
                  setLocalData(updatedData);
                  onFieldChange('is_urgent', isUrgent);
                  
                  // 如果设置为加急，重新计算交期
                  if (localData.production_days) {
                    handleAutoCalculateDelivery(Number(localData.production_days), isUrgent);
                  }
                }}
                className="w-3 h-3 text-orange-600 rounded focus:ring-orange-500"
              />
              <Zap className="w-3 h-3 text-orange-500" />
              <span className="text-orange-600 font-medium">加急订单</span>
              <span className="text-gray-500">(减少1-2工作日)</span>
            </label>
          </div>
          
          <div className="grid grid-cols-1 gap-2 md:gap-3">
            <div>
              <Label className="text-xs font-medium text-gray-700 mb-1 block flex items-center gap-1">
                <Clock className="w-3 h-3" />
                生产天数
              </Label>
              <div className="flex gap-1">
                <Input 
                  type="number"
                  min="1"
                  placeholder="5"
                  value={localData.production_days || ''}
                  onChange={(e) => {
                    const days = e.target.value;
                    onFieldChange('production_days', days);
                    
                    // 自动计算交期
                    if (days && Number(days) > 0) {
                      handleAutoCalculateDelivery(Number(days), localData.is_urgent || false);
                    }
                  }}
                  className="h-8 text-xs flex-1"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (localData.production_days) {
                      handleAutoCalculateDelivery(Number(localData.production_days), localData.is_urgent || false);
                    }
                  }}
                  disabled={!localData.production_days}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                  title="重新计算交期"
                >
                  <RefreshCw className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-700 mb-1 block flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                预计交期
                {localData.delivery_date && checkIsWorkingDay(new Date(localData.delivery_date)) ? (
                  <span className="text-green-500" title="工作日">✓</span>
                ) : localData.delivery_date ? (
                  <span className="text-orange-500" title="节假日/周末">⚠</span>
                ) : null}
              </Label>
              <Input 
                type="date"
                value={deliveryDate}
                onChange={(e) => {
                  const date = e.target.value;
                  setDeliveryDate(date);
                  onFieldChange('delivery_date', date);
                  
                  // 检查是否为工作日
                  if (date) {
                    const selectedDate = new Date(date);
                    const isWorkingDay = checkIsWorkingDay(selectedDate);
                    if (!isWorkingDay) {
                      toast.warning(`⚠️ 所选日期为非工作日`, {
                        description: `${selectedDate.toLocaleDateString('zh-CN')} 是周末或节假日，请注意交期安排`,
                        duration: 3000
                      });
                    }
                  }
                }}
                className="h-8 text-xs"
                title="预计完成日期"
              />
            </div>
          </div>
          
          {/* 交期说明 */}
          {localData.production_days && localData.delivery_date && (
            <div className="mt-3 p-3 bg-gray-50 border rounded-lg text-xs">
              <div className="text-gray-700 font-medium mb-2">交期说明</div>
              <div className="text-gray-600 space-y-1">
                <div>生产天数: {localData.production_days}天 {localData.is_urgent ? '(加急)' : '(常规)'}</div>
                <div>预计完成: {new Date(localData.delivery_date).toLocaleDateString('zh-CN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'long'
                })}</div>
                <div className="text-gray-500 mt-1">
                  已排除节假日和周末
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 订单状态和支付 */}
        <div className="border-t pt-3">
          <Label className="text-xs font-medium text-gray-700 mb-3 block flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            状态管理
          </Label>
          
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">订单状态</Label>
                <select 
                  value={localData.status || 'created'}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    
                    // 币种检查
                    if (newStatus === 'reviewed' && currentCurrency !== 'USD') {
                      toast.warning('币种提醒', {
                        description: `当前币种为${getCurrencyName(currentCurrency)}，建议使用美元(USD)`,
                        duration: 3000
                      });
                    }
                    
                    onFieldChange('status', newStatus);
                  }}
                  className="h-8 text-xs border border-gray-300 rounded px-2 w-full bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
              
              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">支付状态</Label>
                <select
                  value={localData.payment_status || 'unpaid'}
                  onChange={(e) => onFieldChange('payment_status', e.target.value)}
                  className="h-8 text-xs border border-gray-300 rounded px-2 w-full bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="unpaid">未支付</option>
                  <option value="pending">支付中</option>
                  <option value="paid">已支付</option>
                  <option value="partially_paid">部分支付</option>
                  <option value="failed">支付失败</option>
                  <option value="cancelled">已取消</option>
                  <option value="refunded">已退款</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2 md:gap-3">
              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block">到期日</Label>
                <Input 
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    const date = e.target.value;
                    setDueDate(date);
                    onFieldChange('due_date', date);
                  }}
                  className="h-8 text-xs"
                />
              </div>
              
              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1 block flex items-center gap-1">
                  支付时间
                  {localData.payment_status === 'paid' && (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  )}
                </Label>
                <Input 
                  type="datetime-local"
                  value={localData.pay_time ? new Date(localData.pay_time).toISOString().slice(0, 16) : ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    onFieldChange('pay_time', value ? new Date(value).toISOString() : '');
                  }}
                  className="h-8 text-xs"
                  disabled={localData.payment_status !== 'paid'}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 备注 */}
        <div className="border-t pt-3">
          <Label className="text-xs font-medium text-gray-700 mb-1 block">管理员备注</Label>
          <Textarea 
            placeholder="添加备注..."
            value={localData.admin_note || ''}
            onChange={(e) => onFieldChange('admin_note', e.target.value)}
            className="text-xs resize-none"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
} 