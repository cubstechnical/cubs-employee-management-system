import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Dimensions, Platform } from 'react-native';
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
    .map(emp => {
      const expiryDate = new Date(emp.visa_expiry_date ?? '');
      const today = new Date();
      const isExpired = expiryDate < today;
      
      return {
        id: emp.id,
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
      backgroundColor: safeThemeAccess.colors(theme, 'background'),
    },
    scrollView: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 24,
      backgroundColor: safeThemeAccess.colors(theme, 'surface'),
      ...Platform.select({
        ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
        },
        android: {
      elevation: 5,
        },
        web: {
          boxShadow: '0px 2px 4px rgba(0,0,0,0.2)',
        }
      })
    },
    headerText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: safeThemeAccess.colors(theme, 'onSurface'),
    },
    statsContainer: {
      marginBottom: 24,
    },
    statsContent: {
      paddingHorizontal: 24,
      gap: safeThemeAccess.spacing(theme, 'md'),
    },
    statCard: {
      width: 160,
      marginRight: safeThemeAccess.spacing(theme, 'md'),
    },
    statContent: {
      alignItems: 'center',
      gap: safeThemeAccess.spacing(theme, 'sm'),
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: safeThemeAccess.colors(theme, 'onSurface'),
    },
    statTitle: {
      fontSize: 12,
      color: safeThemeAccess.colors(theme, 'onSurfaceVariant'),
      textAlign: 'center',
    },
    section: {
      padding: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: safeThemeAccess.spacing(theme, 'md'),
      color: safeThemeAccess.colors(theme, 'onSurface'),
    },
    tabs: {
      flexDirection: 'row',
      gap: safeThemeAccess.spacing(theme, 'sm'),
      marginBottom: safeThemeAccess.spacing(theme, 'md'),
    },
    tab: {
      marginRight: safeThemeAccess.spacing(theme, 'sm'),
    },
    notificationCard: {
      marginBottom: safeThemeAccess.spacing(theme, 'md'),
    },
    notificationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: safeThemeAccess.spacing(theme, 'xs'),
    },
    employeeName: {
      fontSize: 14,
      fontWeight: '600',
      color: safeThemeAccess.colors(theme, 'onSurface'),
    },
    statusChip: {
      height: 24,
      borderRadius: safeThemeAccess.borderRadius(theme, 'large'),
    },
    statusChipText: {
      fontSize: 12,
      fontWeight: '500',
    },
    visaType: {
      fontSize: 12,
      color: safeThemeAccess.colors(theme, 'onSurfaceVariant'),
      marginBottom: safeThemeAccess.spacing(theme, 'xs'),
    },
    expiryDate: {
      fontSize: 12,
      color: safeThemeAccess.colors(theme, 'onSurfaceVariant'),
    },
    fab: {
      position: 'absolute',
      right: 24,
      bottom: 24,
    },
    snackbar: {
      margin: 24,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.headerText, { color: safeThemeAccess.colors(theme, 'onSurface') }]}>
            Visa Management
          </Text>
          <Bell size={24} color={safeThemeAccess.colors(theme, 'primary')} />
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.statsContainer}
          contentContainerStyle={styles.statsContent}
        >
          {stats.map((stat, index) => (
            <Card key={index} style={[styles.statCard, { backgroundColor: safeThemeAccess.colors(theme, 'surface') }]}>
              <Card.Content style={styles.statContent}>
                {stat.icon}
                <Text style={[styles.statValue, { color: stat.color }]}>
                  {stat.value}
                </Text>
                <Text style={[styles.statTitle, { color: safeThemeAccess.colors(theme, 'onSurface') }]}>
                  {stat.title}
                </Text>
              </Card.Content>
            </Card>
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

          {filteredNotifications.map((notification) => (
            <Card 
              key={notification.id} 
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
