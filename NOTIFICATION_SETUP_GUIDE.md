# 🔧 Fixed Notification System Setup Guide

## ✅ What Was Fixed

### Database Schema Issues
- **Fixed**: Used `public.` schema prefix for all tables and functions
- **Fixed**: Changed `gen_random_uuid()` to `uuid_generate_v4()` (matches your existing schema)
- **Fixed**: Column name mismatch - `passport_number` vs `passport_no` (now uses `passport_number`)
- **Fixed**: Added proper RLS policies that match your existing security model
- **Fixed**: Added `is_active = true` filter to only get active employees

### Edge Function Issues
- **Fixed**: Updated to use correct column name `passport_number`
- **Fixed**: Proper error handling and logging
- **Fixed**: SendGrid integration with your email requirements

## 🚀 Setup Steps (In Order)

### 1. Run the Fixed SQL Schema
Copy and paste the **entire content** of `supabase/schema-notifications.sql` into your Supabase SQL Editor and run it.

This will create:
- ✅ `public.notification_logs` table
- ✅ `public.email_templates` table
- ✅ Proper indexes and RLS policies
- ✅ Database functions that work with your existing `employees` table
- ✅ Default email templates for all intervals (90, 60, 30, 7, 1 days)

### 2. Set Supabase Environment Variables
In your Supabase Dashboard → Settings → Edge Functions, add:

```bash
SENDGRID_API_KEY=your_actual_sendgrid_api_key_here
```

### 3. Deploy the Edge Function
```bash
npx supabase functions deploy send-visa-notifications
```

### 4. Set GitHub Secrets (for automated scheduling)
In your GitHub repository → Settings → Secrets and variables → Actions:

```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 5. Test the System

#### Test Manual Notification (Recommended First)
1. Go to `/admin/notifications` in your app
2. Look for employees with expiring visas
3. Click "Send Manual Reminder" 
4. Check if email arrives at `info@cubstechnical.com`

#### Test Automated System
The GitHub Action will run daily at 9:00 AM UTC, or you can trigger it manually:
1. Go to your GitHub repository
2. Actions → "Automated Visa Notifications" 
3. Click "Run workflow"

## 📧 Email Configuration

- **From**: `techicalcubs@gmail.com`
- **To**: `info@cubstechnical.com`
- **Intervals**: 90, 60, 30, 7, 1 days before expiry
- **Service**: SendGrid API

## 🔍 Troubleshooting

### If Manual Notifications Don't Work
1. Check Supabase Edge Function logs
2. Verify SendGrid API key is set correctly
3. Check if employees have `visa_expiry_date` and `is_active = true`

### If Database Schema Fails
1. Make sure you're running the **updated** SQL file
2. Check if you have proper permissions in Supabase
3. Run each section separately if needed

### If No Employees Show Up
Check if your employees have:
- ✅ `visa_expiry_date` (not NULL)
- ✅ `is_active = true`
- ✅ Future expiry dates

## 📊 Monitor the System

After setup, you can monitor:
- **Notification Logs**: See all sent notifications in the admin panel
- **Email Delivery**: Check SendGrid dashboard for delivery status
- **GitHub Actions**: Monitor automated workflow runs
- **Edge Function Logs**: Check Supabase for any errors

## 🎯 Quick Test

To verify everything works:

1. **Database**: Run this query in Supabase SQL Editor:
   ```sql
   SELECT * FROM public.get_expiring_visas_within_days(90);
   ```

2. **Edge Function**: Test with curl:
   ```bash
   curl -X POST "YOUR_SUPABASE_URL/functions/v1/send-visa-notifications" \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d '{"manual": true, "employeeId": "SOME_EMPLOYEE_ID"}'
   ```

3. **Frontend**: Visit `/admin/notifications` and try manual notification

---

**All fixes are now committed to your repository!** 🎉 