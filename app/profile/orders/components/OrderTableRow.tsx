import React from 'react';
import Link from 'next/link';
import { Eye, CreditCard, Calendar, Package, DollarSign, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  formatDateShort, 
  formatTimeShort, 
  getDisplayStatus, 
  getStatusInfo, 
  getOrderSummary, 
  formatOrderPrice, 
  shouldShowPaymentButton 
} from '../utils/orderHelpers';
import type { OrderListItem } from '../types/orderTypes';

interface OrderTableRowProps {
  order: OrderListItem;
  viewMode?: 'table' | 'card';
}

export default function OrderTableRow({ order, viewMode = 'table' }: OrderTableRowProps) {
  const displayStatus = getDisplayStatus(order);
  const statusInfo = getStatusInfo(displayStatus);
  const summary = getOrderSummary(order);
  const priceInfo = formatOrderPrice(order);
  const showPaymentButton = shouldShowPaymentButton(order);

  // 表格视图
  if (viewMode === 'table') {
    return (
      <tr className="hover:bg-gray-50 transition-colors">
        {/* Order ID */}
        <td className="py-4 px-4">
          <Link href={`/profile/orders/${order.id}`}>
            <div className="font-mono text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors">
              #{order.id.slice(0, 8)}
            </div>
          </Link>
        </td>

        {/* Date */}
        <td className="py-4 px-4">
          <div className="text-sm">
            <div className="font-medium">{formatDateShort(order.created_at)}</div>
            <div className="text-gray-500 text-xs">{formatTimeShort(order.created_at)}</div>
          </div>
        </td>

        {/* Status */}
        <td className="py-4 px-4">
          <Badge 
            className={`${statusInfo.style} text-xs font-medium px-2 py-1`}
            title={statusInfo.description}
          >
            {statusInfo.text}
          </Badge>
        </td>

        {/* Product Specifications */}
        <td className="py-4 px-4">
          {(() => {
            const pcbSpec = order.pcb_spec as Record<string, unknown> | null;
            const productType = pcbSpec?.productType || 
              (pcbSpec?.stencilMaterial ? 'stencil' : 'pcb');
            
            if (productType === 'stencil') {
              return (
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-xs text-blue-600 font-medium">🔧 STENCIL</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <span><strong>Material:</strong> {pcbSpec?.stencilMaterial || '-'}</span>
                    <span><strong>Qty:</strong> {summary.quantity}</span>
                    <span><strong>Size:</strong> {summary.size}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
                    <span><strong>Thickness:</strong> {pcbSpec?.stencilThickness || '-'}mm</span>
                    <span><strong>Process:</strong> {pcbSpec?.stencilProcess || '-'}</span>
                    <span><strong>Frame:</strong> {pcbSpec?.frameType || 'None'}</span>
                  </div>
                </div>
              );
            } else {
              return (
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-xs text-green-600 font-medium">📱 PCB</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <span><strong>Layers:</strong> {summary.layers}</span>
                    <span><strong>Qty:</strong> {summary.quantity}</span>
                    <span><strong>Size:</strong> {summary.size}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
                    <span><strong>Delivery:</strong> {summary.delivery}</span>
                    <span><strong>Thickness:</strong> {summary.thickness}</span>
                    <span><strong>Finish:</strong> {summary.surfaceFinish}</span>
                  </div>
                </div>
              );
            }
          })()}
        </td>

        {/* Price */}
        <td className="py-4 px-4">
          <div className="text-sm">
            <div className={`font-medium ${priceInfo.isPrimary ? 'text-green-600' : 'text-gray-600'}`}>
              {priceInfo.price}
            </div>
            {priceInfo.label && (
              <div className="text-xs text-gray-500">{priceInfo.label}</div>
            )}
          </div>
        </td>

        {/* Lead Time */}
        <td className="py-4 px-4">
          <div className="text-sm">
            {order.cal_values?.leadTimeDays ? (
              <div className="font-medium">
                {order.cal_values.leadTimeDays} days
              </div>
            ) : (
              <div className="text-gray-500">-</div>
            )}
          </div>
        </td>

        {/* Actions */}
        <td className="py-4 px-4">
          <div className="flex gap-2">
            <Link href={`/profile/orders/${order.id}`}>
              <Button variant="outline" size="sm" className="h-8 px-3">
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
            </Link>
            
            {showPaymentButton && (
              <Link href={`/payment/${order.id}`}>
                <Button size="sm" className="h-8 px-3 bg-green-600 hover:bg-green-700">
                  <CreditCard className="w-3 h-3 mr-1" />
                  Pay
                </Button>
              </Link>
            )}
          </div>
        </td>
      </tr>
    );
  }

  // 卡片视图（移动端）
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* 头部信息 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link href={`/profile/orders/${order.id}`}>
                <span className="font-mono text-sm text-blue-600 font-medium hover:text-blue-800 hover:underline cursor-pointer transition-colors">
                  #{order.id.slice(0, 8)}
                </span>
              </Link>
              <Badge 
                className={`${statusInfo.style} text-xs font-medium px-2 py-1`}
                title={statusInfo.description}
              >
                {statusInfo.text}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>{formatDateShort(order.created_at)} {formatTimeShort(order.created_at)}</span>
            </div>
          </div>
          
          {/* 价格显示 */}
          <div className="text-right">
            <div className={`font-bold text-lg ${priceInfo.isPrimary ? 'text-green-600' : 'text-gray-600'}`}>
              {priceInfo.price}
            </div>
            {priceInfo.label && (
              <div className="text-xs text-gray-500">{priceInfo.label}</div>
            )}
          </div>
        </div>

        {/* Product 规格信息 */}
        <div className="mb-4">
          {(() => {
            const pcbSpec = order.pcb_spec as Record<string, unknown> | null;
            const productType = pcbSpec?.productType || 
              (pcbSpec?.stencilMaterial ? 'stencil' : 'pcb');
            
            if (productType === 'stencil') {
              return (
                <>
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-blue-600">🔧</span>
                    <span className="text-sm font-medium text-gray-700">Stencil Specifications</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Material:</span>
                      <span className="font-medium">{pcbSpec?.stencilMaterial || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Quantity:</span>
                      <span className="font-medium">{summary.quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Size:</span>
                      <span className="font-medium">{summary.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Thickness:</span>
                      <span className="font-medium">{pcbSpec?.stencilThickness || '-'}mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Process:</span>
                      <span className="font-medium">{pcbSpec?.stencilProcess || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Frame:</span>
                      <span className="font-medium">{pcbSpec?.frameType || 'None'}</span>
                    </div>
                  </div>
                </>
              );
            } else {
              return (
                <>
                  <div className="flex items-center gap-1 mb-2">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">PCB Specifications</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Layers:</span>
                      <span className="font-medium">{summary.layers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Quantity:</span>
                      <span className="font-medium">{summary.quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Size:</span>
                      <span className="font-medium">{summary.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Delivery:</span>
                      <span className="font-medium">{summary.delivery}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Thickness:</span>
                      <span className="font-medium">{summary.thickness}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Finish:</span>
                      <span className="font-medium">{summary.surfaceFinish}</span>
                    </div>
                  </div>
                </>
              );
            }
          })()}
        </div>

        {/* 交期信息 */}
        {order.cal_values?.leadTimeDays && (
          <div className="flex items-center gap-1 mb-4">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              Lead Time: <span className="font-medium">{order.cal_values.leadTimeDays} days</span>
            </span>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Link href={`/profile/orders/${order.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </Link>
          
          {showPaymentButton && (
            <Link href={`/payment/${order.id}`} className="flex-1">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <CreditCard className="w-4 h-4 mr-2" />
                Pay Now
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 