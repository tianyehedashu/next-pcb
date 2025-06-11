import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ADMIN_ORDER, USER_ORDER } from '@/app/constants/tableNames';
import nodemailer from 'nodemailer';
import type { SupabaseClient } from '@supabase/supabase-js';

// 验证管理员权限
async function verifyAdminRole(supabase: SupabaseClient) {
  try {
    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { isAdmin: false, error: 'Unauthorized' };
    }

    // 检查用户角色 - 这里假设你有一个 user_roles 表或 profiles 表中有 role 字段
    // 根据你的实际数据库结构调整
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return { isAdmin: false, error: 'User profile not found' };
    }

    // 检查是否为管理员角色
    const isAdmin = profile.role === 'admin' || profile.role === 'super_admin';
    
    return { isAdmin, user, error: isAdmin ? null : 'Insufficient permissions' };
  } catch (error) {
    console.error('Error verifying admin role:', error);
    return { isAdmin: false, error: 'Failed to verify permissions' };
  }
}

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
async function sendEmailNotification(
  orderId: string,
  userEmail: string,
  adminOrderData: Record<string, unknown>,
  notificationType: string
) {
  try {
    // 获取基础URL，支持多种环境变量
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   process.env.SITE_URL || 
                   'https://www.speedxpcb.com/';
    
    const orderUrl = `${baseUrl}/profile/orders/${orderId}`;
    
    // 简化的邮件内容
    const subject = `PCB Order Update - #${orderId}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>PCB Order Update</h2>
        <p>Dear Customer,</p>
        <p>Your PCB order has been updated.</p>
        <div style="background: #f5f5f5; padding: 20px; margin: 20px 0;">
          <h3>Order Details:</h3>
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Status:</strong> ${adminOrderData.status}</p>
          ${adminOrderData.cny_price ? `<p><strong>Total:</strong> ¥${adminOrderData.cny_price}</p>` : ''}
        </div>
        <p><a href="${orderUrl}">View Order Details</a></p>
        <p>Best regards,<br>PCB Manufacturing Team</p>
      </div>
    `;
    
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
    const fromName = process.env.SMTP_FROM_NAME || 'PCB Manufacturing';
    
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
      userEmail,
      notificationType
    });
    return false;
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
   
  const cookieStore = await cookies();
  const { id: userOrderId } = await params;
   //@ts-expect-error nextjs 15 的cookies 是异步的
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    // 验证管理员权限
    const { isAdmin, error: authError } = await verifyAdminRole(supabase);
    if (!isAdmin) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { sendNotification = false, notificationType = 'order_created', userEmail, ...otherFields } = body;

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
    // 调试日志：检查即将插入到数据库的数据
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
    
    // 调试日志：确认数据库插入结果
    console.log('✅ 管理员订单创建成功:', {
      admin_note: createdData?.admin_note,
      surcharges: createdData?.surcharges,
      id: createdData?.id
    });

    // 5. 更新用户订单状态
    const userOrderUpdateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // 如果有状态更新，同步到用户订单
    if (adminOrderFields.status && adminOrderFields.status !== 'created') {
      userOrderUpdateData.status = adminOrderFields.status;
    }

    const { data: updatedUserOrder, error: updateError } = await supabase
      .from(USER_ORDER)
      .update(userOrderUpdateData)
      .eq('id', userOrderId)
      .select('*,admin_orders(*)')
      .single();

    if (updateError) {
      console.error('Error updating user order:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 6. 发送邮件通知
    if (sendNotification && userEmail) {
      await sendEmailNotification(
        userOrderId,
        userEmail,
        adminOrderFields,
        notificationType
      );
    }

    return NextResponse.json(updatedUserOrder);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore =await cookies();
  const { id: userOrderId } = await params;
  //@ts-expect-error nextjs 15 的cookies 是异步的
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    // 验证管理员权限
    const { isAdmin, error: authError } = await verifyAdminRole(supabase);
    if (!isAdmin) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { sendNotification = false, notificationType = 'order_updated', userEmail, ...otherFields } = body;

    // 1. 查找管理员订单
    const { data: adminOrder, error: adminOrderError } = await supabase
      .from(ADMIN_ORDER)
      .select('*')
      .eq('user_order_id', userOrderId)
      .single();
    
    if (adminOrderError || !adminOrder) {
      return NextResponse.json({ error: 'Admin order not found' }, { status: 404 });
    }

    // 2. 更新管理员订单
    const updateFields = sanitizeAdminOrderFields({
      ...otherFields,
      updated_at: new Date().toISOString(),
    });
    
    // 调试日志：检查即将更新到数据库的数据
    console.log('🔍 即将更新到数据库的字段:', {
      admin_note: updateFields.admin_note,
      surcharges: updateFields.surcharges,
      adminOrderId: adminOrder.id
    });
    
    const { data: updatedData, error: updateError } = await supabase
      .from(ADMIN_ORDER)
      .update(updateFields)
      .eq('id', adminOrder.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ 数据库更新失败:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    
    // 调试日志：确认数据库更新结果
    console.log('✅ 数据库更新成功:', {
      admin_note: updatedData?.admin_note,
      surcharges: updatedData?.surcharges
    });

    // 3. 更新用户订单状态
    const userOrderUpdateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // 如果有状态更新，同步到用户订单
    if (updateFields.status) {
      userOrderUpdateData.status = updateFields.status;
    }

    const { data: updatedUserOrder, error: userOrderUpdateError } = await supabase
      .from(USER_ORDER)
      .update(userOrderUpdateData)
      .eq('id', userOrderId)
      .select('*,admin_orders(*)')
      .single();
    
    if (userOrderUpdateError) {
      return NextResponse.json({ error: userOrderUpdateError.message }, { status: 500 });
    }

    // 4. 发送邮件通知
    if (sendNotification && userEmail) {
      await sendEmailNotification(
        userOrderId,
        userEmail,
        updateFields,
        notificationType
      );
    }

    return NextResponse.json(updatedUserOrder);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 