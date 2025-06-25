"use client";

import { useRouter } from 'next/navigation';
import StripePaymentForm from '@/components/custom-ui/StripePaymentForm';
import { getOrderPaymentAmount, formatOrderPrice, type OrderWithAdminOrder, type AdminOrder } from '@/lib/utils/orderHelpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, MapPin, Shield } from 'lucide-react';

type Order = OrderWithAdminOrder;

export default function PaymentPageClient({ order, adminOrder, orderId }: { order: Order, adminOrder: AdminOrder, orderId: string}) {
  const router = useRouter();

  const handlePaymentSuccess = () => {
    router.push(`/profile/orders/${orderId}?payment_pending=true`);
  }

  const handlePaymentError = (errorMessage: string) => {
    // This could be replaced with a toast notification
    alert(`Payment failed: ${errorMessage}`);
  }
  
  const amount = getOrderPaymentAmount(order);
  const shippingAddress = order.shipping_address as { [key: string]: string } | null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button 
              variant="ghost" 
              onClick={() => router.back()} 
              className="text-gray-600 hover:text-gray-900 hover:bg-white/60 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Order
            </Button>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">Secure Checkout</h1>
              <p className="text-sm text-gray-600 mt-1">Complete your order securely</p>
            </div>
            <div className="w-[120px]"></div> {/* Spacer for centering */}
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Order Summary */}
            <div className="lg:col-span-1 space-y-6">
              {/* Total Amount Card */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900">Order Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {formatOrderPrice(order)}
                    </div>
                    <p className="text-sm text-gray-500">Final amount to pay</p>
                  </div>
                </CardContent>
              </Card>

                             {/* Order Summary */}
               <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                 <CardHeader className="pb-4">
                   <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                     <Package className="mr-2 h-5 w-5 text-blue-600" />
                     Order Summary
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-3">
                   <div className="flex justify-between items-center py-2 border-b border-gray-100">
                     <span className="text-sm font-medium text-gray-600">Order ID</span>
                     <div className="text-right">
                       <button
                         onClick={() => {
                           navigator.clipboard.writeText(order.id);
                           // 可以添加一个简单的提示
                         }}
                         className="text-sm text-gray-900 font-mono hover:text-blue-600 transition-colors cursor-pointer"
                         title="Click to copy full Order ID"
                       >
                         {order.id.slice(0, 8)}...
                       </button>
                       <p className="text-xs text-gray-500">Click to copy</p>
                     </div>
                   </div>
                   
                   <div className="flex justify-between items-center py-2 border-b border-gray-100">
                     <span className="text-sm font-medium text-gray-600">Status</span>
                     <div className="flex items-center gap-2">
                       <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                       <span className="text-sm text-green-600 font-medium">Ready for Payment</span>
                     </div>
                   </div>
                   
                   <div className="flex justify-between items-center py-2 border-b border-gray-100">
                     <span className="text-sm font-medium text-gray-600">Currency</span>
                     <span className="text-sm text-gray-900 font-semibold">{adminOrder.currency}</span>
                   </div>
                   
                   {order.created_at && (
                     <div className="flex justify-between items-center py-2 border-b border-gray-100">
                       <span className="text-sm font-medium text-gray-600">Order Date</span>
                       <span className="text-sm text-gray-900">
                         {new Date(order.created_at).toLocaleDateString('en-US', {
                           year: 'numeric',
                           month: 'short',
                           day: 'numeric'
                         })}
                       </span>
                     </div>
                   )}
                   
                   {adminOrder.delivery_date && (
                     <div className="flex justify-between items-center py-2 border-b border-gray-100">
                       <span className="text-sm font-medium text-gray-600">Expected Delivery</span>
                       <span className="text-sm text-blue-600 font-medium">
                         {new Date(adminOrder.delivery_date).toLocaleDateString('en-US', {
                           year: 'numeric',
                           month: 'short',
                           day: 'numeric'
                         })}
                       </span>
                     </div>
                   )}
                   

                 </CardContent>
               </Card>

                             {/* Shipping Address */}
               {shippingAddress && (
                 <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                   <CardHeader className="pb-4">
                     <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                       <MapPin className="mr-2 h-5 w-5 text-blue-600" />
                       Shipping Address
                     </CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-3">
                     {/* Contact Information */}
                     <div className="pb-3 border-b border-gray-100">
                       <div className="flex items-center justify-between">
                         <div>
                           <p className="font-semibold text-gray-900">
                             {shippingAddress.contactName || shippingAddress.name || 'Contact Name'}
                           </p>
                           {shippingAddress.phone && (
                             <p className="text-sm text-blue-600">📞 {shippingAddress.phone}</p>
                           )}
                         </div>
                         {shippingAddress.isDefault && (
                           <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                             Default
                           </span>
                         )}
                       </div>
                     </div>

                     {/* Address Details */}
                     <div className="space-y-2">
                       <div>
                         <p className="text-xs text-gray-500 uppercase font-medium">Street Address</p>
                         <p className="text-gray-800 font-medium">
                           {shippingAddress.address || shippingAddress.line1}
                         </p>
                         {shippingAddress.line2 && (
                           <p className="text-gray-600">{shippingAddress.line2}</p>
                         )}
                       </div>

                       <div className="grid grid-cols-2 gap-3">
                         <div>
                           <p className="text-xs text-gray-500 uppercase font-medium">City</p>
                           <p className="text-gray-800">
                             {shippingAddress.cityName || shippingAddress.city}
                           </p>
                         </div>
                         <div>
                           <p className="text-xs text-gray-500 uppercase font-medium">Postal Code</p>
                           <p className="text-gray-800">
                             {shippingAddress.zipCode || shippingAddress.postal_code}
                           </p>
                         </div>
                       </div>

                       <div className="grid grid-cols-2 gap-3">
                         <div>
                           <p className="text-xs text-gray-500 uppercase font-medium">State/Province</p>
                           <p className="text-gray-800">
                             {shippingAddress.stateName || shippingAddress.state}
                           </p>
                         </div>
                         <div>
                           <p className="text-xs text-gray-500 uppercase font-medium">Country</p>
                           <p className="text-gray-800 font-medium">
                             {shippingAddress.countryName || shippingAddress.country}
                           </p>
                         </div>
                       </div>

                       {/* Shipping Method */}
                       {(shippingAddress.courier || shippingAddress.courierName) && (
                         <div className="pt-2 border-t border-gray-100">
                           <p className="text-xs text-gray-500 uppercase font-medium">Shipping Method</p>
                           <div className="flex items-center gap-2 mt-1">
                             <span className="text-lg">🚚</span>
                             <p className="text-gray-800 font-medium">
                               {shippingAddress.courierName || shippingAddress.courier}
                             </p>
                           </div>
                         </div>
                       )}
                     </div>
                   </CardContent>
                 </Card>
               )}

               {/* Security Note */}
               <Card className="shadow-lg border-0 bg-green-50/80 backdrop-blur-sm border-green-200">
                 <CardContent className="pt-6">
                   <div className="flex items-center space-x-3">
                     <Shield className="h-6 w-6 text-green-600 flex-shrink-0" />
                     <div>
                       <p className="text-sm font-medium text-green-800">Secure Payment</p>
                       <p className="text-xs text-green-600 mt-1">
                         Your payment information is encrypted and secure
                       </p>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             </div>

            {/* Right Column - Payment Form */}
            <div className="lg:col-span-2">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border-0 overflow-hidden">
                <StripePaymentForm
                  orderId={orderId}
                  amount={amount}
                  currency={adminOrder.currency.toLowerCase()}
                  displayCurrency={adminOrder.currency.toLowerCase()}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 