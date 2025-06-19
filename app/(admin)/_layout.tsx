import React from 'react';
import { Stack } from 'expo-router';
import { withAuthGuard } from '../../components/AuthGuard';

function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="employees" />
      <Stack.Screen name="documents" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="approvals" />
    </Stack>
  );
}

export default withAuthGuard({
  WrappedComponent: AdminLayout,
  allowedRoles: ['admin']
}); 