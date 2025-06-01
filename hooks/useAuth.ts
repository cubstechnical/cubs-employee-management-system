import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee' | 'public';
  created_at: string;
}

// Demo users for testing
const DEMO_USERS = [
  {
    email: 'admin@cubs.com',
    password: 'admin123',
    user: {
      id: 'demo-admin-001',
      email: 'admin@cubs.com',
      name: 'Admin User',
      role: 'admin' as const,
      created_at: new Date().toISOString(),
    }
  },
  {
    email: 'manager@cubs.com',
    password: 'manager123',
    user: {
      id: 'demo-manager-001',
      email: 'manager@cubs.com',
      name: 'Manager User',
      role: 'admin' as const,
      created_at: new Date().toISOString(),
    }
  },
  {
    email: 'employee@cubs.com',
    password: 'employee123',
    user: {
      id: 'demo-employee-001',
      email: 'employee@cubs.com',
      name: 'Employee User',
      role: 'employee' as const,
      created_at: new Date().toISOString(),
    }
  }
];

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string, role?: 'admin' | 'employee' | 'public') => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      
      // Check for demo mode first
      if (!isSupabaseConfigured) {
        console.log('🎭 [AUTH] Demo mode detected, checking demo users...');
        
        const demoUser = DEMO_USERS.find(user => user.email === email);
        
        if (demoUser) {
          console.log('✅ [AUTH] Demo login successful:', demoUser.user);
          set({ user: demoUser.user, isLoading: false });
          return;
        } else {
          // For demo mode, allow any email/password combination as an employee
          console.log('🎭 [AUTH] Creating dynamic demo user for:', email);
          const dynamicUser: User = {
            id: `demo-${email.split('@')[0]}-${Date.now()}`,
            email: email,
            name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
            role: 'employee',
            created_at: new Date().toISOString(),
          };
          set({ user: dynamicUser, isLoading: false });
          return;
        }
      }

      // Real Supabase authentication
      console.log('🔐 [AUTH] Attempting Supabase authentication for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        try {
          // Fetch user profile data using the centralized helper
          const profile = await fetchUserProfile(data.user.id);

        const user: User = {
          id: data.user.id,
          email: data.user.email!,
            name: profile.full_name || data.user.user_metadata?.name || 'User',
            role: profile.role,
            created_at: data.user.created_at,
          };

          console.log('✅ [AUTH] Supabase login successful, profile fetched:', user);
          set({ user, isLoading: false });

        } catch (profileError: any) {
          console.error('❌ [AUTH] Profile fetch failed during login:', profileError);
          
          // If profile doesn't exist, try to create it automatically
          if (profileError.message.includes('Profile not found')) {
            console.log('🔧 [AUTH] Profile not found, attempting to create it...');
            
            try {
              await createMissingProfile(data.user);
              const profile = await fetchUserProfile(data.user.id);

              const user: User = {
                id: data.user.id,
                email: data.user.email!,
                name: profile.full_name || data.user.user_metadata?.name || 'User',
                role: profile.role,
          created_at: data.user.created_at,
        };

              console.log('✅ [AUTH] Profile created and login successful:', user);
        set({ user, isLoading: false });
              return;

            } catch (createError) {
              console.error('❌ [AUTH] Failed to create missing profile:', createError);
              const errorMessage = createError instanceof Error ? createError.message : 'Unknown error';
              throw new Error(`User profile not found and could not be created: ${errorMessage}`);
            }
          }
          
          // If profile is not found, this is a critical issue.
          // Do not proceed with a partially formed user object.
          // Throw an error to be caught by the main try-catch block.
          throw new Error(`User profile not found or inaccessible: ${profileError.message}`);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      console.error('❌ [AUTH] Login error:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Alias for login to match component expectations
  signIn: async (email: string, password: string) => {
    return get().login(email, password);
  },

  // Sign up method for new user registration
  signUp: async (email: string, password: string, fullName: string) => {
    return get().register(email, password, fullName, 'employee');
  },

  register: async (email: string, password: string, name: string, role: 'admin' | 'employee' | 'public' = 'public') => {
    try {
      set({ isLoading: true, error: null });
      console.log('Attempting registration with Supabase...');

      if (!isSupabaseConfigured) {
        // Demo mode - create a demo user
        console.log('Supabase not configured, using demo mode');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        
        const demoUser: User = {
          id: 'demo-' + email.split('@')[0],
          email: email,
          name: name,
          role: role,
          created_at: new Date().toISOString(),
        };
        
        set({ user: demoUser, isLoading: false });
        console.log('Demo registration successful:', demoUser);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.user) {
        // Manually create profile if it doesn't exist (in case trigger isn't working)
        try {
          const profile = await fetchUserProfile(data.user.id);
          const user: User = {
            id: profile.id,
            email: profile.email,
            name: profile.full_name || profile.email.split('@')[0] || 'User',
            role: profile.role,
            created_at: data.user.created_at,
          };
          set({ user, isLoading: false });
          console.log('Registration successful:', user);
        } catch (profileError) {
          console.log('Profile not found, creating manually...');
          // Create profile manually
          const { error: profileCreateError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email || email,
              full_name: name,
              role: role,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              approved_by: null,
            });

          if (profileCreateError) {
            console.error('Error creating profile:', profileCreateError);
            throw new Error('Database error saving new user');
          }

          // Now fetch the created profile
          const profile = await fetchUserProfile(data.user.id);
          const user: User = {
            id: profile.id,
            email: profile.email,
            name: profile.full_name || profile.email.split('@')[0] || 'User',
            role: profile.role,
            created_at: data.user.created_at,
          };
          set({ user, isLoading: false });
          console.log('Registration successful with manual profile creation:', user);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      console.error('Registration error:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true, error: null });
      console.log('Attempting logout...');
      
      if (!isSupabaseConfigured) {
        // Demo mode - just clear the user
        console.log('Demo mode logout');
        set({ user: null, isLoading: false });
        return;
      }
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw new Error(error.message);
      }

      set({ user: null, isLoading: false });
      console.log('Logout successful');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      console.error('Logout error:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  checkAuth: async () => {
    const currentState = get();
    
    // Prevent multiple simultaneous auth checks
    if (currentState.isLoading) {
      console.log('🔄 [AUTH] Auth check already in progress, skipping...');
      return;
    }

    try {
      console.log('🔍 [AUTH] Starting checkAuth...');
      set({ isLoading: true, error: null });

      if (!isSupabaseConfigured) {
        // Demo mode - no persistent session
        console.log('🎮 [AUTH] Demo mode: no persistent session, setting user to null');
        set({ user: null, isLoading: false, error: null });
        return;
      }
      
      console.log('🔍 [AUTH] Fetching session from Supabase...');
      const { data: authUserResponse, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ [AUTH] Error getting user from Supabase:', authError);
        set({ user: null, isLoading: false, error: authError.message });
        return;
      }
      
      const supabaseUser = authUserResponse.user;

      if (supabaseUser) {
        console.log('✅ [AUTH] Supabase user found via getUser(), fetching profile for ID:', supabaseUser.id);
        try {
          const profile = await fetchUserProfile(supabaseUser.id);
          const user: User = {
            id: profile.id,
            email: profile.email,
            name: profile.full_name || supabaseUser.email?.split('@')[0] || 'User',
            role: profile.role,
            created_at: supabaseUser.created_at || new Date().toISOString(),
          };
          console.log('✅ [AUTH] Profile found after initial getUser(), user authenticated:', user);
            set({ user, isLoading: false, error: null });
        } catch (profileError) {
          console.warn('⚠️ [AUTH] Initial profile fetch failed after getUser():', profileError);
          console.log('🔄 [AUTH] Attempting session refresh and retrying profile fetch...');
          
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error('❌ [AUTH] Session refresh failed:', refreshError);
            set({ user: null, isLoading: false, error: 'Session refresh failed' });
            return;
          }

          const refreshedSupabaseUser = refreshData.user;

          if (refreshedSupabaseUser) {
            console.log('✅ [AUTH] Session refreshed, new user object:', refreshedSupabaseUser.id);
            try {
              const profile = await fetchUserProfile(refreshedSupabaseUser.id);
              const user: User = {
                id: profile.id,
                email: profile.email,
                name: profile.full_name || refreshedSupabaseUser.email?.split('@')[0] || 'User',
                role: profile.role,
                created_at: refreshedSupabaseUser.created_at || new Date().toISOString(),
              };
              console.log('✅ [AUTH] Profile found after session refresh, user authenticated:', user);
              set({ user, isLoading: false, error: null });
            } catch (secondProfileError) {
              console.error('❌ [AUTH] Profile fetch failed even after session refresh:', secondProfileError);
              set({ user: null, isLoading: false, error: 'Profile fetch failed after refresh' });
            }
          } else {
            console.log('ℹ️ [AUTH] No user after session refresh.');
            set({ user: null, isLoading: false, error: null });
          }
        }
      } else {
        console.log('ℹ️ [AUTH] No session found, user not authenticated');
        
        // Only update state if we're still loading
        const latestState = get();
        if (latestState.isLoading) {
          set({ user: null, isLoading: false, error: null });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Auth check failed';
      console.error('❌ [AUTH] Unexpected error during auth check:', error);
      
      // Always clear loading state on error
      set({ error: null, isLoading: false, user: null });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  resetPassword: async (email: string) => {
    try {
      set({ isLoading: true, error: null });
      
      if (!isSupabaseConfigured) {
        // Demo mode - simulate reset
        await new Promise(resolve => setTimeout(resolve, 1000));
        set({ isLoading: false });
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/(auth)/reset-password`,
      });

      if (error) {
        throw error;
      }

      set({ isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Reset password failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updatePassword: async (password: string) => {
    try {
      set({ isLoading: true, error: null });
      
      if (!isSupabaseConfigured) {
        // Demo mode - simulate password update
        await new Promise(resolve => setTimeout(resolve, 1000));
        set({ isLoading: false });
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      set({ isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password update failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  refreshUser: async () => {
    try {
      await get().checkAuth();
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  },
}));

// Add this helper to fetch profile from Supabase
async function fetchUserProfile(userId: string) {
  try {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured');
    }
    
    console.log(`[fetchUserProfile] Attempting to fetch profile for userId: ${userId}`);
    const { data, error, status, statusText } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Supabase profile fetch error:', error);
      throw error;
    }
    
    if (!data) {
      console.warn(`[fetchUserProfile] Profile not found for ${userId} (data is null)`);
      throw new Error('Profile not found');
    }
    
    return data;

  } catch (error) {
    console.error(`Profile fetch failed for userId ${userId}:`, error);
    throw error;
  }
} 

// Helper function to create missing profile
async function createMissingProfile(supabaseUser: SupabaseUser) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }
  
  console.log(`[createMissingProfile] Creating profile for user: ${supabaseUser.id}`);
  
  const { error } = await supabase
    .from('profiles')
    .insert({
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      full_name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
      role: 'employee', // Default role
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      approved_by: null,
    });

  if (error) {
    console.error('Error creating missing profile:', error);
    throw error;
  }
  
  console.log(`✅ [createMissingProfile] Profile created successfully for ${supabaseUser.id}`);
}