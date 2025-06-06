export type OrderStatus = 'pending' | 'reviewed' | 'in_production' | 'shipped' | 'completed' | 'cancelled';

export interface AdminOrder {
  id: string;
  user_id: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  price?: number | null;
  admin_notes?: string | null;
  // ...可扩展更多字段
}

export interface Order {
  id: string;
  user_id: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  status: string;
  price?: number | null;
  admin_notes?: string | null;
  pcb_price?: number | null;
  pcb_lead_time?: number | null;
  pcb_status?: string | null;
  admin_order_status?: string | null;
  admin_order_price?: number | null;
  admin_order_lead_time?: number | null;
  type?: string;
} 