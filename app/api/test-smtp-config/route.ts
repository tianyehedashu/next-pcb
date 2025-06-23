import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const envVars = {
    // 基础SMTP配置
    SMTP_HOST: process.env.SMTP_HOST || 'Not set',
    SMTP_PORT: process.env.SMTP_PORT || 'Not set',
    SMTP_SECURE: process.env.SMTP_SECURE || 'Not set',
    SMTP_USER: process.env.SMTP_USER || 'Not set',
    SMTP_PASS_SET: process.env.SMTP_PASS ? 'Yes' : 'No',
    SMTP_FROM: process.env.SMTP_FROM || 'Not set',
    SMTP_FROM_NAME: process.env.SMTP_FROM_NAME || 'Not set',
    
    // QQ邮箱配置（备用）
    QQ_EMAIL_USER: process.env.QQ_EMAIL_USER || 'Not set',
    QQ_EMAIL_AUTH_CODE_SET: process.env.QQ_EMAIL_AUTH_CODE ? 'Yes' : 'No',
    
    // Supabase配置
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set',
  };

  // 计算最终的配置值
  const finalConfig = {
    host: process.env.SMTP_HOST || 'smtp.qq.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
    user: process.env.SMTP_USER || process.env.QQ_EMAIL_USER,
    passSet: !!(process.env.SMTP_PASS || process.env.QQ_EMAIL_AUTH_CODE),
    from: process.env.SMTP_FROM || process.env.SMTP_USER || process.env.QQ_EMAIL_USER,
    fromName: process.env.SMTP_FROM_NAME || 'SpeedXPCB',
  };

  // 配置建议
  const recommendations = [];
  
  if (!process.env.SMTP_FROM && !process.env.SMTP_USER) {
    recommendations.push('建议设置 SMTP_FROM 或 SMTP_USER 环境变量');
  }
  
  if (!process.env.SMTP_FROM_NAME) {
    recommendations.push('建议设置 SMTP_FROM_NAME 环境变量');
  }
  
  if (finalConfig.host === 'smtp.qiye.aliyun.com' && !process.env.SMTP_FROM) {
    recommendations.push('阿里云企业邮箱建议设置 SMTP_FROM=sales@speedxpcb.com');
  }
  
  if (!finalConfig.passSet) {
    recommendations.push('SMTP密码未设置，请检查 SMTP_PASS 或 QQ_EMAIL_AUTH_CODE');
  }

  return NextResponse.json({
    environment: envVars,
    finalConfig,
    recommendations,
    isValid: finalConfig.user && finalConfig.passSet && finalConfig.from,
  });
} 