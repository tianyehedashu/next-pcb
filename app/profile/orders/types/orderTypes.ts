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
  created_at: string | null;
  status: string | null;
  pcb_spec?: Record<string, unknown>;
  cal_values?: { leadTimeDays?: number; totalPrice?: number };
  payment_intent_id?: string | null;
  admin_orders?: AdminOrderInfo[] | AdminOrderInfo;
  payment_status_info?: PaymentIntentStatus;
  email?: string;
  phone?: string;
  [key: string]: unknown;
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