import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/utils/supabase/server';
import { checkAdminAuth } from '@/lib/auth-utils';
import { ADMIN_ORDER, USER_ORDER } from '@/app/constants/tableNames';
import nodemailer from 'nodemailer';

// 清理和验证管理员订单字段
function sanitizeAdminOrderFields(body: Record<string, unknown>) {
  // 确保 surcharges 是一个有效的数组
  let surcharges = [];
  if (body.surcharges) {
    if (Array.isArray(body.surcharges)) {
      surcharges = body.surcharges;
    } else if (typeof body.surcharges === 'string') {
      try {
        const parsed = JSON.parse(body.surcharges);
        surcharges = Array.isArray(parsed) ? parsed : [];
      } catch {
        surcharges = [];
      }
    }
  }

  // 处理 admin_note：确保是字符串类型
  let adminNote = '';
  if (body.admin_note) {
    if (typeof body.admin_note === 'string') {
      adminNote = body.admin_note;
    } else if (Array.isArray(body.admin_note)) {
      // 如果传入的是数组，转换为字符串（兼容旧数据）
      adminNote = body.admin_note.filter(note => note && typeof note === 'string').join('\n');
    } else {
      adminNote = String(body.admin_note);
    }
  }

  // 调试日志：检查处理的数据
  console.log('🔍 API接收到的数据:', {
    原始admin_note: body.admin_note,
    处理后admin_note: adminNote,
    原始surcharges: body.surcharges,
    处理后surcharges: surcharges
  });

  return {
    status: body.status || 'created',
    pcb_price: body.pcb_price || null,
    admin_price: body.admin_price || null,
    admin_note: adminNote, // 字符串类型
    currency: body.currency || 'CNY',
    due_date: body.due_date || null,
    pay_time: body.pay_time || null,
    exchange_rate: body.exchange_rate || 7.2,
    payment_status: body.payment_status || null,
    production_days: body.production_days || null,
    delivery_date: body.delivery_date || null,
    coupon: body.coupon || 0,
    ship_price: body.ship_price || null,
    custom_duty: body.custom_duty || null,
    cny_price: body.cny_price || null,
    surcharges: surcharges,
    updated_at: body.updated_at || new Date().toISOString(),
  };
}

