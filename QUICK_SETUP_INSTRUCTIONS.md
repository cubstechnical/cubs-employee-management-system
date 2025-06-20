# 🚀 Quick Setup Instructions (Fixed SQL)

## ⚠️ SQL Syntax Error Fixed!

The SQL syntax error was caused by the large email template content. I've split it into two files:

## 📋 Setup Steps (In Order)

### Step 1: Run the Schema File
Copy and paste **ALL** content from `supabase/schema-notifications-simplified.sql` into your Supabase SQL Editor and run it.

This creates:
- ✅ Tables: `notification_logs`, `email_templates`
- ✅ Indexes and security policies
- ✅ Database functions for visa checking
- ✅ Triggers for auto-updates

### Step 2: Add Email Templates
Copy and paste **ALL** content from `supabase/insert-email-templates.sql` into your Supabase SQL Editor and run it.

This adds:
- ✅ Templates for 90, 60, 30, 7, 1 day intervals
- ✅ HTML email designs with proper styling
- ✅ Variable placeholders for dynamic content

### Step 3: Test the Database
Run this query to verify it works:
```sql
SELECT * FROM public.get_expiring_visas_within_days(90);
```

You should see any employees with visas expiring in the next 90 days.

### Step 4: Set SendGrid API Key
In Supabase → Settings → Edge Functions → Environment Variables:
```
SENDGRID_API_KEY=your_real_sendgrid_api_key_here
```

### Step 5: Deploy Edge Function
```bash
npx supabase functions deploy send-visa-notifications
```

### Step 6: Test Manual Notification
1. Go to `/admin/notifications` in your app
2. Look for employees with expiring visas
3. Click "Send Manual Reminder"
4. Check if email arrives at `info@cubstechnical.com`

---

## 🔍 If You Still Get Errors

### Database Error?
- Make sure you run **Step 1** completely first
- Then run **Step 2** completely
- Check your Supabase logs for specific error details

### No Employees Show?
Check if employees have:
- `visa_expiry_date` (not null)
- `is_active = true`
- Future expiry dates

### Email Not Sending?
- Verify SendGrid API key is correct
- Check Supabase Edge Function logs
- Ensure employees have email addresses

---

**The notification system is now fixed and ready to use!** 🎉 

# Quick Setup Instructions for Visa Notification System

## Prerequisites
✅ Supabase project set up  
✅ SendGrid account and API key  
✅ GitHub repository for automated scheduling  

## Step 1: Check Your Database Schema

**First, verify your employees table exists:**

```sql
-- Run this in Supabase SQL Editor to check tables
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('employees', 'profiles') 
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

**If employees table is missing, you need to create it first:**

```sql
-- Create employees table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email_id VARCHAR(255),
    company_name VARCHAR(255),
    nationality VARCHAR(100),
    trade VARCHAR(100),
    passport_number VARCHAR(50),
    visa_expiry_date DATE,
    visa_status VARCHAR(50) DEFAULT 'ACTIVE',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for employees
CREATE POLICY "Admins can manage all employees" ON public.employees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Employees can view own record" ON public.employees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.email = employees.email_id
        )
    );
```

## Step 2: Database Schema Setup

**Run the notification schema (copy & paste in Supabase SQL Editor):**

```sql
-- Copy contents of supabase/schema-notifications-simplified.sql
```

**If you get foreign key errors, run this to add the constraint manually:**

```sql
-- Add foreign key constraint if it failed during schema creation
ALTER TABLE public.notification_logs 
ADD CONSTRAINT notification_logs_employee_id_fkey 
FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
```

## Step 3: Insert Email Templates

**Run the email templates (copy & paste in Supabase SQL Editor):**

```sql
-- Copy contents of supabase/insert-email-templates.sql
```

## Step 4: Set Environment Variables

**In your Supabase Dashboard → Settings → Edge Functions:**

Add these environment variables:
- `SENDGRID_API_KEY`: Your SendGrid API key (starts with `SG.`)
- `SENDGRID_FROM_EMAIL`: `techicalcubs@gmail.com`
- `SENDGRID_TO_EMAIL`: `info@cubstechnical.com`

## Step 5: Deploy Edge Function

**In your terminal (make sure Docker is running):**

```bash
# Deploy the notification function
npx supabase functions deploy send-visa-notifications
```

## Step 6: Test the System

**Test with a manual notification:**

```sql
-- Create a test employee with expiring visa
INSERT INTO public.employees (
    employee_id, name, email_id, company_name, 
    nationality, trade, visa_expiry_date, is_active
) VALUES (
    'EMP001', 'Test Employee', 'test@example.com', 'CUBS Technical',
    'Pakistani', 'Engineer', CURRENT_DATE + INTERVAL '30 days', true
);
```

**Then test the edge function:**

```bash
# Test via curl
curl -X POST 'https://[YOUR-PROJECT-ID].supabase.co/functions/v1/send-visa-notifications' \
  -H 'Authorization: Bearer [YOUR-ANON-KEY]' \
  -H 'Content-Type: application/json' \
  -d '{"manual": true, "employeeId": "[EMPLOYEE-UUID]"}'
