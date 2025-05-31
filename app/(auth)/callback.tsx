import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';

export default function AuthCallbackScreen() {
  const theme = useTheme();
  const { checkAuth } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check auth state using the existing method
        await checkAuth();
        
        // Get the current session to verify
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.replace('/(auth)/login');
          return;
        }

        if (session?.user) {
          // Redirect to dashboard
          router.replace('/(admin)/dashboard');
        } else {
          // No session, redirect to login
          router.replace('/(auth)/login');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.replace('/(auth)/login');
      }
    };

    handleAuthCallback();
  }, [checkAuth]);

  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
      backgroundColor: theme.colors.background 
    }}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={{ 
        marginTop: 16, 
        color: theme.colors.onBackground,
        fontSize: 16 
      }}>
        Completing sign in...
      </Text>
    </View>
  );
} 