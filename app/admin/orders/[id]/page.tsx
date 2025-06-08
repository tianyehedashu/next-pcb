"use client";

import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { createForm } from '@formily/core';
import { FormProvider } from '@formily/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useParams, useRouter } from 'next/navigation';
import { quoteSchema, QuoteFormData } from '@/app/quote2/schema/quoteSchema';
import { calcProductionCycle } from '@/lib/productCycleCalc-v3';
import { calcPcbPriceV3 } from '@/lib/pcb-calc-v3';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OrderStatus } from '@/types/form';
import {  AdminOrder, Order } from '@/app/admin/types/order';
import { PlusCircle } from 'lucide-react';
import { useState as useLocalState } from 'react';

interface PriceDetails {
  basePrice: number;
  processFee: number;
  materialFee: number;
  specialProcessFee: number;
  testFee: number;
  total: number;
}

interface LeadTimeDetails {
  baseCycleDays: number;
  processExtraDays: number;
  urgentExtraDays: number;
  cycleDays: number;
  reason: string[];
}

// 工具函数：兼容 admin_orders 为对象或数组
function getAdminOrders(admin_orders: unknown): AdminOrder[] {
  if (!admin_orders) return [];
  if (Array.isArray(admin_orders)) return admin_orders as AdminOrder[];
  return [admin_orders as AdminOrder];
}

