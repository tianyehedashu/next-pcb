// 订单相关的辅助函数

export interface AdminOrder {
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
  payment_status?: string | null;
  payment_intent_id?: string | null;
  payment_method?: string | null;
  paid_at?: string | null;
}

export interface OrderWithAdminOrder {
  id: string;
  user_id: string | null;
  email: string;
  phone: string | null;
  shipping_address: Record<string, unknown> | null;
  pcb_spec: Record<string, unknown> | null;
  gerber_file_url: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  user_name: string | null;
  payment_intent_id?: string | null;
  admin_orders?: AdminOrder[] | AdminOrder;
}

/**
 * 获取订单的管理员订单信息（一对一关系）
 * @param order 包含admin_orders的订单对象
 * @returns 管理员订单信息或null
 */
export function getAdminOrder(order: OrderWithAdminOrder): AdminOrder | null {
  if (!order.admin_orders) {
    return null;
  }
  // 同时处理数组和对象两种情况
  if (Array.isArray(order.admin_orders)) {
    return order.admin_orders[0] || null;
  }
  return order.admin_orders;
}

/**
 * 检查订单是否可以支付
 * @param order 订单对象
 * @returns 是否可以支付
 */
export function canOrderBePaid(order: OrderWithAdminOrder): boolean {
  const adminOrder = getAdminOrder(order);
  
  if (!adminOrder) {
    return false;
  }
  
  // 必须有管理员设置的价格
  if (!adminOrder.admin_price || adminOrder.admin_price <= 0) {
    return false;
  }
  
  // 必须管理员已审核通过（状态为 'reviewed'）或支付失败可重试（状态为 'payment_failed'）
  if (adminOrder.status !== 'reviewed' && adminOrder.status !== 'payment_failed') {
    return false;
  }
  
  // 必须未支付
  if (adminOrder.payment_status === 'paid') {
    return false;
  }
  
  return true;
}

export interface PaymentIntentStatus {
  hasPaymentIntent: boolean;
  stripeStatus?: string;
  paymentIntentId?: string;
  dbStatus?: string;
  amount?: number;
  currency?: string;
  isPaid?: boolean;
  needsSync?: boolean;
  error?: string;
}

/**
 * 检查订单是否处于失败支付状态，需要重新支付
 * @param order 订单对象
 * @param paymentIntentStatus 支付意图状态
 * @returns 是否需要重新支付
 */
export function isPaymentRetryable(order: OrderWithAdminOrder, paymentIntentStatus?: PaymentIntentStatus): boolean {
  if (!canOrderBePaid(order)) {
    return false;
  }
  
  // 如果没有支付意图，可以支付
  if (!paymentIntentStatus?.hasPaymentIntent) {
    return true;
  }
  
  // 可重试的Stripe状态
  const retryableStatuses = [
    'failed',
    'canceled',
    'requires_payment_method',
    'requires_action',
    'requires_confirmation'
  ];
  
  return retryableStatuses.includes(paymentIntentStatus.stripeStatus || '');
}

/**
 * 获取支付状态描述
 * @param order 订单对象
 * @param paymentIntentStatus 支付意图状态
 * @returns 支付状态描述
 */
export function getPaymentStatusDescription(order: OrderWithAdminOrder, paymentIntentStatus?: PaymentIntentStatus): string {
  const adminOrder = getAdminOrder(order);
  
  if (adminOrder?.payment_status === 'paid') {
    return 'Payment Completed';
  }
  
  if (!canOrderBePaid(order)) {
    if (!adminOrder?.admin_price) {
      return 'Waiting for Price Quote';
    }
    if (adminOrder?.status !== 'reviewed') {
      return 'Waiting for Admin Review';
    }
    return 'Not Ready for Payment';
  }
  
  if (!paymentIntentStatus?.hasPaymentIntent) {
    return 'Ready for Payment';
  }
  
  const status = paymentIntentStatus.stripeStatus;
  switch (status) {
    case 'requires_payment_method':
      return 'Payment Failed - Retry Available';
    case 'requires_action':
      return 'Payment Requires Action';
    case 'requires_confirmation':
      return 'Payment Needs Confirmation';
    case 'processing':
      return 'Payment Processing';
    case 'failed':
      return 'Payment Failed - Retry Available';
    case 'canceled':
      return 'Payment Canceled - Retry Available';
    case 'succeeded':
      return 'Payment Completed';
    default:
      return 'Unknown Payment Status';
  }
}

/**
 * 获取订单的支付状态
 * @param order 订单对象
 * @returns 支付状态
 */
export function getOrderPaymentStatus(order: OrderWithAdminOrder): string {
  const adminOrder = getAdminOrder(order);
  return adminOrder?.payment_status || 'unpaid';
}

/**
 * 获取订单的总体状态
 * @param order 订单对象
 * @returns 订单状态
 */
export function getOrderStatus(order: OrderWithAdminOrder): string {
  const adminOrder = getAdminOrder(order);
  return adminOrder?.status || 'pending_review';
}

/**
 * 获取订单的支付金额
 * @param order 订单对象
 * @returns 支付金额
 */
export function getOrderPaymentAmount(order: OrderWithAdminOrder): number {
  const adminOrder = getAdminOrder(order);
  return adminOrder?.admin_price || 0;
}

/**
 * 格式化订单价格显示
 * @param order 订单对象
 * @returns 格式化后的价格字符串
 */
export function formatOrderPrice(order: OrderWithAdminOrder): string {
  const adminOrder = getAdminOrder(order);
  if (!adminOrder?.admin_price) {
    return 'Pending Quote';
  }
  
  const currency = adminOrder.currency || 'USD';
  const symbol = currency === 'CNY' ? '¥' : '$';
  return `${symbol}${adminOrder.admin_price.toFixed(2)}`;
}

/**
 * 获取订单的币种符号
 * @param order 订单对象
 * @returns 币种符号
 */
export function getOrderCurrencySymbol(order: OrderWithAdminOrder): string {
  const adminOrder = getAdminOrder(order);
  const currency = adminOrder?.currency || 'USD';
  return currency === 'CNY' ? '¥' : '$';
}

// 注意：canOrderBePaid 函数已更新，现在要求管理员状态必须为 'reviewed' 才能支付
// 这确保了只有管理员审核通过的订单才能进行支付 