export interface CustomsFeeParams {
  country: string;
  declarationMethod: string;
  courier: string;
  declaredValue: number;
  pcbType?: string;
}

export interface CustomsFeeResult {
  duty: number;
  vat: number;
  agentFee: number;
  total: number;
  includedInCourier: boolean;
  explain: string;
}

// 可扩展为API调用
export function calculateCustomsFee({
  country,
  declarationMethod,
  courier,
  declaredValue,
  pcbType,
}: CustomsFeeParams): CustomsFeeResult {
  // 示例逻辑（实际可更复杂）
  let dutyRate = 0.1; // 默认10%
  let vatRate = 0.2;  // 默认20%
  const agentFee = 20;  // 代理报关费
  let includedInCourier = false;

  // 按国家调整税率
  if (country === 'US') { dutyRate = 0.05; vatRate = 0; }
  if (country === 'DE') { dutyRate = 0.08; vatRate = 0.19; }
  // ...可扩展

  // 按报关方式调整
  if (declarationMethod === 'ddp' || declarationMethod === 'agent') {
    includedInCourier = true;
  }

  // 计算
  const duty = declaredValue * dutyRate;
  const vat = declaredValue * vatRate;
  const total = duty + vat + (includedInCourier ? agentFee : 0);

  return {
    duty,
    vat,
    agentFee: includedInCourier ? agentFee : 0,
    total,
    includedInCourier,
    explain: includedInCourier
      ? 'All customs fees are included in the courier fee.'
      : 'Duties and taxes will be collected by customs or courier upon delivery.',
  };
} 