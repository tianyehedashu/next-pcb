import { EmailTemplate } from './email-service';

export interface OrderDetails {
  orderId: string;
  userEmail: string;
  amount?: number;
  status?: string;
  adminPrice?: number;
  refundPercentage?: number;
}

export interface RefundDetails extends OrderDetails {
  requestedAmount: number;
  refundPercentage: number;
  confirmationTime?: string;
  cancellationTime?: string;
  adminOrderStatus?: string;
}

export class EmailTemplateService {
  private static instance: EmailTemplateService;

  private constructor() {}

  public static getInstance(): EmailTemplateService {
    if (!EmailTemplateService.instance) {
      EmailTemplateService.instance = new EmailTemplateService();
    }
    return EmailTemplateService.instance;
  }

  private getBaseUrl(): string {
    return process.env.NEXT_PUBLIC_BASE_URL || 'https://speedxpcb.com';
  }

  private getEmailFooter(): string {
    return `
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;">
      <p style="color: #666; font-size: 12px; margin: 0;">
        This notification was sent automatically. Please do not reply to this email.
        <br>
        <a href="${this.getBaseUrl()}" style="color: #007bff;">SpeedXPCB</a> - Fast PCB Manufacturing Service
      </p>
    `;
  }

  private createActionButton(url: string, text: string, color: string = '#007bff'): string {
    return `
      <a href="${url}" 
         style="display: inline-block; background: ${color}; color: white; padding: 12px 24px; 
                text-decoration: none; border-radius: 5px; margin: 10px 0; font-weight: bold;">
        ${text}
      </a>
    `;
  }

  /**
   * 管理员通知模板 - 新订单支付成功
   */
  public createOrderPaymentNotification(orderDetails: OrderDetails): EmailTemplate {
    const { orderId, userEmail, amount } = orderDetails;
    
    return {
      subject: `💰 New Order Payment Received - #${orderId}`,
      html: `
        <h2>New Order Payment Notification</h2>
        <p>A customer has successfully completed payment for their PCB order.</p>
        
        <div style="background: #d4edda; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #28a745;">
          <h3>Payment Details</h3>
          <p><strong>Order ID:</strong> #${orderId}</p>
          <p><strong>Customer Email:</strong> ${userEmail}</p>
          ${amount ? `<p><strong>Amount Paid:</strong> $${amount.toFixed(2)}</p>` : ''}
        </div>
        
        <div style="background: #fff3cd; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #ffc107;">
          <h3>Next Steps</h3>
          <p>Please review the order details and begin processing.</p>
          ${this.createActionButton(`${this.getBaseUrl()}/admin/orders/${orderId}`, 'Review Order')}
        </div>
        
        ${this.getEmailFooter()}
      `,
      priority: 'high'
    };
  }

  /**
   * 管理员通知模板 - 退款请求
   */
  public createRefundRequestNotification(refundDetails: RefundDetails): EmailTemplate {
    const { orderId, userEmail, requestedAmount, adminOrderStatus, refundPercentage } = refundDetails;
    
    return {
      subject: `🔔 New Refund Request - Order #${orderId}`,
      html: `
        <h2>New Refund Request Received</h2>
        <p>A customer has submitted a refund request that requires your attention.</p>
        
        <div style="background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px;">
          <h3>Order Details</h3>
          <p><strong>Order ID:</strong> #${orderId}</p>
          <p><strong>Customer Email:</strong> ${userEmail}</p>
          ${adminOrderStatus ? `<p><strong>Order Status:</strong> ${adminOrderStatus}</p>` : ''}
          <p><strong>Requested Amount:</strong> $${requestedAmount.toFixed(2)}</p>
          <p><strong>Refund Policy:</strong> ${(refundPercentage * 100)}% refund available</p>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #ffc107;">
          <h3>Action Required</h3>
          <p>Please review this refund request in the admin dashboard within 24-48 hours.</p>
          ${this.createActionButton(`${this.getBaseUrl()}/admin/orders/${orderId}`, 'Review Request', '#ffc107')}
        </div>
        
        ${this.getEmailFooter()}
      `,
      priority: 'high'
    };
  }

  /**
   * 管理员通知模板 - 用户确认退款
   */
  public createRefundConfirmedNotification(refundDetails: RefundDetails): EmailTemplate {
    const { orderId, userEmail, requestedAmount, confirmationTime } = refundDetails;
    
    return {
      subject: `✅ Refund Confirmed by User - Order #${orderId}`,
      html: `
        <h2>User Confirmed Refund</h2>
        <p>The customer has confirmed their refund and it's ready for Stripe processing.</p>
        
        <div style="background: #d4edda; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #28a745;">
          <h3>Confirmation Details</h3>
          <p><strong>Order ID:</strong> #${orderId}</p>
          <p><strong>Customer Email:</strong> ${userEmail}</p>
          <p><strong>Confirmed Amount:</strong> $${requestedAmount.toFixed(2)}</p>
          ${confirmationTime ? `<p><strong>Confirmation Time:</strong> ${new Date(confirmationTime).toLocaleString()}</p>` : ''}
        </div>
        
        <div style="background: #fff3cd; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #ffc107;">
          <h3>Next Steps</h3>
          <p>The refund is now in "processing" status and ready for Stripe processing.</p>
          ${this.createActionButton(`${this.getBaseUrl()}/admin/orders/${orderId}`, 'Process Refund', '#28a745')}
        </div>
        
        ${this.getEmailFooter()}
      `,
      priority: 'high'
    };
  }

