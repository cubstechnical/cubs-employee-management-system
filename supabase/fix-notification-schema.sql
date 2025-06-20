-- Fix notification schema and relationships
-- Run this in your Supabase SQL editor

-- First, ensure the notification_logs table exists with correct structure
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

-- Drop existing foreign key constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'notification_logs_employee_id_fkey' 
               AND table_name = 'notification_logs') THEN
        ALTER TABLE public.notification_logs DROP CONSTRAINT notification_logs_employee_id_fkey;
    END IF;
END $$;

-- Add the foreign key constraint (this will help with the relationship)
DO $$ 
BEGIN
    -- Check if employee_table exists first
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employee_table' AND table_schema = 'public') THEN
        -- Add the foreign key constraint
        ALTER TABLE public.notification_logs 
        ADD CONSTRAINT notification_logs_employee_id_fkey 
        FOREIGN KEY (employee_id) REFERENCES public.employee_table(id) ON DELETE CASCADE;
    ELSE
        RAISE NOTICE 'employee_table does not exist, skipping foreign key constraint';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add foreign key constraint: %', SQLERRM;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_employee_id ON public.notification_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON public.notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_urgency ON public.notification_logs(urgency);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON public.notification_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_manual_trigger ON public.notification_logs(manual_trigger);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can read notification logs" ON public.notification_logs;
DROP POLICY IF EXISTS "Service role can manage notification logs" ON public.notification_logs;

-- Create RLS policies
CREATE POLICY "Admins can read notification logs" ON public.notification_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Allow service role to manage notification logs (for edge functions)
CREATE POLICY "Service role can manage notification logs" ON public.notification_logs
    FOR ALL USING (
        auth.role() = 'service_role' OR
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.notification_logs TO anon, authenticated;
GRANT SELECT ON public.employee_table TO anon, authenticated;

-- Grant service role permissions
GRANT ALL ON public.notification_logs TO service_role;
GRANT ALL ON public.employee_table TO service_role;

-- Fix the passport field issue in the function
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
        COALESCE(e.passport_no, e.passport_number, '') as passport_no  -- Handle both field names
    FROM public.employee_table e
    WHERE e.visa_expiry_date IS NOT NULL
    AND EXTRACT(DAY FROM (e.visa_expiry_date::DATE - CURRENT_DATE)) = ANY(days)
    AND e.visa_expiry_date::DATE > CURRENT_DATE
    AND (e.is_active = true OR e.status = 'Active')  -- Handle both field names
    ORDER BY e.visa_expiry_date ASC;
END;
$$;

-- Update the other function too
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
        COALESCE(e.passport_no, e.passport_number, '') as passport_no  -- Handle both field names
    FROM public.employee_table e
    WHERE e.visa_expiry_date IS NOT NULL
    AND EXTRACT(DAY FROM (e.visa_expiry_date::DATE - CURRENT_DATE)) <= threshold_days
    AND e.visa_expiry_date::DATE >= CURRENT_DATE
    AND (e.is_active = true OR e.status = 'Active')  -- Handle both field names
    ORDER BY e.visa_expiry_date ASC;
END;
$$; 