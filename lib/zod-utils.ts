import { z } from "zod";

/**
 * 从 Zod schema 中提取默认值的工具函数
 * 支持复杂的 schema 结构，包括 ZodEffects（refine）、嵌套对象等
 * 
 * @param schema - Zod schema 对象
 * @returns 包含默认值的对象
 */
export function getZodDefaults<T extends z.ZodTypeAny>(schema: T): Partial<z.infer<T>> {
  function getDefaultValue(zodSchema: unknown): unknown {
    const zodDef = (zodSchema as { _def?: { typeName?: string; defaultValue?: () => unknown; innerType?: unknown; values?: unknown; shape?: unknown; schema?: unknown } })?._def;
    
    if (!zodDef) return undefined;
    
    // 处理 ZodDefault - 优先使用 Zod 中定义的默认值
    if (zodDef.typeName === 'ZodDefault' && zodDef.defaultValue) {
      return zodDef.defaultValue();
    }
    
    // 处理 ZodOptional
    if (zodDef.typeName === 'ZodOptional' && zodDef.innerType) {
      return getDefaultValue(zodDef.innerType);
    }
    
    // 处理 ZodNullable
    if (zodDef.typeName === 'ZodNullable' && zodDef.innerType) {
      return getDefaultValue(zodDef.innerType);
    }
    
    // 处理 ZodArray
    if (zodDef.typeName === 'ZodArray') {
      return [];
    }
    
    // 处理 ZodObject
    if (zodDef.typeName === 'ZodObject') {
      return getObjectDefaults(zodSchema);
    }
    
    // 处理 ZodString - 兜底值
    if (zodDef.typeName === 'ZodString') {
      return '';
    }
    
    // 处理 ZodNumber - 兜底值
    if (zodDef.typeName === 'ZodNumber') {
      return 0;
    }
    
    // 处理 ZodBoolean - 兜底值
    if (zodDef.typeName === 'ZodBoolean') {
      return false;
    }
    
    // 处理 ZodEnum 和 ZodNativeEnum - 兜底值
    if (zodDef.typeName === 'ZodEnum' || zodDef.typeName === 'ZodNativeEnum') {
      const values = zodDef.values;
      if (Array.isArray(values)) {
        return values[0];
      }
      if (values && typeof values === 'object') {
        return Object.values(values)[0];
      }
    }
    
    return undefined;
  }
  
  function getObjectDefaults(objectSchema: unknown): Record<string, unknown> {
    const zodDef = (objectSchema as { _def?: { shape?: Record<string, unknown> | (() => Record<string, unknown>) }; shape?: Record<string, unknown> })?._def;
    let shape = zodDef?.shape || (objectSchema as { shape?: Record<string, unknown> })?.shape;
    
    if (!shape) return {};
    
    // 检查 shape 是否是函数（lazy evaluation）
    if (typeof shape === 'function') {
      try {
        shape = shape();
      } catch (error) {
        console.warn('Failed to evaluate shape function:', error);
        return {};
      }
    }
    
    if (!shape || typeof shape !== 'object') return {};
    
    const defaults: Record<string, unknown> = {};
    
    for (const [key, fieldSchema] of Object.entries(shape)) {
      const defaultValue = getDefaultValue(fieldSchema);
      if (defaultValue !== undefined) {
        defaults[key] = defaultValue;
      }
    }
    
    return defaults;
  }
  
  // 处理 ZodEffects (refine/transform)
  const schemaDef = (schema as { _def?: { typeName?: string; schema?: unknown } })?._def;
  if (schemaDef?.typeName === 'ZodEffects' && schemaDef.schema) {
    return getObjectDefaults(schemaDef.schema) as Partial<z.infer<T>>;
  }
  
  // 处理普通 ZodObject
  return getObjectDefaults(schema) as Partial<z.infer<T>>;
}

/**
 * 检查 Zod schema 是否有默认值
 * 
 * @param schema - Zod schema 对象
 * @returns 是否有默认值
 */
export function hasZodDefault(schema: z.ZodTypeAny): boolean {
  const zodDef = (schema as { _def?: { typeName?: string } })?._def;
  return zodDef?.typeName === 'ZodDefault';
}

/**
 * 获取 Zod schema 的默认值（如果有的话）
 * 
 * @param schema - Zod schema 对象
 * @returns 默认值或 undefined
 */
