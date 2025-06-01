-- DIAGNOSTIC SCRIPT FOR EXISTING DATABASE
-- Run this in Supabase SQL Editor to check your current setup

-- 1. Check if employees table exists and its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'employees' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check current RLS policies on employees table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'employees' 
  AND schemaname = 'public';

-- 3. Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'employees' 
  AND schemaname = 'public';

-- 4. Count existing employees (if any)
SELECT COUNT(*) as total_employees FROM public.employees;

-- 5. Check sample of existing data structure
SELECT * FROM public.employees LIMIT 3; 