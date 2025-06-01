/**
 * SendGrid Email Service for CUBS Technical Contracting
 * Handles email notifications for visa expiry, approvals, and system notifications
 */

import { Platform } from 'react-native';

// Configuration from environment variables
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || process.env.EXPO_PUBLIC_SENDGRID_API_KEY || '';
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || process.env.EXPO_PUBLIC_SENDGRID_FROM_EMAIL || 'noreply@cubs-technical.com';

// Types
export interface EmailParams {
  to: string[];
  subject: string;
  htmlContent?: string;
  textContent?: string;
  templateId?: string;
  templateData?: Record<string, any>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  text?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

interface VisaExpiryEmailData {
  employeeName: string;
  expiryDate: string;
  daysRemaining: number;
  employeeId: string;
}

interface BulkEmailOptions {
  recipients: Array<{
    email: string;
    name?: string;
    customData?: Record<string, any>;
  }>;
  subject: string;
  html: string;
  from?: string;
}

// Demo mode flag - checks if SendGrid is configured
const isSendGridConfigured = (): boolean => {
  const apiKey = process.env.SENDGRID_API_KEY || process.env.EXPO_PUBLIC_SENDGRID_API_KEY;
  return !!(apiKey && apiKey !== 'your_sendgrid_api_key_here');
};

// Get configuration
const getConfig = () => {
  const apiKey = process.env.SENDGRID_API_KEY || process.env.EXPO_PUBLIC_SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.EXPO_PUBLIC_SENDGRID_FROM_EMAIL || 'noreply@cubs-technical.com';
  
  return { apiKey, fromEmail };
};

/**
 * Send a single email using SendGrid API
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  console.log('📧 [SENDGRID] Attempting to send email...');
  
  if (!isSendGridConfigured()) {
    console.log('📧 [SENDGRID] Demo mode - email would be sent:', {
      to: options.to,
      subject: options.subject,
      preview: options.html.substring(0, 100) + '...'
    });
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('📧 [SENDGRID] Demo email sent successfully!');
    return;
  }

  const { apiKey, fromEmail } = getConfig();
  
  if (!apiKey) {
    throw new Error('SendGrid API key not configured');
  }

  try {
    const toAddresses = Array.isArray(options.to) ? options.to : [options.to];
    
    const emailData = {
      personalizations: [{
        to: toAddresses.map(email => ({ email })),
        subject: options.subject,
        ...(options.dynamicTemplateData && { dynamic_template_data: options.dynamicTemplateData })
      }],
      from: { email: options.from || fromEmail },
      content: options.templateId ? undefined : [
        {
          type: 'text/html',
          value: options.html
        },
        ...(options.text ? [{
          type: 'text/plain',
          value: options.text
        }] : [])
      ],
      ...(options.templateId && { template_id: options.templateId })
    };

    console.log('📧 [SENDGRID] Sending email to:', toAddresses);

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('📧 [SENDGRID] Email send failed:', response.status, errorText);
      throw new Error(`SendGrid API error: ${response.status} ${errorText}`);
    }

    console.log('📧 [SENDGRID] Email sent successfully!');
  } catch (error) {
    console.error('📧 [SENDGRID] Email send error:', error);
    throw error;
  }
};

/**
 * Send bulk emails to multiple recipients
 */
export const sendBulkEmail = async (options: BulkEmailOptions): Promise<void> => {
  console.log('📧 [SENDGRID] Sending bulk email to', options.recipients.length, 'recipients');
  
  if (!isSendGridConfigured()) {
    console.log('📧 [SENDGRID] Demo mode - bulk email would be sent to:', 
      options.recipients.map(r => r.email)
    );
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('📧 [SENDGRID] Demo bulk email sent successfully!');
    return;
  }

  const { apiKey, fromEmail } = getConfig();
  
  if (!apiKey) {
    throw new Error('SendGrid API key not configured');
  }

  try {
    const emailData = {
      personalizations: options.recipients.map(recipient => ({
        to: [{ email: recipient.email, name: recipient.name }],
        subject: options.subject,
        ...(recipient.customData && { dynamic_template_data: recipient.customData })
      })),
      from: { email: options.from || fromEmail },
      content: [{
        type: 'text/html',
        value: options.html
      }]
    };

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('📧 [SENDGRID] Bulk email send failed:', response.status, errorText);
      throw new Error(`SendGrid API error: ${response.status} ${errorText}`);
    }

    console.log('📧 [SENDGRID] Bulk email sent successfully!');
  } catch (error) {
    console.error('📧 [SENDGRID] Bulk email send error:', error);
    throw error;
  }
};

/**
 * Send welcome email to new employee
 */
