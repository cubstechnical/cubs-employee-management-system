import { supabase, isSupabaseConfigured, Employee } from './supabase';
import { sendVisaExpiryReminders, getEmployeesWithExpiringVisas } from './emailService';

export interface ReminderSchedule {
  id: string;
  name: string;
  daysBeforeExpiry: number;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

// Default reminder schedules
export const DEFAULT_REMINDER_SCHEDULES: ReminderSchedule[] = [
  {
    id: 'urgent',
    name: 'Urgent Reminder',
    daysBeforeExpiry: 7,
    enabled: true
  },
  {
    id: 'important', 
    name: 'Important Reminder',
    daysBeforeExpiry: 30,
    enabled: true
  },
  {
    id: 'early',
    name: 'Early Warning',
    daysBeforeExpiry: 60,
    enabled: false
  }
];

/**
 * Fetch all active employees from Supabase
 */
async function fetchAllActiveEmployees(): Promise<Employee[]> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, cannot fetch employees');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('is_active', true)
      .not('visa_expiry_date', 'is', null)
      .not('email_id', 'is', null);

    if (error) {
      console.error('Error fetching employees:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchAllActiveEmployees:', error);
    return [];
  }
}

/**
 * Log reminder activity to Supabase (if notifications table exists)
 */
async function logReminderActivity(
  employeeId: string, 
  reminderType: string, 
  success: boolean, 
  details?: string
): Promise<void> {
  if (!isSupabaseConfigured) return;

  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: employeeId,
        type: 'visa_reminder',
        message: `${reminderType} visa expiry reminder ${success ? 'sent' : 'failed'}`,
        read: false,
        category: 'visa_expiry',
        metadata: {
          reminderType,
          success,
          details,
          timestamp: new Date().toISOString()
        }
      });

    if (error) {
      console.error('Error logging reminder activity:', error);
    }
  } catch (error) {
    console.error('Error in logReminderActivity:', error);
  }
}

/**
 * Process automatic visa expiry reminders for a specific schedule
 */
export async function processAutomaticReminders(schedule: ReminderSchedule): Promise<{
  processed: number;
  sent: number;
  failed: number;
  details: Array<{ employee: Employee; success: boolean; error?: string }>;
}> {
  console.log(`🔄 Processing automatic reminders for schedule: ${schedule.name} (${schedule.daysBeforeExpiry} days)`);

  const result = {
    processed: 0,
    sent: 0,
    failed: 0,
    details: [] as Array<{ employee: Employee; success: boolean; error?: string }>
  };

  try {
    // Fetch all active employees
    const allEmployees = await fetchAllActiveEmployees();
    console.log(`📊 Found ${allEmployees.length} active employees`);

    // Filter employees with visas expiring in the specified timeframe
    const expiringEmployees = getEmployeesWithExpiringVisas(allEmployees, schedule.daysBeforeExpiry);
    
    // Further filter to get only those expiring exactly in the target range
    // (to avoid sending the same reminder multiple times)
    const targetEmployees = expiringEmployees.filter(employee => {
      const expiryDate = new Date(employee.visa_expiry_date!);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // For 7-day reminders, send when 7 days or less remain
      // For 30-day reminders, send when between 8-30 days remain
      // For 60-day reminders, send when between 31-60 days remain
      if (schedule.daysBeforeExpiry === 7) {
        return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
      } else if (schedule.daysBeforeExpiry === 30) {
        return daysUntilExpiry <= 30 && daysUntilExpiry > 7;
      } else if (schedule.daysBeforeExpiry === 60) {
        return daysUntilExpiry <= 60 && daysUntilExpiry > 30;
      }
      
      return daysUntilExpiry <= schedule.daysBeforeExpiry && daysUntilExpiry > 0;
    });

    console.log(`🎯 Found ${targetEmployees.length} employees needing ${schedule.name} reminders`);

    if (targetEmployees.length === 0) {
      console.log('✅ No reminders needed for this schedule');
      return result;
    }

    result.processed = targetEmployees.length;

    // Send reminders
    const emailResults = await sendVisaExpiryReminders(targetEmployees);
    result.sent = emailResults.sent;
    result.failed = emailResults.failed;
    result.details = emailResults.details;

    // Log each reminder attempt
    for (const detail of emailResults.details) {
      await logReminderActivity(
        detail.employee.id,
        schedule.name,
        detail.success,
        detail.error
      );
    }

    console.log(`✅ Automatic reminder processing complete: ${result.sent} sent, ${result.failed} failed`);

  } catch (error) {
    console.error(`❌ Error processing automatic reminders for ${schedule.name}:`, error);
  }

  return result;
}

