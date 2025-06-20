-- Email Templates Setup for Visa Automation
-- Run this in your Supabase SQL Editor

-- Create email_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(100) NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    employee_id VARCHAR(255) NOT NULL,
    days_until_expiry INTEGER,
    urgency VARCHAR(50),
    sent_to TEXT[],
    email_sent BOOLEAN DEFAULT false,
    errors TEXT[],
    manual_trigger BOOLEAN DEFAULT false,
    notification_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    template_used VARCHAR(255),
    metadata JSONB
);

-- Insert default visa reminder templates
INSERT INTO email_templates (name, type, subject, content) VALUES 
(
    'visa_reminder_critical',
    'visa_reminder',
    '🚨 URGENT: {{employee_name}} - Visa expires in {{days_until_expiry}} days',
    '<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background-color: #ff4444; color: white; padding: 20px; border-radius: 5px; text-align: center; margin-bottom: 20px; }
        .employee-info { padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 5px solid #ff4444; background-color: #ffe6e6; }
        .detail-row { margin: 8px 0; }
        .label { font-weight: bold; color: #555; }
        .value { color: #333; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 URGENT VISA EXPIRY ALERT</h1>
            <h2>{{employee_name}} - {{days_until_expiry}} days remaining</h2>
        </div>
        
        <div class="employee-info">
            <h3>Employee Details</h3>
            <div class="detail-row"><span class="label">Name:</span> <span class="value">{{employee_name}}</span></div>
            <div class="detail-row"><span class="label">Employee ID:</span> <span class="value">{{employee_id}}</span></div>
            <div class="detail-row"><span class="label">Department:</span> <span class="value">{{department}}</span></div>
            <div class="detail-row"><span class="label">Nationality:</span> <span class="value">{{nationality}}</span></div>
            <div class="detail-row"><span class="label">Email:</span> <span class="value">{{email}}</span></div>
            <div class="detail-row"><span class="label">Visa Expiry Date:</span> <span class="value">{{visa_expiry_date}}</span></div>
            <div class="detail-row"><span class="label">Days Until Expiry:</span> <span class="value">{{days_until_expiry}} days</span></div>
        </div>
        
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 5px solid #ffc107;">
            <h4>⚠️ IMMEDIATE ACTION REQUIRED:</h4>
            <ul>
                <li>Contact the employee immediately</li>
                <li>Start visa renewal process today</li>
                <li>Coordinate with legal/immigration team</li>
                <li>Update employee record once renewed</li>
            </ul>
        </div>
        
        <div class="footer">
            <p>This is an automated notification from CUBS Employee Management System</p>
            <p>Generated on {{current_date}}</p>
        </div>
    </div>
</body>
</html>'
),
(
    'visa_reminder_high',
    'visa_reminder',
    '⚠️ HIGH PRIORITY: {{employee_name}} - Visa expires in {{days_until_expiry}} days',
    '<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background-color: #ff8800; color: white; padding: 20px; border-radius: 5px; text-align: center; margin-bottom: 20px; }
        .employee-info { padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 5px solid #ff8800; background-color: #fff3e6; }
        .detail-row { margin: 8px 0; }
        .label { font-weight: bold; color: #555; }
        .value { color: #333; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ HIGH PRIORITY VISA EXPIRY</h1>
            <h2>{{employee_name}} - {{days_until_expiry}} days remaining</h2>
        </div>
        
        <div class="employee-info">
            <h3>Employee Details</h3>
            <div class="detail-row"><span class="label">Name:</span> <span class="value">{{employee_name}}</span></div>
            <div class="detail-row"><span class="label">Employee ID:</span> <span class="value">{{employee_id}}</span></div>
            <div class="detail-row"><span class="label">Department:</span> <span class="value">{{department}}</span></div>
            <div class="detail-row"><span class="label">Nationality:</span> <span class="value">{{nationality}}</span></div>
            <div class="detail-row"><span class="label">Email:</span> <span class="value">{{email}}</span></div>
            <div class="detail-row"><span class="label">Visa Expiry Date:</span> <span class="value">{{visa_expiry_date}}</span></div>
            <div class="detail-row"><span class="label">Days Until Expiry:</span> <span class="value">{{days_until_expiry}} days</span></div>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4>📋 Recommended Actions:</h4>
            <ul>
                <li>Contact the employee to start visa renewal process</li>
                <li>Gather required documents for visa extension</li>
                <li>Schedule visa renewal meeting</li>
                <li>Update employee record once renewed</li>
            </ul>
        </div>
        
        <div class="footer">
            <p>This is an automated notification from CUBS Employee Management System</p>
            <p>Generated on {{current_date}}</p>
        </div>
    </div>
</body>
</html>'
),
(
    'visa_reminder_normal',
    'visa_reminder',
    '📋 REMINDER: {{employee_name}} - Visa expires in {{days_until_expiry}} days',
    '<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background-color: #4CAF50; color: white; padding: 20px; border-radius: 5px; text-align: center; margin-bottom: 20px; }
        .employee-info { padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 5px solid #4CAF50; background-color: #e8f5e8; }
        .detail-row { margin: 8px 0; }
        .label { font-weight: bold; color: #555; }
        .value { color: #333; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 VISA EXPIRY REMINDER</h1>
            <h2>{{employee_name}} - {{days_until_expiry}} days remaining</h2>
        </div>
        
        <div class="employee-info">
            <h3>Employee Details</h3>
            <div class="detail-row"><span class="label">Name:</span> <span class="value">{{employee_name}}</span></div>
            <div class="detail-row"><span class="label">Employee ID:</span> <span class="value">{{employee_id}}</span></div>
            <div class="detail-row"><span class="label">Department:</span> <span class="value">{{department}}</span></div>
            <div class="detail-row"><span class="label">Nationality:</span> <span class="value">{{nationality}}</span></div>
            <div class="detail-row"><span class="label">Email:</span> <span class="value">{{email}}</span></div>
            <div class="detail-row"><span class="label">Visa Expiry Date:</span> <span class="value">{{visa_expiry_date}}</span></div>
            <div class="detail-row"><span class="label">Days Until Expiry:</span> <span class="value">{{days_until_expiry}} days</span></div>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4>📋 Recommended Actions:</h4>
            <ul>
                <li>Contact the employee to start visa renewal process</li>
                <li>Gather required documents for visa extension</li>
                <li>Coordinate with legal/immigration team</li>
                <li>Update employee record once renewed</li>
            </ul>
        </div>
        
        <div class="footer">
            <p>This is an automated notification from CUBS Employee Management System</p>
            <p>Generated on {{current_date}}</p>
        </div>
    </div>
</body>
</html>'
)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_date ON notification_logs(notification_date);
CREATE INDEX IF NOT EXISTS idx_notification_logs_employee ON notification_logs(employee_id);

-- Grant permissions
GRANT ALL ON email_templates TO authenticated;
GRANT ALL ON notification_logs TO authenticated;

-- Verify the setup
SELECT 'Email templates created successfully' as status;
SELECT name, type FROM email_templates WHERE type = 'visa_reminder'; 