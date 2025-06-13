"use client";
import React, { useEffect, useState, useCallback } from 'react';
// Toast notifications handled by useToast hook
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
  ArrowLeft, CheckCircle, Truck, AlertTriangle, CreditCard, Info, Loader2
} from 'lucide-react';
import DownloadButton from '@/app/components/custom-ui/DownloadButton';
import OrderStepBar from '@/components/ui/OrderStepBar';
import { supabase } from '@/lib/supabaseClient';
import { useUserStore } from "@/lib/userStore";
import { quoteSchema, QuoteFormData } from '@/app/quote2/schema/quoteSchema';
// Price formatting utilities removed as we now display prices directly
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
  // Related admin order information (one-to-one relationship)
  admin_orders: AdminOrder[];
}

// Order status mapping with English labels
const ORDER_STATUS_MAP: Record<string, { text: string; style: string; description: string; stepKey: string }> = {
  'created': { 
    text: "Created", 
    style: "bg-blue-100 text-blue-800 border-blue-200", 
    description: "Quote request submitted",
    stepKey: "created"
  },
  'pending': { 
    text: "Under Review", 
    style: "bg-yellow-100 text-yellow-800 border-yellow-200", 
    description: "Being reviewed by our team",
    stepKey: "review"
  },
  'reviewed': { 
    text: "Reviewed", 
    style: "bg-green-100 text-green-800 border-green-200", 
    description: "Review completed, ready for confirmation and payment",
    stepKey: "confirm_pay"
  },
  'quoted': { 
    text: "Quoted", 
    style: "bg-green-100 text-green-800 border-green-200", 
    description: "Quote provided, awaiting confirmation",
    stepKey: "confirm_pay"
  },
  'confirmed': { 
    text: "Confirmed", 
    style: "bg-indigo-100 text-indigo-800 border-indigo-200", 
    description: "Order confirmed, ready for payment",
    stepKey: "confirm_pay"
  },
  'paid': { 
    text: "Paid", 
    style: "bg-emerald-100 text-emerald-800 border-emerald-200", 
    description: "Payment received, ready for production",
    stepKey: "confirm_pay"
  },
  'in_production': { 
    text: "In Production", 
    style: "bg-blue-100 text-blue-800 border-blue-200", 
    description: "PCBs being manufactured",
    stepKey: "production"
  },
  'shipped': { 
    text: "Shipped", 
    style: "bg-cyan-100 text-cyan-800 border-cyan-200", 
    description: "Order shipped",
    stepKey: "shipping"
  },
  'delivered': { 
    text: "Delivered", 
    style: "bg-emerald-100 text-emerald-800 border-emerald-200", 
    description: "Order delivered",
    stepKey: "receiving"
  },
  'completed': { 
    text: "Completed", 
    style: "bg-green-100 text-green-800 border-green-200", 
    description: "Order completed",
    stepKey: "complete"
  },
  'cancelled': { 
    text: "Cancelled", 
    style: "bg-red-100 text-red-800 border-red-200", 
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
      
      // First get the order data
      const { data: orderData, error: orderError } = await supabase
        .from('pcb_quotes')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single();

      if (orderError) throw orderError;
      if (!orderData) throw new Error('Order not found');
      
      // Then get the admin order data
      const { data: adminOrderData, error: adminOrderError } = await supabase
        .from('admin_orders')
        .select('*')
        .eq('user_order_id', orderId)
        .maybeSingle();

      if (adminOrderError && adminOrderError.code !== 'PGRST116') {
        console.warn('Error fetching admin order:', adminOrderError);
      }

      // Combine the data
      const combinedOrder: Order = {
        ...orderData,
        admin_orders: adminOrderData ? [adminOrderData] : []
      };
      
      setOrder(combinedOrder);

      // Parse PCB specifications
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

      // Initialize edit states
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

  // Check if editing is allowed (before payment/production)
  const canEdit = order && ['created', 'pending', 'reviewed'].includes(order.status || '');

  // Check if cancellation is allowed
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
      await fetchOrder(); // Refresh data
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

  // Save address changes
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
    
    // If order status is 'reviewed', set back to 'pending' for re-review
    if (order && order.status === 'reviewed') {
      await updateOrder({ status: 'pending' });
      toast({
        title: 'Info',
        description: 'Order status changed to "Under Review" due to address modification'
      });
    }
  };

  // Save phone changes
  const handleSavePhone = async () => {
    await updateOrder({ phone: editedPhone });
    setIsEditingPhone(false);
  };

  // Save PCB specification changes
  const handleSavePcbSpec = async () => {
    await updateOrder({ pcb_spec: editedPcbSpec });
    setIsEditingPcbSpec(false);
    
    // If order status is 'reviewed', set back to 'pending' for re-review
    if (order && order.status === 'reviewed') {
      await updateOrder({ status: 'pending' });
      toast({
        title: 'Info',
        description: 'Order status changed to "Under Review" due to PCB specification modification'
      });
    }
  };

  // Cancel order
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
    if (!value) return '-';
    
    const displayMap: Record<string, (val: unknown) => string> = {
      pcbType: (v) => v === 'FR-4' ? 'FR-4 Standard' : String(v),
      layers: (v) => `${v} Layers`,
      thickness: (v) => `${v}mm`,
      singleDimensions: (v) => {
        const dim = v as { length?: number; width?: number };
        return dim?.length && dim?.width ? `${dim.length} × ${dim.width} cm` : '-';
      },
      singleCount: (v) => `${v} pcs`,
      delivery: (v) => v === 'standard' ? 'Standard' : 'Urgent',
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
      solderMask: (v) => {
        const map: Record<string, string> = {
          'Green': 'Green',
          'Blue': 'Blue', 
          'Red': 'Red',
          'Black': 'Black',
          'White': 'White'
        };
        return map[v as string] || String(v);
      },
      silkscreen: (v) => {
        const map: Record<string, string> = {
          'White': 'White',
          'Black': 'Black'
        };
        return map[v as string] || String(v);
      }
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
      fetchOrder(); // Refresh order details
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
      fetchOrder(); // Refresh data
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Order</h2>
          <p className="text-gray-600 mb-4">{error || 'Order not found'}</p>
          <Button onClick={() => router.push('/profile/orders')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  const statusInfo = ORDER_STATUS_MAP[order.status || 'created'];
  
  // Check if the order is ready for payment. Requires admin order, price, and 'reviewed' status.
  const isReadyForPayment = adminOrder && adminOrder.admin_price && adminOrder.status === 'reviewed';

  // Determine the current step for the progress bar
  const getCurrentStep = () => {
    const userStatus = order.status || 'created';
    const isPaid = adminOrder?.payment_status === 'paid';

    if (isPaid) {
      if (adminOrder?.status === 'shipped') return 'shipping';
      if (adminOrder?.status === 'delivered') return 'receiving';
      if (adminOrder?.status === 'completed') return 'complete';
      return 'production';
    }

    if (isReadyForPayment) {
      return 'confirm_pay';
    }
    
    // If admin order exists but isn't ready for payment, it's still in the review phase.
    if (adminOrder) {
      return 'review';
    }

    // Otherwise, base the step on the user's order status.
    switch (userStatus) {
      case 'created':
        return 'created';
      case 'pending':
      case 'reviewed':
        return 'review';
      default:
        return 'created';
    }
  };

  const currentStep = getCurrentStep();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
              <Badge className={`${statusInfo?.style} border text-sm font-medium`}>
                {statusInfo?.text || order.status}
              </Badge>
            </div>
            <p className="text-gray-600">Order ID: #{order.id.slice(-8)}</p>
            <p className="text-sm text-gray-500">
              Created: {order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : '-'}
            </p>
          </div>
          
          <div className="flex gap-3 mt-4 sm:mt-0">
            <Button onClick={() => router.push('/profile/orders')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Button>
            {canCancel && (
              <Button onClick={handleCancelOrder} variant="destructive">
                Cancel Order
              </Button>
            )}
          </div>
        </div>

        {/* Order Progress Steps */}
        <div className="mb-8">
          <OrderStepBar 
            currentStatus={currentStep} 
            steps={ORDER_STEPS}
          />
        </div>

        {/* Edit Warning */}
        {canEdit && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Order Can Be Modified</span>
            </div>
            <p className="text-sm text-amber-700 mt-1">
              You can edit address and PCB specifications before payment. Changes may require re-review.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status Card */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-3">
                <Package className="h-5 w-5 text-blue-600" />
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <Badge className={`${statusInfo?.style} border text-sm px-3 py-1`}>
                    {statusInfo?.text || order.status}
                  </Badge>
                  <span className="text-gray-600">
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
                          return `Admin is reviewing, waiting for price confirmation. Admin status: ${adminOrder.status}`;
                        }
                        return `Admin is finalizing your order, waiting for final approval. Admin status: ${adminOrder.status}`;
                      }

                      switch (userStatus) {
                        case 'created':
                          return 'Quote request submitted, waiting for admin review.';
                        case 'pending':
                          return 'Being reviewed by our team.';
                        case 'reviewed':
                          return 'Initial review complete, waiting for admin to finalize pricing and details.';
                        default:
                          return statusInfo?.description || 'Status unknown';
                      }
                    })()}
                  </span>
                </div>
                
                {/* Admin Order Status */}
                {adminOrder ? (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Admin Processing Status</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Admin Status: </span>
                        <span className="font-medium">{adminOrder.status || 'Processing'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Payment Status: </span>
                        <span className="font-medium">{adminOrder.payment_status || 'Unpaid'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Price Status: </span>
                        <span className="font-medium">
                          {adminOrder.admin_price ? 'Confirmed' : 'Pending'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Expected Delivery: </span>
                        <span className="font-medium">
                          {adminOrder.delivery_date ? new Date(adminOrder.delivery_date).toLocaleDateString('en-US') : '-'}
                        </span>
                      </div>
                    </div>
                    {adminOrder.admin_note && (
                      <div className="mt-3">
                        <span className="text-gray-500 text-sm">Admin Notes: </span>
                        <div className="mt-1">
                          <div className="text-sm bg-blue-50 p-2 rounded border-l-2 border-blue-200 whitespace-pre-wrap">
                            {adminOrder.admin_note}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 text-amber-600">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">Waiting for Admin Review</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Our team will review your order and create an admin order record with confirmed pricing soon.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Price Information Card */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-3">
                <DollarSign className="h-5 w-5 text-green-600" />
                <CardTitle>Price Information</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Final Admin Confirmed Price - Most Important */}
                {adminOrder?.admin_price && (
                  <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h4 className="font-semibold text-green-800">Final Confirmed Price</h4>
                    </div>
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      {adminOrder.currency === 'CNY' ? '¥' : '$'}{adminOrder.admin_price?.toFixed(2) || '0.00'}
                    </div>
                    <p className="text-sm text-green-700">
                      This is the final price confirmed by our team after detailed review.
                    </p>
                  </div>
                )}

                {/* Initial Quote vs Final Price Comparison */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Initial System Quote */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Initial Quote
                      </h5>
                      {order.cal_values ? (
                        <div className="space-y-1 text-sm">
                          <div>
                            <span className="text-gray-500">PCB Price: </span>
                            <span>${order.cal_values.pcbPrice?.toFixed(2) || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Lead Time: </span>
                            <span>{order.cal_values.leadTimeDays || '-'} days</span>
                          </div>
                          {order.cal_values.estimatedFinishDate && (
                            <div>
                              <span className="text-gray-500">Est. Completion: </span>
                              <span>{new Date(order.cal_values.estimatedFinishDate).toLocaleDateString('en-US')}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Calculating...</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2 italic">
                        * Initial system calculation for reference
                      </p>
                    </div>

                    {/* Final Admin Confirmed Details */}
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h5 className="font-medium text-blue-700 mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Final Confirmed
                      </h5>
                      {adminOrder ? (
                        <div className="space-y-1 text-sm">
                          <div>
                            <span className="text-gray-500">PCB Price: </span>
                            <span className="font-medium">
                              {adminOrder.currency === 'CNY' 
                                ? `¥${adminOrder.pcb_price?.toFixed(2) || '-'}` 
                                : `$${adminOrder.pcb_price ? (adminOrder.pcb_price / (adminOrder.exchange_rate || 7.2)).toFixed(2) : '-'}`
                              }
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Production Days: </span>
                            <span className="font-medium">{adminOrder.production_days || '-'} days</span>
                          </div>
                          {adminOrder.due_date && (
                            <div>
                              <span className="text-gray-500">Due Date: </span>
                              <span className="font-medium">{new Date(adminOrder.due_date).toLocaleDateString('en-US')}</span>
                            </div>
                          )}
                          {adminOrder.delivery_date && (
                            <div>
                              <span className="text-gray-500">Delivery Date: </span>
                              <span className="font-medium">{new Date(adminOrder.delivery_date).toLocaleDateString('en-US')}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Pending admin review</p>
                      )}
                      <p className="text-xs text-blue-600 mt-2 font-medium">
                        ✓ This is the official final information
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* 汇率信息 - 独立显示 */}
                {adminOrder && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm">
                      <span className="text-gray-500">Exchange Rate: </span>
                      <span className="font-medium">1 USD = {adminOrder.exchange_rate || 7.2} CNY</span>
                    </div>
                  </div>
                )}
                
                {/* Payment Button - Only show when admin has confirmed price and status is reviewed */}
                {isReadyForPayment && adminOrder?.payment_status !== 'paid' && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded">
                      <div className="flex items-center gap-2 text-green-700 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">Price Confirmed & Approved - Ready for Payment</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => router.push(`/payment/${order.id}`)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      size="lg"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay Now - {adminOrder.currency === 'CNY' ? '¥' : '$'}
                      {adminOrder.admin_price?.toFixed(2)}
                    </Button>
                  </div>
                )}
                
                {/* Waiting for Admin Confirmation */}
                {!isReadyForPayment && adminOrder?.payment_status !== 'paid' && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-700 mb-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">
                          {
                            !adminOrder ? "Waiting for Admin Review" :
                            !adminOrder.admin_price ? "Waiting for Price Confirmation" :
                            "Waiting for Final Admin Approval"
                          }
                        </span>
                      </div>
                      <p className="text-sm text-amber-700">
                        {
                          !adminOrder ? "Our team will review your order and provide final pricing soon." :
                          !adminOrder.admin_price ? "Our admin team is calculating the final price for your order." :
                          "Our admin team has drafted the order details. Once they give the final approval (by changing status to 'reviewed'), you will be able to proceed with payment."
                        }
                      </p>
                    </div>
                  </div>
                )}
                
                {adminOrder?.payment_status === 'paid' && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Payment Completed</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">This is the final amount for your order.</p>
                  </div>
                )}

                {canRequestRefund && (
                  <div className="mt-4 pt-4 border-t">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full" disabled={isRefunding}>
                          Request Refund
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action will submit a refund request for administrator review.
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

                {adminOrder?.refund_status && adminOrder.refund_status !== 'rejected' && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-blue-600">
                      <Info className="h-5 w-5" />
                      <span className="font-medium">Refund Status: {adminOrder.refund_status}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Your refund request is being processed. You will be notified of any updates.
                    </p>
                  </div>
                )}

                {adminOrder?.refund_status === 'pending_confirmation' && (
                  <Card className="mt-4 border-blue-400">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Info className="text-blue-500" />
                        <span>Action Required: Confirm Your Refund</span>
                      </CardTitle>
                      <CardDescription>
                        Our team has reviewed your refund request. Please confirm the details below to proceed.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p><strong>Approved Refund Amount:</strong> ${adminOrder.approved_refund_amount?.toFixed(2)}</p>
                      <p><strong>Admin Note:</strong> {adminOrder.refund_reason || 'N/A'}</p>
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <CardTitle>Contact Information</CardTitle>
                </div>
                {canEdit && (
                  <Dialog open={isEditingPhone} onOpenChange={setIsEditingPhone}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
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
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-500">Email: </span>
                    <span className="font-medium">{order.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Phone: </span>
                    <span className="font-medium">{order.phone || 'Not provided'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-purple-600" />
                  <CardTitle>Shipping Address</CardTitle>
                </div>
                {canEdit && (
                  <Dialog open={isEditingAddress} onOpenChange={setIsEditingAddress}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Edit Shipping Address</DialogTitle>
                        <DialogDescription>
                          Select a saved address, or edit the fields below. Changes here will only apply to this order. To manage your address book permanently, go to your profile.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <AddressFormComponent
                        userId={user?.id}
                        value={editedAddress}
                        onChange={setEditedAddress}
                      />
                      
                      <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setIsEditingAddress(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveAddress}>
                          Apply to This Order
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
                {order.shipping_address ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{order.shipping_address.contactName || '-'}</span>
                      {order.shipping_address.phone && (
                        <span className="text-gray-600">({order.shipping_address.phone})</span>
                      )}
                    </div>
                    <div className="text-gray-700">
                      {[
                        order.shipping_address.address,
                        order.shipping_address.cityName || order.shipping_address.city,
                        order.shipping_address.stateName || order.shipping_address.state,
                        order.shipping_address.countryName || order.shipping_address.country,
                        order.shipping_address.zipCode
                      ].filter(Boolean).join(', ')}
                    </div>
                    {order.shipping_address.courier && (
                      <div className="text-sm text-gray-500 mt-2">
                        <span className="font-semibold">Shipping Method:</span> {order.shipping_address.courierName || order.shipping_address.courier}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">No shipping address provided</p>
                )}
              </CardContent>
            </Card>

            {/* PCB Specifications Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-orange-600" />
                  <CardTitle>PCB Specifications</CardTitle>
                </div>
                {canEdit && (
                  <Dialog open={isEditingPcbSpec} onOpenChange={setIsEditingPcbSpec}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit PCB Specifications</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* Basic PCB parameters - simplified for user editing */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="layers">Layers</Label>
                            <Select 
                              value={String(editedPcbSpec.layers || 2)} 
                              onValueChange={(value) => setEditedPcbSpec({...editedPcbSpec, layers: Number(value)})}
                            >
                              <SelectTrigger>
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
                            />
                          </div>
                          <div>
                            <Label htmlFor="length">Length (cm)</Label>
                            <Input
                              id="length"
                              type="number"
                              step="0.1"
                              value={editedPcbSpec.singleDimensions?.length || ''}
                              onChange={(e) => setEditedPcbSpec({
                                ...editedPcbSpec, 
                                singleDimensions: {
                                  ...editedPcbSpec.singleDimensions,
                                  length: Number(e.target.value)
                                }
                              })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="width">Width (cm)</Label>
                            <Input
                              id="width"
                              type="number"
                              step="0.1"
                              value={editedPcbSpec.singleDimensions?.width || ''}
                              onChange={(e) => setEditedPcbSpec({
                                ...editedPcbSpec, 
                                singleDimensions: {
                                  ...editedPcbSpec.singleDimensions,
                                  width: Number(e.target.value)
                                }
                              })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="delivery">Delivery</Label>
                            <Select 
                              value={editedPcbSpec.delivery || 'standard'} 
                              onValueChange={(value) => setEditedPcbSpec({...editedPcbSpec, delivery: value as 'standard' | 'urgent'})}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="standard">Standard</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="thickness">Thickness (mm)</Label>
                            <Select 
                              value={String(editedPcbSpec.thickness || 1.6)} 
                              onValueChange={(value) => setEditedPcbSpec({...editedPcbSpec, thickness: Number(value)})}
                            >
                              <SelectTrigger>
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
                        
                        {/* Notes */}
                        <div>
                          <Label htmlFor="specialRequests">Special Requests</Label>
                          <Textarea
                            id="specialRequests"
                            value={editedPcbSpec.specialRequests || ''}
                            onChange={(e) => setEditedPcbSpec({...editedPcbSpec, specialRequests: e.target.value})}
                            rows={3}
                          />
                        </div>

                        <div className="flex justify-end gap-2">
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
              </CardHeader>
              <CardContent>
                {pcbFormData ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Material Type: </span>
                      <span className="font-medium">{getPcbFieldDisplay('pcbType', pcbFormData.pcbType)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Layers: </span>
                      <span className="font-medium">{getPcbFieldDisplay('layers', pcbFormData.layers)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Thickness: </span>
                      <span className="font-medium">{getPcbFieldDisplay('thickness', pcbFormData.thickness)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Dimensions: </span>
                      <span className="font-medium">{getPcbFieldDisplay('singleDimensions', pcbFormData.singleDimensions)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Quantity: </span>
                      <span className="font-medium">{getPcbFieldDisplay('singleCount', pcbFormData.singleCount)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Delivery: </span>
                      <span className="font-medium">{getPcbFieldDisplay('delivery', pcbFormData.delivery)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Surface Finish: </span>
                      <span className="font-medium">{getPcbFieldDisplay('surfaceFinish', pcbFormData.surfaceFinish)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Solder Mask: </span>
                      <span className="font-medium">{getPcbFieldDisplay('solderMask', pcbFormData.solderMask)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Silkscreen: </span>
                      <span className="font-medium">{getPcbFieldDisplay('silkscreen', pcbFormData.silkscreen)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Copper Weight: </span>
                      <span className="font-medium">{pcbFormData.outerCopperWeight} oz</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">PCB specifications parsing failed</p>
                )}
              </CardContent>
            </Card>

            {/* Order Calculation Details Card */}
            {order.cal_values && (
              <Card className="border-gray-200 bg-gray-50/30">
                <CardHeader className="flex flex-row items-center gap-3">
                  <Info className="h-5 w-5 text-gray-600" />
                  <CardTitle className="flex items-center gap-2">
                    Initial System Calculation
                    <Badge variant="outline" className="text-xs border-gray-400 text-gray-600">Reference Only</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Price breakdown */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">PCB Price</div>
                        <div className="text-lg font-semibold text-green-600">
                          ${order.cal_values.pcbPrice?.toFixed(2) || '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Unit Price</div>
                        <div className="text-lg font-semibold">
                          ${order.cal_values.unitPrice?.toFixed(2) || '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Total Area</div>
                        <div className="text-sm">
                          {order.cal_values.totalArea?.toFixed(4) || '-'} m²
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Single PCB Area</div>
                        <div className="text-sm">
                          {order.cal_values.singlePcbArea?.toFixed(4) || '-'} m²
                        </div>
                      </div>
                    </div>

                    {/* Lead time info */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Production Timeline</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Lead Time: </span>
                          <span className="font-medium">{order.cal_values.leadTimeDays || '-'} days</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Estimated Completion: </span>
                          <span className="font-medium">
                            {order.cal_values.estimatedFinishDate ? 
                              new Date(order.cal_values.estimatedFinishDate).toLocaleDateString('en-US') : '-'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* File Download Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  File Download
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.gerber_file_url ? (
                  <DownloadButton 
                    filePath={order.gerber_file_url} 
                    bucket="gerber"
                    className="w-full"
                  >
                    Download Gerber Files
                  </DownloadButton>
                ) : (
                  <p className="text-gray-500 text-sm">No files available</p>
                )}
              </CardContent>
            </Card>

            {/* Time Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Time Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">Created</div>
                  <div className="text-sm font-medium">
                    {order.created_at ? new Date(order.created_at).toLocaleString('en-US') : '-'}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500">Last Updated</div>
                  <div className="text-sm font-medium">
                    {order.updated_at ? new Date(order.updated_at).toLocaleString('en-US') : '-'}
                  </div>
                </div>
                
                {adminOrder?.due_date && (
                  <div>
                    <div className="text-sm text-gray-500">Expected Completion</div>
                    <div className="text-sm font-medium">
                      {new Date(adminOrder.due_date).toLocaleDateString('en-US')}
                    </div>
                  </div>
                )}
                
                {adminOrder?.delivery_date && (
                  <div>
                    <div className="text-sm text-gray-500">Expected Delivery</div>
                    <div className="text-sm font-medium">
                      {new Date(adminOrder.delivery_date).toLocaleDateString('en-US')}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-purple-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push('/quote2')}
                >
                  Create New Quote
                </Button>
                {canEdit && (
                  <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                    <strong>Note:</strong> You can edit this order until payment is made.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Admin Order Details Card */}
            {adminOrder && (
              <Card className="border-blue-200 bg-blue-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    Official Order Details
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    ✓ Final confirmed information - This data overrides initial quotes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status Information */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Status Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Admin Status:</span>
                        <Badge variant="outline" className="text-xs">
                          {adminOrder.status || 'Pending'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Payment Status:</span>
                        <Badge variant={adminOrder.payment_status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                          {adminOrder.payment_status || 'Unpaid'}
                        </Badge>
                      </div>
                      {adminOrder.refund_status && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Refund Status:</span>
                          <Badge variant="outline" className="text-xs">
                            {adminOrder.refund_status}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Final Pricing Details */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      Final Pricing Breakdown
                      <Badge variant="default" className="text-xs bg-green-600">Official</Badge>
                    </h4>
                    <div className="space-y-2 text-sm">
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
                      {adminOrder.surcharges && adminOrder.surcharges.length > 0 && (
                        <div>
                          <span className="text-gray-500">Surcharges:</span>
                          {adminOrder.surcharges.map((surcharge, index) => (
                            <div key={index} className="flex justify-between ml-4">
                              <span className="text-xs text-gray-400">{surcharge.name}:</span>
                              <span className="text-xs">
                                {adminOrder.currency === 'CNY' 
                                  ? `¥${surcharge.amount.toFixed(2)}` 
                                  : `$${surcharge.amount ? (surcharge.amount / (adminOrder.exchange_rate || 7.2)).toFixed(2) : '-'}`
                                }
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {adminOrder.admin_price && (
                        <div className="flex justify-between border-t pt-2 font-medium bg-green-50 p-2 rounded">
                          <span className="text-gray-900">Final Total:</span>
                          <span className="text-green-600 font-bold">
                            {adminOrder.currency === 'CNY' ? '¥' : '$'}{adminOrder.admin_price.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Official Production Timeline */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      Official Production Timeline
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
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Admin Notes</h4>
                      <div className="text-sm bg-blue-50 p-3 rounded border-l-3 border-blue-200 whitespace-pre-wrap">
                        {adminOrder.admin_note}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Order Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-green-600" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Order ID:</span>
                    <span className="font-mono">#{order.id.slice(-8)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Status:</span>
                    <Badge variant="outline" className="text-xs">
                      {statusInfo?.text || order.status}
                    </Badge>
                  </div>
                  {order.payment_intent_id && (
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-500">Payment ID:</span>
                      <span className="font-mono text-xs">{order.payment_intent_id.slice(-8)}</span>
                    </div>
                  )}
                  {pcbFormData && (
                    <>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-500">PCB Layers:</span>
                        <span>{pcbFormData.layers} Layer{(pcbFormData.layers || 0) > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-500">Quantity:</span>
                        <span>{pcbFormData.singleCount} pcs</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-500">Delivery:</span>
                        <span>{pcbFormData.delivery === 'standard' ? 'Standard' : 'Urgent'}</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}