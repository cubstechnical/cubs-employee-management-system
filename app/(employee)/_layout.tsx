import React from 'react';
import { Stack } from 'expo-router';

export default function EmployeeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="documents" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
} 