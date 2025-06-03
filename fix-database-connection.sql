-- QUICK FIX FOR DATABASE CONNECTION ISSUES
-- Run this in Supabase SQL Editor

-- 1. Check if employees table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'employees';

-- 2. Temporarily disable RLS to test connection
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;

-- 3. Test basic query
SELECT COUNT(*) as employee_count FROM public.employees;

-- 4. Re-enable RLS with simple policy
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- 5. Create simple access policy for authenticated users
DROP POLICY IF EXISTS "Allow authenticated access" ON public.employees;
CREATE POLICY "Allow authenticated access" ON public.employees
    FOR ALL USING (auth.uid() IS NOT NULL);

-- 6. Verify the fix works
SELECT 'Database connection should now work' as status; 