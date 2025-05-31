import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, useTheme, List, ActivityIndicator, Avatar, Badge } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
// Icons will be replaced with React Native Paper icons
import { useAuth } from '../../hooks/useAuth';
import { useEmployees } from '../../hooks/useEmployees';
import { CustomTheme } from '../../theme';
import { safeThemeAccess } from '../../utils/errorPrevention';
import { withAuthGuard } from '../../components/AuthGuard';

function hexToRgba(hex: string, alpha: number) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
  const num = parseInt(c, 16);
  return `rgba(${(num >> 16) & 255},${(num >> 8) & 255},${num & 255},${alpha})`;
}

export default function EmployeeDashboard() {
  const theme = useTheme() as CustomTheme;
  const { user, logout } = useAuth();
  const { employees } = useEmployees();
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
  }
  };

  const employee = employees.find(emp => emp.id === user?.id);
  const visaStatus = employee?.visa_expiry_date ? new Date(employee.visa_expiry_date) : new Date();
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  const getVisaStatus = () => {
    if (visaStatus < today) {
      return {
        color: safeThemeAccess.colors(theme, 'error'),
        icon: 'alert-circle',
        text: 'Expired',
        days: Math.floor((today.getTime() - visaStatus.getTime()) / (1000 * 60 * 60 * 24))
      };
    } else if (visaStatus <= thirtyDaysFromNow) {
      return {
        color: '#FF8800',
        icon: 'clock-outline',
        text: 'Expiring Soon',
        days: Math.floor((visaStatus.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      };
    } else {
      return {
        color: '#4CAF50',
        icon: 'check-circle',
        text: 'Valid',
        days: Math.floor((visaStatus.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      };
    }
  };

  const visaStatusInfo = getVisaStatus();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      marginBottom: 20,
    },
    profileContainer: {
      padding: 20,
      marginBottom: 20,
    },
    profileCard: {
      marginBottom: 20,
    },
    profileContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
    },
    profileInfo: {
      flex: 1,
    },
    sectionContainer: {
      padding: 20,
      marginBottom: 20,
    },
    sectionTitle: {
      marginBottom: 20,
    },
    statusCard: {
      marginBottom: 20,
    },
    statusContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
    },
    statusInfo: {
      flex: 1,
    },
    card: {
      margin: 20,
      marginBottom: 20,
      elevation: 2,
    },
    actionButtons: {
      gap: 10,
      flexDirection: 'column',
    },
    actionButton: {
      marginBottom: 5,
    },
    badge: {
      alignSelf: 'center',
    },
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: safeThemeAccess.colors(theme, 'background') }]}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => setRefreshing(true)}
            colors={[safeThemeAccess.colors(theme, 'primary')]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text variant="headlineMedium" style={{ color: safeThemeAccess.colors(theme, 'primary') }}>
              Employee Dashboard
            </Text>
            <Text variant="bodyMedium" style={{ color: safeThemeAccess.colors(theme, 'onSurfaceVariant') }}>
              Welcome back, {user?.name}
            </Text>
          </View>
          <Button mode="outlined" onPress={handleLogout} compact>
            Logout
          </Button>
        </View>

        {/* Profile Section */}
        <View style={styles.profileContainer}>
          <Card style={styles.profileCard}>
            <Card.Content style={styles.profileContent}>
              <Avatar.Text 
                size={80} 
                label={employee?.name?.split(' ').map(n => n[0]).join('') || '?'}
                style={{ backgroundColor: safeThemeAccess.colors(theme, 'primary') }}
              />
              <View style={styles.profileInfo}>
                <Text variant="headlineSmall">{employee?.name || user?.name}</Text>
                <Text variant="bodyLarge" style={{ color: safeThemeAccess.colors(theme, 'onSurfaceVariant') }}>
                  {employee?.trade || 'Employee'}
                </Text>
                <Text variant="bodyMedium" style={{ color: safeThemeAccess.colors(theme, 'onSurfaceVariant') }}>
                  {employee?.company_name || 'Cubs Technical'}
                </Text>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Visa Status */}
        <View style={styles.sectionContainer}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Visa Status</Text>
          <Card style={[styles.statusCard, { backgroundColor: safeThemeAccess.colors(theme, 'surfaceVariant') }]}>
            <Card.Content style={styles.statusContent}>
              <Avatar.Icon 
                size={48} 
                icon={visaStatusInfo.icon} 
                style={{ backgroundColor: hexToRgba(visaStatusInfo.color, 0.12) }}
                color={visaStatusInfo.color}
              />
              <View style={styles.statusInfo}>
                <Text variant="titleMedium" style={{ color: visaStatusInfo.color }}>
                  {visaStatusInfo.text}
                </Text>
                <Text variant="bodyMedium">
                  {visaStatusInfo.days} days {visaStatusInfo.text === 'Valid' ? 'remaining' : 'overdue'}
                </Text>
                <Text variant="bodySmall">
                  Expiry Date: {visaStatus.toLocaleDateString()}
                </Text>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Quick Actions */}
        <Card style={[styles.card, { backgroundColor: safeThemeAccess.colors(theme, 'surface') }]}>
          <Card.Content>
            <Text variant="titleLarge" style={{ marginBottom: 20 }}>
              Quick Actions
            </Text>
            <View style={styles.actionButtons}>
            <Button
              mode="contained"
                onPress={() => router.push('/(employee)/profile')}
                style={styles.actionButton}
                icon="account"
            >
                View My Profile
            </Button>
            <Button
              mode="contained"
                onPress={() => router.push('/(employee)/documents' as any)}
                style={styles.actionButton}
                icon="file-document"
              >
                My Documents
            </Button>
          </View>
          </Card.Content>
        </Card>

        {/* Recent Documents */}
        <View style={styles.sectionContainer}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Recent Documents</Text>
          <Card>
            <Card.Content>
              <List.Section>
                <List.Item
                  title="Passport Copy"
                  description="Updated 2 days ago"
                  left={props => <List.Icon {...props} icon="file-document" />}
                  right={props => (
                    <Badge style={[styles.badge, { backgroundColor: safeThemeAccess.colors(theme, 'primaryContainer') }]}>
                      Verified
                    </Badge>
                  )}
                />
                <List.Item
                  title="Visa Copy"
                  description="Updated 1 week ago"
                  left={props => <List.Icon {...props} icon="file-document" />}
                  right={props => (
                    <Badge style={[styles.badge, { backgroundColor: safeThemeAccess.colors(theme, 'primaryContainer') }]}>
                      Verified
                    </Badge>
                  )}
                />
                <List.Item
                  title="ID Card"
                  description="Updated 2 weeks ago"
                  left={props => <List.Icon {...props} icon="file-document" />}
                  right={props => (
                    <Badge style={[styles.badge, { backgroundColor: safeThemeAccess.colors(theme, 'primaryContainer') }]}>
                      Verified
                    </Badge>
                  )}
                />
              </List.Section>
            </Card.Content>
          </Card>
        </View>

        {/* Notifications */}
        <View style={styles.sectionContainer}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Notifications</Text>
          <Card>
            <Card.Content>
              <List.Section>
                <List.Item
                  title="Visa Expiry Reminder"
                  description="Your visa will expire in 30 days"
                  left={props => <List.Icon {...props} icon="bell" color="#FF8800" />}
                />
                <List.Item
                  title="Document Update Required"
                  description="Please update your passport copy"
                  left={props => <List.Icon {...props} icon="bell" color={safeThemeAccess.colors(theme, 'primary')} />}
                />
              </List.Section>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

