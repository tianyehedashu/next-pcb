import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// === 新增：类型定义 ===
interface PcbSpecData {
  productType?: 'pcb' | 'stencil';
  // 钢网字段
  stencilMaterial?: string;
  stencilThickness?: number;
  stencilProcess?: string;
  frameType?: string;
  surfaceTreatment?: string;
  // PCB字段
  layers?: number;
  thickness?: number;
  // 通用字段
  singleDimensions?: {
    length: number;
    width: number;
  };
  singleCount?: number;
  [key: string]: unknown; // 允许其他字段
}

// === 新增：产品类型检测函数 ===
function detectProductType(pcbSpecData: PcbSpecData): 'pcb' | 'stencil' {
  // 检查是否包含钢网特有字段
  const stencilFields = [
    'stencilMaterial', 'stencilThickness', 'stencilProcess', 
    'frameType', 'surfaceTreatment'
  ];
  
  const hasStencilFields = stencilFields.some(field => 
    pcbSpecData[field] !== undefined && pcbSpecData[field] !== null
  );
  
  // 如果有明确的productType字段，优先使用
  if (pcbSpecData.productType) {
    return pcbSpecData.productType === 'stencil' ? 'stencil' : 'pcb';
  }
  
  // 根据字段存在性判断
  return hasStencilFields ? 'stencil' : 'pcb';
}

// === 新增：数据验证函数 ===
function validateQuoteData(pcbSpecData: PcbSpecData, productType: 'pcb' | 'stencil') {
  const errors: string[] = [];
  
  if (productType === 'stencil') {
    // 钢网数据验证
    if (!pcbSpecData.stencilMaterial) {
      errors.push('Stencil material is required');
    }
    if (!pcbSpecData.stencilThickness) {
      errors.push('Stencil thickness is required');
    }
    if (!pcbSpecData.stencilProcess) {
      errors.push('Stencil manufacturing process is required');
    }
    if (!pcbSpecData.singleDimensions?.length || !pcbSpecData.singleDimensions?.width) {
      errors.push('Stencil dimensions are required');
    }
    if (!pcbSpecData.singleCount || pcbSpecData.singleCount < 1) {
      errors.push('Stencil quantity must be at least 1');
    }
  } else {
    // PCB数据验证（保持原有逻辑）
    if (!pcbSpecData.layers || pcbSpecData.layers < 1) {
      errors.push('PCB layers must be at least 1');
    }
    if (!pcbSpecData.thickness) {
      errors.push('PCB thickness is required');
    }
    if (!pcbSpecData.singleDimensions?.length || !pcbSpecData.singleDimensions?.width) {
      errors.push('PCB dimensions are required');
    }
    if (!pcbSpecData.singleCount || pcbSpecData.singleCount < 1) {
      errors.push('PCB quantity must be at least 1');
    }
  }
  
  return errors;
}

export async function POST(req: NextRequest) {
  try {
    // Create client that works for both authenticated and anonymous users
    const supabase = await createClient();
    
    // Try to get user (will be null for anonymous users)
    const { data: { user } } = await supabase.auth.getUser();
    
    // 4. 处理业务逻辑
    const body = await req.json();
    
    // 提取关键字段
    const { email, phone, shippingAddress, gerberFileUrl, cal_values, ...pcbSpecData } = body;
    
    // === 新增：产品类型检测 ===
    const productType = detectProductType(pcbSpecData);
    
    console.log(`Detected product type: ${productType}`, {
      hasStencilMaterial: !!pcbSpecData.stencilMaterial,
      hasLayers: !!pcbSpecData.layers,
      productTypeField: pcbSpecData.productType
    });
    
    // 验证必需字段
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    // === 新增：产品数据验证 ===
    const validationErrors = validateQuoteData(pcbSpecData, productType);
    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationErrors 
      }, { status: 400 });
    }
    
    // === 新增：标准化pcb_spec数据 ===
    const standardizedPcbSpec = {
      ...pcbSpecData,
      productType, // 明确标记产品类型
      detectedAt: new Date().toISOString(), // 记录检测时间
    };
    
    // 构建插入数据
    const insertData = {
      user_id: user?.id || null, // 游客报价时为null
      email,
      phone: phone || null,
      pcb_spec: standardizedPcbSpec, // 使用标准化后的数据
      cal_values: cal_values || null, // 新增：存所有计算字段
      shipping_address: shippingAddress || null,
      gerber_file_url: gerberFileUrl || null,
      status: 'pending'
    };
    
    console.log(`Inserting ${productType} quote for email: ${email}`);
    
    // 插入数据库
    const result = await supabase
      .from('pcb_quotes')
      .insert([insertData])
      .select('id')
      .single();
    
    console.log("Insert result:", result);
    
    if (result.error) {
      console.error("Database error:", result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      id: result.data?.id,
      productType, // 返回检测到的产品类型
      message: `${productType === 'stencil' ? 'Stencil' : 'PCB'} quote submitted successfully`
    }, { status: 200 });
    
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error("API error:", err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 