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