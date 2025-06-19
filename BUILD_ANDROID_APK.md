# 📱 Building Android APK for CUBS Employee Management App

## 🚀 Quick Start (EAS Build - Recommended)

### Prerequisites
1. Install EAS CLI globally:
```bash
npm install -g @expo/eas-cli
```

2. Login to your Expo account:
```bash
eas login
```

### Step 1: Configure EAS Build
```bash
cd "/media/surya/New Volume/CUBS TECH APP"
eas build:configure
```

This creates `eas.json` configuration file.

### Step 2: Build Android APK
```bash
# For development APK (internal testing)
eas build --platform android --profile development

# For production APK (Google Play Store)
eas build --platform android --profile production

# For preview APK (testing without app store)
eas build --platform android --profile preview
```

### Step 3: Download Your APK
- Check build status: `eas build:list`
- Download APK from the provided URL or Expo dashboard

---

## 🛠️ Alternative Method: Local Build with Expo Development Build

### Prerequisites
1. Install Android Studio and set up Android SDK
2. Install Java Development Kit (JDK 11)

### Step 1: Install Development Build
```bash
npx expo install expo-dev-client
```

### Step 2: Generate Native Code
```bash
npx expo eject
# or
npx expo prebuild
```

### Step 3: Build APK Locally
```bash
cd android
./gradlew assembleDebug
# APK will be in: android/app/build/outputs/apk/debug/
```

---

## 📱 Manual Installation on Android Device

### Method 1: Direct Install
1. Download APK to your Android device
2. Enable "Install from Unknown Sources" in Settings
3. Open the APK file and install

### Method 2: ADB Install
```bash
# Connect device via USB with Developer Options enabled
adb install path/to/your-app.apk
```

---

## 🔧 Optimization Tips for Better Performance

### 1. Enable Hermes JavaScript Engine
Add to `app.json`:
```json
{
  "expo": {
    "jsEngine": "hermes"
  }
}
```

### 2. Optimize Bundle Size
```bash
# Analyze bundle size
npx expo export --dump-assetmap

# Tree-shake unused code
npx expo export --optimize
```

### 3. Enable ProGuard for Production
Add to `android/app/build.gradle`:
```gradle
android {
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

---

## 🚀 Production Deployment

### Google Play Store
1. Build production APK: `eas build --platform android --profile production`
2. Sign up for Google Play Console
3. Upload APK and configure store listing
4. Submit for review

### Internal Distribution
1. Build with: `eas build --platform android --profile preview`
2. Share APK directly or use Firebase App Distribution

---

## 🛡️ Security Considerations

### 1. Environment Variables
Ensure sensitive data is not exposed:
```bash
# Check for exposed secrets
grep -r "SUPABASE_ANON_KEY\|API_KEY" .
```

### 2. App Signing
- Use EAS Build for automatic signing
- Or configure manual signing in `android/app/build.gradle`

### 3. Network Security
Configure `android/app/src/main/res/xml/network_security_config.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">your-api-domain.com</domain>
    </domain-config>
</network-security-config>
```

---

## 📊 Performance Monitoring

### 1. Enable Flipper (Development)
```bash
npx expo install react-native-flipper
```

### 2. Add Crashlytics (Production)
```bash
npx expo install @react-native-firebase/crashlytics
```

### 3. Performance Metrics
```bash
# Bundle analyzer
npx react-native-bundle-visualizer
```

---

## 🔍 Troubleshooting

### Common Issues:

**Build Fails with Gradle Error:**
```bash
cd android
./gradlew clean
cd ..
npx expo run:android
```

**Metro Bundle Error:**
```bash
npx expo start --clear
```

**Dependency Conflicts:**
```bash
npm install --legacy-peer-deps
```

**Memory Issues:**
Add to `android/gradle.properties`:
```
org.gradle.jvmargs=-Xmx4g -XX:MaxPermSize=512m
```

---

## 📱 Quick Commands Summary

```bash
# Development build (fastest)
eas build --platform android --profile development

# Production build (optimized)
eas build --platform android --profile production

# Local development
npx expo run:android

# Check build status
eas build:list

# Submit to Google Play
eas submit --platform android
```

---

## 🎯 App Optimization Improvements Made

✅ **Fixed Filters** - All filter dropdowns now work properly  
✅ **Added Email Column** - Full email display without truncation  
✅ **Enhanced Status Cards** - Better visual status indicators  
✅ **Improved Performance** - Reduced animations, optimized rendering  
✅ **Better Table Layout** - Horizontal scrolling, better spacing  
✅ **Mobile Optimization** - Touch-friendly interactions  

---

**Need Help?** Check [Expo Documentation](https://docs.expo.dev/) or run `eas build --help` 