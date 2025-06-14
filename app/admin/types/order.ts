import { OrderStatus } from '@/types/form';

export interface SurchargeItem {
  name: string;
  amount: number;
}

export interface AdminOrder {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  quote: {
    id: string;
    board_name: string;
    quantity: number;
    unit_price: number;
  };
  pcb_price?: number | string | null;
  admin_price?: number | string | null;
  cny_price?: number | string | null;
  admin_note?: string | null;
  currency?: string | null;
  due_date?: string | null;
  pay_time?: string | null;
  exchange_rate?: number | string | null;
  payment_status?: string | null;
  production_days?: number | string | null;
  delivery_date?: string | null;
  coupon?: string | null;
  ship_price?: number | string | null;
  custom_duty?: number | string | null;
  surcharges?: SurchargeItem[];
  refund_status?: string | null;
  requested_refund_amount?: number | null;
  approved_refund_amount?: number | null;
}

export interface Order {
  id: string;
  user_id: string | null;
  email: string | null;
  phone: string | null;
  user_name: string | null;
  created_at: string;
  updated_at: string;
  status: string;
  admin_notes?: string | null;
  admin_quote_price?: number | null;
  pcb_price?: number | null;
  pcb_lead_time?: number | null;
  pcb_status?: string | null;
  gerber_file_url?: string | null;
  shipping_address?: {
    id: string;
    city: string;
    label: string;
    phone: string;
    state: string;
    address: string;
    country: string;
    courier: string;
    zipCode: string;
    isDefault: boolean;
    contactName: string;
  } | null;
  cal_values?: {
    pcbPrice: number;
    totalPrice: number;
    totalArea: number;
    unitPrice: number;
    priceNotes: string[];
    breakdown: {
      basePrice: number;
      testMethod: number;
      multilayerCopperWeight: number;
      [key: string]: number;
    };
    leadTimeDays: number;
    singlePcbArea: number;
    totalCount: number;
    leadTimeResult: {
      reason: string[];
      cycleDays: number;
    };
    minOrderQty: number;
    shippingCost: number;
    courierDays: string;
    estimatedFinishDate: string;
    courier?: string;
    tax?: number;
    discount?: number;
    shippingWeight?: number;
    shippingActualWeight?: number;
    shippingVolumetricWeight?: number;
  } | null;
  admin_orders?: {
    id: string;
    status: string;
    admin_price: number;
    currency: string;
    payment_status: string;
    production_days: number;
    delivery_date: string;
    due_date: string;
    admin_note: string;
    pcb_price: number;
    cny_price: number;
    exchange_rate: number;
    ship_price: number;
    custom_duty: number;
    coupon: number;
    surcharges: SurchargeItem[];
    refund_status: string;
    requested_refund_amount: number;
    approved_refund_amount: number;
  } | null;
  pcb_spec?: {
    tg: string;
    bga: boolean;
    hdi: string;
    border: string;
    layers: number;
    ulMark: boolean;
    minHole: string;
    pcbNote: string;
    pcbType: string;
    blueMask: boolean;
    delivery: string;
    halfHole: string;
    ipcClass: string;
    minTrace: string;
    panelSet: number;
    userNote: string;
    crossOuts: string;
    gerberUrl: string;
    impedance: boolean;
    maskCover: string;
    thickness: number;
    holeCu25um: boolean;
    silkscreen: string;
    solderMask: string;
    testMethod: string;
    customsNote: string;
    edgePlating: boolean;
    goldFingers: boolean;
    shipmentType: string;
    borderCutType: string;
    breakAwayRail: string;
    productReport: string[];
    surfaceFinish: string;
    workingGerber: string;
    ifDataConflicts: string;
    panelDimensions: {
      row: number;
      column: number;
    };
    specialRequests: string;
    singleDimensions: {
      width: number;
      length: number;
    };
    innerCopperWeight: string;
    outerCopperWeight: string;
    useShengyiMaterial: boolean;
    differentDesignsCount: number;
    shippingCostEstimation: {
      country: string;
      courier: string;
    };
  } | null;
  type?: 'Order' | 'Inquiry';
} 