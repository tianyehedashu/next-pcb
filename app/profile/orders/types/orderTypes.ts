import { PaymentIntentStatus } from "@/lib/utils/orderHelpers";

export interface AdminOrderInfo {
  id: string;
  status: string;
  admin_price: number | null;
  currency: string;
  payment_status?: string | null;
  refund_status?: string | null;
  requested_refund_amount?: number | null;
  approved_refund_amount?: number | null;
  [key: string]: unknown;
}

export interface OrderListItem {
  id: string;
  user_id?: string | null;
  email: string;
  phone?: string | null;
  product_type: 'pcb' | 'stencil' | 'smt' | 'combo';
  product_types?: string[];
  pcb_spec: Record<string, unknown>;
  stencil_spec?: Record<string, unknown>;
  smt_spec?: Record<string, unknown>;
  assembly_spec?: Record<string, unknown>;
  cal_values?: Record<string, unknown>;
  shipping_address?: Record<string, unknown>;
  gerber_file_url?: string | null;
  status: 'pending' | 'quoted' | 'confirmed' | 'production' | 'shipped' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  user_name?: string | null;
  payment_intent_id?: string | null;
  admin_orders?: AdminOrderInfo[] | AdminOrderInfo;
  payment_status_info?: PaymentIntentStatus;
}

export type SortField = 'created_at' | 'status' | 'admin_price' | 'lead_time';
export type SortOrder = 'asc' | 'desc';

export interface OrderSummary {
  layers: string;
  quantity: string;
  size: string;
  delivery: string;
  thickness: string;
  surfaceFinish: string;
}

export interface OrdersFilters {
  searchKeyword: string;
  searchColumn: string;
  backendSearchTerm: string;
  statusFilter: string;
  showCancelledOrders: boolean;
  dateStart?: Date;
  dateEnd?: Date;
}

export interface OrdersPagination {
  currentPage: number;
  pageSize: number;
  totalCount: number;
}

export interface OrdersSort {
  sortField: SortField;
  sortOrder: SortOrder;
} 