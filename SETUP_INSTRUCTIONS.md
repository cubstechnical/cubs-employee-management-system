# 🚀 CUBS Employee Management System - Setup Instructions

## ✅ **Step 1: Create Environment File**

Create a `.env` file in your project root with the credentials you provided:

```env
# --- Backblaze B2 Configuration ------------------------------
B2_ACCOUNT_ID=003de195e9b8c4d0000000002
B2_APPLICATION_KEY=K002VxbB+VIUc3bXKTHxBwRJ13E1YVk
B2_BUCKET_NAME=VisaDocsEU
B2_BUCKET_ID=bd1e6159c59e29bb985c041d
B2_ENDPOINT=https://s3.us-west-002.backblazeb2.com

# --- Supabase Configuration ----------------------------------
EXPO_PUBLIC_SUPABASE_URL=https://blbybcxkfcyxrwrlldtd.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsYnliY3hrZmN5eHJ3cmxsZHRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4MDk0ODEsImV4cCI6MjA1NTM4NTQ4MX0.3AGgW9sEIdo_OXUAhPoeQ9FjB1ZAmm-WJ3qyg52nL2E
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsYnliY3hrZmN5eHJ3cmxsZHRkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTgwOTQ4MSwiZXhwIjoyMDU1Mzg1NDgxfQ.I44w1sHk9cl0mdJhsT6GyW8e902rR_C9ffPu4m7NyA4

# --- SendGrid (Email) ---------------------------------------
SENDGRID_API_KEY=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
SENDGRID_FROM_EMAIL=rajarajeswaran2001@gmail.com

# --- App Environment & Feature Flags -------------------------
EXPO_PUBLIC_ENV=development
```

## ✅ **Step 2: Set Up Supabase Database Schema**

1. **Go to your Supabase Dashboard:**
   - Visit: https://blbybcxkfcyxrwrlldtd.supabase.co
   - Navigate to **SQL Editor**

2. **Run the Schema Setup:**
   - Copy the contents of `supabase/schema.sql`
   - Paste into the SQL Editor
   - Click **Run** to create all tables, policies, and functions

3. **Verify Tables Created:**
   - Go to **Table Editor**
   - You should see: `profiles`, `employees`, `employee_documents`, `notifications`, `notification_preferences`

## ✅ **Step 3: Create Your First Admin User**

1. **Start the App:**
   ```bash
   npm start
   ```

2. **Sign Up as Admin:**
   - Go to the login page
   - Click "Sign Up"
   - Use email: `admin@cubs.com`
   - Create a strong password
   - Enter your full name

3. **Update User Role to Admin:**
   - Go back to Supabase Dashboard > Table Editor
   - Open the `profiles` table
   - Find your newly created user
   - Change the `role` from `employee` to `admin`
   - Save the changes

## ✅ **Step 4: Test the System**

### **Authentication Test:**
1. **Login:** Use your admin credentials to log in
2. **Access Control:** You should be able to access the admin dashboard
3. **Navigation:** Test all menu items (Employees, Documents, Notifications)

### **Employee Management Test:**
1. **Add Employee:** Create a new employee record
2. **View Employees:** Check the employee list
3. **Edit Employee:** Update employee information
4. **Delete Employee:** Remove a test employee

### **Document Management Test:**
1. **Upload Document:** Try uploading a document (uses Backblaze B2)
2. **View Documents:** Check document list
3. **Download Document:** Test document download

### **Email Notifications Test:**
1. **Visa Expiry Alerts:** Go to Notifications page
2. **Send Test Email:** Try sending visa expiry notifications
3. **Check Email:** Verify emails are received

## 🔧 **Step 5: Optional Configuration**

### **Enable Email Templates (Optional):**
- Configure SendGrid email templates for better-looking emails
- Update the email templates in the notifications system

### **Security Hardening:**
- Review and update Row Level Security policies if needed
- Set up proper backup schedules
- Configure monitoring alerts

### **Production Setup:**
- Change `EXPO_PUBLIC_ENV` to `production`
- Set up proper domain and SSL certificates
- Configure production monitoring

## ⚠️ **Troubleshooting**

### **Login Issues:**
- Check if `.env` file exists in project root
- Verify Supabase credentials are correct
- Check browser console for error messages

### **Permission Errors:**
- Ensure RLS policies are properly set up
- Verify user roles are correctly assigned
- Check Supabase logs for detailed error messages

### **Email Not Working:**
- Verify SendGrid API key is valid
- Check if sender email is verified in SendGrid
- Look for email delivery logs in SendGrid dashboard

### **Document Upload Issues:**
- Verify Backblaze B2 credentials
- Check bucket permissions and CORS settings
- Ensure Edge Functions are deployed

## 📞 **Support**

If you encounter any issues:
1. Check the browser console for error messages
2. Review Supabase logs in the dashboard
3. Verify all environment variables are set correctly
4. Test with a fresh browser session (clear cache/cookies)

## 🎉 **Success!**

Once everything is working:
- ✅ Real Supabase authentication
- ✅ Employee management with database storage
- ✅ Document uploads to Backblaze B2
- ✅ Email notifications via SendGrid
- ✅ Role-based access control
- ✅ Visa expiry tracking and alerts

Your CUBS Employee Management System is now fully operational! 🚀 