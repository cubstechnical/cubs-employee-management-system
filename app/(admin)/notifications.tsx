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
  Checkbox
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import AdminLayout from '../../components/AdminLayout';
import { CustomTheme } from '../../theme';
import { useEmployees } from '../../hooks/useEmployees';
import { Employee } from '../../services/supabase';
import { sendVisaExpiryNotification, sendEmailUsingSendGrid } from '../../services/sendgrid';

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
    } catch (error) {
      console.error('Error refreshing:', error);
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
      Alert.alert('No Selection', 'Please select at least one employee to send emails to.');
      return;
    }

    setSendingEmail(true);
    try {
      const selectedEmployeeData = filteredEmployees.filter(emp => 
        selectedEmployees.includes(emp.id)
      );

      // Prepare email data
      const emailData = selectedEmployeeData.map(emp => ({
        employeeName: emp.name,
        employeeId: emp.employee_id,
        expiryDate: emp.visa_expiry_date!,
        daysRemaining: getDaysUntilExpiry(emp.visa_expiry_date!),
        companyName: emp.company_name || 'CUBS Technical',
        email: emp.email_id
      }));

      // Send to admin emails
      await sendVisaExpiryNotification(
        autoEmailSettings.recipientEmails,
        emailData
      );

      // Send individual emails to employees if enabled
      if (autoEmailSettings.includeEmployeeEmail) {
        for (const emp of selectedEmployeeData) {
          if (emp.email_id) {
            await sendEmailUsingSendGrid({
              to: [emp.email_id],
              subject: `URGENT: Your Visa Expires in ${getDaysUntilExpiry(emp.visa_expiry_date!)} Days`,
              htmlContent: generateEmployeeEmailHTML(emp),
              textContent: generateEmployeeEmailText(emp)
            });
          }
        }
      }

      Alert.alert(
        'Success', 
        `Visa expiry notifications sent successfully to ${selectedEmployees.length} employee(s) and admin team.`
      );
      setSelectedEmployees([]);
      
    } catch (error) {
      console.error('Error sending emails:', error);
      Alert.alert('Error', 'Failed to send some emails. Please try again.');
    } finally {
      setSendingEmail(false);
    }
  };

  const generateEmployeeEmailHTML = (employee: Employee) => {
    const daysLeft = getDaysUntilExpiry(employee.visa_expiry_date!);
    const urgencyColor = getUrgencyColor(daysLeft);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Visa Expiry Reminder</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: ${urgencyColor}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">VISA EXPIRY REMINDER</h1>
            <p style="margin: 10px 0 0 0;">CUBS Technical Contracting</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #ddd;">
            <p><strong>Dear ${employee.name},</strong></p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${urgencyColor};">
              <h3 style="color: ${urgencyColor}; margin-top: 0;">⚠️ Your visa expires in ${daysLeft} days</h3>
              <p><strong>Expiry Date:</strong> ${new Date(employee.visa_expiry_date!).toLocaleDateString()}</p>
              <p><strong>Employee ID:</strong> ${employee.employee_id}</p>
              <p><strong>Company:</strong> ${employee.company_name || 'CUBS Technical'}</p>
            </div>
            
            <h3>Action Required:</h3>
            <ul>
              <li>Contact HR immediately to start the renewal process</li>
              <li>Prepare all required documents</li>
              <li>Schedule appointment with immigration authorities</li>
              <li>Inform your manager about the renewal process</li>
            </ul>
            
            <p><strong>Contact Information:</strong><br>
            HR Department: hr@cubs-technical.com<br>
            Phone: +971-XXX-XXXX</p>
            
            <p>Best regards,<br>
            CUBS Technical Contracting<br>
            Human Resources Department</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const generateEmployeeEmailText = (employee: Employee) => {
    const daysLeft = getDaysUntilExpiry(employee.visa_expiry_date!);
    
    return `
VISA EXPIRY REMINDER - CUBS Technical Contracting

Dear ${employee.name},

⚠️ Your visa expires in ${daysLeft} days

Expiry Date: ${new Date(employee.visa_expiry_date!).toLocaleDateString()}
Employee ID: ${employee.employee_id}
Company: ${employee.company_name || 'CUBS Technical'}

Action Required:
- Contact HR immediately to start the renewal process
- Prepare all required documents
- Schedule appointment with immigration authorities
- Inform your manager about the renewal process

Contact Information:
HR Department: hr@cubs-technical.com
Phone: +971-XXX-XXXX

Best regards,
CUBS Technical Contracting
Human Resources Department
    `.trim();
  };

  const handleAutoSendEmails = async () => {
    setLoading(true);
    try {
      // Auto-send emails based on settings
    const now = new Date();
      
      for (const days of autoEmailSettings.daysBeforeExpiry) {
        const targetDate = new Date();
        targetDate.setDate(now.getDate() + days);
        
        const employeesToNotify = employees?.filter(emp => {
          if (!emp.visa_expiry_date) return false;
          const expiryDate = new Date(emp.visa_expiry_date);
          const diffInDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return diffInDays === days;
        }) || [];

        if (employeesToNotify.length > 0) {
          const emailData = employeesToNotify.map(emp => ({
            employeeName: emp.name,
            employeeId: emp.employee_id,
            expiryDate: emp.visa_expiry_date!,
            daysRemaining: days,
            companyName: emp.company_name || 'CUBS Technical'
          }));

          await sendVisaExpiryNotification(autoEmailSettings.recipientEmails, emailData);
        }
      }

      Alert.alert('Success', 'Automatic visa expiry notifications processed successfully.');
    } catch (error) {
      console.error('Error in auto-send:', error);
      Alert.alert('Error', 'Failed to process automatic notifications.');
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AdminLayout title="📧 Notifications Center" currentRoute="/admin/notifications">
      <Animated.View style={[styles.container, { opacity: fadeAnimation }]}>
        
        {/* Enhanced Hero Section */}
        <Surface style={[styles.heroSection, { backgroundColor: COLORS.primary }]} elevation={4}>
        <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <View style={styles.heroContent}>
              <View style={styles.heroLeft}>
                <Text variant="headlineLarge" style={styles.heroTitle}>
                  📧 Notification Center
              </Text>
                <Text variant="bodyLarge" style={styles.heroSubtitle}>
                  Manage employee notifications and communication settings
              </Text>
                <View style={styles.heroStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{filteredEmployees.length}</Text>
                    <Text style={styles.statLabel}>Pending Alerts</Text>
            </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{selectedEmployees.length}</Text>
                    <Text style={styles.statLabel}>Selected</Text>
                  </View>
                </View>
              </View>
              <View style={styles.heroActions}>
                <IconButton
                  icon="cog"
                  size={28}
                  iconColor="white"
                  style={[styles.heroButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                  onPress={() => setShowEmailSettings(true)}
                />
                <IconButton
                  icon="refresh"
                  size={28}
                  iconColor="white"
                  style={[styles.heroButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                  onPress={handleRefresh}
                />
            </View>
          </View>
        </LinearGradient>
        </Surface>

        {/* Enhanced Quick Actions */}
        <Surface style={styles.quickActionsContainer} elevation={2}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            ⚡ Quick Actions
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActionsScroll}>
            <Button
              mode="contained"
              onPress={handleAutoSendEmails}
              loading={loading}
              style={[styles.modernActionButton, { backgroundColor: COLORS.warning }]}
              labelStyle={{ color: 'white', fontWeight: '600' }}
              icon="email-send"
              contentStyle={styles.buttonContent}
            >
              Send Visa Alerts
            </Button>
            <Button
              mode="contained"
              onPress={handleSelectAll}
              style={[styles.modernActionButton, { backgroundColor: COLORS.info }]}
              labelStyle={{ color: 'white', fontWeight: '600' }}
              icon="check-all"
              contentStyle={styles.buttonContent}
            >
              {selectedEmployees.length === filteredEmployees.length ? 'Deselect All' : 'Select All'}
            </Button>
            <Button
              mode="contained"
              onPress={() => setShowEmailSettings(true)}
              style={[styles.modernActionButton, { backgroundColor: COLORS.purple }]}
              labelStyle={{ color: 'white', fontWeight: '600' }}
              icon="cog"
              contentStyle={styles.buttonContent}
            >
              Settings
            </Button>
            <Button
              mode="outlined"
              onPress={() => setShowEmailModal(true)}
              style={[styles.modernActionButton, { borderColor: COLORS.primary, borderWidth: 2 }]}
              labelStyle={{ color: COLORS.primary, fontWeight: '600' }}
              icon="email-edit"
              contentStyle={styles.buttonContent}
            >
              Compose
            </Button>
          </ScrollView>
        </Surface>

        {/* Enhanced Search Section */}
        <Surface style={styles.searchSection} elevation={1}>
          <Searchbar
            placeholder="Search employees by name, ID, or company..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.modernSearchBar}
            iconColor={COLORS.primary}
            placeholderTextColor={COLORS.gray}
            inputStyle={{ color: theme.colors.onSurface }}
          />
          <View style={styles.filterChips}>
            <Chip
              icon="account-alert"
              selected={true}
              style={[styles.filterChip, { backgroundColor: COLORS.error + '20' }]}
              textStyle={{ color: COLORS.error, fontWeight: 'bold' }}
            >
              Visa Expiring ({filteredEmployees.length})
            </Chip>
          </View>
        </Surface>

        {/* Enhanced Notifications List */}
        <ScrollView 
          style={styles.notificationsList}
          contentContainerStyle={styles.notificationsContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          {filteredEmployees.length > 0 ? (
            filteredEmployees.map((employee, index) => (
              <Surface key={employee.id} style={styles.modernNotificationCard} elevation={2}>
                <LinearGradient
                  colors={[COLORS.cardBg, COLORS.accent]}
                  style={styles.cardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {/* Priority Indicator */}
                  <View style={[styles.modernPriorityIndicator, { backgroundColor: getUrgencyColor(getDaysUntilExpiry(employee.visa_expiry_date!)) }]} />
                
                  <View style={styles.modernNotificationContent}>
                    {/* Header with Avatar and Actions */}
                    <View style={styles.modernNotificationHeader}>
                      <View style={styles.employeeAvatarContainer}>
                        <Surface style={[styles.employeeAvatar, { backgroundColor: COLORS.primary + '20' }]} elevation={1}>
                          <Text style={[styles.avatarText, { color: COLORS.primary }]}>
                            {employee.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </Text>
                        </Surface>
                        <View style={styles.employeeBasicInfo}>
                          <Text variant="titleMedium" style={[styles.employeeName, { color: theme.colors.onSurface }]}>
                            {employee.name}
                          </Text>
                          <Text variant="bodySmall" style={[styles.employeeId, { color: COLORS.gray }]}>
                            ID: {employee.employee_id}
                      </Text>
                        </View>
                    </View>
                    
                    <View style={styles.notificationActions}>
                        <Surface style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(getDaysUntilExpiry(employee.visa_expiry_date!)) + '20' }]} elevation={1}>
                          <Text style={[styles.urgencyText, { color: getUrgencyColor(getDaysUntilExpiry(employee.visa_expiry_date!)) }]}>
                            {getDaysUntilExpiry(employee.visa_expiry_date!)} days
                          </Text>
                        </Surface>
                        
                        <Checkbox
                          status={selectedEmployees.includes(employee.id) ? 'checked' : 'unchecked'}
                          onPress={() => handleSelectEmployee(employee.id)}
                          color={COLORS.primary}
                      />
                    </View>
                  </View>
                  
                    {/* Employee Details */}
                    <View style={styles.employeeDetails}>
                      <View style={styles.detailRow}>
                        <IconButton icon="domain" size={16} iconColor={COLORS.info} style={styles.detailIcon} />
                        <Text style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>
                          {employee.company_name || 'CUBS Technical'}
                  </Text>
                      </View>
                  
                      <View style={styles.detailRow}>
                        <IconButton icon="calendar-alert" size={16} iconColor={COLORS.error} style={styles.detailIcon} />
                        <Text style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>
                          Expires: {new Date(employee.visa_expiry_date!).toLocaleDateString('en-GB')}
                        </Text>
                      </View>
                      
                      {employee.email_id && (
                        <View style={styles.detailRow}>
                          <IconButton icon="email" size={16} iconColor={COLORS.success} style={styles.detailIcon} />
                          <Text style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>
                            {employee.email_id}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.cardActions}>
                        <Button
                        mode="outlined"
                          compact
                        onPress={() => router.push(`/(admin)/employees/${employee.id}`)}
                        style={[styles.cardActionButton, { borderColor: COLORS.info }]}
                        labelStyle={{ color: COLORS.info, fontSize: 12 }}
                        icon="eye"
                        >
                        View
                        </Button>
                        <Button
                        mode="contained"
                          compact
                        onPress={() => {
                          setSelectedEmployees([employee.id]);
                          handleSendEmails();
                        }}
                        style={[styles.cardActionButton, { backgroundColor: COLORS.warning }]}
                        labelStyle={{ color: 'white', fontSize: 12 }}
                        icon="email-send"
                      >
                        Send Alert
                        </Button>
                    </View>
                  </View>
                </LinearGradient>
              </Surface>
            ))
          ) : (
            <View style={styles.modernEmptyState}>
              <Surface style={[styles.emptyStateCard, { backgroundColor: COLORS.accent }]} elevation={1}>
                <IconButton icon="bell-check" size={64} iconColor={COLORS.success} />
                <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, marginTop: 16, textAlign: 'center' }}>
                  🎉 All Clear!
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>
                  {searchQuery ? 'No employees match your search criteria' : 'No pending visa notifications at this time'}
              </Text>
                {!searchQuery && (
                  <Button 
                    mode="contained" 
                    onPress={handleRefresh}
                    style={[styles.modernButton, { marginTop: 24, backgroundColor: COLORS.primary }]}
                    labelStyle={{ color: 'white', fontWeight: '600' }}
                    icon="refresh"
                  >
                    Refresh Data
                  </Button>
                )}
              </Surface>
            </View>
          )}
          
          {/* Bottom spacing for FAB */}
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
                📧 Email Notification Settings
              </Text>
              
              <View style={styles.settingsList}>
                <View style={styles.settingItem}>
                  <View>
                    <Text variant="titleMedium">Automatic Emails</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Send emails automatically based on visa expiry
                    </Text>
                  </View>
                  <Switch
                    value={autoEmailSettings.enabled}
                    onValueChange={(value) => setAutoEmailSettings({...autoEmailSettings, enabled: value})}
                    thumbColor={COLORS.primary}
                  />
                </View>
                
                <Divider />
                
                <View style={styles.settingItem}>
                  <View>
                    <Text variant="titleMedium">Days Before Expiry</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Select days before visa expiry to send notifications
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    {[30, 15, 7, 1].map(day => (
                      <Chip
                        key={day}
                        selected={autoEmailSettings.daysBeforeExpiry.includes(day)}
                        onPress={() => {
                          const newDays = autoEmailSettings.daysBeforeExpiry.includes(day)
                            ? autoEmailSettings.daysBeforeExpiry.filter(d => d !== day)
                            : [...autoEmailSettings.daysBeforeExpiry, day];
                          setAutoEmailSettings({
                            ...autoEmailSettings,
                            daysBeforeExpiry: newDays
                          });
                        }}
                        style={{
                          backgroundColor: autoEmailSettings.daysBeforeExpiry.includes(day) 
                            ? COLORS.primary + '20' 
                            : 'transparent'
                        }}
                        textStyle={{
                          color: autoEmailSettings.daysBeforeExpiry.includes(day) 
                            ? COLORS.primary 
                            : theme.colors.onSurface
                        }}
                      >
                        {day} days
                      </Chip>
                    ))}
                  </View>
                </View>
                
                <Divider />
                
                <View style={styles.settingItem}>
                  <View>
                    <Text variant="titleMedium">Recipient Emails</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Enter email addresses to send notifications to
                    </Text>
                  </View>
                  <TextInput
                    value={autoEmailSettings.recipientEmails.join(', ')}
                    onChangeText={(value) => setAutoEmailSettings({
                      ...autoEmailSettings,
                      recipientEmails: value.split(',').map(email => email.trim())
                    })}
                    mode="outlined"
                    style={styles.textInput}
                  />
                </View>
                
                <Divider />
                
                <View style={styles.settingItem}>
                  <View>
                    <Text variant="titleMedium">Include Employee Email</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Send individual emails to employees
                    </Text>
                  </View>
                  <Switch
                    value={autoEmailSettings.includeEmployeeEmail}
                    onValueChange={(value) => setAutoEmailSettings({...autoEmailSettings, includeEmployeeEmail: value})}
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

        {/* Send Email Button */}
        {selectedEmployees.length > 0 && (
          <FAB
            icon="email-send"
            style={[styles.fab, { backgroundColor: COLORS.primary }]}
            onPress={handleSendEmails}
            loading={sendingEmail}
            label={`Send to ${selectedEmployees.length}`}
            color="white"
          />
        )}
      </Animated.View>
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
}); 

