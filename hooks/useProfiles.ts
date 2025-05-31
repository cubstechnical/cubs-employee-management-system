import { create } from 'zustand';
import { supabase } from '../services/supabase';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'employee' | 'public';
  created_at: string;
  updated_at: string;
  approved_by: string | null;
}

interface ProfilesState {
  profiles: Profile[];
  pendingProfiles: Profile[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchProfiles: () => Promise<void>;
  fetchPendingProfiles: () => Promise<void>;
  approveUser: (userId: string, approverId: string) => Promise<void>;
  rejectUser: (userId: string) => Promise<void>;
  updateUserRole: (userId: string, role: 'admin' | 'employee' | 'public') => Promise<void>;
  clearError: () => void;
}

export const useProfiles = create<ProfilesState>((set, get) => ({
  profiles: [],
  pendingProfiles: [],
  isLoading: false,
  error: null,

  fetchProfiles: async () => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      set({ profiles: data || [], isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch profiles';
      console.error('Error fetching profiles:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  fetchPendingProfiles: async () => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'public')
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      set({ pendingProfiles: data || [], isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch pending profiles';
      console.error('Error fetching pending profiles:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  approveUser: async (userId: string, approverId: string) => {
    try {
      set({ error: null });
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: 'employee', 
          approved_by: approverId,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      // Update local state - remove from pending and update in profiles
      const currentPending = get().pendingProfiles;
      const currentProfiles = get().profiles;
      
      const approvedUser = currentPending.find(user => user.id === userId);
      if (approvedUser) {
        const updatedUser = { 
          ...approvedUser, 
          role: 'employee' as const, 
          approved_by: approverId,
          updated_at: new Date().toISOString()
        };
        
        set({
          pendingProfiles: currentPending.filter(user => user.id !== userId),
          profiles: currentProfiles.map(user => 
            user.id === userId ? updatedUser : user
          )
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve user';
      console.error('Error approving user:', error);
      set({ error: errorMessage });
      throw error;
    }
  },

  rejectUser: async (userId: string) => {
    try {
      set({ error: null });
      
      // Delete the user profile (you could also set a 'rejected' status instead)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        throw error;
      }

      // Update local state
      const currentPending = get().pendingProfiles;
      const currentProfiles = get().profiles;
      
      set({
        pendingProfiles: currentPending.filter(user => user.id !== userId),
        profiles: currentProfiles.filter(user => user.id !== userId)
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject user';
      console.error('Error rejecting user:', error);
      set({ error: errorMessage });
      throw error;
    }
  },

  updateUserRole: async (userId: string, role: 'admin' | 'employee' | 'public') => {
    try {
      set({ error: null });
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      // Update local state
      const currentProfiles = get().profiles;
      const updatedProfiles = currentProfiles.map(user => 
        user.id === userId 
          ? { ...user, role, updated_at: new Date().toISOString() }
          : user
      );
      
      set({ profiles: updatedProfiles });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user role';
      console.error('Error updating user role:', error);
      set({ error: errorMessage });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
})); 