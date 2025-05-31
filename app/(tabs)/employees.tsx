import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Avatar, Button, Searchbar, FAB, useTheme, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useEmployees } from '../../hooks/useEmployees';
import { CustomTheme } from '../../theme';
import { router } from 'expo-router';
import { Employee } from '../../services/supabase';
import { safeThemeAccess } from '../../utils/errorPrevention';

export default function EmployeesScreen() {
  const theme = useTheme() as CustomTheme;
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { employees, error, fetchEmployees } = useEmployees();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: safeThemeAccess.colors(theme, 'background'),
    },
    header: {
      padding: safeThemeAccess.spacing(theme, 'lg'),
    },
    headerText: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    content: {
      padding: safeThemeAccess.spacing(theme, 'md'),
    },
    searchBar: {
      marginBottom: safeThemeAccess.spacing(theme, 'md'),
    },
    filterContainer: {
      paddingHorizontal: safeThemeAccess.spacing(theme, 'lg'),
    },
    employeeList: {
      flex: 1,
    },
    employeeCard: {
      marginBottom: safeThemeAccess.spacing(theme, 'md'),
    },
    employeeCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: safeThemeAccess.spacing(theme, 'md'),
    },
    employeeContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: safeThemeAccess.spacing(theme, 'md'),
    },
    employeeInfo: {
      flex: 1,
      marginRight: safeThemeAccess.spacing(theme, 'md'),
    },
    employeeName: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    employeeDetails: {
      marginBottom: safeThemeAccess.spacing(theme, 'sm'),
      fontSize: 14,
    },
    statusChip: {
      marginTop: safeThemeAccess.spacing(theme, 'sm'),
    },
    emptyState: {
      marginTop: safeThemeAccess.spacing(theme, 'md'),
      color: safeThemeAccess.colors(theme, 'onSurfaceVariant'),
    },
    emptyStateText: {
      textAlign: 'center',
      fontSize: 16,
      marginTop: safeThemeAccess.spacing(theme, 'md'),
    },
    emptyContainer: {
      padding: safeThemeAccess.spacing(theme, 'md'),
    },
    emptyText: {
      textAlign: 'center',
      fontSize: 16,
      marginTop: safeThemeAccess.spacing(theme, 'md'),
      color: safeThemeAccess.colors(theme, 'onSurfaceVariant'),
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: safeThemeAccess.spacing(theme, 'xl'),
    },
    errorText: {
      textAlign: 'center',
      fontSize: 16,
      marginBottom: safeThemeAccess.spacing(theme, 'md'),
      color: safeThemeAccess.colors(theme, 'error'),
    },
    retryButton: {
      padding: safeThemeAccess.spacing(theme, 'xl'),
    },
    scrollView: {
      flex: 1,
    },
    profileImage: {
      marginRight: safeThemeAccess.spacing(theme, 'md'),
    },
    fab: {
      position: 'absolute',
      margin: safeThemeAccess.spacing(theme, 'md'),
      right: 0,
      bottom: 0,
    },
    loadingContainer: {
      padding: safeThemeAccess.spacing(theme, 'xl'),
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
    employee.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.email_id.toLowerCase().includes(searchQuery.toLowerCase())
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
      <View style={styles.header}>
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
          filteredEmployees.map(employee => (
            <Card key={employee.id} style={styles.employeeCard} onPress={() => handleEmployeePress(employee)}>
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
