import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, RefreshControl, Animated, Alert, Platform, FlatList, TouchableOpacity } from 'react-native';
import {
  Text,
  Card,
  useTheme,
  Surface,
  Button,
  Chip,
  IconButton,
  ActivityIndicator,
  Searchbar,
  Menu,
  Portal,
  Modal,
  TextInput,
  Divider,
  List,
  Avatar,
  Badge,
  FAB,
  SegmentedButtons,
  Snackbar,
  Switch,
  Checkbox,
  ProgressBar,
  DataTable,
  Dialog,
} from 'react-native-paper';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useEmployees } from '../../hooks/useEmployees';
import { useAuth } from '../../hooks/useAuth';
import AdminLayout from '../../components/AdminLayout';
import { CustomTheme } from '../../theme';
import { supabase } from '../../services/supabase';
import { sendVisaExpiryReminders } from '../../services/emailService';
import { DESIGN_SYSTEM } from '../../theme/designSystem';
import { withAuthGuard } from '../../components/AuthGuard';
import { notificationService, NotificationLog, NotificationResponse } from '../../services/notificationService';

const { width, height } = Dimensions.get('window');
const isMobile = width < DESIGN_SYSTEM.breakpoints.tablet;

// ENHANCED: Professional notification types
interface Notification {
  id: string;
  type: 'visa_expiry' | 'document_missing' | 'approval_pending' | 'system' | 'reminder';
  title: string;
  message: string;
  employeeId?: string;
  employeeName?: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  createdAt: string;
  actionRequired?: boolean;
  data?: any;
}

interface Employee {
  id: string;
  name: string;
  email_id: string;
  company_name?: string;
  trade?: string;
  visa_expiry_date?: string;
  is_active?: boolean;
}

interface VisaExpiryItem {
  employee_id: string;
  name: string;
  company_name: string;
  visa_expiry_date: string;
  days_until_expiry: number;
  urgency_level: string;
  trade: string;
  nationality: string;
}

