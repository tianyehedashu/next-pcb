// PCB面积计算工具函数
import { calculateTotalPcbArea } from './utils/precision';

export function calcArea(form: any) {
  return calculateTotalPcbArea(form);
} 