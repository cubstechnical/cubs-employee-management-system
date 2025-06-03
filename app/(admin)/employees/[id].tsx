import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Alert, Platform } from 'react-native';
import {
  Text,
  Card,
  Button,
  useTheme,
  TextInput,
  IconButton,
  Surface,
  Chip,
  Divider,
  Portal,
  Modal,
  ActivityIndicator,
  FAB,
  Avatar,
  List,
  SegmentedButtons,
  Snackbar,
  Menu,
  Switch,
} from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { Formik } from 'formik';
import * as Yup from 'yup';
import DateInput from '../../../components/DateInput';
import { useEmployees } from '../../../hooks/useEmployees';
import AdminLayout from '../../../components/AdminLayout';
import { CustomTheme } from '../../../theme';
import { Employee } from '../../../types/employee';
import { getDeviceInfo, truncateTextSmart, getTouchableHitSlop } from '../../../utils/mobileUtils';

const { width } = Dimensions.get('window');
const isMobile = width <= 768;

// Real CUBS company names from the database - Updated with actual company names
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

// Visa status options (same as main employees page)
const VISA_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active', color: '#4CAF50' },
  { value: 'INACTIVE', label: 'Inactive', color: '#F44336' },
  { value: 'EXPIRY', label: 'Expiring Soon', color: '#FF9800' }
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

