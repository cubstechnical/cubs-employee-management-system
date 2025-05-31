import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Snackbar, Chip, useTheme, Avatar } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';
import { useProfiles } from '../../hooks/useProfiles';
import AdminLayout from '../../components/AdminLayout';
import { CustomTheme } from '../../theme';
import { safeThemeAccess } from '../../utils/errorPrevention';
import { withAuthGuard } from '../../components/AuthGuard';
import { useRouter } from 'expo-router';

export default function UserApprovalsScreen() {
  const theme = useTheme() as CustomTheme;
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: safeThemeAccess.spacing(theme, 'md'),
    },
    content: {
      padding: 24,
      gap: safeThemeAccess.spacing(theme, 'md'),
    },
    loadingContainer: {
      alignItems: 'center',
      paddingVertical: safeThemeAccess.spacing(theme, 'xl'),
    },
    emptyCard: {
      elevation: 2,
    },
    emptyContent: {
      alignItems: 'center',
      paddingVertical: safeThemeAccess.spacing(theme, 'xl'),
    },
    userCard: {
      elevation: 2,
      marginBottom: safeThemeAccess.spacing(theme, 'md'),
    },
    userHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    userInfo: {
      flex: 1,
      marginRight: safeThemeAccess.spacing(theme, 'md'),
    },
    cardActions: {
      justifyContent: 'flex-end',
      gap: safeThemeAccess.spacing(theme, 'sm'),
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: safeThemeAccess.spacing(theme, 'xl'),
    },
  });
  const { user } = useAuth();
  const { 
    pendingProfiles, 
    isLoading, 
    error, 
    fetchPendingProfiles, 
    approveUser, 
    rejectUser,
    clearError 
  } = useProfiles();
  
  const [refreshing, setRefreshing] = useState(false);
  const [approvingUsers, setApprovingUsers] = useState<Set<string>>(new Set());
  const [snackbar, setSnackbar] = useState({ 
    visible: false, 
    message: '', 
    type: 'success' as 'success' | 'error' 
  });

  const router = useRouter();

  useEffect(() => {
    fetchPendingProfiles();
  }, []);

  useEffect(() => {
    if (error) {
      showSnackbar(error, 'error');
      clearError();
    }
  }, [error]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchPendingProfiles();
    } catch (error) {
      // Error handled by the hook
    } finally {
      setRefreshing(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    if (!user?.id) {
      showSnackbar('You must be logged in to approve users', 'error');
      return;
    }

    try {
      setApprovingUsers(prev => new Set(prev).add(userId));
      await approveUser(userId, user.id);
      showSnackbar('User approved successfully!', 'success');
    } catch (error) {
      // Error handled by the hook and useEffect
    } finally {
      setApprovingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleRejectUser = async (userId: string) => {
    if (!user?.id) {
      showSnackbar('You must be logged in to reject users', 'error');
      return;
    }

    try {
      setApprovingUsers(prev => new Set(prev).add(userId));
      await rejectUser(userId);
      showSnackbar('User rejected and removed', 'success');
    } catch (error) {
      // Error handled by the hook and useEffect
    } finally {
      setApprovingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const showSnackbar = (message: string, type: 'success' | 'error') => {
    setSnackbar({ visible: true, message, type });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Only allow admins to access this screen
  if (user?.role !== 'admin') {
    return (
      <AdminLayout title="Access Denied" currentRoute="/admin/approvals">
        <View style={styles.errorContainer}>
          <Text variant="headlineSmall" style={{ color: safeThemeAccess.colors(theme, 'error') }}>
            Access Denied
          </Text>
          <Text variant="bodyMedium" style={{ marginVertical: safeThemeAccess.spacing(theme, 'md') }}>
            You must be an admin to access this screen.
          </Text>
        </View>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="User Approvals" 
      currentRoute="/admin/approvals"
      showBackButton={true}
      onBackPress={() => router.push('/(admin)/dashboard')}
    >
      <ScrollView 
        style={[styles.container, { backgroundColor: safeThemeAccess.colors(theme, 'background') }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[safeThemeAccess.colors(theme, 'primary')]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text variant="headlineMedium" style={{ color: safeThemeAccess.colors(theme, 'primary') }}>
              User Approvals
            </Text>
            <Text variant="bodyMedium" style={{ color: safeThemeAccess.colors(theme, 'onSurfaceVariant') }}>
              Approve pending user registrations
            </Text>
          </View>
          <Chip 
            icon="account-clock" 
            style={{ backgroundColor: safeThemeAccess.colors(theme, 'secondaryContainer') }}
          >
            {pendingProfiles.length} pending
          </Chip>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
              <Text variant="bodyMedium" style={{ marginTop: safeThemeAccess.spacing(theme, 'md') }}>
                Loading pending users...
              </Text>
            </View>
          ) : pendingProfiles.length === 0 ? (
            <Card style={[styles.emptyCard, { backgroundColor: safeThemeAccess.colors(theme, 'surface') }]}>
              <Card.Content style={styles.emptyContent}>
                <Text variant="headlineSmall" style={{ color: safeThemeAccess.colors(theme, 'onSurfaceVariant') }}>
                  No Pending Approvals
                </Text>
                <Text variant="bodyMedium" style={{ marginTop: safeThemeAccess.spacing(theme, 'sm') }}>
                  All users have been approved or there are no new registrations.
                </Text>
              </Card.Content>
            </Card>
          ) : (
            pendingProfiles.map((profile) => (
              <Card 
                key={profile.id} 
                style={[styles.userCard, { backgroundColor: safeThemeAccess.colors(theme, 'surface') }]}
              >
                <Card.Content>
                  <View style={styles.userHeader}>
                    <View style={styles.userInfo}>
                      <Text variant="titleMedium" style={{ color: safeThemeAccess.colors(theme, 'onSurface') }}>
                        {profile.full_name || 'Unnamed User'}
                      </Text>
                      <Text variant="bodyMedium" style={{ color: safeThemeAccess.colors(theme, 'onSurfaceVariant') }}>
                        {profile.email}
                      </Text>
                      <Text variant="bodySmall" style={{ color: safeThemeAccess.colors(theme, 'onSurfaceVariant') }}>
                        Registered: {formatDate(profile.created_at)}
                      </Text>
                    </View>
                    <Chip 
                      icon="clock-outline"
                      style={{ backgroundColor: safeThemeAccess.colors(theme, 'tertiaryContainer') }}
                    >
                      Pending
                    </Chip>
                  </View>
                </Card.Content>
                <Card.Actions style={styles.cardActions}>
                  <Button 
                    mode="outlined" 
                    onPress={() => handleRejectUser(profile.id)}
                    disabled={approvingUsers.has(profile.id)}
                    style={{ borderColor: safeThemeAccess.colors(theme, 'error') }}
                    textColor={safeThemeAccess.colors(theme, 'error')}
                  >
                    Reject
                  </Button>
                  <Button 
                    mode="contained" 
                    onPress={() => handleApproveUser(profile.id)}
                    loading={approvingUsers.has(profile.id)}
                    disabled={approvingUsers.has(profile.id)}
                  >
                    Approve
                  </Button>
                </Card.Actions>
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '', type: 'success' })}
        duration={3000}
        style={{
          backgroundColor: snackbar.type === 'error' 
            ? safeThemeAccess.colors(theme, 'errorContainer') 
            : safeThemeAccess.colors(theme, 'primaryContainer')
        }}
      >
        <Text style={{
          color: snackbar.type === 'error' 
            ? safeThemeAccess.colors(theme, 'onErrorContainer') 
            : safeThemeAccess.colors(theme, 'onPrimaryContainer')
        }}>
          {snackbar.message}
        </Text>
      </Snackbar>
    </AdminLayout>
  );
} 
