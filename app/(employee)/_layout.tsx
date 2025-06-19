import React from 'react';
import { Stack } from 'expo-router';
import { withAuthGuard } from '../../components/AuthGuard';

function EmployeeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="documents" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}

export default withAuthGuard({
  WrappedComponent: EmployeeLayout,
  allowedRoles: ['employee']
}); 