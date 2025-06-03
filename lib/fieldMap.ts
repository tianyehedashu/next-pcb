// 前端字段名 => 后端字段名
export const fieldMap: Record<string, string> = {
  pcbType: 'pcbtype',
  layers: 'layers',
  thickness: 'thickness',
  surfaceFinish: 'surfacefinish',
  copperWeight: 'copperweight',
  minTrace: 'mintrace',
  minHole: 'minhole',
  solderMask: 'soldermask',
  silkscreen: 'silkscreen',
  goldFingers: 'goldfingers',
  castellated: 'castellated',
  impedance: 'impedance',
  flyingProbe: 'flyingprobe',
  quantity: 'quantity',
  delivery: 'delivery',
  gerber: 'gerber',
  hdi: 'hdi',
  tg: 'tg',
  panelCount: 'panelcount',
  shipmentType: 'shipmenttype',
  singleLength: 'singlelength',
  singleWidth: 'singlewidth',
  singleCount: 'singlecount',
  border: 'border',
  maskCover: 'maskcover',
  edgePlating: 'edgeplating',
  halfHole: 'halfhole',
  edgeCover: 'edgecover',
  testMethod: 'testmethod',
  prodCap: 'prodcap',
  productReport: 'productreport',
  yyPin: 'yyPin',
  customerCode: 'customercode',
  payMethod: 'paymethod',
  qualityAttach: 'qualityattach',
  smt: 'smt',
};

export function mapFormToBackend(form: Record<string, any>, map: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(form).map(([k, v]) => [map[k] || k, v])
  );
} 