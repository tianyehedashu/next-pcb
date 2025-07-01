import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { filterFormDataByProductType } from '@/app/quote2/schema/productSchemas';
import { ProductType } from '@/app/quote2/schema/stencilTypes';

// === 新增：类型定义 ===
interface PcbSpecData {
  productType?: 'pcb' | 'stencil';
  // 新钢网字段（基于更新后的schema）
  borderType?: string;
  stencilType?: string;
  size?: string;
  stencilSide?: string;
  thickness?: number;
  existingFiducials?: string;
  electropolishing?: string;
  engineeringRequirements?: string;
  quantity?: number;
  // PCB字段
  layers?: number;
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
  // 检查是否包含新钢网特有字段
  const stencilFields = [
    'borderType', 'stencilType', 'stencilSide', 
    'existingFiducials', 'electropolishing', 'engineeringRequirements'
  ];
  
  const hasStencilFields = stencilFields.some(field => 
    pcbSpecData[field] !== undefined && pcbSpecData[field] !== null && pcbSpecData[field] !== ''
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
    // 钢网数据验证（基于新schema）
    if (!pcbSpecData.borderType) {
      errors.push('Border type is required for stencil');
    }
    if (!pcbSpecData.stencilType) {
      errors.push('Stencil type is required');
    }
    if (!pcbSpecData.size) {
      errors.push('Stencil size is required');
    }
    if (!pcbSpecData.stencilSide) {
      errors.push('Stencil side is required');
    }
    if (!pcbSpecData.thickness) {
      errors.push('Stencil thickness is required');
    }
    if (!pcbSpecData.quantity || pcbSpecData.quantity < 1) {
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



// === 新增：数据分离函数 ===
function separateProductSpecs(rawData: PcbSpecData, productType: 'pcb' | 'stencil') {
  // 过滤数据，只保留当前产品类型相关的字段
  const filteredData = filterFormDataByProductType(rawData, productType as ProductType);
  
  // 根据产品类型确定product_types数组
  const productTypes = [productType];
  
  if (productType === 'stencil') {
    // 钢网产品：数据存储到stencil_spec字段
    return {
      product_type: productType,
      product_types: productTypes,
      pcb_spec: null, // 钢网订单不需要PCB规格
      stencil_spec: filteredData,
      smt_spec: null, // 暂不支持SMT
      assembly_spec: null // 单一产品不需要组装配置
    };
  } else {
    // PCB产品：数据存储到pcb_spec字段
    return {
      product_type: productType,
      product_types: productTypes,
      pcb_spec: filteredData,
      stencil_spec: null, // PCB订单不需要钢网规格
      smt_spec: null, // 暂不支持SMT
      assembly_spec: null // 单一产品不需要组装配置
    };
  }
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
      hasBorderType: !!pcbSpecData.borderType,
      hasStencilType: !!pcbSpecData.stencilType,
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
    
    // === 新增：数据分离处理 ===
    const separatedSpecs = separateProductSpecs(pcbSpecData, productType);
    
    // 构建插入数据 - 使用新的数据结构和多文件支持
    const insertData = {
      user_id: user?.id || null, // 游客报价时为null
      email,
      phone: phone || null,
      product_type: separatedSpecs.product_type, // 产品类型字段
      product_types: separatedSpecs.product_types, // 产品类型数组
      pcb_spec: separatedSpecs.pcb_spec, // PCB规格（仅PCB订单有数据）
      stencil_spec: separatedSpecs.stencil_spec, // 钢网规格（仅钢网订单有数据）
      smt_spec: separatedSpecs.smt_spec, // SMT规格（预留）
      assembly_spec: separatedSpecs.assembly_spec, // 组装配置（预留）
      cal_values: cal_values || null, // 计算值
      shipping_address: shippingAddress || null,
      
      // 文件字段 - 简化为单文件上传
      gerber_file_url: gerberFileUrl || null, // 通用文件字段（PCB用Gerber，钢网用设计文件）
      
      // 文件信息（简化版本）
      // gerber_file_url 字段已在上面设置
      
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