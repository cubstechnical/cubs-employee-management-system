import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { useAuth, User } from '../hooks/useAuth';

function LoadingScreen() {
  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
      backgroundColor: '#ffffff'
    }}>
      <ActivityIndicator size="large" color="#DD1A51" />
      <Text style={{ marginTop: 16, color: '#666666', fontSize: 16 }}>
        Loading...
      </Text>
    </View>
  );
}

interface AuthGuardProps<P extends object> {
  WrappedComponent: React.ComponentType<P>;
  allowedRoles?: User['role'][];
}

export function withAuthGuard<P extends object>({ WrappedComponent, allowedRoles }: AuthGuardProps<P>) {
  return function AuthGuardWrapper(props: P) {
    const { user, isLoading } = useAuth();

    useEffect(() => {
      if (!isLoading) {
        if (!user) {
          console.log('[AuthGuard] No user, redirecting to login.');
          router.replace('/(auth)/login');
        } else if (allowedRoles && !allowedRoles.includes(user.role)) {
          console.log(`[AuthGuard] User role '${user.role}' not in allowed roles, redirecting to login.`);
          router.replace('/(auth)/login');
        }
      }
    }, [user, isLoading, allowedRoles]);

    if (isLoading) {
      return <LoadingScreen />;
    }

    if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
} 