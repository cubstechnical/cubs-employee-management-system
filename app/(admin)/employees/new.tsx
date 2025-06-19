import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Alert } from 'react-native';
import {
  Text,
  Card,
  Button,
  useTheme,
  TextInput,
  Surface,
  Chip,
  Divider,
  SegmentedButtons,
  Snackbar,
  Menu,
  ActivityIndicator,
} from 'react-native-paper';
import { router } from 'expo-router';
import { Formik } from 'formik';
import * as Yup from 'yup';
import DateInput from '../../../components/DateInput';
import { useEmployees } from '../../../hooks/useEmployees';
import AdminLayout from '../../../components/AdminLayout';
import { CustomTheme } from '../../../theme';
import { DESIGN_SYSTEM } from '../../../theme/designSystem';

const { width } = Dimensions.get('window');
const isMobile = width <= 768;

// Company options from database
const COMPANY_OPTIONS = [
  'CUBS TECH CONTRACTING',
  'GOLDENCUBS GENERAL CONTRACTING LLC',
  'AL ASHBAL ELECTROMECHANICAL CONTRACTING LLC',
  'FLUID ENGINEERING SERVICES LLC',
  'ASHBAL AL KHALEEJ CONCRETE CARPENTER CONT',
  'RUKIN AL ASHBAL SANITARY CONT',
  'AL HANA TOURS',
  'CUBS CONTRACTING AND SERVICES W.L.L',
  'AL MACEN TRADING & CONTRACTING W.L.L.',
  'Temporary Worker'
];

// Common trades
const TRADE_OPTIONS = [
  'Electrician',
  'Plumber', 
  'Carpenter',
  'Mason',
  'Painter',
  'Welder',
  'Supervisor',
  'Engineer',
  'Technician',
  'Driver',
  'Labor',
  'Other'
];

// Validation schema
const validationSchema = Yup.object().shape({
  name: Yup.string().required('Full name is required').min(2, 'Name too short'),
  employee_id: Yup.string().required('Employee ID is required'),
  trade: Yup.string().required('Trade is required'),
  nationality: Yup.string().required('Nationality is required'),
  date_of_birth: Yup.string().required('Date of birth is required'),
  mobile_number: Yup.string().required('Mobile number is required'),
  email_id: Yup.string().email('Invalid email').required('Email is required'),
  company_name: Yup.string().required('Company is required'),
  join_date: Yup.string().required('Join date is required'),
  visa_expiry_date: Yup.string().nullable(),
  passport_number: Yup.string().nullable(),
  home_phone_number: Yup.string().nullable(),
});

