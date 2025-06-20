import { supabase } from './supabase';

export interface VisaTestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class VisaAutomationService {
  private static readonly FUNCTION_URL = 'https://tndfjsjemqjgagtsqudr.supabase.co/functions/v1/send-visa-notifications';

  /**
   * Test the visa automation function
   */
  static async testVisaAutomation(): Promise<VisaTestResult> {
    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return {
          success: false,
          message: 'No active session found',
          error: 'Authentication required'
        };
      }

      // Call the Edge Function
      const response = await fetch(this.FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          manual: true,
          test: true
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          message: 'Visa automation test successful! Check your email for notifications.',
          data: result
        };
      } else {
        return {
          success: false,
          message: 'Function returned an error',
          error: result.error || 'Unknown error',
          data: result
        };
      }
    } catch (error) {
      console.error('Visa automation test failed:', error);
      return {
        success: false,
        message: 'Test failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Test specific interval
   */
  static async testInterval(interval: number): Promise<VisaTestResult> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return {
          success: false,
          message: 'No active session found',
          error: 'Authentication required'
        };
      }

      const response = await fetch(this.FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interval: interval,
          test: true
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          message: `Tested ${interval}-day interval successfully`,
          data: result
        };
      } else {
        return {
          success: false,
          message: 'Function returned an error',
          error: result.error || 'Unknown error',
          data: result
        };
      }
    } catch (error) {
      console.error('Visa automation interval test failed:', error);
      return {
        success: false,
        message: 'Test failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Test specific employee
   */
  static async testEmployee(employeeId: string): Promise<VisaTestResult> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return {
          success: false,
          message: 'No active session found',
          error: 'Authentication required'
        };
      }

      const response = await fetch(this.FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          manual: true,
          employeeId: employeeId,
          test: true
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          message: `Tested employee ${employeeId} successfully`,
          data: result
        };
      } else {
        return {
          success: false,
          message: 'Function returned an error',
          error: result.error || 'Unknown error',
          data: result
        };
      }
    } catch (error) {
      console.error('Visa automation employee test failed:', error);
      return {
        success: false,
        message: 'Test failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get notification logs
   */
  static async getNotificationLogs(limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('notification_logs')
        .select('*')
        .eq('type', 'visa_expiry')
        .order('notification_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching notification logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching notification logs:', error);
      return [];
    }
  }

  /**
   * Get visa expiry statistics
   */
  static async getVisaStats(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('employee_table')
        .select('visa_expiry_date')
        .not('visa_expiry_date', 'is', null);

      if (error) {
        console.error('Error fetching visa stats:', error);
        return null;
      }

      const today = new Date();
      const stats = {
        total: data.length,
        expiring_30_days: 0,
        expiring_7_days: 0,
        expiring_1_day: 0,
        expired: 0
      };

      data.forEach(employee => {
        const expiryDate = new Date(employee.visa_expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry < 0) {
          stats.expired++;
        } else if (daysUntilExpiry <= 1) {
          stats.expiring_1_day++;
        } else if (daysUntilExpiry <= 7) {
          stats.expiring_7_days++;
        } else if (daysUntilExpiry <= 30) {
          stats.expiring_30_days++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching visa stats:', error);
      return null;
    }
  }
} 