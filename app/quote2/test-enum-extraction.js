// 测试 enum 提取功能
import { quoteSchema } from './schema/quoteSchema.js';
import { ZodEnum, ZodNativeEnum, ZodDefault, ZodEffects } from 'zod';

// 复制提取逻辑
function extractEnumOptions(zodType) {
  // 处理 ZodDefault 包装
  if (zodType instanceof ZodDefault) {
    return extractEnumOptions(zodType._def.innerType);
  }
  
  // 处理 ZodEnum
  if (zodType instanceof ZodEnum) {
    return zodType.options.map((value) => ({ 
      label: String(value), 
      value: value
    }));
  }
  
  // 处理 ZodNativeEnum
  if (zodType instanceof ZodNativeEnum) {
    return Object.values(zodType.enum).map((value) => ({ 
      label: String(value), 
      value: value
    }));
  }
  
  return [];
}

function getZodFieldSchema(fieldName) {
  try {
    let schema = quoteSchema;
    
    // 如果是 ZodEffects（包含 .refine()），需要获取内部的 schema
    while (schema instanceof ZodEffects) {
      schema = schema._def.schema;
    }
    
    const shape = schema._def.shape();
    return shape[fieldName] || null;
  } catch (error) {
    console.warn(`Failed to extract schema for field: ${fieldName}`, error);
    return null;
  }
}

function getEnumOptionsFromZod(fieldName) {
  const fieldSchema = getZodFieldSchema(fieldName);
  if (!fieldSchema) {
    console.warn(`No schema found for field: ${fieldName}`);
    return [];
  }
  
  const options = extractEnumOptions(fieldSchema);
  console.log(`Extracted options for ${fieldName}:`, options);
  return options;
}

// 测试
console.log('Testing enum extraction...');
console.log('pcbType options:', getEnumOptionsFromZod('pcbType'));
console.log('hdi options:', getEnumOptionsFromZod('hdi'));
console.log('tg options:', getEnumOptionsFromZod('tg')); 