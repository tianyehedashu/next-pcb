// 统一订单步骤配置，主流PCB厂商风格
export const ORDER_STEPS = [
  { label: "Inquiry", key: "inquiry" },
  { label: "Review", key: "review" },
  { label: "Confirm & Pay", key: "confirm_pay" },
  { label: "Scheduling", key: "scheduling" },
  { label: "Production", key: "production" },
  { label: "Shipping", key: "shipping" },
  { label: "Receiving", key: "receiving" },
  { label: "Complete", key: "complete" },
];

// order-steps.ts 类型声明
export type OrderStep = { label: string; key: string }; 