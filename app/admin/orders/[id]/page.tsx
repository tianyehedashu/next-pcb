"use client";

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Order } from '@/types/order'; // Adjust import path
import { createForm } from '@formily/core';
import { FormProvider, FormConsumer, Field } from '@formily/react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useParams } from 'next/navigation';
import { FormItem } from '@/components/ui/form';
import { quoteSchema, QuoteFormData } from '@/app/quote2/schema/quoteSchema';

export default function AdminOrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [pcbFormData, setPcbFormData] = useState<QuoteFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form] = useState(() => createForm());

  // Fetch order data
  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        // TODO: Add actual authentication token to headers
        const response = await fetch(`/api/admin/orders?id=${orderId}`, {
          headers: {
            // 'Authorization': 'Bearer YOUR_ADMIN_TOKEN', // Replace with real token
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch order');
        }

        const data: Order = await response.json();
        setOrder(data);
        // 先将pcb_spec_data转为QuoteFormData
        if (data.pcb_spec_data && typeof data.pcb_spec_data === 'object') {
          const result = quoteSchema.safeParse(data.pcb_spec_data);
          if (result.success) {
            setPcbFormData(result.data);
          } else {
            setPcbFormData(null);
            console.error('PCB参数校验失败', result.error);
          }
        } else {
          setPcbFormData(null);
        }
        // Set form initial values after fetching data
        form.setValues({ ...data });

      } catch (err: unknown) {
        console.error('Error fetching order:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

  }, [orderId, form]); // Add form to dependency array

  // Handle form submission (updating order)
  const handleSubmit = async () => {
    if (!form || !orderId) return;

    try {
      // Validate form and get values
      await form.submit();
      const values = form.values; // Values will be validated by the schema

      console.log('Submitting updated order data:', values);

      // TODO: Add actual authentication token to headers
      const response = await fetch(`/api/admin/orders?id=${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': 'Bearer YOUR_ADMIN_TOKEN', // Replace with real token
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update order');
      }

      toast.success('Order updated successfully!');
      // Optionally refetch order data or update local state
      // fetchOrder(); // Could refetch to show latest data including timestamps
      // setOrder({...order, ...values}); // Or update state locally

    } catch (err: unknown) {
      console.error('Error submitting order update:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      toast.error(errorMessage);
    }
  };

  // PCB参数字段中文映射
  const pcbFieldLabelMap: Record<string, string> = {
    pcbType: '板材类型',
    layers: '层数',
    thickness: '板厚',
    hdi: 'HDI类型',
    tg: 'TG值',
    shipmentType: '出货方式',
    singleDimensions: '单片尺寸',
    singleCount: '单片数量',
    panelDimensions: '拼板尺寸',
    panelSet: '拼板数量',
    differentDesignsCount: '不同设计数',
    border: '拼板边框',
    useShengyiMaterial: '是否生益板材',
    pcbNote: 'PCB备注',
    delivery: '交付类型',
    outerCopperWeight: '外层铜厚',
    innerCopperWeight: '内层铜厚',
    minTrace: '最小线宽/间距',
    minHole: '最小孔径',
    solderMask: '阻焊颜色',
    silkscreen: '丝印颜色',
    surfaceFinish: '表面处理',
    surfaceFinishEnigType: 'ENIG厚度',
    impedance: '阻抗控制',
    goldFingers: '金手指',
    goldFingersBevel: '斜边金手指',
    edgePlating: '边缘电镀',
    halfHole: '半孔数量',
    edgeCover: '边缘覆盖',
    maskCover: '过孔工艺',
    bga: 'BGA',
    holeCu25um: '孔铜25um',
    blueMask: '蓝色阻焊',
    holeCount: '孔数',
    testMethod: '电测方式',
    productReport: '产品报告',
    workingGerber: '工作Gerber',
    ulMark: 'UL标记',
    crossOuts: '可接受不良板',
    ipcClass: 'IPC等级',
    ifDataConflicts: '数据冲突处理',
    specialRequests: '特殊要求',
    gerberUrl: 'Gerber文件链接',
    shippingCostEstimation: '运费预估',
    shippingAddress: '收货地址',
    customs: '报关信息',
    customsNote: '报关备注',
    userNote: '用户备注',
  };

  // PCB参数值美化映射
  const pcbFieldValueMap: Record<string, (value: unknown) => string> = {
    pcbType: v => v === 'FR-4' ? 'FR-4（玻纤板）' : String(v),
    hdi: v => ({ None: '无', '1step': '一阶', '2step': '二阶', '3step': '三阶' }[String(v)] || String(v)),
    tg: v => ({ TG135: 'TG135', TG150: 'TG150', TG170: 'TG170' }[String(v)] || String(v)),
    shipmentType: v => ({ single: '单片', panel: '拼板' }[String(v)] || String(v)),
    border: v => ({ None: '无', '5': '5mm', '10': '10mm' }[String(v)] || String(v)),
    outerCopperWeight: v => v ? `${v} oz` : '',
    innerCopperWeight: v => v ? `${v} oz` : '',
    minTrace: v => v ? `${v} mil` : '',
    minHole: v => v ? `${v} mm` : '',
    solderMask: v => ({ 'Green': '绿色', 'Matt Green': '哑光绿', 'Blue': '蓝色', 'Red': '红色', 'Black': '黑色', 'Matt Black': '哑光黑', 'White': '白色', 'Yellow': '黄色' }[String(v)] || String(v)),
    silkscreen: v => ({ 'White': '白色', 'Black': '黑色', 'Yellow': '黄色' }[String(v)] || String(v)),
    surfaceFinish: v => ({ 'HASL': '有铅喷锡', 'Leadfree HASL': '无铅喷锡', 'ENIG': '沉金', 'OSP': 'OSP', 'Immersion Silver': '沉银', 'Immersion Tin': '沉锡' }[String(v)] || String(v)),
    surfaceFinishEnigType: v => ({ 'ENIG 1U': '1微英寸', 'ENIG 2U': '2微英寸', 'ENIG 3U': '3微英寸' }[String(v)] || String(v)),
    maskCover: v => ({ 'Tented Vias': '盖油', 'Opened Vias': '开窗', 'Solder Mask Plug (IV-B)': '塞孔', ' Non-Conductive Fill & Cap (VII)': '非导电填充+盖油' }[String(v)] || String(v)),
    edgeCover: v => ({ None: '无', Left: '左侧', Right: '右侧', Both: '两侧' }[String(v)] || String(v)),
    testMethod: v => ({ 'None': '免测', '100% FPT for Batches': '飞针测试', 'Test Fixture': '测试架' }[String(v)] || String(v)),
    productReport: v => Array.isArray(v) ? v.map(i => ({ 'None': '无', 'Production Report': '生产报告', 'Impedance Report': '阻抗报告' }[String(i)] || String(i))).join('，') : String(v),
    workingGerber: v => ({ 'Not Required': '不需要', 'Require Approval': '需要审批' }[String(v)] || String(v)),
    crossOuts: v => ({ 'Not Accept': '不接受', 'Accept': '接受' }[String(v)] || String(v)),
    ipcClass: v => ({ 'IPC Level 2 Standard': 'IPC 2级', 'IPC Level 3 Standard': 'IPC 3级' }[String(v)] || String(v)),
    ifDataConflicts: v => ({ 'Follow Order Parameters': '以订单为准', 'Follow Files': '以文件为准', 'Ask for Confirmation': '需确认' }[String(v)] || String(v)),
    delivery: v => ({ standard: '标准', urgent: '加急' }[String(v)] || String(v)),
    useShengyiMaterial: v => v ? '是' : '否',
    goldFingers: v => v ? '是' : '否',
    goldFingersBevel: v => v ? '是' : '否',
    edgePlating: v => v ? '是' : '否',
    bga: v => v ? '是' : '否',
    holeCu25um: v => v ? '是' : '否',
    blueMask: v => v ? '是' : '否',
    ulMark: v => v ? '是' : '否',
    singleDimensions: v => v && typeof v === 'object' && 'length' in v && 'width' in v ? `${(v as Record<string, unknown>).length} x ${(v as Record<string, unknown>).width} cm` : String(v),
    panelDimensions: v => v && typeof v === 'object' && 'row' in v && 'column' in v ? `${(v as Record<string, unknown>).row}行 x ${(v as Record<string, unknown>).column}列` : String(v),
  };

  // PCB参数字段分组及条件显示配置
  // 类型声明
  interface PCBFieldConfig {
    key: keyof typeof pcbFieldLabelMap;
    shouldShow: (data: Record<string, unknown>) => boolean;
  }
  interface PCBFieldGroup {
    title: string;
    fields: PCBFieldConfig[];
  }

  const pcbFieldGroups: PCBFieldGroup[] = [
    {
      title: 'Basic Info',
      fields: [
        { key: 'pcbType', shouldShow: () => true },
        { key: 'layers', shouldShow: () => true },
        { key: 'hdi', shouldShow: data => data.pcbType === 'HDI' },
        { key: 'tg', shouldShow: () => true },
        { key: 'useShengyiMaterial', shouldShow: () => true },
      ],
    },
    {
      title: 'Dimensions & Panelization',
      fields: [
        { key: 'shipmentType', shouldShow: () => true },
        { key: 'singleDimensions', shouldShow: () => true },
        { key: 'singleCount', shouldShow: () => true },
        { key: 'panelDimensions', shouldShow: data => data.shipmentType === 'panel' },
        { key: 'panelSet', shouldShow: data => data.shipmentType === 'panel' },
        { key: 'differentDesignsCount', shouldShow: data => data.shipmentType === 'panel' },
        { key: 'border', shouldShow: data => data.shipmentType === 'panel' },
      ],
    },
    {
      title: 'Material & Process',
      fields: [
        { key: 'thickness', shouldShow: () => true },
        { key: 'outerCopperWeight', shouldShow: () => true },
        { key: 'innerCopperWeight', shouldShow: data => !!data.innerCopperWeight },
        { key: 'minTrace', shouldShow: () => true },
        { key: 'minHole', shouldShow: () => true },
        { key: 'solderMask', shouldShow: () => true },
        { key: 'silkscreen', shouldShow: () => true },
        { key: 'surfaceFinish', shouldShow: () => true },
        { key: 'surfaceFinishEnigType', shouldShow: data => data.surfaceFinish === 'ENIG' },
        { key: 'impedance', shouldShow: () => true },
      ],
    },
    {
      title: 'Special Features',
      fields: [
        { key: 'goldFingers', shouldShow: () => true },
        { key: 'goldFingersBevel', shouldShow: data => !!data.goldFingers },
        { key: 'edgePlating', shouldShow: () => true },
        { key: 'halfHole', shouldShow: () => true },
        { key: 'edgeCover', shouldShow: () => true },
        { key: 'maskCover', shouldShow: () => true },
        { key: 'bga', shouldShow: () => true },
        { key: 'holeCu25um', shouldShow: () => true },
        { key: 'blueMask', shouldShow: () => true },
      ],
    },
    {
      title: 'Testing & Report',
      fields: [
        { key: 'holeCount', shouldShow: () => true },
        { key: 'testMethod', shouldShow: () => true },
        { key: 'productReport', shouldShow: () => true },
        { key: 'workingGerber', shouldShow: () => true },
        { key: 'ulMark', shouldShow: () => true },
        { key: 'crossOuts', shouldShow: () => true },
        { key: 'ipcClass', shouldShow: () => true },
        { key: 'ifDataConflicts', shouldShow: () => true },
      ],
    },
    {
      title: 'Logistics & Notes',
      fields: [
        { key: 'delivery', shouldShow: () => true },
        { key: 'specialRequests', shouldShow: () => true },
        { key: 'pcbNote', shouldShow: () => true },
        { key: 'gerberUrl', shouldShow: () => true },
        { key: 'shippingCostEstimation', shouldShow: () => true },
        { key: 'shippingAddress', shouldShow: () => true },
        { key: 'customs', shouldShow: () => true },
        { key: 'customsNote', shouldShow: () => true },
        { key: 'userNote', shouldShow: () => true },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="w-full p-2 md:p-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">Order Details</h2>
        <div className="bg-white rounded-xl shadow-lg p-6 text-gray-500 text-center">Loading order details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-2 md:p-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">Order Details</h2>
        <div className="bg-white rounded-xl shadow-lg p-6 text-red-600 text-center">Error loading order: {error}</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="w-full p-2 md:p-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">Order Details</h2>
        <div className="bg-white rounded-xl shadow-lg p-6 text-gray-500 text-center">Order not found.</div>
      </div>
    );
  }

  return (
    <FormProvider form={form}>
      <div className="w-full p-2 md:p-4">
        <div className="flex flex-col md:flex-row gap-8">
          {/* 信息区 */}
          <div className="flex-1 space-y-6">
            <Card className="rounded-xl shadow-lg">
              <CardHeader>
                <CardTitle>Order Information</CardTitle>
                <CardDescription>Details about the order and customer.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">订单编号</div>
                  <div>{order.id}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">用户邮箱</div>
                  <div>{order.user_email} {order.user_id ? '' : '(访客)'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">下单时间</div>
                  <div>{new Date(order.created_at).toLocaleString()}</div>
                </div>
                {/* PCB参数展示 */}
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">PCB参数</div>
                  {order.pcb_spec_data && typeof order.pcb_spec_data === 'object' ? (
                    <div className="space-y-4">
                      {pcbFieldGroups.map(group => (
                        <div key={group.title} className="mb-2">
                          <div className="font-semibold text-gray-700 mb-1">{group.title}</div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            {group.fields.map(field => {
                              if (!field.shouldShow(order.pcb_spec_data as Record<string, unknown>)) return null;
                              const value = (order.pcb_spec_data as Record<string, unknown>)[field.key];
                              if (value === undefined || value === null || value === '') return null;
                              return (
                                <React.Fragment key={field.key}>
                                  <div className="font-medium text-gray-600">{pcbFieldLabelMap[field.key] || field.key}</div>
                                  <div className="text-gray-900">
                                    {pcbFieldValueMap[field.key] ? pcbFieldValueMap[field.key](value) : String(value)}
                                  </div>
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400">无PCB参数</div>
                  )}
                </div>
                {/* Gerber文件下载 */}
                {order.gerber_file_url && (
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Gerber文件</div>
                    <a
                      href={order.gerber_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                      download
                    >
                      下载Gerber文件
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          {/* 表单区 */}
          <div className="w-full md:w-[400px]">
            <Card className="rounded-xl shadow-lg">
              <CardHeader>
                <CardTitle>Edit Order</CardTitle>
                <CardDescription>Update order status, price, and notes.</CardDescription>
              </CardHeader>
              <CardContent>
                <FormConsumer>
                  {() => (
                    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
                      <Field
                        name="status"
                        title="Status"
                        decorator={[FormItem]}
                        component={[Select, { placeholder: 'Select status' }]}
                        dataSource={[
                          { label: 'Pending', value: 'pending' },
                          { label: 'Processing', value: 'processing' },
                          { label: 'Completed', value: 'completed' },
                          { label: 'Cancelled', value: 'cancelled' },
                        ]}
                      />
                      <Field
                        name="price"
                        title="Price (USD)"
                        decorator={[FormItem]}
                        component={[Input, { type: 'number', placeholder: 'Enter price' }]}
                      />
                      <Field
                        name="admin_note"
                        title="Admin Note"
                        decorator={[FormItem]}
                        component={[Input, { type: 'textarea', placeholder: 'Add internal notes' }]}
                      />
                      <Button type="submit" className="mt-6 w-full">Save Changes</Button>
                    </form>
                  )}
                </FormConsumer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </FormProvider>
  );
} 