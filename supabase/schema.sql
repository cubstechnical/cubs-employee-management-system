-- =====================================================
-- CUBS Employee Management System - Database Schema
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE (User Management)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'employee', 'public')) DEFAULT 'employee',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    approved_by UUID REFERENCES public.profiles(id)
);

-- =====================================================
-- EMPLOYEES TABLE (Main Employee Records)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    employee_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    trade TEXT,
    nationality TEXT,
    date_of_birth DATE,
    mobile_number TEXT,
    home_phone_number TEXT,
    email_id TEXT,
    company_id TEXT NOT NULL,
    company_name TEXT NOT NULL,
    join_date DATE,
    visa_expiry_date DATE,
    visa_status TEXT CHECK (visa_status IN ('ACTIVE', 'INACTIVE', 'EXPIRY')) DEFAULT 'ACTIVE',
    passport_number TEXT,
    status TEXT DEFAULT 'Active',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    updated_by UUID REFERENCES public.profiles(id)
);

-- =====================================================
-- EMPLOYEE DOCUMENTS TABLE (Document Management)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.employee_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    document_type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    expiry_date DATE,
    notes TEXT,
    document_number TEXT,
    issuing_authority TEXT,
    uploaded_by UUID REFERENCES public.profiles(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- NOTIFICATIONS TABLE (System Notifications)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    category TEXT DEFAULT 'general',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- NOTIFICATION PREFERENCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    email BOOLEAN DEFAULT true,
    push BOOLEAN DEFAULT true,
    in_app BOOLEAN DEFAULT true,
    categories TEXT[] DEFAULT ARRAY['visa_expiry', 'document_missing', 'system'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON public.employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON public.employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_visa_expiry ON public.employees(visa_expiry_date);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(is_active, status);
CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_id ON public.employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_type ON public.employee_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Employees policies
DROP POLICY IF EXISTS "Admins can manage all employees" ON public.employees;
CREATE POLICY "Admins can manage all employees" ON public.employees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Employees can view own record" ON public.employees;
CREATE POLICY "Employees can view own record" ON public.employees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND email = employees.email_id
        )
    );

-- Employee documents policies
DROP POLICY IF EXISTS "Admins can manage all documents" ON public.employee_documents;
CREATE POLICY "Admins can manage all documents" ON public.employee_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Employees can view own documents" ON public.employee_documents;
CREATE POLICY "Employees can view own documents" ON public.employee_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.employees e
            JOIN public.profiles p ON p.email = e.email_id
            WHERE e.id = employee_documents.employee_id 
            AND p.id = auth.uid()
        )
    );

-- Notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;
CREATE POLICY "Admins can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Notification preferences policies
DROP POLICY IF EXISTS "Users can manage own preferences" ON public.notification_preferences;
CREATE POLICY "Users can manage own preferences" ON public.notification_preferences
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'role', 'employee')
    );
    
    -- Create notification preferences
    INSERT INTO public.notification_preferences (user_id)
    VALUES (new.id);
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at timestamps
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_employees_updated_at ON public.employees;
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_employee_documents_updated_at ON public.employee_documents;
CREATE TRIGGER update_employee_documents_updated_at
    BEFORE UPDATE ON public.employee_documents
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Function to calculate visa status based on expiry date
CREATE OR REPLACE FUNCTION public.calculate_visa_status(expiry_date DATE)
RETURNS TEXT AS $$
BEGIN
    IF expiry_date IS NULL THEN
        RETURN 'INACTIVE';
    END IF;
    
    IF expiry_date < CURRENT_DATE THEN
        RETURN 'INACTIVE';
    ELSIF expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN
        RETURN 'EXPIRY';
    ELSE
        RETURN 'ACTIVE';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update visa status when visa_expiry_date changes
CREATE OR REPLACE FUNCTION public.update_visa_status()
RETURNS trigger AS $$
BEGIN
    NEW.visa_status = public.calculate_visa_status(NEW.visa_expiry_date);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_employee_visa_status ON public.employees;
CREATE TRIGGER update_employee_visa_status
    BEFORE INSERT OR UPDATE ON public.employees
    FOR EACH ROW EXECUTE PROCEDURE public.update_visa_status();

-- =====================================================
-- INITIAL DATA SETUP
-- =====================================================

-- Insert sample admin user (will be created when first admin signs up)
-- This is handled by the handle_new_user() function

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions to anon for public access (if needed)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.profiles TO anon;

-- =====================================================
-- VIEWS (Optional - for easier querying)
-- =====================================================

-- View for employee summary with calculated fields
CREATE OR REPLACE VIEW public.employee_summary AS
SELECT 
    e.*,
    p.full_name as created_by_name,
    CASE 
        WHEN e.visa_expiry_date IS NULL THEN 'No expiry date'
        WHEN e.visa_expiry_date < CURRENT_DATE THEN 'Expired'
        WHEN e.visa_expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'Critical'
        WHEN e.visa_expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'Warning'
        ELSE 'OK'
    END as visa_alert_level,
    COALESCE(e.visa_expiry_date - CURRENT_DATE, -999) as days_until_expiry
FROM public.employees e
LEFT JOIN public.profiles p ON p.id = e.created_by;

-- Grant access to views
GRANT SELECT ON public.employee_summary TO authenticated;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.profiles IS 'User profiles linked to auth.users';
COMMENT ON TABLE public.employees IS 'Main employee records with visa tracking';
COMMENT ON TABLE public.employee_documents IS 'Document storage references for employees';
COMMENT ON TABLE public.notifications IS 'System notifications for users';
COMMENT ON TABLE public.notification_preferences IS 'User notification preferences';

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates profile and preferences when user signs up';
COMMENT ON FUNCTION public.calculate_visa_status(DATE) IS 'Calculates visa status based on expiry date';
COMMENT ON VIEW public.employee_summary IS 'Employee data with calculated visa alert levels';

-- =====================================================
-- END OF SCHEMA
-- ===================================================== 