export default function AddEmployeeScreen() {
  const theme = useTheme() as CustomTheme;
  const { addEmployee, isLoading } = useEmployees();
  
  const [snackbar, setSnackbar] = useState('');
  const [companyMenuVisible, setCompanyMenuVisible] = useState(false);
  const [tradeMenuVisible, setTradeMenuVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate unique employee ID
  const generateEmployeeId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `EMP${timestamp.toString().slice(-8)}${random.toString().padStart(3, '0')}`;
  };

  const initialValues = {
    name: '',
    employee_id: generateEmployeeId(),
    trade: '',
    nationality: '',
    date_of_birth: '',
    mobile_number: '',
    home_phone_number: '',
    email_id: '',
    company_name: '',
    join_date: '',
    visa_expiry_date: '',
    passport_number: '',
    is_active: true,
  };

  // Convert DD-MM-YYYY to YYYY-MM-DD for database
  const formatDateForDB = (ddmmyyyy: string): string => {
    if (!ddmmyyyy) return '';
    const parts = ddmmyyyy.split('-');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return ddmmyyyy;
  };

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      // Prepare data for submission
      const employeeData = {
        ...values,
        date_of_birth: formatDateForDB(values.date_of_birth),
        join_date: formatDateForDB(values.join_date),
        visa_expiry_date: values.visa_expiry_date ? formatDateForDB(values.visa_expiry_date) : null,
        passport_number: values.passport_number || null,
        home_phone_number: values.home_phone_number || null,
      };

      console.log('🚀 Submitting employee data:', employeeData);

      await addEmployee(employeeData);
      
      setSnackbar('Employee added successfully!');
      
      // Navigate back after short delay
      setTimeout(() => {
        router.back();
      }, 1500);
      
    } catch (error) {
      console.error('❌ Error adding employee:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add employee';
      setSnackbar(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderForm = (formikProps: any) => {
    const { values, errors, touched, setFieldValue, handleChange, handleSubmit } = formikProps;

    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Surface style={[styles.formCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
            Add New Employee
          </Text>
          <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Fill in all required information to create a new employee record
          </Text>

          <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

          {/* Personal Information Section */}
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Personal Information
          </Text>

          <TextInput
            label="Full Name *"
            value={values.name}
            onChangeText={handleChange('name')}
            error={touched.name && !!errors.name}
            style={styles.input}
            mode="outlined"
            left={<TextInput.Icon icon="account" />}
          />
          {touched.name && errors.name && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.name}</Text>
          )}

          <TextInput
            label="Employee ID *"
            value={values.employee_id}
            onChangeText={handleChange('employee_id')}
            error={touched.employee_id && !!errors.employee_id}
            style={styles.input}
            mode="outlined"
            left={<TextInput.Icon icon="badge-account" />}
          />
          {touched.employee_id && errors.employee_id && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.employee_id}</Text>
          )}

          <TextInput
            label="Nationality *"
            value={values.nationality}
            onChangeText={handleChange('nationality')}
            error={touched.nationality && !!errors.nationality}
            style={styles.input}
            mode="outlined"
            left={<TextInput.Icon icon="flag" />}
          />
          {touched.nationality && errors.nationality && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.nationality}</Text>
          )}

          {/* Trade Dropdown */}
          <Text variant="bodyMedium" style={[styles.fieldLabel, { color: theme.colors.onSurfaceVariant }]}>
            Trade/Position *
          </Text>
          <Menu
            visible={tradeMenuVisible}
            onDismiss={() => setTradeMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setTradeMenuVisible(true)}
                style={[styles.dropdownButton, { borderColor: theme.colors.outline }]}
                contentStyle={styles.dropdownContent}
                icon="hammer-wrench"
                labelStyle={{ color: theme.colors.onSurface }}
              >
                {values.trade || 'Select Trade'}
              </Button>
            }
          >
            {TRADE_OPTIONS.map((trade) => (
              <Menu.Item
                key={trade}
                onPress={() => {
                  setFieldValue('trade', trade);
                  setTradeMenuVisible(false);
                }}
                title={trade}
                leadingIcon={values.trade === trade ? 'check' : undefined}
              />
            ))}
          </Menu>
          {touched.trade && errors.trade && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.trade}</Text>
          )}

          <Divider style={[styles.sectionDivider, { backgroundColor: theme.colors.outline }]} />

          {/* Contact Information Section */}
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Contact Information
          </Text>

          <TextInput
            label="Email Address *"
            value={values.email_id}
            onChangeText={handleChange('email_id')}
            error={touched.email_id && !!errors.email_id}
            style={styles.input}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon="email" />}
          />
          {touched.email_id && errors.email_id && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.email_id}</Text>
          )}

          <TextInput
            label="Mobile Number *"
            value={values.mobile_number}
            onChangeText={handleChange('mobile_number')}
            error={touched.mobile_number && !!errors.mobile_number}
            style={styles.input}
            mode="outlined"
            keyboardType="phone-pad"
            left={<TextInput.Icon icon="phone" />}
          />
          {touched.mobile_number && errors.mobile_number && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.mobile_number}</Text>
          )}

          <TextInput
            label="Home Phone Number"
            value={values.home_phone_number}
            onChangeText={handleChange('home_phone_number')}
            style={styles.input}
            mode="outlined"
            keyboardType="phone-pad"
            left={<TextInput.Icon icon="phone-classic" />}
          />

          <TextInput
            label="Passport Number"
            value={values.passport_number}
            onChangeText={handleChange('passport_number')}
            style={styles.input}
            mode="outlined"
            left={<TextInput.Icon icon="passport" />}
          />

          <Divider style={[styles.sectionDivider, { backgroundColor: theme.colors.outline }]} />

          {/* Employment Information Section */}
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Employment Information
          </Text>

          {/* Company Dropdown */}
          <Text variant="bodyMedium" style={[styles.fieldLabel, { color: theme.colors.onSurfaceVariant }]}>
            Company *
          </Text>
          <Menu
            visible={companyMenuVisible}
            onDismiss={() => setCompanyMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setCompanyMenuVisible(true)}
                style={[styles.dropdownButton, { borderColor: theme.colors.outline }]}
                contentStyle={styles.dropdownContent}
                icon="domain"
                labelStyle={{ color: theme.colors.onSurface }}
              >
                {values.company_name || 'Select Company'}
              </Button>
            }
          >
            {COMPANY_OPTIONS.map((company) => (
              <Menu.Item
                key={company}
                onPress={() => {
                  setFieldValue('company_name', company);
                  setCompanyMenuVisible(false);
                }}
                title={company}
                leadingIcon={values.company_name === company ? 'check' : undefined}
              />
            ))}
          </Menu>
          {touched.company_name && errors.company_name && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.company_name}</Text>
          )}

          <Divider style={[styles.sectionDivider, { backgroundColor: theme.colors.outline }]} />

          {/* Date Information Section */}
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Date Information
          </Text>

          <DateInput
            label="Date of Birth *"
            value={values.date_of_birth}
            onDateChange={(dateString) => setFieldValue('date_of_birth', dateString)}
            required={true}
            error={touched.date_of_birth && !!errors.date_of_birth}
            helperText={touched.date_of_birth && errors.date_of_birth ? errors.date_of_birth : 'Format: DD-MM-YYYY'}
          />

          <DateInput
            label="Joining Date *"
            value={values.join_date}
            onDateChange={(dateString) => setFieldValue('join_date', dateString)}
            required={true}
            error={touched.join_date && !!errors.join_date}
            helperText={touched.join_date && errors.join_date ? errors.join_date : 'Format: DD-MM-YYYY'}
          />

          <DateInput
            label="Visa Expiry Date"
            value={values.visa_expiry_date}
            onDateChange={(dateString) => setFieldValue('visa_expiry_date', dateString)}
            required={false}
            helperText="Optional - Format: DD-MM-YYYY"
          />

          <Divider style={[styles.sectionDivider, { backgroundColor: theme.colors.outline }]} />

          {/* Employee Status Section */}
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Employee Status
          </Text>

          <SegmentedButtons
            value={values.is_active ? 'active' : 'inactive'}
            onValueChange={(value) => setFieldValue('is_active', value === 'active')}
            buttons={[
              { value: 'active', label: 'Active', icon: 'check-circle' },
              { value: 'inactive', label: 'Inactive', icon: 'close-circle' },
            ]}
            style={styles.segmentedButtons}
          />

          {/* Form Actions */}
          <View style={styles.formActions}>
            <Button
              mode="outlined"
              onPress={() => router.back()}
              style={[styles.actionButton, { flex: 1, marginRight: 8, borderColor: theme.colors.outline }]}
              icon="close"
              labelStyle={{ color: theme.colors.onSurface }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={[styles.actionButton, { flex: 1, marginLeft: 8, backgroundColor: theme.colors.primary }]}
              icon={isSubmitting ? undefined : "check"}
              labelStyle={{ color: theme.colors.onPrimary }}
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Employee'}
            </Button>
          </View>
        </Surface>

        <View style={{ height: 100 }} />
      </ScrollView>
    );
  };

  return (
    <AdminLayout title="Add Employee" currentRoute="/admin/employees/new" showBackButton onBackPress={() => router.back()}>
      <View style={styles.wrapper}>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {renderForm}
        </Formik>

        <Snackbar
          visible={!!snackbar}
          onDismiss={() => setSnackbar('')}
          duration={4000}
          action={{
            label: 'Dismiss',
            onPress: () => setSnackbar(''),
          }}
          style={{
            backgroundColor: snackbar.includes('success') || snackbar.includes('added') ? '#4CAF50' : '#f44336'
          }}
        >
          <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>
            {snackbar}
          </Text>
        </Snackbar>
      </View>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: isMobile ? 8 : 16,
  },
  formCard: {
    borderRadius: 16,
    padding: isMobile ? 16 : 24,
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
  },
  divider: {
    height: 1,
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionDivider: {
    height: 1,
    marginVertical: 24,
  },
  input: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontWeight: '500',
    marginBottom: 8,
  },
  dropdownButton: {
    marginBottom: 12,
    justifyContent: 'flex-start',
  },
  dropdownContent: {
    justifyContent: 'flex-start',
    paddingHorizontal: 12,
  },
  segmentedButtons: {
    marginBottom: 24,
  },
  formActions: {
    flexDirection: 'row',
    marginTop: 32,
  },
  actionButton: {
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 12,
  },
}); 