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
  Pencil, DollarSign, MapPin, FileText, AlertCircle, 
  ArrowLeft, CheckCircle, Truck, AlertTriangle, CreditCard, Info, Loader2,
  Shield, Download, Phone, Mail
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
  const [showPcbDetails, setShowPcbDetails] = useState(false);
  const [editedAddress, setEditedAddress] = useState<AddressFormValue>({
    country: '', state: '', city: '', address: '', zipCode: '', contactName: '', phone: '', courier: ''
  });
  const [editedPhone, setEditedPhone] = useState('');

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
          } else {
            console.warn('PCB spec validation failed:', result.error);
            setPcbFormData(orderData.pcb_spec as QuoteFormData);
          }
        } catch (err) {
          console.warn('Failed to parse PCB spec:', err);
          setPcbFormData(orderData.pcb_spec as QuoteFormData);
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Order #{order.id.slice(-8)}</h1>
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
                  {isReadyForPayment && adminOrder?.payment_status !== 'paid' ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-green-700 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        <span>Price confirmed and ready for payment</span>
                      </div>
                      <Button 
                        onClick={() => router.push(`/payment/${order.id}`)}
                        className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white py-3 text-sm sm:text-base"
                        size="lg"
                      >
                        <CreditCard className="h-5 w-5 mr-2" />
                        Pay Now - {adminOrder.currency === 'CNY' ? '¥' : '$'}{adminOrder.admin_price?.toFixed(2)}
                      </Button>
                    </div>
                  ) : adminOrder?.payment_status === 'paid' ? (
                    <div className="flex items-center justify-center gap-2 text-green-700 bg-green-50 py-3 rounded-lg">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Payment Completed</span>
                    </div>
                  ) : null}

                  {/* Refund Actions */}
                  {(canRequestRefund || adminOrder?.refund_status === 'pending_confirmation') && (
                    <div className="mt-3 pt-3 border-t">
                      {canRequestRefund && (
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
                      )}
                      
                      {adminOrder?.refund_status === 'pending_confirmation' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                          <h4 className="font-semibold text-blue-800 mb-2">Confirm Your Refund</h4>
                          <p className="text-sm text-blue-700 mb-2">Amount: ${adminOrder.approved_refund_amount?.toFixed(2)}</p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRefundConfirmation('cancel')}
                              disabled={isConfirmingRefund}
                            >
                              Cancel Request
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleRefundConfirmation('confirm')}
                              disabled={isConfirmingRefund}
                            >
                              {isConfirmingRefund ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Refund'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Details Row */}
          <div className="space-y-6">
            {/* PCB Specifications */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-600" />
                    PCB Specifications
                  </div>
                  {pcbFormData && (
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded font-medium text-xs sm:text-sm">
                        {pcbFormData.layers}L
                      </span>
                      <span className="px-2 py-1 bg-green-50 text-green-700 rounded font-medium text-xs sm:text-sm">
                        {pcbFormData.singleCount}pcs
                      </span>
                      <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded font-medium text-xs sm:text-sm">
                        {pcbFormData.thickness}mm
                      </span>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-3 px-4">
                {pcbFormData ? (
                  <div className="space-y-1 text-xs">
                    {/* Compact Multi-Column Layout */}
                    {/* Row 1: Basic Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Size:</span>
                          <span className="font-medium">{pcbFormData.singleDimensions.length}×{pcbFormData.singleDimensions.width}mm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Material:</span>
                          <span className="font-medium">{pcbFormData.pcbType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Shipment:</span>
                          <span className="font-medium">{pcbFormData.shipmentType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">TG:</span>
                          <span className="font-medium">{pcbFormData.tg}</span>
                        </div>
                      </div>

                      {/* Row 2: Panel & Design Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">HDI:</span>
                          <span className="font-medium">{pcbFormData.hdi}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Designs Count:</span>
                          <span className="font-medium">{pcbFormData.differentDesignsCount}</span>
                        </div>
                        {pcbFormData.shipmentType !== 'single' && pcbFormData.panelDimensions && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Panel Size:</span>
                              <span className="font-medium">{pcbFormData.panelDimensions.row}×{pcbFormData.panelDimensions.column}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Panel Set:</span>
                              <span className="font-medium">{pcbFormData.panelSet}</span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Shengyi Material:</span>
                          <span className="font-medium">{pcbFormData.useShengyiMaterial ? 'Yes' : 'No'}</span>
                        </div>
                      </div>

                      {/* Row 3: Break-away Rail & Border */}
                      {(pcbFormData.breakAwayRail && pcbFormData.breakAwayRail !== 'None') || pcbFormData.border || pcbFormData.borderCutType ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                          {pcbFormData.breakAwayRail && pcbFormData.breakAwayRail !== 'None' && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Break-away Rail:</span>
                              <span className="font-medium">{pcbFormData.breakAwayRail}</span>
                            </div>
                          )}
                          {pcbFormData.border && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Board Edge:</span>
                              <span className="font-medium">{pcbFormData.border}mm</span>
                            </div>
                          )}
                          {pcbFormData.borderCutType && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">PCB Separation:</span>
                              <span className="font-medium">{pcbFormData.borderCutType}</span>
                            </div>
                          )}
                        </div>
                      ) : null}

                      {/* Row 4: Colors & Finish */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Solder Mask:</span>
                          <span className="font-medium">{pcbFormData.solderMask}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Silkscreen:</span>
                          <span className="font-medium">{pcbFormData.silkscreen}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Surface Finish:</span>
                          <span className="font-medium">{pcbFormData.surfaceFinish}</span>
                        </div>
                        {pcbFormData.surfaceFinish === 'ENIG' && pcbFormData.surfaceFinishEnigType && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">ENIG Type:</span>
                            <span className="font-medium">{pcbFormData.surfaceFinishEnigType}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Via Process:</span>
                          <span className="font-medium">{pcbFormData.maskCover}</span>
                        </div>
                      </div>

                      {/* Row 5: Copper & Trace */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Outer Copper:</span>
                          <span className="font-medium">{pcbFormData.outerCopperWeight}oz</span>
                        </div>
                        {pcbFormData.layers >= 4 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Inner Copper:</span>
                            <span className="font-medium">{pcbFormData.innerCopperWeight}oz</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Min Trace/Space:</span>
                          <span className="font-medium">{pcbFormData.minTrace}mil</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Min Hole Size:</span>
                          <span className="font-medium">{pcbFormData.minHole}mm</span>
                        </div>
                        {pcbFormData.holeCount && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Hole Count:</span>
                            <span className="font-medium">{pcbFormData.holeCount}</span>
                          </div>
                        )}
                      </div>

                      {/* Row 6: Edge Processing */}
                      {pcbFormData.edgePlating || pcbFormData.halfHole ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                          {pcbFormData.edgePlating && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Edge Plating:</span>
                                <span className="font-medium">Yes</span>
                              </div>
                              {pcbFormData.edgeCover && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Edge Cover:</span>
                                  <span className="font-medium">{pcbFormData.edgeCover}</span>
                                </div>
                              )}
                            </>
                          )}
                          {pcbFormData.halfHole && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Half Hole:</span>
                              <span className="font-medium">{pcbFormData.halfHole}</span>
                            </div>
                          )}
                        </div>
                      ) : null}

                      {/* Row 7: Test & Quality */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Electrical Test:</span>
                          <span className="font-medium">{pcbFormData.testMethod}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">IPC Class:</span>
                          <span className="font-medium">{pcbFormData.ipcClass}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cross Outs:</span>
                          <span className="font-medium">{pcbFormData.crossOuts}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Data Conflicts:</span>
                          <span className="font-medium">{pcbFormData.ifDataConflicts}</span>
                        </div>
                      </div>

                      {/* Row 8: Service & Reports */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Working Gerber:</span>
                          <span className="font-medium">{pcbFormData.workingGerber}</span>
                        </div>
                        {pcbFormData.productReport && pcbFormData.productReport.length > 0 && pcbFormData.productReport[0] !== 'None' && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Product Report:</span>
                            <span className="font-medium">{pcbFormData.productReport.join(', ')}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">UL Mark:</span>
                          <span className="font-medium">{pcbFormData.ulMark ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Delivery Type:</span>
                          <span className="font-medium text-orange-600">{pcbFormData.delivery}</span>
                        </div>
                      </div>

                      {/* Special Features - Compact Tags */}
                      {(pcbFormData.impedance || pcbFormData.goldFingers || pcbFormData.edgePlating || pcbFormData.bga || pcbFormData.holeCu25um || pcbFormData.blueMask || pcbFormData.ulMark) && (
                        <div className="pt-2 border-t border-gray-200">
                          <div className="text-gray-600 text-xs mb-1">Special Features:</div>
                          <div className="flex flex-wrap gap-1">
                            {pcbFormData.impedance && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded">Impedance</span>
                            )}
                            {pcbFormData.goldFingers && (
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">Gold Fingers</span>
                            )}
                            {pcbFormData.edgePlating && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">Edge Plating</span>
                            )}
                            {pcbFormData.bga && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded">BGA</span>
                            )}
                            {pcbFormData.holeCu25um && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">Cu 25μm</span>
                            )}
                            {pcbFormData.blueMask && (
                              <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 text-xs rounded">Blue Mask</span>
                            )}
                            {pcbFormData.ulMark && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded">UL Mark</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {pcbFormData.pcbNote && (
                        <div className="pt-2 border-t border-gray-200">
                          <div className="text-gray-600 text-xs mb-1">PCB Note:</div>
                          <div className="text-xs bg-gray-50 p-2 rounded">
                            {pcbFormData.pcbNote}
                          </div>
                        </div>
                      )}
                    </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">PCB specifications not available</p>
                )}
              </CardContent>
            </Card>

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

      {/* PCB Details Dialog */}
      <Dialog open={showPcbDetails} onOpenChange={setShowPcbDetails}>
        <DialogContent className="max-w-sm sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete PCB Specifications</DialogTitle>
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
              <p className="text-center text-gray-500 py-8">No PCB specifications available</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 