export const sendWelcomeEmail = async (
  employeeEmail: string,
  employeeName: string,
  loginInstructions?: string
): Promise<void> => {
  console.log('📧 [SENDGRID] Sending welcome email to:', employeeEmail);
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to CUBS Technical Contracting</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #DD1A51; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">Welcome to CUBS!</h1>
          <p style="margin: 10px 0 0 0;">Technical Contracting Excellence</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #ddd; border-top: none;">
          <h2 style="color: #DD1A51; margin-top: 0;">Welcome ${employeeName}!</h2>
          
          <p>We're excited to have you join the CUBS Technical Contracting team. Your employee profile has been created and you can now access our employee portal.</p>
          
          ${loginInstructions ? `
            <h3 style="color: #DD1A51;">Login Instructions:</h3>
            <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
              ${loginInstructions}
            </div>
          ` : ''}
          
          <h3 style="color: #DD1A51;">What's Next?</h3>
          <ul>
            <li>Complete your employee profile</li>
            <li>Upload required documents</li>
            <li>Review your visa information</li>
            <li>Set up notifications preferences</li>
          </ul>
          
          <p>If you have any questions, please don't hesitate to contact our HR team.</p>
        </div>
        
        <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #666;">
          <p><strong>CUBS Technical Contracting</strong><br>
          Human Resources Department</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: employeeEmail,
    subject: 'Welcome to CUBS Technical Contracting - Employee Portal Access',
    html: htmlContent,
  });
};

/**
 * Send document upload notification
 */
