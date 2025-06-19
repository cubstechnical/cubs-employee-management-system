import { Platform } from 'react-native';
import { supabase, isSupabaseConfigured } from './supabase';

export interface PlatformValidationResult {
  isValid: boolean;
  platform: 'web' | 'ios' | 'android' | 'native';
  services: {
    supabase: ServiceStatus;
    backblaze: ServiceStatus;
    sendgrid: ServiceStatus;
    storage: ServiceStatus;
  };
  recommendations: string[];
}

export interface ServiceStatus {
  configured: boolean;
  available: boolean;
  error?: string;
  features: string[];
}

/**
 * Validate all services across different platforms
 */
export async function validatePlatformServices(): Promise<PlatformValidationResult> {
  const currentPlatform = Platform.OS === 'web' ? 'web' : Platform.OS;
  const recommendations: string[] = [];

  // Validate Supabase
  const supabaseStatus = await validateSupabase();
  if (!supabaseStatus.configured) {
    recommendations.push('Configure Supabase environment variables (EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY)');
  }

  // Validate Backblaze B2
  const backblazeStatus = validateBackblazeB2();
  if (!backblazeStatus.configured) {
    recommendations.push('Configure Backblaze B2 environment variables for document storage');
  }

  // Validate SendGrid
  const sendgridStatus = validateSendGrid();
  if (!sendgridStatus.configured) {
    recommendations.push('Configure SendGrid API key for email notifications');
  }

  // Validate Storage
  const storageStatus = await validateStorage();
  if (!storageStatus.available) {
    recommendations.push('Enable storage permissions for document uploads');
  }

  const isValid = supabaseStatus.configured && 
                  backblazeStatus.configured && 
                  sendgridStatus.configured && 
                  storageStatus.available;

  return {
    isValid,
    platform: currentPlatform as any,
    services: {
      supabase: supabaseStatus,
      backblaze: backblazeStatus,
      sendgrid: sendgridStatus,
      storage: storageStatus,
    },
    recommendations,
  };
}

/**
 * Validate Supabase configuration and connectivity
 */
async function validateSupabase(): Promise<ServiceStatus> {
  const configured = isSupabaseConfigured;
  let available = false;
  let error: string | undefined;
  const features: string[] = [];

  if (configured) {
    try {
      // Test connection
      const { data, error: testError } = await supabase.from('employees').select('count').limit(1);
      if (testError) {
        error = `Supabase connection failed: ${testError.message}`;
      } else {
        available = true;
        features.push('Database queries', 'Real-time subscriptions', 'Authentication', 'Row Level Security');
      }
    } catch (err) {
      error = `Supabase test failed: ${err}`;
    }
  } else {
    error = 'Supabase environment variables not configured';
  }

  return {
    configured,
    available,
    error,
    features,
  };
}

/**
 * Validate Backblaze B2 configuration
 */
function validateBackblazeB2(): ServiceStatus {
  const b2ApiUrl = process.env.EXPO_PUBLIC_B2_API_URL;
  const b2BucketName = process.env.EXPO_PUBLIC_B2_BUCKET_NAME;
  const b2KeyId = process.env.EXPO_PUBLIC_B2_KEY_ID;
  const b2ApplicationKey = process.env.EXPO_PUBLIC_B2_APPLICATION_KEY;

  const configured = !!(b2ApiUrl && b2BucketName && b2KeyId && b2ApplicationKey) &&
                    b2ApiUrl !== 'your-b2-api-url' &&
                    b2BucketName !== 'your-bucket-name';

  let available = configured;
  let error: string | undefined;
  const features: string[] = [];

  if (configured) {
    features.push('Document upload', 'File storage', 'Secure download URLs', 'Storage statistics');
    
    // Check platform-specific features
    if (Platform.OS === 'web') {
      features.push('Drag & drop uploads', 'Progress tracking');
    } else {
      features.push('Camera integration', 'Document picker', 'Background uploads');
    }
  } else {
    error = 'Backblaze B2 environment variables not configured';
    available = false;
  }

  return {
    configured,
    available,
    error,
    features,
  };
}

/**
 * Validate SendGrid email configuration
 */
