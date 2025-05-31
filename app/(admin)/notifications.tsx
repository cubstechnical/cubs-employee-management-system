import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Dimensions, RefreshControl } from 'react-native';
import {
  Text,
  Card,
  useTheme,
  Surface,
  IconButton,
  Chip,
  Button,
  Searchbar,
  Divider,
  Switch,
  Portal,
  Modal,
  TextInput,
  ActivityIndicator,
  FAB,
  Badge,
  Menu,
  SegmentedButtons,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import AdminLayout from '../../components/AdminLayout';
import { CustomTheme } from '../../theme';

const { width } = Dimensions.get('window');

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'visa_expiry' | 'document_missing' | 'system' | 'announcement';
  priority: 'high' | 'medium' | 'low';
  read: boolean;
  timestamp: string;
  employee_id?: string;
  employee_name?: string;
}

// Mock notification data - replace with real API
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Visa Expiring Soon',
    message: 'Ahmed Ali\'s visa expires in 7 days (30-06-2024)',
    type: 'visa_expiry',
    priority: 'high',
    read: false,
    timestamp: '2024-06-23T10:30:00Z',
    employee_id: 'EMP001',
    employee_name: 'Ahmed Ali'
  },
  {
    id: '2',
    title: 'Document Missing',
    message: 'Mohammed Khan\'s passport copy is missing',
    type: 'document_missing',
    priority: 'medium',
    read: false,
    timestamp: '2024-06-23T09:15:00Z',
    employee_id: 'EMP002',
    employee_name: 'Mohammed Khan'
  },
  {
    id: '3',
    title: 'System Update',
    message: 'Employee management system updated to v2.1',
    type: 'system',
    priority: 'low',
    read: true,
    timestamp: '2024-06-22T16:45:00Z'
  }
];

