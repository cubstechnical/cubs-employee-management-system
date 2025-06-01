import React, { useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Button, Card, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';

const iconImage = require('../../assets/icon.png');

export default function PendingApprovalScreen() {
  const theme = useTheme(); // Use basic Paper theme only
  const { user, logout } = useAuth();
  const [email, setEmail] = useState('');

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleRefresh = () => {
    // Refresh the current screen to check if user has been approved
    router.replace('/(auth)/pending');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Image 
            source={iconImage} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
            Cubs Technical Contracting
          </Text>
          <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Employee Management System
          </Text>
        </View>

        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <Text style={[styles.icon, { color: theme.colors.primary }]}>⏳</Text>
            </View>
            
            <Text variant="headlineSmall" style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              Account Pending Approval
            </Text>
            
            <Text variant="bodyMedium" style={[styles.message, { color: theme.colors.onSurfaceVariant }]}>
              Thank you for registering, {user?.name || user?.email}!
            </Text>
            
            <Text variant="bodyMedium" style={[styles.message, { color: theme.colors.onSurfaceVariant }]}>
              Your account is currently pending approval from an administrator. 
              You'll receive access to the employee management system once your account has been approved.
            </Text>
            
            <Text variant="bodySmall" style={[styles.note, { color: theme.colors.onSurfaceVariant }]}>
              This usually takes 1-2 business days. You can check back later or contact your administrator if you have any questions.
            </Text>
          </Card.Content>
        </Card>

        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={handleRefresh}
            style={styles.button}
          >
            Check Status
          </Button>
          
          <Button
            mode="contained"
            onPress={handleLogout}
            style={styles.button}
          >
            Logout
          </Button>
        </View>

        <View style={styles.footer}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Need help? Contact your system administrator.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 48,
  },
  card: {
    marginBottom: 48,
    borderRadius: 12,
  },
  cardContent: {
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  icon: {
    fontSize: 64,
  },
  cardTitle: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: 'bold',
  },
  message: {
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  note: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 18,
  },
  actions: {
    gap: 16,
    marginBottom: 32,
  },
  button: {
    paddingVertical: 4,
  },
  footer: {
    alignItems: 'center',
  },
}); 