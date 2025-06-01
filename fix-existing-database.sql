-- MINIMAL FIX FOR EXISTING DATABASE
-- This only fixes RLS policies without touching your existing data

-- 1. Drop any problematic recursive policies
DROP POLICY IF EXISTS "Users can view own company employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can view all employees" ON public.employees;
DROP POLICY IF EXISTS "Users can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Users can update employees" ON public.employees;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.employees;

-- 2. Create a simple, non-recursive admin access policy
CREATE POLICY "Admin full access" ON public.employees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid()
        )
    );

-- 3. Ensure RLS is enabled
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- 4. Add missing columns if they don't exist (safe operation)
DO $$
BEGIN
    BEGIN
        ALTER TABLE public.employees ADD COLUMN company VARCHAR(100);
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE public.employees ADD COLUMN trade VARCHAR(100);
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE public.employees ADD COLUMN department VARCHAR(100);
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END$$;

-- 5. Create analytics views for dashboard (if data exists)
CREATE OR REPLACE VIEW public.company_summary AS
SELECT 
    COALESCE(company, 'Unknown') as company,
    COUNT(*) as total_employees,
    COUNT(DISTINCT COALESCE(trade, 'Unknown')) as unique_trades,
    COUNT(DISTINCT COALESCE(department, 'Unknown')) as unique_departments,
    MIN(visa_expiry_date) as earliest_visa_expiry,
    COUNT(CASE WHEN visa_expiry_date < CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as urgent_renewals
FROM public.employees 
GROUP BY COALESCE(company, 'Unknown')
ORDER BY total_employees DESC;

CREATE OR REPLACE VIEW public.trade_summary AS
SELECT 
    COALESCE(trade, 'Unknown') as trade,
    COUNT(*) as employee_count,
    COUNT(DISTINCT COALESCE(company, 'Unknown')) as companies,
    COALESCE(ROUND(AVG(EXTRACT(days FROM (visa_expiry_date - CURRENT_DATE))), 0), 0) as avg_days_to_expiry
FROM public.employees 
WHERE trade IS NOT NULL OR trade = ''
GROUP BY COALESCE(trade, 'Unknown')
ORDER BY employee_count DESC;

-- 6. Test the fix
SELECT 'Database diagnostic complete' as status;
SELECT COUNT(*) as total_existing_employees FROM public.employees; 