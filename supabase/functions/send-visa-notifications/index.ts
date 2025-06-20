import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const NOTIFICATION_INTERVALS = [90, 60, 30, 7, 1]; // days
const FROM_EMAIL = 'technicalcubs@gmail.com';
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

function getUrgencyLevel(days: number): string {
  if (days <= 1) return 'critical';
  if (days <= 7) return 'urgent';
  if (days <= 30) return 'warning';
  return 'notice';
}

function createEmailContent(visa: VisaRecord, manual: boolean): string {
  const urgencyColor = visa.urgency_level === 'critical' ? '#FF0000' : 
                      visa.urgency_level === 'urgent' ? '#FF6600' : 
                      visa.urgency_level === 'warning' ? '#FF9900' : '#0066CC';
  
  const urgencyText = visa.urgency_level === 'critical' ? 'CRITICAL ALERT' : 
                     visa.urgency_level === 'urgent' ? 'URGENT NOTICE' : 
                     visa.urgency_level === 'warning' ? 'WARNING' : 'NOTICE';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Visa Expiry Notification</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: ${urgencyColor}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">${manual ? '[MANUAL] ' : ''}${urgencyText}</h1>
          <h2 style="margin: 10px 0 0 0; font-size: 18px;">Visa Expiry Notification</h2>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #ddd;">
          <h3 style="color: ${urgencyColor}; margin-top: 0;">Employee Visa Expiring in ${visa.days_until_expiry} Days</h3>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #333;">Employee Details:</h4>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Name:</td><td>${visa.name}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Employee ID:</td><td>${visa.emp_id}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Company:</td><td>${visa.company_name}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Nationality:</td><td>${visa.nationality}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Trade:</td><td>${visa.trade}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Email:</td><td>${visa.email_id || 'Not provided'}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Visa Expiry Date:</td><td style="color: ${urgencyColor}; font-weight: bold;">${new Date(visa.visa_expiry_date).toLocaleDateString()}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Days Remaining:</td><td style="color: ${urgencyColor}; font-weight: bold; font-size: 18px;">${visa.days_until_expiry} days</td></tr>
            </table>
          </div>

          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #856404;">⚠️ Action Required:</h4>
            <ul style="margin: 10px 0; padding-left: 20px; color: #856404;">
              <li>Contact the employee immediately to arrange visa renewal</li>
              <li>Prepare necessary documentation for visa extension</li>
              <li>Coordinate with relevant authorities for renewal process</li>
              <li>Update employee records once renewal is complete</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
            <p><strong>CUBS Technical Contracting</strong><br>
            Automated Visa Notification System</p>
            <p>This ${manual ? 'manual' : 'automated'} notification was generated on ${new Date().toLocaleString()}</p>
            <p style="font-size: 12px; color: #999;">Please do not reply to this email. This is an automated system notification.</p>
          </div>
        </div>
      </body>
    </html>
  `;
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
        .from('employee_table')
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
          passport_no: data.passport_no || data.passport_number || ''
        }];
      }
    } else {
      // Automated notification for specific intervals or all intervals
      const intervalsToCheck = interval ? [interval] : NOTIFICATION_INTERVALS;
      
      for (const days of intervalsToCheck) {
        const { data, error } = await supabaseClient
          .from('employee_table')
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
              passport_no: employee.passport_no || employee.passport_number || ''
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

    // Process each expiring visa
    const results = await Promise.all(expiringVisas.map(async (visa) => {
      try {
        const emailContent = createEmailContent(visa, manual);
        const emailData = {
          personalizations: [{
            to: [{ email: TO_EMAIL, name: 'CUBS Technical HR' }],
            subject: `${manual ? '[MANUAL] ' : ''}Visa Expiry Alert - ${visa.name} (${visa.days_until_expiry} days remaining)`
          }],
          from: {
            email: FROM_EMAIL,
            name: 'CUBS Visa Notification System'
          },
          content: [{
            type: 'text/html',
            value: emailContent
          }],
          categories: ['visa-reminder', manual ? 'manual' : 'automated'],
          custom_args: {
            employee_id: visa.emp_id,
            days_until_expiry: visa.days_until_expiry.toString(),
            urgency: visa.urgency_level,
            manual: manual.toString()
          }
        };

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

        // Log the notification (use UUID employee_id, not the string emp_id)
        await supabaseClient.from('notification_logs').insert({
          type: 'visa_expiry',
          employee_id: visa.employee_id, // This is the UUID
          days_until_expiry: visa.days_until_expiry,
          urgency: visa.urgency_level,
          sent_to: [TO_EMAIL],
          email_sent: success,
          errors: errorMessage ? [errorMessage] : [],
          manual_trigger: manual,
          notification_date: new Date().toISOString(),
          template_used: 'default'
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