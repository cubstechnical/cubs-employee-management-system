import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Badge, useTheme, List } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, AlertCircle } from 'lucide-react-native';
import { useEmployees } from '../../hooks/useEmployees';
import { Employee } from '../../services/supabase';
import { CustomTheme } from '../../theme';

export default function VisaNotificationsScreen() {
  const theme = useTheme() as CustomTheme;
  const { employees, error } = useEmployees();
  const [expiringEmployees, setExpiringEmployees] = useState<Employee[]>([]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      padding: 16,
    },
    title: {
      fontWeight: 'bold',
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
    },
    card: {
      margin: 16,
      marginTop: 8,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    employeeInfo: {
      flex: 1,
    },
    statusBadge: {
      marginLeft: 16,
    },
    cardDetails: {
      marginTop: 8,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    errorText: {
      color: theme.colors.error,
      textAlign: 'center',
    },
  });

  useEffect(() => {
    // Filter and sort employees with expiring visas
    const expiring = employees
      .filter((emp) => {
        const daysUntilExpiry = getDaysUntilExpiry(emp.visa_expiry_date ?? '');
        return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
      })
      .sort((a, b) => {
        return new Date(a.visa_expiry_date ?? '').getTime() - new Date(b.visa_expiry_date ?? '').getTime();
      });
    setExpiringEmployees(expiring);
  }, [employees]);

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (daysLeft: number) => {
    if (daysLeft <= 7) return '#ef4444'; // Red for urgent
    if (daysLeft <= 14) return '#f59e0b'; // Orange for warning
    return '#10b981'; // Green for normal
  };

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>Visa Notifications</Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            {expiringEmployees.length} visas expiring in the next 30 days
          </Text>
        </View>

        {expiringEmployees.map((employee) => {
          const daysLeft = getDaysUntilExpiry(employee.visa_expiry_date ?? '');
          return (
            <Card key={employee.id} style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={styles.employeeInfo}>
                    <Text variant="titleMedium">{employee.name}</Text>
                  </View>
                  <Badge style={[styles.statusBadge, { backgroundColor: getStatusColor(daysLeft) }]}>
                    {`${daysLeft} days left`}
                  </Badge>
                </View>
                <View style={styles.cardDetails}>
                  <List.Item
                    title="Visa Expiry"
                    description={employee.visa_expiry_date ?? 'N/A'}
                    left={props => <List.Icon {...props} icon={Clock} />}
                  />
                  <List.Item
                    title="Status"
                    description={daysLeft <= 7 ? 'Urgent' : daysLeft <= 14 ? 'Warning' : 'Normal'}
                    left={props => <List.Icon {...props} icon={AlertCircle} />}
                  />
                </View>
              </Card.Content>
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
} 
