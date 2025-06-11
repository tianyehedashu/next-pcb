import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calculator, 
  Calendar, 
  Truck, 
  RotateCcw, 
  Save, 
  Plus, 
  Mail,
  CheckCircle,
  Send
} from 'lucide-react';

// Switch 组件的简单实现
const Switch = ({ id, checked, onCheckedChange, disabled }: {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onCheckedChange(!checked)}
    className={`
      relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      ${checked ? 'bg-blue-600' : 'bg-gray-200'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `}
  >
    <span
      className={`
        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
        ${checked ? 'translate-x-6' : 'translate-x-1'}
      `}
    />
  </button>
);

interface AdminOrderActionsProps {
  values: Record<string, unknown>;
  onSave: (values: Record<string, unknown>, options?: { sendNotification?: boolean; notificationType?: string }) => void;
  onRecalc: (values: Record<string, unknown>) => void;
  onCalcPCB?: (values: Record<string, unknown>) => void;
  onCalcDelivery?: (values: Record<string, unknown>) => void;
  onCalcShipping?: (values: Record<string, unknown>) => void;
  isAdminOrderCreated: boolean;
  disabled?: boolean;
  onStatusChange?: (newStatus: string) => void; // 新增：状态变更回调
}

// 邮件通知类型配置
const EMAIL_NOTIFICATION_TYPES = {
  order_created: {
    label: '订单创建通知',
    description: '通知客户订单已创建并开始处理',
    icon: '📋',
    color: 'blue'
  },
  order_updated: {
    label: '订单更新通知',
    description: '通知客户订单信息已更新',
    icon: '📝',
    color: 'indigo'
  },
  status_changed: {
    label: '状态变更通知',
    description: '通知客户订单状态已改变',
    icon: '🔄',
    color: 'purple'
  },
  payment_received: {
    label: '付款确认通知',
    description: '通知客户付款已确认，生产即将开始',
    icon: '💰',
    color: 'green'
  },
  production_started: {
    label: '生产开始通知',
    description: '通知客户订单已开始生产',
    icon: '🏭',
    color: 'red'
  },
  order_shipped: {
    label: '订单发货通知',
    description: '通知客户订单已发货',
    icon: '📦',
    color: 'violet'
  },
  order_completed: {
    label: '订单完成通知',
    description: '通知客户订单已完成并交付',
    icon: '✅',
    color: 'emerald'
  }
} as const;

