import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import {
  Text,
  Card,
  useTheme,
  Surface,
  Button,
  IconButton,
  ActivityIndicator,
  Badge,
  Avatar,
  Chip,
  List,
  Divider,
  Portal,
  Modal,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../services/supabase';
import { CustomTheme } from '../../theme';
import { withAuthGuard } from '../../components/AuthGuard';

interface PendingUser {
  id: string;
  name: string;
  email: string;
  role: string;
  company_id?: string;
  company_name?: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  phone?: string;
  department?: string;
}

function UserApprovalsScreen() {
  const theme = useTheme() as CustomTheme;
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          role,
          created_at
        `)
        .eq('role', 'public')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading pending users:', error);
        return;
      }

      const formattedUsers: PendingUser[] = (data || []).map(user => ({
        id: user.id,
        name: user.full_name || 'Unknown',
        email: user.email || '',
        role: user.role || 'employee',
        company_id: undefined,
        company_name: 'No Company',
        created_at: user.created_at,
        status: 'pending' as const,
        phone: undefined,
        department: undefined,
      }));

      setPendingUsers(formattedUsers);
    } catch (error) {
      console.error('Error loading pending users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      setActionLoading(userId);
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: 'employee',  // Change role from 'public' to 'employee'
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('Error approving user:', error);
        return;
      }

      // Remove from pending list
      setPendingUsers(prev => prev.filter(user => user.id !== userId));
      setModalVisible(false);
      
    } catch (error) {
      console.error('Error approving user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectUser = async (userId: string, reason: string) => {
    try {
      setActionLoading(userId);
      
      // Since the profiles table doesn't have status/rejection columns,
      // we'll delete the user profile for rejected users
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Error rejecting user:', error);
        return;
      }

      // Remove from pending list
      setPendingUsers(prev => prev.filter(user => user.id !== userId));
      setModalVisible(false);
      setRejectionReason('');
      
    } catch (error) {
      console.error('Error rejecting user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const openUserModal = (user: PendingUser) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedUser(null);
    setRejectionReason('');
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPendingUsers();
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return theme.colors.error;
      case 'hr':
        return theme.colors.primary;
      case 'manager':
        return theme.colors.tertiary;
      default:
        return theme.colors.outline;
    }
  };

  if (loading) {
    return (
      <AdminLayout title="User Approvals" currentRoute="/(admin)/approvals">
        <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, marginTop: 16 }}>
            Loading pending approvals...
          </Text>
        </View>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="User Approvals" currentRoute="/(admin)/approvals">
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.headerContent}>
            <View>
              <Text variant="headlineMedium" style={{ color: theme.colors.onSurface }}>
                User Approvals
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {pendingUsers.length} pending approval{pendingUsers.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <Badge
              size={32}
              style={{ backgroundColor: theme.colors.primary }}
            >
              {pendingUsers.length}
            </Badge>
          </View>
        </Surface>

        {/* Content */}
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {pendingUsers.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <IconButton
                  icon="account-check"
                  size={64}
                  iconColor={theme.colors.onSurfaceVariant}
                />
                <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, textAlign: 'center' }}>
                  No Pending Approvals
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                  All user registrations have been processed
                </Text>
              </Card.Content>
            </Card>
          ) : (
            pendingUsers.map((user) => (
              <Card key={user.id} style={styles.userCard}>
                <Card.Content>
                  <View style={styles.userHeader}>
                    <View style={styles.userInfo}>
                      <Avatar.Text
                        size={48}
                        label={user.name.charAt(0).toUpperCase()}
                        style={{ backgroundColor: theme.colors.primaryContainer }}
                        labelStyle={{ color: theme.colors.onPrimaryContainer }}
                      />
                      <View style={styles.userDetails}>
                        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                          {user.name}
                        </Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                          {user.email}
                        </Text>
                        <View style={styles.userMeta}>
                          <Chip
                            icon="shield-account"
                            style={{ backgroundColor: getRoleColor(user.role) + '20' }}
                            textStyle={{ color: getRoleColor(user.role) }}
                            compact
                          >
                            {user.role.toUpperCase()}
                          </Chip>
                          {user.company_name && (
                            <Chip
                              icon="domain"
                              style={{ backgroundColor: theme.colors.surfaceVariant }}
                              textStyle={{ color: theme.colors.onSurfaceVariant }}
                              compact
                            >
                              {user.company_name}
                            </Chip>
                          )}
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.userActions}>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'right' }}>
                        {formatDate(user.created_at)}
                      </Text>
                      <View style={styles.actionButtons}>
                        <Button
                          mode="outlined"
                          icon="close"
                          onPress={() => openUserModal(user)}
                          style={[styles.actionButton, { borderColor: theme.colors.error }]}
                          textColor={theme.colors.error}
                          compact
                          loading={actionLoading === user.id}
                        >
                          Reject
                        </Button>
                        <Button
                          mode="contained"
                          icon="check"
                          onPress={() => handleApproveUser(user.id)}
                          style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                          compact
                          loading={actionLoading === user.id}
                        >
                          Approve
                        </Button>
                      </View>
                    </View>
                  </View>

                  {(user.phone || user.department) && (
                    <>
                      <Divider style={{ marginVertical: 12 }} />
                      <View style={styles.additionalInfo}>
                        {user.phone && (
                          <List.Item
                            title="Phone"
                            description={user.phone}
                            left={props => <List.Icon {...props} icon="phone" />}
                            style={styles.infoItem}
                          />
                        )}
                        {user.department && (
                          <List.Item
                            title="Department"
                            description={user.department}
                            left={props => <List.Icon {...props} icon="briefcase" />}
                            style={styles.infoItem}
                          />
                        )}
                      </View>
                    </>
                  )}
                </Card.Content>
              </Card>
            ))
          )}
        </ScrollView>

        {/* User Details Modal */}
        <Portal>
          <Modal
            visible={modalVisible}
            onDismiss={closeModal}
            contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
          >
            {selectedUser && (
              <>
                <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
                  Reject User Registration
                </Text>
                
                <View style={styles.userSummary}>
                  <Avatar.Text
                    size={40}
                    label={selectedUser.name.charAt(0).toUpperCase()}
                    style={{ backgroundColor: theme.colors.primaryContainer }}
                  />
                  <View style={{ marginLeft: 12 }}>
                    <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                      {selectedUser.name}
                    </Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                      {selectedUser.email}
                    </Text>
                  </View>
                </View>

                <TextInput
                  label="Rejection Reason (Optional)"
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  multiline
                  numberOfLines={3}
                  style={{ marginVertical: 16 }}
                  placeholder="Provide a reason for rejection..."
                />

                <View style={styles.modalActions}>
                  <Button
                    mode="outlined"
                    onPress={closeModal}
                    style={{ flex: 1, marginRight: 8 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => handleRejectUser(selectedUser.id, rejectionReason)}
                    style={{ flex: 1, marginLeft: 8, backgroundColor: theme.colors.error }}
                    loading={actionLoading === selectedUser.id}
                  >
                    Reject User
                  </Button>
                </View>
              </>
            )}
          </Modal>
        </Portal>
      </SafeAreaView>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
  },
  emptyContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    backgroundColor: '#ffffff',
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  approvalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  approvalCardContent: {
    padding: 16,
  },
  approvalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  approvalIcon: {
    marginRight: 12,
  },
  approvalInfo: {
    flex: 1,
  },
  approvalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  approvalSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  priorityChip: {
    alignSelf: 'flex-start',
  },
  approvalDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  approvalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  actionButton: {
    minWidth: 80,
  },
  approveButton: {
    backgroundColor: '#22C55E',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  pendingButton: {
    backgroundColor: '#F59E0B',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  // MODAL STYLES (FIXED)
  modalContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: 600,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalBody: {
    maxHeight: 400,
    marginBottom: 16,
  },
  commentInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  userCard: {
    marginBottom: 12,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  userActions: {
    alignItems: 'flex-end',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  additionalInfo: {
    marginTop: 8,
  },
  infoItem: {
    paddingVertical: 4,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 8,
  },
  userSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default withAuthGuard({
  WrappedComponent: UserApprovalsScreen,
  allowedRoles: ['admin']
}); 
