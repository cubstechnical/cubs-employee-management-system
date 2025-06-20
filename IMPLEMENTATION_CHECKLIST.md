# Visa Automation Implementation Checklist

## ✅ Step-by-Step Implementation Guide

### Phase 1: Database Setup (5 minutes)

- [ ] **1.1** Open Supabase Dashboard
  - Go to: https://supabase.com/dashboard
  - Select project: `tndfjsjemqjgagtsqudr`

- [ ] **1.2** Run SQL Setup
  - Go to: SQL Editor
  - Copy and paste content from `supabase/email-templates-setup.sql`
  - Click "Run" to create tables and templates

- [ ] **1.3** Verify Setup
  - Check that `email_templates` table exists
  - Check that `notification_logs` table exists
  - Verify 3 visa reminder templates were created

### Phase 2: Deploy Edge Function (10 minutes)

- [ ] **2.1** Navigate to Edge Functions
  - Go to: Settings → Edge Functions
  - Click "Create a new function"

- [ ] **2.2** Create Function
  - **Function name**: `send-visa-notifications`
  - **Copy code** from: `supabase/functions/send-visa-notifications/index.ts`
  - Paste into the function editor

- [ ] **2.3** Deploy Function
  - Click "Deploy"
  - Wait for deployment to complete
  - Note the function URL

### Phase 3: Test the System (5 minutes)

- [ ] **3.1** Get Service Role Key
  - Go to: Settings → API
  - Copy the `service_role` key (not anon key)

- [ ] **3.2** Update Test Script
  - Open `test-visa-automation.js`
  - Replace `YOUR_SERVICE_ROLE_KEY_HERE` with your actual key

- [ ] **3.3** Run Tests
  ```bash
  node test-visa-automation.js
  ```

- [ ] **3.4** Verify Results
  - All tests should return status 200
  - Check your email for notifications
  - Verify logs in Supabase Dashboard

### Phase 4: Enable GitHub Actions (2 minutes)

- [ ] **4.1** Check Workflow File
  - Verify `.github/workflows/visa-notifications.yml` exists
  - Ensure it's committed to your repository

- [ ] **4.2** Enable GitHub Actions
  - Go to your GitHub repository
  - Navigate to: Actions tab
  - Enable GitHub Actions if not already enabled

- [ ] **4.3** Add Repository Secrets
  - Go to: Settings → Secrets and variables → Actions
  - Add these secrets:
    - `SUPABASE_URL`: `https://tndfjsjemqjgagtsqudr.supabase.co`
    - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

### Phase 5: Final Verification (3 minutes)

- [ ] **5.1** Manual Test
  ```bash
  curl -X POST "https://tndfjsjemqjgagtsqudr.supabase.co/functions/v1/send-visa-notifications" \
    -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d '{"manual": true}'
  ```

- [ ] **5.2** Check Logs
  - Go to Supabase Dashboard → Edge Functions → `send-visa-notifications`
  - Click "Logs" tab
  - Verify function executed successfully

- [ ] **5.3** Check Email
  - Verify you received notification emails
  - Check spam folder if needed

## 🎯 Success Criteria

### ✅ All Green = System Working
- [ ] Database tables created successfully
- [ ] Edge function deployed and accessible
- [ ] Manual test returns 200 status
- [ ] Emails are being sent
- [ ] GitHub Actions workflow is active
- [ ] Logs are being created

### ❌ Troubleshooting
- [ ] **Function not found**: Re-deploy via Supabase Dashboard
- [ ] **Email not sending**: Check SendGrid API key in secrets
- [ ] **Permission errors**: Verify service role key
- [ ] **No employees found**: Add test data with visa expiry dates

## 📊 Monitoring Commands

### Check Recent Notifications
```sql
SELECT 
  employee_id,
  days_until_expiry,
  urgency,
  email_sent,
  notification_date
FROM notification_logs 
WHERE type = 'visa_expiry' 
  AND notification_date >= NOW() - INTERVAL '7 days'
ORDER BY notification_date DESC;
```

### Check Email Templates
```sql
SELECT name, type, is_active 
FROM email_templates 
WHERE type = 'visa_reminder';
```

### Test Specific Employee
```bash
curl -X POST "https://tndfjsjemqjgagtsqudr.supabase.co/functions/v1/send-visa-notifications" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"manual": true, "employeeId": "EMP001"}'
```

## 🚀 What Happens Next

Once implemented, your system will:

1. **Daily at 9 AM UTC**: GitHub Actions automatically triggers the function
2. **Function checks**: All employees with visa expiry dates
3. **Sends emails**: For employees with visas expiring in 90, 60, 30, 7, or 1 days
4. **Logs everything**: All notifications stored in database
5. **Error handling**: Failed emails logged with details

## 💰 Cost: $0 (Completely Free)

- ✅ Supabase Edge Functions: Free tier
- ✅ GitHub Actions: Free tier  
- ✅ SendGrid: 100 emails/day free
- ✅ Total cost: $0

---

**Need Help?** Check the logs in Supabase Dashboard or run the test script. 