function validateSendGrid(): ServiceStatus {
  const sendgridApiKey = process.env.EXPO_PUBLIC_SENDGRID_API_KEY;
  const fromEmail = process.env.EXPO_PUBLIC_SENDGRID_FROM_EMAIL;

  const configured = !!(sendgridApiKey && fromEmail) &&
                    sendgridApiKey !== 'your-sendgrid-api-key';

  let available = false;
  let error: string | undefined;
  const features: string[] = [];

  if (configured) {
    // Email is typically server-side only, but we can validate config
    if (Platform.OS === 'web') {
      available = true;
      features.push('Email notifications', 'Visa expiry reminders', 'Bulk emails', 'HTML templates');
    } else {
      // Mobile platforms can trigger emails via API
      available = true;
      features.push('Email triggers', 'Notification scheduling', 'Template management');
    }
  } else {
    error = 'SendGrid environment variables not configured';
  }

  return {
    configured,
    available,
    error,
    features,
  };
}

/**
 * Validate local storage capabilities
 */
async function validateStorage(): Promise<ServiceStatus> {
  let available = false;
  let error: string | undefined;
  const features: string[] = [];

  try {
    if (Platform.OS === 'web') {
      // Web storage validation
      if ('localStorage' in window && 'sessionStorage' in window) {
        available = true;
        features.push('Local storage', 'Session storage', 'IndexedDB', 'File API');
      } else {
        error = 'Web storage APIs not available';
      }
    } else {
      // React Native storage validation
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
      
      // Test AsyncStorage
      const testKey = '@test_key';
      await AsyncStorage.setItem(testKey, 'test');
      const testValue = await AsyncStorage.getItem(testKey);
      await AsyncStorage.removeItem(testKey);
      
      if (testValue === 'test') {
        available = true;
        features.push('AsyncStorage', 'Secure storage', 'Offline caching', 'File system access');
      } else {
        error = 'AsyncStorage test failed';
      }
    }
  } catch (err) {
    error = `Storage validation failed: ${err}`;
  }

  return {
    configured: true, // Storage is always "configured"
    available,
    error,
    features,
  };
}

/**
 * Get platform-specific configuration recommendations
 */
export function getPlatformRecommendations(): string[] {
  const recommendations: string[] = [];

  if (Platform.OS === 'web') {
    recommendations.push(
      'Enable HTTPS for production deployment',
      'Configure PWA manifest for app-like experience',
      'Set up service worker for offline functionality',
      'Optimize bundle size for faster loading'
    );
  } else if (Platform.OS === 'ios') {
    recommendations.push(
      'Configure iOS-specific permissions in Info.plist',
      'Set up push notifications via APNS',
      'Enable background app refresh for sync',
      'Configure deep linking schemes'
    );
  } else if (Platform.OS === 'android') {
    recommendations.push(
      'Configure Android permissions in AndroidManifest.xml',
      'Set up push notifications via FCM',
      'Enable background sync capabilities',
      'Configure Android-specific navigation'
    );
  }

  return recommendations;
}

/**
 * Initialize services based on platform
 */
export async function initializePlatformServices(): Promise<void> {
  console.log(`🚀 Initializing services for ${Platform.OS} platform...`);

  const validation = await validatePlatformServices();
  
  if (validation.isValid) {
    console.log('✅ All services configured and available');
  } else {
    console.warn('⚠️ Some services are not properly configured:');
    validation.recommendations.forEach(rec => console.warn(`  - ${rec}`));
  }

  // Initialize platform-specific features
  if (Platform.OS === 'web') {
    // Web-specific initialization
    console.log('🌐 Initializing web-specific features...');
  } else {
    // Mobile-specific initialization
    console.log('📱 Initializing mobile-specific features...');
  }
}

/**
 * Get service status summary
 */
export async function getServiceStatusSummary(): Promise<string> {
  const validation = await validatePlatformServices();
  const { services } = validation;
  
  const statusEmojis = {
    supabase: services.supabase.available ? '✅' : '❌',
    backblaze: services.backblaze.available ? '✅' : '❌',
    sendgrid: services.sendgrid.available ? '✅' : '❌',
    storage: services.storage.available ? '✅' : '❌',
  };

  return `
Platform: ${validation.platform.toUpperCase()}
Services Status:
${statusEmojis.supabase} Supabase Database & Auth
${statusEmojis.backblaze} Backblaze B2 Storage  
${statusEmojis.sendgrid} SendGrid Email Service
${statusEmojis.storage} Local Storage
${validation.isValid ? '✅ All systems operational' : '⚠️ Some services need configuration'}
  `.trim();
} 