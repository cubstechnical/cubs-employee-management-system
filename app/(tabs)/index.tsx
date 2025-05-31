import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Text, Card, Avatar, Badge, useTheme, Button, FAB, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../hooks/useAuth';
import { router } from 'expo-router';
import { 
  FileText, 
  Clock, 
  AlertCircle, 
  CheckCircle2,
  XCircle,
  Users,
  Calendar,
  Plus,
  Building2
} from 'lucide-react-native';
import { Employee } from '../../services/supabase';
import { CustomTheme } from '../../theme';
import { safeThemeAccess } from '../../utils/errorPrevention';

export default function DashboardScreen() {
  const theme = useTheme() as CustomTheme;
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollView: {
      flex: 1,
    },
    statsContainer: {
      flexDirection: 'row',
      padding: 16,
      gap: 16,
    },
    statsCard: {
      flex: 1,
    },
    statsContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statsNumber: {
      fontWeight: 'bold',
    },
    quickLinksContainer: {
      padding: 16,
    },
    sectionTitle: {
      marginBottom: 16,
    },
    quickLinksGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    quickLinkCard: {
      width: '48%',
    },
    quickLinkContent: {
      alignItems: 'center',
      gap: 8,
    },
    quickLinkText: {
      textAlign: 'center',
    },
    fab: {
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 0,
    },
    section: {
      padding: 16,
    },
    quickActions: {
      flexDirection: 'row',
      gap: 16,
    },
    quickActionCard: {
      flex: 1,
    },
    quickActionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const employeesData = await AsyncStorage.getItem('employees');
      
      if (employeesData) {
        const parsedEmployees = JSON.parse(employeesData);
        setEmployees(parsedEmployees);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExpiringVisas = () => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    return employees.filter(emp => {
      const expiryDate = new Date(emp.visa_expiry_date ?? '');
      return expiryDate <= thirtyDaysFromNow && expiryDate >= today;
    }).length;
  };

  const getExpiredVisas = () => {
    const today = new Date();
    return employees.filter(emp => new Date(emp.visa_expiry_date ?? '') < today).length;
  };

  const handleNavigate = (route: string) => {
    if (!route) {
      console.warn('Navigation route is undefined');
      return;
    }
    router.push(route as any);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: safeThemeAccess.colors(theme, 'background') }]}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: safeThemeAccess.colors(theme, 'background') }]}>
      <ScrollView style={styles.scrollView}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card style={styles.statsCard}>
            <Card.Content style={styles.statsContent}>
              <View>
                <Text variant="titleMedium">Total Employees</Text>
                <Text variant="displaySmall" style={styles.statsNumber}>
                  {employees.length}
                </Text>
              </View>
              <Users size={24} color={safeThemeAccess.colors(theme, 'primary')} />
            </Card.Content>
          </Card>

          <Card style={styles.statsCard}>
            <Card.Content style={styles.statsContent}>
              <View>
                <Text variant="titleMedium">Expiring Soon</Text>
                <Text variant="displaySmall" style={styles.statsNumber}>
                  {getExpiringVisas()}
                </Text>
              </View>
              <Calendar size={24} color={safeThemeAccess.colors(theme, 'primary')} />
            </Card.Content>
          </Card>

          <Card style={styles.statsCard}>
            <Card.Content style={styles.statsContent}>
              <View>
                <Text variant="titleMedium">Expired Visas</Text>
                <Text variant="displaySmall" style={styles.statsNumber}>
                  {getExpiredVisas()}
                </Text>
              </View>
              <AlertCircle size={24} color={safeThemeAccess.colors(theme, 'error')} />
            </Card.Content>
          </Card>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <Card style={styles.quickActionCard} onPress={() => router.push('/(admin)/employees/new')}>
              <Card.Content style={styles.quickActionContent}>
                <Users size={24} color={safeThemeAccess.colors(theme, 'primary')} />
                <Text variant="bodyMedium">Add Employee</Text>
              </Card.Content>
            </Card>
            
            <Card style={styles.quickActionCard} onPress={() => router.push('/(tabs)/visa-form')}>
              <Card.Content style={styles.quickActionContent}>
                <Calendar size={24} color={safeThemeAccess.colors(theme, 'primary')} />
                <Text variant="bodyMedium">Add Visa</Text>
              </Card.Content>
            </Card>
            
            <Card style={styles.quickActionCard} onPress={() => router.push('/(tabs)/visa-notifications')}>
              <Card.Content style={styles.quickActionContent}>
                <AlertCircle size={24} color={safeThemeAccess.colors(theme, 'error')} />
                <Text variant="bodyMedium">Notifications</Text>
              </Card.Content>
            </Card>
          </View>
        </View>
      </ScrollView>

      <FAB
        icon={() => <Plus size={24} color={safeThemeAccess.colors(theme, 'primary')} />}
        label="New"
        style={[styles.fab, { backgroundColor: safeThemeAccess.colors(theme, 'primary') }]}
        onPress={() => router.push('/(tabs)/visa-form')}
      />
      
      <FAB
        icon={() => <FileText size={24} color={safeThemeAccess.colors(theme, 'primary')} />}
        style={[styles.fab, { backgroundColor: safeThemeAccess.colors(theme, 'primary') }]}
        onPress={() => router.push('/(employee)/documents')}
      />
    </SafeAreaView>
  );
}
