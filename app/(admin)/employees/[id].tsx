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
} from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { Formik } from 'formik';
import * as Yup from 'yup';
import WebDatePicker from '../../../components/WebDatePicker';
import { useEmployees } from '../../../hooks/useEmployees';
import AdminLayout from '../../../components/AdminLayout';
import { CustomTheme } from '../../../theme';
import { Employee } from '../../../types/employee';

const { width } = Dimensions.get('window');

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
  'AL MACEN TRADING & CONTRACTING W.L.L.'
];

// Visa status options (same as main employees page)
const VISA_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active', color: '#4CAF50' },
  { value: 'INACTIVE', label: 'Inactive', color: '#F44336' },
  { value: 'EXPIRY', label: 'Expiring Soon', color: '#FF9800' }
];

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  employee_id: Yup.string().required('Employee ID is required'),
  trade: Yup.string().required('Trade is required'),
  nationality: Yup.string().required('Nationality is required'),
  join_date: Yup.string().required('Joining date is required'),
  date_of_birth: Yup.string().required('Date of birth is required'),
  mobile_number: Yup.string().required('Mobile number is required'),
  email_id: Yup.string().email('Invalid email').required('Email is required'),
  company_name: Yup.string().required('Company is required'),
  visa_expiry_date: Yup.string(),
  passport_number: Yup.string(),
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

  // Enhanced form state with visa status
  const [formData, setFormData] = useState({
    name: '',
    employee_id: '',
    trade: '',
    nationality: '',
    date_of_birth: '',
    mobile_number: '',
    email_id: '',
    company_name: '',
    join_date: '',
    visa_expiry_date: '',
    passport_number: '',
    is_active: true,
    visa_status: 'ACTIVE',
  });

  // Date picker states
  const [showJoinDatePicker, setShowJoinDatePicker] = useState(false);
  const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);
  const [showVisaDatePicker, setShowVisaDatePicker] = useState(false);
  const [companyMenuVisible, setCompanyMenuVisible] = useState(false);

  useEffect(() => {
    loadEmployee();
  }, [id, employees]);

  const loadEmployee = () => {
    setLoading(true);
    const foundEmployee = employees?.find(emp => emp.id === id);
    if (foundEmployee) {
      setEmployee(foundEmployee);
      setFormData({
        name: foundEmployee.name || '',
        employee_id: foundEmployee.employee_id || '',
        trade: foundEmployee.trade || '',
        nationality: foundEmployee.nationality || '',
        date_of_birth: formatDateDDMMYYYY(foundEmployee.date_of_birth || ''),
        mobile_number: foundEmployee.mobile_number || '',
        email_id: foundEmployee.email_id || '',
        company_name: foundEmployee.company_name || '',
        join_date: formatDateDDMMYYYY(foundEmployee.join_date || ''),
        visa_expiry_date: formatDateDDMMYYYY(foundEmployee.visa_expiry_date || ''),
        passport_number: foundEmployee.passport_number || '',
        is_active: foundEmployee.is_active ?? true,
        visa_status: getVisaStatusFromDate(foundEmployee.visa_expiry_date || ''),
      });
    }
    setLoading(false);
  };

  const handleUpdate = async (values: any) => {
    if (!employee) return;
    
    try {
      // Convert DD-MM-YYYY format back to YYYY-MM-DD for database and handle empty strings
      const updateData = {
        ...values,
        // Convert date formats and handle empty strings as null
        date_of_birth: values.date_of_birth ? parseDDMMYYYY(values.date_of_birth) || null : null,
        join_date: values.join_date ? parseDDMMYYYY(values.join_date) || null : null,
        visa_expiry_date: values.visa_expiry_date ? parseDDMMYYYY(values.visa_expiry_date) || null : null,
        // Ensure other string fields are properly handled
        passport_number: values.passport_number || null,
        mobile_number: values.mobile_number || null,
      };
      
      console.log('Updating employee with validated data:', updateData);
      await updateEmployee(employee.id, updateData);
      setSnackbar('Employee updated successfully!');
      setEditMode(false);
      await refreshEmployees();
      loadEmployee();
    } catch (error) {
      console.error('Update error:', error);
      setSnackbar('Failed to update employee. Please check your connection and try again.');
    }
  };

  const handleDelete = async () => {
    if (!employee) return;
    
    try {
      await deleteEmployee(employee.id);
      setSnackbar('Employee deleted successfully');
      router.back();
    } catch (error) {
      console.error('Delete error:', error);
      setSnackbar('Failed to delete employee. Please try again.');
    }
  };

  const getVisaStatusFromDate = (expiryDate: string): string => {
    if (!expiryDate) return 'INACTIVE';
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return 'INACTIVE';
    if (daysUntilExpiry <= 30) return 'EXPIRY';
    return 'ACTIVE';
  };

  const getVisaStatusColor = (status: string) => {
    const statusOption = VISA_STATUS_OPTIONS.find(option => option.value === status);
    return statusOption?.color || theme.colors.outline;
  };

  const getVisaStatusText = (status: string) => {
    const statusOption = VISA_STATUS_OPTIONS.find(option => option.value === status);
    return statusOption?.label || 'Unknown';
  };

  // Enhanced date formatting utility - DD-MM-YYYY format
  const formatDateDDMMYYYY = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Convert DD-MM-YYYY back to YYYY-MM-DD for database
  const parseDDMMYYYY = (ddmmyyyy: string): string => {
    if (!ddmmyyyy) return '';
    const parts = ddmmyyyy.split('-');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return ddmmyyyy;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return formatDateDDMMYYYY(dateString);
  };

  if (loading) {
    return (
      <AdminLayout title="Employee Details" currentRoute={`/admin/employees/${id}`}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 16, color: theme.colors.onSurface }}>Loading employee...</Text>
        </View>
      </AdminLayout>
    );
  }

  if (!employee) {
    return (
      <AdminLayout title="Employee Not Found" currentRoute={`/admin/employees/${id}`}>
        <View style={styles.errorContainer}>
          <IconButton icon="account-alert" size={64} iconColor={theme.colors.error} />
          <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, marginTop: 16 }}>
            Employee Not Found
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>
            The employee you're looking for doesn't exist or has been removed.
          </Text>
          <Button
            mode="contained"
            onPress={() => router.back()}
            style={{ marginTop: 24 }}
            icon="arrow-left"
          >
            Go Back
          </Button>
        </View>
      </AdminLayout>
    );
  }

  const renderEmployeeInfo = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Employee Header Card - Now Clickable for Editing */}
      <Card 
        style={[styles.headerCard, { backgroundColor: theme.colors.surface }]} 
        elevation={3}
        onPress={() => setEditMode(true)}
      >
        <Card.Content style={styles.headerContent}>
          <Avatar.Text 
            size={80} 
            label={employee.name?.charAt(0) || 'E'} 
            style={{ backgroundColor: theme.colors.primaryContainer }}
            labelStyle={{ color: theme.colors.onPrimaryContainer, fontSize: 32, fontWeight: 'bold' }}
          />
          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, fontWeight: 'bold', flex: 1 }}>
                {employee.name || 'Unknown Name'}
              </Text>
              <IconButton
                icon="pencil"
                size={20}
                iconColor={theme.colors.primary}
                style={{ margin: 0 }}
                onPress={() => setEditMode(true)}
              />
            </View>
            <Text variant="titleMedium" style={{ color: theme.colors.primary, marginTop: 4 }}>
              {employee.trade || 'No Trade'} • {employee.employee_id || 'No ID'}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
              {employee.company_name || 'No Company'} • {employee.nationality || 'Unknown'}
            </Text>
            
            <View style={styles.statusChips}>
              <Chip
                mode="flat"
                style={[
                  styles.statusChip,
                  { backgroundColor: employee.is_active ? theme.colors.primaryContainer : theme.colors.errorContainer }
                ]}
                textStyle={{
                  color: employee.is_active ? theme.colors.onPrimaryContainer : theme.colors.onErrorContainer,
                  fontWeight: '500',
                }}
              >
                {employee.is_active ? 'Active' : 'Inactive'}
              </Chip>
              <Chip
                mode="flat"
                style={[
                  styles.statusChip,
                  { backgroundColor: getVisaStatusColor(getVisaStatusFromDate(employee.visa_expiry_date || '')) + '30' }
                ]}
                textStyle={{
                  color: getVisaStatusColor(getVisaStatusFromDate(employee.visa_expiry_date || '')),
                  fontWeight: '500',
                }}
              >
                Visa: {getVisaStatusText(getVisaStatusFromDate(employee.visa_expiry_date || ''))}
              </Chip>
            </View>
          </View>
        </Card.Content>
        {/* Click to Edit Hint */}
        <Card.Actions style={styles.clickHint}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, fontStyle: 'italic' }}>
            👆 Tap to edit employee details
          </Text>
        </Card.Actions>
      </Card>

      {/* Contact Information */}
      <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <Card.Content>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Contact Information
          </Text>
          <List.Item
            title="Email Address"
            description={employee.email_id || 'No email provided'}
            left={(props) => <List.Icon {...props} icon="email" color={theme.colors.primary} />}
            style={styles.listItem}
            titleStyle={{ color: theme.colors.onSurface, fontWeight: '500' }}
            descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
          />
          <List.Item
            title="Mobile Number"
            description={employee.mobile_number || 'No mobile number'}
            left={(props) => <List.Icon {...props} icon="phone" color={theme.colors.primary} />}
            style={styles.listItem}
            titleStyle={{ color: theme.colors.onSurface, fontWeight: '500' }}
            descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
          />
          <List.Item
            title="Passport Number"
            description={employee.passport_number || 'No passport number'}
            left={(props) => <List.Icon {...props} icon="passport" color={theme.colors.primary} />}
            style={styles.listItem}
            titleStyle={{ color: theme.colors.onSurface, fontWeight: '500' }}
            descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
          />
        </Card.Content>
      </Card>

      {/* Employment Details */}
      <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <Card.Content>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Employment Details
          </Text>
          <List.Item
            title="Employee ID"
            description={employee.employee_id || 'No ID assigned'}
            left={(props) => <List.Icon {...props} icon="badge-account" color={theme.colors.primary} />}
            style={styles.listItem}
            titleStyle={{ color: theme.colors.onSurface, fontWeight: '500' }}
            descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
          />
          <List.Item
            title="Trade/Position"
            description={employee.trade || 'No trade specified'}
            left={(props) => <List.Icon {...props} icon="hammer-wrench" color={theme.colors.primary} />}
            style={styles.listItem}
            titleStyle={{ color: theme.colors.onSurface, fontWeight: '500' }}
            descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
          />
          <List.Item
            title="Company"
            description={employee.company_name || 'No company assigned'}
            left={(props) => <List.Icon {...props} icon="domain" color={theme.colors.primary} />}
            style={styles.listItem}
            titleStyle={{ color: theme.colors.onSurface, fontWeight: '500' }}
            descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
          />
          <List.Item
            title="Joining Date"
            description={employee.join_date ? formatDate(employee.join_date) : 'Unknown'}
            left={(props) => <List.Icon {...props} icon="calendar-clock" color={theme.colors.primary} />}
            style={styles.listItem}
            titleStyle={{ color: theme.colors.onSurface, fontWeight: '500' }}
            descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
          />
        </Card.Content>
      </Card>

      {/* Personal Information */}
      <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <Card.Content>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Personal Information
          </Text>
          <List.Item
            title="Date of Birth"
            description={employee.date_of_birth ? formatDate(employee.date_of_birth) : 'Unknown'}
            left={(props) => <List.Icon {...props} icon="cake-variant" color={theme.colors.primary} />}
            style={styles.listItem}
            titleStyle={{ color: theme.colors.onSurface, fontWeight: '500' }}
            descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
          />
          <List.Item
            title="Nationality"
            description={employee.nationality || 'Unknown'}
            left={(props) => <List.Icon {...props} icon="flag" color={theme.colors.primary} />}
            style={styles.listItem}
            titleStyle={{ color: theme.colors.onSurface, fontWeight: '500' }}
            descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
          />
          <List.Item
            title="Visa Expiry Date"
            description={employee.visa_expiry_date ? formatDate(employee.visa_expiry_date) : 'No expiry date'}
            left={(props) => <List.Icon {...props} icon="card-account-details" color={theme.colors.primary} />}
            right={() => (
              <Chip
                mode="flat"
                style={{
                  backgroundColor: getVisaStatusColor(getVisaStatusFromDate(employee.visa_expiry_date || '')) + '30',
                }}
                textStyle={{
                  color: getVisaStatusColor(getVisaStatusFromDate(employee.visa_expiry_date || '')),
                  fontSize: 12,
                  fontWeight: '500',
                }}
              >
                {getVisaStatusText(getVisaStatusFromDate(employee.visa_expiry_date || ''))}
              </Chip>
            )}
            style={styles.listItem}
            titleStyle={{ color: theme.colors.onSurface, fontWeight: '500' }}
            descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
          />
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <Card.Content>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Quick Actions
          </Text>
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={() => router.push(`/(admin)/documents?employeeId=${employee.id}`)}
              icon="file-document-multiple"
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              labelStyle={{ color: theme.colors.onPrimary }}
            >
              View Documents
            </Button>
            <Button
              mode="outlined"
              onPress={() => setEditMode(true)}
              icon="pencil"
              style={[styles.actionButton, { borderColor: theme.colors.primary }]}
              labelStyle={{ color: theme.colors.primary }}
            >
              Edit Employee
            </Button>
            <Button
              mode="outlined"
              onPress={() => setDeleteDialogVisible(true)}
              icon="delete"
              style={[styles.actionButton, { borderColor: theme.colors.error }]}
              labelStyle={{ color: theme.colors.error }}
            >
              Delete Employee
            </Button>
          </View>
        </Card.Content>
      </Card>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderEditForm = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <Card.Content>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Edit Employee Information
          </Text>
          
          <Formik
            initialValues={formData}
            validationSchema={validationSchema}
            onSubmit={handleUpdate}
            enableReinitialize
          >
            {({ handleChange, handleSubmit, values, errors, touched, setFieldValue }) => (
              <View>
                {/* Basic Information */}
                <Text variant="titleMedium" style={[styles.subSectionTitle, { color: theme.colors.primary }]}>
                  Basic Information
                </Text>
                
                <TextInput
                  label="Employee ID *"
                  value={values.employee_id}
                  onChangeText={handleChange('employee_id')}
                  error={touched.employee_id && !!errors.employee_id}
                  style={styles.input}
                  mode="outlined"
                  left={<TextInput.Icon icon="badge-account" />}
                  theme={{ colors: { primary: theme.colors.primary } }}
                />
                
                <TextInput
                  label="Full Name *"
                  value={values.name}
                  onChangeText={handleChange('name')}
                  error={touched.name && !!errors.name}
                  style={styles.input}
                  mode="outlined"
                  left={<TextInput.Icon icon="account" />}
                  theme={{ colors: { primary: theme.colors.primary } }}
                />
                
                <TextInput
                  label="Trade/Position *"
                  value={values.trade}
                  onChangeText={handleChange('trade')}
                  error={touched.trade && !!errors.trade}
                  style={styles.input}
                  mode="outlined"
                  left={<TextInput.Icon icon="hammer-wrench" />}
                  theme={{ colors: { primary: theme.colors.primary } }}
                />
                
                <TextInput
                  label="Nationality *"
                  value={values.nationality}
                  onChangeText={handleChange('nationality')}
                  error={touched.nationality && !!errors.nationality}
                  style={styles.input}
                  mode="outlined"
                  left={<TextInput.Icon icon="flag" />}
                  theme={{ colors: { primary: theme.colors.primary } }}
                />
                
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

                <Divider style={[styles.sectionDivider, { backgroundColor: theme.colors.outline }]} />

                {/* Contact Information */}
                <Text variant="titleMedium" style={[styles.subSectionTitle, { color: theme.colors.primary }]}>
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
                  left={<TextInput.Icon icon="email" />}
                  theme={{ colors: { primary: theme.colors.primary } }}
                />
                
                <TextInput
                  label="Mobile Number *"
                  value={values.mobile_number}
                  onChangeText={handleChange('mobile_number')}
                  error={touched.mobile_number && !!errors.mobile_number}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="phone-pad"
                  left={<TextInput.Icon icon="phone" />}
                  theme={{ colors: { primary: theme.colors.primary } }}
                />
                
                <TextInput
                  label="Passport Number"
                  value={values.passport_number}
                  onChangeText={handleChange('passport_number')}
                  style={styles.input}
                  mode="outlined"
                  left={<TextInput.Icon icon="passport" />}
                  theme={{ colors: { primary: theme.colors.primary } }}
                />

                <Divider style={[styles.sectionDivider, { backgroundColor: theme.colors.outline }]} />

                {/* Date Information */}
                <Text variant="titleMedium" style={[styles.subSectionTitle, { color: theme.colors.primary }]}>
                  Date Information
                </Text>
                
                {/* Date of Birth */}
                <Text variant="bodyMedium" style={[styles.fieldLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Date of Birth *
                </Text>
                <Button
                  mode="outlined"
                  onPress={() => setShowBirthDatePicker(true)}
                  style={[styles.dateButton, { borderColor: theme.colors.outline }]}
                  contentStyle={styles.dropdownContent}
                  icon="cake-variant"
                  labelStyle={{ color: theme.colors.onSurface }}
                >
                  {values.date_of_birth ? formatDate(values.date_of_birth) : 'Select Date of Birth'}
                </Button>
                
                {/* Join Date */}
                <Text variant="bodyMedium" style={[styles.fieldLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Joining Date *
                </Text>
                <Button
                  mode="outlined"
                  onPress={() => setShowJoinDatePicker(true)}
                  style={[styles.dateButton, { borderColor: theme.colors.outline }]}
                  contentStyle={styles.dropdownContent}
                  icon="calendar-clock"
                  labelStyle={{ color: theme.colors.onSurface }}
                >
                  {values.join_date ? formatDate(values.join_date) : 'Select Joining Date'}
                </Button>
                
                {/* Visa Expiry Date */}
                <Text variant="bodyMedium" style={[styles.fieldLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Visa Expiry Date
                </Text>
                <Button
                  mode="outlined"
                  onPress={() => setShowVisaDatePicker(true)}
                  style={[styles.dateButton, { borderColor: theme.colors.outline }]}
                  contentStyle={styles.dropdownContent}
                  icon="card-account-details"
                  labelStyle={{ color: theme.colors.onSurface }}
                >
                  {values.visa_expiry_date ? formatDate(values.visa_expiry_date) : 'Select Visa Expiry Date'}
                </Button>

                <Divider style={[styles.sectionDivider, { backgroundColor: theme.colors.outline }]} />

                {/* Employee Status */}
                <Text variant="titleMedium" style={[styles.subSectionTitle, { color: theme.colors.primary }]}>
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

                {/* Visa Status */}
                <Text variant="titleMedium" style={[styles.subSectionTitle, { color: theme.colors.primary }]}>
                  Visa Status
                </Text>
                
                <SegmentedButtons
                  value={values.visa_status}
                  onValueChange={(value) => setFieldValue('visa_status', value)}
                  buttons={VISA_STATUS_OPTIONS.map(option => ({
                    value: option.value,
                    label: option.label,
                    icon: option.value === 'ACTIVE' ? 'check-circle' : 
                          option.value === 'INACTIVE' ? 'close-circle' : 'alert-circle'
                  }))}
                  style={styles.segmentedButtons}
                />

                <View style={styles.formActions}>
                  <Button
                    mode="outlined"
                    onPress={() => setEditMode(false)}
                    style={[styles.actionButton, { flex: 1, marginRight: 8, borderColor: theme.colors.outline }]}
                    icon="close"
                    labelStyle={{ color: theme.colors.onSurface }}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => handleSubmit()}
                    style={[styles.actionButton, { flex: 1, marginLeft: 8, backgroundColor: theme.colors.primary }]}
                    icon="check"
                    labelStyle={{ color: theme.colors.onPrimary }}
                  >
                    Save Changes
                  </Button>
                </View>
              </View>
            )}
          </Formik>
        </Card.Content>
      </Card>
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  return (
    <AdminLayout title={editMode ? 'Edit Employee' : 'Employee Details'} currentRoute={`/admin/employees/${id}`}>
      <View style={styles.container}>
        {editMode ? renderEditForm() : renderEmployeeInfo()}

        {/* Quick Action FAB */}
        {!editMode && (
          <FAB
            icon="pencil"
            style={[styles.fab, { backgroundColor: theme.colors.primary }]}
            onPress={() => setEditMode(true)}
            label="Edit"
          />
        )}

        {/* Delete Confirmation Dialog */}
        <Portal>
          <Modal
            visible={deleteDialogVisible}
            onDismiss={() => setDeleteDialogVisible(false)}
            contentContainerStyle={styles.modalContainer}
          >
            <Surface style={[styles.deleteModal, { backgroundColor: theme.colors.surface }]} elevation={5}>
              <Text variant="headlineSmall" style={{ color: theme.colors.error, fontWeight: 'bold', marginBottom: 16 }}>
                Delete Employee
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginBottom: 24 }}>
                Are you sure you want to delete "{employee.name}"? This action cannot be undone and will remove all associated data.
              </Text>
              <View style={styles.deleteActions}>
                <Button
                  mode="outlined"
                  onPress={() => setDeleteDialogVisible(false)}
                  style={{ flex: 1, marginRight: 8, borderColor: theme.colors.outline }}
                  labelStyle={{ color: theme.colors.onSurface }}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={() => {
                    setDeleteDialogVisible(false);
                    handleDelete();
                  }}
                  style={{ flex: 1, marginLeft: 8, backgroundColor: theme.colors.error }}
                  icon="delete"
                  labelStyle={{ color: theme.colors.onError }}
                >
                  Delete
                </Button>
              </View>
            </Surface>
          </Modal>
        </Portal>

        {/* Date Pickers */}
        {showBirthDatePicker && (
          <WebDatePicker
            value={formData.date_of_birth ? new Date(formData.date_of_birth) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowBirthDatePicker(false);
              if (selectedDate) {
                setFormData({
                  ...formData,
                  date_of_birth: selectedDate.toISOString().split('T')[0]
                });
              }
            }}
          />
        )}

        {showJoinDatePicker && (
          <WebDatePicker
            value={formData.join_date ? new Date(formData.join_date) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowJoinDatePicker(false);
              if (selectedDate) {
                setFormData({
                  ...formData,
                  join_date: selectedDate.toISOString().split('T')[0]
                });
              }
            }}
          />
        )}

        {showVisaDatePicker && (
          <WebDatePicker
            value={formData.visa_expiry_date ? new Date(formData.visa_expiry_date) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowVisaDatePicker(false);
              if (selectedDate) {
                setFormData({
                  ...formData,
                  visa_expiry_date: selectedDate.toISOString().split('T')[0]
                });
              }
            }}
          />
        )}

        <Snackbar
          visible={!!snackbar}
          onDismiss={() => setSnackbar('')}
          duration={4000}
          action={{
            label: 'Dismiss',
            onPress: () => setSnackbar(''),
          }}
          style={{ backgroundColor: theme.colors.surface }}
        >
          {snackbar}
        </Snackbar>
      </View>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
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
    padding: 32,
  },
  headerCard: {
    borderRadius: 16,
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  statusChips: {
    flexDirection: 'row',
    marginTop: 12,
    flexWrap: 'wrap',
  },
  statusChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  sectionCard: {
    borderRadius: 12,
    marginBottom: 16,
  },
  listItem: {
    paddingVertical: 4,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subSectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  fieldLabel: {
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    marginBottom: 12,
  },
  dateButton: {
    marginBottom: 12,
    justifyContent: 'flex-start',
  },
  dropdownButton: {
    marginBottom: 12,
    justifyContent: 'flex-start',
  },
  dropdownContent: {
    justifyContent: 'flex-start',
    paddingHorizontal: 12,
  },
  sectionDivider: {
    height: 1,
    marginVertical: 16,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  formActions: {
    flexDirection: 'row',
    marginTop: 24,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  deleteModal: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
  },
  deleteActions: {
    flexDirection: 'row',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clickHint: {
    padding: 8,
  },
}); 