import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createForm, onFieldValueChange } from "@formily/core";
import { FormProvider, createSchemaField, useForm } from "@formily/react";
import { formilyComponents } from "@/app/quote2/components/FormilyComponents";
import FormFieldLayout from "@/app/quote2/components/FormFieldLayout";
import { Trash2, Plus, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import OrderStepBar from "@/components/ui/OrderStepBar";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";

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

// 管理员订单表单schema
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
      },
      "x-decorator": "FormFieldLayout"
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
      },
      "x-decorator": "FormFieldLayout"
    },
    due_date: {
      type: "string",
      title: "到期日",
      "x-component-props": { type: "date" },
      "x-decorator": "FormFieldLayout",
      "x-component": "Input"
    },
    pay_time: {
      type: "string",
      title: "支付时间 🔒",
      "x-component-props": { 
        type: "datetime-local", 
        readonly: true,
        placeholder: "系统自动记录"
      },
      "x-decorator": "FormFieldLayout",
      "x-component": "Input"
    },
    pcb_price: {
      type: "number",
      title: "PCB价格",
      "x-component-props": { step: 0.01, placeholder: "可手动输入或通过重新计算获得" },
      "x-decorator": "FormFieldLayout",
      "x-component": "Input"
    },
    admin_price: {
      type: "number",
      title: "管理员价格 📊",
      "x-component-props": { 
        step: 0.01, 
        readonly: true,
        placeholder: "自动计算"
      },
      "x-decorator": "FormFieldLayout",
      "x-component": "Input"
    },
    currency: {
      type: "string",
      title: "币种",
      "x-component": "CurrencySelect",
      "x-component-props": {
        placeholder: "请选择币种"
      },
      "x-decorator": "FormFieldLayout"
    },
    exchange_rate: {
      type: "number",
      title: "汇率 (兑人民币)",
      "x-component": "ExchangeRateInput",
      "x-component-props": {
        step: 0.01,
        min: 0
      },
      "x-decorator": "FormFieldLayout"
    },
    coupon: {
      type: "number",
      title: "优惠券",
      "x-component-props": { step: 0.01, min: 0 },
      "x-decorator": "FormFieldLayout",
      "x-component": "Input"
    },
    ship_price: {
      type: "number",
      title: "运费",
      "x-component-props": { step: 0.01, min: 0 },
      "x-decorator": "FormFieldLayout",
      "x-component": "Input"
    },
    custom_duty: {
      type: "number",
      title: "关税",
      "x-component-props": { step: 0.01, min: 0 },
      "x-decorator": "FormFieldLayout",
      "x-component": "Input"
    },
    cny_price: {
      type: "number",
      title: "CNY价格 💴",
      "x-component-props": { 
        step: 0.01, 
        min: 0, 
        readonly: true,
        placeholder: "自动计算"
      },
      "x-decorator": "FormFieldLayout",
      "x-component": "Input"
    },
    production_days: {
      type: "number",
      title: "生产天数",
      "x-component-props": { min: 1, placeholder: "可手动输入或通过交期计算获得" },
      "x-decorator": "FormFieldLayout",
      "x-component": "Input"
    },
    delivery_date: {
      type: "string",
      title: "预计交期 📅",
      "x-component-props": { 
        type: "date", 
        placeholder: "可手动输入或自动联动"
      },
      "x-decorator": "FormFieldLayout",
      "x-component": "Input"
    },
    admin_note: {
      type: "string",
      title: "管理员备注",
      "x-component-props": {
        rows: 3,
        placeholder: "请输入管理员备注..."
      },
      "x-decorator": "FormFieldLayout",
      "x-component": "TextArea"
    },
    surcharges: {
      type: "array",
      title: "加价项",
      "x-component": "SurchargesInput",
      "x-decorator": "FormFieldLayout"
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

const SchemaField = createSchemaField({
  components: {
    ...formilyComponents,
    FormFieldLayout,
    SurchargesInput,
    CurrencySelect,
    ExchangeRateInput
  }
});

interface AdminOrderFormProps {
  initialValues: Record<string, unknown>;
  onSave: (values: Record<string, unknown>) => void;
  onRecalc: (values: Record<string, unknown>) => void;
  onCalcPCB?: (values: Record<string, unknown>) => void;
  onCalcDelivery?: (values: Record<string, unknown>) => void;
  onCalcShipping?: (values: Record<string, unknown>) => void;
  readOnly?: boolean;
  submitButtonText?: string;
}

export function AdminOrderForm({ initialValues, onSave, onRecalc, onCalcPCB, onCalcDelivery, onCalcShipping, readOnly, submitButtonText }: AdminOrderFormProps) {
  const [isEdit, setIsEdit] = useState(!readOnly);
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

      // 监听生产天数变化，自动推算预计交期（仅当未手动设置时）
      onFieldValueChange('production_days', () => {
        const days = Number(form.values.production_days);
        if (!isNaN(days) && days > 0 && !deliveryDateManuallySet.current) {
          const today = new Date();
          today.setHours(0,0,0,0);
          const targetDate = new Date(today);
          targetDate.setDate(today.getDate() + days);
          const dateStr = targetDate.toISOString().split('T')[0];
          form.setValuesIn('delivery_date', dateStr);
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
    }
  });

  // 监听 initialValues 变化，更新表单数据
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      form.setValues(initialValues);
    }
  }, [initialValues, form]);

  return (
    <Card className="sticky top-4">
      <CardHeader className="space-y-3">
        <div className="flex flex-row justify-between items-center">
          <CardTitle>管理员订单</CardTitle>
          <Button variant="outline" onClick={() => setIsEdit(e => !e)}>
            {isEdit ? "只读" : "编辑"}
          </Button>
        </div>
        
        {/* 计算按钮组 */}
        <div className="flex gap-2 justify-center flex-wrap">
          <Button type="button" variant="outline" size="sm" onClick={() => onCalcPCB?.(form.values)} disabled={!isEdit}>
            🔧 PCB计算
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onCalcDelivery?.(form.values)} disabled={!isEdit}>
            📅 交期计算
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onCalcShipping?.(form.values)} disabled={!isEdit}>
            🚚 运费计算
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => onRecalc(form.values)} disabled={!isEdit}>
            🔄 全部重算
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <FormProvider form={form}>
          {/* 订单状态可视化 */}
          <OrderStatusVisualization 
            status={form.values.status as string} 
            paymentStatus={form.values.payment_status as string} 
          />
          
          {formGroups.map(group => (
            <div key={group.title} className="mb-4">
              {/* 只为非加价项组显示标题 */}
              {group.title !== "加价项" && (
                <div className="font-semibold mb-2 flex items-center gap-2">
                  {group.title}
                  {group.title === "价格管理" && (
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                      💱 币种汇率联动 | 💡 价格自动计算 | 🔧 PCB可单独计算
                    </span>
                  )}
                  {group.title === "费用明细" && (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                      📅 交期运费可计算
                    </span>
                  )}
                </div>
              )}
              <div className={group.layout === "single" ? "space-y-4" : "grid grid-cols-2 gap-4"}>
                {group.fields.map(field => (
                  <SchemaField 
                    key={field} 
                    name={field} 
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    schema={(adminOrderSchema.properties as any)[field]} 
                  />
                ))}
              </div>
            </div>
          ))}

          <div className="sticky bottom-0 bg-white py-2 z-10">
            {/* 主要操作按钮 */}
            <div className="flex gap-2 justify-end">
              <Button type="button" onClick={() => onSave(form.values)} disabled={!isEdit}>
                {submitButtonText || '保存'}
              </Button>
            </div>
          </div>
        </FormProvider>
      </CardContent>
    </Card>
  );
} 