import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Environment variables - configure these in your .env file
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// Check if Supabase is properly configured
const isSupabaseConfigured = supabaseUrl !== 'https://your-project.supabase.co' && supabaseAnonKey !== 'your-anon-key';

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase not configured! Using placeholder values. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.');
}

// Database types
export interface Database {
  public: {
    Tables: {
      employees: {
        Row: Employee;
        Insert: Omit<Employee, 'id'>;
        Update: Partial<Omit<Employee, 'id'>>;
      };
      employee_documents: {
        Row: EmployeeDocument;
        Insert: Omit<EmployeeDocument, 'id'>;
        Update: Partial<Omit<EmployeeDocument, 'id'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id'>;
        Update: Partial<Omit<Notification, 'id'>>;
      };
      notification_preferences: {
        Row: NotificationPreference;
        Insert: NotificationPreference;
        Update: Partial<NotificationPreference>;
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: 'admin' | 'employee' | 'public';
          created_at: string;
          updated_at: string;
          approved_by: string | null;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role: 'admin' | 'employee' | 'public';
          created_at?: string;
          updated_at?: string;
          approved_by?: string | null;
        };
        Update: Partial<{
          email: string;
          full_name: string;
          role: 'admin' | 'employee' | 'public';
          updated_at: string;
          approved_by: string | null;
        }>;
      };
    };
  };
}

// Employee interface
export interface Employee {
  id: string;
  employee_id: string;
  name: string;
  trade: string;
  nationality: string;
  date_of_birth: string;
  mobile_number: string;
  home_phone_number: string | null;
  email_id: string;
  company_id: string;
  company_name: string;
  join_date: string;
  visa_expiry_date: string;
  visa_status: string;
  passport_number: string;
  status: string;
  is_active: boolean;
}

// EmployeeDocument interface
export interface EmployeeDocument {
  id: string;
  employee_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  expiry_date: string | null;
  notes: string | null;
  document_number: string;
  issuing_authority: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

// Notification interface
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  read: boolean;
  category: string;
  metadata: any;
}

// NotificationPreference interface (if used)
export interface NotificationPreference {
  user_id: string;
  email: boolean;
  push: boolean;
  inApp: boolean;
  categories: string[];
}

// Custom storage adapter for React Native
const customStorageAdapter = {
  getItem: async (key: string) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Error getting item from AsyncStorage:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting item in AsyncStorage:', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from AsyncStorage:', error);
    }
  },
};

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorageAdapter,
    autoRefreshToken: isSupabaseConfigured,
    persistSession: isSupabaseConfigured,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: isSupabaseConfigured ? {} : {
      'x-demo-mode': 'true'
    }
  }
});

// Export configuration status
export { isSupabaseConfigured };

// Real-time subscriptions helper
export const subscribeToEmployeeChanges = (callback: (payload: any) => void) => {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, cannot subscribe to employee changes');
    return { unsubscribe: () => {} };
  }
  
  return supabase
    .channel('employee-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'employees' },
      callback
    )
    .subscribe();
};

export const subscribeToDocumentChanges = (callback: (payload: any) => void) => {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, cannot subscribe to document changes');
    return { unsubscribe: () => {} };
  }
  
  return supabase
    .channel('document-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'employee_documents' },
      callback
    )
    .subscribe();
};

// Error handling helper
export const handleSupabaseError = (error: any): string => {
  if (error?.message) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}; 