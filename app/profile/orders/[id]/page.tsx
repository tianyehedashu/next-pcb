"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Pencil, Package, Clock, DollarSign, MapPin, FileText, AlertCircle, 
  ArrowLeft, CheckCircle, Truck, AlertTriangle, CreditCard, Info, Loader2, Calendar,
  Star, Shield, Zap
} from 'lucide-react';
import DownloadButton from '@/app/components/custom-ui/DownloadButton';
import OrderStepBar from '@/components/ui/OrderStepBar';
import { supabase } from '@/lib/supabaseClient';
import { useUserStore } from "@/lib/userStore";
import { quoteSchema, QuoteFormData } from '@/app/quote2/schema/quoteSchema';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/components/ui/use-toast';
import { AddressFormComponent, AddressFormValue } from '@/app/quote2/components/AddressFormComponent';
import { DeliveryType } from '@/app/quote2/schema/shared-types';

// Define cal_values type
interface CalValues {
  tax?: number;
  courier?: string;
  discount?: number;
  pcbPrice?: number;
  breakdown?: {
    basePrice?: number;
    testMethod?: number;
    multilayerCopperWeight?: number;
  };
  totalArea?: number;
  unitPrice?: number;
  priceNotes?: string[];
  totalCount?: number;
  totalPrice?: number;
  courierDays?: string;
  minOrderQty?: number;
  leadTimeDays?: number;
  shippingCost?: number;
  singlePcbArea?: number;
  leadTimeResult?: {
    reason?: string[];
    cycleDays?: number;
  };
  estimatedFinishDate?: string;
}

// Define more specific types
interface AdminOrder {
  id: number;
  payment_status?: string | null;
  order_status?: string | null;
  refund_status?: string | null;
  approved_refund_amount?: number | null;
  refund_reason?: string | null;
  admin_price?: number | null;
  currency?: string | null;
  status?: string | null;
  delivery_date?: string | null;
  admin_note?: string | null;
  pcb_price?: number | null;
  cny_price?: number | null;
  exchange_rate?: number | null;
  due_date?: string | null;
  ship_price?: number | null;
  custom_duty?: number | null;
  coupon?: number | null;
  production_days?: number | null;
  surcharges?: Array<{ name: string; amount: number }>;
}

// Order interface matching pcb_quotes table
interface Order {
  id: string;
  user_id: string | null;
  email: string;
  phone: string | null;
  shipping_address: AddressFormValue | null;
  pcb_spec: Record<string, unknown> | null;
  gerber_file_url: string | null;
  status: string | null;
  payment_status?: string | null;
  created_at: string | null;
  updated_at: string | null;
  user_name: string | null;
  cal_values?: CalValues | null;
  payment_intent_id?: string | null;
  admin_orders: AdminOrder[];
}

// Order status mapping with English labels
const ORDER_STATUS_MAP: Record<string, { text: string; style: string; description: string; stepKey: string }> = {
  'created': { 
    text: "Created", 
    style: "bg-blue-50 text-blue-700 border-blue-200", 
    description: "Quote request submitted",
    stepKey: "created"
  },
  'pending': { 
    text: "Under Review", 
    style: "bg-amber-50 text-amber-700 border-amber-200", 
    description: "Being reviewed by our team",
    stepKey: "review"
  },
  'reviewed': { 
    text: "Reviewed", 
    style: "bg-emerald-50 text-emerald-700 border-emerald-200", 
    description: "Review completed, ready for confirmation and payment",
    stepKey: "confirm_pay"
  },
  'quoted': { 
    text: "Quoted", 
    style: "bg-emerald-50 text-emerald-700 border-emerald-200", 
    description: "Quote provided, awaiting confirmation",
    stepKey: "confirm_pay"
  },
  'confirmed': { 
    text: "Confirmed", 
    style: "bg-indigo-50 text-indigo-700 border-indigo-200", 
    description: "Order confirmed, ready for payment",
    stepKey: "confirm_pay"
  },
  'paid': { 
    text: "Paid", 
    style: "bg-green-50 text-green-700 border-green-200", 
    description: "Payment received, ready for production",
    stepKey: "confirm_pay"
  },
  'in_production': { 
    text: "In Production", 
    style: "bg-blue-50 text-blue-700 border-blue-200", 
    description: "PCBs being manufactured",
    stepKey: "production"
  },
  'shipped': { 
    text: "Shipped", 
    style: "bg-cyan-50 text-cyan-700 border-cyan-200", 
    description: "Order shipped",
    stepKey: "shipping"
  },
  'delivered': { 
    text: "Delivered", 
    style: "bg-emerald-50 text-emerald-700 border-emerald-200", 
    description: "Order delivered",
    stepKey: "receiving"
  },
  'completed': { 
    text: "Completed", 
    style: "bg-green-50 text-green-700 border-green-200", 
    description: "Order completed",
    stepKey: "complete"
  },
  'cancelled': { 
    text: "Cancelled", 
    style: "bg-red-50 text-red-700 border-red-200", 
    description: "Order cancelled",
    stepKey: "cancelled"
  },
};