export default function EmployeeDetailsScreen() {
  const theme = useTheme() as CustomTheme;
  const { id } = useLocalSearchParams();
  const { employees, updateEmployee, deleteEmployee, refreshEmployees } = useEmployees();
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const [companyMenuVisible, setCompanyMenuVisible] = useState(false);
  const [tradeMenuVisible, setTradeMenuVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadEmployee();
  }, [id, employees]);

  const loadEmployee = () => {
    setLoading(true);
    const foundEmployee = employees?.find(emp => emp.id === id);
    if (foundEmployee) {
      setEmployee(foundEmployee);
    }
    setLoading(false);
  };

  const handleUpdate = async (values: any) => {
    if (!employee) return;
    
    setIsSubmitting(true);
    try {
      console.log('🔄 Frontend: Starting update with form values:', values);
      
      // Prepare data for submission
      const updateData = {
        ...values,
        date_of_birth: formatDateForDB(values.date_of_birth),
        join_date: formatDateForDB(values.join_date),
        visa_expiry_date: values.visa_expiry_date ? formatDateForDB(values.visa_expiry_date) : null,
        passport_number: values.passport_number || null,
        home_phone_number: values.home_phone_number || null,
      };

      console.log('🚀 Updating employee data:', updateData);

      await updateEmployee(employee.id, updateData);
      await refreshEmployees();
      
      setSnackbar('Employee updated successfully!');
      setEditMode(false);
      
      // Reload employee data
      setTimeout(() => {
        loadEmployee();
      }, 500);
      
    } catch (error) {
      console.error('❌ Error updating employee:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update employee';
      setSnackbar(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!employee) return;
    
    try {
      await deleteEmployee(employee.id);
      setSnackbar('Employee deleted successfully!');
      setDeleteDialogVisible(false);
      
      setTimeout(() => {
        router.back();
      }, 1500);
      
    } catch (error) {
      console.error('Error deleting employee:', error);
      setSnackbar('Failed to delete employee');
    }
  };

  const getVisaStatusFromDate = (expiryDate: string): string => {
    if (!expiryDate) return 'UNKNOWN';
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'EXPIRED';
    if (daysUntilExpiry <= 30) return 'EXPIRING';
    return 'ACTIVE';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#4CAF50';
      case 'EXPIRING': return '#FF9800';
      case 'EXPIRED': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Active';
      case 'EXPIRING': return 'Expiring Soon';
      case 'EXPIRED': return 'Expired';
      default: return 'Unknown';
    }
  };

  const formatDateDDMMYYYY = (dateString: string) => {
    if (!dateString) return '';
    try {
      const [year, month, day] = dateString.split('-');
      return `${day}-${month}-${year}`;
    } catch {
      return dateString;
    }
  };

  const formatDateForDB = (ddmmyyyy: string): string => {
    if (!ddmmyyyy) return '';
    const parts = ddmmyyyy.split('-');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return ddmmyyyy;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-GB');
    } catch {
      return 'Invalid Date';
    }
  };

  const getInitialValues = () => {
    if (!employee) return {};
    
    return {
      name: employee.name || '',
      employee_id: employee.employee_id || '',
      trade: employee.trade || '',
      nationality: employee.nationality || '',
      date_of_birth: formatDateDDMMYYYY(employee.date_of_birth || ''),
      mobile_number: employee.mobile_number || '',
      home_phone_number: employee.home_phone_number || '',
      email_id: employee.email_id || '',
      company_name: employee.company_name || '',
      join_date: formatDateDDMMYYYY(employee.join_date || ''),
      visa_expiry_date: formatDateDDMMYYYY(employee.visa_expiry_date || ''),
      passport_number: employee.passport_number || '',
      is_active: employee.is_active ?? true,
    };
  };

  if (loading) {
    return (
      <AdminLayout title="Employee Details" currentRoute={`/(admin)/employees/${id}`} showBackButton>
        <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyLarge" style={[styles.loadingText, { color: theme.colors.onSurface }]}>
            Loading employee details...
          </Text>
        </View>
      </AdminLayout>
    );
  }

  if (!employee) {
    return (
      <AdminLayout title="Employee Details" currentRoute={`/(admin)/employees/${id}`} showBackButton>
        <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
          <Text variant="headlineSmall" style={[styles.errorText, { color: theme.colors.error }]}>
            Employee not found
          </Text>
          <Button mode="contained" onPress={() => router.back()} style={styles.backButton}>
            Go Back
          </Button>
        </View>
      </AdminLayout>
    );
  }

  const visaStatus = getVisaStatusFromDate(employee.visa_expiry_date || '');

  // View Mode Component
  const renderViewMode = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Card */}
      <Surface style={[styles.headerCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <View style={styles.headerContent}>
          <Avatar.Text 
            size={80} 
            label={(employee.name || 'N').charAt(0).toUpperCase()} 
            style={{ backgroundColor: theme.colors.primaryContainer }}
            labelStyle={{ color: theme.colors.onPrimaryContainer, fontSize: 32, fontWeight: 'bold' }}
          />
          <View style={styles.headerInfo}>
            <Text variant="headlineMedium" style={[styles.employeeName, { color: theme.colors.onSurface }]}>
              {employee.name || 'N/A'}
            </Text>
            <Text variant="titleMedium" style={[styles.employeeTitle, { color: theme.colors.primary }]}>
              {employee.trade || 'N/A'}
            </Text>
            <Text variant="bodyMedium" style={[styles.employeeId, { color: theme.colors.onSurfaceVariant }]}>
              ID: {employee.employee_id || 'N/A'}
            </Text>
            
            <View style={styles.statusContainer}>
              <Chip 
                style={[styles.statusChip, { backgroundColor: employee.is_active ? '#4CAF50' : '#F44336' }]}
                textStyle={{ color: 'white', fontWeight: 'bold' }}
                compact
              >
                {employee.is_active ? 'Active' : 'Inactive'}
              </Chip>
              <Chip 
                style={[styles.statusChip, { backgroundColor: getStatusColor(visaStatus) }]}
                textStyle={{ color: 'white', fontWeight: 'bold' }}
                compact
              >
                Visa: {getStatusText(visaStatus)}
              </Chip>
            </View>
          </View>
        </View>
      </Surface>

      {/* Details Sections */}
      <Surface style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          Personal Information
        </Text>
        <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
        
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text variant="labelMedium" style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>Nationality</Text>
            <Text variant="bodyLarge" style={[styles.infoValue, { color: theme.colors.onSurface }]}>{employee.nationality || 'N/A'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text variant="labelMedium" style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>Date of Birth</Text>
            <Text variant="bodyLarge" style={[styles.infoValue, { color: theme.colors.onSurface }]}>{formatDate(employee.date_of_birth || '')}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text variant="labelMedium" style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>Passport Number</Text>
            <Text variant="bodyLarge" style={[styles.infoValue, { color: theme.colors.onSurface }]}>{employee.passport_number || 'N/A'}</Text>
          </View>
        </View>
      </Surface>

      <Surface style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          Contact Information
        </Text>
        <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
        
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text variant="labelMedium" style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>Email</Text>
            <Text variant="bodyLarge" style={[styles.infoValue, { color: theme.colors.onSurface }]}>{employee.email_id || 'N/A'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text variant="labelMedium" style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>Mobile</Text>
            <Text variant="bodyLarge" style={[styles.infoValue, { color: theme.colors.onSurface }]}>{employee.mobile_number || 'N/A'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text variant="labelMedium" style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>Home Phone</Text>
            <Text variant="bodyLarge" style={[styles.infoValue, { color: theme.colors.onSurface }]}>{employee.home_phone_number || 'N/A'}</Text>
          </View>
        </View>
      </Surface>

      <Surface style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          Employment Information
        </Text>
        <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
        
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text variant="labelMedium" style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>Company</Text>
            <Text variant="bodyLarge" style={[styles.infoValue, { color: theme.colors.onSurface }]}>{employee.company_name || 'N/A'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text variant="labelMedium" style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>Join Date</Text>
            <Text variant="bodyLarge" style={[styles.infoValue, { color: theme.colors.onSurface }]}>{formatDate(employee.join_date || '')}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text variant="labelMedium" style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>Visa Expiry</Text>
            <Text variant="bodyLarge" style={[styles.infoValue, { 
              color: visaStatus === 'EXPIRED' ? theme.colors.error : 
                     visaStatus === 'EXPIRING' ? '#FF9800' : theme.colors.onSurface 
            }]}>
              {formatDate(employee.visa_expiry_date || '')}
            </Text>
          </View>
        </View>
      </Surface>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  // Edit Mode Component
  const renderEditMode = () => {
    const initialValues = getInitialValues();

    return (
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingBottom: isMobile ? 120 : 100,
        }}
      >
        <Surface style={[styles.editCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Text variant="headlineMedium" style={[styles.editTitle, { 
            color: theme.colors.primary,
            fontSize: isMobile ? 20 : 24,
            marginBottom: isMobile ? 8 : 12,
          }]}>
            Edit Employee Details
          </Text>
          <Text variant="bodyMedium" style={[styles.editSubtitle, { 
            color: theme.colors.onSurfaceVariant,
            fontSize: isMobile ? 14 : 16,
            marginBottom: isMobile ? 16 : 20,
          }]}>
            Update employee information below
          </Text>

          <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleUpdate}
            enableReinitialize
          >
            {({ values, errors, touched, setFieldValue, handleChange, handleSubmit }) => (
              <View style={{ gap: isMobile ? 16 : 20 }}>
                {/* Personal Information Section */}
                <Text variant="titleLarge" style={[styles.sectionTitle, { 
                  color: theme.colors.primary,
                  fontSize: isMobile ? 18 : 20,
                  marginBottom: isMobile ? 12 : 16,
                }]}>
                  Personal Information
                </Text>

                <TextInput
                  label="Full Name *"
                  value={values.name}
                  onChangeText={handleChange('name')}
                  error={touched.name && !!errors.name}
                  style={[styles.input, { 
                    marginBottom: isMobile ? 12 : 16,
                    height: isMobile ? 48 : 56,
                  }]}
                  mode="outlined"
                  left={<TextInput.Icon icon="account" />}
                  contentStyle={{
                    fontSize: isMobile ? 14 : 16,
                  }}
                />
                {touched.name && errors.name && (
                  <Text style={[styles.formErrorText, { 
                    color: theme.colors.error,
                    fontSize: isMobile ? 12 : 14,
                    marginTop: -8,
                    marginBottom: 8,
                  }]}>{errors.name}</Text>
                )}

                <TextInput
                  label="Employee ID *"
                  value={values.employee_id}
                  onChangeText={handleChange('employee_id')}
                  error={touched.employee_id && !!errors.employee_id}
                  style={[styles.input, { 
                    marginBottom: isMobile ? 12 : 16,
                    height: isMobile ? 48 : 56,
                  }]}
                  mode="outlined"
                  left={<TextInput.Icon icon="badge-account" />}
                  contentStyle={{
                    fontSize: isMobile ? 14 : 16,
                  }}
                />
                {touched.employee_id && errors.employee_id && (
                  <Text style={[styles.formErrorText, { 
                    color: theme.colors.error,
                    fontSize: isMobile ? 12 : 14,
                    marginTop: -8,
                    marginBottom: 8,
                  }]}>{errors.employee_id}</Text>
                )}

                <TextInput
                  label="Nationality *"
                  value={values.nationality}
                  onChangeText={handleChange('nationality')}
                  error={touched.nationality && !!errors.nationality}
                  style={[styles.input, { 
                    marginBottom: isMobile ? 12 : 16,
                    height: isMobile ? 48 : 56,
                  }]}
                  mode="outlined"
                  left={<TextInput.Icon icon="flag" />}
                  contentStyle={{
                    fontSize: isMobile ? 14 : 16,
                  }}
                />
                {touched.nationality && errors.nationality && (
                  <Text style={[styles.formErrorText, { 
                    color: theme.colors.error,
                    fontSize: isMobile ? 12 : 14,
                    marginTop: -8,
                    marginBottom: 8,
                  }]}>{errors.nationality}</Text>
                )}

                {/* Trade Dropdown */}
                <Text variant="bodyMedium" style={[styles.fieldLabel, { 
                  color: theme.colors.onSurfaceVariant,
                  fontSize: isMobile ? 14 : 16,
                  marginBottom: isMobile ? 8 : 12,
                }]}>
                  Trade/Position *
                </Text>
                <Menu
                  visible={tradeMenuVisible}
                  onDismiss={() => setTradeMenuVisible(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => setTradeMenuVisible(true)}
                      style={[styles.dropdownButton, { 
                        borderColor: theme.colors.outline,
                        minHeight: isMobile ? 48 : 56,
                        marginBottom: isMobile ? 12 : 16,
                      }]}
                      contentStyle={[styles.dropdownContent, {
                        height: isMobile ? 44 : 52,
                      }]}
                      icon="hammer-wrench"
                      labelStyle={{ 
                        color: theme.colors.onSurface,
                        fontSize: isMobile ? 14 : 16,
                      }}
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
                  <Text style={[styles.formErrorText, { 
                    color: theme.colors.error,
                    fontSize: isMobile ? 12 : 14,
                    marginTop: -8,
                    marginBottom: 8,
                  }]}>{errors.trade}</Text>
                )}

                <Divider style={[styles.sectionDivider, { backgroundColor: theme.colors.outline }]} />

                {/* Contact Information Section */}
                <Text variant="titleLarge" style={[styles.sectionTitle, { 
                  color: theme.colors.primary,
                  fontSize: isMobile ? 18 : 20,
                  marginBottom: isMobile ? 12 : 16,
                }]}>
                  Contact Information
                </Text>

                <TextInput
                  label="Email Address *"
                  value={values.email_id}
                  onChangeText={handleChange('email_id')}
                  error={touched.email_id && !!errors.email_id}
                  style={[styles.input, { 
                    marginBottom: isMobile ? 12 : 16,
                    height: isMobile ? 48 : 56,
                  }]}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  left={<TextInput.Icon icon="email" />}
                  contentStyle={{
                    fontSize: isMobile ? 14 : 16,
                  }}
                />
                {touched.email_id && errors.email_id && (
                  <Text style={[styles.formErrorText, { 
                    color: theme.colors.error,
                    fontSize: isMobile ? 12 : 14,
                    marginTop: -8,
                    marginBottom: 8,
                  }]}>{errors.email_id}</Text>
                )}

                <TextInput
                  label="Mobile Number *"
                  value={values.mobile_number}
                  onChangeText={handleChange('mobile_number')}
                  error={touched.mobile_number && !!errors.mobile_number}
                  style={[styles.input, { 
                    marginBottom: isMobile ? 12 : 16,
                    height: isMobile ? 48 : 56,
                  }]}
                  mode="outlined"
                  keyboardType="phone-pad"
                  left={<TextInput.Icon icon="phone" />}
                  contentStyle={{
                    fontSize: isMobile ? 14 : 16,
                  }}
                />
                {touched.mobile_number && errors.mobile_number && (
                  <Text style={[styles.formErrorText, { 
                    color: theme.colors.error,
                    fontSize: isMobile ? 12 : 14,
                    marginTop: -8,
                    marginBottom: 8,
                  }]}>{errors.mobile_number}</Text>
                )}

                <TextInput
                  label="Home Phone Number"
                  value={values.home_phone_number}
                  onChangeText={handleChange('home_phone_number')}
                  style={[styles.input, { 
                    marginBottom: isMobile ? 12 : 16,
                    height: isMobile ? 48 : 56,
                  }]}
                  mode="outlined"
                  keyboardType="phone-pad"
                  left={<TextInput.Icon icon="phone-classic" />}
                  contentStyle={{
                    fontSize: isMobile ? 14 : 16,
                  }}
                />

                <TextInput
                  label="Passport Number"
                  value={values.passport_number}
                  onChangeText={handleChange('passport_number')}
                  style={[styles.input, { 
                    marginBottom: isMobile ? 12 : 16,
                    height: isMobile ? 48 : 56,
                  }]}
                  mode="outlined"
                  left={<TextInput.Icon icon="passport" />}
                  contentStyle={{
                    fontSize: isMobile ? 14 : 16,
                  }}
                />

                <Divider style={[styles.sectionDivider, { backgroundColor: theme.colors.outline }]} />

                {/* Employment Information Section */}
                <Text variant="titleLarge" style={[styles.sectionTitle, { 
                  color: theme.colors.primary,
                  fontSize: isMobile ? 18 : 20,
                  marginBottom: isMobile ? 12 : 16,
                }]}>
                  Employment Information
                </Text>

                {/* Company Dropdown */}
                <Text variant="bodyMedium" style={[styles.fieldLabel, { 
                  color: theme.colors.onSurfaceVariant,
                  fontSize: isMobile ? 14 : 16,
                  marginBottom: isMobile ? 8 : 12,
                }]}>
                  Company *
                </Text>
                <Menu
                  visible={companyMenuVisible}
                  onDismiss={() => setCompanyMenuVisible(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => setCompanyMenuVisible(true)}
                      style={[styles.dropdownButton, { 
                        borderColor: theme.colors.outline,
                        minHeight: isMobile ? 48 : 56,
                        marginBottom: isMobile ? 12 : 16,
                      }]}
                      contentStyle={[styles.dropdownContent, {
                        height: isMobile ? 44 : 52,
                      }]}
                      icon="domain"
                      labelStyle={{ 
                        color: theme.colors.onSurface,
                        fontSize: isMobile ? 14 : 16,
                        textAlign: 'left',
                      }}
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
                  <Text style={[styles.formErrorText, { 
                    color: theme.colors.error,
                    fontSize: isMobile ? 12 : 14,
                    marginTop: -8,
                    marginBottom: 8,
                  }]}>{errors.company_name}</Text>
                )}

                <Divider style={[styles.sectionDivider, { backgroundColor: theme.colors.outline }]} />

                {/* Date Information Section */}
                <Text variant="titleLarge" style={[styles.sectionTitle, { 
                  color: theme.colors.primary,
                  fontSize: isMobile ? 18 : 20,
                  marginBottom: isMobile ? 12 : 16,
                }]}>
                  Date Information
                </Text>

                <View style={{ marginBottom: isMobile ? 16 : 20 }}>
                  <DateInput
                    label="Date of Birth *"
                    value={values.date_of_birth || ''}
                    onDateChange={(dateString) => setFieldValue('date_of_birth', dateString)}
                    required={true}
                    error={touched.date_of_birth && !!errors.date_of_birth}
                    helperText={touched.date_of_birth && errors.date_of_birth ? errors.date_of_birth : 'Format: DD-MM-YYYY'}
                  />
                </View>

                <View style={{ marginBottom: isMobile ? 16 : 20 }}>
                  <DateInput
                    label="Joining Date *"
                    value={values.join_date || ''}
                    onDateChange={(dateString) => setFieldValue('join_date', dateString)}
                    required={true}
                    error={touched.join_date && !!errors.join_date}
                    helperText={touched.join_date && errors.join_date ? errors.join_date : 'Format: DD-MM-YYYY'}
                  />
                </View>

                <View style={{ marginBottom: isMobile ? 16 : 20 }}>
                  <DateInput
                    label="Visa Expiry Date"
                    value={values.visa_expiry_date || ''}
                    onDateChange={(dateString) => setFieldValue('visa_expiry_date', dateString)}
                    required={false}
                    helperText="Optional - Format: DD-MM-YYYY"
                  />
                </View>

                <Divider style={[styles.sectionDivider, { backgroundColor: theme.colors.outline }]} />

                {/* Employee Status Section */}
                <Text variant="titleLarge" style={[styles.sectionTitle, { 
                  color: theme.colors.primary,
                  fontSize: isMobile ? 18 : 20,
                  marginBottom: isMobile ? 12 : 16,
                }]}>
                  Employee Status
                </Text>

                <View style={[styles.switchContainer, {
                  marginBottom: isMobile ? 20 : 24,
                }]}>
                  <Text variant="bodyLarge" style={[styles.switchLabel, { 
                    color: theme.colors.onSurface,
                    fontSize: isMobile ? 16 : 18,
                  }]}>
                    Employee is Active
                  </Text>
                  <Switch
                    value={values.is_active}
                    onValueChange={(value) => {
                      setFieldValue('is_active', value);
                    }}
                    thumbColor={values.is_active ? theme.colors.primary : undefined}
                    trackColor={{ 
                      false: theme.colors.outline, 
                      true: theme.colors.primaryContainer 
                    }}
                  />
                </View>

                {/* Form Actions */}
                <View style={[styles.formActions, {
                  marginTop: isMobile ? 20 : 24,
                  gap: isMobile ? 12 : 16,
                }]}>
                  <Button
                    mode="outlined"
                    onPress={() => setEditMode(false)}
                    style={[styles.actionButton, { 
                      flex: 1, 
                      borderColor: theme.colors.outline,
                      minHeight: isMobile ? 44 : 52,
                    }]}
                    icon="close"
                    labelStyle={{ 
                      color: theme.colors.onSurface,
                      fontSize: isMobile ? 14 : 16,
                    }}
                    contentStyle={{
                      height: isMobile ? 40 : 48,
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => handleSubmit()}
                    style={[styles.actionButton, { 
                      flex: 1, 
                      backgroundColor: theme.colors.primary,
                      minHeight: isMobile ? 44 : 52,
                    }]}
                    icon={isSubmitting ? undefined : "check"}
                    labelStyle={{ 
                      color: theme.colors.onPrimary,
                      fontSize: isMobile ? 14 : 16,
                    }}
                    contentStyle={{
                      height: isMobile ? 40 : 48,
                    }}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Updating...' : 'Update Employee'}
                  </Button>
                </View>
              </View>
            )}
          </Formik>
        </Surface>
      </ScrollView>
    );
  };

  return (
    <AdminLayout 
      title={editMode ? 'Edit Employee' : 'Employee Details'} 
      currentRoute={`/(admin)/employees/${id}`} 
      showBackButton 
      onBackPress={() => router.back()}
    >
      <View style={styles.wrapper}>
        {editMode ? renderEditMode() : renderViewMode()}

        {/* Floating Action Buttons */}
        {!editMode && (
          <View style={styles.fabContainer}>
            <FAB
              icon="pencil"
              style={[styles.fab, { backgroundColor: theme.colors.primary }]}
              onPress={() => setEditMode(true)}
              label="Edit"
              color={theme.colors.onPrimary}
            />
          </View>
        )}

        {/* Delete Confirmation Modal */}
        <Portal>
          <Modal
            visible={deleteDialogVisible}
            onDismiss={() => setDeleteDialogVisible(false)}
            contentContainerStyle={[styles.deleteModal, { backgroundColor: theme.colors.surface }]}
          >
            <Text variant="headlineSmall" style={[styles.deleteTitle, { color: theme.colors.error }]}>
              Delete Employee
            </Text>
            <Text variant="bodyMedium" style={[styles.deleteMessage, { color: theme.colors.onSurface }]}>
              Are you sure you want to delete {employee.name}? This action cannot be undone.
            </Text>
            <View style={styles.deleteActions}>
              <Button
                mode="outlined"
                onPress={() => setDeleteDialogVisible(false)}
                style={[styles.deleteButton, { borderColor: theme.colors.outline }]}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleDelete}
                style={[styles.deleteButton, { backgroundColor: theme.colors.error }]}
              >
                Delete
              </Button>
            </View>
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
          style={{
            backgroundColor: snackbar.includes('success') || snackbar.includes('updated') ? '#4CAF50' : '#f44336'
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    borderRadius: 12,
  },
  
  // Header Card Styles
  headerCard: {
    borderRadius: 16,
    padding: isMobile ? 16 : 24,
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'center' : 'flex-start',
    gap: 16,
  },
  headerInfo: {
    flex: 1,
    alignItems: isMobile ? 'center' : 'flex-start',
  },
  employeeName: {
    fontWeight: 'bold',
    textAlign: isMobile ? 'center' : 'left',
    marginBottom: 4,
  },
  employeeTitle: {
    fontWeight: '600',
    textAlign: isMobile ? 'center' : 'left',
    marginBottom: 4,
  },
  employeeId: {
    textAlign: isMobile ? 'center' : 'left',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: isMobile ? 'center' : 'flex-start',
  },
  statusChip: {
    marginBottom: 4,
  },
  
  // Section Card Styles
  sectionCard: {
    borderRadius: 12,
    padding: isMobile ? 16 : 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  sectionDivider: {
    height: 1,
    marginVertical: 24,
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    paddingVertical: 8,
  },
  infoLabel: {
    fontWeight: '500',
    marginBottom: 4,
  },
  infoValue: {
    fontWeight: '400',
  },
  
  // Edit Form Styles
  editCard: {
    borderRadius: 16,
    padding: isMobile ? 16 : 24,
    marginBottom: 16,
  },
  editTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  editSubtitle: {
    textAlign: 'center',
    marginBottom: 24,
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 24,
  },
  switchLabel: {
    flex: 1,
    fontWeight: '500',
  },
  formActions: {
    flexDirection: 'row',
    marginTop: 32,
  },
  actionButton: {
    paddingVertical: 8,
  },
  formErrorText: {
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 12,
  },
  
  // FAB Styles
  fabContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  fab: {
    borderRadius: 16,
  },
  
  // Delete Modal Styles
  deleteModal: {
    margin: 20,
    borderRadius: 16,
    padding: 24,
  },
  deleteTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  deleteMessage: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  deleteActions: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteButton: {
    flex: 1,
    borderRadius: 12,
  },
}); 