export function getZodDefaultValue(schema: z.ZodTypeAny): unknown {
  const zodDef = (schema as { _def?: { typeName?: string; defaultValue?: () => unknown } })?._def;
  if (zodDef?.typeName === 'ZodDefault' && zodDef.defaultValue) {
    return zodDef.defaultValue();
  }
  return undefined;
}

/**
 * 为 Zustand store 创建带有 Zod 验证的 setter
 * 
 * @param schema - Zod schema 对象
 * @param set - Zustand 的 set 函数
 * @param get - Zustand 的 get 函数
 * @returns 验证后的 setter 函数
 */
export function createZodSetter<T>(
  schema: z.ZodSchema<T>,
  set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void,
  get: () => T
) {
  return (updates: Partial<T> | ((state: T) => Partial<T>)) => {
    const currentState = get();
    const newState = typeof updates === 'function' ? { ...currentState, ...updates(currentState) } : { ...currentState, ...updates };
    
    try {
      const validatedState = schema.parse(newState);
      set(() => validatedState);
      return { success: true, data: validatedState, error: null };
    } catch (error) {
      console.warn('Zod validation failed in store setter:', error);
      return { 
        success: false, 
        data: null, 
        error: error instanceof z.ZodError ? error : new Error('Validation failed') 
      };
    }
  };
}

/**
 * 为 Zustand store 创建带有 Zod 验证的安全 setter（只更新有效字段）
 * 
 * @param schema - Zod schema 对象
 * @param set - Zustand 的 set 函数
 * @param get - Zustand 的 get 函数
 * @returns 安全的 setter 函数
 */
export function createSafeZodSetter<T>(
  schema: z.ZodSchema<T>,
  set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void,
  get: () => T
) {
  return (updates: Partial<T> | ((state: T) => Partial<T>)) => {
    const currentState = get();
    const newState = typeof updates === 'function' ? { ...currentState, ...updates(currentState) } : { ...currentState, ...updates };
    
    try {
      const validatedState = schema.parse(newState);
      set(() => validatedState);
      return { success: true, data: validatedState, error: null };
    } catch (error) {
      // 如果验证失败，尝试部分更新（只更新有效的字段）
      const partialResult = schema.safeParse(newState);
      if (!partialResult.success) {
        // 逐个字段验证，只更新有效字段
        const validUpdates: Partial<T> = {};
        const updateEntries = typeof updates === 'function' ? Object.entries(updates(currentState)) : Object.entries(updates);
        
        for (const [key, value] of updateEntries) {
          const testState = { ...currentState, [key]: value };
          const fieldResult = schema.safeParse(testState);
          if (fieldResult.success) {
            (validUpdates as Record<string, unknown>)[key] = value;
          }
        }
        
        if (Object.keys(validUpdates).length > 0) {
          set((state) => ({ ...state, ...validUpdates }));
          return { 
            success: false, 
            data: { ...currentState, ...validUpdates }, 
            error: error instanceof z.ZodError ? error : new Error('Partial validation failed'),
            partialUpdate: true
          };
        }
      }
      
      return { 
        success: false, 
        data: currentState, 
        error: error instanceof z.ZodError ? error : new Error('Validation failed') 
      };
    }
  };
}

/**
 * 创建带有 Zod 验证的 Zustand store 工厂函数
 * 
 * @param schema - Zod schema 对象
 * @param defaultValues - 默认值（可选，会从 schema 中提取）
 * @returns store 创建函数
 */
export function createZodStore<T>(
  schema: z.ZodSchema<T>,
  defaultValues?: Partial<T>
) {
  const defaults = defaultValues || getZodDefaults(schema as z.ZodTypeAny);
  
  return (
    set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void,
    get: () => T
  ) => {
    const zodSetter = createZodSetter(schema, set, get);
    const safeZodSetter = createSafeZodSetter(schema, set, get);
    
    return {
      ...defaults,
      // 严格验证的 setter
      setData: zodSetter,
      // 安全的 setter（部分更新）
      setSafeData: safeZodSetter,
      // 重置到默认值
      reset: () => set(() => defaults as T),
      // 验证当前状态
      validate: () => {
        const currentState = get();
        return schema.safeParse(currentState);
      },
      // 获取验证错误
      getValidationErrors: () => {
        const currentState = get();
        const result = schema.safeParse(currentState);
        return result.success ? null : result.error;
      }
    };
  };
} 