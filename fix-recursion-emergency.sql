-- EMERGENCY FIX: Remove Infinite Recursion in RLS Policies
-- Run this IMMEDIATELY in Supabase SQL Editor

-- 1. DISABLE RLS completely to stop the recursion
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies (they're causing recursion)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- 3. Ensure the profile exists with correct data
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

-- 4. Create SIMPLE, NON-RECURSIVE policies
-- Basic user access (no recursion)
CREATE POLICY "Users can select own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 5. For admin access, we'll use a simple approach without recursion
-- Create a separate admin table or use user metadata instead
-- For now, let's create a policy that allows the specific admin user
CREATE POLICY "Admin user full access" ON public.profiles
    FOR ALL USING (auth.uid() = '7ae2b571-ce70-42d8-b918-b761c70cecb1');

-- 6. RE-ENABLE RLS with the fixed policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 7. Verify the profile exists and can be accessed
SELECT 'Profile Check:' as status;
SELECT id, email, full_name, role, created_at 
FROM public.profiles 
WHERE id = '7ae2b571-ce70-42d8-b918-b761c70cecb1';

-- 8. Check policies (should not show recursive ones)
SELECT 'Current Policies:' as status;
SELECT policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename = 'profiles'; 