```

## Step 7: Verify Data Access

**Check if your app can access the data:**

```sql
-- Test query for expiring visas
SELECT 
    id, employee_id, name, visa_expiry_date,
    EXTRACT(DAY FROM (visa_expiry_date - CURRENT_DATE)) as days_until_expiry
FROM public.employees 
WHERE visa_expiry_date IS NOT NULL 
AND visa_expiry_date >= CURRENT_DATE
AND is_active = true
ORDER BY visa_expiry_date;
```

## Step 8: Setup Automation (GitHub Actions)

**The workflow file is already created at `.github/workflows/visa-notifications.yml`**

**To activate:**
1. Go to your GitHub repository → Actions tab
2. Enable workflows if disabled
3. The workflow runs daily at 9:00 AM UTC
4. Or trigger manually: Actions → "Send Visa Notifications" → "Run workflow"

## Troubleshooting

### Error: "relation 'public.employees' does not exist"
- **Solution**: Run the employees table creation SQL from Step 1

### Error: "Could not find a relationship between 'notification_logs' and 'employees'"
- **Solution**: Run the foreign key constraint SQL from Step 2

### Error: "null value in column 'variables' violates not-null constraint"
- **Solution**: The SQL files have been fixed - re-run the insert-email-templates.sql

### Error: "Docker is not running"
- **Solution**: Start Docker Desktop before deploying edge functions

### Error: "Failed to deploy function"
- **Solution**: Make sure you're logged into Supabase CLI: `npx supabase login`

## Testing Checklist

- [ ] Employees table exists and has data
- [ ] Notification_logs table created successfully
- [ ] Email templates inserted without errors
- [ ] Edge function deployed successfully
- [ ] Environment variables set in Supabase
- [ ] Manual notification test works
- [ ] Admin notifications page loads without errors
- [ ] GitHub Actions workflow is enabled

## Support

If you encounter issues:
1. Check the browser console for specific error messages
2. Verify your database schema matches the requirements
3. Test the edge function directly via curl/Postman
4. Check Supabase logs for function execution errors

---

**Next Steps:** Once everything is working, you can customize email templates, adjust notification intervals, and add more recipients as needed. 

# 🚨 IMMEDIATE FIX: Missing Employee_Table

## **Your app is failing because it can't find the `employee_table`**

### **Step 1: Run Notification Schema**

Copy/paste `supabase/schema-notifications-simplified.sql` into Supabase SQL Editor and run it.

### **Step 2: Run Email Templates**

Copy/paste `supabase/insert-email-templates.sql` into Supabase SQL Editor and run it.

---

## If You Get Permission Errors

Run this first in Supabase SQL Editor:

```sql
-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Enable uuid extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## Verify It's Working

After running the schemas, test with this query:

```sql
-- This should return your tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('employee_table', 'notification_logs', 'email_templates')
ORDER BY table_name;
```

You should see:
- `email_templates`
- `employee_table` 
- `notification_logs`

---

## Test with Sample Data

```sql
-- Verify your employee_table exists and has the right columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'employee_table' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if you have any employees with visa expiry dates
SELECT id, employee_id, name, visa_expiry_date 
FROM public.employee_table 
WHERE visa_expiry_date IS NOT NULL
LIMIT 5;
```

---

## Final Steps After Database Is Fixed

1. **Set SendGrid API Key** in Supabase → Settings → Edge Functions:
   - `SENDGRID_API_KEY`: Your SendGrid API key (starts with `SG.`)
   - `SENDGRID_FROM_EMAIL`: `techicalcubs@gmail.com`
   - `SENDGRID_TO_EMAIL`: `info@cubstechnical.com`

2. **Deploy Edge Function**: `npx supabase functions deploy send-visa-notifications`

3. **Test your notifications page** - it should load without errors

---

**The error messages will disappear once you run the notification schema files!** 🎯

**Sorry for the confusion about the table name - everything is now fixed to use `employee_table`!** 