// 币种对应默认汇率
const getDefaultExchangeRate = (currency: string) => {
  switch (currency) {
    case 'CNY': return 1;
    case 'USD': return 7.2;
    case 'EUR': return 7.8;
    case 'JPY': return 0.05;
    default: return '';
  }
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [pcbFormData, setPcbFormData] = useState<QuoteFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form] = useState(() => createForm());
  const [priceDetails, setPriceDetails] = useState<PriceDetails | null>(null);
  const [leadTimeDetails, setLeadTimeDetails] = useState<LeadTimeDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState<number[]>([]);
  const [recalcStatus, setRecalcStatus] = useState<boolean[]>([]);
  const [adminOrderEdits, setAdminOrderEdits] = useState<any[]>([]);
  const hasInitAdminOrderEdits = useRef(false);

  // 管理员订单本地编辑状态
  const adminOrders = getAdminOrders(order?.admin_orders);

  // 编辑项变更
  const updateEdit = (idx: number, key: string, value: any) => {
    setAdminOrderEdits(edits =>
      edits.map((edit: any, i: number) => {
        if (i !== idx) return edit;
        if (key === 'currency') {
          return {
            ...edit,
            currency: value,
            exchange_rate: getDefaultExchangeRate(value),
            notes: edit.notes,
          };
        }
        return { ...edit, [key]: value, notes: edit.notes };
      })
    );
  };
  // 添加/删除备注
  const addNote = (idx: number) => {
    setAdminOrderEdits(edits =>
      edits.map((edit: any, i: number) =>
        i === idx && edit.newNote.trim()
          ? { ...edit, admin_note: [...edit.admin_note, edit.newNote.trim()], newNote: '' }
          : edit
      )
    );
  };
  const removeNote = (idx: number, noteIdx: number) => {
    setAdminOrderEdits(edits =>
      edits.map((edit: any, i: number) =>
        i === idx
          ? { ...edit, admin_note: edit.admin_note.filter((_: any, j: number) => j !== noteIdx) }
          : edit
      )
    );
  };
  // 保存
  const save = async (idx: number) => {
    // 调用API保存 adminOrderEdits[idx]
    try {
      const adminOrder = adminOrderEdits[idx];
      const response = await fetch(`/api/admin/orders/${orderId}/admin-order`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adminOrder),
      });
      if (!response.ok) {
        throw new Error('保存失败');
      }
      toast.success('保存成功');
      fetchOrder();
    } catch (err) {
      toast.error('保存失败');
    }
  };

  // 重新计算逻辑
  const recalcAdminOrder = (idx: number) => {
    setAdminOrderEdits(edits =>
      edits.map((edit: any, i: number) => {
        if (i !== idx) return edit;
        let newPrice = edit.admin_price;
        let newProductionDays = edit.production_days;
        let notes: string[] = [];
        let cny_price = edit.cny_price;
        if (pcbFormData) {
          try {
            const result = calcPcbPriceV3(pcbFormData);
            newPrice = String(result.total);
            if (result.notes) notes = result.notes;
          } catch {}
          try {
            const cycle = calcProductionCycle(pcbFormData, new Date(), pcbFormData?.delivery);
            newProductionDays = String(cycle.cycleDays);
            if (cycle.reason) notes = notes.concat(cycle.reason);
          } catch {}
        }
        // 重新计算cny_price
        if (edit.currency === 'CNY' || !edit.currency) {
          cny_price = newPrice;
        } else {
          const rate = Number(edit.exchange_rate);
          cny_price = rate > 0 ? String(Number(newPrice) * rate) : '';
        }
        const newShipPrice = '200';
        const newCustomDuty = '100';
        const newExchangeRate = String(getDefaultExchangeRate(edit.currency));
        return {
          ...edit,
          admin_price: newPrice,
          ship_price: newShipPrice,
          custom_duty: newCustomDuty,
          exchange_rate: newExchangeRate,
          production_days: newProductionDays,
          notes,
          cny_price,
        };
      })
    );
    // 设置高亮和已重新计算状态
    setHighlightedIdx(arr => [...arr, idx]);
    setRecalcStatus(arr => {
      const newArr = [...arr];
      newArr[idx] = true;
      return newArr;
    });
    setTimeout(() => {
      setHighlightedIdx(arr => arr.filter((_: number, i: number) => i !== idx));
      setRecalcStatus(arr => {
        const newArr = [...arr];
        newArr[idx] = false;
        return newArr;
      });
    }, 1500);
  };

  // 1. 让fetchOrder变为组件内可复用函数
  const fetchOrder = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/orders?id=${orderId}`, {
        headers: {},
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch order');
      }
      const data: Order = await response.json();
      setOrder(data);
      if (data.pcb_spec && typeof data.pcb_spec === 'object') {
        const result = quoteSchema.safeParse(data.pcb_spec);
        if (result.success) {
          setPcbFormData(result.data);
        } else {
          setPcbFormData(null);
          console.error('PCB参数校验失败', result.error);
        }
      } else {
        setPcbFormData(null);
      }
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

  // 2. useEffect里只调用fetchOrder
  useEffect(() => {
    fetchOrder();
  }, [orderId, form]);

  useEffect(() => {
    if (!hasInitAdminOrderEdits.current && order?.admin_orders) {
      const adminOrders = getAdminOrders(order.admin_orders);
      setAdminOrderEdits(
        adminOrders.map(admin => {
          const currency = admin.currency ?? '';
          const exchange_rate = admin.exchange_rate ?? (currency ? getDefaultExchangeRate(currency) : '');
          let admin_price = '';
          let production_days = '';
          let notes: string[] = [];
          let cny_price = '';
          if (pcbFormData) {
            try {
              const result = calcPcbPriceV3(pcbFormData);
              admin_price = String(result.total);
              if (result.notes) notes = result.notes;
            } catch {}
            try {
              const cycle = calcProductionCycle(pcbFormData, new Date(), pcbFormData?.delivery);
              production_days = String(cycle.cycleDays);
              if (cycle.reason) notes = notes.concat(cycle.reason);
            } catch {}
          } else {
            admin_price = String(admin.admin_price ?? '');
            production_days = String(admin.production_days ?? '');
          }
          // cny_price初始化
          if (currency === 'CNY' || !currency) {
            cny_price = admin_price;
          } else {
            const rate = Number(exchange_rate);
            cny_price = rate > 0 ? String(Number(admin_price) * rate) : '';
          }
          return {
            status: admin.status,
            admin_price,
            admin_note: admin.admin_note
              ? Array.isArray(admin.admin_note)
                ? admin.admin_note
                : [admin.admin_note]
              : [],
            newNote: '',
            currency,
            due_date: admin.due_date ?? '',
            pay_time: admin.pay_time ?? '',
            exchange_rate,
            payment_status: admin.payment_status ?? '',
            production_days,
            coupon: admin.coupon ?? '',
            ship_price: admin.ship_price ?? '',
            custom_duty: admin.custom_duty ?? '',
            notes,
            cny_price,
          };
        })
      );
      hasInitAdminOrderEdits.current = true;
    }
  }, [order?.admin_orders, pcbFormData]);

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

  const isPanel = (type?: string): boolean => !!type && type.startsWith('panel');

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
        { key: 'panelDimensions', shouldShow: data => isPanel(String(data.shipmentType)) },
        { key: 'panelSet', shouldShow: data => isPanel(String(data.shipmentType)) },
        { key: 'differentDesignsCount', shouldShow: data => isPanel(String(data.shipmentType)) },
        { key: 'border', shouldShow: data => isPanel(String(data.shipmentType)) },
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

  const calculatePriceDetails = () => {
    if (!pcbFormData) return;
    try {
      const result = calcPcbPriceV3(pcbFormData);
      setPriceDetails({
        basePrice: result.detail.basePrice || 0,
        processFee: result.detail.processFee || 0,
        materialFee: result.detail.materialFee || 0,
        specialProcessFee: result.detail.specialProcessFee || 0,
        testFee: result.detail.testFee || 0,
        total: result.total
      });
    } catch {
      toast.error('价格计算失败');
    }
  };

  const calculateLeadTimeDetails = () => {
    if (!pcbFormData) return;
    try {
      const result = calcProductionCycle(pcbFormData, new Date(), pcbFormData.delivery);
      setLeadTimeDetails({
        baseCycleDays: 5, // 基础生产周期
        processExtraDays: result.cycleDays - 5, // 工艺加成天数
        urgentExtraDays: pcbFormData.delivery === 'urgent' ? -2 : 0, // 加急处理
        cycleDays: result.cycleDays,
        reason: result.reason
      });
    } catch {
      toast.error('交期计算失败');
    }
  };

  // 删除订单
  const handleDelete = async () => {
    if (!orderId) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/orders?id=${orderId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete order');
      }

      toast.success('订单已删除');
      router.push('/admin/orders');
    } catch (err) {
      console.error('Error deleting order:', err);
      toast.error('删除订单失败');
    } finally {
      setIsDeleting(false);
    }
  };

  // 更新订单状态
  const handleStatusChange = async (newStatus: string) => {
    if (!orderId) return;
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders?id=${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      const updatedOrder = await response.json();
      setOrder(updatedOrder);
      toast.success('订单状态已更新');
    } catch (err) {
      console.error('Error updating order status:', err);
      toast.error('更新订单状态失败');
    } finally {
      setIsUpdating(false);
    }
  };

  // 创建管理员订单
  const handleCreateAdminOrder = async () => {
    if (!orderId) return;
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/admin-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: OrderStatus.Created,
          user_order_id: orderId,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to create admin order');
      }
      const updatedOrder = await response.json();
      setOrder(updatedOrder);
      toast.success('管理员订单已创建');
      fetchOrder();
    } catch (err) {
      console.error('Error creating admin order:', err);
      toast.error('创建管理员订单失败');
    }
  };

  // 在组件内添加格式化函数
  function formatDateTimeLocal(val: string) {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // 在组件内，adminOrders.length === 0 时，构造默认编辑数据
  const getDefaultAdminOrderEdit = () => {
    let admin_price = '';
    let production_days = '';
    let notes: string[] = [];
    let cny_price = '';
    if (pcbFormData) {
      try {
        const result = calcPcbPriceV3(pcbFormData);
        admin_price = String(result.total);
        if (result.notes) notes = result.notes;
      } catch {}
      try {
        const cycle = calcProductionCycle(pcbFormData, new Date(), pcbFormData?.delivery);
        production_days = String(cycle.cycleDays);
        if (cycle.reason) notes = notes.concat(cycle.reason);
      } catch {}
    }
    // 默认币种USD，汇率空
    cny_price = '';
    return {
      status: 'created',
      admin_price,
      admin_note: [],
      newNote: '',
      currency: 'USD',
      due_date: '',
      pay_time: '',
      exchange_rate: '',
      payment_status: '',
      production_days,
      coupon: '0',
      ship_price: '',
      custom_duty: '',
      notes,
      cny_price,
    };
  };

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
            {/* 用户信息卡片 */}
            <Card className="rounded-xl shadow-lg">
              <CardHeader>
                <CardTitle>User Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div>Email: {order.email}</div>
                <div>User ID: {order.user_id || 'Guest'}</div>
                <div>User Name: {order.user_name || '-'}</div>
                <div className="mt-2 font-medium">Shipping Address</div>
                {order.shipping_address ? (
                  <div>
                    <div>{order.shipping_address.address}</div>
                    <div>{order.shipping_address.city} {order.shipping_address.state} {order.shipping_address.country}</div>
                    <div>Zip: {order.shipping_address.zipCode}</div>
                    <div>Contact: {order.shipping_address.contactName}</div>
                    <div>Phone: {order.shipping_address.phone}</div>
                    <div>Courier: {order.shipping_address.courier}</div>
                  </div>
                ) : (
                  <div className="text-gray-400">No shipping address</div>
                )}
              </CardContent>
            </Card>

            {/* 订单状态卡片 */}
            <Card className="rounded-xl shadow-lg">
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div>Order ID: <span className="font-bold">{order.id}</span></div>
                <div>Created At: <span className="font-bold">{new Date(order.created_at).toLocaleString()}</span></div>
                <div>Main Order Status: <span className="font-bold">{order.status}</span></div>
                <div>
                  Admin Order Status: {Array.isArray(order.admin_orders) && (order.admin_orders as AdminOrder[]).length > 0
                    ? <span className="font-bold">{(order.admin_orders as AdminOrder[])[0].status}</span>
                    : <span className="text-gray-400">Not created</span>
                  }
                </div>
              </CardContent>
            </Card>

            {/* 原有订单信息卡片（只显示PCB相关信息） */}
            <Card className="rounded-xl shadow-lg">
              <CardHeader>
                <CardTitle>pcb Information</CardTitle>
                <CardDescription>Details about the PCB and Gerber file.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* PCB参数展示 */}
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">PCB参数</div>
                  {order.pcb_spec && typeof order.pcb_spec === 'object' ? (
                    <div className="space-y-4">
                      {pcbFieldGroups.map(group => (
                        <div key={group.title} className="mb-2">
                          <div className="font-semibold text-gray-700 mb-1">{group.title}</div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            {group.fields.map(field => {
                              if (!field.shouldShow(order.pcb_spec as Record<string, unknown>)) return null;
                              const value = (order.pcb_spec as Record<string, unknown>)[field.key];
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
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Gerber文件</div>
                  {order.gerber_file_url ? (
                    <a
                      href={order.gerber_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                      download
                    >
                      下载Gerber文件
                    </a>
                  ) : (
                    <span className="text-gray-400">没有Gerber文件</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          {/* 表单区 */}
          <div className="w-full md:w-[400px]">
            <Card className="rounded-xl shadow-lg mb-4">
              <CardHeader>
                <CardTitle>管理员订单</CardTitle>
                <CardDescription>管理订单状态和价格。</CardDescription>
              </CardHeader>
              <CardContent>
                {adminOrders.length > 0 ? (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-500">管理员订单已创建</div>
                    {adminOrders.map((admin, idx) => (
                      <div key={admin.id || idx} className="space-y-2 border rounded-lg p-3 mb-2">
                        <div>
                          Status:
                          <select
                            className="border rounded px-2 py-1 ml-2"
                            value={adminOrderEdits[idx]?.status}
                            onChange={e => updateEdit(idx, 'status', e.target.value)}
                          >
                            <option value="created">created</option>
                            <option value="reviewed">reviewed</option>
                            <option value="unpaid">unpaid</option>
                            <option value="paid">paid</option>
                            <option value="completed">completed</option>
                            <option value="cancelled">cancelled</option>
                          </select>
                        </div>
                        <div>Admin Price: <input type="number" className={`border rounded px-2 py-1 w-32 ${highlightedIdx.includes(idx) ? 'ring-2 ring-yellow-400 transition-all duration-300' : ''}`} value={adminOrderEdits[idx]?.admin_price ?? ''} onChange={e => updateEdit(idx, 'admin_price', e.target.value)} /></div>
                        <div>Currency: <input className="border rounded px-2 py-1 w-24" value={adminOrderEdits[idx]?.currency ?? ''} onChange={e => updateEdit(idx, 'currency', e.target.value)} /></div>
                        <div>Due Date: <input type="date" className="border rounded px-2 py-1" value={adminOrderEdits[idx]?.due_date ?? ''} onChange={e => updateEdit(idx, 'due_date', e.target.value)} /></div>
                        <div>Pay Time: <input type="datetime-local" className="border rounded px-2 py-1" value={formatDateTimeLocal(adminOrderEdits[idx]?.pay_time ?? '')} onChange={e => updateEdit(idx, 'pay_time', e.target.value)} /></div>
                        <div>Exchange Rate: <input type="number" className={`border rounded px-2 py-1 w-24 ${highlightedIdx.includes(idx) ? 'ring-2 ring-yellow-400 transition-all duration-300' : ''}`} value={adminOrderEdits[idx]?.exchange_rate ?? ''} onChange={e => updateEdit(idx, 'exchange_rate', e.target.value)} /></div>
                        <div>Payment Status: <span className="ml-2">{adminOrderEdits[idx]?.payment_status || '-'}</span></div>
                        <div>Production Days: <input type="number" className={`border rounded px-2 py-1 w-24 ${highlightedIdx.includes(idx) ? 'ring-2 ring-yellow-400 transition-all duration-300' : ''}`} value={adminOrderEdits[idx]?.production_days ?? ''} onChange={e => updateEdit(idx, 'production_days', e.target.value)} /></div>
                        <div>Coupon: <input type="number" className="border rounded px-2 py-1 w-32" value={adminOrderEdits[idx]?.coupon ?? ''} onChange={e => updateEdit(idx, 'coupon', e.target.value)} /></div>
                        <div>Ship Price: <input type="number" className={`border rounded px-2 py-1 w-32 ${highlightedIdx.includes(idx) ? 'ring-2 ring-yellow-400 transition-all duration-300' : ''}`} value={adminOrderEdits[idx]?.ship_price ?? ''} onChange={e => updateEdit(idx, 'ship_price', e.target.value)} /></div>
                        <div>Custom Duty: <input type="number" className={`border rounded px-2 py-1 w-32 ${highlightedIdx.includes(idx) ? 'ring-2 ring-yellow-400 transition-all duration-300' : ''}`} value={adminOrderEdits[idx]?.custom_duty ?? ''} onChange={e => updateEdit(idx, 'custom_duty', e.target.value)} /></div>
                        <div>CNY Price: <input type="number" className={`border rounded px-2 py-1 w-32 ${highlightedIdx.includes(idx) ? 'ring-2 ring-yellow-400 transition-all duration-300' : ''}`} value={adminOrderEdits[idx]?.cny_price ?? ''} onChange={e => updateEdit(idx, 'cny_price', e.target.value)} /></div>
                        <div>
                          Admin Notes:
                          <ul className="list-disc pl-5 mt-1">
                            {adminOrderEdits[idx]?.admin_note.map((note: string, i: number) => (
                              <li key={i} className="flex items-center justify-between">
                                <span>{note}</span>
                                <button className="ml-2 text-red-500" onClick={() => removeNote(idx, i)}>删除</button>
                              </li>
                            ))}
                          </ul>
                          <div className="flex mt-2 gap-2">
                            <input
                              type="text"
                              className="border rounded px-2 py-1 flex-1"
                              value={adminOrderEdits[idx]?.newNote ?? ''}
                              onChange={e => updateEdit(idx, 'newNote', e.target.value)}
                              placeholder="添加新备注"
                            />
                            <Button size="sm" type="button" onClick={() => addNote(idx)}>添加</Button>
                          </div>
                        </div>
                        <Button size="sm" className="mt-2" onClick={() => save(idx)}>保存修改</Button>
                        <Button size="sm" variant="outline" className="mt-2 mr-2" onClick={() => recalcAdminOrder(idx)}>重新计算</Button>
                        {recalcStatus[idx] && (
                          <div className="text-green-600 text-xs mt-1">已重新计算</div>
                        )}
                        {adminOrderEdits[idx]?.notes && adminOrderEdits[idx].notes.length > 0 && (
                          <div className="mt-2 text-xs text-gray-500 space-y-1">
                            {adminOrderEdits[idx].notes.map((n: string, i: number) => (
                              <div key={i}>• {n}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-500">管理员订单未创建</div>
                    {/* 默认编辑表单 */}
                    {(() => {
                      const edit = getDefaultAdminOrderEdit();
                      return (
                        <div className="space-y-2 border rounded-lg p-3 mb-2">
                          <div>Status: <span className="ml-2">created</span></div>
                          <div>Admin Price: <input type="number" className="border rounded px-2 py-1 w-32" value={edit.admin_price || ''} readOnly /></div>
                          <div>Currency: <input className="border rounded px-2 py-1 w-24" value={edit.currency || ''} readOnly /></div>
                          <div>Due Date: <input type="date" className="border rounded px-2 py-1" value={edit.due_date || ''} readOnly /></div>
                          <div>Pay Time: <input type="datetime-local" className="border rounded px-2 py-1" value={formatDateTimeLocal(edit.pay_time || '')} readOnly /></div>
                          <div>Exchange Rate: <input type="number" className="border rounded px-2 py-1 w-24" value={edit.exchange_rate || ''} readOnly /></div>
                          <div>Payment Status: <span className="ml-2">-</span></div>
                          <div>Production Days: <input type="number" className="border rounded px-2 py-1 w-24" value={edit.production_days || ''} readOnly /></div>
                          <div>Coupon: <input type="number" className="border rounded px-2 py-1 w-32" value={edit.coupon || ''} readOnly /></div>
                          <div>Ship Price: <input type="number" className="border rounded px-2 py-1 w-32" value={edit.ship_price || ''} readOnly /></div>
                          <div>Custom Duty: <input type="number" className="border rounded px-2 py-1 w-32" value={edit.custom_duty || ''} readOnly /></div>
                          <div>CNY Price: <input type="number" className="border rounded px-2 py-1 w-32" value={edit.cny_price || ''} readOnly /></div>
                          <div>Admin Notes:
                            <ul className="list-disc pl-5 mt-1">
                              {edit.admin_note.map((note: string, i: number) => (
                                <li key={i} className="flex items-center justify-between">
                                  <span>{note}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          {edit.notes && edit.notes.length > 0 && (
                            <div className="mt-2 text-xs text-gray-500 space-y-1">
                              {edit.notes.map((n: string, i: number) => (
                                <div key={i}>• {n}</div>
                              ))}
                            </div>
                          )}
                          <Button onClick={handleCreateAdminOrder} className="w-full">创建管理员订单</Button>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 计算值卡片 */}
            <Card className="rounded-xl shadow-lg">
              <CardHeader>
                <CardTitle>Calculated Values</CardTitle>
                <CardDescription>Automatically calculated values based on PCB specifications.</CardDescription>
              </CardHeader>
              <CardContent>
                {pcbFormData && (
                  <div className="space-y-4">
                    {/* 基础计算值 */}
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-2">Basic Calculations</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="font-medium text-gray-600">单片面积</div>
                        <div className="text-gray-900">{`${Number(pcbFormData.singleDimensions?.length ?? 0) * Number(pcbFormData.singleDimensions?.width ?? 0)} mm²`}</div>
                        
                        <div className="font-medium text-gray-600">总数量</div>
                        <div className="text-gray-900">
                          {pcbFormData.shipmentType === 'single'
                            ? `${pcbFormData.singleCount ?? ''}`
                            : `${Number(pcbFormData.panelDimensions?.row || 1) * Number(pcbFormData.panelDimensions?.column || 1) * Number(pcbFormData.panelSet || 0)}`}
                        </div>
                        
                        <div className="font-medium text-gray-600">总面积</div>
                        <div className="text-gray-900">
                          {pcbFormData.shipmentType === 'single'
                            ? (pcbFormData.singleDimensions?.length * pcbFormData.singleDimensions?.width * pcbFormData.singleCount) / 100
                            : (pcbFormData.singleDimensions?.length * pcbFormData.singleDimensions?.width * (pcbFormData.panelDimensions?.row || 1) * (pcbFormData.panelDimensions?.column || 1) * (pcbFormData.panelSet || 0)) / 100} cm²
                        </div>
                      </div>
                    </div>

                    {/* 价格计算 */}
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-2">Price Calculation</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="font-medium text-gray-600">PCB成本</div>
                        <div className="text-gray-900 flex items-center gap-2">
                          {(() => {
                            try {
                              const { total } = calcPcbPriceV3(pcbFormData);
                              return `¥${total.toFixed(2)}`;
                            } catch {
                              return '计算错误';
                            }
                          })()}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={calculatePriceDetails}>
                                计算详情
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>价格计算详情</DialogTitle>
                              </DialogHeader>
                              {priceDetails && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="font-medium">基础价格</div>
                                    <div>¥{priceDetails.basePrice?.toFixed(2)}</div>
                                    
                                    <div className="font-medium">工艺加成</div>
                                    <div>¥{priceDetails.processFee?.toFixed(2)}</div>
                                    
                                    <div className="font-medium">材料加成</div>
                                    <div>¥{priceDetails.materialFee?.toFixed(2)}</div>
                                    
                                    <div className="font-medium">特殊工艺</div>
                                    <div>¥{priceDetails.specialProcessFee?.toFixed(2)}</div>
                                    
                                    <div className="font-medium">测试费用</div>
                                    <div>¥{priceDetails.testFee?.toFixed(2)}</div>
                                    
                                    <div className="font-medium">总价</div>
                                    <div className="font-bold">¥{priceDetails.total?.toFixed(2)}</div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                        <div className="font-medium text-gray-600">单价</div>
                        <div className="text-gray-900">
                          {(() => {
                            try {
                              const { total } = calcPcbPriceV3(pcbFormData);
                              const totalCount = pcbFormData.shipmentType === 'single' 
                                ? pcbFormData.singleCount 
                                : (pcbFormData.panelDimensions?.row || 1) * (pcbFormData.panelDimensions?.column || 1) * (pcbFormData.panelSet || 0);
                              return totalCount > 0 ? `¥${(total / totalCount).toFixed(2)}` : '¥0.00';
                            } catch {
                              return '计算错误';
                            }
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* 复杂度评分 */}
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-2">Complexity Assessment</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="font-medium text-gray-600">复杂度评分</div>
                        <div className="text-gray-900">
                          {(() => {
                            let score = 0;
                            // 层数影响 (0-40分)
                            score += Math.min(pcbFormData.layers * 2, 40);
                            // HDI工艺 (0-20分)
                            if (pcbFormData.hdi === '1step') score += 10;
                            else if (pcbFormData.hdi === '2step') score += 15;
                            else if (pcbFormData.hdi === '3step') score += 20;
                            // 线宽线距 (0-15分)
                            if (pcbFormData.minTrace === '3.5/3.5') score += 15;
                            else if (pcbFormData.minTrace === '4/4') score += 10;
                            else if (pcbFormData.minTrace === '5/5') score += 5;
                            // 孔径 (0-10分)
                            if (pcbFormData.minHole === '0.15') score += 10;
                            else if (pcbFormData.minHole === '0.2') score += 7;
                            else if (pcbFormData.minHole === '0.25') score += 5;
                            // 特殊工艺 (0-15分)
                            let specialFeatures = 0;
                            if (pcbFormData.impedance) specialFeatures += 3;
                            if (pcbFormData.goldFingers) specialFeatures += 3;
                            if (pcbFormData.edgePlating) specialFeatures += 2;
                            if (pcbFormData.bga) specialFeatures += 3;
                            if (pcbFormData.holeCu25um) specialFeatures += 2;
                            score += Math.min(specialFeatures, 15);
                            return Math.min(score, 100);
                          })()} / 100
                        </div>
                      </div>
                    </div>

                    {/* 预估交期 */}
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-2">Production Timeline</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="font-medium text-gray-600">预估交期</div>
                        <div className="text-gray-900 flex items-center gap-2">
                          {(() => {
                            const { cycleDays } = calcProductionCycle(pcbFormData, new Date(), pcbFormData.delivery);
                            return `${cycleDays} 天`;
                          })()}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={calculateLeadTimeDetails}>
                                计算详情
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>交期计算详情</DialogTitle>
                              </DialogHeader>
                              {leadTimeDetails && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="font-medium">基础生产周期</div>
                                    <div>{leadTimeDetails.baseCycleDays} 天</div>
                                    
                                    <div className="font-medium">工艺加成</div>
                                    <div>{leadTimeDetails.processExtraDays} 天</div>
                                    
                                    <div className="font-medium">加急处理</div>
                                    <div>{leadTimeDetails.urgentExtraDays} 天</div>
                                    
                                    <div className="font-medium">总交期</div>
                                    <div className="font-bold">{leadTimeDetails.cycleDays} 天</div>
                                    
                                    <div className="col-span-2 font-medium">影响因素</div>
                                    <div className="col-span-2">
                                      {leadTimeDetails.reason.map((r: string, index: number) => (
                                        <div key={index} className="text-sm text-gray-600">• {r}</div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                        <div className="font-medium text-gray-600">交期详情</div>
                        <div className="text-gray-900">
                          {(() => {
                            const { reason } = calcProductionCycle(pcbFormData, new Date(), pcbFormData.delivery);
                            return reason.join('; ');
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* 材料利用率 */}
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-2">Material Efficiency</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="font-medium text-gray-600">材料利用率</div>
                        <div className="text-gray-900">
                          {(() => {
                            const totalArea = pcbFormData.shipmentType === 'single'
                              ? (pcbFormData.singleDimensions?.length * pcbFormData.singleDimensions?.width * pcbFormData.singleCount) / 100
                              : (pcbFormData.singleDimensions?.length * pcbFormData.singleDimensions?.width * (pcbFormData.panelDimensions?.row || 1) * (pcbFormData.panelDimensions?.column || 1) * (pcbFormData.panelSet || 0)) / 100;
                            const standardPanelArea = 100 * 100;
                            const utilization = (totalArea / standardPanelArea) * 100;
                            return `${Math.min(utilization, 100).toFixed(1)}%`;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </FormProvider>
  );
} 