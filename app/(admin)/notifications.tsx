import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Dimensions, RefreshControl, Animated } from 'react-native';
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
  Checkbox,
  Snackbar
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import AdminLayout from '../../components/AdminLayout';
import { CustomTheme } from '../../theme';
import { useEmployees } from '../../hooks/useEmployees';
import { Employee } from '../../services/supabase';
import { sendVisaExpiryNotification, sendEmailUsingSendGrid } from '../../services/sendgrid';
import { sendEmailNotification } from '../../services/emailService';

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

interface VisaAlert {
  id: string;
  employeeId: string;
  employeeName: string;
  companyName: string;
  expiryDate: string;
  daysRemaining: number;
  urgency: 'high' | 'medium' | 'low';
  status: 'pending' | 'sent' | 'resolved';
  emailSent: boolean;
}

// Generate real notifications from employee data
const generateNotificationsFromEmployees = (employees: Employee[]): Notification[] => {
  const notifications: Notification[] = [];
  const now = new Date();

  employees.forEach(employee => {
    if (!employee.visa_expiry_date) return;

    const expiryDate = new Date(employee.visa_expiry_date);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Create visa expiry notifications based on urgency
    if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
      let priority: 'high' | 'medium' | 'low' = 'low';
      let title = 'Visa Expiry Notice';

      if (daysUntilExpiry <= 7) {
        priority = 'high';
        title = 'URGENT: Visa Expiring Soon';
      } else if (daysUntilExpiry <= 15) {
        priority = 'medium';
        title = 'Important: Visa Expiry Warning';
      }

      notifications.push({
        id: `visa-${employee.id}`,
        title,
        message: `${employee.name}'s visa expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'} (${expiryDate.toLocaleDateString('en-GB')})`,
        type: 'visa_expiry',
        priority,
        read: false,
        timestamp: new Date().toISOString(),
        employee_id: employee.employee_id,
        employee_name: employee.name
      });
    }

    // Check for missing documents (if employee has no passport number)
    if (!employee.passport_number || employee.passport_number.trim() === '') {
      notifications.push({
        id: `passport-${employee.id}`,
        title: 'Document Missing',
        message: `${employee.name}'s passport information is missing`,
        type: 'document_missing',
        priority: 'medium',
        read: false,
        timestamp: new Date().toISOString(),
        employee_id: employee.employee_id,
        employee_name: employee.name
      });
    }

    // Check for missing email (important for notifications)
    if (!employee.email_id || !employee.email_id.includes('@')) {
      notifications.push({
        id: `email-${employee.id}`,
        title: 'Contact Missing',
        message: `${employee.name}'s email address is missing or invalid`,
        type: 'document_missing',
        priority: 'medium',
        read: false,
        timestamp: new Date().toISOString(),
        employee_id: employee.employee_id,
        employee_name: employee.name
      });
    }
  });

  // Sort by priority and timestamp
  return notifications.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
};

