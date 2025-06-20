# How to Test Visa Automation in Your App

## 🎯 **What's Been Added**

✅ **Test Button**: Added to Admin Dashboard Quick Actions  
✅ **VisaAutomationService**: Service to handle API calls  
✅ **Snackbar Notifications**: Shows test results  
✅ **Loading States**: Visual feedback during testing  

## 🧪 **How to Test in Your App**

### **Step 1: Start Your App**
```bash
npm run start
```

### **Step 2: Navigate to Admin Dashboard**
1. Open your app
2. Login as admin user
3. Go to Admin Dashboard

### **Step 3: Find the Test Button**
- Look for "⚡ Quick Actions" section
- Find the **"Test Visa Automation"** button
- It has an email icon and ferrari red color

### **Step 4: Test the Function**
1. **Click the button**
2. **Watch for loading state** - Button shows "Testing..."
3. **Check the result** - Snackbar appears at bottom
4. **Check your email** - Look for notifications at `info@cubstechnical.com`

## 📱 **What You'll See**

### **Success Case:**
- ✅ Green snackbar: "Visa automation test successful! Check your email for notifications."
- 📧 Email received with visa expiry details
- 📊 Logs created in Supabase

### **Error Case:**
- ❌ Red snackbar: "Test failed: [error message]"
- 🔍 Check console for detailed error

## 🔍 **Check Results**

### **1. In Supabase Dashboard:**
- Go to: Edge Functions → `send-visa-notifications` → Logs
- Look for recent execution logs

### **2. In Database:**
```sql
-- Check notification logs
SELECT * FROM notification_logs 
WHERE type = 'visa_expiry' 
ORDER BY notification_date DESC 
LIMIT 5;
```

### **3. In Your Email:**
- Check: `info@cubstechnical.com`
- Look for emails with subject: "Visa Expiry Alert"

## 🛠️ **Advanced Testing**

### **Test Different Scenarios:**

1. **Test All Employees:**
   - Click "Test Visa Automation" button
   - Tests all employees with visa expiry dates

2. **Test Specific Intervals:**
   ```typescript
   // In your app code, you can call:
   await VisaAutomationService.testInterval(7);  // 7 days
   await VisaAutomationService.testInterval(30); // 30 days
   ```

3. **Test Specific Employee:**
   ```typescript
   // Test a specific employee
   await VisaAutomationService.testEmployee('EMP001');
   ```

## 📊 **Monitor Your System**

### **Get Visa Statistics:**
```typescript
const stats = await VisaAutomationService.getVisaStats();
console.log('Visa stats:', stats);
// Returns: { total, expiring_30_days, expiring_7_days, expiring_1_day, expired }
```

### **Get Notification Logs:**
```typescript
const logs = await VisaAutomationService.getNotificationLogs(10);
console.log('Recent notifications:', logs);
```

## 🎉 **Success Indicators**

✅ **Button works** - No errors when clicked  
✅ **Loading state** - Button shows "Testing..."  
✅ **Snackbar appears** - Shows success/error message  
✅ **Email received** - Check your inbox  
✅ **Logs created** - Check Supabase logs  
✅ **Database updated** - Check notification_logs table  

## 🚨 **Troubleshooting**

### **If Button Doesn't Work:**
1. Check console for errors
2. Verify you're logged in as admin
3. Check network connection
4. Verify Edge Function is deployed

### **If No Email Received:**
1. Check spam folder
2. Verify SendGrid API key is set
3. Check Supabase logs for errors
4. Verify email address is correct

### **If Function Returns Error:**
1. Check Supabase Edge Function logs
2. Verify environment variables are set
3. Check database tables exist
4. Verify service role key permissions

---

**Ready to test?** Just start your app and click the "Test Visa Automation" button in the admin dashboard! 