// Order steps for the progress bar
const ORDER_STEPS = [
  { label: "Created", key: "created" },
  { label: "Review", key: "review" },
  { label: "Confirm & Pay", key: "confirm_pay" },
  { label: "Production", key: "production" },
  { label: "Shipping", key: "shipping" },
  { label: "Receiving", key: "receiving" },
  { label: "Complete", key: "complete" },
];

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [pcbFormData, setPcbFormData] = useState<QuoteFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = useUserStore((state) => state.user);
  const [isRefunding, setIsRefunding] = useState(false);
  const [isConfirmingRefund, setIsConfirmingRefund] = useState(false);

  // Edit states
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isEditingPcbSpec, setIsEditingPcbSpec] = useState(false);
  const [showPcbDetails, setShowPcbDetails] = useState(false);
  const [editedAddress, setEditedAddress] = useState<AddressFormValue>({
    country: '', state: '', city: '', address: '', zipCode: '', contactName: '', phone: '', courier: ''
  });
  const [editedPhone, setEditedPhone] = useState('');
  const [editedPcbSpec, setEditedPcbSpec] = useState<QuoteFormData>({} as QuoteFormData);

  // Fetch order details
  const fetchOrder = useCallback(async () => {
    if (!orderId || !user) return;
    
    try {
      setLoading(true);
      
      const { data: orderData, error: orderError } = await supabase
        .from('pcb_quotes')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single();

      if (orderError) throw orderError;
      if (!orderData) throw new Error('Order not found');
      
      const { data: adminOrderData, error: adminOrderError } = await supabase
        .from('admin_orders')
        .select('*')
        .eq('user_order_id', orderId)
        .maybeSingle();

      if (adminOrderError && adminOrderError.code !== 'PGRST116') {
        console.warn('Error fetching admin order:', adminOrderError);
      }

      const combinedOrder: Order = {
        ...orderData,
        admin_orders: adminOrderData ? [adminOrderData] : []
      };
      
      setOrder(combinedOrder);

      if (orderData.pcb_spec) {
        try {
          const result = quoteSchema.safeParse(orderData.pcb_spec);
          if (result.success) {
            setPcbFormData(result.data);
            setEditedPcbSpec(result.data);
          } else {
            console.warn('PCB spec validation failed:', result.error);
            setPcbFormData(orderData.pcb_spec as QuoteFormData);
            setEditedPcbSpec(orderData.pcb_spec as QuoteFormData);
          }
        } catch (err) {
          console.warn('Failed to parse PCB spec:', err);
          setPcbFormData(orderData.pcb_spec as QuoteFormData);
          setEditedPcbSpec(orderData.pcb_spec as QuoteFormData);
        }
      }

      setEditedAddress(orderData.shipping_address || {});
      setEditedPhone(orderData.phone || '');
      
    } catch (err: Error | unknown) {
      console.error('Error fetching order:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: 'Error Fetching Order',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [orderId, user, toast]);

  useEffect(() => {
    if (user) {
      fetchOrder();
    }
  }, [user, fetchOrder]);

  // Check if editing is allowed
  const canEdit = order && ['created', 'pending', 'reviewed'].includes(order.status || '');
  const canCancel = order && ['created', 'pending', 'reviewed'].includes(order.status || '');

  // Update order information
  const updateOrder = async (updates: Partial<Order>) => {
    if (!orderId) return;
    
    try {
      const { error } = await supabase
        .from('pcb_quotes')
        .update(updates)
        .eq('id', orderId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Order updated successfully'
      });
      await fetchOrder();
    } catch (err: Error | unknown) {
      console.error('Error updating order:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast({
        title: 'Error Updating Order',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Save handlers
  const handleSaveAddress = async () => {
    if (!editedAddress || !editedAddress.country || !editedAddress.address) {
      toast({
        title: "Invalid Address",
        description: "Please ensure all required address fields are filled out.",
        variant: "destructive",
      });
      return;
    }

    await updateOrder({ shipping_address: editedAddress });
    setIsEditingAddress(false);
    
    if (order && order.status === 'reviewed') {
      await updateOrder({ status: 'pending' });
      toast({
        title: 'Info',
        description: 'Order status changed to "Under Review" due to address modification'
      });
    }
  };

  const handleSavePhone = async () => {
    await updateOrder({ phone: editedPhone });
    setIsEditingPhone(false);
  };

  const handleSavePcbSpec = async () => {
    await updateOrder({ pcb_spec: editedPcbSpec });
    setIsEditingPcbSpec(false);
    
    if (order && order.status === 'reviewed') {
      await updateOrder({ status: 'pending' });
      toast({
        title: 'Info',
        description: 'Order status changed to "Under Review" due to PCB specification modification'
      });
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }

    try {
      await updateOrder({ status: 'cancelled' });
      toast({
        title: 'Success',
        description: 'Order cancelled successfully'
      });
      router.push('/profile/orders');
    } catch (err: Error | unknown) {
      console.error('Error cancelling order:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast({
        title: 'Error Cancelling Order',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Get PCB field display value
  const getPcbFieldDisplay = (key: string, value: unknown): string => {
    if (value === null || value === undefined || value === '') return '-';
    
    const displayMap: Record<string, (val: unknown) => string> = {
      pcbType: (v) => String(v),
      layers: (v) => `${v} Layers`,
      thickness: (v) => String(v), // Already formatted as "1.6mm"
      singleDimensions: (v) => {
        const dim = v as { length?: number; width?: number };
        return dim?.length && dim?.width ? `${dim.length} × ${dim.width} mm` : '-';
      },
      singleCount: (v) => String(v), // Already formatted as "10 pcs"
      delivery: (v) => String(v), // Already formatted as "Standard" or "Urgent"
      shipmentType: (v) => String(v), // Already formatted
      differentDesignsCount: (v) => `${v} Design${Number(v) === 1 ? '' : 's'}`,
      surfaceFinish: (v) => {
        const map: Record<string, string> = {
          'HASL': 'HASL Lead Free',
          'ENIG': 'ENIG',
          'OSP': 'OSP',
          'Immersion Silver': 'Immersion Silver',
          'Immersion Tin': 'Immersion Tin'
        };
        return map[v as string] || String(v);
      },
      solderMask: (v) => String(v),
      silkscreen: (v) => String(v),
      goldFingers: (v) => String(v), // Already formatted as "Yes"/"No"
      edgePlating: (v) => String(v), // Already formatted as "Yes"/"No"
      maskCover: (v) => String(v),
      hdi: (v) => String(v),
      tg: (v) => String(v),
      ipcClass: (v) => String(v),
      innerCopperWeight: (v) => String(v), // Already formatted as "0.5oz"
      outerCopperWeight: (v) => String(v), // Already formatted as "1oz"
      minTrace: (v) => String(v), // Already formatted as "6/6mil"
      minHole: (v) => String(v), // Already formatted as "0.3mm"
      impedance: (v) => String(v), // Already formatted as "Yes"/"No"
      bga: (v) => String(v), // Already formatted as "Yes"/"No"
      testMethod: (v) => String(v),
      crossOuts: (v) => String(v),
      ulMark: (v) => String(v), // Already formatted
      productReport: (v) => String(v), // Already formatted
      workingGerber: (v) => String(v),
      ifDataConflicts: (v) => String(v),
      blueMask: (v) => String(v), // Already formatted as "Yes"/"No"
      halfHole: (v) => String(v),
      holeCu25um: (v) => String(v), // Already formatted as "Yes"/"No"
      useShengyiMaterial: (v) => String(v) // Already formatted as "Yes"/"No"
    };

    return displayMap[key] ? displayMap[key](value) : String(value);
  };

  const adminOrder = order?.admin_orders?.[0];
  const canRequestRefund = adminOrder?.payment_status === 'paid' && (!adminOrder.refund_status || adminOrder.refund_status === 'rejected');

  const handleRefundRequest = async () => {
    setIsRefunding(true);
    try {
      const response = await fetch(`/api/user/orders/${orderId}/request-refund`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to request refund.');
      }
      toast({
        title: 'Refund Request Submitted',
        description: 'Your refund request has been submitted for admin review.',
      });
      fetchOrder();
    } catch (err: Error | unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsRefunding(false);
    }
  };

  const handleRefundConfirmation = async (action: 'confirm' | 'cancel') => {
    setIsConfirmingRefund(true);
    try {
      const response = await fetch(`/api/user/orders/${orderId}/confirm-refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to process your request.');
      
      toast({
        title: 'Success',
        description: data.message,
      });
      fetchOrder();
    } catch (err: Error | unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsConfirmingRefund(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-purple-200 rounded-full animate-ping mx-auto opacity-20"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">Loading Order Details</h3>
            <p className="text-gray-600">Please wait while we fetch your order information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Unable to Load Order</h2>
            <p className="text-gray-600">{error || 'Order not found'}</p>
          </div>
          <Button 
            onClick={() => router.push('/profile/orders')} 
            variant="outline"
            className="bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  const statusInfo = ORDER_STATUS_MAP[order.status || 'created'];
  const isReadyForPayment = adminOrder && adminOrder.admin_price && adminOrder.status === 'reviewed';

  const getCurrentStep = () => {
    const userStatus = order.status || 'created';
    const isPaid = adminOrder?.payment_status === 'paid';

    if (isPaid) {
      if (adminOrder?.status === 'shipped') return 'shipping';
      if (adminOrder?.status === 'delivered') return 'receiving';
      if (adminOrder?.status === 'completed') return 'complete';
      return 'production';
    }

    if (isReadyForPayment) return 'confirm_pay';
    if (adminOrder) return 'review';

    switch (userStatus) {
      case 'created': return 'created';
      case 'pending':
      case 'reviewed': return 'review';
      default: return 'created';
    }
  };

  const currentStep = getCurrentStep();

  return (
    <div className="space-y-8">
      {/* Page Header - Modern Design */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-indigo-600/5 rounded-2xl"></div>
        <div className="relative p-6 lg:p-8">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Package className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
                      Order Details
                    </h1>
                    <p className="text-gray-600 text-sm lg:text-base font-medium">
                      #{order.id.slice(-8)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge className={`${statusInfo?.style} border-0 shadow-sm text-sm font-medium px-4 py-2 rounded-full transition-all hover:scale-105`}>
                    {statusInfo?.text || order.status}
                  </Badge>
                  {adminOrder?.payment_status === 'paid' && (
                    <Badge className="bg-emerald-50 text-emerald-700 border-0 shadow-sm text-sm font-medium px-4 py-2 rounded-full transition-all hover:scale-105">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Paid
                    </Badge>
                  )}
                  {order.cal_values?.leadTimeDays && (
                    <Badge variant="outline" className="text-sm font-medium px-4 py-2 rounded-full">
                      <Zap className="w-4 h-4 mr-1" />
                      {order.cal_values.leadTimeDays} days
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Created: {order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : '-'}</span>
                </div>
                {adminOrder?.due_date && (
                  <div className="flex items-center gap-2 text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span>Due: {new Date(adminOrder.due_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}</span>
                  </div>
                )}
                {order.payment_intent_id && (
                  <div className="flex items-center gap-2 text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                    <CreditCard className="w-4 h-4 text-green-600" />
                    <span>Payment: {order.payment_intent_id.slice(-8)}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => router.push('/profile/orders')} 
                variant="outline"
                className="border-gray-300 hover:border-gray-400 transition-all hover:shadow-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Orders
              </Button>
              
              {/* 用户编辑订单按钮 */}
              {canEdit && (
                <Button 
                  onClick={() => router.push(`/quote2?edit=${order.id}`)}
                  variant="default"
                  className="bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md transition-all"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Order
                </Button>
              )}
              
              {canCancel && (
                <Button 
                  onClick={handleCancelOrder} 
                  variant="destructive"
                  className="shadow-sm hover:shadow-md transition-all"
                >
                  Cancel Order
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar - Enhanced Design */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50/50 to-purple-50/50">
        <CardHeader className="pb-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-blue-600" />
            </div>
            <CardTitle className="text-lg">Order Progress</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <OrderStepBar 
            currentStatus={currentStep} 
            steps={ORDER_STEPS}
          />
        </CardContent>
      </Card>

      {/* Edit Status Card - Enhanced Design */}
      {canEdit ? (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-900 mb-1">Order Can Be Modified</h3>
                  <p className="text-amber-800 text-sm">
                    You can edit address and PCB specifications before payment. Changes may require re-review.
                  </p>
                  <div className="mt-2 text-xs text-amber-700">
                    ✓ Editable statuses: Created, Under Review, Reviewed
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => router.push(`/quote2?edit=${order.id}`)}
                variant="outline"
                size="sm"
                className="border-amber-300 text-amber-700 hover:bg-amber-100 hover:border-amber-400 flex-shrink-0"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit Now
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Info className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Order Status: {statusInfo?.text || order.status}</h3>
                <p className="text-gray-700 text-sm">
                  {(() => {
                    const isPaid = adminOrder?.payment_status === 'paid';
                    if (isPaid) return 'Order has been paid and cannot be modified. Contact support if changes are needed.';
                    if (['quoted', 'confirmed'].includes(order.status || '')) return 'Order is ready for payment. Editing is no longer available.';
                    if (['shipped', 'delivered', 'completed'].includes(order.status || '')) return 'Order is in final stages and cannot be modified.';
                    if (order.status === 'cancelled') return 'This order has been cancelled.';
                    return 'Order editing is not available in the current status.';
                  })()}
                </p>
                <div className="mt-2 text-xs text-gray-600">
                  ℹ️ Orders can only be edited in: Created, Under Review, or Reviewed status
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column - Main Content */}
        <div className="xl:col-span-2 space-y-8">
          {/* Order Status Card - Enhanced */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/30">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-blue-600" />
                </div>
                <CardTitle>Order Status</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Badge className={`${statusInfo?.style} border-0 text-sm px-4 py-2 rounded-full font-medium`}>
                    {statusInfo?.text || order.status}
                  </Badge>
                  <span className="text-gray-600 text-sm">
                    {(() => {
                      const userStatus = order.status || 'created';
                      const isPaid = adminOrder?.payment_status === 'paid';

                      if (isPaid) {
                        if (adminOrder?.status === 'shipped') return 'Order has been shipped.';
                        if (adminOrder?.status === 'delivered') return 'Order has been delivered.';
                        if (adminOrder?.status === 'completed') return 'Order completed.';
                        return 'Payment received, order in production.';
                      }

                      if (isReadyForPayment) {
                        return 'Price confirmed by admin, ready for payment.';
                      }

                      if (adminOrder) {
                        if (!adminOrder.admin_price) {
                          return `Admin is reviewing, waiting for price confirmation.`;
                        }
                        return `Admin is finalizing your order, waiting for final approval.`;
                      }

                      switch (userStatus) {
                        case 'created':
                          return 'Quote request submitted, waiting for admin review.';
                        case 'pending':
                          return 'Being reviewed by our team.';
                        case 'reviewed':
                          return 'Initial review complete, waiting for admin to finalize pricing.';
                        default:
                          return statusInfo?.description || 'Status unknown';
                      }
                    })()}
                  </span>
                </div>
                
                {adminOrder ? (
                  <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Star className="w-4 h-4 text-blue-600" />
                      Admin Processing Status
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Admin Status: </span>
                        <Badge variant="outline" className="text-xs">
                          {adminOrder.status || 'Processing'}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-gray-500">Payment Status: </span>
                        <Badge variant={(isReadyForPayment || adminOrder.payment_status === 'paid') ? 'default' : 'secondary'} className="text-xs">
                          {(isReadyForPayment || adminOrder.payment_status === 'paid') ? 'Confirmed' : 'Pending'}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-gray-500">Delivery: </span>
                        <span className="font-medium text-gray-700">
                          {adminOrder.delivery_date ? new Date(adminOrder.delivery_date).toLocaleDateString('en-US') : 'TBD'}
                        </span>
                      </div>
                    </div>
                    {adminOrder.admin_note && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <span className="text-gray-500 text-sm font-medium">Admin Notes:</span>
                        <div className="mt-2 text-sm bg-white/70 p-3 rounded-lg border border-blue-200 whitespace-pre-wrap">
                          {adminOrder.admin_note}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-200">
                    <div className="flex items-center gap-2 text-amber-700 mb-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-semibold">Waiting for Admin Review</span>
                    </div>
                    <p className="text-sm text-amber-700">
                      Our team will review your order and create an admin order record with confirmed pricing soon.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Price Information Card - Enhanced */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-green-50/20">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <CardTitle>Price Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Final Admin Confirmed Price */}
              {adminOrder?.admin_price && (isReadyForPayment || adminOrder?.payment_status === 'paid') && (
                <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <h4 className="font-bold text-green-800 text-lg">Final Confirmed Price</h4>
                  </div>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {adminOrder.currency === 'CNY' ? '¥' : '$'}{adminOrder.admin_price?.toFixed(2) || '0.00'}
                  </div>
                  <p className="text-sm text-green-700">
                    This is the final price confirmed by our team after detailed review.
                  </p>
                </div>
              )}

              {/* Quote vs Final Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h5 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4 text-gray-600" />
                    Initial Quote
                    <Badge variant="outline" className="text-xs">Reference</Badge>
                  </h5>
                  {order.cal_values ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">PCB Price:</span>
                        <span className="font-medium">${order.cal_values.pcbPrice?.toFixed(2) || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Lead Time:</span>
                        <span className="font-medium">{order.cal_values.leadTimeDays || '-'} days</span>
                      </div>
                      {order.cal_values.estimatedFinishDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Est. Completion:</span>
                          <span className="font-medium text-xs">
                            {new Date(order.cal_values.estimatedFinishDate).toLocaleDateString('en-US')}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Calculating...</p>
                  )}
                </div>

                <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                  <h5 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    Final Confirmed
                    <Badge className="text-xs bg-blue-600">Official</Badge>
                  </h5>
                  {adminOrder ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">PCB Price:</span>
                        <span className="font-bold text-blue-700">
                          {adminOrder.currency === 'CNY' 
                            ? `¥${adminOrder.pcb_price?.toFixed(2) || '-'}` 
                            : `$${adminOrder.pcb_price ? (adminOrder.pcb_price / (adminOrder.exchange_rate || 7.2)).toFixed(2) : '-'}`
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Production Days:</span>
                        <span className="font-bold text-blue-700">{adminOrder.production_days || '-'} days</span>
                      </div>
                      {adminOrder.due_date && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Due Date:</span>
                          <span className="font-bold text-blue-700 text-xs">
                            {new Date(adminOrder.due_date).toLocaleDateString('en-US')}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Pending admin review</p>
                  )}
                </div>
              </div>
              
              {/* Exchange Rate */}
              {adminOrder && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 mb-6">
                  <div className="text-sm flex justify-between items-center">
                    <span className="text-gray-500">Exchange Rate:</span>
                    <span className="font-medium">1 USD = {adminOrder.exchange_rate || 7.2} CNY</span>
                  </div>
                </div>
              )}
              
              {/* Payment Button */}
              {isReadyForPayment && adminOrder?.payment_status !== 'paid' && (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-semibold">Price Confirmed & Approved - Ready for Payment</span>
                    </div>
                  </div>
                  <Button 
                    onClick={() => router.push(`/payment/${order.id}`)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
                    size="lg"
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Pay Now - {adminOrder.currency === 'CNY' ? '¥' : '$'}
                    {adminOrder.admin_price?.toFixed(2)}
                  </Button>
                </div>
              )}
              
              {/* Waiting Messages */}
              {!isReadyForPayment && adminOrder?.payment_status !== 'paid' && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-center gap-2 text-amber-700 mb-2">
                    <Clock className="h-4 w-4" />
                    <span className="font-semibold">
                      {!adminOrder ? "Waiting for Admin Review" :
                       !adminOrder.admin_price ? "Waiting for Price Confirmation" :
                       "Waiting for Final Admin Approval"}
                    </span>
                  </div>
                  <p className="text-sm text-amber-700">
                    {!adminOrder ? "Our team will review your order and provide final pricing soon." :
                     !adminOrder.admin_price ? "Our admin team is calculating the final price for your order." :
                     "Once admin gives final approval, you'll be able to proceed with payment."}
                  </p>
                </div>
              )}

              {/* Refund Section */}
              {canRequestRefund && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full" disabled={isRefunding}>
                        Request Refund
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Request Refund</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will submit a refund request for administrator review.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRefundRequest} disabled={isRefunding}>
                          {isRefunding ? 'Submitting...' : 'Yes, Request Refund'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}

              {/* Refund Status */}
              {adminOrder?.refund_status === 'pending_confirmation' && (
                <Card className="mt-6 border-blue-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="text-blue-500" />
                      <span>Confirm Your Refund</span>
                    </CardTitle>
                    <CardDescription>
                      Please confirm the refund details below.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p><strong>Amount:</strong> ${adminOrder.approved_refund_amount?.toFixed(2)}</p>
                    <p><strong>Reason:</strong> {adminOrder.refund_reason || 'N/A'}</p>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => handleRefundConfirmation('cancel')}
                      disabled={isConfirmingRefund}
                    >
                      Cancel Request
                    </Button>
                    <Button
                      onClick={() => handleRefundConfirmation('confirm')}
                      disabled={isConfirmingRefund}
                    >
                      {isConfirmingRefund ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Refund'}
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Contact Information Card */}
          <Card className="shadow-lg border-0">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <CardTitle>Contact Information</CardTitle>
                </div>
                {canEdit && (
                  <Dialog open={isEditingPhone} onOpenChange={setIsEditingPhone}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="hover:bg-blue-50">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Edit Contact Information</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            value={editedPhone}
                            onChange={(e) => setEditedPhone(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                          <Button variant="outline" onClick={() => setIsEditingPhone(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleSavePhone}>
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">@</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm block">Email</span>
                    <span className="font-medium">{order.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold text-sm">📞</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm block">Phone</span>
                    <span className="font-medium">{order.phone || 'Not provided'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address Card */}
          <Card className="shadow-lg border-0">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-purple-600" />
                  </div>
                  <CardTitle>Shipping Address</CardTitle>
                </div>
                {canEdit && (
                  <Dialog open={isEditingAddress} onOpenChange={setIsEditingAddress}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="hover:bg-purple-50">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto sm:max-h-[85vh] p-0" draggable>
                      <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
                        <DialogHeader className="px-6 py-4">
                          <DialogTitle className="text-lg font-semibold leading-tight">Edit Shipping Address</DialogTitle>
                          <DialogDescription className="text-sm text-gray-600 leading-tight mt-1">
                            Select a saved address or edit the fields below. Changes apply only to this order.
                          </DialogDescription>
                        </DialogHeader>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto px-6 py-4">
                        <div className="space-y-4">
                          <AddressFormComponent
                            userId={user?.id}
                            value={editedAddress}
                            onChange={setEditedAddress}
                          />
                        </div>
                      </div>
                      
                      <div className="sticky bottom-0 bg-white border-t border-gray-200">
                        <DialogFooter className="px-6 py-4">
                          <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
                            <Button variant="outline" onClick={() => setIsEditingAddress(false)} className="w-full sm:w-auto">
                              Cancel
                            </Button>
                            <Button onClick={handleSaveAddress} className="w-full sm:w-auto">
                              Apply to This Order
                            </Button>
                          </div>
                        </DialogFooter>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {order.shipping_address ? (
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">{order.shipping_address.contactName || '-'}</span>
                      {order.shipping_address.phone && (
                        <Badge variant="outline" className="text-xs">
                          {order.shipping_address.phone}
                        </Badge>
                      )}
                    </div>
                    <div className="text-gray-700 text-sm leading-relaxed">
                      {[
                        order.shipping_address.address,
                        order.shipping_address.cityName || order.shipping_address.city,
                        order.shipping_address.stateName || order.shipping_address.state,
                        order.shipping_address.countryName || order.shipping_address.country,
                        order.shipping_address.zipCode
                      ].filter(Boolean).join(', ')}
                    </div>
                    {order.shipping_address.courier && (
                      <div className="mt-3 pt-3 border-t border-purple-200">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium">
                            {order.shipping_address.courierName || order.shipping_address.courier}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No shipping address provided</p>
                </div>
              )}
            </CardContent>
          </Card>

                      {/* PCB Specifications Card */}
          <Card className="shadow-lg border-0">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-orange-600" />
                  </div>
                  <CardTitle>PCB Specifications</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {pcbFormData && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="hover:bg-orange-50 text-orange-600"
                      onClick={() => setShowPcbDetails(true)}
                    >
                      <Info className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  )}
                  {canEdit && (
                    <Dialog open={isEditingPcbSpec} onOpenChange={setIsEditingPcbSpec}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="hover:bg-orange-50">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit PCB Specifications</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="layers">Layers</Label>
                            <Select 
                              value={String(editedPcbSpec.layers || 2)} 
                              onValueChange={(value) => setEditedPcbSpec({...editedPcbSpec, layers: Number(value)})}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20].map(layer => (
                                  <SelectItem key={layer} value={String(layer)}>{layer} Layer{layer > 1 ? 's' : ''}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="singleCount">Quantity</Label>
                            <Input
                              id="singleCount"
                              type="number"
                              value={editedPcbSpec.singleCount || ''}
                              onChange={(e) => setEditedPcbSpec({...editedPcbSpec, singleCount: Number(e.target.value)})}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="delivery">Delivery Type</Label>
                            <Select 
                              value={editedPcbSpec.delivery || DeliveryType.Standard} 
                              onValueChange={(value) => setEditedPcbSpec({...editedPcbSpec, delivery: value as DeliveryType})}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={DeliveryType.Standard}>Standard</SelectItem>
                                <SelectItem value={DeliveryType.Urgent}>Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="thickness">Thickness (mm)</Label>
                            <Select 
                              value={String(editedPcbSpec.thickness || 1.6)} 
                              onValueChange={(value) => setEditedPcbSpec({...editedPcbSpec, thickness: Number(value)})}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.6, 2.0, 2.4, 3.0, 3.2].map(thick => (
                                  <SelectItem key={thick} value={String(thick)}>{thick}mm</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="specialRequests">Special Requests</Label>
                          <Textarea
                            id="specialRequests"
                            value={editedPcbSpec.specialRequests || ''}
                            onChange={(e) => setEditedPcbSpec({...editedPcbSpec, specialRequests: e.target.value})}
                            rows={3}
                            className="mt-1"
                          />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                          <Button variant="outline" onClick={() => setIsEditingPcbSpec(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleSavePcbSpec}>
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
            </CardHeader>
            <CardContent className="p-6">
              {pcbFormData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Material Type', key: 'pcbType', value: pcbFormData.pcbType },
                    { label: 'Layers', key: 'layers', value: pcbFormData.layers },
                    { label: 'Thickness', key: 'thickness', value: pcbFormData.thickness },
                    { label: 'Dimensions', key: 'singleDimensions', value: pcbFormData.singleDimensions },
                    { label: 'Quantity', key: 'singleCount', value: pcbFormData.singleCount },
                    { label: 'Delivery', key: 'delivery', value: pcbFormData.delivery },
                    { label: 'Surface Finish', key: 'surfaceFinish', value: pcbFormData.surfaceFinish },
                    { label: 'Solder Mask', key: 'solderMask', value: pcbFormData.solderMask },
                  ].map(spec => (
                    <div key={spec.key} className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-500 text-sm block mb-1">{spec.label}</span>
                      <span className="font-medium text-gray-900">{getPcbFieldDisplay(spec.key, spec.value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">PCB specifications not available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Calculation Details Card */}
          {order.cal_values && (
            <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/30 border-gray-200">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Info className="w-4 h-4 text-gray-600" />
                  </div>
                  <CardTitle className="flex items-center gap-2">
                    Initial System Calculation
                    <Badge variant="outline" className="text-xs border-gray-400 text-gray-600">Reference Only</Badge>
                  </CardTitle>
                </div>
                <CardDescription>
                  These are the initial calculations generated by our system for reference purposes.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  {/* Price breakdown */}
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="text-sm text-green-600 mb-1">PCB Price</div>
                    <div className="text-2xl font-bold text-green-700">
                      ${order.cal_values.pcbPrice?.toFixed(2) || '-'}
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Unit: ${order.cal_values.unitPrice?.toFixed(2) || '-'}
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="text-sm text-blue-600 mb-1">Total Area</div>
                    <div className="text-2xl font-bold text-blue-700">
                      {order.cal_values.totalArea?.toFixed(4) || '-'}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      m² (Single: {order.cal_values.singlePcbArea?.toFixed(4) || '-'} m²)
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <div className="text-sm text-purple-600 mb-1">Lead Time</div>
                    <div className="text-2xl font-bold text-purple-700">
                      {order.cal_values.leadTimeDays || '-'}
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      days production
                    </div>
                  </div>

                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <div className="text-sm text-orange-600 mb-1">Est. Completion</div>
                    <div className="text-sm font-bold text-orange-700">
                      {order.cal_values.estimatedFinishDate ? 
                        new Date(order.cal_values.estimatedFinishDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        }) : '-'
                      }
                    </div>
                    <div className="text-xs text-orange-600 mt-1">
                      estimated date
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-700">
                    <strong>📌 Important:</strong> These are initial system calculations for reference. 
                    The final pricing and timeline will be confirmed by our admin team and may differ based on detailed review.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Quick Summary Card */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50/20">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-green-600" />
                </div>
                Quick Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 block">Order ID</span>
                  <span className="font-mono font-medium">#{order.id.slice(-8)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Status</span>
                  <Badge variant="outline" className="text-xs mt-1">
                    {statusInfo?.text || order.status}
                  </Badge>
                </div>
                {pcbFormData && (
                  <>
                    <div>
                      <span className="text-gray-500 block">Layers</span>
                      <span className="font-medium">{pcbFormData.layers}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Quantity</span>
                      <span className="font-medium">{pcbFormData.singleCount} pcs</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Delivery</span>
                      <span className="font-medium">
                        {pcbFormData.delivery === DeliveryType.Standard ? 'Standard' : 'Urgent'}
                      </span>
                    </div>
                  </>
                )}
                {adminOrder?.admin_price && (
                  <div>
                    <span className="text-gray-500 block">Total Price</span>
                    <span className="font-bold text-green-600">
                      {adminOrder.currency === 'CNY' ? '¥' : '$'}{adminOrder.admin_price.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* File Download Card */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-indigo-600" />
                </div>
                Files & Downloads
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {order.gerber_file_url ? (
                <DownloadButton 
                  filePath={order.gerber_file_url} 
                  bucket="gerber"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Download Gerber Files
                </DownloadButton>
              ) : (
                <div className="text-center py-4">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No files available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Admin Order Details Card */}
          {adminOrder && (
            <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50/20 border-blue-200">
              <CardHeader className="border-b border-blue-100">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-blue-600" />
                  </div>
                  Official Order Details
                  {(isReadyForPayment || adminOrder?.payment_status === 'paid') ? (
                    <Badge className="text-xs bg-blue-600">Admin Confirmed</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs border-amber-400 text-amber-700 bg-amber-50">Under Review</Badge>
                  )}
                </CardTitle>
                {(isReadyForPayment || adminOrder?.payment_status === 'paid') ? (
                  <CardDescription className="text-blue-700">
                    ✓ Final confirmed information - This data overrides initial quotes
                  </CardDescription>
                ) : (
                  <CardDescription className="text-amber-700">
                    Admin is reviewing these details. Information below is subject to change.
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Status Information */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 text-blue-600" />
                    Status Information
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Admin Status:</span>
                      <Badge variant="outline" className="text-xs">
                        {adminOrder.status || 'Pending'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Payment Status:</span>
                      <Badge variant={adminOrder.payment_status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                        {adminOrder.payment_status || 'Unpaid'}
                      </Badge>
                    </div>
                    {adminOrder.refund_status && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Refund Status:</span>
                        <Badge variant="outline" className="text-xs">
                          {adminOrder.refund_status}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Final Pricing Details */}
                <div className="border-t border-blue-100 pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    Final Pricing Breakdown
                    <Badge variant="default" className="text-xs bg-green-600">Official</Badge>
                  </h4>
                  <div className="space-y-3 text-sm">
                    {adminOrder.pcb_price && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">PCB Cost:</span>
                        <span className="font-medium">
                          {adminOrder.currency === 'CNY' 
                            ? `¥${adminOrder.pcb_price.toFixed(2)}` 
                            : `$${adminOrder.pcb_price ? (adminOrder.pcb_price / (adminOrder.exchange_rate || 7.2)).toFixed(2) : '-'}`
                          }
                        </span>
                      </div>
                    )}
                    {adminOrder.ship_price && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Shipping:</span>
                        <span>
                          {adminOrder.currency === 'CNY' 
                            ? `¥${adminOrder.ship_price.toFixed(2)}` 
                            : `$${adminOrder.ship_price ? (adminOrder.ship_price / (adminOrder.exchange_rate || 7.2)).toFixed(2) : '-'}`
                          }
                        </span>
                      </div>
                    )}
                    {adminOrder.custom_duty && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Custom Duty:</span>
                        <span>
                          {adminOrder.currency === 'CNY' 
                            ? `¥${adminOrder.custom_duty.toFixed(2)}` 
                            : `$${adminOrder.custom_duty ? (adminOrder.custom_duty / (adminOrder.exchange_rate || 7.2)).toFixed(2) : '-'}`
                          }
                        </span>
                      </div>
                    )}
                    {adminOrder.coupon && adminOrder.coupon > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Discount:</span>
                        <span className="text-green-600">
                          -{adminOrder.currency === 'CNY' 
                            ? `¥${adminOrder.coupon.toFixed(2)}` 
                            : `$${adminOrder.coupon ? (adminOrder.coupon / (adminOrder.exchange_rate || 7.2)).toFixed(2) : '-'}`
                          }
                        </span>
                      </div>
                    )}
                    {adminOrder.admin_price && (
                      <div className="flex justify-between border-t border-blue-100 pt-3 font-semibold bg-green-50 p-3 rounded-lg">
                        <span className="text-gray-900">Final Total:</span>
                        <span className="text-green-600 font-bold">
                          {adminOrder.currency === 'CNY' ? '¥' : '$'}{adminOrder.admin_price.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="border-t border-blue-100 pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    Production Timeline
                    <Badge variant="default" className="text-xs bg-blue-600">Confirmed</Badge>
                  </h4>
                  <div className="space-y-2 text-sm">
                    {adminOrder.production_days && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Production Days:</span>
                        <span className="font-medium">{adminOrder.production_days} days</span>
                      </div>
                    )}
                    {adminOrder.due_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Due Date:</span>
                        <span className="font-medium">{new Date(adminOrder.due_date).toLocaleDateString('en-US')}</span>
                      </div>
                    )}
                    {adminOrder.delivery_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Delivery Date:</span>
                        <span className="font-medium">{new Date(adminOrder.delivery_date).toLocaleDateString('en-US')}</span>
                      </div>
                    )}
                  </div>
                  {(!adminOrder.production_days && !adminOrder.due_date && !adminOrder.delivery_date) && (
                    <p className="text-sm text-gray-500 italic">Timeline pending admin confirmation</p>
                  )}
                </div>

                {/* Admin Notes */}
                {adminOrder.admin_note && (
                  <div className="border-t border-blue-100 pt-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Admin Notes</h4>
                    <div className="text-sm bg-blue-50 p-3 rounded-lg border-l-4 border-blue-200 whitespace-pre-wrap">
                      {adminOrder.admin_note}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Time Information Card */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                Time Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Created</div>
                  <div className="text-sm font-medium">
                    {order.created_at ? new Date(order.created_at).toLocaleString('en-US') : '-'}
                  </div>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Last Updated</div>
                  <div className="text-sm font-medium">
                    {order.updated_at ? new Date(order.updated_at).toLocaleString('en-US') : '-'}
                  </div>
                </div>
                
                {adminOrder?.due_date && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-600 mb-1">Expected Completion</div>
                    <div className="text-sm font-medium text-blue-700">
                      {new Date(adminOrder.due_date).toLocaleDateString('en-US')}
                    </div>
                  </div>
                )}
                
                {adminOrder?.delivery_date && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-sm text-green-600 mb-1">Expected Delivery</div>
                    <div className="text-sm font-medium text-green-700">
                      {new Date(adminOrder.delivery_date).toLocaleDateString('en-US')}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Truck className="w-4 h-4 text-purple-600" />
                </div>
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <Button 
                variant="outline" 
                className="w-full hover:bg-blue-50 hover:border-blue-300 transition-all"
                onClick={() => router.push('/quote2')}
              >
                Create New Quote
              </Button>
              {canEdit && (
                <div className="text-sm text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <strong>✨ Tip:</strong> You can edit this order until payment is made.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* PCB Details Dialog */}
      <Dialog open={showPcbDetails} onOpenChange={setShowPcbDetails}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
          <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
            <DialogHeader className="px-6 py-4">
              <DialogTitle className="text-xl font-semibold leading-tight flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-orange-600" />
                </div>
                Complete PCB Specifications
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 leading-tight mt-1">
                Detailed technical specifications for your PCB order
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="px-6 py-4">
            {pcbFormData ? (
              <div className="space-y-6">
                {/* Basic Specifications */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                      <span className="text-blue-600 text-xs font-bold">1</span>
                    </div>
                    Basic Specifications
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { label: 'PCB Type', key: 'pcbType', value: pcbFormData.pcbType || 'FR-4' },
                      { label: 'Layer Count', key: 'layers', value: pcbFormData.layers },
                      { label: 'Board Thickness', key: 'thickness', value: `${pcbFormData.thickness}mm` },
                      { label: 'Board Dimensions', key: 'singleDimensions', value: pcbFormData.singleDimensions },
                      { label: 'Quantity', key: 'singleCount', value: `${pcbFormData.singleCount} pcs` },
                      { label: 'Delivery Type', key: 'delivery', value: pcbFormData.delivery === 'standard' ? 'Standard' : 'Urgent' },
                      { label: 'Shipment Type', key: 'shipmentType', value: pcbFormData.shipmentType === 'single' ? 'Single' : 'Panel' },
                      { label: 'Different Designs', key: 'differentDesignsCount', value: pcbFormData.differentDesignsCount }
                    ].map(spec => (
                      <div key={spec.key} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="text-sm font-medium text-gray-600 mb-2">{spec.label}</div>
                        <div className="text-lg font-semibold text-gray-900">{getPcbFieldDisplay(spec.key, spec.value)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Surface & Finish */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center">
                      <span className="text-green-600 text-xs font-bold">2</span>
                    </div>
                    Surface & Finish
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { label: 'Surface Finish', key: 'surfaceFinish', value: pcbFormData.surfaceFinish },
                      { label: 'Solder Mask Color', key: 'solderMask', value: pcbFormData.solderMask },
                      { label: 'Silkscreen Color', key: 'silkscreen', value: pcbFormData.silkscreen },
                      { label: 'Gold Fingers', key: 'goldFingers', value: pcbFormData.goldFingers ? 'Yes' : 'No' },
                      { label: 'Edge Plating', key: 'edgePlating', value: pcbFormData.edgePlating ? 'Yes' : 'No' },
                      { label: 'Mask Cover', key: 'maskCover', value: pcbFormData.maskCover }
                    ].map(spec => (
                      <div key={spec.key} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="text-sm font-medium text-gray-600 mb-2">{spec.label}</div>
                        <div className="text-lg font-semibold text-gray-900">{getPcbFieldDisplay(spec.key, spec.value)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technical Specifications */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-5 h-5 bg-purple-100 rounded flex items-center justify-center">
                      <span className="text-purple-600 text-xs font-bold">3</span>
                    </div>
                    Technical Specifications
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { label: 'HDI Type', key: 'hdi', value: pcbFormData.hdi },
                      { label: 'TG Value', key: 'tg', value: pcbFormData.tg },
                      { label: 'IPC Class', key: 'ipcClass', value: pcbFormData.ipcClass },
                      { label: 'Inner Copper Weight', key: 'innerCopperWeight', value: `${pcbFormData.innerCopperWeight}oz` },
                      { label: 'Outer Copper Weight', key: 'outerCopperWeight', value: `${pcbFormData.outerCopperWeight}oz` },
                      { label: 'Min Trace/Spacing', key: 'minTrace', value: `${pcbFormData.minTrace}mil` },
                      { label: 'Min Hole Size', key: 'minHole', value: `${pcbFormData.minHole}mm` },
                      { label: 'Impedance Control', key: 'impedance', value: pcbFormData.impedance ? 'Yes' : 'No' },
                      { label: 'BGA Required', key: 'bga', value: pcbFormData.bga ? 'Yes' : 'No' }
                    ].map(spec => (
                      <div key={spec.key} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="text-sm font-medium text-gray-600 mb-2">{spec.label}</div>
                        <div className="text-lg font-semibold text-gray-900">{getPcbFieldDisplay(spec.key, spec.value)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quality & Testing */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-5 h-5 bg-indigo-100 rounded flex items-center justify-center">
                      <span className="text-indigo-600 text-xs font-bold">4</span>
                    </div>
                    Quality & Testing
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { label: 'Test Method', key: 'testMethod', value: pcbFormData.testMethod },
                      { label: 'Cross-outs Policy', key: 'crossOuts', value: pcbFormData.crossOuts },
                      { label: 'UL Mark', key: 'ulMark', value: pcbFormData.ulMark ? 'Required' : 'Not Required' },
                      { label: 'Product Report', key: 'productReport', value: Array.isArray(pcbFormData.productReport) ? pcbFormData.productReport.join(', ') : pcbFormData.productReport },
                      { label: 'Working Gerber', key: 'workingGerber', value: pcbFormData.workingGerber },
                      { label: 'Data Conflicts', key: 'ifDataConflicts', value: pcbFormData.ifDataConflicts }
                    ].map(spec => (
                      <div key={spec.key} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="text-sm font-medium text-gray-600 mb-2">{spec.label}</div>
                        <div className="text-lg font-semibold text-gray-900">{getPcbFieldDisplay(spec.key, spec.value)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Special Options */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-5 h-5 bg-orange-100 rounded flex items-center justify-center">
                      <span className="text-orange-600 text-xs font-bold">5</span>
                    </div>
                    Special Options
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { label: 'Blue Mask', key: 'blueMask', value: pcbFormData.blueMask ? 'Yes' : 'No' },
                      { label: 'Half Hole', key: 'halfHole', value: pcbFormData.halfHole || 'None' },
                      { label: 'Hole Cu 25μm', key: 'holeCu25um', value: pcbFormData.holeCu25um ? 'Yes' : 'No' },
                      { label: 'Shengyi Material', key: 'useShengyiMaterial', value: pcbFormData.useShengyiMaterial ? 'Yes' : 'No' }
                    ].map(spec => (
                      <div key={spec.key} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="text-sm font-medium text-gray-600 mb-2">{spec.label}</div>
                        <div className="text-lg font-semibold text-gray-900">{getPcbFieldDisplay(spec.key, spec.value)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes & Comments */}
                {(pcbFormData.specialRequests || pcbFormData.pcbNote || pcbFormData.userNote || pcbFormData.customsNote) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-5 h-5 bg-amber-100 rounded flex items-center justify-center">
                        <span className="text-amber-600 text-xs font-bold">6</span>
                      </div>
                      Notes & Comments
                    </h3>
                    <div className="space-y-4">
                      {pcbFormData.specialRequests && (
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                          <div className="text-sm font-medium text-amber-800 mb-2">Special Requests</div>
                          <div className="text-gray-700 whitespace-pre-wrap">{pcbFormData.specialRequests}</div>
                        </div>
                      )}
                      {pcbFormData.pcbNote && (
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                          <div className="text-sm font-medium text-blue-800 mb-2">PCB Note</div>
                          <div className="text-gray-700 whitespace-pre-wrap">{pcbFormData.pcbNote}</div>
                        </div>
                      )}
                      {pcbFormData.userNote && (
                        <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                          <div className="text-sm font-medium text-green-800 mb-2">User Note</div>
                          <div className="text-gray-700 whitespace-pre-wrap">{pcbFormData.userNote}</div>
                        </div>
                      )}
                      {pcbFormData.customsNote && (
                        <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                          <div className="text-sm font-medium text-purple-800 mb-2">Customs Note</div>
                          <div className="text-gray-700 whitespace-pre-wrap">{pcbFormData.customsNote}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No PCB Specifications Available</h3>
                <p className="text-gray-500">PCB specification data is not available for this order.</p>
              </div>
            )}
          </div>
          
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
            <div className="flex justify-end">
              <Button onClick={() => setShowPcbDetails(false)} className="bg-orange-600 hover:bg-orange-700">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 