import { supabase, Notification, Employee } from './supabase';
import { employeeService } from './employeeService';

interface SendEmailParams {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

interface VisaExpiryNotificationData {
  employee: Employee;
  daysUntilExpiry: number;
  expiryDate: string;
}

export interface NotificationLog {
  id: string;
  type: string;
  employee_id: string;
  days_until_expiry: number;
  urgency: string;
  sent_to: string[];
  email_sent: boolean;
  errors: string[];
  manual_trigger: boolean;
  notification_date: string;
  template_used: string;
  created_at: string;
}

export interface VisaNotificationRequest {
  manual?: boolean;
  employeeId?: string;
  interval?: number;
}

export interface NotificationResult {
  employee_id: string;
  employee_name: string;
  days_until_expiry: number;
  success: boolean;
  error?: string;
}

export interface NotificationResponse {
  success: boolean;
  message: string;
  summary?: {
    total: number;
    successful: number;
    failed: number;
    manual_trigger: boolean;
  };
  results: NotificationResult[];
  error?: string;
}

class NotificationService {
  private readonly SENDGRID_API_KEY = process.env.EXPO_PUBLIC_SENDGRID_API_KEY || 'your-sendgrid-api-key';
  private readonly SENDGRID_FROM_EMAIL = process.env.EXPO_PUBLIC_SENDGRID_FROM_EMAIL || 'noreply@cubstechnical.com';
  private readonly SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';
  private readonly baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  private readonly functionUrl = `${this.baseUrl}/functions/v1/send-visa-notifications`;

  async checkAndSendVisaExpiryNotifications(): Promise<void> {
    try {
      console.log('Starting visa expiry notification check...');
      
      // Get employees with visas expiring in the next 30, 15, 7, and 1 days
      const thresholds = [30, 15, 7, 1];
      
      for (const threshold of thresholds) {
        await this.processVisaExpiryForThreshold(threshold);
      }
      
      console.log('Visa expiry notification check completed');
    } catch (error) {
      console.error('Error in visa expiry notification check:', error);
      throw error;
    }
  }

