-- Insert email templates for the notification system
-- Run this AFTER running the main schema file

-- Insert basic email templates
INSERT INTO public.email_templates (name, type, subject, content, days_threshold, is_active) VALUES
(
    'Visa Expiry - 90 Days Notice',
    'visa_reminder',
    'Visa Expiry Notice - {{employee_name}} ({{days_remaining}} days remaining)',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0284c7;">📋 Visa Expiry Notice</h2>
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Employee:</strong> {{employee_name}}</p>
            <p><strong>Employee ID:</strong> {{employee_id}}</p>
            <p><strong>Company:</strong> {{company_name}}</p>
            <p><strong>Visa Expiry Date:</strong> {{visa_expiry_date}}</p>
            <p><strong>Days Remaining:</strong> {{days_remaining}}</p>
        </div>
        <p>This is an advance notice that the visa will expire in {{days_remaining}} days. Please begin renewal preparations.</p>
    </div>',
    90,
    true
),
(
    'Visa Expiry - 60 Days Warning',
    'visa_reminder',
    'Visa Expiry Warning - {{employee_name}} ({{days_remaining}} days remaining)',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #d97706;">⚠️ Visa Expiry Warning</h2>
        <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d97706;">
            <p><strong>Employee:</strong> {{employee_name}}</p>
            <p><strong>Employee ID:</strong> {{employee_id}}</p>
            <p><strong>Company:</strong> {{company_name}}</p>
            <p><strong>Visa Expiry Date:</strong> {{visa_expiry_date}}</p>
            <p><strong>Days Remaining:</strong> {{days_remaining}}</p>
        </div>
        <p>Warning: The visa will expire in {{days_remaining}} days. Please start the renewal process immediately.</p>
    </div>',
    60,
    true
),
(
    'Visa Expiry - 30 Days Warning',
    'visa_reminder',
    'Visa Expiry Warning - {{employee_name}} ({{days_remaining}} days remaining)',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #d97706;">⚠️ Visa Expiry Warning</h2>
        <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d97706;">
            <p><strong>Employee:</strong> {{employee_name}}</p>
            <p><strong>Employee ID:</strong> {{employee_id}}</p>
            <p><strong>Company:</strong> {{company_name}}</p>
            <p><strong>Visa Expiry Date:</strong> {{visa_expiry_date}}</p>
            <p><strong>Days Remaining:</strong> {{days_remaining}}</p>
        </div>
        <p>Urgent: The visa will expire in {{days_remaining}} days. Immediate action required for renewal.</p>
    </div>',
    30,
    true
),
(
    'Visa Expiry - 7 Days Urgent',
    'visa_reminder',
    'URGENT: Visa Expiry Alert - {{employee_name}} ({{days_remaining}} days remaining)',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #ea580c;">🚨 URGENT: Visa Expiry Alert</h2>
        <div style="background: #fff7ed; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ea580c;">
            <p><strong>Employee:</strong> {{employee_name}}</p>
            <p><strong>Employee ID:</strong> {{employee_id}}</p>
            <p><strong>Company:</strong> {{company_name}}</p>
            <p><strong>Visa Expiry Date:</strong> {{visa_expiry_date}}</p>
            <p><strong>Days Remaining:</strong> {{days_remaining}}</p>
        </div>
        <p style="color: #ea580c; font-weight: bold;">URGENT: The visa expires in {{days_remaining}} days! Immediate action required!</p>
    </div>',
    7,
    true
),
(
    'Visa Expiry - 1 Day Critical',
    'visa_reminder',
    'CRITICAL: Visa Expires Tomorrow - {{employee_name}} ({{days_remaining}} day remaining)',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #dc2626;">🔴 CRITICAL: Visa Expires Tomorrow!</h2>
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p><strong>Employee:</strong> {{employee_name}}</p>
            <p><strong>Employee ID:</strong> {{employee_id}}</p>
            <p><strong>Company:</strong> {{company_name}}</p>
            <p><strong>Visa Expiry Date:</strong> {{visa_expiry_date}}</p>
            <p><strong>Days Remaining:</strong> {{days_remaining}}</p>
        </div>
        <p style="color: #dc2626; font-weight: bold;">CRITICAL: The visa expires TOMORROW! Emergency action required!</p>
    </div>',
    1,
    true
)
ON CONFLICT (name) DO NOTHING; 