  /**
   * 管理员通知模板 - 用户取消退款
   */
  public createRefundCancelledNotification(refundDetails: RefundDetails): EmailTemplate {
    const { orderId, userEmail, requestedAmount, cancellationTime } = refundDetails;
    
    return {
      subject: `❌ Refund Cancelled by User - Order #${orderId}`,
      html: `
        <h2>User Cancelled Refund Request</h2>
        <p>The customer has decided to cancel their approved refund request.</p>
        
        <div style="background: #f8d7da; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #dc3545;">
          <h3>Cancellation Details</h3>
          <p><strong>Order ID:</strong> #${orderId}</p>
          <p><strong>Customer Email:</strong> ${userEmail}</p>
          <p><strong>Cancelled Amount:</strong> $${requestedAmount.toFixed(2)}</p>
          ${cancellationTime ? `<p><strong>Cancellation Time:</strong> ${new Date(cancellationTime).toLocaleString()}</p>` : ''}
        </div>
        
        <div style="background: #d1ecf1; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #17a2b8;">
          <h3>Status Update</h3>
          <p>The refund status has been reset and the customer can submit a new refund request if needed.</p>
          <p>No further action is required unless the customer submits a new request.</p>
        </div>
        
        ${this.getEmailFooter()}
      `,
      priority: 'normal'
    };
  }

  /**
   * 用户通知模板 - 订单创建
   */
  public createOrderCreatedNotification(orderDetails: OrderDetails): EmailTemplate {
    const { orderId } = orderDetails;
    
    return {
      subject: `Order Confirmation - PCB Order #${orderId}`,
      html: `
        <h2>Thank You for Your Order!</h2>
        <p>Your PCB order has been successfully created and is now waiting for admin review.</p>
        
        <div style="background: #d4edda; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #28a745;">
          <h3>Order Information</h3>
          <p><strong>Order ID:</strong> #${orderId}</p>
          <p><strong>Status:</strong> Waiting for Review</p>
        </div>
        
        <div style="background: #d1ecf1; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #17a2b8;">
          <h3>What's Next?</h3>
          <p>Our team will review your order and provide a quote within 24 hours.</p>
          <p>You'll receive an email notification once the review is complete.</p>
          ${this.createActionButton(`${this.getBaseUrl()}/profile/orders/${orderId}`, 'View Order Details')}
        </div>
        
        ${this.getEmailFooter()}
      `,
      priority: 'normal'
    };
  }

  /**
   * 用户通知模板 - 订单更新
   */
  public createOrderUpdatedNotification(orderDetails: OrderDetails): EmailTemplate {
    const { orderId, status } = orderDetails;
    
    return {
      subject: `Order Update - PCB Order #${orderId}`,
      html: `
        <h2>Order Status Update</h2>
        <p>Your PCB order has been updated.</p>
        
        <div style="background: #d1ecf1; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #17a2b8;">
          <h3>Updated Information</h3>
          <p><strong>Order ID:</strong> #${orderId}</p>
          ${status ? `<p><strong>New Status:</strong> ${status}</p>` : ''}
        </div>
        
        <div style="background: #fff3cd; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #ffc107;">
          <h3>View Details</h3>
          <p>Please check your order details for the latest information.</p>
          ${this.createActionButton(`${this.getBaseUrl()}/profile/orders/${orderId}`, 'View Order Details')}
        </div>
        
        ${this.getEmailFooter()}
      `,
      priority: 'normal'
    };
  }

  /**
   * 用户通知模板 - 退款处理完成
   */
  public createRefundProcessedNotification(refundDetails: RefundDetails): EmailTemplate {
    const { orderId, requestedAmount } = refundDetails;
    
    return {
      subject: `Refund Processed - Order #${orderId}`,
      html: `
        <h2>Your Refund Has Been Processed</h2>
        <p>Good news! Your refund request has been successfully processed.</p>
        
        <div style="background: #d4edda; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #28a745;">
          <h3>Refund Details</h3>
          <p><strong>Order ID:</strong> #${orderId}</p>
          <p><strong>Refund Amount:</strong> $${requestedAmount.toFixed(2)}</p>
          <p><strong>Status:</strong> Completed</p>
        </div>
        
        <div style="background: #d1ecf1; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #17a2b8;">
          <h3>What's Next?</h3>
          <p>The refund will appear in your original payment method within 5-10 business days.</p>
          <p>If you have any questions, please don't hesitate to contact our customer service.</p>
        </div>
        
        ${this.getEmailFooter()}
      `,
      priority: 'normal'
    };
  }

  /**
   * 创建自定义模板
   */
  public createCustomTemplate(
    subject: string,
    content: string,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): EmailTemplate {
    return {
      subject,
      html: `
        ${content}
        ${this.getEmailFooter()}
      `,
      priority
    };
  }
}

// 导出单例实例
export const emailTemplateService = EmailTemplateService.getInstance(); 