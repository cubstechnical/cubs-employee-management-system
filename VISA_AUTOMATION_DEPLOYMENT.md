# Visa Expiry Automation - Deployment Guide

## 🚀 Quick Implementation (No Docker Required)

### Method 1: Deploy via Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `tndfjsjemqjgagtsqudr`

2. **Navigate to Edge Functions**
   - Go to: Settings → Edge Functions
   - Click "Create a new function"

3. **Create the Function**
   - **Function name**: `send-visa-notifications`
   - **Import the code** from: `supabase/functions/send-visa-notifications/index.ts`

4. **Set Environment Variables** (Already configured):
   - `SUPABASE_URL`: ✅ Set
   - `SUPABASE_SERVICE_ROLE_KEY`: ✅ Set
   - `SENDGRID_API_KEY`: ✅ Set
   - `SENDGRID_FROM_EMAIL`: ✅ Set

5. **Deploy the Function**
   - Click "Deploy"
   - Function URL will be: `https://tndfjsjemqjgagtsqudr.supabase.co/functions/v1/send-visa-notifications`

### Method 2: GitHub Actions Automation (Backup)

Your GitHub Actions workflow is already configured in `.github/workflows/visa-notifications.yml`

**Features:**
- ✅ Runs daily at 9 AM UTC
- ✅ No credit card required
- ✅ Completely free
- ✅ Automatic execution

## 🧪 Testing Your Automation

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
  -d '{"interval": 30}'
```

### Test 3: Specific Employee
```bash
curl -X POST "https://tndfjsjemqjgagtsqudr.supabase.co/functions/v1/send-visa-notifications" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"manual": true, "employeeId": "EMP001"}'
```

## 📊 Monitoring & Logs

### Check Function Logs
1. Go to Supabase Dashboard
2. Edge Functions → `send-visa-notifications`
3. Click "Logs" tab

### Check Notification Logs
```sql
-- View all notification logs
SELECT * FROM notification_logs 
WHERE type = 'visa_expiry' 
ORDER BY notification_date DESC;

-- View recent notifications
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

## 🔧 Configuration Options

### Email Templates
The system uses email templates from the `email_templates` table:

```sql
-- Create default email template
INSERT INTO email_templates (name, type, subject, content) VALUES (
  'visa_reminder_default',
  'visa_reminder',
  'Visa Expiry Alert - {{employee_name}} ({{days_until_expiry}} days remaining)',
  '<!DOCTYPE html>
   <html>
   <head><title>Visa Expiry Alert</title></head>
   <body>
     <h2>Visa Expiry Alert</h2>
     <p>Employee: {{employee_name}}</p>
     <p>Days until expiry: {{days_until_expiry}}</p>
     <p>Urgency: {{urgency_level}}</p>
   </body>
   </html>'
);
```

### Notification Intervals
Current intervals: 90, 60, 30, 7, 1 days before expiry

To modify, edit the `NOTIFICATION_INTERVALS` array in the function.

## 🎯 What Happens Automatically

1. **Daily at 9 AM UTC**: GitHub Actions triggers the function
2. **Function checks**: All employees with visa expiry dates
3. **Sends emails**: For employees with visas expiring in 90, 60, 30, 7, or 1 days
4. **Logs everything**: All notifications are stored in `notification_logs` table
5. **Error handling**: Failed emails are logged with error details

## 💰 Cost Breakdown

- **Supabase Edge Functions**: $0 (free tier)
- **GitHub Actions**: $0 (free tier)
- **SendGrid**: $0 (100 emails/day free)
- **Total**: $0 (completely free)

## 🚨 Troubleshooting

### Common Issues:

1. **Function not found**: Deploy via Supabase Dashboard
2. **Email not sending**: Check SendGrid API key
3. **No employees found**: Verify visa_expiry_date data
4. **Permission errors**: Check service role key

### Debug Commands:
```bash
# Check function status
curl -I "https://tndfjsjemqjgagtsqudr.supabase.co/functions/v1/send-visa-notifications"

# Test with verbose output
curl -v -X POST "https://tndfjsjemqjgagtsqudr.supabase.co/functions/v1/send-visa-notifications" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"manual": true}'
```

## ✅ Success Indicators

- ✅ Function deployed successfully
- ✅ Manual test returns success
- ✅ Emails are being sent
- ✅ Logs are being created
- ✅ GitHub Actions workflow is active

---

**Need Help?** Check the function logs in Supabase Dashboard or run the test commands above. 