export default function NotificationsScreen() {
  const theme = useTheme() as CustomTheme;
  
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'high' | 'visa_expiry'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // New notification modal
  const [showNewNotificationModal, setShowNewNotificationModal] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'announcement' as Notification['type'],
    priority: 'medium' as Notification['priority']
  });

  // Email settings modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSettings, setEmailSettings] = useState({
    visaExpiryReminder: true,
    documentReminder: true,
    weeklyReport: true,
    instantAlerts: false
  });

  // Colors
  const COLORS = {
    primary: '#DC143C', // Ferrari Red
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    purple: '#8B5CF6',
    gray: '#6B7280',
  };

  useEffect(() => {
    filterNotifications();
  }, [notifications, searchQuery, selectedFilter]);

  const filterNotifications = () => {
    let filtered = notifications;
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.employee_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Type/status filter
    switch (selectedFilter) {
      case 'unread':
        filtered = filtered.filter(n => !n.read);
        break;
      case 'high':
        filtered = filtered.filter(n => n.priority === 'high');
        break;
      case 'visa_expiry':
        filtered = filtered.filter(n => n.type === 'visa_expiry');
        break;
    }
    
    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    setFilteredNotifications(filtered);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const sendTestNotification = () => {
    const testNotification: Notification = {
      id: Date.now().toString(),
      title: 'Test Notification',
      message: 'This is a test notification sent at ' + new Date().toLocaleTimeString(),
      type: 'system',
      priority: 'low',
      read: false,
      timestamp: new Date().toISOString()
    };
    
    setNotifications(prev => [testNotification, ...prev]);
    Alert.alert('Success', 'Test notification sent!');
  };

  const sendVivaExpiryEmails = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      Alert.alert('Success', 'Visa expiry emails sent to all employees with expiring visas!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send emails. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'visa_expiry': return 'passport';
      case 'document_missing': return 'file-alert';
      case 'system': return 'cog';
      case 'announcement': return 'bullhorn';
      default: return 'bell';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return COLORS.error;
      case 'medium': return COLORS.warning;
      case 'low': return COLORS.info;
      default: return COLORS.gray;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AdminLayout title="Notifications" currentRoute="/admin/notifications">
      <View style={styles.container}>
        {/* Header with Gradient */}
        <LinearGradient
          colors={[COLORS.primary, '#B91C3C', '#991B1B']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text variant="headlineSmall" style={styles.headerTitle}>
                📢 Notifications
              </Text>
              <Text variant="bodyMedium" style={styles.headerSubtitle}>
                Manage system alerts and communications
              </Text>
            </View>
            <View style={styles.headerRight}>
              <Surface style={styles.unreadBadge} elevation={2}>
                <Text style={[styles.unreadCount, { color: COLORS.primary }]}>
                  {unreadCount} unread
                </Text>
              </Surface>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <Surface style={styles.quickActions} elevation={2}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Button
              mode="contained"
              onPress={sendVivaExpiryEmails}
              loading={loading}
              style={[styles.actionButton, { backgroundColor: COLORS.warning }]}
              labelStyle={{ color: 'white' }}
              icon="email-send"
            >
              Send Visa Alerts
            </Button>
            <Button
              mode="outlined"
              onPress={markAllAsRead}
              style={[styles.actionButton, { borderColor: COLORS.primary }]}
              labelStyle={{ color: COLORS.primary }}
              icon="check-all"
            >
              Mark All Read
            </Button>
            <Button
              mode="outlined"
              onPress={() => setShowEmailModal(true)}
              style={[styles.actionButton, { borderColor: COLORS.info }]}
              labelStyle={{ color: COLORS.info }}
              icon="cog"
            >
              Settings
            </Button>
            <Button
              mode="outlined"
              onPress={sendTestNotification}
              style={[styles.actionButton, { borderColor: COLORS.gray }]}
              labelStyle={{ color: COLORS.gray }}
              icon="test-tube"
            >
              Test
            </Button>
          </ScrollView>
        </Surface>

        {/* Search and Filters */}
        <Surface style={styles.searchContainer} elevation={1}>
          <Searchbar
            placeholder="Search notifications..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            iconColor={COLORS.primary}
          />
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
            <Chip
              selected={selectedFilter === 'all'}
              onPress={() => setSelectedFilter('all')}
              style={[styles.filterChip, { backgroundColor: selectedFilter === 'all' ? COLORS.primary + '20' : 'transparent' }]}
              textStyle={{ color: selectedFilter === 'all' ? COLORS.primary : theme.colors.onSurface }}
            >
              All ({notifications.length})
            </Chip>
            <Chip
              selected={selectedFilter === 'unread'}
              onPress={() => setSelectedFilter('unread')}
              style={[styles.filterChip, { backgroundColor: selectedFilter === 'unread' ? COLORS.error + '20' : 'transparent' }]}
              textStyle={{ color: selectedFilter === 'unread' ? COLORS.error : theme.colors.onSurface }}
            >
              Unread ({unreadCount})
            </Chip>
            <Chip
              selected={selectedFilter === 'high'}
              onPress={() => setSelectedFilter('high')}
              style={[styles.filterChip, { backgroundColor: selectedFilter === 'high' ? COLORS.warning + '20' : 'transparent' }]}
              textStyle={{ color: selectedFilter === 'high' ? COLORS.warning : theme.colors.onSurface }}
            >
              High Priority
            </Chip>
            <Chip
              selected={selectedFilter === 'visa_expiry'}
              onPress={() => setSelectedFilter('visa_expiry')}
              style={[styles.filterChip, { backgroundColor: selectedFilter === 'visa_expiry' ? COLORS.info + '20' : 'transparent' }]}
              textStyle={{ color: selectedFilter === 'visa_expiry' ? COLORS.info : theme.colors.onSurface }}
            >
              Visa Alerts
            </Chip>
          </ScrollView>
        </Surface>

        {/* Notifications List */}
        <ScrollView 
          style={styles.notificationsList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {}} />}
        >
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <Surface key={notification.id} style={styles.notificationCard} elevation={1}>
                <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(notification.priority) }]} />
                
                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <View style={styles.notificationIcon}>
                      <IconButton
                        icon={getNotificationIcon(notification.type)}
                        size={24}
                        iconColor={getPriorityColor(notification.priority)}
                        style={{ margin: 0 }}
                      />
                    </View>
                    
                    <View style={styles.notificationInfo}>
                      <Text 
                        variant="titleSmall" 
                        style={[
                          styles.notificationTitle, 
                          { fontWeight: notification.read ? 'normal' : 'bold', color: theme.colors.onSurface }
                        ]}
                      >
                        {notification.title}
                      </Text>
                      <Text variant="bodySmall" style={styles.notificationTime}>
                        {formatTimestamp(notification.timestamp)}
                        {notification.employee_name && ` • ${notification.employee_name}`}
                      </Text>
                    </View>
                    
                    <View style={styles.notificationActions}>
                      {!notification.read && (
                        <Badge style={{ backgroundColor: COLORS.primary }} size={8} />
                      )}
                      <IconButton
                        icon="dots-vertical"
                        size={20}
                        iconColor={theme.colors.onSurfaceVariant}
                        onPress={() => {}}
                      />
                    </View>
                  </View>
                  
                  <Text 
                    variant="bodyMedium" 
                    style={[styles.notificationMessage, { color: theme.colors.onSurfaceVariant }]}
                  >
                    {notification.message}
                  </Text>
                  
                  <View style={styles.notificationFooter}>
                    <Chip
                      compact
                      style={[styles.typeChip, { backgroundColor: getPriorityColor(notification.priority) + '20' }]}
                      textStyle={{ color: getPriorityColor(notification.priority), fontSize: 10 }}
                    >
                      {notification.type.replace('_', ' ').toUpperCase()}
                    </Chip>
                    
                    <View style={styles.notificationButtonGroup}>
                      {!notification.read && (
                        <Button
                          mode="text"
                          onPress={() => markAsRead(notification.id)}
                          labelStyle={{ fontSize: 12, color: COLORS.primary }}
                          compact
                        >
                          Mark Read
                        </Button>
                      )}
                      {notification.employee_id && (
                        <Button
                          mode="text"
                          onPress={() => router.push(`/(admin)/employees/${notification.employee_id}`)}
                          labelStyle={{ fontSize: 12, color: COLORS.info }}
                          compact
                        >
                          View Employee
                        </Button>
                      )}
                    </View>
                  </View>
                </View>
              </Surface>
            ))
          ) : (
            <View style={styles.emptyState}>
              <IconButton icon="bell-off" size={64} iconColor={theme.colors.onSurfaceVariant} />
              <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, marginTop: 16 }}>
                No notifications found
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>
                {searchQuery ? 'Try adjusting your search criteria' : 'All notifications have been cleared'}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Floating Action Button */}
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: COLORS.primary }]}
          onPress={() => setShowNewNotificationModal(true)}
          label="New Alert"
        />

        {/* Email Settings Modal */}
        <Portal>
          <Modal
            visible={showEmailModal}
            onDismiss={() => setShowEmailModal(false)}
            contentContainerStyle={styles.modalContainer}
          >
            <Surface style={styles.modal} elevation={5}>
              <Text variant="headlineSmall" style={styles.modalTitle}>
                📧 Email Notification Settings
              </Text>
              
              <View style={styles.settingsList}>
                <View style={styles.settingItem}>
                  <View>
                    <Text variant="titleMedium">Visa Expiry Reminders</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Send emails when visas are about to expire
                    </Text>
                  </View>
                  <Switch
                    value={emailSettings.visaExpiryReminder}
                    onValueChange={(value) => setEmailSettings({...emailSettings, visaExpiryReminder: value})}
                    thumbColor={COLORS.primary}
                  />
                </View>
                
                <Divider />
                
                <View style={styles.settingItem}>
                  <View>
                    <Text variant="titleMedium">Document Reminders</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Alert when employee documents are missing
                    </Text>
                  </View>
                  <Switch
                    value={emailSettings.documentReminder}
                    onValueChange={(value) => setEmailSettings({...emailSettings, documentReminder: value})}
                    thumbColor={COLORS.primary}
                  />
                </View>
                
                <Divider />
                
                <View style={styles.settingItem}>
                  <View>
                    <Text variant="titleMedium">Weekly Reports</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Send weekly employee status summaries
                    </Text>
                  </View>
                  <Switch
                    value={emailSettings.weeklyReport}
                    onValueChange={(value) => setEmailSettings({...emailSettings, weeklyReport: value})}
                    thumbColor={COLORS.primary}
                  />
                </View>
                
                <Divider />
                
                <View style={styles.settingItem}>
                  <View>
                    <Text variant="titleMedium">Instant Alerts</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Send immediate notifications for critical issues
                    </Text>
                  </View>
                  <Switch
                    value={emailSettings.instantAlerts}
                    onValueChange={(value) => setEmailSettings({...emailSettings, instantAlerts: value})}
                    thumbColor={COLORS.primary}
                  />
                </View>
              </View>
              
              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setShowEmailModal(false)}
                  style={{ flex: 1, marginRight: 8 }}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={() => {
                    setShowEmailModal(false);
                    Alert.alert('Settings Saved', 'Email notification preferences updated successfully!');
                  }}
                  style={{ flex: 1, marginLeft: 8, backgroundColor: COLORS.primary }}
                >
                  Save Settings
                </Button>
              </View>
            </Surface>
          </Modal>
        </Portal>
      </View>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
  },
  headerRight: {
    alignItems: 'center',
  },
  unreadBadge: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  unreadCount: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  quickActions: {
    padding: 16,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: -12,
    borderRadius: 12,
    elevation: 2,
  },
  actionButton: {
    marginRight: 12,
    borderRadius: 20,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
  },
  searchBar: {
    marginBottom: 12,
    backgroundColor: '#f8fafc',
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterChip: {
    marginRight: 8,
  },
  notificationsList: {
    flex: 1,
    padding: 16,
  },
  notificationCard: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  priorityIndicator: {
    width: 4,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  notificationContent: {
    padding: 16,
    paddingLeft: 20,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationIcon: {
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    marginBottom: 2,
  },
  notificationTime: {
    color: '#6B7280',
    fontSize: 12,
  },
  notificationActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationMessage: {
    marginBottom: 12,
    lineHeight: 20,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeChip: {
    alignSelf: 'flex-start',
  },
  notificationButtonGroup: {
    flexDirection: 'row',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 500,
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'white',
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: 'bold',
  },
  settingsList: {
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  modalActions: {
    flexDirection: 'row',
  },
}); 

