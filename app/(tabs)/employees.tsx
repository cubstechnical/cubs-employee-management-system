import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, Animated } from 'react-native';
import { Text, Card, Avatar, Button, Searchbar, FAB, useTheme, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useEmployees } from '../../hooks/useEmployees';
import { CustomTheme } from '../../theme';
import { router } from 'expo-router';
import { Employee } from '../../services/supabase';
import { safeThemeAccess } from '../../utils/errorPrevention';
import { 
  AnimatedFadeSlide, 
  AnimatedScaleIn, 
  useStaggerAnimation 
} from '../../components/AnimationProvider';

export default function EmployeesScreen() {
  const theme = useTheme() as CustomTheme;
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { employees, error, fetchEmployees } = useEmployees();

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
    headerSubtitle: {
      fontSize: 14,
      color: '#666666',
    },
    searchContainer: {
      flexDirection: 'row',
      padding: 16,
      backgroundColor: '#ffffff',
      alignItems: 'center',
      gap: 12,
    },
    searchInput: {
      flex: 1,
      backgroundColor: '#f8f9fa',
    },
    filterButton: {
      backgroundColor: '#2563EB',
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
    contentContainer: {
      flex: 1,
      padding: 16,
    },
    employeeCard: {
      backgroundColor: '#ffffff',
      borderRadius: 12,
      marginBottom: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    employeeCardContent: {
      padding: 16,
    },
    employeeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#2563EB',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    avatarText: {
      color: '#ffffff',
      fontSize: 18,
      fontWeight: 'bold',
    },
    employeeInfo: {
      flex: 1,
    },
    employeeName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1a1a1a',
      marginBottom: 4,
    },
    employeeId: {
      fontSize: 14,
      color: '#666666',
    },
    employeeActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionButton: {
      marginLeft: 8,
    },
    employeeDetails: {
      marginBottom: 12,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    detailLabel: {
      fontSize: 13,
      color: '#666666',
      flex: 1,
    },
    detailValue: {
      fontSize: 13,
      color: '#1a1a1a',
      fontWeight: '500',
      flex: 2,
      textAlign: 'right',
    },
    statusChip: {
      alignSelf: 'flex-start',
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
    fab: {
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 0,
      backgroundColor: '#2563EB',
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
    scrollView: {
      flex: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    emptyText: {
      fontSize: 16,
      color: '#666666',
      textAlign: 'center',
    },
    employeeContent: {
      padding: 16,
    },
    profileImage: {
      width: 60,
      height: 60,
      borderRadius: 30,
      marginRight: 12,
    },
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      await fetchEmployees();
    } catch (err) {
      console.error('Error loading employees:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchEmployees();
    } catch (err) {
      console.error('Error refreshing employees:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: Employee['visa_status']) => {
    switch (status) {
      case 'Active':
        return theme.colors.primary;
      case 'Expiring Soon':
        return '#FF8800';
      case 'Expired':
        return theme.colors.error;
      default:
        return theme.colors.primary;
    }
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (employee.employee_id && employee.employee_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (employee.email_id && employee.email_id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleEmployeePress = (employee: Employee) => {
    router.push(`/(admin)/employees/${employee.id}` as any);
  };

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button
            mode="contained"
            onPress={handleRefresh}
            style={styles.retryButton}
          >
            Retry
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={styles.headerContainer}>
        <Text variant="headlineMedium">Employees</Text>
        <Searchbar
          placeholder="Search employees..."
          onChangeText={setSearchQuery}
          value={searchQuery}
        />
      </View>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {filteredEmployees.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No employees found.</Text>
          </View>
        ) : (
          filteredEmployees.map((employee, index) => (
            <AnimatedFadeSlide key={employee.id} delay={index * 50}>
              <Card style={styles.employeeCard} onPress={() => handleEmployeePress(employee)}>
                <Card.Content style={styles.employeeContent}>
                  <View style={styles.employeeInfo}>
                    <Avatar.Text
                      size={48}
                      label={employee.name?.split(' ').map(n => n[0]).join('') || '?'}
                      style={styles.profileImage}
                    />
                    <View style={styles.employeeDetails}>
                      <Text variant="titleMedium" style={styles.employeeName}>{employee.name}</Text>
                      <Text variant="bodySmall" style={{ color: safeThemeAccess.colors(theme, 'onSurfaceVariant') }}>{employee.trade}</Text>
                      <Text variant="bodySmall" style={{ color: safeThemeAccess.colors(theme, 'onSurfaceVariant') }}>{employee.company_name}</Text>
                    </View>
                    <Chip style={styles.statusChip}>{employee.visa_status || 'Active'}</Chip>
                  </View>
                </Card.Content>
              </Card>
            </AnimatedFadeSlide>
          ))
        )}
      </ScrollView>
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/(admin)/employees/add' as any)}
        label="Add Employee"
      />
    </SafeAreaView>
  );
}
