import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// === 类型定义 ===
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

// === 产品类型检测函数 ===
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

// === 数据验证函数 ===
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, phone, shippingAddress, gerberFileUrl, cal_values, ...pcbSpecData } = body;

    // === 产品类型检测 ===
    const productType = detectProductType(pcbSpecData);
    
    console.log(`Guest ${productType} quote detected`, {
      hasBorderType: !!pcbSpecData.borderType,
      hasStencilType: !!pcbSpecData.stencilType,
      hasLayers: !!pcbSpecData.layers,
      productTypeField: pcbSpecData.productType
    });

    // 验证必需字段
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // === 产品数据验证 ===
    const validationErrors = validateQuoteData(pcbSpecData, productType);
    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationErrors 
      }, { status: 400 });
    }

    // === 标准化pcb_spec数据 ===
    const standardizedPcbSpec = {
      ...pcbSpecData,
      productType, // 明确标记产品类型
      detectedAt: new Date().toISOString(), // 记录检测时间
    };

    // 使用 service role key 来绕过 RLS 限制
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 构建插入数据 - 游客报价user_id为null
    const insertData = {
      user_id: null, // 明确标识为游客报价
      email,
      phone: phone || null,
      pcb_spec: standardizedPcbSpec, // 使用标准化后的数据
      cal_values: cal_values || null, // 新增：存所有计算字段
      shipping_address: shippingAddress || null,
      gerber_file_url: gerberFileUrl || null,
      status: 'pending'
    };

    console.log(`Creating guest ${productType} quote for email: ${email}`);

    // 创建游客报价记录
    const { data: quoteData, error: quoteError } = await supabase
      .from('pcb_quotes')
      .insert([insertData])
      .select('id')
      .single();

    if (quoteError) {
      console.error('Quote creation error:', quoteError);
      return NextResponse.json({ error: 'Failed to create quote' }, { status: 500 });
    }

    // 2. 发送邮件通知（可选）
    // TODO: 集成邮件服务（如 Resend、SendGrid 等）
    
    return NextResponse.json({ 
      success: true, 
      id: quoteData.id,
      productType, // 返回检测到的产品类型
      message: `${productType === 'stencil' ? 'Stencil' : 'PCB'} quote submitted successfully. We will contact you soon via email.` 
    }, { status: 200 });

  } catch (err: unknown) {
    console.error('Guest quote error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 