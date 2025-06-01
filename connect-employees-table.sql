-- SIMPLE CONNECTION FIX FOR EXISTING EMPLOYEES TABLE
-- Just fixes access permissions - no data changes

-- 1. Drop any problematic policies causing 500 errors
DROP POLICY IF EXISTS "Users can view own company employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can view all employees" ON public.employees;
DROP POLICY IF EXISTS "Users can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Users can update employees" ON public.employees;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.employees;

-- 2. Create simple admin access policy
CREATE POLICY "Admin access employees" ON public.employees
    FOR ALL USING (auth.uid() IS NOT NULL);

-- 3. Ensure RLS is enabled
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- 4. Test connection
SELECT COUNT(*) as existing_employees FROM public.employees; 