-- CUBS Tech App - Database Fix Script
-- Run these commands in Supabase SQL Editor

-- 1. Add missing RLS policy for profile creation
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Create missing profile for existing user
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
    updated_at = NOW();

-- 3. Check if notification_preferences table has the right structure
-- First, let's see what columns exist
DO $$
BEGIN
    -- Try to add created_at and updated_at columns if they don't exist
    BEGIN
        ALTER TABLE public.notification_preferences 
        ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
    EXCEPTION
        WHEN duplicate_column THEN 
            -- Column already exists, do nothing
            NULL;
    END;
    
    BEGIN
        ALTER TABLE public.notification_preferences 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
    EXCEPTION
        WHEN duplicate_column THEN 
            -- Column already exists, do nothing
            NULL;
    END;
END$$;

-- 4. Create notification preferences for the user (with or without timestamp columns)
INSERT INTO public.notification_preferences (user_id)
VALUES ('7ae2b571-ce70-42d8-b918-b761c70cecb1')
ON CONFLICT (user_id) DO NOTHING;

-- 5. Verify the profile was created
SELECT id, email, full_name, role, created_at 
FROM public.profiles 
WHERE id = '7ae2b571-ce70-42d8-b918-b761c70cecb1';

-- 6. Verify notification preferences
SELECT * FROM public.notification_preferences 
WHERE user_id = '7ae2b571-ce70-42d8-b918-b761c70cecb1';

-- 7. Check if trigger is working for future users
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created'; 