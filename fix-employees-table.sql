-- FIX EMPLOYEES TABLE AND RLS POLICIES
-- Run this in Supabase SQL Editor

-- 1. DISABLE RLS on employees table to fix issues
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;

-- 2. Drop any problematic policies on employees
DROP POLICY IF EXISTS "Users can view own company employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can view all employees" ON public.employees;
DROP POLICY IF EXISTS "Users can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Users can update employees" ON public.employees;

-- 3. Ensure the employees table has correct structure
-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add company column if missing
    BEGIN
        ALTER TABLE public.employees ADD COLUMN company VARCHAR(100);
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    -- Add trade column if missing
    BEGIN
        ALTER TABLE public.employees ADD COLUMN trade VARCHAR(100);
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    -- Add department column if missing
    BEGIN
        ALTER TABLE public.employees ADD COLUMN department VARCHAR(100);
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END$$;

-- 4. Insert sample employees for dashboard analytics if table is empty
INSERT INTO public.employees (
    name, email, phone, company, trade, department, 
    passport_number, visa_expiry_date, created_at
) VALUES 
    ('John Smith', 'john.smith@cubstech.com', '+1234567890', 'CUBS Technical', 'Software Developer', 'IT', 'P123456789', '2025-06-15', NOW()),
    ('Jane Doe', 'jane.doe@cubstech.com', '+1234567891', 'CUBS Technical', 'Project Manager', 'IT', 'P123456790', '2025-08-20', NOW()),
    ('Ahmed Ali', 'ahmed.ali@cubstech.com', '+1234567892', 'CUBS Technical', 'DevOps Engineer', 'IT', 'P123456791', '2025-05-10', NOW()),
    ('Maria Garcia', 'maria.garcia@partner.com', '+1234567893', 'Partner Corp', 'Mechanical Engineer', 'Engineering', 'P123456792', '2025-09-30', NOW()),
    ('David Wilson', 'david.wilson@partner.com', '+1234567894', 'Partner Corp', 'Electrical Engineer', 'Engineering', 'P123456793', '2025-07-15', NOW()),
    ('Sarah Johnson', 'sarah.johnson@cubstech.com', '+1234567895', 'CUBS Technical', 'UX Designer', 'Design', 'P123456794', '2025-10-05', NOW()),
    ('Mike Brown', 'mike.brown@thirdparty.com', '+1234567896', 'Third Party LLC', 'Data Analyst', 'Analytics', 'P123456795', '2025-04-20', NOW()),
    ('Lisa Chen', 'lisa.chen@thirdparty.com', '+1234567897', 'Third Party LLC', 'Marketing Specialist', 'Marketing', 'P123456796', '2025-11-12', NOW())
ON CONFLICT (email) DO NOTHING;

-- 5. Create SIMPLE, NON-RECURSIVE RLS policies for employees
CREATE POLICY "Admin can access all employees" ON public.employees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid()
        )
    );

-- 6. RE-ENABLE RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- 7. Create a view for dashboard analytics
CREATE OR REPLACE VIEW public.employee_analytics AS
SELECT 
    company,
    trade,
    department,
    COUNT(*) as employee_count,
    COUNT(CASE WHEN visa_expiry_date < CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as expiring_visas_30_days,
    COUNT(CASE WHEN visa_expiry_date < CURRENT_DATE + INTERVAL '60 days' THEN 1 END) as expiring_visas_60_days
FROM public.employees 
GROUP BY company, trade, department;

-- 8. Create company summary view
CREATE OR REPLACE VIEW public.company_summary AS
SELECT 
    company,
    COUNT(*) as total_employees,
    COUNT(DISTINCT trade) as unique_trades,
    COUNT(DISTINCT department) as unique_departments,
    MIN(visa_expiry_date) as earliest_visa_expiry,
    COUNT(CASE WHEN visa_expiry_date < CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as urgent_renewals
FROM public.employees 
GROUP BY company
ORDER BY total_employees DESC;

-- 9. Create trade summary view  
CREATE OR REPLACE VIEW public.trade_summary AS
SELECT 
    trade,
    COUNT(*) as employee_count,
    COUNT(DISTINCT company) as companies,
    ROUND(AVG(EXTRACT(days FROM (visa_expiry_date - CURRENT_DATE))), 0) as avg_days_to_expiry
FROM public.employees 
WHERE trade IS NOT NULL
GROUP BY trade
ORDER BY employee_count DESC;

-- 10. Verify the fix
SELECT 'Employees Count:' as status, COUNT(*) as total FROM public.employees;
SELECT 'Company Summary:' as status;
SELECT * FROM public.company_summary LIMIT 5;
SELECT 'Trade Summary:' as status;  
SELECT * FROM public.trade_summary LIMIT 5; 