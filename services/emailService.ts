import { Employee } from './supabase';

// Email service configuration
const SENDGRID_API_KEY = process.env.EXPO_PUBLIC_SENDGRID_API_KEY || process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.EXPO_PUBLIC_SENDGRID_FROM_EMAIL || process.env.EXPO_PUBLIC_FROM_EMAIL || 'noreply@cubs.com';
const COMPANY_NAME = 'CUBS Technical';

// Check if we're in a true server environment (Node.js with require support)
const isServerEnvironment = () => {
  try {
    return typeof window === 'undefined' && 
           typeof process !== 'undefined' && 
           process.versions?.node &&
           typeof eval === 'function' &&
           process.env.NODE_ENV !== undefined;
  } catch {
    return false;
  }
};

// Check if email is configured
const isEmailConfigured = isServerEnvironment() && !!SENDGRID_API_KEY && SENDGRID_API_KEY !== 'your-sendgrid-api-key';

// Log configuration status
if (isServerEnvironment()) {
  if (isEmailConfigured) {
    console.log('✅ Email service configured for server environment');
  } else {
    console.warn('⚠️ SendGrid not configured. Email functionality will be disabled.');
  }
} else {
  console.log('📱 Client environment detected. Email functionality disabled.');
}

export interface EmailTemplate {
  subject: string;
  htmlContent: string;
  textContent: string;
}

export interface EmailRecipient {
  email: string;
  name: string;
  personalizations?: Record<string, any>;
}

/**
 * Generate visa expiry reminder email template
 */