export default function NotificationsScreen() {
  const theme = useTheme() as CustomTheme;
  const { employees, error, refreshEmployees } = useEmployees();
  
  // State for notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // State for visa expiry notifications
  const [visaExpiryEmployees, setVisaExpiryEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const [selectedUrgency, setSelectedUrgency] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'sent' | 'resolved'>('all');
  const [visaAlerts, setVisaAlerts] = useState<VisaAlert[]>([]);

  // Email composition modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  
  // Automatic email settings
  const [showEmailSettings, setShowEmailSettings] = useState(false);
  const [autoEmailSettings, setAutoEmailSettings] = useState({
    enabled: true,
    daysBeforeExpiry: [30, 15, 7, 1],
    recipientEmails: ['admin@cubs-technical.com', 'hr@cubs-technical.com'],
    includeEmployeeEmail: true,
  });

  // Animation
  const fadeAnimation = new Animated.Value(0);

  // Enhanced Professional Colors
  const COLORS = {
    primary: '#2563EB',
    secondary: '#3B82F6', 
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#06B6D4',
    purple: '#8B5CF6',
    gray: '#6B7280',
    cardBg: theme.colors.surface,
    accent: '#F3F4F6',
  };

  useEffect(() => {
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    
    loadVisaExpiryData();
    updateNotifications();
  }, [employees]);

  useEffect(() => {
    filterEmployees();
  }, [visaExpiryEmployees, searchQuery]);

  const updateNotifications = () => {
    if (!employees) return;
    const generatedNotifications = generateNotificationsFromEmployees(employees);
    setNotifications(generatedNotifications);
  };

  const loadVisaExpiryData = () => {
    if (!employees) return;

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const expiringEmployees = employees.filter(emp => {
      if (!emp.visa_expiry_date) return false;
      
      const expiryDate = new Date(emp.visa_expiry_date);
      return expiryDate <= thirtyDaysFromNow && expiryDate >= now;
    });
    
    // Sort by expiry date (most urgent first)
    expiringEmployees.sort((a, b) => {
      const dateA = new Date(a.visa_expiry_date!).getTime();
      const dateB = new Date(b.visa_expiry_date!).getTime();
      return dateA - dateB;
    });

    setVisaExpiryEmployees(expiringEmployees);
  };

  const filterEmployees = () => {
    let filtered = visaExpiryEmployees;
    
    if (searchQuery) {
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredEmployees(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshEmployees();
      await loadNotifications();
    } catch (error) {
      console.error('Error refreshing:', error);
      setSnackbar('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const getDaysUntilExpiry = (expiryDate: string): number => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getUrgencyLevel = (days: number): 'critical' | 'urgent' | 'warning' => {
    if (days <= 7) return 'critical';
    if (days <= 15) return 'urgent';
    return 'warning';
  };

  const getUrgencyColor = (days: number): string => {
    const level = getUrgencyLevel(days);
    switch (level) {
      case 'critical': return COLORS.error;
      case 'urgent': return COLORS.warning;
      case 'warning': return COLORS.info;
      default: return COLORS.gray;
    }
  };

  const handleSelectEmployee = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map(emp => emp.id));
    }
  };

  const handleSendEmails = async () => {
    if (selectedEmployees.length === 0) {
      setSnackbar('Please select employees to send notifications');
      return;
    }

    setSendingEmail(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const employeeId of selectedEmployees) {
        try {
          const employee = employees?.find(emp => emp.id === employeeId);
          if (employee && employee.email_id) {
            // Use the email service to send notification
            const emailSent = await sendEmailNotification({
              to: { email: employee.email_id, name: employee.name },
              template: {
                subject: 'Visa Expiry Reminder - Action Required',
                body: emailMessage || generateDefaultEmailTemplate(employee),
                type: 'visa_reminder'
              }
            });

            if (emailSent) {
              successCount++;
              // Update alert status
              setVisaAlerts(prev => prev.map(alert => 
                alert.employeeId === employeeId 
                  ? { ...alert, status: 'sent' as const, emailSent: true }
                  : alert
              ));
            } else {
              errorCount++;
            }
          } else {
            console.warn(`No email found for employee: ${employee?.name}`);
            errorCount++;
          }
        } catch (error) {
          console.error(`Error sending email to ${employeeId}:`, error);
          errorCount++;
        }
      }

      setSnackbar(`Emails sent: ${successCount} successful, ${errorCount} failed`);
      setSelectedEmployees([]);
      setShowEmailModal(false);
      setEmailMessage('');
    } catch (error) {
      console.error('Error sending bulk emails:', error);
      setSnackbar('Failed to send emails');
    } finally {
      setSendingEmail(false);
    }
  };

  const generateDefaultEmailTemplate = (employee: any): string => {
    const expiryDate = new Date(employee.visa_expiry_date).toLocaleDateString();
    const daysRemaining = Math.ceil((new Date(employee.visa_expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    return `Dear ${employee.name},

This is an important reminder regarding your visa expiry.

Details:
- Employee ID: ${employee.employee_id}
- Company: ${employee.company_name}
- Visa Expiry Date: ${expiryDate}
- Days Remaining: ${daysRemaining > 0 ? daysRemaining : 'EXPIRED'}

${daysRemaining <= 0 
  ? 'Your visa has EXPIRED. Please contact HR immediately to resolve this matter.'
  : `Your visa is expiring in ${daysRemaining} days. Please take necessary action to renew your visa before the expiry date.`
}

For assistance, please contact your HR department or company administrator.

Best regards,
CUBS Technical Team`;
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      if (employees && employees.length > 0) {
        const alerts = generateVisaAlerts(employees);
        setVisaAlerts(alerts);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setSnackbar('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const generateVisaAlerts = (employeesList: any[]): VisaAlert[] => {
    const alerts: VisaAlert[] = [];
    const now = new Date();

    employeesList.forEach((employee) => {
      if (employee.visa_expiry_date && employee.is_active) {
        const expiryDate = new Date(employee.visa_expiry_date);
        const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Only include visas expiring within 90 days or already expired
        if (daysRemaining <= 90) {
          let urgency: 'high' | 'medium' | 'low';
          if (daysRemaining < 0) urgency = 'high';
          else if (daysRemaining <= 30) urgency = 'high';
          else if (daysRemaining <= 60) urgency = 'medium';
          else urgency = 'low';

          alerts.push({
            id: `visa_${employee.id}`,
            employeeId: employee.id,
            employeeName: employee.name,
            companyName: employee.company_name || 'Unknown Company',
            expiryDate: employee.visa_expiry_date,
            daysRemaining,
            urgency,
            status: 'pending',
            emailSent: false,
          });
        }
      }
    });

    return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
  };

  const filteredAlerts = visaAlerts.filter(alert => {
    const matchesSearch = alert.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         alert.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUrgency = selectedUrgency === 'all' || alert.urgency === selectedUrgency;
    const matchesStatus = selectedStatus === 'all' || alert.status === selectedStatus;
    
    return matchesSearch && matchesUrgency && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return COLORS.success;
      case 'resolved': return COLORS.primary;
      case 'pending': return COLORS.warning;
      default: return COLORS.gray;
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Notifications" currentRoute="/admin/notifications">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="📨 Visa Notifications" 
      currentRoute="/admin/notifications"
      showBackButton={true}
      onBackPress={() => router.push('/(admin)/dashboard')}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header Controls */}
        <Surface style={[styles.headerControls, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Searchbar
            placeholder="Search employees..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            iconColor={COLORS.primary}
          />
          
          <View style={styles.filterRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <Chip
                selected={selectedUrgency === 'all'}
                onPress={() => setSelectedUrgency('all')}
                style={styles.filterChip}
                textStyle={{ color: selectedUrgency === 'all' ? 'white' : COLORS.gray }}
                selectedColor={COLORS.primary}
              >
                All Urgency
              </Chip>
              <Chip
                selected={selectedUrgency === 'high'}
                onPress={() => setSelectedUrgency('high')}
                style={styles.filterChip}
                textStyle={{ color: selectedUrgency === 'high' ? 'white' : COLORS.error }}
                selectedColor={COLORS.error}
              >
                High Priority
              </Chip>
              <Chip
                selected={selectedUrgency === 'medium'}
                onPress={() => setSelectedUrgency('medium')}
                style={styles.filterChip}
                textStyle={{ color: selectedUrgency === 'medium' ? 'white' : COLORS.warning }}
                selectedColor={COLORS.warning}
              >
                Medium Priority
              </Chip>
              <Chip
                selected={selectedUrgency === 'low'}
                onPress={() => setSelectedUrgency('low')}
                style={styles.filterChip}
                textStyle={{ color: selectedUrgency === 'low' ? 'white' : COLORS.info }}
                selectedColor={COLORS.info}
              >
                Low Priority
              </Chip>
            </ScrollView>
          </View>

          {selectedEmployees.length > 0 && (
            <Surface style={styles.bulkActionsBar} elevation={1}>
              <Text style={styles.bulkActionsText}>
                {selectedEmployees.length} employee(s) selected
              </Text>
              <Button
                mode="contained"
                onPress={() => setShowEmailModal(true)}
                style={[styles.bulkActionButton, { backgroundColor: COLORS.primary }]}
                icon="email-send"
                compact
              >
                Send Notifications
              </Button>
            </Surface>
          )}
        </Surface>

        {/* Content */}
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
          {filteredAlerts.length === 0 ? (
            <View style={styles.emptyState}>
              <IconButton icon="bell-check" size={64} iconColor={theme.colors.onSurfaceVariant} />
              <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, marginTop: 16 }}>
                {visaAlerts.length === 0 ? 'No notifications' : 'No matching notifications'}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>
                {visaAlerts.length === 0 
                  ? 'All visa statuses are up to date!'
                  : 'Try adjusting your search or filter criteria'
                }
              </Text>
            </View>
          ) : (
            filteredAlerts.map((alert) => (
              <Surface key={alert.id} style={styles.notificationCard} elevation={2}>
                <LinearGradient
                  colors={[theme.colors.surface, theme.colors.surfaceVariant + '30']}
                  style={styles.cardGradient}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <View style={styles.employeeInfo}>
                        <Text variant="titleMedium" style={[styles.employeeName, { color: theme.colors.onSurface }]}>
                          {alert.employeeName}
                        </Text>
                        <Text variant="bodySmall" style={[styles.employeeDetails, { color: theme.colors.onSurfaceVariant }]}>
                          {alert.companyName}
                        </Text>
                      </View>
                      
                      <View style={styles.badgeContainer}>
                        <Chip
                          mode="flat"
                          compact
                          style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(getDaysUntilExpiry(alert.expiryDate)) + '20' }]}
                          textStyle={[styles.badgeText, { color: getUrgencyColor(getDaysUntilExpiry(alert.expiryDate)) }]}
                        >
                          {alert.urgency.toUpperCase()}
                        </Chip>
                        <Chip
                          mode="flat"
                          compact
                          style={[styles.statusBadge, { backgroundColor: getStatusColor(alert.status) + '20' }]}
                          textStyle={[styles.badgeText, { color: getStatusColor(alert.status) }]}
                        >
                          {alert.status.toUpperCase()}
                        </Chip>
                      </View>
                    </View>

                    <Divider style={styles.divider} />

                    <View style={styles.alertDetails}>
                      <View style={styles.detailRow}>
                        <IconButton icon="calendar-alert" size={16} iconColor={COLORS.error} style={styles.detailIcon} />
                        <Text style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>
                          Expires: {new Date(alert.expiryDate).toLocaleDateString('en-GB')}
                        </Text>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <IconButton 
                          icon={alert.daysRemaining <= 0 ? "alert-circle" : "clock-outline"} 
                          size={16} 
                          iconColor={alert.daysRemaining <= 0 ? COLORS.error : COLORS.warning} 
                          style={styles.detailIcon} 
                        />
                        <Text style={[styles.detailText, { 
                          color: alert.daysRemaining <= 0 ? COLORS.error : theme.colors.onSurfaceVariant,
                          fontWeight: alert.daysRemaining <= 0 ? 'bold' : 'normal'
                        }]}>
                          {alert.daysRemaining <= 0 
                            ? `EXPIRED ${Math.abs(alert.daysRemaining)} days ago`
                            : `${alert.daysRemaining} days remaining`
                          }
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardActions}>
                      <Button
                        mode="outlined"
                        compact
                        onPress={() => router.push(`/(admin)/employees/${alert.employeeId}`)}
                        style={[styles.cardActionButton, { borderColor: COLORS.info }]}
                        labelStyle={{ color: COLORS.info, fontSize: 12 }}
                        icon="eye"
                      >
                        View
                      </Button>
                      <Button
                        mode={selectedEmployees.includes(alert.employeeId) ? "contained" : "outlined"}
                        compact
                        onPress={() => {
                          if (selectedEmployees.includes(alert.employeeId)) {
                            setSelectedEmployees(prev => prev.filter(id => id !== alert.employeeId));
                          } else {
                            setSelectedEmployees(prev => [...prev, alert.employeeId]);
                          }
                        }}
                        style={[styles.cardActionButton, { 
                          backgroundColor: selectedEmployees.includes(alert.employeeId) ? COLORS.primary : 'transparent',
                          borderColor: COLORS.primary
                        }]}
                        labelStyle={{ 
                          color: selectedEmployees.includes(alert.employeeId) ? 'white' : COLORS.primary, 
                          fontSize: 12 
                        }}
                        icon={selectedEmployees.includes(alert.employeeId) ? "check" : "plus"}
                      >
                        {selectedEmployees.includes(alert.employeeId) ? 'Selected' : 'Select'}
                      </Button>
                    </View>
                  </View>
                </LinearGradient>
              </Surface>
            ))
          )}
          
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Email Settings Modal */}
        <Portal>
          <Modal
            visible={showEmailModal}
            onDismiss={() => setShowEmailModal(false)}
            contentContainerStyle={styles.modalContainer}
          >
            <Surface style={styles.modal} elevation={5}>
              <Text variant="headlineSmall" style={styles.modalTitle}>
                Send Visa Expiry Notifications
              </Text>
              
              <Text variant="bodyMedium" style={styles.modalSubtitle}>
                Sending to {selectedEmployees.length} employee(s)
              </Text>

              <TextInput
                label="Custom Email Message (Optional)"
                value={emailMessage}
                onChangeText={setEmailMessage}
                multiline
                numberOfLines={6}
                style={styles.emailInput}
                mode="outlined"
                placeholder="Leave empty to use default template..."
              />

              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setShowEmailModal(false);
                    setEmailMessage('');
                  }}
                  style={styles.modalActionButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSendEmails}
                  loading={sendingEmail}
                  disabled={sendingEmail}
                  style={[styles.modalActionButton, { backgroundColor: COLORS.primary }]}
                  icon="email-send"
                >
                  Send Notifications
                </Button>
              </View>
            </Surface>
          </Modal>
        </Portal>

        <Snackbar
          visible={!!snackbar}
          onDismiss={() => setSnackbar('')}
          duration={4000}
          action={{
            label: 'Dismiss',
            onPress: () => setSnackbar(''),
          }}
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
    backgroundColor: '#FAFAFA',
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
  notificationsList: {
    flex: 1,
    marginTop: 16,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
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
    borderRadius: 20,
  },
  modalTitle: {
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  settingsList: {
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  textInput: {
    flex: 1,
    marginLeft: 16,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    borderRadius: 16,
  },
  heroSection: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  heroGradient: {
    padding: 24,
    borderRadius: 16,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLeft: {
    flex: 1,
  },
  heroTitle: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 4,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroButton: {
    borderRadius: 20,
  },
  quickActionsContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  quickActionsScroll: {
    flexDirection: 'row',
  },
  modernActionButton: {
    marginRight: 12,
    borderRadius: 20,
  },
  buttonContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchSection: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
  },
  modernSearchBar: {
    borderRadius: 12,
    elevation: 0,
    backgroundColor: '#f8fafc',
    marginBottom: 12,
  },
  filterChips: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    borderRadius: 16,
  },
  notificationsContent: {
    paddingHorizontal: 16,
  },
  modernNotificationCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    borderRadius: 16,
  },
  modernPriorityIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  modernNotificationContent: {
    padding: 20,
    paddingLeft: 24,
  },
  modernNotificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  employeeAvatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  employeeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  employeeBasicInfo: {
    marginLeft: 12,
    flex: 1,
  },
  employeeName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  employeeId: {
    fontSize: 12,
    opacity: 0.7,
  },
  notificationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  urgencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  employeeDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailIcon: {
    margin: 0,
    marginRight: 4,
  },
  detailText: {
    fontSize: 14,
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cardActionButton: {
    borderRadius: 20,
  },
  modernEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateCard: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    maxWidth: 300,
  },
  modernButton: {
    borderRadius: 20,
    paddingVertical: 8,
  },
  headerControls: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  bulkActionsBar: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bulkActionsText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  bulkActionButton: {
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  notificationCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  employeeInfo: {
    flex: 1,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  urgencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    marginBottom: 16,
  },
  alertDetails: {
    marginBottom: 16,
  },
  emailInput: {
    marginBottom: 16,
  },
  modalSubtitle: {
    marginBottom: 16,
  },
  modalActionButton: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
}); 

