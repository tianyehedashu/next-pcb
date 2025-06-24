// 管理员邮件通知相关函数
import { sendAdminNotification as sendEmail } from '@/lib/utils/sendEmail';
import { createSupabaseServerClient } from '@/utils/supabase/server';

// 发送邮件给管理员的通用函数
export async function sendAdminNotification(
  subject: string,
  htmlContent: string,
  notificationType: string,
  orderId?: string,
  priority: 'high' | 'normal' | 'low' = 'normal'
) {
  try {
    // 记录通知尝试
    console.log('Admin Notification:', {
      subject,
      notificationType,
      orderId,
      priority,
      timestamp: new Date().toISOString()
    });

    // 获取Supabase服务角色客户端
    const supabase = await createSupabaseServerClient();
    
    // 使用现有的邮件发送功能
    await sendEmail(supabase, subject, htmlContent);

    console.log('✅ Admin notification sent successfully:', { subject, orderId });
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send admin notification:', error);
    return { success: false, error };
  }
}

// 退款请求通知管理员
export async function notifyAdminRefundRequest(
  orderId: string,
  userEmail: string,
  requestedAmount: number,
  adminOrderStatus: string,
  refundPercentage: number
) {
  const subject = `🔔 New Refund Request - Order #${orderId}`;
  const htmlContent = `
    <h2>New Refund Request Received</h2>
    <p>A customer has submitted a refund request that requires your attention.</p>
    
    <div style="background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px;">
      <h3>Order Details</h3>
      <p><strong>Order ID:</strong> #${orderId}</p>
      <p><strong>Customer Email:</strong> ${userEmail}</p>
             <p><strong>Order Status:</strong> ${adminOrderStatus}</p>
      <p><strong>Requested Amount:</strong> $${requestedAmount.toFixed(2)}</p>
      <p><strong>Refund Policy:</strong> ${(refundPercentage * 100)}% refund available</p>
    </div>
    
    <div style="background: #fff3cd; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #ffc107;">
      <h3>Action Required</h3>
      <p>Please review this refund request in the admin dashboard within 24-48 hours.</p>
      <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/orders/${orderId}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Request</a></p>
    </div>
    
    <hr>
    <p style="color: #666; font-size: 12px;">
      This notification was sent automatically. Please do not reply to this email.
    </p>
  `;

  return await sendAdminNotification(
    subject,
    htmlContent,
    'refund_request',
    orderId,
    'high'
  );
}

// 用户确认退款通知管理员
export async function notifyAdminRefundConfirmed(
  orderId: string,
  userEmail: string,
  confirmedAmount: number,
  confirmationTime: string
) {
  const subject = `✅ Refund Confirmed by User - Order #${orderId}`;
  const htmlContent = `
    <h2>User Confirmed Refund</h2>
    <p>The customer has confirmed their refund and it's ready for Stripe processing.</p>
    
    <div style="background: #d4edda; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #28a745;">
      <h3>Confirmation Details</h3>
      <p><strong>Order ID:</strong> #${orderId}</p>
      <p><strong>Customer Email:</strong> ${userEmail}</p>
      <p><strong>Confirmed Amount:</strong> $${confirmedAmount.toFixed(2)}</p>
      <p><strong>Confirmation Time:</strong> ${new Date(confirmationTime).toLocaleString()}</p>
    </div>
    
    <div style="background: #fff3cd; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #ffc107;">
      <h3>Next Steps</h3>
      <p>The refund is now in "processing" status and ready for Stripe processing.</p>
      <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/orders/${orderId}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Process Refund</a></p>
    </div>
    
    <hr>
    <p style="color: #666; font-size: 12px;">
      This notification was sent automatically. Please do not reply to this email.
    </p>
  `;

  return await sendAdminNotification(
    subject,
    htmlContent,
    'refund_confirmed',
    orderId,
    'high'
  );
}

// 用户取消退款通知管理员
export async function notifyAdminRefundCancelled(
  orderId: string,
  userEmail: string,
  cancelledAmount: number,
  cancellationTime: string
) {
  const subject = `❌ Refund Cancelled by User - Order #${orderId}`;
  const htmlContent = `
    <h2>User Cancelled Refund Request</h2>
    <p>The customer has decided to cancel their approved refund request.</p>
    
    <div style="background: #f8d7da; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #dc3545;">
      <h3>Cancellation Details</h3>
      <p><strong>Order ID:</strong> #${orderId}</p>
      <p><strong>Customer Email:</strong> ${userEmail}</p>
      <p><strong>Cancelled Amount:</strong> $${cancelledAmount.toFixed(2)}</p>
      <p><strong>Cancellation Time:</strong> ${new Date(cancellationTime).toLocaleString()}</p>
    </div>
    
    <div style="background: #d1ecf1; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #17a2b8;">
      <h3>Status Update</h3>
      <p>The refund status has been reset and the customer can submit a new refund request if needed.</p>
      <p>No further action is required unless the customer submits a new request.</p>
    </div>
    
    <hr>
    <p style="color: #666; font-size: 12px;">
      This notification was sent automatically. Please do not reply to this email.
    </p>
  `;

  return await sendAdminNotification(
    subject,
    htmlContent,
    'refund_cancelled',
    orderId,
    'normal'
  );
} 