export const sendDocumentNotification = async (
  adminEmails: string[],
  employeeName: string,
  documentType: string,
  action: 'uploaded' | 'deleted' | 'updated'
): Promise<void> => {
  console.log('📧 [SENDGRID] Sending document notification...');
  
  const actionText = {
    uploaded: 'uploaded a new',
    deleted: 'deleted a',
    updated: 'updated a'
  };

  const subject = `📄 Document ${action.charAt(0).toUpperCase() + action.slice(1)}: ${employeeName} - ${documentType}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #DD1A51;">Document Update Notification</h2>
        
        <p><strong>${employeeName}</strong> has ${actionText[action]} <strong>${documentType}</strong> document.</p>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p><strong>Employee:</strong> ${employeeName}<br>
          <strong>Document Type:</strong> ${documentType}<br>
          <strong>Action:</strong> ${action.charAt(0).toUpperCase() + action.slice(1)}<br>
          <strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        <p>Please review the document in the admin dashboard if necessary.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="#" style="display: inline-block; background: #DD1A51; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View Document
          </a>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: adminEmails,
    subject,
    html: htmlContent,
  });
};

// Export configuration check
export const isSendGridEnabled = isSendGridConfigured;

// Helper function to generate notification email HTML
const generateNotificationEmail = (data: any[]) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563EB; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .employee { margin-bottom: 20px; padding: 15px; background: white; border-radius: 8px; }
        .urgent { border-left: 4px solid #EF4444; }
        .warning { border-left: 4px solid #F59E0B; }
        .info { border-left: 4px solid #3B82F6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Visa Expiry Notifications</h1>
        </div>
        <div class="content">
          ${data.map(emp => `
            <div class="employee ${getUrgencyClass(emp.daysRemaining)}">
              <h3>${emp.employeeName}</h3>
              <p><strong>Employee ID:</strong> ${emp.employeeId}</p>
              <p><strong>Company:</strong> ${emp.companyName}</p>
              <p><strong>Visa Expires:</strong> ${new Date(emp.expiryDate).toLocaleDateString()}</p>
              <p><strong>Days Remaining:</strong> ${emp.daysRemaining}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </body>
    </html>
  `;
};

// Helper function to generate plain text version
const generateNotificationText = (data: any[]) => {
  return data.map(emp => `
Visa Expiry Notification - ${emp.employeeName}
Employee ID: ${emp.employeeId}
Company: ${emp.companyName}
Visa Expires: ${new Date(emp.expiryDate).toLocaleDateString()}
Days Remaining: ${emp.daysRemaining}
${getUrgencyText(emp.daysRemaining)}
  `).join('\n\n');
};

const getUrgencyClass = (days: number) => {
  if (days <= 7) return 'urgent';
  if (days <= 15) return 'warning';
  return 'info';
};

const getUrgencyText = (days: number) => {
  if (days <= 7) return 'URGENT: Please take immediate action';
  if (days <= 15) return 'WARNING: Action required soon';
  return 'Please plan for renewal';
};

// Remove the problematic Node.js implementation and replace with fetch-based
export const sendVisaExpiryNotification = async (recipients: string[], data: any[]) => {
  const htmlContent = generateNotificationEmail(data);
  const textContent = generateNotificationText(data);
  
  return sendEmail({
    to: recipients,
    subject: 'Visa Expiry Notification',
    html: htmlContent,
    text: textContent,
  });
};

export const sendEmailUsingSendGrid = async (params: { to: string[], subject: string, htmlContent: string, textContent: string }) => {
  return sendEmail({
    to: params.to,
    subject: params.subject,
    html: params.htmlContent,
    text: params.textContent,
  });
};

/**
 * Send user approval notification
 */
export async function sendApprovalNotificationUsingSendGrid(
  userEmail: string,
  userName: string,
  approved: boolean,
  approvedBy: string
): Promise<EmailResult> {
  const subject = `Account ${approved ? 'Approved' : 'Rejected'} - CUBS Technical Contracting`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #DD1A51; color: white; padding: 20px; text-align: center;">
        <h1>CUBS Technical Contracting</h1>
        <h2>Account ${approved ? 'Approval' : 'Status'}</h2>
      </div>
      
      <div style="padding: 20px;">
        <p><strong>Dear ${userName},</strong></p>
        
        <div style="background: ${approved ? '#e8f5e8' : '#ffebee'}; 
                    border-left: 4px solid ${approved ? '#4caf50' : '#f44336'}; 
                    padding: 15px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: ${approved ? '#4caf50' : '#f44336'};">
            Your account has been ${approved ? 'approved' : 'rejected'}
          </h3>
          <p style="margin: 0;">
            <strong>Reviewed by:</strong> ${approvedBy}
          </p>
        </div>
        
        ${approved 
          ? '<p>You can now log in to the CUBS Employee Management System and access your dashboard.</p>'
          : '<p>Unfortunately, your account application has been rejected. Please contact HR for more information.</p>'
        }
        
        <p>For any questions, please contact:</p>
        <ul>
          <li>HR Department: hr@cubs-technical.com</li>
          <li>Phone: +971-XXX-XXXX</li>
        </ul>
        
        <p>Best regards,<br>
        CUBS Technical Contracting<br>
        Human Resources Department</p>
      </div>
      
      <div style="background: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; color: #666;">
        This is an automated notification from CUBS Technical Contracting.
      </div>
    </div>
  `;
  
  try {
    await sendEmailUsingSendGrid({
      to: [userEmail],
      subject,
      htmlContent,
      textContent: 'Your account status update.'
    });
    
    return {
      success: true,
      messageId: 'approval-notification-' + Date.now()
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send document upload notification
 */
export async function sendDocumentNotificationUsingSendGrid(
  recipientEmail: string,
  employeeName: string,
  documentType: string,
  action: 'uploaded' | 'updated' | 'deleted'
): Promise<EmailResult> {
  const subject = `Document ${action.charAt(0).toUpperCase() + action.slice(1)} - ${employeeName}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #DD1A51; color: white; padding: 20px; text-align: center;">
        <h1>CUBS Technical Contracting</h1>
        <h2>Document Notification</h2>
      </div>
      
      <div style="padding: 20px;">
        <p><strong>Document Update</strong></p>
        
        <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;">
            <strong>Employee:</strong> ${employeeName}<br>
            <strong>Document Type:</strong> ${documentType}<br>
            <strong>Action:</strong> ${action.charAt(0).toUpperCase() + action.slice(1)}
          </p>
        </div>
        
        <p>Please review the document changes in the employee management system.</p>
        
        <p>Best regards,<br>
        CUBS Technical Contracting<br>
        Document Management System</p>
      </div>
    </div>
  `;
  
  try {
    await sendEmailUsingSendGrid({
      to: [recipientEmail],
      subject,
      htmlContent,
      textContent: 'Your document update notification.'
    });
    
    return {
      success: true,
      messageId: 'document-notification-' + Date.now()
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send bulk notifications
 */
export async function sendBulkNotificationsUsingSendGrid(notifications: Array<{
  email: string;
  subject: string;
  content: string;
}>): Promise<EmailResult[]> {
  console.log(`Sending ${notifications.length} bulk notifications`);
  
  const results: EmailResult[] = [];
  
  // Send emails one by one to avoid rate limiting
  for (const notification of notifications) {
    try {
      await sendEmailUsingSendGrid({
        to: [notification.email],
        subject: notification.subject,
        htmlContent: notification.content,
        textContent: 'Your bulk notification.'
      });
      
      results.push({
        success: true,
        messageId: 'bulk-notification-' + Date.now()
      });
    } catch (error) {
      results.push({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    // Small delay between emails
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

/**
 * Validate email configuration
 */
export function validateEmailConfigUsingSendGrid(): { valid: boolean; error?: string } {
  if (!SENDGRID_API_KEY || SENDGRID_API_KEY === '') {
    return {
      valid: false,
      error: 'SendGrid API key not configured',
    };
  }
  
  if (!SENDGRID_FROM_EMAIL || SENDGRID_FROM_EMAIL === '') {
    return {
      valid: false,
      error: 'SendGrid from email not configured',
    };
  }
  
  return { valid: true };
}

// Export configuration for debugging
export const SENDGRID_CONFIG = {
  apiKeyConfigured: !!SENDGRID_API_KEY && SENDGRID_API_KEY !== '',
  fromEmail: SENDGRID_FROM_EMAIL,
  initialized: true,
}; 