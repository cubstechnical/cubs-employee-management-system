import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { Text, Card, useTheme, Surface, Button, Chip, IconButton, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { CustomTheme } from '../theme';
import { safeThemeAccess } from '../utils/errorPrevention';

const { width } = Dimensions.get('window');

interface EmployeeDashboardStats {
  documentsUploaded: number;
  visaExpiryDays: number;
  profileCompletion: number;
  recentNotifications: number;
}

export default function EmployeeDashboard() {
  const theme = useTheme() as CustomTheme;
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<EmployeeDashboardStats>({
    documentsUploaded: 0,
    visaExpiryDays: 0,
    profileCompletion: 0,
    recentNotifications: 0,
  });

  useEffect(() => {
    // Mock data - in real app, this would come from API
    setStats({
      documentsUploaded: 12,
      visaExpiryDays: 90,
      profileCompletion: 85,
      recentNotifications: 3,
    });
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const quickActions = [
    {
      title: 'Upload Document',
      icon: 'file-upload',
      color: safeThemeAccess.colors(theme, 'primary'),
      onPress: () => router.push('/(employee)/documents'),
    },
    {
      title: 'View Profile',
      icon: 'account',
      color: safeThemeAccess.colors(theme, 'secondary'),
      onPress: () => router.push('/(employee)/profile'),
    },
    {
      title: 'Notifications',
      icon: 'bell',
      color: safeThemeAccess.colors(theme, 'tertiary'),
      onPress: () => router.push('/(employee)/notifications'),
    },
    {
      title: 'Contact HR',
      icon: 'email',
      color: safeThemeAccess.colors(theme, 'error'),
      onPress: () => console.log('Contact HR'),
    },
  ];

  const statsCards = [
    {
      title: 'Documents',
      value: stats.documentsUploaded,
      icon: 'file-document',
      color: safeThemeAccess.colors(theme, 'primary'),
      subtitle: 'Uploaded',
    },
    {
      title: 'Visa Status',
      value: `${stats.visaExpiryDays} days`,
      icon: 'passport',
      color: stats.visaExpiryDays < 30 ? safeThemeAccess.colors(theme, 'error') : safeThemeAccess.colors(theme, 'success'),
      subtitle: 'Until expiry',
    },
    {
      title: 'Profile',
      value: `${stats.profileCompletion}%`,
      icon: 'account-check',
      color: stats.profileCompletion >= 80 ? safeThemeAccess.colors(theme, 'success') : safeThemeAccess.colors(theme, 'warning'),
      subtitle: 'Complete',
    },
    {
      title: 'Notifications',
      value: stats.recentNotifications,
      icon: 'bell',
      color: safeThemeAccess.colors(theme, 'info'),
      subtitle: 'Unread',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: safeThemeAccess.colors(theme, 'background') }]}>
      {/* Header */}
      <Surface style={[styles.header, { backgroundColor: safeThemeAccess.colors(theme, 'surface') }]} elevation={2}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text variant="headlineSmall" style={[styles.headerTitle, { color: safeThemeAccess.colors(theme, 'onSurface') }]}>
              My Dashboard
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            <IconButton
              icon="refresh"
              size={24}
              onPress={handleRefresh}
              iconColor={safeThemeAccess.colors(theme, 'onSurface')}
            />
            <IconButton
              icon="logout"
              size={24}
              onPress={handleLogout}
              iconColor={safeThemeAccess.colors(theme, 'error')}
            />
          </View>
        </View>
      </Surface>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Welcome Section */}
        <Surface style={[styles.welcomeCard, { backgroundColor: safeThemeAccess.colors(theme, 'primaryContainer') }]} elevation={1}>
          <Text variant="headlineSmall" style={{ color: safeThemeAccess.colors(theme, 'primary'), marginBottom: 4 }}>
            Welcome back, {user?.name || 'Employee'}!
          </Text>
          <Text variant="bodyMedium" style={{ color: safeThemeAccess.colors(theme, 'onPrimaryContainer') }}>
            Here's your personal dashboard overview
          </Text>
        </Surface>

        {/* Stats Grid */}
        <Text variant="titleLarge" style={[styles.sectionTitle, { color: safeThemeAccess.colors(theme, 'onBackground') }]}>
          Overview
        </Text>
        <View style={styles.statsGrid}>
          {statsCards.map((stat, index) => (
            <Card key={index} style={[styles.statCard, { backgroundColor: safeThemeAccess.colors(theme, 'surface') }]} elevation={2}>
              <Card.Content style={styles.statContent}>
                <View style={styles.statHeader}>
                  <IconButton
                    icon={stat.icon}
                    size={24}
                    iconColor={stat.color}
                    style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}
                  />
                  <Text variant="headlineMedium" style={{ color: safeThemeAccess.colors(theme, 'onSurface'), fontWeight: 'bold' }}>
                    {stat.value}
                  </Text>
                </View>
                <Text variant="titleMedium" style={{ color: safeThemeAccess.colors(theme, 'onSurface'), marginBottom: 4 }}>
                  {stat.title}
                </Text>
                <Text variant="bodySmall" style={{ color: safeThemeAccess.colors(theme, 'onSurfaceVariant') }}>
                  {stat.subtitle}
                </Text>
              </Card.Content>
            </Card>
          ))}
        </View>

        {/* Quick Actions */}
        <Text variant="titleLarge" style={[styles.sectionTitle, { color: safeThemeAccess.colors(theme, 'onBackground') }]}>
          Quick Actions
        </Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <Card key={index} style={[styles.actionCard, { backgroundColor: safeThemeAccess.colors(theme, 'surface') }]} elevation={2}>
              <Card.Content style={styles.actionContent}>
                <IconButton
                  icon={action.icon}
                  size={32}
                  iconColor={action.color}
                  style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}
                />
                <Text variant="titleSmall" style={{ color: safeThemeAccess.colors(theme, 'onSurface'), textAlign: 'center', marginTop: 8 }}>
                  {action.title}
                </Text>
                <Button
                  mode="outlined"
                  compact
                  onPress={action.onPress}
                  style={{ marginTop: 12 }}
                  labelStyle={{ fontSize: 12 }}
                >
                  Open
                </Button>
              </Card.Content>
            </Card>
          ))}
        </View>

        {/* Recent Activity */}
        <Text variant="titleLarge" style={[styles.sectionTitle, { color: safeThemeAccess.colors(theme, 'onBackground') }]}>
          Recent Activity
        </Text>
        <Card style={[styles.activityCard, { backgroundColor: safeThemeAccess.colors(theme, 'surface') }]} elevation={2}>
          <Card.Content>
            <View style={styles.activityItem}>
              <IconButton icon="file-upload" size={20} iconColor={safeThemeAccess.colors(theme, 'primary')} />
              <View style={styles.activityInfo}>
                <Text variant="titleMedium" style={{ color: safeThemeAccess.colors(theme, 'onSurface') }}>
                  Document Uploaded
                </Text>
                <Text variant="bodyMedium" style={{ color: safeThemeAccess.colors(theme, 'onSurfaceVariant') }}>
                  Passport copy uploaded successfully
                </Text>
                <Text variant="bodySmall" style={{ color: safeThemeAccess.colors(theme, 'onSurfaceVariant') }}>
                  2 days ago
                </Text>
              </View>
            </View>

            <View style={[styles.activityItem, styles.activityBorder]}>
              <IconButton icon="account-edit" size={20} iconColor={safeThemeAccess.colors(theme, 'secondary')} />
              <View style={styles.activityInfo}>
                <Text variant="titleMedium" style={{ color: safeThemeAccess.colors(theme, 'onSurface') }}>
                  Profile Updated
                </Text>
                <Text variant="bodyMedium" style={{ color: safeThemeAccess.colors(theme, 'onSurfaceVariant') }}>
                  Contact information updated
                </Text>
                <Text variant="bodySmall" style={{ color: safeThemeAccess.colors(theme, 'onSurfaceVariant') }}>
                  1 week ago
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Alerts */}
        {stats.visaExpiryDays < 90 && (
          <>
            <Text variant="titleLarge" style={[styles.sectionTitle, { color: safeThemeAccess.colors(theme, 'onBackground') }]}>
              Important Alerts
            </Text>
            <Card style={[styles.alertCard, { backgroundColor: safeThemeAccess.colors(theme, 'errorContainer') }]} elevation={2}>
              <Card.Content style={styles.alertContent}>
                <IconButton
                  icon="alert-circle"
                  size={32}
                  iconColor={safeThemeAccess.colors(theme, 'error')}
                />
                <View style={styles.alertText}>
                  <Text variant="titleMedium" style={{ color: safeThemeAccess.colors(theme, 'onErrorContainer') }}>
                    Visa Expiry Notice
                  </Text>
                  <Text variant="bodyMedium" style={{ color: safeThemeAccess.colors(theme, 'onErrorContainer') }}>
                    Your visa expires in {stats.visaExpiryDays} days. Please contact HR for renewal.
                  </Text>
                </View>
                <Button
                  mode="contained"
                  onPress={() => console.log('Contact HR')}
                  buttonColor={safeThemeAccess.colors(theme, 'error')}
                >
                  Contact HR
                </Button>
              </Card.Content>
            </Card>
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: safeThemeAccess.colors(theme, 'primary') }]}
        onPress={() => router.push('/(employee)/documents')}
        label="Upload Document"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    marginLeft: 8,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 12,
    marginTop: 8,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    width: width > 768 ? (width - 80) / 4 : (width - 44) / 2,
    borderRadius: 12,
  },
  statContent: {
    alignItems: 'flex-start',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  statIcon: {
    margin: 0,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 12,
  },
  actionCard: {
    width: width > 768 ? (width - 80) / 4 : (width - 44) / 2,
    borderRadius: 12,
  },
  actionContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  actionIcon: {
    margin: 0,
  },
  activityCard: {
    borderRadius: 12,
    marginBottom: 24,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  activityBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  activityInfo: {
    flex: 1,
    marginLeft: 8,
  },
  alertCard: {
    borderRadius: 12,
    marginBottom: 24,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  alertText: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
