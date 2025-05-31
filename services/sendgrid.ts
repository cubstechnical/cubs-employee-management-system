/**
 * SendGrid Email Service for CUBS Technical Contracting
 * Handles email notifications for visa expiry, approvals, and system notifications
 */

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
 * Send visa expiry notification email
 */
export const sendVisaExpiryNotification = async (
  adminEmails: string[],
  employees: VisaExpiryEmailData[]
): Promise<void> => {
  console.log('📧 [SENDGRID] Sending visa expiry notifications...');
  
  const urgentEmployees = employees.filter(emp => emp.daysRemaining <= 7);
  const warningEmployees = employees.filter(emp => emp.daysRemaining > 7 && emp.daysRemaining <= 30);
  
  const generateEmployeeList = (empList: VisaExpiryEmailData[], title: string) => {
    if (empList.length === 0) return '';
    
    return `
      <h3 style="color: #DD1A51; margin-top: 30px; margin-bottom: 15px;">${title}</h3>
      <ul style="list-style-type: none; padding: 0;">
        ${empList.map(emp => `
          <li style="background: #f9f9f9; margin: 10px 0; padding: 15px; border-left: 4px solid #DD1A51; border-radius: 4px;">
            <strong>${emp.employeeName}</strong><br>
            <span style="color: #666;">Visa expires: ${emp.expiryDate}</span><br>
            <span style="color: ${emp.daysRemaining <= 7 ? '#d32f2f' : '#f57c00'}; font-weight: bold;">
              ${emp.daysRemaining} day(s) remaining
            </span>
          </li>
        `).join('')}
      </ul>
    `;
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>CUBS - Visa Expiry Notification</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #DD1A51; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px 20px; border: 1px solid #ddd; border-top: none; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #666; }
        .urgent { background: #ffebee; border-left: 4px solid #d32f2f; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .warning { background: #fff3e0; border-left: 4px solid #f57c00; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .button { display: inline-block; background: #DD1A51; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">CUBS Technical Contracting</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Visa Expiry Notification</p>
        </div>
        
        <div class="content">
          <h2 style="color: #DD1A51; margin-top: 0;">⚠️ Action Required: Employee Visa Expiries</h2>
          
          <p>Dear Admin Team,</p>
          
          <p>This is an automated notification regarding upcoming employee visa expiries that require your immediate attention.</p>
          
          ${urgentEmployees.length > 0 ? `
            <div class="urgent">
              <h3 style="margin-top: 0; color: #d32f2f;">🚨 URGENT - Expiring within 7 days</h3>
              <p>The following employees have visas expiring within the next week:</p>
              ${generateEmployeeList(urgentEmployees, '')}
            </div>
          ` : ''}
          
          ${warningEmployees.length > 0 ? `
            <div class="warning">
              <h3 style="margin-top: 0; color: #f57c00;">⚠️ WARNING - Expiring within 30 days</h3>
              <p>The following employees have visas expiring within the next month:</p>
              ${generateEmployeeList(warningEmployees, '')}
            </div>
          ` : ''}
          
          <h3 style="color: #DD1A51;">Recommended Actions:</h3>
          <ul>
            <li><strong>Immediate Action Required:</strong> Contact employees with urgent expiries</li>
            <li><strong>Start Renewal Process:</strong> Begin visa renewal procedures for warning cases</li>
            <li><strong>Document Compliance:</strong> Ensure all required documents are up to date</li>
            <li><strong>HR Coordination:</strong> Coordinate with HR for employee communications</li>
          </ul>
          
          <p>Please log into the CUBS Admin Dashboard to view detailed employee information and take necessary actions.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" class="button" style="color: white;">Open Admin Dashboard</a>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>CUBS Technical Contracting</strong><br>
          Employee Management System<br>
          This is an automated notification. Please do not reply to this email.</p>
          
          <p style="margin-top: 20px; font-size: 12px;">
            Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const subject = urgentEmployees.length > 0 
    ? `🚨 URGENT: ${urgentEmployees.length} Visa(s) Expiring Soon - Immediate Action Required`
    : `⚠️ CUBS Visa Expiry Alert: ${employees.length} Visa(s) Expiring Within 30 Days`;

  await sendEmail({
    to: adminEmails,
    subject,
    html: htmlContent,
  });
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

/**
 * Send email using SendGrid
 */
export async function sendEmailUsingSendGrid(params: EmailParams): Promise<EmailResult> {
  try {
    console.log('Sending email via SendGrid:', params.subject);
    
    // For development/demo purposes, we'll simulate sending
    // In production, this would use the actual SendGrid API
    
    if (!SENDGRID_API_KEY || SENDGRID_API_KEY === '') {
      console.warn('SendGrid API key not configured, simulating email send');
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock successful response
    const messageId = `mock_message_${Date.now()}`;
    
    console.log('Mock email sent successfully:', {
      to: params.to,
      subject: params.subject,
      messageId,
    });
    
    return {
      success: true,
      messageId,
    };
  } catch (error) {
    console.error('SendGrid email error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Email send failed',
    };
  }
}

/**
 * Send visa expiry notification
 */
export async function sendVisaExpiryNotificationUsingSendGrid(
  employeeEmail: string,
  employeeName: string,
  expiryDate: string,
  daysUntilExpiry: number
): Promise<EmailResult> {
  const urgencyLevel = daysUntilExpiry <= 30 ? 'URGENT' : 'REMINDER';
  
  const subject = `${urgencyLevel}: Visa Expiry Notification - ${employeeName}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #DD1A51; color: white; padding: 20px; text-align: center;">
        <h1>CUBS Technical Contracting</h1>
        <h2>Visa Expiry Notification</h2>
      </div>
      
      <div style="padding: 20px;">
        <p><strong>Dear ${employeeName},</strong></p>
        
        <div style="background: ${daysUntilExpiry <= 30 ? '#ffebee' : '#fff3e0'}; 
                    border-left: 4px solid ${daysUntilExpiry <= 30 ? '#f44336' : '#ff9800'}; 
                    padding: 15px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: ${daysUntilExpiry <= 30 ? '#f44336' : '#ff9800'};">
            ${urgencyLevel}: Your visa expires in ${daysUntilExpiry} days
          </h3>
          <p style="margin: 0;">
            <strong>Expiry Date:</strong> ${new Date(expiryDate).toLocaleDateString()}
          </p>
        </div>
        
        <p>Please ensure you take the necessary steps to renew your visa before the expiry date.</p>
        
        <p>For assistance with visa renewal, please contact:</p>
        <ul>
          <li>HR Department: hr@cubs-technical.com</li>
          <li>Immigration Officer: immigration@cubs-technical.com</li>
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
  
  const textContent = `
    CUBS Technical Contracting - Visa Expiry Notification
    
    Dear ${employeeName},
    
    ${urgencyLevel}: Your visa expires in ${daysUntilExpiry} days
    Expiry Date: ${new Date(expiryDate).toLocaleDateString()}
    
    Please ensure you take the necessary steps to renew your visa before the expiry date.
    
    For assistance, contact:
    - HR Department: hr@cubs-technical.com
    - Immigration Officer: immigration@cubs-technical.com
    - Phone: +971-XXX-XXXX
    
    Best regards,
    CUBS Technical Contracting
    Human Resources Department
  `;
  
  return sendEmailUsingSendGrid({
    to: [employeeEmail],
    subject,
    htmlContent,
    textContent,
  });
}

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
  
  return sendEmailUsingSendGrid({
    to: [userEmail],
    subject,
    htmlContent,
  });
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
  
  return sendEmailUsingSendGrid({
    to: [recipientEmail],
    subject,
    htmlContent,
  });
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
    const result = await sendEmailUsingSendGrid({
      to: [notification.email],
      subject: notification.subject,
      htmlContent: notification.content,
    });
    results.push(result);
    
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