export function AdminOrderActions({
  values,
  onSave,
  onRecalc,
  onCalcPCB,
  onCalcDelivery,
  onCalcShipping,
  isAdminOrderCreated,
  disabled = false,
  onStatusChange
}: AdminOrderActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [sendNotification, setSendNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<string>('order_updated');

  // 根据订单状态自动推荐邮件通知类型
  const getRecommendedNotificationType = (status: string, isNew: boolean) => {
    if (!isNew) return 'order_created';
    
    switch (status) {
      case 'paid':
      case 'payment_confirmed':
        return 'payment_received';
      case 'in_production':
      case 'production':
        return 'production_started';
      case 'shipped':
      case 'shipping':
        return 'order_shipped';
      case 'completed':
      case 'delivered':
        return 'order_completed';
      default:
        return 'order_updated';
    }
  };

  // 监听状态变化并自动更新通知类型
  React.useEffect(() => {
    const currentStatus = values.status as string;
    const recommendedType = getRecommendedNotificationType(currentStatus, isAdminOrderCreated);
    setNotificationType(recommendedType);
  }, [values.status, isAdminOrderCreated]);

  // 快速状态操作
  const handleQuickStatusChange = async (newStatus: string, notificationType: string) => {
    if (disabled || isLoading) return;
    
    setIsLoading(true);
    try {
      // 更新状态和通知设置
      setSendNotification(true);
      setNotificationType(notificationType);
      
      // 通知父组件状态变更（用于同步表单）
      onStatusChange?.(newStatus);
      
      // 执行保存操作
      await onSave({ ...values, status: newStatus }, { 
        sendNotification: true, 
        notificationType 
      });
    } catch (error) {
      console.error('Quick status change failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (actionType: 'save' | 'calc-pcb' | 'calc-delivery' | 'calc-shipping' | 'recalc') => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    try {
      switch (actionType) {
        case 'save':
          await onSave(values, { 
            sendNotification, 
            notificationType: sendNotification ? notificationType : undefined 
          });
          break;
        case 'calc-pcb':
          onCalcPCB?.(values);
          break;
        case 'calc-delivery':
          onCalcDelivery?.(values);
          break;
        case 'calc-shipping':
          onCalcShipping?.(values);
          break;
        case 'recalc':
          onRecalc(values);
          break;
      }
    } catch (error) {
      console.error(`Action ${actionType} failed:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const getNotificationTypeInfo = (type: string) => {
    return EMAIL_NOTIFICATION_TYPES[type as keyof typeof EMAIL_NOTIFICATION_TYPES] || EMAIL_NOTIFICATION_TYPES.order_updated;
  };

  const currentNotificationInfo = getNotificationTypeInfo(notificationType);

  return (
    <Card className="bg-white shadow-sm border border-gray-100">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm">⚡</span>
          </div>
          操作中心
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 计算操作区 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            计算与分析
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction('calc-pcb')}
              disabled={disabled || isLoading}
              className="flex items-center gap-2 text-xs hover:bg-blue-50 hover:border-blue-200"
            >
              <span className="text-base">🔧</span>
              PCB计算
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction('calc-delivery')}
              disabled={disabled || isLoading}
              className="flex items-center gap-2 text-xs hover:bg-purple-50 hover:border-purple-200"
            >
              <Calendar className="w-3 h-3" />
              交期计算
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction('calc-shipping')}
              disabled={disabled || isLoading}
              className="flex items-center gap-2 text-xs hover:bg-orange-50 hover:border-orange-200"
            >
              <Truck className="w-3 h-3" />
              运费计算
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction('recalc')}
              disabled={disabled || isLoading}
              className="flex items-center gap-2 text-xs hover:bg-green-50 hover:border-green-200"
            >
              <RotateCcw className="w-3 h-3" />
              全部重算
            </Button>
          </div>
        </div>

        {/* 邮件通知设置 */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              邮件通知
            </h4>
            <div className="flex items-center space-x-2">
              <Switch
                id="send-notification"
                checked={sendNotification}
                onCheckedChange={setSendNotification}
                disabled={disabled}
              />
              <Label htmlFor="send-notification" className="text-sm text-gray-600">
                发送通知
              </Label>
            </div>
          </div>
          
          {sendNotification && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-600 mb-1 block">通知类型</Label>
                <Select 
                  value={notificationType} 
                  onValueChange={setNotificationType}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="选择通知类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EMAIL_NOTIFICATION_TYPES).map(([key, info]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <span>{info.icon}</span>
                          <div>
                            <div className="font-medium text-sm">{info.label}</div>
                            <div className="text-xs text-gray-500">{info.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className={`p-3 rounded-lg border text-xs bg-${currentNotificationInfo.color}-50 border-${currentNotificationInfo.color}-200`}>
                <div className="flex items-center gap-2 font-medium text-gray-700">
                  <span>{currentNotificationInfo.icon}</span>
                  {currentNotificationInfo.label}
                </div>
                <p className="text-gray-600 mt-1">{currentNotificationInfo.description}</p>
              </div>
            </div>
          )}
        </div>

        {/* 主要操作按钮 */}
        <div className="border-t pt-4">
          <Button
            onClick={() => handleAction('save')}
            disabled={disabled || isLoading}
            size="lg"
            className={`w-full flex items-center justify-center gap-2 ${
              isAdminOrderCreated 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                处理中...
              </>
            ) : (
              <>
                {isAdminOrderCreated ? (
                  <>
                    <Save className="w-4 h-4" />
                    保存更新
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    创建订单
                  </>
                )}
                {sendNotification && (
                  <div className="flex items-center gap-1 ml-2 px-2 py-1 bg-white/20 rounded-full">
                    <Send className="w-3 h-3" />
                    <span className="text-xs">通知</span>
                  </div>
                )}
              </>
            )}
          </Button>
          
          {isAdminOrderCreated && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              {sendNotification 
                ? `保存后将发送"${currentNotificationInfo.label}"给客户` 
                : '保存订单信息（不发送邮件通知）'
              }
            </p>
          )}
        </div>

        {/* 快速状态操作（仅在已创建订单时显示） */}
        {isAdminOrderCreated && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              快速状态更新
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickStatusChange('payment_confirmed', 'payment_received')}
                disabled={disabled || isLoading}
                className="flex items-center gap-2 text-xs hover:bg-green-50 hover:border-green-200"
              >
                <span className="text-green-600">💰</span>
                确认付款
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickStatusChange('in_production', 'production_started')}
                disabled={disabled || isLoading}
                className="flex items-center gap-2 text-xs hover:bg-red-50 hover:border-red-200"
              >
                <span className="text-red-600">🏭</span>
                开始生产
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickStatusChange('shipped', 'order_shipped')}
                disabled={disabled || isLoading}
                className="flex items-center gap-2 text-xs hover:bg-violet-50 hover:border-violet-200"
              >
                <span className="text-violet-600">📦</span>
                订单发货
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickStatusChange('completed', 'order_completed')}
                disabled={disabled || isLoading}
                className="flex items-center gap-2 text-xs hover:bg-emerald-50 hover:border-emerald-200"
              >
                <span className="text-emerald-600">✅</span>
                订单完成
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 