import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AdminLayout from '../../../components/AdminLayout';
import { withAuthGuard } from '../../../components/AuthGuard';
import { useEmployees } from '../../../hooks/useEmployees';
import { CustomTheme } from '../../../theme';

function NewEmployeeScreen() {
  const theme = useTheme() as CustomTheme;
  const { addEmployee } = useEmployees();
  
  const [formData, setFormData] = useState({
    name: '',
    employee_id: '',
    email_id: '',
    mobile_number: '',
    company_name: '',
    trade: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.employee_id.trim()) newErrors.employee_id = 'Employee ID is required';
    if (!formData.email_id.trim()) newErrors.email_id = 'Email is required';
    if (!formData.company_name.trim()) newErrors.company_name = 'Company name is required';
    if (!formData.trade.trim()) newErrors.trade = 'Trade is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      await addEmployee(formData);
      Alert.alert('Success', 'Employee added successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error adding employee:', error);
      Alert.alert('Error', 'Failed to add employee. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string) => (text: string) => {
    setFormData(prev => ({ ...prev, [field]: text }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <AdminLayout title="Add New Employee" currentRoute="/(admin)/employees/new">
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.title}>Add New Employee</Text>
              
              <TextInput
                label="Full Name *"
                value={formData.name}
                onChangeText={updateFormData('name')}
                mode="outlined"
                style={styles.input}
                error={!!errors.name}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

              <TextInput
                label="Employee ID *"
                value={formData.employee_id}
                onChangeText={updateFormData('employee_id')}
                mode="outlined"
                style={styles.input}
                error={!!errors.employee_id}
              />
              {errors.employee_id && <Text style={styles.errorText}>{errors.employee_id}</Text>}

              <TextInput
                label="Email Address *"
                value={formData.email_id}
                onChangeText={updateFormData('email_id')}
                mode="outlined"
                style={styles.input}
                error={!!errors.email_id}
                keyboardType="email-address"
              />
              {errors.email_id && <Text style={styles.errorText}>{errors.email_id}</Text>}

              <TextInput
                label="Company Name *"
                value={formData.company_name}
                onChangeText={updateFormData('company_name')}
                mode="outlined"
                style={styles.input}
                error={!!errors.company_name}
              />
              {errors.company_name && <Text style={styles.errorText}>{errors.company_name}</Text>}

              <TextInput
                label="Trade/Position *"
                value={formData.trade}
                onChangeText={updateFormData('trade')}
                mode="outlined"
                style={styles.input}
                error={!!errors.trade}
              />
              {errors.trade && <Text style={styles.errorText}>{errors.trade}</Text>}

              <View style={styles.buttonContainer}>
                <Button
                  mode="outlined"
                  onPress={() => router.back()}
                  style={styles.button}
                  disabled={loading}
                >
                  Cancel
                </Button>
                
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  style={styles.button}
                  loading={loading}
                  disabled={loading}
                >
                  Add Employee
                </Button>
              </View>
            </Card.Content>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#1976D2',
  },
  input: {
    marginBottom: 8,
    backgroundColor: 'white',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginBottom: 16,
    marginLeft: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    gap: 16,
  },
  button: {
    flex: 1,
  },
});

export default withAuthGuard({ WrappedComponent: NewEmployeeScreen, allowedRoles: ['admin'] });