// 发送邮件通知
export async function sendNotificationToUser(
  userId: string,
  subject: string,
  html: string,
  orderId: string,
  notificationType: string
) {
  try {
    // 创建 supabase 管理员 client 来获取用户信息
    const supabaseAdmin = createSupabaseAdminClient();
    
    let userEmail: string;
    
    // 尝试从 auth.users 表获取用户邮箱
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (authError || !authUser?.user?.email) {
      console.error('从 auth.users 获取用户邮箱失败:', { userId, error: authError?.message });
      
      // 备选方案：从 profiles 表获取邮箱
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();
        
      if (profileError || !profile?.email) {
        console.error('从 profiles 表获取用户邮箱也失败:', { userId, error: profileError?.message });
        return false;
      }
      
      userEmail = profile.email;
    } else {
      userEmail = authUser.user.email;
    }
    
    // 创建邮件传输器 - 支持多种邮件服务
    const emailConfig = {
      host: process.env.SMTP_HOST || 'smtp.qq.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER || process.env.QQ_EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.QQ_EMAIL_AUTH_CODE,
      },
    };

    const transporter = nodemailer.createTransport(emailConfig);

    // 发送邮件
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.QQ_EMAIL_USER;
    const fromName = process.env.SMTP_FROM_NAME || 'SpeedxPCB Manufacturing';
    
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: userEmail,
      subject,
      html,
    });

    console.log('邮件发送成功:', {
      to: userEmail,
      subject,
      orderId,
      notificationType
    });
    
    return true;
  } catch (error) {
    console.error('发送邮件通知失败:', {
      error: error instanceof Error ? error.message : error,
      orderId,
      notificationType
    });
    return false;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { id: userOrderId } = await params;

  try {
    // 验证管理员权限
    const { error: authError } = await checkAdminAuth();
    if (authError) {
      return authError;
    }

    const body = await request.json();
    const { sendNotification = false, notificationType = 'order_created', ...otherFields } = body;

    // 2. 检查是否已存在管理员订单
    const { data: existingAdminOrder, error: checkError } = await supabase
      .from(ADMIN_ORDER)
      .select('id')
      .eq('user_order_id', userOrderId)
      .single();

    if (!checkError && existingAdminOrder) {
      return NextResponse.json({ error: 'Admin order already exists' }, { status: 409 });
    }

    // 3. 准备管理员订单数据
    const adminOrderFields = sanitizeAdminOrderFields(otherFields);
    const insertData = {
      user_order_id: userOrderId,
      ...adminOrderFields,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 4. 创建管理员订单
    console.log('🔍 即将插入到数据库的数据:', {
      admin_note: insertData.admin_note,
      surcharges: insertData.surcharges,
      user_order_id: insertData.user_order_id
    });
    
    const { data: createdData, error: createError } = await supabase
      .from(ADMIN_ORDER)
      .insert(insertData)
      .select()
      .single();

    if (createError) {
      console.error('❌ 创建管理员订单失败:', createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }
    
    console.log('✅ 管理员订单创建成功:', {
      admin_note: createdData?.admin_note,
      surcharges: createdData?.surcharges,
      id: createdData?.id
    });

    // 5. 更新用户订单状态
    const userOrderUpdateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (adminOrderFields.status && adminOrderFields.status !== 'created') {
      userOrderUpdateData.status = adminOrderFields.status;
    }

    const { error: updateError } = await supabase
      .from(USER_ORDER)
      .update(userOrderUpdateData)
      .eq('id', userOrderId);

    if (updateError) {
      console.warn('⚠️ 更新用户订单状态失败:', updateError);
    }
    
    // 6. 发送邮件通知
    if (sendNotification) {
      const subject = `Your PCB Order #${userOrderId} has been created`;
      const html = `<p>Your order has been successfully created and is now waiting for admin review. You can view your order here: <a href="${process.env.NEXT_PUBLIC_SITE_URL}/profile/orders/${userOrderId}">View Order</a></p>`;
      
      const { data: quote } = await supabase.from(USER_ORDER).select('user_id').eq('id', userOrderId).single();
      if (quote?.user_id) {
         await sendNotificationToUser(quote.user_id, subject, html, userOrderId, notificationType);
      }
    }

    return NextResponse.json(createdData);
  } catch (error) {
    console.error('❌ 处理 POST 请求失败:', error);
    return NextResponse.json({ error: 'Failed to create admin order' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { id: userOrderId } = await params;

  
  try {
    const { error: authError } = await checkAdminAuth();
    if (authError) {
      return authError;
    }

    const body = await request.json();
    const { sendNotification = false, notificationType = 'order_updated', ...otherFields } = body;

    const adminOrderFields = sanitizeAdminOrderFields(otherFields);
    const updateData = {
      ...adminOrderFields,
      updated_at: new Date().toISOString(),
    };

    console.log('🔍 即将更新到数据库的数据:', {
      admin_note: updateData.admin_note,
      surcharges: updateData.surcharges,
      user_order_id: userOrderId
    });

    const { data: updatedData, error: updateError } = await supabase
      .from(ADMIN_ORDER)
      .update(updateData)
      .eq('user_order_id', userOrderId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ 更新管理员订单失败:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log('✅ 管理员订单更新成功:', {
      admin_note: updatedData?.admin_note,
      surcharges: updatedData?.surcharges,
      id: updatedData?.id
    });

    const userOrderUpdateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (adminOrderFields.status) {
      userOrderUpdateData.status = adminOrderFields.status;
    }

    const { error: userUpdateError } = await supabase
      .from(USER_ORDER)
      .update(userOrderUpdateData)
      .eq('id', userOrderId);
      
    if (userUpdateError) {
      console.warn('⚠️ 更新用户订单状态失败:', userUpdateError);
    }

    if (sendNotification) {
      const subject = `Your PCB Order #${userOrderId} has been updated`;
      const html = `<p>There has been an update to your order. You can view the latest details here: <a href="${process.env.NEXT_PUBLIC_SITE_URL}/profile/orders/${userOrderId}">View Order</a></p>`;
      
      const { data: quote } = await supabase.from(USER_ORDER).select('user_id').eq('id', userOrderId).single();
      if (quote?.user_id) {
         await sendNotificationToUser(quote.user_id, subject, html, userOrderId, notificationType);
      }
    }

    return NextResponse.json(updatedData);
  } catch (error) {
    console.error('❌ 处理 PATCH 请求失败:', error);
    return NextResponse.json({ error: 'Failed to update admin order' }, { status: 500 });
  }
} 