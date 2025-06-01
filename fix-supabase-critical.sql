-- CRITICAL FIX: Supabase RLS Policies for Profile Access
-- Run this IMMEDIATELY in Supabase SQL Editor

-- 1. TEMPORARILY DISABLE RLS to fix the data
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Check if profile exists and fix any issues
UPDATE public.profiles 
SET 
    email = 'rajarajeswaran2001@gmail.com',
    full_name = 'Raja Rajeswaran',
    role = 'admin',
    updated_at = NOW()
WHERE id = '7ae2b571-ce70-42d8-b918-b761c70cecb1';

-- 3. If profile doesn't exist, create it
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
    '7ae2b571-ce70-42d8-b918-b761c70cecb1',
    'rajarajeswaran2001@gmail.com',
    'Raja Rajeswaran',
    'admin',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = NOW();

-- 4. RE-ENABLE RLS with CORRECT policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Drop all existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- 6. Create WORKING RLS policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 7. Admin access policy (for future admin users)
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 8. Verify the fix
SELECT 'Profile verification:' as status;
SELECT id, email, full_name, role, created_at 
FROM public.profiles 
WHERE id = '7ae2b571-ce70-42d8-b918-b761c70cecb1';

-- 9. Test RLS policies
SELECT 'RLS Policies:' as status;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles'; 