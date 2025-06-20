# 🔔 Push Notifications Setup Guide

## Current Status
✅ **Email Notifications**: Fully working with 90, 60, 30, 7, 1 day intervals  
✅ **Web Push**: Service worker ready  
❌ **Mobile Push**: Needs Expo configuration  

## 📱 **Step 1: Install Push Notification Dependencies**

```bash
npx expo install expo-notifications expo-device expo-constants
```

## 📱 **Step 2: Configure app.json**

Add to your `app.json`:

```json
{
  "expo": {
    "name": "CUBS Employee Management",
    "slug": "cubs-employee-management",
    "version": "1.0.0",
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#DC143C",
      "iosDisplayInForeground": true,
      "androidMode": "default",
      "androidCollapsedTitle": "CUBS EMS"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.cubs.employeemanagement",
      "buildNumber": "1.0.0",
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"]
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.cubs.employeemanagement",
      "versionCode": 1,
      "permissions": [
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE",
        "android.permission.CAMERA",
        "android.permission.VIBRATE",
        "android.permission.RECEIVE_BOOT_COMPLETED"
      ],
      "useNextNotificationsApi": true,
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#DC143C",
          "defaultChannel": "cubs-notifications"
        }
      ]
    ]
  }
}
```

## 📱 **Step 3: Create Push Notification Service**

Create `services/pushNotificationService.ts`:

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationToken {
  token: string;
  platform: string;
  deviceId: string;
  userId: string;
}

class PushNotificationService {
  private token: string | null = null;

  async initialize(userId: string): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return false;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return false;
      }

      // Get push token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      
      this.token = token.data;
      console.log('Push token:', this.token);

      // Save token to database
      await this.saveTokenToDatabase(userId, this.token);
      
      return true;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return false;
    }
  }

  private async saveTokenToDatabase(userId: string, token: string) {
    try {
      const { error } = await supabase
        .from('push_tokens')
        .upsert({
          user_id: userId,
          token: token,
          platform: Platform.OS,
          device_id: Constants.sessionId || 'unknown',
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error saving push token:', error);
      }
    } catch (error) {
      console.error('Error saving push token to database:', error);
    }
  }

  async sendLocalNotification(title: string, body: string, data?: any) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }

  async sendVisaExpiryNotification(employee: any, daysUntilExpiry: number) {
    const urgency = daysUntilExpiry <= 1 ? 'CRITICAL' : 
                   daysUntilExpiry <= 7 ? 'URGENT' : 
                   daysUntilExpiry <= 30 ? 'WARNING' : 'NOTICE';

    await this.sendLocalNotification(
      `${urgency}: Visa Expiry Alert`,
      `${employee.name}'s visa expires in ${daysUntilExpiry} day(s)`,
      {
        type: 'visa_expiry',
        employeeId: employee.id,
        daysUntilExpiry,
        urgency: urgency.toLowerCase(),
      }
    );
  }

  getToken(): string | null {
    return this.token;
  }
}

export const pushNotificationService = new PushNotificationService();
```

## 📱 **Step 4: Add Database Table for Push Tokens**

Add to your Supabase SQL Editor:

```sql
-- Create push_tokens table
CREATE TABLE IF NOT EXISTS public.push_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform VARCHAR(20) NOT NULL,
    device_id TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON public.push_tokens(active);

-- Enable RLS
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own push tokens" ON public.push_tokens
    FOR ALL USING (auth.uid() = user_id);
```

## 📱 **Step 5: Update Notification Service**

Add to your `services/notificationService.ts`:

```typescript
import { pushNotificationService } from './pushNotificationService';

// Add this method to your NotificationService class
async sendPushNotification(
  userId: string, 
  title: string, 
  body: string, 
  data?: any
): Promise<void> {
  try {
    // Get user's push tokens
    const { data: tokens, error } = await supabase
      .from('push_tokens')
      .select('token, platform')
      .eq('user_id', userId)
      .eq('active', true);

    if (error || !tokens?.length) {
      console.log('No active push tokens found for user:', userId);
      return;
    }

    // Send to Expo Push API
    const messages = tokens.map(tokenData => ({
      to: tokenData.token,
      title,
      body,
      data,
      sound: 'default',
      priority: 'high',
    }));

    // You'll need to call Expo's push API here
    // For now, just log the messages
    console.log('Would send push notifications:', messages);
    
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}
```

## 📱 **Step 6: Initialize in Your App**

Update your `hooks/useAuth.ts`:

```typescript
import { pushNotificationService } from '../services/pushNotificationService';

// In your useAuth hook, after successful login:
useEffect(() => {
  if (user) {
    // Initialize push notifications
    pushNotificationService.initialize(user.id);
  }
}, [user]);
```

## 📱 **Step 7: Test Push Notifications**

Create a test button in your admin dashboard:

```typescript
const testPushNotification = async () => {
  await pushNotificationService.sendLocalNotification(
    'Test Notification',
    'This is a test push notification from CUBS EMS'
  );
};
```

## 🚀 **Step 8: Deploy with Expo Build**

For production push notifications:

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for production
eas build --platform all
```

## 📊 **Current Email Intervals Summary**

Your email system is already working with these intervals:
- **90 days** → Notice level notification
- **60 days** → Warning level notification  
- **30 days** → Urgent level notification
- **7 days** → Urgent level notification
- **1 day** → Critical level notification

**To customize intervals**, edit this line in `supabase/functions/send-visa-notifications/index.ts`:
```typescript
const NOTIFICATION_INTERVALS = [90, 60, 30, 7, 1]; // Change these numbers
```

## 🔧 **Quick Actions**

1. **Test Current Email System**: Use "Test Visa Automation" button in admin dashboard
2. **View Email Logs**: Check admin notifications page for delivery status
3. **Customize Email Template**: Edit the HTML template in the Edge Function
4. **Add Push Notifications**: Follow steps above for mobile notifications

The email system is production-ready and costs $0. Push notifications require additional setup but will provide instant alerts to users' devices. 