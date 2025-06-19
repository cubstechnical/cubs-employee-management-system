import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomTheme } from '../../theme';
import { safeThemeAccess } from '../../utils/errorPrevention';
import { withAuthGuard } from '../../components/AuthGuard';

function EmployeeNotificationsScreen() {
  const theme = useTheme() as CustomTheme;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: safeThemeAccess.colors(theme, 'background') }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text variant="headlineMedium">Notifications</Text>
        <Text variant="bodyLarge" style={{ marginTop: safeThemeAccess.spacing(theme, 'md'), color: safeThemeAccess.colors(theme, 'onSurfaceVariant') }}>
          This page will show employee notifications.
        </Text>
      </View>
    </SafeAreaView>
  );
}

export default withAuthGuard({
  WrappedComponent: EmployeeNotificationsScreen,
  allowedRoles: ['employee']
}); 

