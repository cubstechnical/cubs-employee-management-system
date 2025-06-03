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
        console.log(`[AuthGuard] Checking access for component: ${WrappedComponent.name}`);
        console.log(`[AuthGuard] User:`, user);
        console.log(`[AuthGuard] Allowed roles:`, allowedRoles);
        
        if (!user) {
          console.log('[AuthGuard] No user, redirecting to login.');
          router.replace('/(auth)/login');
        } else if (allowedRoles && !allowedRoles.includes(user.role)) {
          console.log(`[AuthGuard] User role '${user.role}' not in allowed roles [${allowedRoles.join(', ')}], redirecting to login.`);
          router.replace('/(auth)/login');
        } else {
          console.log(`[AuthGuard] Access granted for user role '${user.role}'`);
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