// PCB面积计算工具函数

export function calcArea(form: {
  shipmentType: string;
  singleDimensions: { length: number; width: number };
  singleCount: number;
  panelRow?: number;
  panelColumn?: number;
  panelSet?: number;
}) {
  const { shipmentType, singleDimensions, singleCount, panelRow = 1, panelColumn = 1, panelSet = 0 } = form;
  let totalCount = singleCount;

  if (shipmentType === 'panel' || shipmentType === 'panel_agent') {
    // 拼板：单片数 × 拼板数
    totalCount = panelRow * panelColumn * panelSet;
  }

  // 面积单位：平方米
  const area = (singleDimensions.length * singleDimensions.width * totalCount) / 10000;
  return area;
} 