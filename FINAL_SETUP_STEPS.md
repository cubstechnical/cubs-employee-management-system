# Final Setup Steps - Visa Automation

## ✅ What's Already Done
- ✅ Edge Function deployed successfully
- ✅ Function code is working
- ✅ Environment variables configured

## 🧪 Step 1: Test Your Function (2 minutes)

1. **Get your Service Role Key**:
   - Go to: https://supabase.com/dashboard
   - Select project: `tndfjsjemqjgagtsqudr`
   - Go to: Settings → API
   - Copy the `service_role` key (not anon key)

2. **Update the test script**:
   - Open `quick-test.js`
   - Replace `YOUR_SERVICE_ROLE_KEY_HERE` with your actual key

3. **Run the test**:
   ```bash
   node quick-test.js
   ```

4. **Check results**:
   - Should return status 200
   - Check your email for notifications
   - Verify logs in Supabase Dashboard

## 🗄️ Step 2: Set Up Database Tables (3 minutes)

1. **Go to Supabase SQL Editor**:
   - Dashboard → SQL Editor

2. **Run the setup script**:
   - Copy content from `supabase/email-templates-setup.sql`
   - Paste and click "Run"

3. **Verify tables created**:
   ```sql
   SELECT * FROM email_templates WHERE type = 'visa_reminder';
   SELECT * FROM notification_logs LIMIT 5;
   ```

## 🤖 Step 3: Enable GitHub Actions (2 minutes)

1. **Go to your GitHub repository**:
   - Navigate to: Actions tab
   - Enable GitHub Actions if not already enabled

2. **Add Repository Secrets**:
   - Go to: Settings → Secrets and variables → Actions
   - Add these secrets:
     - `SUPABASE_URL`: `https://tndfjsjemqjgagtsqudr.supabase.co`
     - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

3. **Verify workflow file**:
   - Check that `.github/workflows/visa-notifications.yml` exists
   - Should run daily at 9 AM UTC

## 📊 Step 4: Add Test Data (Optional - 2 minutes)

If you want to test with sample data:

```sql
-- Add a test employee with visa expiring soon
INSERT INTO employee_table (
  employee_id, 
  name, 
  email_id, 
  company_name, 
  visa_expiry_date,
  trade,
  nationality,
  passport_number
) VALUES (
  'TEST001',
  'John Doe',
  'john.doe@example.com',
  'CUBS Technical',
  (CURRENT_DATE + INTERVAL '5 days')::date,
  'Software Engineer',
  'Indian',
  'A12345678'
);
```

## 🎯 Step 5: Final Verification (3 minutes)

### Test 1: Manual Trigger
```bash
curl -X POST "https://tndfjsjemqjgagtsqudr.supabase.co/functions/v1/send-visa-notifications" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"manual": true}'
```

### Test 2: Check Specific Interval
```bash
curl -X POST "https://tndfjsjemqjgagtsqudr.supabase.co/functions/v1/send-visa-notifications" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"interval": 7}'
```

### Test 3: Check Logs
```sql
-- View recent notifications
SELECT 
  employee_id,
  days_until_expiry,
  urgency,
  email_sent,
  notification_date
FROM notification_logs 
WHERE type = 'visa_expiry' 
ORDER BY notification_date DESC
LIMIT 10;
```

## 🚀 What Happens Next

Once everything is set up:

1. **Daily at 9 AM UTC**: GitHub Actions automatically triggers the function
2. **Function checks**: All employees with visa expiry dates
3. **Sends emails**: For employees with visas expiring in 90, 60, 30, 7, or 1 days
4. **Logs everything**: All notifications stored in database
5. **Error handling**: Failed emails logged with details

## 📧 Email Notifications

You'll receive emails at: `info@cubstechnical.com`

**Email Features:**
- ✅ Professional HTML design
- ✅ Urgency level indicators (critical, urgent, warning, notice)
- ✅ Complete employee details
- ✅ Visa expiry information
- ✅ Action recommendations

## 🔍 Monitoring Your System

### Check Function Logs
1. Supabase Dashboard → Edge Functions → `send-visa-notifications`
2. Click "Logs" tab
3. View execution history

### Check Notification Logs
```sql
-- Recent notifications
SELECT * FROM notification_logs 
WHERE type = 'visa_expiry' 
  AND notification_date >= NOW() - INTERVAL '7 days'
ORDER BY notification_date DESC;
```

### Check GitHub Actions
1. Go to your GitHub repository
2. Click "Actions" tab
3. View "Automated Visa Notifications" workflow

## 🎉 Success Indicators

- ✅ Function test returns 200 status
- ✅ Emails are being sent
- ✅ Database tables created
- ✅ GitHub Actions workflow active
- ✅ Logs are being created

## 💰 Cost: $0 (Completely Free)

- ✅ Supabase Edge Functions: Free tier
- ✅ GitHub Actions: Free tier  
- ✅ SendGrid: 100 emails/day free
- ✅ Total: $0 (no credit card needed)

---

**Need Help?** Check the logs in Supabase Dashboard or run the test script. 