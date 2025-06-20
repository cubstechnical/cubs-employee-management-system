-- CUBS Employee Management System - Smart Index Creation
-- This script first checks what tables and columns exist, then creates appropriate indexes

-- ============================================
-- STEP 1: CHECK WHAT TABLES AND COLUMNS EXIST
-- ============================================

-- Check if tables exist and show their columns
SELECT 'CHECKING TABLES AND COLUMNS:' as info;

-- Show all tables in public schema
SELECT 
    'TABLE: ' || table_name as info,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Show columns for employee-related tables
SELECT 
    'COLUMNS IN ' || table_name || ':' as info,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name LIKE '%employee%'
ORDER BY table_name, ordinal_position;

-- Show columns for document-related tables
SELECT 
    'COLUMNS IN ' || table_name || ':' as info,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name LIKE '%document%'
ORDER BY table_name, ordinal_position;

-- Show columns for notification-related tables
SELECT 
    'COLUMNS IN ' || table_name || ':' as info,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name LIKE '%notification%'
ORDER BY table_name, ordinal_position;

-- ============================================
-- STEP 2: CREATE INDEXES BASED ON WHAT EXISTS
-- ============================================

-- Function to safely create index if table and column exist
CREATE OR REPLACE FUNCTION create_index_if_exists(
    index_name TEXT,
    table_name TEXT,
    column_names TEXT
) RETURNS TEXT AS $$
DECLARE
    table_exists BOOLEAN;
    columns_exist BOOLEAN;
    column_name TEXT;
    result TEXT;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = create_index_if_exists.table_name
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RETURN 'SKIPPED: Table ' || table_name || ' does not exist';
    END IF;
    
    -- For simple cases, check if all columns exist
    -- This is a simplified check - in production you'd want more robust column validation
    
    -- Try to create the index
    BEGIN
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I(%s)', 
                      index_name, table_name, column_names);
        RETURN 'SUCCESS: Created index ' || index_name || ' on ' || table_name || '(' || column_names || ')';
    EXCEPTION 
        WHEN OTHERS THEN
            RETURN 'ERROR: ' || SQLERRM || ' for index ' || index_name;
    END;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 3: ATTEMPT TO CREATE INDEXES
-- ============================================

-- Try different table names that might exist
SELECT 'ATTEMPTING TO CREATE INDEXES:' as info;

-- Employee table indexes (employee_table only)
SELECT create_index_if_exists('idx_emp_name', 'employee_table', 'name');
SELECT create_index_if_exists('idx_emp_company', 'employee_table', 'company_name');
SELECT create_index_if_exists('idx_emp_visa_expiry', 'employee_table', 'visa_expiry_date');
SELECT create_index_if_exists('idx_emp_employee_id', 'employee_table', 'employee_id');
SELECT create_index_if_exists('idx_emp_trade', 'employee_table', 'trade');
SELECT create_index_if_exists('idx_emp_nationality', 'employee_table', 'nationality');

-- Try visa_status column (if it exists)
SELECT create_index_if_exists('idx_emp_visa_status', 'employee_table', 'visa_status');

-- Try is_active column (if it exists)
SELECT create_index_if_exists('idx_emp_is_active', 'employee_table', 'is_active');

-- Try status column (if it exists)
SELECT create_index_if_exists('idx_emp_status', 'employee_table', 'status');

-- Document table indexes
SELECT create_index_if_exists('idx_docs_employee', 'employee_documents', 'employee_id');
SELECT create_index_if_exists('idx_docs_type', 'employee_documents', 'document_type');
SELECT create_index_if_exists('idx_docs_created', 'employee_documents', 'created_at');

-- Notification table indexes
SELECT create_index_if_exists('idx_notif_employee', 'notification_logs', 'employee_id');
SELECT create_index_if_exists('idx_notif_created', 'notification_logs', 'created_at');
SELECT create_index_if_exists('idx_notif_type', 'notification_logs', 'type');

-- Profile table indexes
SELECT create_index_if_exists('idx_profiles_email', 'profiles', 'email');
SELECT create_index_if_exists('idx_profiles_role', 'profiles', 'role');

-- ============================================
-- STEP 4: SHOW FINAL INDEX STATUS
-- ============================================

SELECT 'FINAL INDEX STATUS:' as info;

-- Show all indexes that were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND (indexname LIKE 'idx_emp_%' OR indexname LIKE 'idx_docs_%' OR indexname LIKE 'idx_notif_%' OR indexname LIKE 'idx_profiles_%')
ORDER BY tablename, indexname;

-- Show table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('employee_table', 'employee_documents', 'notification_logs', 'profiles')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Clean up the helper function
DROP FUNCTION IF EXISTS create_index_if_exists(TEXT, TEXT, TEXT);

SELECT 'INDEX CREATION COMPLETE!' as info; 