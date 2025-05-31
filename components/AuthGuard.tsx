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
      if (!isLoading && !user) {
        router.replace('/(auth)/login');
      }
    }, [user, isLoading]);

    if (isLoading) {
      return <LoadingScreen />;
    }

    if (!user) {
      return null;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace('/(auth)/login');
      return null;
    }

    return <WrappedComponent {...props} />;
  };
} 