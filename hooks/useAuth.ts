import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee' | 'public';
  avatar_url?: string | null;
  created_at: string;
}

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
      
      if (!isSupabaseConfigured) {
        // Demo mode - simulate login with predefined users
        console.log('🎮 [AUTH] Demo mode login for:', email);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
        
        // Define demo users
        const demoUsers = [
          {
            email: 'admin@cubs.com',
            password: 'admin123',
            user: {
              id: 'demo-admin-001',
              email: 'admin@cubs.com',
              name: 'Admin User',
              role: 'admin' as const,
              avatar_url: null,
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
              avatar_url: null,
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
              avatar_url: null,
              created_at: new Date().toISOString(),
            }
          }
        ];
        
        // Check for valid demo credentials
        const demoUser = demoUsers.find(u => u.email === email && u.password === password);
        
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
            avatar_url: null,
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
        // Fetch user profile data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          // Continue with basic user data if profile fetch fails
        }

        const user: User = {
          id: data.user.id,
          email: data.user.email!,
          name: profile?.full_name || data.user.user_metadata?.name || 'User',
          role: profile?.role || 'employee',
          avatar_url: profile?.avatar_url || null,
          created_at: data.user.created_at,
        };

        console.log('✅ [AUTH] Supabase login successful:', user);
        set({ user, isLoading: false });
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
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ [AUTH] Session error:', error);
        set({ user: null, isLoading: false, error: error.message });
        return;
      }
      
      if (session?.user) {
        console.log('✅ [AUTH] Session found, fetching profile...');
        try {
          // Fetch profile from Supabase
          const profile = await fetchUserProfile(session.user.id);
          const user: User = {
            id: profile.id,
            email: profile.email,
            name: profile.full_name || profile.email.split('@')[0] || 'User',
            role: profile.role,
            created_at: session.user.created_at,
          };
          console.log('✅ [AUTH] Profile found, user authenticated:', user);
          
          // Only update state if we're still loading (prevents race conditions)
          const latestState = get();
          if (latestState.isLoading) {
            set({ user, isLoading: false, error: null });
          } else {
            console.log('⚠️ [AUTH] State changed during profile fetch, skipping update');
          }
        } catch (profileError) {
          console.error('❌ [AUTH] Profile not found during auth check:', profileError);
          
          // Only update state if we're still loading
          const latestState = get();
          if (latestState.isLoading) {
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
        redirectTo: `${window.location.origin}/reset-password`,
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
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Supabase profile fetch error:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('Profile not found');
    }
    
    return data;
  } catch (error) {
    console.error('Profile fetch failed:', error);
    throw error;
  }
} 