/**
 * Run all enabled automatic reminder schedules
 */
export async function runAllAutomaticReminders(): Promise<{
  totalProcessed: number;
  totalSent: number;
  totalFailed: number;
  scheduleResults: Array<{ schedule: ReminderSchedule; result: any }>;
}> {
  console.log('🚀 Starting automatic visa reminder processing...');

  const summary = {
    totalProcessed: 0,
    totalSent: 0,
    totalFailed: 0,
    scheduleResults: [] as Array<{ schedule: ReminderSchedule; result: any }>
  };

  for (const schedule of DEFAULT_REMINDER_SCHEDULES) {
    if (!schedule.enabled) {
      console.log(`⏭️ Skipping disabled schedule: ${schedule.name}`);
      continue;
    }

    try {
      const result = await processAutomaticReminders(schedule);
      
      summary.totalProcessed += result.processed;
      summary.totalSent += result.sent;
      summary.totalFailed += result.failed;
      summary.scheduleResults.push({ schedule, result });

      // Update last run time
      schedule.lastRun = new Date().toISOString();

    } catch (error) {
      console.error(`❌ Error running schedule ${schedule.name}:`, error);
      summary.scheduleResults.push({ 
        schedule, 
        result: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }

    // Add delay between schedules to avoid overwhelming the email service
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`🏁 Automatic reminder processing complete. Total: ${summary.totalSent} sent, ${summary.totalFailed} failed`);
  return summary;
}

/**
 * Generate a cron-compatible schedule for automatic reminders
 * This function can be called by external cron services
 */
export async function cronJobHandler(): Promise<void> {
  try {
    console.log('⏰ Cron job triggered for automatic visa reminders');
    const results = await runAllAutomaticReminders();
    
    // Log summary to console (or could be sent to monitoring service)
    console.log('📈 Cron job summary:', JSON.stringify(results, null, 2));
    
  } catch (error) {
    console.error('❌ Cron job failed:', error);
    throw error; // Re-throw for external error handling
  }
}

/**
 * Test automatic reminder functionality
 */
export async function testAutomaticReminders(): Promise<boolean> {
  try {
    console.log('🧪 Testing automatic reminder functionality...');
    
    // Test fetching employees
    const employees = await fetchAllActiveEmployees();
    console.log(`✅ Successfully fetched ${employees.length} employees`);
    
    // Test filtering logic without sending emails
    for (const schedule of DEFAULT_REMINDER_SCHEDULES) {
      const expiringEmployees = getEmployeesWithExpiringVisas(employees, schedule.daysBeforeExpiry);
      console.log(`📊 Schedule "${schedule.name}": ${expiringEmployees.length} employees with expiring visas`);
    }
    
    console.log('✅ Automatic reminder test completed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Automatic reminder test failed:', error);
    return false;
  }
}

/**
 * Get reminder statistics for admin dashboard
 */
export async function getReminderStatistics(): Promise<{
  activeEmployees: number;
  expiring7Days: number;
  expiring30Days: number;
  expiring60Days: number;
  nextScheduledRun: string | null;
}> {
  try {
    const employees = await fetchAllActiveEmployees();
    
    return {
      activeEmployees: employees.length,
      expiring7Days: getEmployeesWithExpiringVisas(employees, 7).length,
      expiring30Days: getEmployeesWithExpiringVisas(employees, 30).length,
      expiring60Days: getEmployeesWithExpiringVisas(employees, 60).length,
      nextScheduledRun: null // Could be calculated based on cron schedule
    };
  } catch (error) {
    console.error('Error getting reminder statistics:', error);
    return {
      activeEmployees: 0,
      expiring7Days: 0,
      expiring30Days: 0,
      expiring60Days: 0,
      nextScheduledRun: null
    };
  }
} 