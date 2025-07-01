"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Pencil, DollarSign, MapPin, AlertCircle, 
  ArrowLeft, CheckCircle, Truck, AlertTriangle, CreditCard, Info, Loader2,
  Shield, Download, Phone, Mail, RefreshCw
} from 'lucide-react';
import DownloadButton from '@/app/components/custom-ui/DownloadButton';
import OrderStepBar from '@/components/ui/OrderStepBar';
import { RefundStatusBadge, RefundDetails } from '@/app/components/custom-ui/RefundStatusBadge';
import { RefundActionButtons } from '@/app/components/custom-ui/RefundActionButtons';
import { supabase } from '@/lib/supabaseClient';
import { useUserStore } from "@/lib/userStore";
import { quoteSchema, QuoteFormData } from '@/app/quote2/schema/quoteSchema';

import { useToast } from '@/components/ui/use-toast';
import { AddressFormComponent, AddressFormValue } from '@/app/quote2/components/AddressFormComponent';
import { PCBSpecificationDisplay } from '@/app/components/custom-ui/PCBSpecificationDisplay';
import { StencilSpecificationDisplay } from '@/app/components/custom-ui/StencilSpecificationDisplay';
import { DeliveryInfoDisplay } from '@/app/components/custom-ui/DeliveryInfoDisplay';


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
  id: string;
  payment_status?: string | null;
  status?: string | null;
  refund_status?: string | null;
  requested_refund_amount?: number | null;
  approved_refund_amount?: number | null;
  actual_refund_amount?: number | null;
  refund_reason?: string | null;
  refund_note?: string | null;
  refund_request_at?: string | null;
  user_refund_confirmation_at?: string | null;
  refund_processed_at?: string | null;
  refunded_at?: string | null;
  stripe_refund_id?: string | null;
  admin_price?: number | null;
  currency?: string | null;
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
  admin_orders: AdminOrder | AdminOrder[] | null;
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
  
  // Check for payment related notifications
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('payment_pending') === 'true') {
      toast({
        title: "支付已提交",
        description: "支付已成功提交，订单状态更新可能需要几分钟时间。查看所有订单的最新状态，请前往订单列表。",
        duration: 10000,
        action: (
          <button
            onClick={() => router.push('/profile/orders?from_payment=true')}
            className="px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            查看订单列表
          </button>
        ),
      });
    }
    
    if (urlParams.get('payment_completed') === 'true') {
      toast({
        title: "支付已完成",
        description: "订单支付已确认！您可以在订单列表中查看所有订单的最新状态。",
        duration: 8000,
        action: (
          <button
            onClick={() => router.push('/profile/orders?from_payment=true')}
            className="px-3 py-2 text-xs bg-green-600 text-white rounded hover:bg-green-700"
          >
            查看订单列表
          </button>
        ),
      });
    }
    
    // Clear the URL parameters
    if (urlParams.get('payment_pending') || urlParams.get('payment_completed')) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [toast, router]);
  const [order, setOrder] = useState<Order | null>(null);
  const [pcbFormData, setPcbFormData] = useState<QuoteFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = useUserStore((state) => state.user);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const dataFetchedRef = React.useRef(false);
  const [paymentIntentStatus, setPaymentIntentStatus] = useState<{
    hasPaymentIntent: boolean;
    stripeStatus?: string;
    isPaid?: boolean;
    needsSync?: boolean;
  } | null>(null);
  // Function to check payment intent status (only when manually triggered)
  const checkPaymentIntentStatus = useCallback(async () => {
    if (!orderId) return;
    
    try {
      const response = await fetch(`/api/payment/check-intent?orderId=${orderId}`);
      if (response.ok) {
        const status = await response.json();
        setPaymentIntentStatus(status);
        
        // If payment is confirmed in Stripe but not in DB, show a message
        if (status.needsSync) {
          toast({
            title: "支付已确认",
            description: "支付已在Stripe确认，正在同步订单状态...",
            duration: 5000,
          });
        }
      }
    } catch (error) {
      console.error('Error checking payment intent status:', error);
    }
  }, [orderId, toast]);



  // Edit states
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [showPcbDetails, setShowPcbDetails] = useState(false);
  const [editedAddress, setEditedAddress] = useState<AddressFormValue>({
    country: '', state: '', city: '', address: '', zipCode: '', contactName: '', phone: '', courier: ''
  });
  const [editedPhone, setEditedPhone] = useState('');

  // Function to fetch order data
  const fetchOrderData = useCallback(async (showLoading = true) => {
    if (!orderId) return;
    
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/user/orders/${orderId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch order data');
      }

      const orderData: Order = await response.json();
      setOrder(orderData);

      // Convert pcb_spec to QuoteFormData for display
      if (orderData.pcb_spec) {
        try {
          const parsedSpec = quoteSchema.safeParse(orderData.pcb_spec);
          if (parsedSpec.success) {
            setPcbFormData(parsedSpec.data);
          }
        } catch (err) {
          console.warn('Failed to parse PCB spec:', err);
        }
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err instanceof Error ? err.message : 'Failed to load order data');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Initial load
  useEffect(() => {
    if (user && !dataFetchedRef.current) {
      fetchOrderData();
      dataFetchedRef.current = true;
    }
  }, [user, fetchOrderData]);

  // Auto-check payment status when order loads and has a payment_intent_id
  useEffect(() => {
    if (order?.payment_intent_id && !paymentIntentStatus) {
      checkPaymentIntentStatus();
    }
  }, [order?.payment_intent_id, paymentIntentStatus, checkPaymentIntentStatus]);

  // Update edit states when order data changes
  useEffect(() => {
    if (order) {
      setEditedAddress(order.shipping_address || {} as AddressFormValue);
      setEditedPhone(order.phone || '');
    }
  }, [order]);

  // No automatic polling - rely on webhook and manual refresh only

  // Manual refresh function with payment status check
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrderData(false);
    // Also check payment intent status if needed
    if (order?.payment_intent_id) {
      await checkPaymentIntentStatus();
    }
    setIsRefreshing(false);
    toast({
      title: "刷新完成",
      description: "订单数据已更新",
    });
  };

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
      await fetchOrderData();
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

  // Handle both array and object format for admin_orders
  const adminOrder = Array.isArray(order?.admin_orders) 
    ? order?.admin_orders?.[0] 
    : order?.admin_orders;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600 mx-auto"></div>
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
  
  // Enhanced payment readiness check
  const isPayableIntent = paymentIntentStatus?.hasPaymentIntent &&
    (
      paymentIntentStatus?.stripeStatus === 'failed' ||
      paymentIntentStatus?.stripeStatus === 'canceled' ||
      paymentIntentStatus?.stripeStatus === 'requires_payment_method' ||
      paymentIntentStatus?.stripeStatus === 'requires_action' ||
      paymentIntentStatus?.stripeStatus === 'requires_confirmation'
    );

  const isReadyForPayment =
    adminOrder &&
    adminOrder.admin_price &&
    adminOrder.payment_status !== 'paid' &&
    (
      (adminOrder.status === 'reviewed' && !paymentIntentStatus?.hasPaymentIntent) ||
      isPayableIntent
    );

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
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => router.push('/profile/orders')} 
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Order #{order.id.slice(0, 8)}</h1>
              <p className="text-gray-600">Created {order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Badge className={`${statusInfo?.style} px-4 py-2 text-sm font-medium`}>
            {statusInfo?.text || order.status}
          </Badge>
          {adminOrder?.payment_status === 'paid' && (
            <Badge className="bg-green-100 text-green-800 px-4 py-2">
              <CheckCircle className="w-4 h-4 mr-1" />
              Paid
            </Badge>
          )}
          <RefundStatusBadge 
            refundStatus={adminOrder?.refund_status || null} 
            paymentStatus={adminOrder?.payment_status || undefined}
            requestedAmount={adminOrder?.requested_refund_amount || undefined}
            approvedAmount={adminOrder?.approved_refund_amount || undefined}
            showDetails={false}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <OrderStepBar currentStatus={currentStep} steps={ORDER_STEPS} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-3 space-y-6">
          {/* Price & Payment - Enhanced Integration */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b pb-3">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Price & Payment Status
              </CardTitle>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    adminOrder?.payment_status === 'paid' ? 'bg-green-500' : 
                    adminOrder?.admin_price ? 'bg-blue-500' : 'bg-amber-500'
                  }`}></div>
                  <span className="text-gray-600">
                    {adminOrder?.payment_status === 'paid' ? 'Payment Completed' : 
                     adminOrder?.admin_price ? 'Ready for Payment' : 'Price Pending'}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {/* Price Flow - Horizontal Layout */}
              <div className="space-y-3">
                {/* Price Progression */}
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 mb-1">Initial System Quote</h4>
                    {order.cal_values ? (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">PCB:</span>
                          <span>${order.cal_values.pcbPrice?.toFixed(2) || '-'}</span>
                        </div>
                        {order.cal_values.shippingCost && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Shipping:</span>
                            <span>${order.cal_values.shippingCost.toFixed(2)}</span>
                          </div>
                        )}
                        {order.cal_values.totalPrice && (
                          <div className="flex justify-between font-medium border-t pt-1 mt-1">
                            <span>Total:</span>
                            <span>${order.cal_values.totalPrice.toFixed(2)}</span>
                          </div>
                        )}
                        {/* Lead Time & Delivery Info */}
                        <div className="mt-1 pt-1 border-t border-gray-200">
                          {order.cal_values.leadTimeDays && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Lead Time:</span>
                              <span className="font-medium text-blue-600">{order.cal_values.leadTimeDays} days</span>
                            </div>
                          )}
                          {order.cal_values.courier && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Courier:</span>
                              <span className="text-purple-600">{order.cal_values.courier}</span>
                            </div>
                          )}
                          {order.cal_values.courierDays && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Shipping Time:</span>
                              <span className="text-orange-600">{order.cal_values.courierDays}</span>
                            </div>
                          )}
                          {order.cal_values.estimatedFinishDate && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Est. Completion:</span>
                              <span className="text-green-600 font-medium">
                                {new Date(order.cal_values.estimatedFinishDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Calculating...</p>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center justify-center px-2 lg:px-2 py-2 lg:py-0">
                    <ArrowLeft className="w-5 h-5 text-gray-400 rotate-90 lg:rotate-180" />
                  </div>

                                     {/* Final Price */}
                   <div className="flex-1">
                     <h4 className="font-semibold text-gray-800 mb-1">Admin Confirmed Price</h4>
                     {adminOrder?.admin_price ? (
                       <div className="space-y-1">
                         {/* Price Breakdown */}
                         {adminOrder.pcb_price != null && adminOrder.pcb_price > 0 && (
                           <div className="flex justify-between text-sm">
                             <span className="text-gray-600">PCB Cost:</span>
                             <span>{adminOrder.currency === 'CNY' ? '¥' : '$'}{adminOrder.pcb_price.toFixed(2)}</span>
                           </div>
                         )}
                         {adminOrder.ship_price != null && adminOrder.ship_price > 0 && (
                           <div className="flex justify-between text-sm">
                             <span className="text-gray-600">Shipping:</span>
                             <span>{adminOrder.currency === 'CNY' ? '¥' : '$'}{adminOrder.ship_price.toFixed(2)}</span>
                           </div>
                         )}
                         {adminOrder.custom_duty != null && adminOrder.custom_duty > 0 && (
                           <div className="flex justify-between text-sm">
                             <span className="text-gray-600">Custom Duty:</span>
                             <span>{adminOrder.currency === 'CNY' ? '¥' : '$'}{adminOrder.custom_duty.toFixed(2)}</span>
                           </div>
                         )}
                         {adminOrder.coupon != null && adminOrder.coupon > 0 && (
                           <div className="flex justify-between text-sm text-red-600">
                             <span>Discount:</span>
                             <span>-{adminOrder.currency === 'CNY' ? '¥' : '$'}{adminOrder.coupon.toFixed(2)}</span>
                           </div>
                         )}
                         {adminOrder.surcharges && adminOrder.surcharges.length > 0 && (
                           <>
                             {adminOrder.surcharges
                               .filter(surcharge => surcharge.name && surcharge.amount > 0)
                               .map((surcharge, index) => (
                                 <div key={index} className="flex justify-between text-sm">
                                   <span className="text-gray-600">{surcharge.name}:</span>
                                   <span>{adminOrder.currency === 'CNY' ? '¥' : '$'}{surcharge.amount.toFixed(2)}</span>
                                 </div>
                               ))}
                           </>
                         )}
                         
                         {/* Total Price */}
                         <div className="flex justify-between font-bold text-lg border-t pt-1 mt-1 text-green-600">
                           <span>Total:</span>
                           <span>{adminOrder.currency === 'CNY' ? '¥' : '$'}{adminOrder.admin_price.toFixed(2)}</span>
                         </div>
                         
                         {/* Timeline Info */}
                         <div className="mt-1 pt-1 border-t border-green-200">
                           <div className="flex justify-between text-sm text-green-700">
                             <span>Production:</span>
                             <span>{adminOrder.production_days || '-'} days</span>
                           </div>
                           {adminOrder.due_date && (
                             <div className="flex justify-between text-sm text-green-700">
                               <span>Due Date:</span>
                               <span className="font-medium">
                                 {new Date(adminOrder.due_date).toLocaleDateString()}
                               </span>
                             </div>
                           )}
                           {adminOrder.delivery_date && (
                             <div className="flex justify-between text-sm text-green-700">
                               <span>Delivery Date:</span>
                               <span className="font-medium">
                                 {new Date(adminOrder.delivery_date).toLocaleDateString()}
                               </span>
                             </div>
                           )}
                           {order.cal_values?.courier && (
                             <div className="flex justify-between text-sm text-green-700">
                               <span>Courier:</span>
                               <span>{order.cal_values.courier}</span>
                             </div>
                           )}
                           {order.cal_values?.courierDays && (
                             <div className="flex justify-between text-sm text-green-700">
                               <span>Shipping Time:</span>
                               <span>{order.cal_values.courierDays}</span>
                             </div>
                           )}
                         </div>
                       </div>
                     ) : (
                       <div className="text-amber-600">
                         <div className="text-lg font-medium">Pending Review</div>
                         <div className="text-sm">Admin is calculating final price</div>
                       </div>
                     )}
                   </div>
                                 </div>

                {/* Action Area */}
                <div className="border-t pt-3">
                  {/* Payment status display */}
                  {paymentIntentStatus?.hasPaymentIntent && paymentIntentStatus?.isPaid && adminOrder?.payment_status !== 'paid' && (
                    <div className="flex items-center justify-center gap-2 text-blue-700 bg-blue-50 py-3 rounded-lg mb-3">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="font-medium">Payment Confirmed - Updating Status...</span>
                    </div>
                  )}
                  
                  {paymentIntentStatus?.hasPaymentIntent && !paymentIntentStatus?.isPaid && (
                    <div className={`flex items-center justify-center gap-2 py-3 rounded-lg mb-3 ${
                      paymentIntentStatus.stripeStatus === 'requires_payment_method' || 
                      paymentIntentStatus.stripeStatus === 'failed' ||
                      paymentIntentStatus.stripeStatus === 'canceled'
                        ? 'text-orange-700 bg-orange-50' 
                        : paymentIntentStatus.stripeStatus === 'requires_action' ||
                          paymentIntentStatus.stripeStatus === 'requires_confirmation'
                        ? 'text-blue-700 bg-blue-50'
                        : paymentIntentStatus.stripeStatus === 'processing'
                        ? 'text-green-700 bg-green-50'
                        : 'text-amber-700 bg-amber-50'
                    }`}>
                      {paymentIntentStatus.stripeStatus === 'requires_payment_method' || 
                       paymentIntentStatus.stripeStatus === 'failed' ||
                       paymentIntentStatus.stripeStatus === 'canceled' ? (
                        <>
                          <AlertTriangle className="h-5 w-5" />
                          <span className="font-medium">Payment Failed - You can retry payment below</span>
                        </>
                      ) : paymentIntentStatus.stripeStatus === 'requires_action' || 
                            paymentIntentStatus.stripeStatus === 'requires_confirmation' ? (
                        <>
                          <AlertTriangle className="h-5 w-5" />
                          <span className="font-medium">Payment Action Required - Click Pay Now to complete</span>
                        </>
                      ) : paymentIntentStatus.stripeStatus === 'processing' ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span className="font-medium">Payment Processing...</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-5 w-5" />
                          <span className="font-medium">Payment Status: {paymentIntentStatus.stripeStatus}</span>
                        </>
                      )}
                    </div>
                  )}

                  {isReadyForPayment && adminOrder?.payment_status !== 'paid' ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-green-700 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        <span>
                          {paymentIntentStatus?.stripeStatus === 'requires_payment_method' || 
                           paymentIntentStatus?.stripeStatus === 'failed' ||
                           paymentIntentStatus?.stripeStatus === 'canceled'
                            ? 'Payment failed - ready to retry'
                            : paymentIntentStatus?.stripeStatus === 'requires_action' ||
                              paymentIntentStatus?.stripeStatus === 'requires_confirmation'  
                            ? 'Payment action required'
                            : 'Ready for payment'
                          }
                        </span>
                      </div>
                      <Button 
                        onClick={() => router.push(`/payment/${order.id}`)}
                        className={`w-full text-white py-3 text-sm sm:text-base ${
                          paymentIntentStatus?.stripeStatus === 'requires_payment_method' || 
                          paymentIntentStatus?.stripeStatus === 'failed' ||
                          paymentIntentStatus?.stripeStatus === 'canceled'
                            ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
                            : paymentIntentStatus?.stripeStatus === 'requires_action' ||
                              paymentIntentStatus?.stripeStatus === 'requires_confirmation'
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                            : 'bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700'
                        }`}
                        size="lg"
                      >
                        <CreditCard className="h-5 w-5 mr-2" />
                        {paymentIntentStatus?.stripeStatus === 'requires_payment_method' || 
                         paymentIntentStatus?.stripeStatus === 'failed' ||
                         paymentIntentStatus?.stripeStatus === 'canceled'
                          ? 'Retry Payment'
                          : paymentIntentStatus?.stripeStatus === 'requires_action' ||
                            paymentIntentStatus?.stripeStatus === 'requires_confirmation'
                          ? 'Complete Payment'
                          : 'Pay Now'
                        } - {adminOrder.currency === 'CNY' ? '¥' : '$'}{adminOrder.admin_price?.toFixed(2)}
                      </Button>
                    </div>
                  ) : adminOrder?.payment_status === 'paid' || paymentIntentStatus?.isPaid ? (
                    <div className="flex items-center justify-center gap-2 text-green-700 bg-green-50 py-3 rounded-lg">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Payment Completed</span>
                    </div>
                  ) : order.payment_intent_id && !paymentIntentStatus?.isPaid && !isReadyForPayment && paymentIntentStatus?.stripeStatus === 'processing' ? (
                    <div className="flex items-center justify-center gap-2 text-blue-700 bg-blue-50 py-3 rounded-lg">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="font-medium">Payment Processing...</span>
                    </div>
                  ) : null}

                  {/* Refund Actions */}
                  <div className="mt-3 pt-3 border-t">
                    <RefundActionButtons
                      orderId={order.id}
                      refundStatus={adminOrder?.refund_status || null}
                      paymentStatus={adminOrder?.payment_status || ''}
                      approvedAmount={adminOrder?.approved_refund_amount || undefined}
                      onRefundStatusChange={fetchOrderData}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Details Row */}
          <div className="space-y-6">
            {/* Refund Details */}
            <RefundDetails
              refundStatus={adminOrder?.refund_status || null}
              paymentStatus={adminOrder?.payment_status || undefined}
              requestedAmount={adminOrder?.requested_refund_amount || undefined}
              approvedAmount={adminOrder?.approved_refund_amount || undefined}
              actualRefundAmount={adminOrder?.actual_refund_amount || undefined}
              refundReason={adminOrder?.refund_reason || undefined}
              refundNote={adminOrder?.refund_note || undefined}
              refundRequestAt={adminOrder?.refund_request_at || undefined}
              userRefundConfirmationAt={adminOrder?.user_refund_confirmation_at || undefined}
              refundProcessedAt={adminOrder?.refund_processed_at || undefined}
              refundedAt={adminOrder?.refunded_at || undefined}
              stripeRefundId={adminOrder?.stripe_refund_id || undefined}
            />

            {/* Product Specifications */}
            <div className="space-y-4">
              {(() => {
                const productType = pcbFormData?.productType || 
                  (pcbFormData?.borderType ? 'stencil' : 'pcb');
                
                if (productType === 'stencil') {
                  return <StencilSpecificationDisplay stencilFormData={pcbFormData as any} />;
                } else {
                  return <PCBSpecificationDisplay pcbFormData={pcbFormData} />;
                }
              })()}
              
              {/* Delivery Information */}
              {pcbFormData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-orange-600" />
                      Delivery Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DeliveryInfoDisplay pcbSpec={pcbFormData} size="md" />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Contact & Shipping */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-purple-600" />
                  Contact & Shipping
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Contact Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{order.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{order.phone || 'Not provided'}</span>
                    {canEdit && (
                      <Dialog open={isEditingPhone} onOpenChange={setIsEditingPhone}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Phone Number</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="phone">Phone Number</Label>
                              <Input
                                id="phone"
                                value={editedPhone}
                                onChange={(e) => setEditedPhone(e.target.value)}
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setIsEditingPhone(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleSavePhone}>
                                Save
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-800">Shipping Address</h5>
                    {canEdit && (
                      <Dialog open={isEditingAddress} onOpenChange={setIsEditingAddress}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-sm sm:max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Edit Shipping Address</DialogTitle>
                          </DialogHeader>
                          <div className="py-4">
                            <AddressFormComponent
                              userId={user?.id}
                              value={editedAddress}
                              onChange={setEditedAddress}
                            />
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditingAddress(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleSaveAddress}>
                              Save Changes
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                  {order.shipping_address ? (
                    <div className="space-y-1 text-sm">
                      <div className="font-medium">{order.shipping_address.contactName}</div>
                      <div className="text-gray-700">
                        {[
                          order.shipping_address.address,
                          order.shipping_address.city,
                          order.shipping_address.state,
                          order.shipping_address.country,
                          order.shipping_address.zipCode
                        ].filter(Boolean).join(', ')}
                      </div>
                      {order.shipping_address.courier && (
                        <div className="flex items-center gap-1 text-purple-700">
                          <Truck className="w-3 h-3" />
                          <span>{order.shipping_address.courier}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No shipping address provided</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canEdit && (
                <Button 
                  onClick={() => router.push(`/quote2?edit=${order.id}`)}
                  className="w-full"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Order
                </Button>
              )}
              
              {order.gerber_file_url && (
                <DownloadButton 
                  filePath={order.gerber_file_url} 
                  bucket="gerber"
                  className="w-full border border-gray-300 hover:bg-gray-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Files
                </DownloadButton>
              )}
              
              {canCancel && (
                <Button 
                  onClick={handleCancelOrder} 
                  variant="destructive"
                  className="w-full"
                >
                  Cancel Order
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge className={statusInfo?.style}>
                    {statusInfo?.text || order.status}
                  </Badge>
                </div>
                {adminOrder && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Admin Status:</span>
                      <Badge variant="outline" className="text-xs">
                        {adminOrder.status || 'Processing'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment:</span>
                      <Badge variant={adminOrder.payment_status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                        {adminOrder.payment_status || 'Unpaid'}
                      </Badge>
                    </div>
                    {adminOrder.due_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Due Date:</span>
                        <span className="font-medium text-sm">{new Date(adminOrder.due_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {adminOrder?.admin_note && (
                <div className="pt-3 border-t">
                  <div className="text-sm text-gray-600 mb-1">Admin Notes:</div>
                  <div className="text-sm bg-blue-50 p-2 rounded border-l-2 border-blue-200">
                    {adminOrder.admin_note}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Status */}
          {canEdit ? (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-800 mb-1">Editable Order</h4>
                    <p className="text-sm text-amber-700">
                      You can modify this order before payment.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-gray-200 bg-gray-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Order Locked</h4>
                    <p className="text-sm text-gray-700">
                      This order cannot be modified in its current status.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}


        </div>
      </div>

      {/* Product Details Dialog */}
      <Dialog open={showPcbDetails} onOpenChange={setShowPcbDetails}>
        <DialogContent className="max-w-sm sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {(() => {
                const productType = pcbFormData?.productType || 
                  (pcbFormData?.borderType ? 'stencil' : 'pcb');
                return productType === 'stencil' ? 'Complete Stencil Specifications' : 'Complete PCB Specifications';
              })()}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {pcbFormData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(pcbFormData || {})
                  .filter(([, value]) => value !== null && value !== undefined && value !== '')
                  .map(([key, value]) => (
                    <div key={key} className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500 capitalize mb-1">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className="font-medium">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No product specifications available</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 