  private async processVisaExpiryForThreshold(daysThreshold: number): Promise<void> {
    try {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysThreshold);
      
      // Get employees with visas expiring on the target date
      const { data: employees, error } = await supabase
        .from('employee_table')
        .select('*')
        .not('visa_expiry_date', 'is', null)
        .gte('visa_expiry_date', targetDate.toISOString().split('T')[0])
        .lt('visa_expiry_date', new Date(targetDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      if (error) throw error;

      for (const employee of employees || []) {
        // Check if we've already sent a notification for this threshold
        const existingNotification = await this.getExistingNotification(
          employee.id,
          employee.visa_expiry_date!,
          daysThreshold.toString()
        );

        if (!existingNotification) {
          await this.sendVisaExpiryNotification({
            employee,
            daysUntilExpiry: daysThreshold,
            expiryDate: employee.visa_expiry_date!,
          });

          // Record the notification
          await this.recordNotification(employee.id, 'visa_expiry', daysThreshold.toString(), '', {
            employeeId: employee.employee_id,
            companyName: employee.company_name,
            expiryDate: employee.visa_expiry_date!,
            daysUntilExpiry: daysThreshold,
            nationality: employee.nationality,
            trade: employee.trade,
          });
        }
      }
    } catch (error) {
      console.error(`Error processing visa expiry for ${daysThreshold} days threshold:`, error);
      throw error;
    }
  }

  private async sendVisaExpiryNotification(data: VisaExpiryNotificationData): Promise<void> {
    try {
      const { employee, daysUntilExpiry, expiryDate } = data;
      
      // Format the expiry date
      const formattedDate = new Date(expiryDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Create email content
      const subject = `URGENT: Visa Expiry Notice - ${employee.name} (${daysUntilExpiry} days remaining)`;
      
      const htmlContent = this.generateVisaExpiryEmailHTML({
        employeeName: employee.name,
        employeeId: employee.employee_id || 'N/A',
        companyName: employee.company_name,
        expiryDate: formattedDate,
        daysUntilExpiry,
        nationality: employee.nationality,
        trade: employee.trade,
      });

      const textContent = this.generateVisaExpiryEmailText({
        employeeName: employee.name,
        employeeId: employee.employee_id || 'N/A',
        companyName: employee.company_name,
        expiryDate: formattedDate,
        daysUntilExpiry,
        nationality: employee.nationality,
        trade: employee.trade,
      });

      // Send to HR team (you can configure multiple recipients)
      const hrEmails = [
        'hr@cubstechnical.com',
        'admin@cubstechnical.com',
        // Add more HR emails as needed
      ];

      for (const email of hrEmails) {
        await this.sendEmail({
          to: email,
          subject,
          htmlContent,
          textContent,
        });
      }

      console.log(`Visa expiry notification sent for ${employee.name} (${daysUntilExpiry} days)`);
    } catch (error) {
      console.error('Error sending visa expiry notification:', error);
      throw error;
    }
  }

  private async sendEmail(params: SendEmailParams): Promise<void> {
    try {
      const { to, subject, htmlContent, textContent } = params;

      const emailData = {
        personalizations: [
          {
            to: [{ email: to }],
            subject: subject,
          },
        ],
        from: { email: this.SENDGRID_FROM_EMAIL, name: 'CUBS Technical Contracting' },
        content: [
          {
            type: 'text/html',
            value: htmlContent,
          },
          ...(textContent ? [{
            type: 'text/plain',
            value: textContent,
          }] : []),
        ],
      };

      const response = await fetch(this.SENDGRID_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SendGrid API error: ${response.status} - ${errorText}`);
      }

      console.log(`Email sent successfully to ${to}`);
    } catch (error) {
      console.error('Error sending email via SendGrid:', error);
      throw error;
    }
  }

  private generateVisaExpiryEmailHTML(data: {
    employeeName: string;
    employeeId: string;
    companyName: string;
    expiryDate: string;
    daysUntilExpiry: number;
    nationality: string;
    trade: string;
  }): string {
    const urgencyColor = data.daysUntilExpiry <= 7 ? '#FF4444' : data.daysUntilExpiry <= 15 ? '#FF8800' : '#FFAA00';
    const urgencyText = data.daysUntilExpiry <= 7 ? 'CRITICAL' : data.daysUntilExpiry <= 15 ? 'URGENT' : 'ATTENTION REQUIRED';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Visa Expiry Notice</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: ${urgencyColor}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">${urgencyText}: VISA EXPIRY NOTICE</h1>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #ddd;">
            <h2 style="color: ${urgencyColor}; margin-top: 0;">Employee Visa Expiring in ${data.daysUntilExpiry} Days</h2>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">Employee Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; font-weight: bold;">Name:</td><td>${data.employeeName}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Employee ID:</td><td>${data.employeeId}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Company:</td><td>${data.companyName}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Nationality:</td><td>${data.nationality}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Trade:</td><td>${data.trade}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Visa Expiry Date:</td><td style="color: ${urgencyColor}; font-weight: bold;">${data.expiryDate}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Days Remaining:</td><td style="color: ${urgencyColor}; font-weight: bold;">${data.daysUntilExpiry} days</td></tr>
              </table>
            </div>

            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #856404;">Action Required:</h4>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Contact the employee immediately to arrange visa renewal</li>
                <li>Prepare necessary documentation for visa extension</li>
                <li>Coordinate with relevant authorities for renewal process</li>
                <li>Update employee records once renewal is complete</li>
              </ul>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
              <p>This is an automated notification from CUBS Technical Contracting Employee Management System.</p>
              <p>Generated on ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateVisaExpiryEmailText(data: {
    employeeName: string;
    employeeId: string;
    companyName: string;
    expiryDate: string;
    daysUntilExpiry: number;
    nationality: string;
    trade: string;
  }): string {
    const urgencyText = data.daysUntilExpiry <= 7 ? 'CRITICAL' : data.daysUntilExpiry <= 15 ? 'URGENT' : 'ATTENTION REQUIRED';

    return `
${urgencyText}: VISA EXPIRY NOTICE

Employee Visa Expiring in ${data.daysUntilExpiry} Days

Employee Details:
- Name: ${data.employeeName}
- Employee ID: ${data.employeeId}
- Company: ${data.companyName}
- Nationality: ${data.nationality}
- Trade: ${data.trade}
- Visa Expiry Date: ${data.expiryDate}
- Days Remaining: ${data.daysUntilExpiry} days

Action Required:
- Contact the employee immediately to arrange visa renewal
- Prepare necessary documentation for visa extension
- Coordinate with relevant authorities for renewal process
- Update employee records once renewal is complete

This is an automated notification from CUBS Technical Contracting Employee Management System.
Generated on ${new Date().toLocaleString()}
    `.trim();
  }

  private async getExistingNotification(
    userId: string,
    type: string,
    category: string
  ): Promise<Notification | null> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('type', type)
        .eq('category', category)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
      return data;
    } catch (error) {
      console.error('Error checking existing notification:', error);
      return null;
    }
  }

  private async recordNotification(
    userId: string,
    type: string,
    category: string,
    message: string,
    metadata?: any
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          category,
          message,
          read: false,
          metadata: metadata || {},
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error recording notification:', error);
      throw error;
    }
  }

  // Get notification history
  async getNotificationHistory(limit: number = 50): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notification history:', error);
      throw error;
    }
  }

  // Manual notification for testing
  async sendTestNotification(employeeId: string): Promise<void> {
    try {
      const employee = await employeeService.getEmployeeById(employeeId);
      if (!employee || !employee.visa_expiry_date) {
        return;
      }

      const expiryDate = new Date(employee.visa_expiry_date);
      const currentDate = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

      await this.sendVisaExpiryNotification({
        employee,
        daysUntilExpiry,
        expiryDate: employee.visa_expiry_date,
      });

      console.log(`Test notification sent for employee ${employee.name}`);
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }

  /**
   * Send automated visa expiry notifications for all configured intervals
   */
  async sendAutomatedNotifications(): Promise<NotificationResponse> {
    try {
      console.log('🔔 Triggering automated visa notifications...');
      
      const { data, error } = await supabase.functions.invoke('send-visa-notifications', {
        body: { manual: false }
      });

      if (error) {
        throw new Error(`Supabase function error: ${error.message}`);
      }

      console.log('✅ Automated notifications completed:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to send automated notifications:', error);
      throw error;
    }
  }

  /**
   * Send manual notification for a specific employee
   */
  async sendManualNotification(employeeId: string): Promise<NotificationResponse> {
    try {
      console.log(`🔔 Triggering manual visa notification for employee: ${employeeId}`);
      
      const { data, error } = await supabase.functions.invoke('send-visa-notifications', {
        body: { 
          manual: true, 
          employeeId 
        }
      });

      if (error) {
        throw new Error(`Supabase function error: ${error.message}`);
      }

      console.log('✅ Manual notification completed:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to send manual notification:', error);
      throw error;
    }
  }

  /**
   * Send notifications for a specific interval (e.g., only 30-day reminders)
   */
  async sendIntervalNotifications(interval: number): Promise<NotificationResponse> {
    try {
      console.log(`🔔 Triggering ${interval}-day interval notifications...`);
      
      const { data, error } = await supabase.functions.invoke('send-visa-notifications', {
        body: { 
          manual: false, 
          interval 
        }
      });

      if (error) {
        throw new Error(`Supabase function error: ${error.message}`);
      }

      console.log(`✅ ${interval}-day notifications completed:`, data);
      return data;
    } catch (error) {
      console.error(`❌ Failed to send ${interval}-day notifications:`, error);
      throw error;
    }
  }

  /**
   * Get notification logs with optional filtering
   */
  async getNotificationLogs(filters?: {
    employeeId?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    manualOnly?: boolean;
    limit?: number;
  }): Promise<NotificationLog[]> {
    try {
      // First, get the notification logs without the join
      let query = supabase
        .from('notification_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.employeeId) {
        query = query.eq('employee_id', filters.employeeId);
      }

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      if (filters?.manualOnly) {
        query = query.eq('manual_trigger', true);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data: logs, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch notification logs: ${error.message}`);
      }

      // If we have logs, enrich them with employee data
      if (logs && logs.length > 0) {
        const employeeIds = [...new Set(logs.map(log => log.employee_id))];
        
        // Get employee data separately
        const { data: employees, error: empError } = await supabase
          .from('employee_table')
          .select('id, name, employee_id, company_name')
          .in('id', employeeIds);

        if (empError) {
          console.warn('Could not fetch employee data for logs:', empError.message);
          // Return logs without employee data
          return logs.map(log => ({
            ...log,
            employee: null
          }));
        }

        // Create a map for quick lookup
        const employeeMap = new Map(employees?.map(emp => [emp.id, emp]) || []);

        // Enrich logs with employee data
        return logs.map(log => ({
          ...log,
          employee: employeeMap.get(log.employee_id) || null
        }));
      }

      return logs || [];
    } catch (error) {
      console.error('❌ Failed to get notification logs:', error);
      throw error;
    }
  }

  /**
   * Get employees with expiring visas
   */
  async getExpiringVisas(daysThreshold: number = 90): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('employee_table')
        .select('*')
        .not('visa_expiry_date', 'is', null)
        .lte('visa_expiry_date', new Date(Date.now() + daysThreshold * 24 * 60 * 60 * 1000).toISOString());

      if (error) {
        throw new Error(`Failed to fetch expiring visas: ${error.message}`);
      }

      return data?.map(employee => {
        const daysUntilExpiry = Math.ceil(
          (new Date(employee.visa_expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        
        return {
          ...employee,
          days_until_expiry: daysUntilExpiry,
          urgency_level: this.getUrgencyLevel(daysUntilExpiry)
        };
      }).filter(emp => emp.days_until_expiry >= 0) || [];
    } catch (error) {
      console.error('❌ Failed to get expiring visas:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(dateFrom?: string, dateTo?: string): Promise<{
    total: number;
    successful: number;
    failed: number;
    manual: number;
    automated: number;
    byUrgency: Record<string, number>;
    byDay: Record<string, number>;
  }> {
    try {
      let query = supabase
        .from('notification_logs')
        .select('*');

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch notification stats: ${error.message}`);
      }

      const logs = data || [];
      
      const stats = {
        total: logs.length,
        successful: logs.filter(log => log.email_sent).length,
        failed: logs.filter(log => !log.email_sent).length,
        manual: logs.filter(log => log.manual_trigger).length,
        automated: logs.filter(log => !log.manual_trigger).length,
        byUrgency: {} as Record<string, number>,
        byDay: {} as Record<string, number>
      };

      // Group by urgency
      logs.forEach(log => {
        stats.byUrgency[log.urgency] = (stats.byUrgency[log.urgency] || 0) + 1;
      });

      // Group by day
      logs.forEach(log => {
        const day = new Date(log.created_at).toISOString().split('T')[0];
        stats.byDay[day] = (stats.byDay[day] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('❌ Failed to get notification stats:', error);
      throw error;
    }
  }

  /**
   * Test notification system (send test email)
   */
  async testNotification(): Promise<{ success: boolean; message: string }> {
    try {
      // This would send a test notification to verify the system is working
      const { data, error } = await supabase.functions.invoke('send-visa-notifications', {
        body: { 
          manual: true, 
          test: true 
        }
      });

      if (error) {
        throw new Error(`Test notification failed: ${error.message}`);
      }

      return {
        success: true,
        message: 'Test notification sent successfully'
      };
    } catch (error) {
      console.error('❌ Test notification failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Test notification failed'
      };
    }
  }

  private getUrgencyLevel(days: number): string {
    if (days <= 1) return 'critical';
    if (days <= 7) return 'urgent';
    if (days <= 30) return 'warning';
    return 'notice';
  }

  /**
   * Schedule automatic notifications (this would typically be called by a cron job)
   */
  async scheduleNotifications(): Promise<void> {
    console.log('📅 Scheduling automatic visa notifications...');
    
    // In a production environment, this would set up cron jobs or scheduled tasks
    // For now, we can call this manually or set up GitHub Actions/Vercel Cron
    const intervals = [90, 60, 30, 7, 1];
    
    for (const interval of intervals) {
      try {
        await this.sendIntervalNotifications(interval);
        console.log(`✅ Scheduled ${interval}-day notifications`);
      } catch (error) {
        console.error(`❌ Failed to schedule ${interval}-day notifications:`, error);
      }
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService; 