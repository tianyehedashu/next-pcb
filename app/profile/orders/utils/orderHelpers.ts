import { toUSD } from "@/lib/utils";
import { ORDER_STATUS_MAP } from "../constants/orderConstants";
import type { OrderListItem, AdminOrderInfo, OrderSummary } from "../types/orderTypes";

export const getAdminOrderInfo = (order: OrderListItem): AdminOrderInfo | null => {
  if (!order.admin_orders) return null;
  const adminOrder = Array.isArray(order.admin_orders) 
    ? order.admin_orders[0] 
    : order.admin_orders;
  return adminOrder || null;
};

export const getOrderSummary = (order: OrderListItem): OrderSummary => {
  const pcbSpec = order.pcb_spec as Record<string, unknown> & { 
    thickness?: number; 
    surfaceFinish?: string; 
    delivery?: string;
    deliveryOptions?: {
      delivery?: string;
      urgentReduceDays?: number;
    };
    layers?: number;
    singleCount?: number;
  };
  const singleDimensions = pcbSpec?.singleDimensions as Record<string, unknown> & { 
    length?: number; 
    width?: number; 
  } | undefined;
  
  // 获取delivery信息，优先使用新的deliveryOptions结构
  const delivery = pcbSpec?.deliveryOptions?.delivery || pcbSpec?.delivery || 'standard';
  const urgentReduceDays = pcbSpec?.deliveryOptions?.urgentReduceDays || 0;
  
  // 格式化delivery显示
  let deliveryDisplay = 'Standard';
  if (delivery === 'urgent' && urgentReduceDays > 0) {
    deliveryDisplay = `Urgent (-${urgentReduceDays}d)`;
  } else if (delivery === 'urgent') {
    deliveryDisplay = 'Urgent';
  }
  
  return {
    layers: String(pcbSpec?.layers || '-'),
    quantity: String(pcbSpec?.singleCount || '-'),
    size: singleDimensions?.length && singleDimensions?.width ? 
      `${singleDimensions.length}×${singleDimensions.width}mm` : '-',
    delivery: deliveryDisplay,
    thickness: pcbSpec?.thickness ? `${pcbSpec.thickness}mm` : '-',
    surfaceFinish: String(pcbSpec?.surfaceFinish || '-'),
  };
};

export const formatDateShort = (dateString: string | null): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatTimeShort = (dateString: string | null): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });
};

export const getDisplayStatus = (order: OrderListItem): string => {
  const adminOrder = getAdminOrderInfo(order);
  let displayStatus = order.status || 'pending';
  
  if (adminOrder?.refund_status === 'processed') {
    displayStatus = 'refunded';
  } else if (adminOrder?.payment_status === 'paid' && displayStatus === 'pending') {
    displayStatus = 'paid';
  }
  
  return displayStatus;
};

export const getStatusInfo = (status: string) => {
  return ORDER_STATUS_MAP[status] || ORDER_STATUS_MAP.pending;
};

export const formatOrderPrice = (order: OrderListItem): { price: string; label: string; isPrimary: boolean } => {
  const adminOrder = getAdminOrderInfo(order);
  
  if (adminOrder && adminOrder.admin_price != null && adminOrder.admin_price > 0) {
    return {
      price: toUSD(adminOrder.admin_price),
      label: 'Quoted Price',
      isPrimary: true
    };
  }

  if (order.cal_values && order.cal_values.totalPrice != null) {
    return {
      price: `~${toUSD(order.cal_values.totalPrice)}`,
      label: 'Estimated',
      isPrimary: false
    };
  }
  
  return {
    price: '-',
    label: '',
    isPrimary: false
  };
};

export const shouldShowPaymentButton = (order: OrderListItem): boolean => {
  const adminOrder = getAdminOrderInfo(order);
  return !!(
    adminOrder?.status === 'reviewed' && 
    adminOrder?.payment_status !== 'paid' && 
    adminOrder?.admin_price
  );
};

export const filterOrdersByKeyword = (orders: OrderListItem[], keyword: string, searchColumn?: string): OrderListItem[] => {
  if (!keyword.trim()) return orders;
  
  const searchTerm = keyword.toLowerCase();
  
  // 如果指定了搜索列，只在该列中搜索
  if (searchColumn) {
    return orders.filter(order => {
      switch (searchColumn) {
        case 'order_id':
          return order.id.toLowerCase().includes(searchTerm);
        case 'email':
          return order.email?.toLowerCase().includes(searchTerm) || false;
        case 'phone':
          return order.phone?.includes(searchTerm) || false;
        default:
          // 默认搜索所有列
          return order.email?.toLowerCase().includes(searchTerm) ||
                 order.phone?.includes(searchTerm) ||
                 order.id.toLowerCase().includes(searchTerm);
      }
    });
  }
  
  // 如果没有指定搜索列，搜索所有列（向后兼容）
  return orders.filter(order => 
    order.email?.toLowerCase().includes(searchTerm) ||
    order.phone?.includes(searchTerm) ||
    order.id.toLowerCase().includes(searchTerm)
  );
};

export const sortOrders = (
  orders: OrderListItem[], 
  sortField: string, 
  sortOrder: 'asc' | 'desc'
): OrderListItem[] => {
  return [...orders].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case 'created_at':
        aValue = a.created_at ? new Date(a.created_at).getTime() : 0;
        bValue = b.created_at ? new Date(b.created_at).getTime() : 0;
        break;
      case 'status':
        aValue = a.status || '';
        bValue = b.status || '';
        break;
      case 'admin_price':
        const aAdminOrder = getAdminOrderInfo(a);
        const bAdminOrder = getAdminOrderInfo(b);
        aValue = aAdminOrder?.admin_price || 0;
        bValue = bAdminOrder?.admin_price || 0;
        break;
      case 'lead_time':
        aValue = a.cal_values?.leadTimeDays || 0;
        bValue = b.cal_values?.leadTimeDays || 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
}; 