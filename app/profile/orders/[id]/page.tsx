"use client";
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Pencil, Package, Clock, DollarSign, MapPin, FileText, AlertCircle, 
  ArrowLeft, CheckCircle, Truck, AlertTriangle, CreditCard
} from 'lucide-react';
import DownloadButton from '@/app/components/custom-ui/DownloadButton';
import OrderStepBar from '@/components/ui/OrderStepBar';
import { supabase } from '@/lib/supabaseClient';
import { useUserStore } from '@/lib/userStore';
import { quoteSchema, QuoteFormData } from '@/app/quote2/schema/quoteSchema';
import { formatOrderPrice, getOrderCurrencySymbol } from '@/lib/utils/orderHelpers';

// Order interface matching pcb_quotes table
interface Order {
  id: string;
  user_id: string | null;
  email: string;
  phone: string | null;
  shipping_address: any; // JSONB
  pcb_spec: any; // JSONB - PCB specifications
  gerber_file_url: string | null;
  status: string | null;
  payment_status?: string | null;
  created_at: string | null;
  updated_at: string | null;
  user_name: string | null;
  // Related admin order information (one-to-one relationship)
  admin_orders?: [{
    id: string;
    status: string;
    pcb_price: number | null;
    admin_price: number | null;
    cny_price: number | null;
    currency: string;
    exchange_rate: number;
    due_date: string | null;
    delivery_date: string | null;
    admin_note: string | null;
    payment_status?: string | null;
    order_status?: string | null;
    [key: string]: any;
  }];
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
    style: "bg-purple-100 text-purple-800 border-purple-200", 
    description: "Review completed, awaiting quote",
    stepKey: "review"
  },
  'quoted': { 
    text: "Quoted", 
    style: "bg-green-100 text-green-800 border-green-200", 
    description: "Quote provided, awaiting confirmation",
    stepKey: "quote"
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
  { label: "Quote", key: "quote" },
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
  const [order, setOrder] = useState<Order | null>(null);
  const [pcbFormData, setPcbFormData] = useState<QuoteFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = useUserStore(state => state.user);

  // Edit states
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isEditingPcbSpec, setIsEditingPcbSpec] = useState(false);
  const [editedAddress, setEditedAddress] = useState<any>({});
  const [editedPhone, setEditedPhone] = useState('');
  const [editedPcbSpec, setEditedPcbSpec] = useState<any>({});

  // Fetch order details
  const fetchOrder = async () => {
    if (!orderId || !user?.id) return;
    
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
      
      setOrder(orderData as Order);

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
            setEditedPcbSpec(orderData.pcb_spec);
          }
        } catch (err) {
          console.warn('Failed to parse PCB spec:', err);
          setPcbFormData(orderData.pcb_spec as QuoteFormData);
          setEditedPcbSpec(orderData.pcb_spec);
        }
      }

      // Initialize edit states
      setEditedAddress(orderData.shipping_address || {});
      setEditedPhone(orderData.phone || '');
      
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      toast.error(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId, user?.id]);

  // Check if editing is allowed (before payment/production)
  const canEdit = order && ['created', 'pending', 'reviewed', 'quoted'].includes(order.status || '');

  // Check if cancellation is allowed
  const canCancel = order && ['created', 'pending', 'reviewed', 'quoted'].includes(order.status || '');

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

      toast.success('Order updated successfully');
      await fetchOrder(); // Refresh data
    } catch (err) {
      console.error('Error updating order:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update order');
    }
  };

  // Save address changes
  const handleSaveAddress = async () => {
    await updateOrder({ shipping_address: editedAddress });
    setIsEditingAddress(false);
    
    // If order status is 'reviewed' or later, set back to 'pending' for re-review
    if (order && ['reviewed', 'quoted'].includes(order.status || '')) {
      await updateOrder({ status: 'pending' });
      toast.info('Order status changed to "Under Review" due to address modification');
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
    
    // If order status is 'reviewed' or later, set back to 'pending' for re-review
    if (order && ['reviewed', 'quoted'].includes(order.status || '')) {
      await updateOrder({ status: 'pending' });
      toast.info('Order status changed to "Under Review" due to PCB specification modification');
    }
  };

  // Cancel order
  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }

    try {
      await updateOrder({ status: 'cancelled' });
      toast.success('Order cancelled successfully');
      router.push('/profile/orders');
    } catch (err) {
      console.error('Error cancelling order:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to cancel order');
    }
  };

  // Get PCB field display value
  const getPcbFieldDisplay = (key: string, value: any): string => {
    if (!value) return '-';
    
    const displayMap: Record<string, (val: any) => string> = {
      pcbType: (v) => v === 'FR-4' ? 'FR-4 Standard' : String(v),
      layers: (v) => `${v} Layers`,
      thickness: (v) => `${v}mm`,
      singleDimensions: (v) => v?.length && v?.width ? `${v.length} × ${v.width} cm` : '-',
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
        return map[v] || String(v);
      },
      solderMask: (v) => {
        const map: Record<string, string> = {
          'Green': 'Green',
          'Blue': 'Blue', 
          'Red': 'Red',
          'Black': 'Black',
          'White': 'White'
        };
        return map[v] || String(v);
      },
      silkscreen: (v) => {
        const map: Record<string, string> = {
          'White': 'White',
          'Black': 'Black'
        };
        return map[v] || String(v);
      }
    };

    return displayMap[key] ? displayMap[key](value) : String(value);
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
  const adminOrder = order.admin_orders?.[0]; // Get admin order info

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
            currentStatus={statusInfo?.stepKey || 'created'} 
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
                  <span className="text-gray-600">{statusInfo?.description}</span>
                </div>
                
                {/* Admin Order Status */}
                {adminOrder && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Admin Processing Status</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Processing Status: </span>
                        <span className="font-medium">{adminOrder.status || '-'}</span>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Quote Price</div>
                    <div className="text-xl font-bold text-green-600">
                      {formatOrderPrice({ admin_orders: [adminOrder] } as any)}
                    </div>
                  </div>
                  
                  {adminOrder && (
                    <>
                      <div>
                        <div className="text-sm text-gray-500">PCB Price</div>
                        <div className="text-lg font-semibold">
                          {adminOrder.currency === 'CNY' ? '¥' : '$'}{adminOrder.pcb_price?.toFixed(2) || '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Total Price</div>
                        <div className="text-lg font-semibold">
                          {adminOrder.currency === 'CNY' ? '¥' : '$'}{adminOrder.cny_price?.toFixed(2) || adminOrder.admin_price?.toFixed(2) || '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Exchange Rate</div>
                        <div className="text-sm">
                          1 USD = {adminOrder.exchange_rate || 7.2} CNY
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Payment Button */}
                {adminOrder?.admin_price && adminOrder?.payment_status !== 'paid' && (
                  <div className="mt-4 pt-4 border-t">
                    <Button 
                      onClick={() => router.push(`/payment/${order.id}`)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      size="lg"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay Now - {getOrderCurrencySymbol({ admin_orders: [adminOrder] } as any)}{adminOrder.admin_price.toFixed(2)}
                    </Button>
                  </div>
                )}
                
                {adminOrder?.payment_status === 'paid' && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Payment Completed</span>
                    </div>
                  </div>
                )}

                {/* Order Status Info */}
                {adminOrder && !adminOrder.admin_price && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-yellow-600">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-medium">Waiting for Admin Review</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Your order is being reviewed by our team. You will receive a notification when pricing is available.
                    </p>
                  </div>
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
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Edit Shipping Address</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="contactName">Contact Name</Label>
                          <Input
                            id="contactName"
                            value={editedAddress.contactName || ''}
                            onChange={(e) => setEditedAddress({...editedAddress, contactName: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={editedAddress.phone || ''}
                            onChange={(e) => setEditedAddress({...editedAddress, phone: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="address">Address</Label>
                          <Textarea
                            id="address"
                            value={editedAddress.address || ''}
                            onChange={(e) => setEditedAddress({...editedAddress, address: e.target.value})}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              value={editedAddress.city || ''}
                              onChange={(e) => setEditedAddress({...editedAddress, city: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="zipCode">Postal Code</Label>
                            <Input
                              id="zipCode"
                              value={editedAddress.zipCode || ''}
                              onChange={(e) => setEditedAddress({...editedAddress, zipCode: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsEditingAddress(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleSaveAddress}>
                            Save
                          </Button>
                        </div>
                      </div>
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
                        order.shipping_address.city,
                        order.shipping_address.state,
                        order.shipping_address.country,
                        order.shipping_address.zipCode
                      ].filter(Boolean).join(', ')}
                    </div>
                    {order.shipping_address.courier && (
                      <div className="text-sm text-gray-500">
                        Shipping Method: {order.shipping_address.courier}
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
                              onValueChange={(value) => setEditedPcbSpec({...editedPcbSpec, delivery: value})}
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
          </div>
        </div>
      </div>
    </div>
  );
}