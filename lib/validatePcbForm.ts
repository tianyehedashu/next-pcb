// PCB表单校验工具
import { pcbFieldRules } from './pcbFieldRules';

export function validatePcbForm(form: Record<string, any>, rules: Record<string, any> = pcbFieldRules) {
  const errors: Record<string, string> = {};
  Object.keys(rules).forEach(field => {
    const rule = rules[field];
    const value = form[field];
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors[field] = 'Required';
    } else if (rule.options && !rule.options.includes(value)) {
      errors[field] = 'Invalid option';
    }
  });
  return errors;
} 