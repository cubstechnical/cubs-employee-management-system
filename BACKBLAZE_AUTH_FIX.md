# Backblaze Authorization Fix Guide

## Problem
You're getting 401 unauthorized errors when trying to access Backblaze files:
```
{
  "code": "unauthorized",
  "message": "",
  "status": 401
}
```

## Root Cause
Your Backblaze bucket `cubsdocs` is configured as **private**, which requires proper authorization tokens to access files. The current implementation doesn't have the proper B2 credentials configured.

## Solutions (Choose One)

### Option 1: Make Bucket Public (Easiest)
1. Log into [Backblaze Console](https://secure.backblaze.com)
2. Go to **Buckets** → Select your `cubsdocs` bucket
3. Click **Bucket Settings**
4. Change **Bucket Type** from `Private` to `Public`
5. Save changes

**Pros:** Immediate fix, files accessible via direct URLs
**Cons:** Files are publicly accessible to anyone with the URL

### Option 2: Configure Proper Authorization (Recommended)
1. **Get Backblaze Credentials:**
   - Go to [Backblaze App Keys](https://secure.backblaze.com/app_keys.htm)
   - Create a new Application Key with permissions:
     - `listFiles`
     - `readFiles` 
     - `writeFiles`
     - `deleteFiles`
   - Note down the **Key ID** and **Application Key**

2. **Get Bucket ID:**
   - In Backblaze Console, go to your `cubsdocs` bucket
   - In bucket details, find the **Bucket ID** (starts with numbers/letters)

3. **Create Environment File:**
   ```bash
   # Create .env file in your project root
   touch .env
   ```

4. **Add Configuration to .env:**
   ```env
   # Supabase (your existing values)
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

   # Backblaze B2 Configuration
   B2_APPLICATION_KEY_ID=your-key-id-from-step-1
   B2_APPLICATION_KEY=your-application-key-from-step-1
   B2_BUCKET_NAME=cubsdocs
   B2_BUCKET_ID=your-bucket-id-from-step-2
   B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com

   # Optional: For client-side access
   EXPO_PUBLIC_B2_BUCKET_NAME=cubsdocs
   EXPO_PUBLIC_B2_APPLICATION_KEY_ID=your-key-id-from-step-1
   ```

5. **Deploy Edge Functions:**
   ```bash
   # Deploy the updated Supabase Edge Functions
   npx supabase functions deploy backblaze-signed-url
   npx supabase functions deploy backblaze-handler
   ```

6. **Set Environment Variables in Supabase:**
   - Go to your Supabase project
   - Navigate to **Settings** → **Edge Functions**
   - Add the environment variables:
     - `B2_APPLICATION_KEY_ID`
     - `B2_APPLICATION_KEY` 
     - `B2_BUCKET_ID`
     - `B2_BUCKET_NAME`

### Option 3: Quick Test Fix
If you want to test immediately:

1. **Temporary Public Access:**
   - Make your bucket public (Option 1)
   - Test download/view functionality
   - Then implement proper auth (Option 2)

## Port Forwarding Fix

For the port forwarding issue with VS Code/Cursor:

1. **Use Different Port:**
   ```bash
   npx expo start --web --port 3000
   ```

2. **Or Use Expo CLI Directly:**
   ```bash
   npx expo start --tunnel
   ```

3. **Access via Local Network:**
   - Your app is running on: `http://localhost:8081`
   - Or access via network: `http://192.168.29.12:8081`

## Testing the Fix

After implementing either solution:

1. **Test File Access:**
   - Try downloading a document
   - Try viewing a document
   - Check browser console for errors

2. **Verify URLs:**
   - Public bucket: Direct URLs should work
   - Private bucket: Should get signed URLs with authorization

3. **Check Logs:**
   - Browser console for client errors
   - Supabase Edge Function logs for server errors

## Current Status

✅ **Fixed in Code:**
- Added proper error handling for 401 errors
- Implemented fallback to direct URLs
- Added user-friendly error messages
- Updated Edge Functions for proper B2 integration

🔧 **Needs Configuration:**
- Environment variables for B2 credentials
- Supabase Edge Function environment setup
- Bucket access permissions

## Next Steps

1. Choose Option 1 (quick) or Option 2 (secure)
2. Test the functionality
3. If issues persist, check Supabase Edge Function logs
4. Verify that all environment variables are properly set

Let me know which option you choose and if you need help with any specific step! 