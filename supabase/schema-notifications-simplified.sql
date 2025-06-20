-- Notification System Database Schema (Simplified)
-- Run this in your Supabase SQL editor to set up the notification system

-- Create notification_logs table
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL DEFAULT 'visa_expiry',
    employee_id UUID NOT NULL,
    days_until_expiry INTEGER NOT NULL,
    urgency VARCHAR(20) NOT NULL CHECK (urgency IN ('critical', 'urgent', 'warning', 'notice')),
    sent_to TEXT[] NOT NULL DEFAULT '{}',
    email_sent BOOLEAN NOT NULL DEFAULT false,
    errors TEXT[] DEFAULT '{}',
    manual_trigger BOOLEAN NOT NULL DEFAULT false,
    notification_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    template_used VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add foreign key constraint to notification_logs table (do this after table creation)
DO $$ 
BEGIN
    -- Drop the constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'notification_logs_employee_id_fkey' 
               AND table_name = 'notification_logs') THEN
        ALTER TABLE public.notification_logs DROP CONSTRAINT notification_logs_employee_id_fkey;
    END IF;
    
    -- Add the foreign key constraint
    ALTER TABLE public.notification_logs 
    ADD CONSTRAINT notification_logs_employee_id_fkey 
    FOREIGN KEY (employee_id) REFERENCES public.employee_table(id) ON DELETE CASCADE;
EXCEPTION
    WHEN OTHERS THEN
        -- If employees table doesn't exist, we'll create the constraint later
        NULL;
END $$;

-- Create email_templates table (or alter existing one)
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}',
    type VARCHAR(50) NOT NULL DEFAULT 'visa_reminder',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    days_threshold INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Add columns if they don't exist (in case table already exists)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_templates' AND column_name = 'variables') THEN
        ALTER TABLE public.email_templates ADD COLUMN variables TEXT[] DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_templates' AND column_name = 'days_threshold') THEN
        ALTER TABLE public.email_templates ADD COLUMN days_threshold INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_templates' AND column_name = 'is_active') THEN
        ALTER TABLE public.email_templates ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_employee_id ON public.notification_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON public.notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_urgency ON public.notification_logs(urgency);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON public.notification_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_manual_trigger ON public.notification_logs(manual_trigger);

CREATE INDEX IF NOT EXISTS idx_email_templates_type ON public.email_templates(type);
CREATE INDEX IF NOT EXISTS idx_email_templates_days_threshold ON public.email_templates(days_threshold);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON public.email_templates(is_active);

-- Create RLS policies
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Allow admins to read notification logs
DROP POLICY IF EXISTS "Admins can read notification logs" ON public.notification_logs;
CREATE POLICY "Admins can read notification logs" ON public.notification_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Allow service role to manage notification logs (for edge functions)
DROP POLICY IF EXISTS "Service role can manage notification logs" ON public.notification_logs;
CREATE POLICY "Service role can manage notification logs" ON public.notification_logs
    FOR ALL USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Allow admins to read email templates
DROP POLICY IF EXISTS "Admins can read email templates" ON public.email_templates;
CREATE POLICY "Admins can read email templates" ON public.email_templates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Allow service role to manage email templates (for edge functions)
DROP POLICY IF EXISTS "Service role can manage email templates" ON public.email_templates;
CREATE POLICY "Service role can manage email templates" ON public.email_templates
    FOR ALL USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Create a function to get expiring visas for specific days
CREATE OR REPLACE FUNCTION public.get_expiring_visas_on_days(days INTEGER[])
RETURNS TABLE (
    employee_id TEXT,
    emp_id TEXT,
    name TEXT,
    email_id TEXT,
    company_name TEXT,
    visa_expiry_date DATE,
    days_until_expiry INTEGER,
    urgency_level TEXT,
    trade TEXT,
    nationality TEXT,
    passport_no TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id::TEXT as employee_id,
        e.employee_id as emp_id,
        e.name,
        e.email_id,
        e.company_name,
        e.visa_expiry_date::DATE,
        EXTRACT(DAY FROM (e.visa_expiry_date::DATE - CURRENT_DATE))::INTEGER as days_until_expiry,
        CASE 
            WHEN EXTRACT(DAY FROM (e.visa_expiry_date::DATE - CURRENT_DATE)) <= 1 THEN 'critical'
            WHEN EXTRACT(DAY FROM (e.visa_expiry_date::DATE - CURRENT_DATE)) <= 7 THEN 'urgent'
            WHEN EXTRACT(DAY FROM (e.visa_expiry_date::DATE - CURRENT_DATE)) <= 30 THEN 'warning'
            ELSE 'notice'
        END as urgency_level,
        e.trade,
        e.nationality,
        e.passport_number as passport_no
    FROM public.employee_table e
    WHERE e.visa_expiry_date IS NOT NULL
    AND EXTRACT(DAY FROM (e.visa_expiry_date::DATE - CURRENT_DATE)) = ANY(days)
    AND e.visa_expiry_date::DATE > CURRENT_DATE
    AND e.is_active = true
    ORDER BY e.visa_expiry_date ASC;
END;
$$;

-- Create a function to get all expiring visas within a threshold
CREATE OR REPLACE FUNCTION public.get_expiring_visas_within_days(threshold_days INTEGER DEFAULT 90)
RETURNS TABLE (
    employee_id TEXT,
    emp_id TEXT,
    name TEXT,
    email_id TEXT,
    company_name TEXT,
    visa_expiry_date DATE,
    days_until_expiry INTEGER,
    urgency_level TEXT,
    trade TEXT,
    nationality TEXT,
    passport_no TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id::TEXT as employee_id,
        e.employee_id as emp_id,
        e.name,
        e.email_id,
        e.company_name,
        e.visa_expiry_date::DATE,
        EXTRACT(DAY FROM (e.visa_expiry_date::DATE - CURRENT_DATE))::INTEGER as days_until_expiry,
        CASE 
            WHEN EXTRACT(DAY FROM (e.visa_expiry_date::DATE - CURRENT_DATE)) <= 1 THEN 'critical'
            WHEN EXTRACT(DAY FROM (e.visa_expiry_date::DATE - CURRENT_DATE)) <= 7 THEN 'urgent'
            WHEN EXTRACT(DAY FROM (e.visa_expiry_date::DATE - CURRENT_DATE)) <= 30 THEN 'warning'
            ELSE 'notice'
        END as urgency_level,
        e.trade,
        e.nationality,
        e.passport_number as passport_no
    FROM public.employee_table e
    WHERE e.visa_expiry_date IS NOT NULL
    AND EXTRACT(DAY FROM (e.visa_expiry_date::DATE - CURRENT_DATE)) <= threshold_days
    AND e.visa_expiry_date::DATE >= CURRENT_DATE
    AND e.is_active = true
    ORDER BY e.visa_expiry_date ASC;
END;
$$;

-- Create trigger function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_notification_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_notification_logs_updated_at ON public.notification_logs;
CREATE TRIGGER update_notification_logs_updated_at
    BEFORE UPDATE ON public.notification_logs
    FOR EACH ROW EXECUTE PROCEDURE public.update_notification_updated_at_column();

DROP TRIGGER IF EXISTS update_email_templates_updated_at ON public.email_templates;
CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON public.email_templates
    FOR EACH ROW EXECUTE PROCEDURE public.update_notification_updated_at_column(); 