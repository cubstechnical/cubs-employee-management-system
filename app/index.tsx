import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { router, useSegments } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

export default function IndexScreen() {
  const { user, isLoading, checkAuth, error } = useAuth();
  const [isNavigating, setIsNavigating] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const segments = useSegments();

  useEffect(() => {
    console.log('🚀 [INDEX] Screen mounted, starting auth check...');
    
    // Initialize auth check
    const initAuth = async () => {
      await checkAuth();
      setHasInitialized(true);
    };
    
    initAuth();
  }, []); // Empty dependency array - only run once on mount

  useEffect(() => {
    // Only process navigation after initial auth check is complete
    if (!hasInitialized) {
      console.log('⏳ [INDEX] Waiting for initialization...');
      return;
    }

    console.log('🔄 [INDEX] Auth state changed:', { 
      hasUser: !!user, 
      userRole: user?.role, 
      isLoading, 
      hasError: !!error,
      isNavigating,
      segments,
      hasInitialized
    });
    
    if (!isLoading && !isNavigating && hasInitialized) {
      setIsNavigating(true);
      
      // Add a longer delay to ensure all providers are ready
      setTimeout(() => {
        try {
          if (error) {
            // If there's an auth error, go to login
            console.log('🔀 [INDEX] Auth error detected, redirecting to login');
            router.replace('/(auth)/login');
          } else if (user) {
            // Redirect based on user role
            const route = user.role === 'admin' ? '/(admin)/dashboard' : '/(employee)/dashboard';
            console.log(`🔀 [INDEX] User found (${user.role}), redirecting to: ${route}`);
            router.replace(route);
          } else {
            // No user, redirect to login
            console.log('🔀 [INDEX] No user found, redirecting to login');
            router.replace('/(auth)/login');
          }
        } catch (navError) {
          console.error('❌ [INDEX] Navigation error:', navError);
          setIsNavigating(false);
        }
      }, 200); // Increased delay for better stability
    } else if (isLoading) {
      console.log('⏳ [INDEX] Still loading, waiting...');
    }
  }, [user, isLoading, error, isNavigating, hasInitialized]);

  console.log('🎨 [INDEX] Rendering loading screen...');

  // Show loading screen using core React Native components (no Paper dependency)
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
      <ActivityIndicator size="large" color="#DD1A51" />
      <Text style={{ marginTop: 16, color: '#666666', fontSize: 16 }}>
        {!hasInitialized ? 'Starting up...' : 'Initializing...'}
      </Text>
      {error && (
        <Text style={{ marginTop: 8, color: '#F44336', fontSize: 14 }}>
          Authentication error
        </Text>
      )}
    </View>
  );
} 
