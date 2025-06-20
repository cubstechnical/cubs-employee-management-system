import { supabase } from './supabase';
import { Employee } from '../types/employee';

export interface EmailComposition {
  subject: string;
  message: string;
  recipients: string[];
  recipientFilter?: 'all' | 'visa_expiring' | 'custom';
  scheduledAt?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  category: 'visa_reminder' | 'general' | 'welcome' | 'custom';
  created_at: string;
}

export interface EmailHistory {
  id: string;
  subject: string;
  message: string;
  recipients: number;
  sent_at: string;
  success_count: number;
  failed_count: number;
  status: 'sending' | 'sent' | 'failed' | 'scheduled';
  error_details?: string;
}

// ENHANCED: Pre-defined email templates
export const EMAIL_TEMPLATES: Omit<EmailTemplate, 'id' | 'created_at'>[] = [
  {
    name: 'Visa Expiry Reminder',
    subject: 'Urgent: Visa Renewal Required - {{employee_name}}',
    body: `Dear {{employee_name}},

This is a friendly reminder that your visa is set to expire on {{visa_expiry_date}}.

To avoid any complications, please ensure your visa renewal process is initiated immediately.

Required Actions:
• Contact HR department for renewal assistance
• Prepare necessary documentation
• Schedule appointment with immigration office

If you have already initiated the renewal process, please update us with the status.

Best regards,
{{company_name}} HR Team

Note: This is an automated message. Please do not reply to this email.`,
    variables: ['employee_name', 'visa_expiry_date', 'company_name'],
    category: 'visa_reminder'
  },
  {
    name: 'Welcome New Employee',
    subject: 'Welcome to {{company_name}} - {{employee_name}}',
    body: `Dear {{employee_name}},

Welcome to {{company_name}}! We are excited to have you join our team as a {{trade}}.

Your employee details:
• Employee ID: {{employee_id}}
• Trade: {{trade}}
• Start Date: {{join_date}}

What to expect:
• Orientation session on your first day
• IT setup and access provisioning
• Introduction to your team and supervisor

If you have any questions before your start date, please feel free to contact us.

Welcome aboard!

Best regards,
{{company_name}} HR Team`,
    variables: ['employee_name', 'company_name', 'trade', 'employee_id', 'join_date'],
    category: 'welcome'
  },
  {
    name: 'Document Submission Reminder',
    subject: 'Action Required: Document Submission - {{employee_name}}',
    body: `Dear {{employee_name}},

We notice that some required documents are pending from your end.

Please submit the following at your earliest convenience:
• Updated passport copy
• Medical certificate
• Educational certificates
• Any other pending documents

You can submit these documents through our employee portal or contact HR directly.

Time-sensitive: Please complete submission within 7 days.

Best regards,
{{company_name}} HR Team`,
    variables: ['employee_name', 'company_name'],
    category: 'general'
  }
];

// ENHANCED: Variable replacement function
const replaceVariables = (template: string, employee: Employee, additionalVars: Record<string, string> = {}): string => {
  let result = template;
  
  // Employee-specific variables
  const variables = {
    employee_name: employee.name || 'Employee',
    employee_id: employee.employee_id || 'N/A',
    email_id: employee.email_id || '',
    trade: employee.trade || 'Staff',
    company_name: employee.company_name || 'Company',
    nationality: employee.nationality || 'N/A',
    mobile_number: employee.mobile_number || 'N/A',
    date_of_birth: employee.date_of_birth || 'N/A',
    home_phone_number: employee.home_phone_number || null,
    company_id: employee.company_id || 'N/A',
    join_date: employee.join_date ? new Date(employee.join_date).toLocaleDateString() : 'N/A',
    visa_expiry_date: employee.visa_expiry_date ? new Date(employee.visa_expiry_date).toLocaleDateString() : 'N/A',
    passport_number: employee.passport_no || 'N/A',
    visa_status: employee.visa_status || 'N/A',
    status: employee.status || 'active',
    ...additionalVars
  };

  // Replace all variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, (value || '').toString());
  });

  // Clean up any remaining unreplaced variables
  result = result.replace(/{{[^}]+}}/g, '[Not Available]');

  return result;
};

