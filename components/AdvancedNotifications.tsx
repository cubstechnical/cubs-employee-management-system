import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import {
  Text,
  Card,
  IconButton,
  Button,
  Chip,
  Surface,
  Portal,
  Modal,
  List,
  Divider,
  Badge,
  Avatar,
  Switch,
  SegmentedButtons,
  Menu,
  ActivityIndicator,
  TouchableRipple,
} from 'react-native-paper';
import { getDeviceInfo, getResponsiveSpacing, performanceUtils } from '../utils/mobileUtils';
import { supabase } from '../services/supabase';

interface NotificationItem {
  id: string;
  type: 'visa_expiry' | 'document_missing' | 'system' | 'reminder' | 'alert';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  read: boolean;
  timestamp: string;
  employeeId?: string;
  employeeName?: string;
  actions?: NotificationAction[];
  metadata?: Record<string, any>;
}

interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  action: string;
  icon?: string;
}

interface NotificationGroup {
  type: string;
  title: string;
  count: number;
  notifications: NotificationItem[];
  icon: string;
  color: string;
}

interface AdvancedNotificationsProps {
  visible?: boolean;
  onClose?: () => void;
  maxHeight?: number;
}

export const AdvancedNotifications: React.FC<AdvancedNotificationsProps> = ({
  visible = true,
  onClose,
  maxHeight = 600,
}) => {
  const { isPhone } = getDeviceInfo();
  const spacing = getResponsiveSpacing('md');
  
  // State management
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showSettings, setShowSettings] = useState(false);
  const [groupedView, setGroupedView] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  // Real-time subscription
  useEffect(() => {
    fetchNotifications();
    
    if (autoRefresh) {
      const interval = setInterval(fetchNotifications, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Fetch notifications from Supabase
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch from notifications table
      const { data: notificationData, error: notificationError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (notificationError) throw notificationError;

      // Generate smart notifications based on employee data
      const { data: employees, error: employeeError } = await supabase
        .from('employees')
        .select('*');

      if (employeeError) throw employeeError;

      const smartNotifications = generateSmartNotifications(employees || []);
      const allNotifications = [...(notificationData || []), ...smartNotifications];

      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generate smart notifications based on employee data
  const generateSmartNotifications = (employees: any[]): NotificationItem[] => {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    
    const notifications: NotificationItem[] = [];

    employees.forEach(employee => {
      if (employee.visa_expiry_date) {
        const expiryDate = new Date(employee.visa_expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Visa expiring soon
        if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
          notifications.push({
            id: `visa_expiry_${employee.id}`,
            type: 'visa_expiry',
            title: 'Visa Expiring Soon',
            message: `${employee.name}'s visa expires in ${daysUntilExpiry} days`,
            priority: daysUntilExpiry <= 7 ? 'high' : 'medium',
            read: false,
            timestamp: now.toISOString(),
            employeeId: employee.id,
            employeeName: employee.name,
            actions: [
              {
                id: 'send_reminder',
                label: 'Send Reminder',
                type: 'primary',
                action: 'send_reminder',
                icon: 'email-send',
              },
              {
                id: 'view_details',
                label: 'View Details',
                type: 'secondary',
                action: 'view_details',
                icon: 'eye',
              },
            ],
            metadata: {
              expiryDate: employee.visa_expiry_date,
              daysUntilExpiry,
            },
          });
        }

        // Visa expired
        if (daysUntilExpiry <= 0) {
          notifications.push({
            id: `visa_expired_${employee.id}`,
            type: 'alert',
            title: 'Visa Expired',
            message: `${employee.name}'s visa has expired`,
            priority: 'high',
            read: false,
            timestamp: now.toISOString(),
            employeeId: employee.id,
            employeeName: employee.name,
            actions: [
              {
                id: 'urgent_action',
                label: 'Urgent Action Required',
                type: 'danger',
                action: 'urgent_action',
                icon: 'alert',
              },
            ],
            metadata: {
              expiryDate: employee.visa_expiry_date,
              daysOverdue: Math.abs(daysUntilExpiry),
            },
          });
        }
      }

      // Missing documents check
      const requiredFields = ['passport_no', 'visa_expiry_date', 'nationality'];
      const missingFields = requiredFields.filter(field => !employee[field]);

      if (missingFields.length > 0) {
        notifications.push({
          id: `missing_docs_${employee.id}`,
          type: 'document_missing',
          title: 'Missing Documents',
          message: `${employee.name} has missing information: ${missingFields.join(', ')}`,
          priority: 'medium',
          read: false,
          timestamp: now.toISOString(),
          employeeId: employee.id,
          employeeName: employee.name,
          actions: [
            {
              id: 'update_profile',
              label: 'Update Profile',
              type: 'primary',
              action: 'update_profile',
              icon: 'account-edit',
            },
          ],
          metadata: {
            missingFields,
          },
        });
      }
    });

    return notifications;
  };

  // Group notifications by type
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, NotificationGroup> = {};
    
    const typeConfig = {
      visa_expiry: { title: 'Visa Expiring', icon: 'calendar-alert', color: '#f59e0b' },
      alert: { title: 'Urgent Alerts', icon: 'alert-circle', color: '#dc2626' },
      document_missing: { title: 'Missing Documents', icon: 'file-alert', color: '#8b5cf6' },
      reminder: { title: 'Reminders', icon: 'bell', color: '#3b82f6' },
      system: { title: 'System Updates', icon: 'cog', color: '#6b7280' },
    };

    notifications.forEach(notification => {
      const config = typeConfig[notification.type] || typeConfig.system;
      
      if (!groups[notification.type]) {
        groups[notification.type] = {
          type: notification.type,
          title: config.title,
          count: 0,
          notifications: [],
          icon: config.icon,
          color: config.color,
        };
      }
      
      groups[notification.type].notifications.push(notification);
      groups[notification.type].count++;
    });

    return Object.values(groups).sort((a, b) => {
      const priorityOrder = { alert: 0, visa_expiry: 1, document_missing: 2, reminder: 3, system: 4 };
      return (priorityOrder[a.type as keyof typeof priorityOrder] || 5) - 
             (priorityOrder[b.type as keyof typeof priorityOrder] || 5);
    });
  }, [notifications]);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    if (selectedFilter !== 'all') {
      filtered = filtered.filter(notification => {
        switch (selectedFilter) {
          case 'unread':
            return !notification.read;
          case 'high':
            return notification.priority === 'high';
          case 'today':
            return new Date(notification.timestamp).toDateString() === new Date().toDateString();
          default:
            return notification.type === selectedFilter;
        }
      });
    }

    return filtered.sort((a, b) => {
      // Sort by priority, then by timestamp
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [notifications, selectedFilter]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Handle notification action
  const handleAction = useCallback(async (notification: NotificationItem, action: NotificationAction) => {
    try {
      switch (action.action) {
        case 'send_reminder':
          // Implement reminder sending logic
          console.log('Sending reminder for:', notification.employeeName);
          break;
        case 'view_details':
          // Navigate to employee details
          console.log('Viewing details for:', notification.employeeId);
          break;
        case 'update_profile':
          // Navigate to employee edit
          console.log('Updating profile for:', notification.employeeId);
          break;
        case 'urgent_action':
          // Handle urgent action
          console.log('Urgent action for:', notification.employeeName);
          break;
      }

      // Mark as read after action
      await markAsRead(notification.id);
    } catch (error) {
      console.error('Error handling notification action:', error);
    }
  }, [markAsRead]);

  // Bulk operations
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      
      if (unreadIds.length > 0) {
        await supabase
          .from('notifications')
          .update({ read: true })
          .in('id', unreadIds);

        setNotifications(prev =>
          prev.map(notification => ({ ...notification, read: true }))
        );
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [notifications]);

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: 'Unread' },
    { value: 'high', label: 'High Priority' },
    { value: 'today', label: 'Today' },
    { value: 'visa_expiry', label: 'Visa Expiry' },
    { value: 'alert', label: 'Alerts' },
  ];

  // Render notification item
  const renderNotificationItem = (notification: NotificationItem) => {
    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'high': return '#dc2626';
        case 'medium': return '#f59e0b';
        case 'low': return '#6b7280';
        default: return '#6b7280';
      }
    };

    return (
      <TouchableRipple
        key={notification.id}
        onPress={() => markAsRead(notification.id)}
        style={[
          styles.notificationItem,
          !notification.read && styles.unreadNotification,
        ]}
      >
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <View style={styles.notificationMeta}>
              <Badge
                style={[
                  styles.priorityBadge,
                  { backgroundColor: getPriorityColor(notification.priority) }
                ]}
                size={8}
              />
              <Text variant="bodySmall" style={styles.timestamp}>
                {new Date(notification.timestamp).toLocaleTimeString()}
              </Text>
            </View>
            {!notification.read && <Badge size={8} style={styles.unreadIndicator} />}
          </View>

          <Text variant="titleSmall" style={styles.notificationTitle}>
            {notification.title}
          </Text>
          
          <Text variant="bodyMedium" style={styles.notificationMessage}>
            {notification.message}
          </Text>

          {notification.actions && notification.actions.length > 0 && (
            <View style={styles.notificationActions}>
              {notification.actions.map(action => (
                <Button
                  key={action.id}
                  mode={action.type === 'primary' ? 'contained' : 'outlined'}
                  onPress={() => handleAction(notification, action)}
                  icon={action.icon}
                  compact
                  style={[
                    styles.actionButton,
                    action.type === 'danger' && styles.dangerButton,
                  ]}
                >
                  {action.label}
                </Button>
              ))}
            </View>
          )}
        </View>
      </TouchableRipple>
    );
  };

  // Render grouped view
  const renderGroupedView = () => {
    return (
      <ScrollView style={styles.scrollContainer}>
        {groupedNotifications.map(group => (
          <Card key={group.type} style={styles.groupCard}>
            <Card.Title
              title={group.title}
              subtitle={`${group.count} notification${group.count !== 1 ? 's' : ''}`}
              left={() => (
                <Avatar.Icon
                  size={40}
                  icon={group.icon}
                  style={{ backgroundColor: group.color }}
                />
              )}
              right={() => (
                <Badge style={{ backgroundColor: group.color }}>
                  {group.count}
                </Badge>
              )}
            />
            <Card.Content>
              {group.notifications.slice(0, 3).map(renderNotificationItem)}
              {group.notifications.length > 3 && (
                <Button
                  mode="text"
                  onPress={() => setSelectedFilter(group.type)}
                  style={styles.viewAllButton}
                >
                  View all {group.notifications.length} notifications
                </Button>
              )}
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    );
  };

  // Render list view
  const renderListView = () => {
    return (
      <ScrollView style={styles.scrollContainer}>
        {filteredNotifications.map(renderNotificationItem)}
        {filteredNotifications.length === 0 && (
          <View style={styles.emptyState}>
            <Text variant="bodyLarge">No notifications found</Text>
            <Text variant="bodySmall" style={styles.emptyStateSubtext}>
              {selectedFilter === 'all' ? 
                'You\'re all caught up!' : 
                'Try changing your filter to see more notifications.'
              }
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!visible) return null;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={[
          styles.modalContainer,
          isPhone && styles.modalContainerMobile,
          { maxHeight }
        ]}
      >
        <Surface style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text variant="headlineSmall">Notifications</Text>
              {unreadCount > 0 && (
                <Badge style={styles.headerBadge}>{unreadCount}</Badge>
              )}
            </View>
            <View style={styles.headerRight}>
              <IconButton
                icon="cog"
                onPress={() => setShowSettings(!showSettings)}
              />
              <IconButton icon="close" onPress={onClose} />
            </View>
          </View>

          {/* Settings Panel */}
          {showSettings && (
            <Surface style={styles.settingsPanel} elevation={1}>
              <View style={styles.settingRow}>
                <Text variant="bodyMedium">Grouped View</Text>
                <Switch
                  value={groupedView}
                  onValueChange={setGroupedView}
                />
              </View>
              <View style={styles.settingRow}>
                <Text variant="bodyMedium">Auto Refresh</Text>
                <Switch
                  value={autoRefresh}
                  onValueChange={setAutoRefresh}
                />
              </View>
              <Button
                mode="outlined"
                onPress={markAllAsRead}
                disabled={unreadCount === 0}
                icon="check-all"
                style={styles.markAllReadButton}
              >
                Mark All as Read ({unreadCount})
              </Button>
            </Surface>
          )}

          {/* Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersContainer}
          >
            {filterOptions.map(option => (
              <Chip
                key={option.value}
                mode={selectedFilter === option.value ? 'flat' : 'outlined'}
                selected={selectedFilter === option.value}
                onPress={() => setSelectedFilter(option.value)}
                style={styles.filterChip}
              >
                {option.label}
              </Chip>
            ))}
          </ScrollView>

          {/* Content */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
              <Text variant="bodyMedium" style={styles.loadingText}>
                Loading notifications...
              </Text>
            </View>
          ) : groupedView && selectedFilter === 'all' ? (
            renderGroupedView()
          ) : (
            renderListView()
          )}
        </Surface>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainerMobile: {
    padding: 0,
    justifyContent: 'flex-end',
  },
  modalContent: {
    width: '100%',
    maxWidth: 600,
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBadge: {
    backgroundColor: '#dc2626',
  },
  headerRight: {
    flexDirection: 'row',
  },
  settingsPanel: {
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  markAllReadButton: {
    marginTop: 8,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  scrollContainer: {
    maxHeight: 400,
  },
  groupCard: {
    margin: 8,
    marginBottom: 12,
  },
  viewAllButton: {
    marginTop: 8,
  },
  notificationItem: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  unreadNotification: {
    backgroundColor: '#f0f9ff',
  },
  notificationContent: {
    padding: 12,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    width: 8,
    height: 8,
  },
  timestamp: {
    color: '#6b7280',
  },
  unreadIndicator: {
    backgroundColor: '#3b82f6',
  },
  notificationTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    color: '#4b5563',
    marginBottom: 8,
  },
  notificationActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    marginBottom: 4,
  },
  dangerButton: {
    backgroundColor: '#dc2626',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6b7280',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateSubtext: {
    marginTop: 8,
    color: '#6b7280',
  },
});

export default AdvancedNotifications; 