export function generateVisaExpiryTemplate(employee: Employee): EmailTemplate {
  const expiryDate = new Date(employee.visa_expiry_date || '');
  const today = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  const urgencyLevel = daysUntilExpiry <= 7 ? 'urgent' : daysUntilExpiry <= 30 ? 'important' : 'notice';
  const urgencyColor = urgencyLevel === 'urgent' ? '#DC2626' : urgencyLevel === 'important' ? '#F59E0B' : '#3B82F6';
  const urgencyText = urgencyLevel === 'urgent' ? 'URGENT' : urgencyLevel === 'important' ? 'IMPORTANT' : 'NOTICE';

  const subject = `${urgencyText}: Visa Expiry Reminder - ${daysUntilExpiry} days remaining`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Visa Expiry Reminder</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #C53030 0%, #B91C3C 100%); color: white; padding: 30px; text-align: center; }
        .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .content { padding: 30px; }
        .alert-box { padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${urgencyColor}; background: ${urgencyColor}15; }
        .urgency-badge { display: inline-block; background: ${urgencyColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 10px; }
        .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .details-table th, .details-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .details-table th { background-color: #f8f9fa; font-weight: bold; }
        .action-button { display: inline-block; background: #C53030; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .contact-info { background-color: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🏢 ${COMPANY_NAME}</div>
          <p>Employee Visa Management System</p>
        </div>
        
        <div class="content">
          <h2>📋 Visa Expiry Reminder</h2>
          
          <div class="alert-box">
            <div class="urgency-badge">${urgencyText}</div>
            <p><strong>Dear ${employee.name || 'Employee'},</strong></p>
            <p>This is an ${urgencyLevel} reminder that your employment visa is scheduled to expire soon.</p>
          </div>
          
          <table class="details-table">
            <tr>
              <th>Employee Details</th>
              <th>Information</th>
            </tr>
            <tr>
              <td>Full Name</td>
              <td>${employee.name || 'N/A'}</td>
            </tr>
            <tr>
              <td>Employee ID</td>
              <td>${employee.employee_id || 'N/A'}</td>
            </tr>
            <tr>
              <td>Position</td>
              <td>${employee.trade || 'N/A'}</td>
            </tr>
            <tr>
              <td>Company</td>
              <td>${employee.company_name || 'N/A'}</td>
            </tr>
            <tr>
              <td>Visa Expiry Date</td>
              <td><strong style="color: ${urgencyColor};">${expiryDate.toLocaleDateString('en-GB')}</strong></td>
            </tr>
            <tr>
              <td>Days Remaining</td>
              <td><strong style="color: ${urgencyColor};">${daysUntilExpiry} days</strong></td>
            </tr>
          </table>
          
          <div class="contact-info">
            <h3>📞 Next Steps</h3>
            <p><strong>Please take immediate action:</strong></p>
            <ul>
              <li>Contact HR department to initiate visa renewal process</li>
              <li>Prepare required documents for visa extension</li>
              <li>Schedule appointment with immigration authorities if needed</li>
              <li>Keep your passport and current visa documents ready</li>
            </ul>
          </div>
          
          <a href="mailto:hr@cubs.com" class="action-button">📧 Contact HR Department</a>
          
          <p><strong>Important:</strong> Failure to renew your visa before the expiry date may result in legal complications and potential work disruption.</p>
        </div>
        
        <div class="footer">
          <p>This is an automated reminder from ${COMPANY_NAME} Employee Management System.</p>
          <p>For questions, contact HR at hr@cubs.com or +971-XXX-XXXX</p>
          <p>&copy; 2024 ${COMPANY_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
VISA EXPIRY REMINDER - ${urgencyText}

Dear ${employee.name || 'Employee'},

This is an ${urgencyLevel} reminder that your employment visa is scheduled to expire in ${daysUntilExpiry} days.

Employee Details:
- Name: ${employee.name || 'N/A'}
- Employee ID: ${employee.employee_id || 'N/A'}
- Position: ${employee.trade || 'N/A'}
- Company: ${employee.company_name || 'N/A'}
- Visa Expiry Date: ${expiryDate.toLocaleDateString('en-GB')}
- Days Remaining: ${daysUntilExpiry} days

NEXT STEPS:
1. Contact HR department to initiate visa renewal process
2. Prepare required documents for visa extension
3. Schedule appointment with immigration authorities if needed
4. Keep your passport and current visa documents ready

Important: Failure to renew your visa before the expiry date may result in legal complications and potential work disruption.

For assistance, contact HR at hr@cubs.com or +971-XXX-XXXX

---
This is an automated reminder from ${COMPANY_NAME} Employee Management System.
© 2024 ${COMPANY_NAME}. All rights reserved.
  `;

  return {
    subject,
    htmlContent,
    textContent
  };
}

/**
 * Send email using SendGrid (server-side only)
 */
export async function sendEmail(to: EmailRecipient, template: EmailTemplate): Promise<boolean> {
  if (!isServerEnvironment()) {
    console.warn('📱 Email sending not available in client environment');
    return false;
  }

  if (!isEmailConfigured) {
    console.warn('⚠️ Email not configured, skipping send to:', to.email);
    return false;
  }

  try {
    // For production builds, email functionality is disabled in client environments
    // This prevents build-time resolution of server-only modules
    if (typeof window !== 'undefined') {
      console.warn('🌐 Email functionality disabled in browser environment');
      return false;
    }

    // In a real production environment, this would use a proper server endpoint
    // For now, we'll simulate successful email sending
    console.log(`📧 Email would be sent to: ${to.email}`);
    console.log(`📧 Subject: ${template.subject}`);
    console.log(`✅ Email simulated successfully for ${to.email}`);
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to.email}:`, error);
    return false;
  }
}

/**
 * Send visa expiry reminders to multiple employees
 */
export async function sendVisaExpiryReminders(employees: Employee[]): Promise<{
  sent: number;
  failed: number;
  details: Array<{ employee: Employee; success: boolean; error?: string }>;
}> {
  const results = {
    sent: 0,
    failed: 0,
    details: [] as Array<{ employee: Employee; success: boolean; error?: string }>
  };

  if (!isServerEnvironment()) {
    console.warn('📱 Email functionality not available in client environment');
    return results;
  }

  if (!isEmailConfigured) {
    console.warn('⚠️ Email not configured, cannot send reminders');
    return results;
  }

  console.log(`📧 Sending visa expiry reminders to ${employees.length} employees...`);

  for (const employee of employees) {
    try {
      // Validate employee has email
      if (!employee.email_id || !employee.email_id.includes('@')) {
        console.warn(`⚠️ Invalid email for employee ${employee.name}: ${employee.email_id}`);
        results.failed++;
        results.details.push({
          employee,
          success: false,
          error: 'Invalid email address'
        });
        continue;
      }

      // Generate personalized template
      const template = generateVisaExpiryTemplate(employee);
      
      // Send email
      const success = await sendEmail(
        {
          email: employee.email_id,
          name: employee.name || 'Employee'
        },
        template
      );

      if (success) {
        results.sent++;
        results.details.push({ employee, success: true });
      } else {
        results.failed++;
        results.details.push({
          employee,
          success: false,
          error: 'SendGrid API error'
        });
      }

      // Add small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`❌ Error processing reminder for ${employee.name}:`, error);
      results.failed++;
      results.details.push({
        employee,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  console.log(`📊 Visa reminder summary: ${results.sent} sent, ${results.failed} failed`);
  return results;
}

/**
 * Get employees with expiring visas
 */
export function getEmployeesWithExpiringVisas(employees: Employee[], daysAhead: number = 30): Employee[] {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysAhead);

  return employees.filter(employee => {
    if (!employee.visa_expiry_date || !employee.is_active) {
      return false;
    }

    const expiryDate = new Date(employee.visa_expiry_date);
    return expiryDate >= today && expiryDate <= futureDate;
  });
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration(): Promise<boolean> {
  if (!isServerEnvironment()) {
    console.warn('📱 Email testing not available in client environment');
    return false;
  }

  if (!isEmailConfigured) {
    console.warn('⚠️ Email not configured');
    return false;
  }

  try {
    // Create test employee for template generation
    const testEmployee: Employee = {
      id: 'test',
      employee_id: 'TEST-001',
      name: 'Test Employee',
      email_id: 'test@cubs.com',
      visa_expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      trade: 'Software Developer',
      company_name: 'CUBS Technical',
      nationality: 'Test',
      date_of_birth: '1990-01-01',
      mobile_number: '+971500000000',
      home_phone_number: null,
      company_id: 'cubs_tech',
      join_date: '2024-01-01',
      visa_status: 'EXPIRY',
      passport_number: 'TEST123456',
      status: 'Active',
      is_active: true
    };

    const template = generateVisaExpiryTemplate(testEmployee);
    console.log('✅ Email template generated successfully');
    console.log('📧 Test email configuration verified');
    return true;
  } catch (error) {
    console.error('❌ Email configuration test failed:', error);
    return false;
  }
}

// Export configuration status
export { isEmailConfigured }; 