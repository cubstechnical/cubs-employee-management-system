# How to Get Your Service Role Key

## 🔑 Step 1: Get Your Service Role Key

1. **Go to Supabase Dashboard**:
   - Visit: https://supabase.com/dashboard
   - Sign in to your account

2. **Select Your Project**:
   - Click on project: `tndfjsjemqjgagtsqudr`

3. **Navigate to API Settings**:
   - Go to: Settings → API
   - Or click: https://supabase.com/dashboard/project/tndfjsjemqjgagtsqudr/settings/api

4. **Copy the Service Role Key**:
   - Look for "service_role" key (NOT anon key)
   - Click "Copy" button
   - It starts with: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 🧪 Step 2: Test Your Function

Once you have the key, run:

```powershell
# Replace YOUR_SERVICE_ROLE_KEY with your actual key
Invoke-RestMethod -Uri "https://tndfjsjemqjgagtsqudr.supabase.co/functions/v1/send-visa-notifications" -Method POST -Headers @{
    "Authorization" = "Bearer YOUR_SERVICE_ROLE_KEY"
    "Content-Type" = "application/json"
} -Body '{"manual": true}'
```

## ✅ Expected Results

If successful, you should see:
- Status 200 response
- JSON response with success: true
- Email sent to info@cubstechnical.com
- Logs in Supabase Dashboard

## 🔍 Check Results

1. **Check Email**: Look for emails at info@cubstechnical.com
2. **Check Logs**: Supabase Dashboard → Edge Functions → send-visa-notifications → Logs
3. **Check Database**: SQL Editor → `SELECT * FROM notification_logs ORDER BY notification_date DESC LIMIT 5;` 