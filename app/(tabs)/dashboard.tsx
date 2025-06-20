import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Dimensions, Platform, Animated } from 'react-native';
import { 
  Text, 
  Card, 
  FAB, 
  Chip, 
  useTheme,
  ActivityIndicator,
  Portal,
  Snackbar
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Users, 
  AlertCircle, 
  Calendar, 
  Plus,
  FileText,
  Bell,
  AlertTriangle
} from 'lucide-react-native';
import { CustomTheme } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { useEmployees } from '../../hooks/useEmployees';
import { Employee } from '../../services/supabase';
import { router } from 'expo-router';
import { safeThemeAccess } from '../../utils/errorPrevention';
import { 
  AnimatedFadeSlide, 
  AnimatedScaleIn, 
  useStaggerAnimation 
} from '../../components/AnimationProvider';

interface StatCard {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

interface VisaNotification {
  id: string;
  employeeName: string;
  visaType: string;
  expiryDate: string;
  status: 'valid' | 'expiring' | 'expired';
}

export default function DashboardScreen() {
  const theme = useTheme() as CustomTheme;
  const { user } = useAuth();
  const { employees, error } = useEmployees();
  const [loading, setLoading] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'expiring' | 'expired'>('all');

  const stats: StatCard[] = [
    {
      title: 'Total Employees',
      value: employees.length.toString(),
      icon: <Users size={24} color={safeThemeAccess.colors(theme, 'primary')} />,
      color: safeThemeAccess.colors(theme, 'primary'),
    },
    {
      title: 'Expiring Soon',
      value: employees.filter(emp => {
        const expiryDate = new Date(emp.visa_expiry_date ?? '');
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        return expiryDate <= thirtyDaysFromNow && expiryDate >= today;
      }).length.toString(),
      icon: <Calendar size={24} color={safeThemeAccess.colors(theme, 'warning')} />,
      color: safeThemeAccess.colors(theme, 'warning'),
    },
    {
      title: 'Active Visas',
      value: employees.filter(emp => emp.visa_status === 'Active').length.toString(),
      icon: <FileText size={24} color={safeThemeAccess.colors(theme, 'success')} />,
      color: safeThemeAccess.colors(theme, 'success'),
    },
    {
      title: 'Expired Visas',
      value: employees.filter(emp => emp.visa_status === 'Expired').length.toString(),
      icon: <AlertTriangle size={24} color={safeThemeAccess.colors(theme, 'error')} />,
      color: safeThemeAccess.colors(theme, 'error'),
    },
  ];

  // Generate notifications from employee data
  const notifications: VisaNotification[] = employees
    .filter(emp => {
      const expiryDate = new Date(emp.visa_expiry_date ?? '');
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      return expiryDate <= thirtyDaysFromNow; // Show expiring or expired
    })
    .map((emp, index) => {
      const expiryDate = new Date(emp.visa_expiry_date ?? '');
      const today = new Date();
      const isExpired = expiryDate < today;
      
      return {
        id: emp.id || emp.employee_id || `employee-${index}`,
        employeeName: emp.name,
        visaType: 'Employment Visa',
        expiryDate: emp.visa_expiry_date ?? '',
        status: isExpired ? 'expired' as const : 'expiring' as const,
      };
    })
    .slice(0, 10); // Limit to 10 recent notifications

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    return notification.status === activeTab;
  });

  const handleAddVisa = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSnackbarMessage('New visa added successfully');
      setShowSnackbar(true);
    }, 1000);
  };

  const getStatusColor = (status: VisaNotification['status']) => {
    switch (status) {
      case 'valid':
        return safeThemeAccess.colors(theme, 'success');
      case 'expiring':
        return safeThemeAccess.colors(theme, 'warning');
      case 'expired':
        return safeThemeAccess.colors(theme, 'error');
      default:
        return safeThemeAccess.colors(theme, 'primary');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
    },
    header: {
      marginBottom: 24,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#1a1a1a',
      marginBottom: 8,
    },
    headerSubtitle: {
      fontSize: 16,
      color: '#666666',
      lineHeight: 24,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 24,
      gap: 16,
    },
    statCard: {
      backgroundColor: '#ffffff',
      borderRadius: 16,
      padding: 20,
      flex: 1,
      minWidth: 150,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    statNumber: {
      fontSize: 32,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    statLabel: {
      fontSize: 14,
      color: '#666666',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    statTrend: {
      fontSize: 12,
      marginTop: 4,
      fontWeight: '500',
    },
    chartSection: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: '#1a1a1a',
      marginBottom: 16,
    },
    chartCard: {
      backgroundColor: '#ffffff',
      borderRadius: 16,
      padding: 20,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    chartContainer: {
      height: 200,
      justifyContent: 'center',
      alignItems: 'center',
    },
    chartPlaceholder: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f8f9fa',
      borderRadius: 8,
      padding: 40,
    },
    chartPlaceholderText: {
      fontSize: 16,
      color: '#666666',
      textAlign: 'center',
    },
    quickActionsSection: {
      marginBottom: 24,
    },
    quickActionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    quickActionCard: {
      backgroundColor: '#ffffff',
      borderRadius: 12,
      padding: 16,
      flex: 1,
      minWidth: 140,
      alignItems: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    quickActionIcon: {
      marginBottom: 8,
    },
    quickActionText: {
      fontSize: 14,
      fontWeight: '500',
      color: '#1a1a1a',
      textAlign: 'center',
    },
    recentActivitySection: {
      marginBottom: 24,
    },
    activityCard: {
      backgroundColor: '#ffffff',
      borderRadius: 16,
      padding: 20,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    activityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    activityIcon: {
      marginRight: 12,
    },
    activityContent: {
      flex: 1,
    },
    activityTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: '#1a1a1a',
      marginBottom: 2,
    },
    activityTime: {
      fontSize: 12,
      color: '#666666',
    },
    alertsSection: {
      marginBottom: 24,
    },
    alertCard: {
      backgroundColor: '#ffffff',
      borderRadius: 16,
      padding: 20,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    alertItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    alertIcon: {
      marginRight: 12,
    },
    alertContent: {
      flex: 1,
    },
    alertTitle: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 2,
    },
    alertDescription: {
      fontSize: 12,
      color: '#666666',
    },
    alertAction: {
      marginLeft: 8,
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
    statContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    tabs: {
      flexDirection: 'row',
      backgroundColor: '#ffffff',
      borderRadius: 12,
      padding: 4,
      marginBottom: 16,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    notificationCard: {
      marginBottom: 12,
      borderRadius: 12,
    },
    notificationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    employeeName: {
      fontSize: 16,
      fontWeight: '600',
    },
    statusChip: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    visaType: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 4,
    },
    expiryDate: {
      fontSize: 12,
      opacity: 0.7,
    },
    fab: {
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 16,
      zIndex: 7000,
      elevation: 8,
    },
    snackbar: {
      backgroundColor: '#2563EB',
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: safeThemeAccess.colors(theme, 'onSurface') }]}>
            Visa Management
          </Text>
          <Text style={[styles.headerSubtitle, { color: safeThemeAccess.colors(theme, 'onSurface') }]}>
            Manage your visas efficiently
          </Text>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.statsGrid}
        >
          {stats.map((stat, index) => (
            <AnimatedScaleIn key={index} delay={index * 100}>
              <Card style={[styles.statCard, { backgroundColor: safeThemeAccess.colors(theme, 'surface') }]}>
                <Card.Content style={styles.statContent}>
                  {stat.icon}
                  <Text style={[styles.statNumber, { color: stat.color }]}>
                    {stat.value}
                  </Text>
                  <Text style={[styles.statLabel, { color: safeThemeAccess.colors(theme, 'onSurface') }]}>
                    {stat.title}
                  </Text>
                </Card.Content>
              </Card>
            </AnimatedScaleIn>
          ))}
        </ScrollView>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: safeThemeAccess.colors(theme, 'onSurface') }]}>
            Visa Notifications
          </Text>
          <View style={styles.tabs}>
            <Chip
              selected={activeTab === 'all'}
              onPress={() => setActiveTab('all')}
              style={styles.tab}
            >
              All
            </Chip>
            <Chip
              selected={activeTab === 'expiring'}
              onPress={() => setActiveTab('expiring')}
              style={styles.tab}
            >
              Expiring
            </Chip>
            <Chip
              selected={activeTab === 'expired'}
              onPress={() => setActiveTab('expired')}
              style={styles.tab}
            >
              Expired
            </Chip>
          </View>

          {filteredNotifications.map((notification, index) => (
            <AnimatedFadeSlide key={notification.id} delay={index * 50}>
              <Card 
                style={[styles.notificationCard, { backgroundColor: safeThemeAccess.colors(theme, 'surface') }]}
              >
                <Card.Content>
                  <View style={styles.notificationHeader}>
                    <Text style={[styles.employeeName, { color: safeThemeAccess.colors(theme, 'onSurface') }]}>
                      {notification.employeeName}
                    </Text>
                    <Chip
                      style={[styles.statusChip, { backgroundColor: getStatusColor(notification.status) }]}
                      textStyle={{ color: '#fff' }}
                    >
                      {notification.status}
                    </Chip>
                  </View>
                  <Text style={[styles.visaType, { color: safeThemeAccess.colors(theme, 'secondary') }]}>
                    {notification.visaType}
                  </Text>
                  <Text style={[styles.expiryDate, { color: safeThemeAccess.colors(theme, 'secondary') }]}>
                    Expires: {notification.expiryDate}
                  </Text>
                </Card.Content>
              </Card>
            </AnimatedFadeSlide>
          ))}
        </View>
      </ScrollView>

      <FAB
        icon={Plus}
        label="Add Visa"
        style={[styles.fab, { backgroundColor: safeThemeAccess.colors(theme, 'primary') }]}
        onPress={handleAddVisa}
      />

      <Portal>
        <Snackbar
          visible={showSnackbar}
          onDismiss={() => setShowSnackbar(false)}
          duration={3000}
          style={styles.snackbar}
        >
          {snackbarMessage}
        </Snackbar>
      </Portal>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={safeThemeAccess.colors(theme, 'primary')} />
        </View>
      )}
    </SafeAreaView>
  );
} 
