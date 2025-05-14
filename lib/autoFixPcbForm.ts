// PCB表单自动修正工具
import { pcbFieldRules } from './pcbFieldRules';

export function autoFixPcbForm(form: Record<string, any>, rules: Record<string, any> = pcbFieldRules) {
  const fixed: Record<string, any> = { ...form };
  Object.keys(rules).forEach(field => {
    const rule = rules[field];
    const value = form[field];
    // 填充默认值
    if ((value === undefined || value === null || value === '') && rule.default !== undefined) {
      fixed[field] = rule.default;
    }
    // 修正非法选项
    else if (rule.options && !rule.options.includes(value)) {
      fixed[field] = rule.default;
    }
  });
  return fixed;
} 