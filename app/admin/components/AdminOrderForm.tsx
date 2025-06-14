import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createForm, onFieldValueChange } from "@formily/core";
import { FormProvider, createSchemaField, useForm } from "@formily/react";
import { formilyComponents } from "@/app/quote2/components/FormilyComponents";
import { Trash2, Plus, Clock, CheckCircle, AlertTriangle, Mail, Send } from "lucide-react";
import OrderStepBar from "@/components/ui/OrderStepBar";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select as ShadSelect,
  SelectContent as ShadSelectContent,
  SelectItem as ShadSelectItem,
  SelectTrigger as ShadSelectTrigger,
  SelectValue as ShadSelectValue,
  } from "@/components/ui/select";

// 加价项类型定义
interface SurchargeItem {
  name: string;
  amount: number;
}

// 表单分组类型定义
interface FormGroup {
  title: string;
  fields: string[];
  layout: "grid" | "single";
}

// 币种配置和汇率联动
const CURRENCY_CONFIG = {
  USD: { 
    label: "美元 (USD)", 
    symbol: "$", 
    defaultRate: 7.2,
    precision: 2 
  },
  CNY: { 
    label: "人民币 (CNY)", 
    symbol: "¥", 
    defaultRate: 1.0,
    precision: 2 
  },
  EUR: { 
    label: "欧元 (EUR)", 
    symbol: "€", 
    defaultRate: 7.8,
    precision: 2 
  },
  JPY: { 
    label: "日元 (JPY)", 
    symbol: "¥", 
    defaultRate: 0.05,
    precision: 4 
  },
  GBP: { 
    label: "英镑 (GBP)", 
    symbol: "£", 
    defaultRate: 9.1,
    precision: 2 
  },
  HKD: { 
    label: "港币 (HKD)", 
    symbol: "HK$", 
    defaultRate: 0.92,
    precision: 2 
  }
} as const;

// 获取实时汇率的函数
const fetchExchangeRate = async (fromCurrency: string, toCurrency: string = 'CNY'): Promise<number | null> => {
  // 如果是相同币种，返回1
  if (fromCurrency === toCurrency) return 1;
  
  try {
    // 使用免费的汇率API（这里使用一个备用的简单估算）
    // 在生产环境中，你可以替换为实际的汇率API
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
    if (!response.ok) throw new Error('汇率获取失败');
    
    const data = await response.json();
    return data.rates?.[toCurrency] || null;
  } catch (error) {
    console.warn('汇率API调用失败，使用默认汇率:', error);
    // 返回默认汇率
    const config = CURRENCY_CONFIG[fromCurrency as keyof typeof CURRENCY_CONFIG];
    return config?.defaultRate || 7.2;
  }
};

