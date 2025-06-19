import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const NOTIFICATION_INTERVALS = [90, 60, 30, 7, 1]; // days
const FROM_EMAIL = 'techicalcubs@gmail.com';
const TO_EMAIL = 'info@cubstechnical.com';

interface VisaRecord {
  employee_id: string;
  emp_id: string;
  name: string;
  email_id: string;
  company_name: string;
  visa_expiry_date: string;
  days_until_expiry: number;
  urgency_level: string;
  trade: string;
  nationality: string;
  passport_no: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { manual = false, employeeId = null, interval = null } = await req.json().catch(() => ({}));
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`🔔 Starting visa notification process - Manual: ${manual}, EmployeeId: ${employeeId}, Interval: ${interval}`);

    let expiringVisas: VisaRecord[] = [];

    if (manual && employeeId) {
      // Manual notification for specific employee
      const { data, error } = await supabaseClient
        .from('employees')
        .select('*')
        .eq('employee_id', employeeId)
        .not('visa_expiry_date', 'is', null)
        .single();

      if (error) throw new Error(`Failed to fetch employee: ${error.message}`);
      
      if (data) {
        const daysUntilExpiry = Math.ceil(
          (new Date(data.visa_expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        
        expiringVisas = [{
          employee_id: data.id,
          emp_id: data.employee_id,
          name: data.name,
          email_id: data.email_id,
          company_name: data.company_name,
          visa_expiry_date: data.visa_expiry_date,
          days_until_expiry: daysUntilExpiry,
          urgency_level: getUrgencyLevel(daysUntilExpiry),
          trade: data.trade,
          nationality: data.nationality,
          passport_no: data.passport_no
        }];
      }
    } else {
      // Automated notification for specific intervals or all intervals
      const intervalsToCheck = interval ? [interval] : NOTIFICATION_INTERVALS;
      
      for (const days of intervalsToCheck) {
        const { data, error } = await supabaseClient
          .from('employees')
          .select('*')
          .not('visa_expiry_date', 'is', null);

        if (error) throw new Error(`Failed to fetch employees: ${error.message}`);

        if (data) {
          const filteredVisas = data.filter(employee => {
            const daysUntilExpiry = Math.ceil(
              (new Date(employee.visa_expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );
            return daysUntilExpiry === days;
          }).map(employee => {
            const daysUntilExpiry = Math.ceil(
              (new Date(employee.visa_expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );
            return {
              employee_id: employee.id,
              emp_id: employee.employee_id,
              name: employee.name,
              email_id: employee.email_id,
              company_name: employee.company_name,
              visa_expiry_date: employee.visa_expiry_date,
              days_until_expiry: daysUntilExpiry,
              urgency_level: getUrgencyLevel(daysUntilExpiry),
              trade: employee.trade,
              nationality: employee.nationality,
              passport_no: employee.passport_no
            };
          });

          expiringVisas.push(...filteredVisas);
        }
      }
    }

    console.log(`📧 Found ${expiringVisas.length} visas requiring notification`);

    if (expiringVisas.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No visa expiry notifications needed at this time',
        results: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Get email templates
    const { data: templates, error: templateError } = await supabaseClient
      .from('email_templates')
      .select('*')
      .eq('type', 'visa_reminder');

    if (templateError) throw new Error(`Failed to fetch email templates: ${templateError.message}`);

    // Process each expiring visa
    const results = await Promise.all(expiringVisas.map(async (visa) => {
      try {
        const template = selectTemplate(templates, visa.days_until_expiry);
        const emailData = createEmailData(visa, template, manual);

        // Send email using SendGrid
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(emailData)
        });

        const success = response.ok;
        let errorMessage = null;

        if (!success) {
          const errorText = await response.text();
          errorMessage = `SendGrid Error (${response.status}): ${errorText}`;
          console.error(`❌ Failed to send email for ${visa.name}:`, errorMessage);
        } else {
          console.log(`✅ Email sent successfully for ${visa.name} (${visa.days_until_expiry} days)`);
        }

        // Log the notification
        await supabaseClient.from('notification_logs').insert({
          type: 'visa_expiry',
          employee_id: visa.emp_id,
          days_until_expiry: visa.days_until_expiry,
          urgency: visa.urgency_level,
          sent_to: [TO_EMAIL],
          email_sent: success,
          errors: errorMessage ? [errorMessage] : [],
          manual_trigger: manual,
          notification_date: new Date().toISOString(),
          template_used: template?.name || 'default'
        });

        return {
          employee_id: visa.emp_id,
          employee_name: visa.name,
          days_until_expiry: visa.days_until_expiry,
          success,
          error: errorMessage
        };
      } catch (error) {
        console.error(`❌ Error processing visa for ${visa.name}:`, error);
        return {
          employee_id: visa.emp_id,
          employee_name: visa.name,
          days_until_expiry: visa.days_until_expiry,
          success: false,
          error: error.message
        };
      }
    }));

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    console.log(`📊 Notification Summary: ${successCount} sent, ${failureCount} failed`);

    return new Response(JSON.stringify({
      success: true,
      message: `Visa expiry notifications processed: ${successCount} sent, ${failureCount} failed`,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
        manual_trigger: manual
      },
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('❌ Fatal error in visa notification service:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

function getUrgencyLevel(days: number): string {
  if (days <= 1) return 'critical';
  if (days <= 7) return 'urgent';
  if (days <= 30) return 'warning';
  return 'notice';
}

function selectTemplate(templates: any[], daysUntilExpiry: number): any | null {
  let template = templates?.find(t => t.days_threshold === daysUntilExpiry);
  
  if (!template) {
    const sortedTemplates = templates?.sort((a, b) => Math.abs(a.days_threshold - daysUntilExpiry) - Math.abs(b.days_threshold - daysUntilExpiry));
    template = sortedTemplates?.[0];
  }
  
  return template || null;
}

function createEmailData(visa: VisaRecord, template: any, manual: boolean) {
  const defaultSubject = `${manual ? '[MANUAL] ' : ''}Visa Expiry Alert - ${visa.name} (${visa.days_until_expiry} days remaining)`;
  const defaultContent = createDefaultEmailContent(visa, manual);

  const subject = template?.subject 
    ? replaceTemplateVariables(template.subject, visa, manual)
    : defaultSubject;

  const content = template?.content 
    ? replaceTemplateVariables(template.content, visa, manual)
    : defaultContent;

  return {
    personalizations: [{
      to: [{ email: TO_EMAIL, name: 'CUBS Technical HR' }],
      subject
    }],
    from: {
      email: FROM_EMAIL,
      name: 'CUBS Visa Notification System'
    },
    content: [{
      type: 'text/html',
      value: content
    }],
    categories: ['visa-reminder', manual ? 'manual' : 'automated'],
    custom_args: {
      employee_id: visa.emp_id,
      days_until_expiry: visa.days_until_expiry.toString(),
      urgency: visa.urgency_level,
      manual: manual.toString()
    }
  };
}

function replaceTemplateVariables(text: string, visa: VisaRecord, manual: boolean): string {
  return text
    .replace(/\{\{employee_name\}\}/g, visa.name)
    .replace(/\{\{employee_id\}\}/g, visa.emp_id)
    .replace(/\{\{company_name\}\}/g, visa.company_name)
    .replace(/\{\{days_remaining\}\}/g, visa.days_until_expiry.toString())
    .replace(/\{\{visa_expiry_date\}\}/g, new Date(visa.visa_expiry_date).toLocaleDateString())
    .replace(/\{\{urgency_level\}\}/g, visa.urgency_level.toUpperCase())
    .replace(/\{\{trade\}\}/g, visa.trade || 'N/A')
    .replace(/\{\{nationality\}\}/g, visa.nationality || 'N/A')
    .replace(/\{\{passport_no\}\}/g, visa.passport_no || 'N/A')
    .replace(/\{\{notification_type\}\}/g, manual ? 'MANUAL' : 'AUTOMATED')
    .replace(/\{\{current_date\}\}/g, new Date().toLocaleDateString());
}

function createDefaultEmailContent(visa: VisaRecord, manual: boolean): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Visa Expiry Alert</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${visa.urgency_level === 'critical' ? '#dc2626' : visa.urgency_level === 'urgent' ? '#ea580c' : '#d97706'}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .alert-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 10px; }
        .critical { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        .urgent { background: #fff7ed; color: #ea580c; border: 1px solid #fed7aa; }
        .warning { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
        .notice { background: #f0f9ff; color: #0284c7; border: 1px solid #bae6fd; }
        .details { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🚨 Visa Expiry Alert ${manual ? '(Manual Notification)' : ''}</h2>
        </div>
        <div class="content">
          <div class="alert-badge ${visa.urgency_level}">
            ${visa.urgency_level.toUpperCase()} - ${visa.days_until_expiry} ${visa.days_until_expiry === 1 ? 'day' : 'days'} remaining
          </div>
          
          <div class="details">
            <h3>Employee Information</h3>
            <p><strong>Name:</strong> ${visa.name}</p>
            <p><strong>Employee ID:</strong> ${visa.emp_id}</p>
            <p><strong>Company:</strong> ${visa.company_name}</p>
            <p><strong>Trade:</strong> ${visa.trade || 'N/A'}</p>
            <p><strong>Nationality:</strong> ${visa.nationality || 'N/A'}</p>
            <p><strong>Passport No:</strong> ${visa.passport_no || 'N/A'}</p>
          </div>

          <div class="details">
            <h3>Visa Details</h3>
            <p><strong>Expiry Date:</strong> ${new Date(visa.visa_expiry_date).toLocaleDateString()}</p>
            <p><strong>Days Until Expiry:</strong> ${visa.days_until_expiry}</p>
            <p><strong>Urgency Level:</strong> ${visa.urgency_level.toUpperCase()}</p>
          </div>

          ${manual ? '<p><em>This notification was triggered manually by an administrator.</em></p>' : ''}
          
          <div class="footer">
            <p>This is an automated notification from the CUBS Visa Management System.</p>
            <p>Please take appropriate action to renew the visa before expiry.</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
} 