function NotificationsScreen() {
  const theme = useTheme() as CustomTheme;
  const { user } = useAuth();
  const { employees, isLoading: employeesLoading, refreshEmployees } = useEmployees();
  
  // State management
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'urgent' | 'visa' | 'system'>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [showMarkAllModal, setShowMarkAllModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const [sendingReminders, setSendingReminders] = useState(false);
  const [expiringVisas, setExpiringVisas] = useState<VisaExpiryItem[]>([]);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);
  const [selectedView, setSelectedView] = useState('expiring');
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    manual: 0,
    automated: 0,
    byUrgency: {} as Record<string, number>,
    byDay: {} as Record<string, number>
  });

  // Manual notification state
  const [sendingNotification, setSendingNotification] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState(false);

  // Animation
  const [fadeAnimation] = useState(new Animated.Value(0));
  const [slideAnimation] = useState(new Animated.Value(-50));

  // ENHANCED: Professional color scheme
  const NOTIFICATION_COLORS = {
    visa_expiry: DESIGN_SYSTEM.colors.warning.main,
    document_missing: DESIGN_SYSTEM.colors.error.main,
    approval_pending: DESIGN_SYSTEM.colors.info.main,
    system: DESIGN_SYSTEM.colors.primary[500],
    reminder: DESIGN_SYSTEM.colors.success.main,
    low: DESIGN_SYSTEM.colors.neutral[500],
    medium: DESIGN_SYSTEM.colors.info.main,
    high: DESIGN_SYSTEM.colors.warning.main,
    critical: DESIGN_SYSTEM.colors.error.main,
  };

  const URGENCY_ICONS = {
    low: 'information-outline',
    medium: 'alert-circle-outline',
    high: 'alert',
    critical: 'alert-octagon',
  };

  const TYPE_ICONS = {
    visa_expiry: 'passport',
    document_missing: 'file-document-alert',
    approval_pending: 'clock-time-four',
    system: 'cog',
    reminder: 'bell-ring',
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (employees) {
      generateNotifications();
    }
  }, [employees]);

  useEffect(() => {
    // Enhanced animations
    Animated.parallel([
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadExpiringVisas(),
        loadNotificationLogs(),
        loadNotificationStats()
      ]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      setSnackbar('Failed to load notification data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadExpiringVisas = async () => {
    try {
      const visas = await notificationService.getExpiringVisas(90);
      setExpiringVisas(visas);
    } catch (error) {
      console.error('Failed to load expiring visas:', error);
      setSnackbar('Failed to load expiring visas');
    }
  };

  const loadNotificationLogs = async () => {
    try {
      const logs = await notificationService.getNotificationLogs({ limit: 50 });
      setNotificationLogs(logs);
    } catch (error) {
      console.error('Failed to load notification logs:', error);
      setSnackbar('Failed to load notification logs');
    }
  };

  const loadNotificationStats = async () => {
    try {
      const statsData = await notificationService.getNotificationStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load notification stats:', error);
    }
  };

  // ENHANCED: Generate real-time notifications from employee data
  const generateNotifications = useCallback(() => {
    if (!employees || employees.length === 0) return;

    const generatedNotifications: Notification[] = [];
    const today = new Date();

    employees.forEach(employee => {
      if (employee.visa_expiry_date) {
        const expiryDate = new Date(employee.visa_expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        let urgency: Notification['urgency'] = 'low';
        let message = '';

        if (daysUntilExpiry <= 0) {
          urgency = 'critical';
          message = `Visa has expired ${Math.abs(daysUntilExpiry)} days ago. Immediate action required.`;
        } else if (daysUntilExpiry <= 7) {
          urgency = 'critical';
          message = `Visa expires in ${daysUntilExpiry} days. Urgent renewal required.`;
        } else if (daysUntilExpiry <= 30) {
          urgency = 'high';
          message = `Visa expires in ${daysUntilExpiry} days. Please start renewal process.`;
        } else if (daysUntilExpiry <= 60) {
          urgency = 'medium';
          message = `Visa expires in ${daysUntilExpiry} days. Consider scheduling renewal.`;
        }

        if (urgency !== 'low') {
          generatedNotifications.push({
            id: `visa_${employee.id}_${Date.now()}`,
            type: 'visa_expiry',
            title: `Visa Expiry Alert - ${employee.name}`,
            message,
            employeeId: employee.id,
            employeeName: employee.name,
            urgency,
            isRead: false,
            createdAt: today.toISOString(),
            actionRequired: urgency === 'critical' || urgency === 'high',
            data: {
              expiryDate: employee.visa_expiry_date,
              daysUntilExpiry,
              company: employee.company_name,
              trade: employee.trade,
            },
          });
        }
      }

      // Check for inactive employees
      if (employee.is_active === false) {
        generatedNotifications.push({
          id: `inactive_${employee.id}_${Date.now()}`,
          type: 'system',
          title: `Inactive Employee - ${employee.name}`,
          message: `Employee ${employee.name} is marked as inactive. Review status if needed.`,
          employeeId: employee.id,
          employeeName: employee.name,
          urgency: 'low',
          isRead: false,
          createdAt: today.toISOString(),
          actionRequired: false,
          data: {
            company: employee.company_name,
            trade: employee.trade,
          },
        });
      }
    });

    // Add system notifications
    generatedNotifications.push({
      id: `system_welcome_${Date.now()}`,
      type: 'system',
      title: 'Welcome to CUBS Employee Management',
      message: 'System is running smoothly. All features are operational.',
      urgency: 'low',
      isRead: false,
      createdAt: today.toISOString(),
      actionRequired: false,
    });

    // Sort by urgency and date
    const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    generatedNotifications.sort((a, b) => {
      const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    setNotifications(generatedNotifications);
  }, [employees]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query) ||
        (notification.employeeName && notification.employeeName.toLowerCase().includes(query))
      );
    }

    // Apply type filter
    switch (filterType) {
      case 'unread':
        filtered = filtered.filter(n => !n.isRead);
        break;
      case 'urgent':
        filtered = filtered.filter(n => n.urgency === 'critical' || n.urgency === 'high');
        break;
      case 'visa':
        filtered = filtered.filter(n => n.type === 'visa_expiry');
        break;
      case 'system':
        filtered = filtered.filter(n => n.type === 'system');
        break;
    }

    return filtered;
  }, [notifications, searchQuery, filterType]);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const urgentCount = notifications.filter(n => n.urgency === 'critical' || n.urgency === 'high').length;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshEmployees();
      await loadInitialData();
    } catch (error) {
      setSnackbar('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
    setShowMarkAllModal(false);
    setSnackbar('All notifications marked as read');
  }, []);

  const handleNotificationPress = useCallback((notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    if (notification.employeeId) {
      router.push(`/(admin)/employees/${notification.employeeId}` as any);
    }
  }, [markAsRead]);

  const sendVisaReminders = useCallback(async () => {
    setSendingReminders(true);
    try {
      const visaNotifications = notifications.filter(n => 
        n.type === 'visa_expiry' && 
        (n.urgency === 'critical' || n.urgency === 'high')
      );

      if (visaNotifications.length === 0) {
        setSnackbar('No urgent visa notifications to send');
        return;
      }

      // Simulate sending reminders
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSnackbar(`Sent ${visaNotifications.length} visa expiry reminders`);
      setShowReminderModal(false);
    } catch (error) {
      console.error('Error sending reminders:', error);
      setSnackbar('Failed to send reminders');
    } finally {
      setSendingReminders(false);
    }
  }, [notifications]);

  const handleSendAutomatedNotifications = async () => {
    setSendingNotification(true);
    try {
      const result = await notificationService.sendAutomatedNotifications();
      
      if (result.success) {
        setSnackbar(`✅ Sent ${result.summary?.successful || 0} notifications successfully`);
        await loadNotificationLogs();
        await loadNotificationStats();
      } else {
        setSnackbar(`❌ Notification failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to send automated notifications:', error);
      setSnackbar('Failed to send automated notifications');
    } finally {
      setSendingNotification(false);
    }
  };

  const handleSendManualNotification = async (employeeId: string) => {
    setSendingNotification(true);
    try {
      const result = await notificationService.sendManualNotification(employeeId);
      
      if (result.success) {
        setSnackbar(`✅ Manual notification sent successfully`);
        await loadNotificationLogs();
        await loadNotificationStats();
      } else {
        setSnackbar(`❌ Manual notification failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to send manual notification:', error);
      setSnackbar('Failed to send manual notification');
    } finally {
      setSendingNotification(false);
      setConfirmDialog(false);
      setSelectedEmployee(null);
    }
  };

  // ENHANCED: Professional notification card component
  const NotificationCard = ({ notification, index }: { notification: Notification; index: number }) => {
    const urgencyColor = NOTIFICATION_COLORS[notification.urgency];
    const typeColor = NOTIFICATION_COLORS[notification.type];
    const isSelected = selectedNotifications.includes(notification.id);

    return (
      <Animated.View
        style={[
          styles.notificationCard,
          {
            opacity: fadeAnimation,
            transform: [{
              translateX: slideAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            }],
          },
        ]}
      >
        <Surface 
          style={[
            styles.notificationSurface, 
            { 
              backgroundColor: notification.isRead ? theme.colors.surface : theme.colors.primaryContainer + '20',
              borderLeftColor: urgencyColor,
              borderLeftWidth: 4,
              elevation: notification.isRead ? 2 : 4,
            }
          ]} 
          elevation={notification.isRead ? 2 : 4}
        >
          <TouchableOpacity
            style={styles.notificationContent}
            onPress={() => handleNotificationPress(notification)}
            onLongPress={() => handleNotificationSelect(notification.id)}
            activeOpacity={0.7}
          >
            <View style={styles.notificationHeader}>
              <View style={styles.notificationMeta}>
                <View style={[styles.notificationTypeIcon, { backgroundColor: typeColor + '20' }]}>
                  <Ionicons 
                    name={TYPE_ICONS[notification.type] as any} 
                    size={20} 
                    color={typeColor} 
                  />
                </View>
                
                <View style={styles.notificationInfo}>
                  <View style={styles.notificationTitleRow}>
                    <Text 
                      variant="titleMedium" 
                      style={[
                        styles.notificationTitle, 
                        { 
                          color: theme.colors.onSurface,
                          fontWeight: notification.isRead ? 'normal' : 'bold',
                        }
                      ]}
                      numberOfLines={2}
                    >
                      {notification.title}
                    </Text>
                    
                    <Badge 
                      style={[styles.urgencyBadge, { backgroundColor: urgencyColor }]}
                      size={20}
                    >
                      {notification.urgency === 'critical' ? '⚠' : notification.urgency === 'high' ? '!' : notification.urgency === 'medium' ? 'i' : '·'}
                    </Badge>
                  </View>
                  
                  <Text 
                    variant="bodyMedium" 
                    style={[styles.notificationMessage, { color: theme.colors.onSurfaceVariant }]}
                    numberOfLines={3}
                  >
                    {notification.message}
                  </Text>
                  
                  <View style={styles.notificationFooter}>
                    {notification.employeeName && (
                      <Chip 
                        icon="account" 
                        style={styles.employeeChip}
                        textStyle={styles.chipText}
                        compact
                      >
                        {notification.employeeName}
                      </Chip>
                    )}
                    
                    <Text 
                      variant="bodySmall" 
                      style={[styles.notificationTime, { color: theme.colors.onSurfaceVariant }]}
                    >
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.notificationActions}>
                <Checkbox
                  status={isSelected ? 'checked' : 'unchecked'}
                  onPress={() => handleNotificationSelect(notification.id)}
                  uncheckedColor={theme.colors.onSurfaceVariant}
                />
                
                <Menu
                  visible={false}
                  onDismiss={() => {}}
                  anchor={
                    <IconButton
                      icon="dots-vertical"
                      size={20}
                      iconColor={theme.colors.onSurfaceVariant}
                      onPress={() => {}}
                    />
                  }
                >
                  <Menu.Item
                    onPress={() => handleMarkAsRead(notification.id)}
                    title={notification.isRead ? "Mark as Unread" : "Mark as Read"}
                    leadingIcon={notification.isRead ? "email-mark-as-unread" : "email-open"}
                  />
                  <Menu.Item
                    onPress={() => handleDeleteNotification(notification.id)}
                    title="Delete"
                    leadingIcon="delete"
                  />
                </Menu>
              </View>
            </View>
            
            {notification.actionRequired && (
              <View style={styles.actionRequired}>
                <LinearGradient
                  colors={[urgencyColor + '20', urgencyColor + '10']}
                  style={styles.actionGradient}
                >
                  <Ionicons name="alert-circle" size={16} color={urgencyColor} />
                  <Text 
                    variant="bodySmall" 
                    style={[styles.actionText, { color: urgencyColor }]}
                  >
                    Action Required
                  </Text>
                  <Button
                    mode="contained"
                    onPress={() => handleTakeAction(notification)}
                    style={[styles.actionButton, { backgroundColor: urgencyColor }]}
                    contentStyle={styles.actionButtonContent}
                    labelStyle={styles.actionButtonLabel}
                    compact
                  >
                    Take Action
                  </Button>
                </LinearGradient>
              </View>
            )}
          </TouchableOpacity>
        </Surface>
      </Animated.View>
    );
  };

  // ENHANCED: Professional header with statistics
  const renderHeader = () => (
    <Surface style={[styles.headerSection, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <LinearGradient
        colors={[DESIGN_SYSTEM.colors.primary[500] + '10', 'transparent']}
        style={styles.headerGradient}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerInfo}>
            <Text variant="headlineMedium" style={[styles.pageTitle, { color: theme.colors.onSurface }]}>
              Notifications
            </Text>
            <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              Stay updated with important alerts and reminders
            </Text>
          </View>
          
          <View style={styles.headerStats}>
            <View style={styles.statItem}>
              <Text variant="titleMedium" style={[styles.statValue, { color: DESIGN_SYSTEM.colors.error.main }]}>
                {urgentCount}
              </Text>
              <Text variant="bodySmall" style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                Urgent
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="titleMedium" style={[styles.statValue, { color: DESIGN_SYSTEM.colors.info.main }]}>
                {unreadCount}
              </Text>
              <Text variant="bodySmall" style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                Unread
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.searchSection}>
          <Searchbar
            placeholder="Search notifications..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={[styles.searchBar, { backgroundColor: theme.colors.surfaceVariant }]}
            iconColor={theme.colors.onSurfaceVariant}
            inputStyle={{ color: theme.colors.onSurface }}
            elevation={0}
          />
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          <View style={styles.filtersContainer}>
            {[
              { key: 'all', label: 'All', count: notifications.length },
              { key: 'unread', label: 'Unread', count: unreadCount },
              { key: 'urgent', label: 'Urgent', count: urgentCount },
              { key: 'visa', label: 'Visa Alerts', count: notifications.filter(n => n.type === 'visa_expiry').length },
              { key: 'system', label: 'System', count: notifications.filter(n => n.type === 'system').length },
            ].map((filter) => (
              <Chip
                key={filter.key}
                selected={filterType === filter.key}
                onPress={() => setFilterType(filter.key as any)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: filterType === filter.key ? 
                      DESIGN_SYSTEM.colors.primary[500] + '20' : 
                      theme.colors.surface
                  }
                ]}
                textStyle={{
                  color: filterType === filter.key ? 
                    DESIGN_SYSTEM.colors.primary[500] : 
                    theme.colors.onSurface
                }}
              >
                {filter.label} ({filter.count})
              </Chip>
            ))}
          </View>
        </ScrollView>

        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            icon="email-multiple"
            onPress={() => setShowReminderModal(true)}
            disabled={urgentCount === 0}
            style={styles.actionButton}
          >
            Send Reminders ({urgentCount})
          </Button>
          <Button
            mode="contained"
            icon="check-all"
            onPress={() => setShowMarkAllModal(true)}
            disabled={unreadCount === 0}
            style={[styles.actionButton, { backgroundColor: DESIGN_SYSTEM.colors.primary[500] }]}
          >
            Mark All Read
          </Button>
        </View>
      </LinearGradient>
    </Surface>
  );

  // Enhanced helper functions
  const handleNotificationSelect = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId) 
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      )
    );
  };

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  };

  const handleTakeAction = (notification: Notification) => {
    // Handle specific actions based on notification type
    if (notification.type === 'visa_expiry' && notification.employeeId) {
      router.push(`/(admin)/employees?id=${notification.employeeId}&action=renew_visa`);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return theme.colors.error;
      case 'urgent': return '#FF8C00';
      case 'warning': return theme.colors.primary;
      case 'notice': return theme.colors.outline;
      default: return theme.colors.outline;
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'alert';
      case 'urgent': return 'clock-alert';
      case 'warning': return 'information';
      case 'notice': return 'bell';
      default: return 'bell';
    }
  };

  const filteredExpiringVisas = expiringVisas.filter(visa =>
    visa.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    visa.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    visa.trade.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredNotificationLogs = notificationLogs.filter(log =>
    log.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderExpiringVisaCard = (visa: VisaExpiryItem) => (
    <Card key={visa.employee_id} style={styles.visaCard}>
      <Card.Content>
        <View style={styles.visaHeader}>
          <View style={styles.visaInfo}>
            <Text variant="titleMedium" style={styles.employeeName}>
              {visa.name}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {visa.company_name} • {visa.trade}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              ID: {visa.employee_id} • {visa.nationality}
            </Text>
          </View>
          <View style={styles.urgencyContainer}>
            <Chip
              icon={getUrgencyIcon(visa.urgency_level)}
              style={{ backgroundColor: getUrgencyColor(visa.urgency_level) + '20' }}
              textStyle={{ color: getUrgencyColor(visa.urgency_level), fontWeight: 'bold' }}
            >
              {visa.days_until_expiry} days
            </Chip>
          </View>
        </View>
        
        <View style={styles.visaDetails}>
          <Text variant="bodyMedium">
            <Text style={{ fontWeight: 'bold' }}>Expiry Date: </Text>
            {new Date(visa.visa_expiry_date).toLocaleDateString()}
          </Text>
          <Text variant="bodyMedium">
            <Text style={{ fontWeight: 'bold' }}>Urgency: </Text>
            {visa.urgency_level.charAt(0).toUpperCase() + visa.urgency_level.slice(1)}
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            icon="email-send"
            onPress={() => {
              setSelectedEmployee(visa.employee_id);
              setConfirmDialog(true);
            }}
            disabled={sendingNotification}
            style={styles.actionButton}
          >
            Send Manual Reminder
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderNotificationLogRow = (log: NotificationLog) => (
    <DataTable.Row key={log.id}>
      <DataTable.Cell style={{ flex: 2 }}>
        <View>
          <Text variant="bodyMedium">{log.employee_id}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {log.template_used || 'Default'}
          </Text>
        </View>
      </DataTable.Cell>
      <DataTable.Cell style={{ flex: 1 }}>
        <Chip
          icon={getUrgencyIcon(log.urgency)}
          style={{ backgroundColor: getUrgencyColor(log.urgency) + '20' }}
          textStyle={{ color: getUrgencyColor(log.urgency) }}
          compact
        >
          {log.days_until_expiry}d
        </Chip>
      </DataTable.Cell>
      <DataTable.Cell style={{ flex: 1 }}>
        <Badge style={{ 
          backgroundColor: log.email_sent ? theme.colors.primary : theme.colors.error 
        }}>
          {log.email_sent ? 'Sent' : 'Failed'}
        </Badge>
      </DataTable.Cell>
      <DataTable.Cell style={{ flex: 1 }}>
        <Chip compact icon={log.manual_trigger ? 'account' : 'robot'}>
          {log.manual_trigger ? 'Manual' : 'Auto'}
        </Chip>
      </DataTable.Cell>
      <DataTable.Cell style={{ flex: 1 }}>
        <Text variant="bodySmall">
          {new Date(log.created_at).toLocaleDateString()}
        </Text>
      </DataTable.Cell>
    </DataTable.Row>
  );

  const renderStatsCard = () => (
    <Surface style={styles.statsCard} elevation={2}>
      <Text variant="titleMedium" style={styles.statsTitle}>Notification Statistics</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>
            {stats.total}
          </Text>
          <Text variant="bodySmall">Total Sent</Text>
        </View>
        <View style={styles.statItem}>
          <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>
            {stats.successful}
          </Text>
          <Text variant="bodySmall">Successful</Text>
        </View>
        <View style={styles.statItem}>
          <Text variant="headlineMedium" style={{ color: theme.colors.error }}>
            {stats.failed}
          </Text>
          <Text variant="bodySmall">Failed</Text>
        </View>
        <View style={styles.statItem}>
          <Text variant="headlineMedium" style={{ color: theme.colors.tertiary }}>
            {stats.manual}
          </Text>
          <Text variant="bodySmall">Manual</Text>
        </View>
      </View>
    </Surface>
  );

  if (isLoading) {
    return (
      <AdminLayout title="Notifications" currentRoute="/(admin)/notifications">
        <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator size="large" color={DESIGN_SYSTEM.colors.primary[500]} />
          <Text variant="bodyLarge" style={[styles.loadingText, { color: theme.colors.onSurface }]}>
            Loading notifications...
          </Text>
        </View>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Notifications" currentRoute="/(admin)/notifications">
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {renderHeader()}
        
        <View style={styles.contentContainer}>
          {selectedView === 'expiring' && (
            <View style={styles.section}>
              <Text variant="headlineSmall" style={styles.sectionTitle}>
                Expiring Visas ({filteredExpiringVisas.length})
              </Text>
              {filteredExpiringVisas.length === 0 ? (
                <Card style={styles.emptyCard}>
                  <Card.Content style={styles.emptyContent}>
                    <Text variant="titleMedium">No expiring visas found</Text>
                    <Text variant="bodyMedium">All visas are up to date!</Text>
                  </Card.Content>
                </Card>
              ) : (
                filteredExpiringVisas.map(renderExpiringVisaCard)
              )}
            </View>
          )}

          {selectedView === 'logs' && (
            <View style={styles.section}>
              <Text variant="headlineSmall" style={styles.sectionTitle}>
                Recent Notifications ({filteredNotificationLogs.length})
              </Text>
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title style={{ flex: 2 }}>Employee</DataTable.Title>
                  <DataTable.Title style={{ flex: 1 }}>Days</DataTable.Title>
                  <DataTable.Title style={{ flex: 1 }}>Status</DataTable.Title>
                  <DataTable.Title style={{ flex: 1 }}>Type</DataTable.Title>
                  <DataTable.Title style={{ flex: 1 }}>Date</DataTable.Title>
                </DataTable.Header>
                {filteredNotificationLogs.map(renderNotificationLogRow)}
              </DataTable>
            </View>
          )}

          {selectedView === 'stats' && (
            <View style={styles.section}>
              <Text variant="headlineSmall" style={styles.sectionTitle}>
                Notification Statistics
              </Text>
              {renderStatsCard()}
            </View>
          )}
        </View>

        {/* Mark All Read Modal */}
        <Portal>
          <Modal
            visible={showMarkAllModal}
            onDismiss={() => setShowMarkAllModal(false)}
            contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
          >
            <Text variant="headlineSmall" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
              Mark All as Read
            </Text>
            <Text variant="bodyMedium" style={[styles.modalMessage, { color: theme.colors.onSurfaceVariant }]}>
              Are you sure you want to mark all {unreadCount} notifications as read? This action cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setShowMarkAllModal(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={markAllAsRead}
                style={[styles.modalButton, { backgroundColor: DESIGN_SYSTEM.colors.primary[500] }]}
              >
                Mark All Read
              </Button>
            </View>
          </Modal>
        </Portal>

        {/* Send Reminders Modal */}
        <Portal>
          <Modal
            visible={showReminderModal}
            onDismiss={() => setShowReminderModal(false)}
            contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
          >
            <Text variant="headlineSmall" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
              Send Visa Reminders
            </Text>
            <Text variant="bodyMedium" style={[styles.modalMessage, { color: theme.colors.onSurfaceVariant }]}>
              Send email reminders to {urgentCount} employees with urgent visa renewals?
            </Text>
            {sendingReminders && (
              <View style={styles.progressContainer}>
                <ProgressBar
                  indeterminate
                  color={DESIGN_SYSTEM.colors.primary[500]}
                  style={styles.progressBar}
                />
                <Text variant="bodySmall" style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}>
                  Sending reminders...
                </Text>
              </View>
            )}
            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setShowReminderModal(false)}
                disabled={sendingReminders}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSendAutomatedNotifications}
                loading={sendingReminders}
                disabled={sendingReminders}
                style={[styles.modalButton, { backgroundColor: DESIGN_SYSTEM.colors.warning.main }]}
              >
                Send Reminders
              </Button>
            </View>
          </Modal>
        </Portal>

        {/* Confirmation Dialog */}
        <Portal>
          <Dialog visible={confirmDialog} onDismiss={() => setConfirmDialog(false)}>
            <Dialog.Title>Send Manual Notification</Dialog.Title>
            <Dialog.Content>
              <Text>
                Are you sure you want to send a manual visa expiry notification for this employee?
                This will send an email to info@cubstechnical.com immediately.
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setConfirmDialog(false)}>Cancel</Button>
              <Button 
                mode="contained" 
                onPress={() => selectedEmployee && handleSendManualNotification(selectedEmployee)}
                loading={sendingNotification}
              >
                Send Notification
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* Snackbar */}
        <Snackbar
          visible={!!snackbar}
          onDismiss={() => setSnackbar('')}
          duration={4000}
        >
          {snackbar}
        </Snackbar>
      </View>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Header Styles
  headerSection: {
    paddingHorizontal: DESIGN_SYSTEM.spacing[4],
    paddingVertical: DESIGN_SYSTEM.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_SYSTEM.colors.neutral[200],
  },
  headerGradient: {
    padding: DESIGN_SYSTEM.spacing[4],
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DESIGN_SYSTEM.spacing[4],
  },
  headerInfo: {
    flex: 1,
  },
  pageTitle: {
    fontWeight: 'bold',
    marginBottom: DESIGN_SYSTEM.spacing[1],
  },
  subtitle: {
    opacity: 0.8,
  },
  headerStats: {
    flexDirection: 'row',
    gap: DESIGN_SYSTEM.spacing[4],
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  
  // Search and Filter Styles
  searchSection: {
    marginBottom: DESIGN_SYSTEM.spacing[3],
  },
  searchBar: {
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
    elevation: 0,
  },
  filtersScroll: {
    marginBottom: DESIGN_SYSTEM.spacing[3],
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: DESIGN_SYSTEM.spacing[2],
    paddingHorizontal: DESIGN_SYSTEM.spacing[2],
  },
  filterChip: {
    borderRadius: DESIGN_SYSTEM.borderRadius.full,
  },
  
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: DESIGN_SYSTEM.spacing[2],
    marginTop: DESIGN_SYSTEM.spacing[2],
  },
  actionButton: {
    flex: 1,
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
  },
  
  // Content Styles
  contentContainer: {
    flex: 1,
  },
  notificationsList: {
    paddingHorizontal: DESIGN_SYSTEM.spacing[4],
    paddingTop: DESIGN_SYSTEM.spacing[2],
    paddingBottom: DESIGN_SYSTEM.spacing[8],
  },
  
  // Notification Card Styles
  notificationCard: {
    marginBottom: DESIGN_SYSTEM.spacing[2],
  },
  notificationSurface: {
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    overflow: 'hidden',
  },
  notificationContent: {
    padding: DESIGN_SYSTEM.spacing[4],
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DESIGN_SYSTEM.spacing[2],
  },
  notificationInfo: {
    flex: 1,
    marginLeft: DESIGN_SYSTEM.spacing[3],
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DESIGN_SYSTEM.spacing[2],
  },
  notificationTitle: {
    marginBottom: DESIGN_SYSTEM.spacing[1],
    lineHeight: 20,
  },
  notificationMessage: {
    marginBottom: DESIGN_SYSTEM.spacing[2],
    lineHeight: 18,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DESIGN_SYSTEM.spacing[2],
  },
  employeeChip: {
    borderRadius: DESIGN_SYSTEM.borderRadius.full,
  },
  chipText: {
    fontSize: 12,
  },
  notificationActions: {
    alignItems: 'flex-end',
    gap: DESIGN_SYSTEM.spacing[2],
  },
  urgencyBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: DESIGN_SYSTEM.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationTime: {
    fontSize: 11,
  },
  actionRequired: {
    marginTop: DESIGN_SYSTEM.spacing[3],
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
    overflow: 'hidden',
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DESIGN_SYSTEM.spacing[3],
    gap: DESIGN_SYSTEM.spacing[2],
  },
  actionText: {
    flex: 1,
    fontWeight: '600',
  },
  actionButtonContent: {
    paddingHorizontal: DESIGN_SYSTEM.spacing[4],
  },
  actionButtonLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  // Loading and Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: DESIGN_SYSTEM.spacing[16],
  },
  loadingText: {
    marginTop: DESIGN_SYSTEM.spacing[4],
    fontSize: DESIGN_SYSTEM.typography.fontSize.lg,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: DESIGN_SYSTEM.spacing[16],
    paddingHorizontal: DESIGN_SYSTEM.spacing[6],
    marginHorizontal: DESIGN_SYSTEM.spacing[4],
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
  },
  emptyTitle: {
    marginTop: DESIGN_SYSTEM.spacing[4],
    marginBottom: DESIGN_SYSTEM.spacing[2],
    textAlign: 'center',
    fontWeight: 'bold',
  },
  emptyMessage: {
    textAlign: 'center',
    marginBottom: DESIGN_SYSTEM.spacing[4],
    lineHeight: 24,
  },
  emptyAction: {
    marginTop: DESIGN_SYSTEM.spacing[4],
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
  },
  
  // Modal Styles
  modalContainer: {
    margin: DESIGN_SYSTEM.spacing[5],
    borderRadius: DESIGN_SYSTEM.borderRadius.xl,
    padding: DESIGN_SYSTEM.spacing[6],
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: DESIGN_SYSTEM.spacing[4],
    fontWeight: 'bold',
  },
  modalMessage: {
    textAlign: 'center',
    marginBottom: DESIGN_SYSTEM.spacing[6],
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: DESIGN_SYSTEM.spacing[3],
  },
  modalButton: {
    flex: 1,
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
  },
  
  // Progress Styles
  progressContainer: {
    marginVertical: DESIGN_SYSTEM.spacing[4],
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: DESIGN_SYSTEM.spacing[2],
  },
  progressText: {
    textAlign: 'center',
    fontSize: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  visaCard: {
    marginBottom: 12,
  },
  visaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  visaInfo: {
    flex: 1,
  },
  employeeName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  urgencyContainer: {
    marginLeft: 12,
  },
  visaDetails: {
    marginBottom: 16,
  },
  emptyCard: {
    padding: 24,
  },
  emptyContent: {
    alignItems: 'center',
  },
  statsCard: {
    padding: 16,
    borderRadius: 12,
  },
  statsTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});

export default withAuthGuard({
  WrappedComponent: NotificationsScreen,
  allowedRoles: ['admin']
}); 

