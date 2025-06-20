import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Employee {
  employee_id: string
  employee_name: string
  email: string
  visa_expiry: string
  department?: string
  nationality?: string
}

interface NotificationLog {
  employee_id: string
  notification_type: string
  sent_date: string
  urgency_level: string
  days_until_expiry: number
  email_sent: boolean
  metadata: any
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get current date
    const today = new Date()
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000))

    // Query employees with visas expiring in 30 days
    const { data: employees, error } = await supabase
      .from('employee_table')
      .select('employee_id, employee_name, email, visa_expiry, department, nationality')
      .not('visa_expiry', 'is', null)
      .gte('visa_expiry', today.toISOString().split('T')[0])
      .lte('visa_expiry', thirtyDaysFromNow.toISOString().split('T')[0])

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    if (!employees || employees.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No employees with expiring visas found',
          count: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Process each employee
    const notifications = []
    const summary = {
      total: employees.length,
      critical: 0,
      high: 0,
      normal: 0,
      departments: {} as Record<string, number>
    }

    for (const employee of employees) {
      const expiryDate = new Date(employee.visa_expiry)
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      // Determine urgency level
      let urgencyLevel = 'normal'
      let subject = ''
      let emailContent = ''

      if (daysUntilExpiry <= 7) {
        urgencyLevel = 'critical'
        subject = `🚨 URGENT: ${employee.employee_name}'s visa expires in ${daysUntilExpiry} days`
        summary.critical++
      } else if (daysUntilExpiry <= 15) {
        urgencyLevel = 'high'
        subject = `⚠️ HIGH PRIORITY: ${employee.employee_name}'s visa expires in ${daysUntilExpiry} days`
        summary.high++
      } else {
        subject = `📋 REMINDER: ${employee.employee_name}'s visa expires in ${daysUntilExpiry} days`
        summary.normal++
      }

      // Count by department
      const dept = employee.department || 'Unknown'
      summary.departments[dept] = (summary.departments[dept] || 0) + 1

      // Generate email content
      emailContent = generateEmailContent(employee, daysUntilExpiry, urgencyLevel)

      // Send email via SendGrid
      const emailSent = await sendEmail(
        subject,
        emailContent,
        employee.email,
        'hr@cubs.com' // CC to HR
      )

      // Log notification
      const notificationLog: NotificationLog = {
        employee_id: employee.employee_id,
        notification_type: 'visa_expiry',
        sent_date: new Date().toISOString(),
        urgency_level: urgencyLevel,
        days_until_expiry: daysUntilExpiry,
        email_sent: emailSent,
        metadata: {
          subject,
          visa_expiry_date: employee.visa_expiry,
          department: employee.department,
          nationality: employee.nationality
        }
      }

      // Insert notification log
      await supabase
        .from('notification_logs')
        .insert([notificationLog])

      notifications.push({
        employee: employee.employee_name,
        days_until_expiry: daysUntilExpiry,
        urgency_level: urgencyLevel,
        email_sent: emailSent
      })
    }

    // Send summary email to HR manager
    await sendSummaryEmail(summary, notifications)

    return new Response(
      JSON.stringify({
        message: 'Visa notifications processed successfully',
        summary,
        notifications,
        processed_count: employees.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

function generateEmailContent(employee: Employee, daysUntilExpiry: number, urgencyLevel: string): string {
  const urgencyClass = `urgency-${urgencyLevel}`
  
  return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background-color: #DC143C; color: white; padding: 20px; border-radius: 5px; text-align: center; margin-bottom: 20px; }
        .urgency-critical { border-left: 5px solid #ff4444; background-color: #ffe6e6; }
        .urgency-high { border-left: 5px solid #ff8800; background-color: #fff3e6; }
        .urgency-normal { border-left: 5px solid #4CAF50; background-color: #e8f5e8; }
        .employee-info { padding: 15px; margin: 10px 0; border-radius: 5px; }
        .detail-row { margin: 8px 0; }
        .label { font-weight: bold; color: #555; }
        .value { color: #333; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏢 CUBS Employee Management</h1>
            <h2>Visa Expiration Alert</h2>
        </div>
        
        <div class="employee-info ${urgencyClass}">
            <h3>Employee Details</h3>
            <div class="detail-row"><span class="label">Name:</span> <span class="value">${employee.employee_name}</span></div>
            <div class="detail-row"><span class="label">Employee ID:</span> <span class="value">${employee.employee_id}</span></div>
            <div class="detail-row"><span class="label">Department:</span> <span class="value">${employee.department || 'Unknown'}</span></div>
            <div class="detail-row"><span class="label">Nationality:</span> <span class="value">${employee.nationality || 'Unknown'}</span></div>
            <div class="detail-row"><span class="label">Email:</span> <span class="value">${employee.email}</span></div>
            <div class="detail-row"><span class="label">Visa Expiry Date:</span> <span class="value">${employee.visa_expiry}</span></div>
            <div class="detail-row"><span class="label">Days Until Expiry:</span> <span class="value">${daysUntilExpiry} days</span></div>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4>📋 Recommended Actions:</h4>
            <ul>
                <li>Contact the employee immediately to start visa renewal process</li>
                <li>Gather required documents for visa extension</li>
                <li>Coordinate with legal/immigration team</li>
                <li>Update employee record once renewed</li>
            </ul>
        </div>
        
        <div class="footer">
            <p>This is an automated notification from CUBS Employee Management System</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>
  `
}

async function sendEmail(subject: string, htmlContent: string, toEmail: string, ccEmail?: string): Promise<boolean> {
  try {
    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY')
    if (!sendgridApiKey) {
      console.error('SendGrid API key not configured')
      return false
    }

    const emailData = {
      personalizations: [{
        to: [{ email: toEmail }],
        cc: ccEmail ? [{ email: ccEmail }] : undefined
      }],
      from: { email: 'technicalcubs@gmail.com', name: 'CUBS HR System' },
      subject: subject,
      content: [{
        type: 'text/html',
        value: htmlContent
      }]
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    })

    return response.ok
  } catch (error) {
    console.error('SendGrid error:', error)
    return false
  }
}

async function sendSummaryEmail(summary: any, notifications: any[]): Promise<void> {
  const subject = `📊 Daily Visa Expiration Summary - ${new Date().toLocaleDateString()}`
  
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 700px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background-color: #DC143C; color: white; padding: 20px; border-radius: 5px; text-align: center; margin-bottom: 25px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
        .stat-card { background-color: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border-left: 4px solid #DC143C; }
        .stat-number { font-size: 24px; font-weight: bold; color: #DC143C; }
        .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .critical { border-left-color: #ff4444; }
        .high { border-left-color: #ff8800; }
        .normal { border-left-color: #4CAF50; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 CUBS HR Dashboard</h1>
            <h2>Visa Expiration Summary Report</h2>
            <p>${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${summary.total}</div>
                <div class="stat-label">Total Expiring</div>
            </div>
            <div class="stat-card critical">
                <div class="stat-number">${summary.critical}</div>
                <div class="stat-label">Critical (≤7 days)</div>
            </div>
            <div class="stat-card high">
                <div class="stat-number">${summary.high}</div>
                <div class="stat-label">High (≤15 days)</div>
            </div>
            <div class="stat-card normal">
                <div class="stat-number">${summary.normal}</div>
                <div class="stat-label">Normal (≤30 days)</div>
            </div>
        </div>
        
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4>💡 Quick Actions:</h4>
            <ul>
                <li>Review individual employee notifications sent today</li>
                <li>Follow up on critical cases (≤7 days)</li>
                <li>Schedule visa renewal meetings for high priority cases</li>
                <li>Update visa status in employee records after renewals</li>
            </ul>
        </div>
        
        <div style="font-size: 12px; color: #666; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p>Automated report generated by CUBS Employee Management System</p>
            <p>Report generated at: ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>
  `

  await sendEmail(subject, htmlContent, 'hr-manager@cubs.com')
} 