// 币种选择组件
const CurrencySelect = ({ value, onChange }: { 
  value?: string; 
  onChange: (value: string) => void;
}) => {
  const [isUpdatingRate, setIsUpdatingRate] = useState(false);
  const form = useForm();

  const handleCurrencyChange = async (newCurrency: string) => {
    onChange(newCurrency);
    
    // 如果是CNY，汇率设为1
    if (newCurrency === 'CNY') {
      form.setValuesIn('exchange_rate', 1);
      return;
    }

    // 自动更新汇率
    setIsUpdatingRate(true);
    try {
      const rate = await fetchExchangeRate(newCurrency, 'CNY');
      if (rate !== null) {
        form.setValuesIn('exchange_rate', rate);
        toast.success(`汇率已更新：1 ${newCurrency} = ${rate} CNY`);
      }
    } catch (error) {
      console.error('汇率更新失败:', error);
      // 使用默认汇率
      const config = CURRENCY_CONFIG[newCurrency as keyof typeof CURRENCY_CONFIG];
      const defaultRate = config?.defaultRate || 7.2;
      form.setValuesIn('exchange_rate', defaultRate);
      toast.warning(`使用默认汇率：1 ${newCurrency} = ${defaultRate} CNY`);
    } finally {
      setIsUpdatingRate(false);
    }
  };

  return (
    <div className="relative">
      <Select value={value} onValueChange={handleCurrencyChange}>
        <SelectTrigger className="w-full">
          <div className="flex items-center gap-2">
            {value && CURRENCY_CONFIG[value as keyof typeof CURRENCY_CONFIG] && (
              <>
                <span className="font-medium">
                  {CURRENCY_CONFIG[value as keyof typeof CURRENCY_CONFIG].symbol}
                </span>
                <span>{CURRENCY_CONFIG[value as keyof typeof CURRENCY_CONFIG].label}</span>
              </>
            )}
            {!value && <span className="text-gray-500">请选择币种</span>}
          </div>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(CURRENCY_CONFIG).map(([code, config]) => (
            <SelectItem key={code} value={code}>
              <div className="flex items-center gap-2">
                <span className="font-medium">{config.symbol}</span>
                <span>{config.label}</span>
                <span className="text-xs text-gray-500 ml-auto">
                  ≈{config.defaultRate} CNY
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isUpdatingRate && (
        <div className="absolute inset-y-0 right-8 flex items-center">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

// 汇率输入组件
const ExchangeRateInput = ({ value, onChange, currency }: { 
  value?: number; 
  onChange: (value: number) => void;
  currency?: string;
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRefreshRate = async () => {
    if (!currency || currency === 'CNY') {
      toast.info('人民币无需更新汇率');
      return;
    }

    setIsUpdating(true);
    try {
      const rate = await fetchExchangeRate(currency, 'CNY');
      if (rate !== null) {
        onChange(rate);
        toast.success(`汇率已更新：1 ${currency} = ${rate} CNY`);
      }
    } catch (error) {
      console.error('汇率更新失败:', error);
      toast.error('汇率更新失败，请稍后重试');
    } finally {
      setIsUpdating(false);
    }
  };

  const currencyConfig = currency ? CURRENCY_CONFIG[currency as keyof typeof CURRENCY_CONFIG] : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value))}
          step={currencyConfig?.precision === 4 ? 0.0001 : 0.01}
          min={0}
          placeholder="请输入汇率"
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRefreshRate}
          disabled={isUpdating || !currency || currency === 'CNY'}
          className="shrink-0"
          title="刷新汇率"
        >
          {isUpdating ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
        </Button>
      </div>
      {currency && currencyConfig && (
        <div className="text-xs text-gray-500 flex items-center gap-4">
          <span>1 {currency} = {value?.toFixed(currencyConfig.precision) || '0'} CNY</span>
          <span className="text-blue-600">默认: {currencyConfig.defaultRate}</span>
        </div>
      )}
    </div>
  );
};

// 加价项输入组件
const SurchargesInput = ({ value, onChange }: { 
  value?: SurchargeItem[] | string; 
  onChange?: (value: SurchargeItem[]) => void;
}) => {
  // 处理初始值：可能是数组或JSON字符串
  const getSurcharges = (): SurchargeItem[] => {
    if (!value) return [];
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return Array.isArray(value) ? value : [];
  };

  const [surcharges, setSurcharges] = useState<SurchargeItem[]>(getSurcharges);

  // 关键：同步外部 value 变化
  useEffect(() => {
    setSurcharges(getSurcharges());
  }, [value]);

  // 更新数据
  const updateSurcharges = (newSurcharges: SurchargeItem[]) => {
    setSurcharges(newSurcharges);
    onChange?.(newSurcharges);
  };

  // 添加新项
  const addSurcharge = () => {
    updateSurcharges([...surcharges, { name: '', amount: 0 }]);
  };

  // 删除项
  const removeSurcharge = (index: number) => {
    updateSurcharges(surcharges.filter((_, i) => i !== index));
  };

  // 更新项
  const updateSurcharge = (index: number, field: keyof SurchargeItem, value: string | number) => {
    const newSurcharges = [...surcharges];
    newSurcharges[index] = { ...newSurcharges[index], [field]: value };
    updateSurcharges(newSurcharges);
  };

  return (
    <div className="space-y-4">
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-semibold text-gray-800">加价项管理</h3>
        {surcharges.length > 0 && (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
            {surcharges.length} 项
          </span>
        )}
      </div>
      
      {/* 加价项列表 */}
      <div className="space-y-3">
        {surcharges.map((item, index) => (
          <div key={index} className="group relative">
            <div className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all duration-200">
              {/* 序号标识 */}
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium">
                {index + 1}
              </div>
              
              {/* 名称输入 */}
              <div className="flex-1">
                <Input
                  placeholder="请输入加价项名称（如：加急费、特殊工艺费等）"
                  value={item.name}
                  onChange={(e) => updateSurcharge(index, 'name', e.target.value)}
                  className="border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>
              
              {/* 金额输入 */}
              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-medium">¥</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={item.amount || ''}
                  onChange={(e) => updateSurcharge(index, 'amount', Number(e.target.value) || 0)}
                  className="w-28 text-right border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  step="0.01"
                  min="0"
                />
              </div>
              
              {/* 删除按钮 */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeSurcharge(index)}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      {/* 添加按钮 */}
      <Button
        type="button"
        variant="outline"
        onClick={addSurcharge}
        className="w-full h-12 border-2 border-dashed border-gray-300 text-gray-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 rounded-xl"
      >
        <Plus className="w-5 h-5 mr-2" />
        <span className="font-medium">添加加价项</span>
      </Button>
      
      {/* 总计显示 */}
      {surcharges.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-gray-700 font-medium">加价项总计</span>
              <span className="text-xs text-gray-500">({surcharges.length} 项)</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-emerald-600">
                ¥{surcharges.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2)}
              </div>
            </div>
          </div>
          
          {/* 项目详情 */}
          <div className="mt-3 pt-3 border-t border-emerald-200">
            <div className="grid grid-cols-1 gap-1">
              {surcharges.filter(item => item.name && item.amount > 0).map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.name || `加价项 ${index + 1}`}</span>
                  <span className="text-gray-800 font-medium">¥{item.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* 空状态提示 */}
      {surcharges.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 text-gray-400 flex items-center justify-center">
              📋
            </div>
          </div>
          <p className="text-sm">暂无加价项</p>
          <p className="text-xs text-gray-400 mt-1">点击上方按钮添加加价项</p>
        </div>
      )}
    </div>
  );
};

// 创建SchemaField，使用原有组件但应用自定义样式
const SchemaField = createSchemaField({
  components: {
    ...formilyComponents,
    CurrencySelect,
    ExchangeRateInput,
    SurchargesInput,
  }
});

// 简化的表单schema，不使用decorator
const adminOrderSchema = {
  type: "object",
  properties: {
    status: {
      type: "string",
      title: "订单状态",
      "x-component": "Select",
      "x-component-props": {
        placeholder: "请选择订单状态",
        options: [
          { label: "📝 草稿", value: "draft" },
          { label: "🆕 已创建", value: "created" },
          { label: "✅ 已审核", value: "reviewed" },
          { label: "💰 待支付", value: "unpaid" },
          { label: "🔄 支付中", value: "payment_pending" },
          { label: "💸 部分支付", value: "partially_paid" },
          { label: "✨ 已支付", value: "paid" },
          { label: "🏭 生产中", value: "in_production" },
          { label: "🔍 质检中", value: "quality_check" },
          { label: "📦 待发货", value: "ready_for_shipment" },
          { label: "🚚 已发货", value: "shipped" },
          { label: "📫 已送达", value: "delivered" },
          { label: "🎉 已完成", value: "completed" },
          { label: "❌ 已取消", value: "cancelled" },
          { label: "⏸️ 暂停", value: "on_hold" },
          { label: "🚫 已拒绝", value: "rejected" },
          { label: "💵 已退款", value: "refunded" }
        ]
      }
    },
    payment_status: {
      type: "string",
      title: "支付状态",
      "x-component": "Select",
      "x-component-props": {
        placeholder: "请选择支付状态",
        options: [
          { label: "💰 未支付", value: "unpaid" },
          { label: "🔄 支付中", value: "pending" },
          { label: "✅ 已支付", value: "paid" },
          { label: "💸 部分支付", value: "partially_paid" },
          { label: "❌ 支付失败", value: "failed" },
          { label: "🚫 已取消", value: "cancelled" },
          { label: "💵 已退款", value: "refunded" }
        ]
      }
    },
    due_date: {
      type: "string",
      title: "到期日",
      "x-component": "Input",
      "x-component-props": { type: "date" }
    },
    pay_time: {
      type: "string",
      title: "支付时间 🔒",
      "x-component": "Input",
      "x-component-props": { 
        type: "datetime-local", 
        readonly: true,
        placeholder: "系统自动记录"
      }
    },
    pcb_price: {
      type: "number",
      title: "PCB价格",
      "x-component": "Input",
      "x-component-props": { step: 0.01, placeholder: "可手动输入或通过重新计算获得" }
    },
    admin_price: {
      type: "number",
      title: "管理员价格 📊",
      "x-component": "Input",
      "x-component-props": { 
        step: 0.01, 
        readonly: true,
        placeholder: "自动计算"
      }
    },
    currency: {
      type: "string",
      title: "币种",
      "x-component": "CurrencySelect",
      "x-component-props": {
        placeholder: "请选择币种"
      }
    },
    exchange_rate: {
      type: "number",
      title: "汇率 (兑人民币)",
      "x-component": "ExchangeRateInput",
      "x-component-props": {
        step: 0.01,
        min: 0
      }
    },
    coupon: {
      type: "number",
      title: "优惠券",
      "x-component": "Input",
      "x-component-props": { step: 0.01, min: 0 }
    },
    ship_price: {
      type: "number",
      title: "运费",
      "x-component": "Input",
      "x-component-props": { step: 0.01, min: 0 }
    },
    custom_duty: {
      type: "number",
      title: "关税",
      "x-component": "Input",
      "x-component-props": { step: 0.01, min: 0 }
    },
    cny_price: {
      type: "number",
      title: "CNY价格 💴",
      "x-component": "Input",
      "x-component-props": { 
        step: 0.01, 
        min: 0, 
        readonly: true,
        placeholder: "自动计算"
      }
    },
    production_days: {
      type: "number",
      title: "生产天数",
      "x-component": "Input",
      "x-component-props": { min: 1, placeholder: "可手动输入或通过交期计算获得" }
    },
    delivery_date: {
      type: "string",
      title: "预计交期 📅",
      "x-component": "Input",
      "x-component-props": { 
        type: "date", 
        placeholder: "可手动输入或自动联动"
      }
    },
    admin_note: {
      type: "string",
      title: "管理员备注",
      "x-component": "TextArea",
      "x-component-props": {
        rows: 3,
        placeholder: "请输入管理员备注..."
      }
    },
    surcharges: {
      type: "array",
      title: "加价项",
      "x-component": "SurchargesInput"
    }
  }
};

const formGroups: FormGroup[] = [
  {
    title: "订单状态",
    fields: ["status", "payment_status", "due_date", "pay_time"],
    layout: "grid" // 使用网格布局
  },
  {
    title: "价格管理",
    fields: ["pcb_price", "admin_price", "currency", "exchange_rate", "cny_price"],
    layout: "grid" // 使用网格布局
  },
  {
    title: "费用明细",
    fields: ["ship_price", "custom_duty", "coupon", "production_days", "delivery_date"],
    layout: "grid" // 使用网格布局
  },
  {
    title: "备注",
    fields: ["admin_note"],
    layout: "single" // 单行布局
  },
  {
    title: "加价项",
    fields: ["surcharges"],
    layout: "single" // 单行布局
  }
];

// 订单状态可视化组件
const OrderStatusVisualization = ({ status, paymentStatus }: { 
  status?: string; 
  paymentStatus?: string; 
}) => {
  // 定义订单步骤映射
  const ORDER_STEPS = [
    { label: "创建", key: "created" },
    { label: "审核", key: "reviewed" },
    { label: "支付", key: "paid" },
    { label: "生产", key: "in_production" },
    { label: "质检", key: "quality_check" },
    { label: "发货", key: "shipped" },
    { label: "完成", key: "completed" },
  ];

  // 根据订单状态确定当前步骤
  const getCurrentStep = (orderStatus: string): string => {
    const statusMap: Record<string, string> = {
      'draft': 'created',
      'created': 'created',
      'reviewed': 'reviewed',
      'unpaid': 'reviewed',
      'payment_pending': 'reviewed',
      'partially_paid': 'reviewed',
      'paid': 'paid',
      'in_production': 'in_production',
      'quality_check': 'quality_check',
      'ready_for_shipment': 'quality_check',
      'shipped': 'shipped',
      'delivered': 'shipped',
      'completed': 'completed',
      'cancelled': 'created',
      'on_hold': 'in_production',
      'rejected': 'reviewed',
      'refunded': 'paid'
    };
    return statusMap[orderStatus] || 'created';
  };

  const currentStep = getCurrentStep(status || 'created');

  // 状态指示器
  const getStatusIndicator = () => {
    if (!status) return null;
    
    const statusConfig = {
      'draft': { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100', label: '草稿' },
      'created': { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-100', label: '已创建' },
      'reviewed': { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100', label: '已审核' },
      'paid': { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-100', label: '已支付' },
      'in_production': { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-100', label: '生产中' },
      'shipped': { icon: CheckCircle, color: 'text-blue-500', bg: 'bg-blue-100', label: '已发货' },
      'completed': { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: '已完成' },
      'cancelled': { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-100', label: '已取消' },
      'on_hold': { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-100', label: '暂停' },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const IconComponent = config.icon;

    return (
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-2 rounded-full ${config.bg}`}>
          <IconComponent className={`w-4 h-4 ${config.color}`} />
        </div>
        <span className={`font-medium ${config.color}`}>{config.label}</span>
        {paymentStatus && paymentStatus !== 'unpaid' && (
          <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
            支付状态: {paymentStatus}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="mb-6">
      {getStatusIndicator()}
      <OrderStepBar currentStatus={currentStep} steps={ORDER_STEPS} />
    </div>
  );
};

interface AdminOrderFormProps {
  initialValues: Record<string, unknown>;
  onSave: (values: Record<string, unknown>, options?: { sendNotification?: boolean; notificationType?: string }) => Promise<void>;
  onRecalc: (values: Record<string, unknown>) => void;
  onCalcPCB?: (values: Record<string, unknown>) => void;
  onCalcDelivery?: (values: Record<string, unknown>) => void;
  onCalcShipping?: (values: Record<string, unknown>) => void;
  readOnly?: boolean;
  submitButtonText?: string;
  hideActionButtons?: boolean;
  onStatusChange?: (newStatus: string) => void; // 新增：状态变更回调

}

export function AdminOrderForm({ initialValues, onSave, onRecalc, onCalcPCB, onCalcDelivery, onCalcShipping, readOnly, submitButtonText, hideActionButtons, onStatusChange }: AdminOrderFormProps) {
  const [isEdit, setIsEdit] = useState(!readOnly);
  const [isSaving, setIsSaving] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const deliveryDateManuallySet = useRef(false);
  
  // 价格联动计算函数
  const calculatePrices = (values: Record<string, unknown>) => {
    const pcb_price = Number(values.pcb_price) || 0;
    const ship_price = Number(values.ship_price) || 0;
    const custom_duty = Number(values.custom_duty) || 0;
    const coupon = Number(values.coupon) || 0;
    const exchange_rate = Number(values.exchange_rate) || 7.2;
    const currency = values.currency as string || 'USD';
    
    // 处理加价项
    let surcharges: Array<{name: string, amount: number}> = [];
    if (Array.isArray(values.surcharges)) {
      surcharges = values.surcharges;
    }
    const surchargeTotal = surcharges.reduce((sum: number, s: {name: string, amount: number}) => sum + Number(s.amount || 0), 0);
    
    // 计算CNY总价
    const cny_price = pcb_price + ship_price + custom_duty + surchargeTotal - coupon;
    
    // 计算管理员价格（根据币种）
    const admin_price = currency === 'CNY' ? cny_price : cny_price / exchange_rate;
    
    return {
      cny_price: cny_price.toFixed(2),
      admin_price: admin_price.toFixed(2)
    };
  };

  const form = createForm({
    values: initialValues,
    readPretty: !isEdit,
    effects: (form) => {
      // 监听价格相关字段变化，实时计算
      const priceFields = ['pcb_price', 'ship_price', 'custom_duty', 'coupon', 'exchange_rate', 'currency', 'surcharges'];
      
      priceFields.forEach(field => {
        onFieldValueChange(field, () => {
          const currentValues = form.values;
          const calculatedPrices = calculatePrices(currentValues);
          
          // 只有当计算结果不同时才更新，避免无限循环
          if (String(currentValues.cny_price) !== calculatedPrices.cny_price) {
            form.setValuesIn('cny_price', calculatedPrices.cny_price);
          }
          if (String(currentValues.admin_price) !== calculatedPrices.admin_price) {
            form.setValuesIn('admin_price', calculatedPrices.admin_price);
          }
        });
      });

      // 监听生产天数变化，自动推算预计交期（每次都允许自动联动）
      onFieldValueChange('production_days', () => {
        const days = Number(form.values.production_days);
        if (!isNaN(days) && days > 0) {
          const today = new Date();
          today.setHours(0,0,0,0);
          const targetDate = new Date(today);
          targetDate.setDate(today.getDate() + days);
          const dateStr = targetDate.toISOString().split('T')[0];
          form.setValuesIn('delivery_date', dateStr);
          // 只要生产天数变动，允许再次自动联动
          deliveryDateManuallySet.current = false;
        }
      });

      // 监听预计交期变化，标记为手动设置
      onFieldValueChange('delivery_date', () => {
        deliveryDateManuallySet.current = true;
      });

      // 监听币种变化，自动更新汇率
      onFieldValueChange('currency', () => {
        const currency = form.values.currency as string;
        if (currency === 'CNY') {
          form.setValuesIn('exchange_rate', 1);
        }
      });

      // 监听状态变化，通知父组件
      onFieldValueChange('status', () => {
        const newStatus = form.values.status as string;
        if (newStatus && onStatusChange) {
          onStatusChange(newStatus);
        }
      });
    }
  });

  // 监听 initialValues 变化，更新表单数据
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      form.setValues(initialValues);
    }
  }, [initialValues, form]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
      {/* 优化的头部区域 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <div className="flex flex-row justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">⚙️</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">管理员订单</h3>
              <p className="text-blue-100 text-sm">Order Management Panel</p>
            </div>
          </div>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => setIsEdit(e => !e)}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            {isEdit ? (
              <>
                <span className="mr-1">👁️</span>
                只读模式
              </>
            ) : (
              <>
                <span className="mr-1">✏️</span>
                编辑模式
              </>
            )}
          </Button>
        </div>
        
        {/* 优化的计算按钮组 */}
        {!hideActionButtons && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <Button 
                type="button" 
                variant="secondary" 
                size="sm" 
                onClick={async () => {
                  try {
                    setIsCalculating(true);
                    onCalcPCB?.(form.values);
                  } finally {
                    setTimeout(() => setIsCalculating(false), 500);
                  }
                }} 
                disabled={!isEdit || isCalculating || isSaving}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
              >
                {isCalculating ? (
                  <>
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                    计算中
                  </>
                ) : (
                  <>
                    🔧 PCB计算
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                size="sm" 
                onClick={async () => {
                  try {
                    setIsCalculating(true);
                    onCalcDelivery?.(form.values);
                  } finally {
                    setTimeout(() => setIsCalculating(false), 500);
                  }
                }} 
                disabled={!isEdit || isCalculating || isSaving}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
              >
                {isCalculating ? (
                  <>
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                    计算中
                  </>
                ) : (
                  <>
                    📅 交期计算
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                size="sm" 
                onClick={async () => {
                  try {
                    setIsCalculating(true);
                    onCalcShipping?.(form.values);
                  } finally {
                    setTimeout(() => setIsCalculating(false), 500);
                  }
                }} 
                disabled={!isEdit || isCalculating || isSaving}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
              >
                {isCalculating ? (
                  <>
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                    计算中
                  </>
                ) : (
                  <>
                    🚚 运费计算
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                size="sm" 
                onClick={async () => {
                  try {
                    setIsCalculating(true);
                    onRecalc(form.values);
                  } finally {
                    setTimeout(() => setIsCalculating(false), 800);
                  }
                }} 
                disabled={!isEdit || isCalculating || isSaving}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-medium"
              >
                {isCalculating ? (
                  <>
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                    计算中
                  </>
                ) : (
                  <>
                    🔄 全部重算
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
      {/* 优化的内容区域 */}
      <div className="p-6">
        <FormProvider form={form}>
          {/* 订单状态可视化 */}
          <div className="mb-6">
            <OrderStatusVisualization 
              status={form.values.status as string} 
              paymentStatus={form.values.payment_status as string} 
            />
          </div>
          
          {/* 优化的表单分组 */}
          <div className="space-y-6">
            {formGroups.map((group, groupIndex) => (
              <div key={group.title} className="group">
                {/* 优化的分组标题 */}
                {group.title !== "加价项" && (
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
                        groupIndex === 0 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                        groupIndex === 1 ? 'bg-gradient-to-r from-blue-500 to-cyan-600' :
                        groupIndex === 2 ? 'bg-gradient-to-r from-purple-500 to-violet-600' :
                        'bg-gradient-to-r from-orange-500 to-red-600'
                      }`}>
                        {groupIndex + 1}
                      </div>
                      <h4 className="text-lg font-semibold text-gray-800">{group.title}</h4>
                    </div>
                    
                    {/* 功能提示标签 */}
                    {group.title === "价格管理" && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                          💱 币种汇率联动
                        </span>
                        <span className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                          💡 价格自动计算
                        </span>
                        <span className="inline-flex items-center px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                          🔧 PCB可单独计算
                        </span>
                      </div>
                    )}
                    {group.title === "费用明细" && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="inline-flex items-center px-2 py-1 bg-violet-50 text-violet-700 rounded-full text-xs font-medium">
                          📅 交期运费可计算
                        </span>
                        <span className="inline-flex items-center px-2 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium">
                          🚚 智能运费估算
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* 优化的表单字段布局 */}
                <div className={`${
                  group.layout === "single" 
                    ? "space-y-4" 
                    : "grid grid-cols-1 lg:grid-cols-2 gap-4"
                } ${
                  group.title !== "加价项" 
                    ? "p-4 bg-gray-50/50 rounded-xl border border-gray-100" 
                    : "p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200"
                }`}>
                  {group.fields.map(field => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const fieldSchema = (adminOrderSchema.properties as any)[field];
                    const title = fieldSchema?.title || field;
                    
                    return (
                      <div key={field} className={group.layout === "single" ? "col-span-full" : ""}>
                        {/* 自定义字段标签 */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 block">
                            {title}
                          </label>
                          <div className="relative">
                            <SchemaField 
                              name={field} 
                              schema={fieldSchema} 
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* 优化的操作按钮区域 */}
          {!hideActionButtons && (
            <div className="sticky bottom-0 bg-white py-4 px-2 border-t border-gray-200 z-10 rounded-b-2xl">
              <div className="flex gap-3 justify-end">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={async () => {
                    try {
                      setIsSaving(true);
                      await onSave(form.values);
                    } catch (error) {
                      console.error('保存失败:', error);
                    } finally {
                      setIsSaving(false);
                    }
                  }} 
                  disabled={!isEdit || isSaving}
                  className={`border-gray-300 hover:bg-gray-50 ${isSaving ? "opacity-70" : ""}`}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      保存中...
                    </>
                  ) : (
                    <>
                      <span className="mr-1">💾</span>
                      {submitButtonText || '仅保存'}
                    </>
                  )}
                </Button>

                <SaveAndNotifyDialog 
                  onConfirm={async (notificationType) => {
                    try {
                      setIsSaving(true);
                      await onSave(form.values, { sendNotification: true, notificationType });
                    } catch (error) {
                      console.error('保存并通知失败:', error);
                      throw error;
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                >
                  <Button 
                    type="button" 
                    disabled={!isEdit || isSaving} 
                    className={`bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg ${isSaving ? "opacity-70" : ""}`}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    {submitButtonText ? `${submitButtonText}并通知` : '保存并通知'}
                  </Button>
                </SaveAndNotifyDialog>
              </div>
            </div>
          )}
        </FormProvider>
      </div>
    </div>
  );
}

// 邮件通知类型配置
const EMAIL_NOTIFICATION_TYPES = {
  order_updated: {
    label: '订单更新通知',
    description: '通知客户订单信息已更新',
    icon: '📝',
  },
  payment_received: {
    label: '付款确认通知',
    description: '通知客户付款已确认，生产即将开始',
    icon: '💰',
  },
  order_shipped: {
    label: '订单发货通知',
    description: '通知客户订单已发货',
    icon: '📦',
  },
  order_completed: {
    label: '订单完成通知',
    description: '通知客户订单已完成并交付',
    icon: '✅',
  }
} as const;

// 新增：保存并通知对话框
function SaveAndNotifyDialog({ onConfirm, children }: { onConfirm: (notificationType: string) => Promise<void>, children: React.ReactNode }) {
  const [notificationType, setNotificationType] = useState('order_updated');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await onConfirm(notificationType);
      setIsOpen(false); // 成功后关闭对话框
    } catch (error) {
      // 错误处理由父组件的onConfirm函数处理，这里不需要额外处理
      console.error('保存并通知失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>发送邮件通知</DialogTitle>
          <DialogDescription>
            保存订单后，将向客户发送一封邮件通知。请选择合适的通知类型。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notification-type" className="text-right">
              通知类型
            </Label>
            <div className="col-span-3">
              <ShadSelect 
                value={notificationType} 
                onValueChange={setNotificationType}
                disabled={isLoading}
              >
                <ShadSelectTrigger id="notification-type">
                  <ShadSelectValue placeholder="选择通知类型..." />
                </ShadSelectTrigger>
                <ShadSelectContent>
                  {Object.entries(EMAIL_NOTIFICATION_TYPES).map(([key, info]) => (
                    <ShadSelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span>{info.icon}</span>
                        <span>{info.label}</span>
                      </div>
                    </ShadSelectItem>
                  ))}
                </ShadSelectContent>
              </ShadSelect>
            </div>
          </div>
          {notificationType && (
            <div className="col-span-4 ml-auto text-sm text-gray-500 p-2 bg-gray-50 rounded-md w-full">
              {EMAIL_NOTIFICATION_TYPES[notificationType as keyof typeof EMAIL_NOTIFICATION_TYPES].description}
            </div>
          )}
          
          {/* 加载状态提示 */}
          {isLoading && (
            <div className="col-span-4 flex items-center gap-2 p-3 bg-blue-50 rounded-md border border-blue-200">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-700">正在保存订单并发送邮件通知...</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={isLoading}
            className={isLoading ? "opacity-70" : ""}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                处理中...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                确认发送
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 