// ENHANCED: Get employees based on filter criteria
export const getEmailRecipients = async (
  filter: 'all' | 'visa_expiring' | 'custom',
  customEmails?: string[]
): Promise<Employee[]> => {
  try {
    let query = supabase.from('employees').select('*');

    switch (filter) {
      case 'all':
        query = query.eq('is_active', true);
        break;
        
      case 'visa_expiring':
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        query = query
          .eq('is_active', true)
          .not('visa_expiry_date', 'is', null)
          .lte('visa_expiry_date', thirtyDaysFromNow.toISOString().split('T')[0]);
        break;
        
      case 'custom':
        if (customEmails && customEmails.length > 0) {
          query = query.in('email_id', customEmails);
        } else {
          return [];
        }
        break;
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching email recipients:', error);
    throw error;
  }
};

// ENHANCED: Send email using Supabase Edge Functions
export const sendManualEmail = async (
  composition: EmailComposition,
  onProgress?: (sent: number, total: number) => void
): Promise<EmailHistory> => {
  try {
    // Get recipients
    const recipients = await getEmailRecipients(
      composition.recipientFilter || 'custom',
      composition.recipients
    );

    if (recipients.length === 0) {
      throw new Error('No recipients found');
    }

    // Create email history record
    const { data: emailHistory, error: historyError } = await supabase
      .from('email_history')
      .insert({
        subject: composition.subject,
        message: composition.message,
        recipients: recipients.length,
        status: 'sending',
        sent_at: new Date().toISOString(),
        success_count: 0,
        failed_count: 0
      })
      .select()
      .single();

    if (historyError) throw historyError;

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Send emails in batches for better performance
    const batchSize = 10;
    const totalBatches = Math.ceil(recipients.length / batchSize);

    for (let i = 0; i < totalBatches; i++) {
      const batch = recipients.slice(i * batchSize, (i + 1) * batchSize);
      
      const batchPromises = batch.map(async (employee) => {
        try {
          // Replace variables in subject and message
          const personalizedSubject = replaceVariables(composition.subject, employee);
          const personalizedMessage = replaceVariables(composition.message, employee);

          // Call Supabase Edge Function for email sending
          const { data, error } = await supabase.functions.invoke('send-email', {
            body: {
              to: employee.email_id,
              subject: personalizedSubject,
              html: personalizedMessage.replace(/\n/g, '<br>'),
              text: personalizedMessage
            }
          });

          if (error) throw error;
          return { success: true, employee: employee.email_id };
        } catch (error) {
          console.error(`Failed to send email to ${employee.email_id}:`, error);
          return { 
            success: false, 
            employee: employee.email_id,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            successCount++;
          } else {
            failedCount++;
            errors.push(`${result.value.employee}: ${result.value.error}`);
          }
        } else {
          failedCount++;
          errors.push(`Batch error: ${result.reason}`);
        }
      });

      // Update progress
      const sentSoFar = (i + 1) * batchSize;
      onProgress?.(Math.min(sentSoFar, recipients.length), recipients.length);
    }

    // Update email history with final results
    const finalStatus = failedCount === 0 ? 'sent' : successCount > 0 ? 'sent' : 'failed';
    
    const { error: updateError } = await supabase
      .from('email_history')
      .update({
        status: finalStatus,
        success_count: successCount,
        failed_count: failedCount,
        error_details: errors.length > 0 ? errors.join('; ') : null
      })
      .eq('id', emailHistory.id);

    if (updateError) {
      console.error('Error updating email history:', updateError);
    }

    return {
      id: emailHistory.id,
      subject: composition.subject,
      message: composition.message,
      recipients: recipients.length,
      sent_at: emailHistory.sent_at,
      success_count: successCount,
      failed_count: failedCount,
      status: finalStatus,
      error_details: errors.length > 0 ? errors.join('; ') : undefined
    };

  } catch (error) {
    console.error('Error sending manual email:', error);
    throw error;
  }
};

// ENHANCED: Get email history
export const getEmailHistory = async (limit: number = 50): Promise<EmailHistory[]> => {
  try {
    const { data, error } = await supabase
      .from('email_history')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching email history:', error);
    throw error;
  }
};

// ENHANCED: Save email template
export const saveEmailTemplate = async (
  template: Omit<EmailTemplate, 'id' | 'created_at'>
): Promise<EmailTemplate> => {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .insert({
        ...template,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error saving email template:', error);
    throw error;
  }
};

// ENHANCED: Get email templates
export const getEmailTemplates = async (): Promise<EmailTemplate[]> => {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return EMAIL_TEMPLATES.map((template, index) => ({
      ...template,
      id: `default_${index}`,
      created_at: new Date().toISOString()
    }));
  }
};

// ENHANCED: Preview email with sample data
export const previewEmail = (
  template: string,
  sampleEmployee?: Partial<Employee>
): string => {
  const sample: Employee = {
    id: 'sample',
    name: sampleEmployee?.name || 'John Doe',
    email_id: sampleEmployee?.email_id || 'john.doe@example.com',
    employee_id: sampleEmployee?.employee_id || 'EMP001',
    trade: sampleEmployee?.trade || 'Software Engineer',
    company_name: sampleEmployee?.company_name || 'CUBS TECH CONTRACTING',
    nationality: sampleEmployee?.nationality || 'Indian',
    mobile_number: sampleEmployee?.mobile_number || '+971501234567',
    date_of_birth: sampleEmployee?.date_of_birth || '1990-01-01',
    home_phone_number: null,
    company_id: sampleEmployee?.company_id || 'cubs_tech',
    join_date: sampleEmployee?.join_date || '2023-01-01',
    visa_expiry_date: sampleEmployee?.visa_expiry_date || '2025-12-31',
    passport_no: sampleEmployee?.passport_no || 'A12345678',
    visa_status: sampleEmployee?.visa_status || 'ACTIVE',
    status: sampleEmployee?.status || 'active',
    is_active: true,
    created_at: new Date().toISOString()
  };

  return replaceVariables(template, sample);
};

export default {
  sendManualEmail,
  getEmailRecipients,
  getEmailHistory,
  saveEmailTemplate,
  getEmailTemplates,
  previewEmail,
  EMAIL_TEMPLATES
}; 