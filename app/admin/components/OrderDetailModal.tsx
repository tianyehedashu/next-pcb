"use client";

import React from 'react';
import { Order } from '../types/order';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function OrderDetailModal({ order, onClose }: { order: Order | null; onClose: () => void }) {
  if (!order) return null;

  // 获取管理订单信息
  const adminOrder = order.admin_orders;

  return (
    <Dialog open={!!order} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto rounded-2xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">Order Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
              <div className="text-sm space-y-1">
                <div><span className="font-medium">Order ID:</span> {order.id}</div>
                <div><span className="font-medium">User Email:</span> {order.email || '-'}</div>
                <div><span className="font-medium">Phone:</span> {order.phone || '-'}</div>
                <div><span className="font-medium">Type:</span> {order.type || 'Inquiry'}</div>
                <div><span className="font-medium">Status:</span> {order.status}</div>
                <div><span className="font-medium">Created:</span> {order.created_at}</div>
              </div>
            </div>
            
            {/* PCB 信息 */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-800">PCB Information</h3>
              <div className="text-sm space-y-1">
                <div><span className="font-medium">PCB Price:</span> {order.cal_values?.pcbPrice ? `$${order.cal_values.pcbPrice.toFixed(2)}` : '-'}</div>
                <div><span className="font-medium">Total Price:</span> {order.cal_values?.totalPrice ? `$${order.cal_values.totalPrice.toFixed(2)}` : '-'}</div>
                <div><span className="font-medium">Lead Time:</span> {order.cal_values?.leadTimeDays ? `${order.cal_values.leadTimeDays} days` : '-'}</div>
                <div><span className="font-medium">Quantity:</span> {order.cal_values?.totalCount || '-'}</div>
                <div><span className="font-medium">Unit Price:</span> {order.cal_values?.unitPrice ? `$${order.cal_values.unitPrice.toFixed(2)}` : '-'}</div>
              </div>
            </div>
          </div>

          {/* 管理订单信息 */}
          {adminOrder && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-800">Admin Order Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">Admin Status:</span> {adminOrder.status || '-'}</div>
                <div><span className="font-medium">Payment Status:</span> {adminOrder.payment_status || '-'}</div>
                <div><span className="font-medium">Admin Price:</span> {adminOrder.admin_price ? `${adminOrder.currency || 'USD'} ${adminOrder.admin_price.toFixed(2)}` : '-'}</div>
                <div><span className="font-medium">Production Days:</span> {adminOrder.production_days ? `${adminOrder.production_days} days` : '-'}</div>
                <div><span className="font-medium">Due Date:</span> {adminOrder.due_date || '-'}</div>
                <div><span className="font-medium">Delivery Date:</span> {adminOrder.delivery_date || '-'}</div>
                <div><span className="font-medium">PCB Price (CNY):</span> {adminOrder.pcb_price ? `¥${adminOrder.pcb_price.toFixed(2)}` : '-'}</div>
                <div><span className="font-medium">Exchange Rate:</span> {adminOrder.exchange_rate || '-'}</div>
                <div><span className="font-medium">Shipping Price:</span> {adminOrder.ship_price ? `¥${adminOrder.ship_price.toFixed(2)}` : '-'}</div>
                <div><span className="font-medium">Custom Duty:</span> {adminOrder.custom_duty ? `¥${adminOrder.custom_duty.toFixed(2)}` : '-'}</div>
                <div><span className="font-medium">Coupon:</span> {adminOrder.coupon ? `¥${adminOrder.coupon.toFixed(2)}` : '-'}</div>
                {adminOrder.refund_status && (
                  <div><span className="font-medium">Refund Status:</span> {adminOrder.refund_status}</div>
                )}
              </div>
              {adminOrder.admin_note && (
                <div className="mt-4">
                  <span className="font-medium">Admin Notes:</span>
                  <p className="mt-1 text-gray-600">{adminOrder.admin_note}</p>
                </div>
              )}
              {adminOrder.surcharges && adminOrder.surcharges.length > 0 && (
                <div className="mt-4">
                  <span className="font-medium">Surcharges:</span>
                  <ul className="mt-1 space-y-1">
                    {adminOrder.surcharges.map((surcharge, index) => (
                      <li key={index} className="text-gray-600">
                        {surcharge.name}: ¥{surcharge.amount.toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* PCB 规格信息 */}
          {order.pcb_spec && (
            <div className="space-y-2">
              {(() => {
                const spec = order.pcb_spec as Record<string, unknown>;
                const productType = spec?.productType || (spec?.borderType ? 'stencil' : 'pcb');
                
                if (productType === 'stencil') {
                  return (
                    <>
                      <h3 className="text-lg font-semibold text-gray-800">Stencil Specifications</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div><span className="font-medium">Border Type:</span> {spec?.borderType || '-'}</div>
                        <div><span className="font-medium">Stencil Type:</span> {spec?.stencilType || '-'}</div>
                        <div><span className="font-medium">Size:</span> {spec?.size ? `${spec.size}mm` : '-'}</div>
                        <div><span className="font-medium">Stencil Side:</span> {spec?.stencilSide || '-'}</div>
                        <div><span className="font-medium">Quantity:</span> {spec?.quantity || '-'}</div>
                        <div><span className="font-medium">Thickness:</span> {spec?.thickness ? `${spec.thickness}mm` : '-'}</div>
                        <div><span className="font-medium">Fiducials:</span> {spec?.existingFiducials || '-'}</div>
                        <div><span className="font-medium">Electropolishing:</span> {spec?.electropolishing || '-'}</div>
                        <div><span className="font-medium">Engineering Requirements:</span> {spec?.engineeringRequirements || '-'}</div>
                      </div>
                      {spec?.addPoNo && (
                        <div className="mt-2">
                          <span className="font-medium">PO Number:</span> {spec.addPoNo}
                        </div>
                      )}
                      {spec?.specialRequests && (
                        <div className="mt-2">
                          <span className="font-medium">Special Requests:</span>
                          <p className="mt-1 text-gray-600">{spec.specialRequests}</p>
                        </div>
                      )}
                    </>
                  );
                } else {
                  return (
                    <>
                      <h3 className="text-lg font-semibold text-gray-800">PCB Specifications</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div><span className="font-medium">Layers:</span> {spec?.layers || '-'}</div>
                        <div><span className="font-medium">PCB Type:</span> {spec?.pcbType || '-'}</div>
                        <div><span className="font-medium">Thickness:</span> {spec?.thickness ? `${spec.thickness}mm` : '-'}</div>
                        <div><span className="font-medium">Surface Finish:</span> {spec?.surfaceFinish || '-'}</div>
                        <div><span className="font-medium">Solder Mask:</span> {spec?.solderMask || '-'}</div>
                        <div><span className="font-medium">Silkscreen:</span> {spec?.silkscreen || '-'}</div>
                        <div><span className="font-medium">Min Trace:</span> {spec?.minTrace || '-'}</div>
                        <div><span className="font-medium">Min Hole:</span> {spec?.minHole || '-'}</div>
                        <div><span className="font-medium">Delivery:</span> {spec?.delivery || '-'}</div>
                      </div>
                      {spec?.singleDimensions && typeof spec.singleDimensions === 'object' && 
                        'length' in spec.singleDimensions && 'width' in spec.singleDimensions && (
                        <div className="mt-2">
                          <span className="font-medium">Dimensions:</span> {(spec.singleDimensions as any).length} × {(spec.singleDimensions as any).width} mm
                        </div>
                      )}
                      {spec?.pcbNote && (
                        <div className="mt-2">
                          <span className="font-medium">PCB Note:</span>
                          <p className="mt-1 text-gray-600">{spec.pcbNote}</p>
                        </div>
                      )}
                    </>
                  );
                }
              })()}
            </div>
          )}

          {/* 配送地址 */}
          {order.shipping_address && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-800">Shipping Address</h3>
              <div className="text-sm space-y-1">
                <div><span className="font-medium">Contact:</span> {order.shipping_address.contactName}</div>
                <div><span className="font-medium">Phone:</span> {order.shipping_address.phone}</div>
                <div><span className="font-medium">Address:</span> {order.shipping_address.address}</div>
                <div><span className="font-medium">City:</span> {order.shipping_address.cityName || order.shipping_address.city}</div>
                <div><span className="font-medium">State:</span> {order.shipping_address.stateName || order.shipping_address.state}</div>
                <div><span className="font-medium">Country:</span> {order.shipping_address.countryName || order.shipping_address.country}</div>
                <div><span className="font-medium">Zip Code:</span> {order.shipping_address.zipCode}</div>
                <div><span className="font-medium">Courier:</span> {order.shipping_address.courierName || order.shipping_address.courier}</div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 