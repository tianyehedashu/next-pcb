import { QuoteFormData } from '@/app/quote2/schema/quoteSchema';

export interface SurchargeItem {
  id: string;
  price: number;
  currency: string;
  location: string;
  method: string;
  title?: string;
  time_range?: string;
}

export interface AdminOrder {
  id: string;
  quote_id: string;
  admin_id: string;
  admin_price: number;
  admin_notes: string | null;
  admin_note?: string; // 保持向后兼容
  currency: string;
  status: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
   // 添加常用字段
   due_date?: string;
   delivery_date?: string;
   surcharges?: Array<{name: string; amount: number}>;
   exchange_rate?: number | string;
   pcb_price?: number | string;
   ship_price?: number | string;
   custom_duty?: number | string;
   coupon?: number | string;
   payment_status?: string;
   production_days?: number | string;
   pay_time?: string;
   cny_price?: number | string;
   refund_status?: string;
   requested_refund_amount?: number;
   approved_refund_amount?: number;
}

export interface PcbSpec {
  singleCount: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  singleDimensions: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface StencilSpec {
  stencilType?: string;
  quantity?: number;
  size?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface SmtSpec {
  components?: number;
  placement?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface AssemblySpec {
  components?: number;
  assemblyType?: string;
  [key: string]: any;
}

export interface Order {
  id: string;
  user_id?: string | null;
  email: string;
  phone?: string | null;
  product_type?: string;
  product_types?: string[];
  pcb_spec?: PcbSpec | QuoteFormData | null;
  stencil_spec?: StencilSpec | null;
  smt_spec?: SmtSpec | null;
  assembly_spec?: AssemblySpec | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cal_values?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shipping_address?: any;
  
  // 文件字段（扩展版）
  gerber_file_url?: string | null;         // 保留现有字段
  design_files_url?: string | null;        // 新增：统一设计文件
  bom_file_url?: string | null;            // 新增：BOM文件
  placement_file_url?: string | null;      // 新增：SMT贴片位置文件
  stencil_file_url?: string | null;        // 新增：钢网设计文件
  specification_file_url?: string | null;  // 新增：规格文档
  additional_files_url?: string | null;    // 新增：其他补充文件
  

  status: string;
  created_at: string;
  updated_at: string;
  user_name?: string | null;
  payment_intent_id?: string | null;
  admin_orders?: AdminOrder | AdminOrder[] | null;
  
  [key: string]: any;
}

export interface Spec {
  borderType?: string;
  borderData?: {
    cutMethod?: string;
    cutSize?: number;
  };
  stencilType?: string;
  deliveryAsSet?: boolean;
  [key: string]: any;
}

export interface OrderListResponse {
  data: Order[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface OrderFilterParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
  userId?: string;
  start?: string;
  end?: string;
  id?: string;
}

// 文件上传状态枚举
export enum FileUploadStatus {
  INCOMPLETE = 'incomplete',
  PENDING_VALIDATION = 'pending_validation',
  COMPLETE = 'complete',
  INVALID = 'invalid'
}

export interface AddressFormValue {
  id?: string;
  country: string;
  state: string;
  city: string;
  address: string;
  zipCode: string;
  contactName: string;
  phone: string;
  courier: string;
  label?: string;
  isDefault?: boolean;
  countryName?: string;
  stateName?: string;
  cityName?: string;
  courierName?: string;
}

export interface AdminOrderDetail extends Order {
  admin_orders: AdminOrder;
}

export interface OrderListItem extends Order {
  displayProductType?: string;
  displayStatus?: string;
  displayPrice?: string;
}

export type ProductSpec = {
  productType: 'pcb';
  spec: Record<string, any>;
} | {
  productType: 'stencil';
  spec: Record<string, any>;
} | {
  productType: 'combo';
  pcbSpec: Record<string, any>;
  stencilSpec: Record<string, any>;
  comboSpec: Record<string, any>;
};

export function isPcbOrder(order: Order): boolean {
  return order.product_types?.includes('pcb') || order.product_type === 'pcb';
}

export function isStencilOrder(order: Order): boolean {
  return order.product_types?.includes('stencil') || order.product_type === 'stencil';
}

export function isSmtOrder(order: Order): boolean {
  return order.product_types?.includes('smt') || order.product_type === 'smt';
}

export function isComboOrder(order: Order): boolean {
  return (order.product_types?.length || 0) > 1 || order.product_type === 'combo';
}

export function getOrderSpec(order: Order): PcbSpec | StencilSpec | SmtSpec | null {
  if (isPcbOrder(order)) {
    return order.pcb_spec;
  } else if (isStencilOrder(order)) {
    return order.stencil_spec;
  } else if (isSmtOrder(order)) {
    return order.smt_spec;
  }
  return null;
}

export function getProductTypeDisplay(order: Order): string {
  if (isComboOrder(order)) {
    const types = order.product_types || [];
    const displayNames: { [key: string]: string } = {
      pcb: 'PCB',
      stencil: 'Stencil',
      smt: 'SMT Assembly'
    };
    return types.map(type => displayNames[type] || type).join(' + ');
  }
  
  switch (order.product_type) {
    case 'pcb':
      return 'PCB';
    case 'stencil':
      return 'Stencil';
    case 'smt':
      return 'SMT Assembly';
    case 'combo':
      return 'Combo Order';
    default:
      return 'Unknown';
  }
}

export function hasProductType(order: Order, productType: string): boolean {
  return order.product_types?.includes(productType) || order.product_type === productType;
}

export function getOrderProductTypes(order: Order): string[] {
  return order.product_types || [order.product_type];
}

export function detectLegacyProductType(order: Order): 'pcb' | 'stencil' | 'combo' {
  if (order.product_type && order.product_types) {
    return order.product_type as 'pcb' | 'stencil' | 'combo';
  }
  
  if (order.stencil_spec) {
    return 'stencil';
  } else if (order.pcb_spec?.borderType || order.pcb_spec?.stencilType) {
    return 'stencil';
  } else {
    return 'pcb';
  }
} 