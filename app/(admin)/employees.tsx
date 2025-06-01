import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, RefreshControl, TouchableOpacity, Platform, Animated, Alert } from 'react-native';
import {
  Text,
  Card,
  useTheme,
  Searchbar,
  FAB,
  Chip,
  IconButton,
  Surface,
  Button,
  Menu,
  Portal,
  Modal,
  TextInput,
  ActivityIndicator,
  Divider,
  DataTable,
  List,
  SegmentedButtons,
  Snackbar,
} from 'react-native-paper';
import { router } from 'expo-router';
import { useEmployees } from '../../hooks/useEmployees';
import AdminLayout from '../../components/AdminLayout';
import { CustomTheme } from '../../theme';
import { Employee } from '../../types/employee';
import { sendVisaExpiryReminders } from '../../services/emailService';

const { width } = Dimensions.get('window');

// Real CUBS company names from the database
const DEFAULT_COMPANIES = [
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

// Visa status options
const VISA_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active', color: '#22C55E' },
  { value: 'INACTIVE', label: 'Inactive', color: '#EF4444' },
  { value: 'EXPIRY', label: 'Expiring Soon', color: '#F59E0B' }
];

export default function EmployeesScreen() {
  const theme = useTheme() as CustomTheme;
  const { employees, isLoading, refreshEmployees, addEmployee, updateEmployee, deleteEmployee } = useEmployees();
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'join_date' | 'visa_expiry'>('name');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [snackbar, setSnackbar] = useState('');
  const [companies, setCompanies] = useState<string[]>(DEFAULT_COMPANIES);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Animation states
  const [fadeAnimation] = useState(new Animated.Value(0));
  const [slideAnimation] = useState(new Animated.Value(50));
  const [loadingAnimation] = useState(new Animated.Value(0));
  const [successAnimation] = useState(new Animated.Value(0));

  // Add a state for row hover/press animations
  const [pressedRow, setPressedRow] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // Enhanced color constants for consistency - Professional Blue Theme (avoiding red conflicts)
  const CONSISTENT_COLORS = {
    primary: '#2563EB', // Professional Blue instead of Ferrari Red
    secondary: '#3182CE', // Professional Blue
    tertiary: '#8B5CF6', // Purple
    success: '#22C55E', // Green
    warning: '#F59E0B', // Amber
    error: '#DC2626', // Error Red (only for actual errors)
    info: '#3B82F6', // Blue
    purple: '#8B5CF6', // Purple
    professional: '#2563EB', // Professional Blue - primary brand color
    teal: '#14B8A6', // Teal
    gray: '#6B7280', // Gray
    expired: '#DC2626', // Red for expired visas
    expiring: '#F59E0B', // Amber for expiring visas
    active: '#22C55E', // Green for active visas
  };

  // Form state
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    trade: '',
    nationality: '',
    date_of_birth: '',
    mobile_number: '',
    email_id: '',
    company_name: '',
    join_date: '',
    visa_expiry_date: '',
    passport_number: '',
    employee_id: '',
    visa_status: 'ACTIVE',
  });

  // UI state
  const [companyMenuVisible, setCompanyMenuVisible] = useState(false);

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.spring(fadeAnimation, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnimation, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Loading animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(loadingAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(loadingAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load employees if not already loaded
      if (!employees || employees.length === 0) {
        await refreshEmployees();
      }
      
      // Extract unique company names from existing employees in the database
      if (employees && employees.length > 0) {
        const existingCompanies = [...new Set(employees
          .map(emp => emp.company_name)
          .filter(Boolean)
        )];
        
        // Combine with defaults and remove duplicates
        const allCompanies = [...new Set([
          ...DEFAULT_COMPANIES,
          ...existingCompanies
        ])].sort();
        
        console.log('Found companies from database:', existingCompanies);
        console.log('All available companies:', allCompanies);
        setCompanies(allCompanies);
      } else {
        // If no employees exist yet, use defaults
        setCompanies(DEFAULT_COMPANIES);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      setSnackbar('Failed to load data');
      // Fallback to defaults on error
      setCompanies(DEFAULT_COMPANIES);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshEmployees();
      await loadInitialData();
    } catch (error) {
      setSnackbar('Failed to refresh data');
    } finally {
    setRefreshing(false);
    }
  };

  const filteredEmployees = employees?.filter(employee => {
    const matchesSearch = 
      (employee.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (employee.trade || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (employee.company_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (employee.email_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (employee.employee_id || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = 
      filterStatus === 'all' || 
      (filterStatus === 'active' && employee.is_active) ||
      (filterStatus === 'inactive' && !employee.is_active);

    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.name || '').localeCompare(b.name || '');
      case 'join_date':
        return new Date(b.join_date || '').getTime() - new Date(a.join_date || '').getTime();
      case 'visa_expiry':
        return new Date(a.visa_expiry_date || '').getTime() - new Date(b.visa_expiry_date || '').getTime();
      default:
        return 0;
    }
  }) || [];

  // Success animation function
  const triggerSuccessAnimation = () => {
    Animated.sequence([
      Animated.timing(successAnimation, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(successAnimation, {
        toValue: 0,
        duration: 400,
        delay: 2000,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleAddEmployee = async () => {
    try {
      if (!newEmployee.name || !newEmployee.employee_id || !newEmployee.email_id) {
        setSnackbar('Please fill in all required fields');
        return;
      }

      // Generate company_id from company_name (simple approach)
      const company_id = newEmployee.company_name ? 
        newEmployee.company_name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') : 
        'cubs_tech';

      // Fix date handling and map to proper database schema
      const employeeData = {
        employee_id: newEmployee.employee_id || `EMP${Date.now()}`,
        name: newEmployee.name,
        trade: newEmployee.trade || '',
        nationality: newEmployee.nationality || '',
        date_of_birth: newEmployee.date_of_birth ? parseDDMMYYYY(newEmployee.date_of_birth) : null,
        mobile_number: newEmployee.mobile_number || '',
        home_phone_number: null, // Not used in form
        email_id: newEmployee.email_id,
        company_id: company_id, // Required by schema
        company_name: newEmployee.company_name || 'CUBS Technical', // Keep for display
        join_date: newEmployee.join_date ? parseDDMMYYYY(newEmployee.join_date) : null,
        visa_expiry_date: newEmployee.visa_expiry_date ? parseDDMMYYYY(newEmployee.visa_expiry_date) : null,
        passport_number: newEmployee.passport_number || '',
        status: 'Active', // Required by schema
        is_active: true,
        // visa_status will be calculated automatically by the service
      };

      console.log('Adding employee with validated data:', employeeData);
      await addEmployee(employeeData);
      
      triggerSuccessAnimation();
      setShowAddModal(false);
      resetForm();
      setSnackbar('Employee added successfully!');
      
      // Refresh data to get updated company list
      await loadInitialData();
    } catch (error) {
      console.error('Error adding employee:', error);
      setSnackbar('Failed to add employee. Please check all fields and try again.');
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setNewEmployee({
      name: employee.name || '',
      trade: employee.trade || '',
      nationality: employee.nationality || '',
      date_of_birth: formatDateDDMMYYYY(employee.date_of_birth || ''),
      mobile_number: employee.mobile_number || '',
      email_id: employee.email_id || '',
      company_name: employee.company_name || '',
      join_date: formatDateDDMMYYYY(employee.join_date || ''),
      visa_expiry_date: formatDateDDMMYYYY(employee.visa_expiry_date || ''),
      passport_number: employee.passport_number || '',
      employee_id: employee.employee_id || '',
      visa_status: getVisaStatusFromDate(employee.visa_expiry_date || ''),
    });
    setShowAddModal(true);
  };

  const handleUpdateEmployee = async () => {
    if (!editingEmployee) return;
    
    try {
      // Generate company_id from company_name (simple approach)
      const company_id = newEmployee.company_name ? 
        newEmployee.company_name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') : 
        'cubs_tech';

      // Fix date handling and map to proper database schema
      const updateData = {
        employee_id: newEmployee.employee_id,
        name: newEmployee.name,
        trade: newEmployee.trade || '',
        nationality: newEmployee.nationality || '',
        date_of_birth: newEmployee.date_of_birth ? parseDDMMYYYY(newEmployee.date_of_birth) : undefined,
        mobile_number: newEmployee.mobile_number || '',
        home_phone_number: undefined, // Not used in form
        email_id: newEmployee.email_id,
        company_id: company_id, // Required by schema
        company_name: newEmployee.company_name || 'CUBS Technical', // Keep for display
        join_date: newEmployee.join_date ? parseDDMMYYYY(newEmployee.join_date) : undefined,
        visa_expiry_date: newEmployee.visa_expiry_date ? parseDDMMYYYY(newEmployee.visa_expiry_date) : undefined,
        passport_number: newEmployee.passport_number || '',
        status: 'Active', // Required by schema
        // visa_status will be calculated automatically by the service
      };

      console.log('Updating employee with validated data:', updateData);
      await updateEmployee(editingEmployee.id, updateData);
      
      triggerSuccessAnimation();
      setShowAddModal(false);
      setEditingEmployee(null);
      resetForm();
      setSnackbar('Employee updated successfully!');
      
      // Refresh data to ensure UI is updated
      await loadInitialData();
    } catch (error) {
      console.error('Error updating employee:', error);
      setSnackbar('Failed to update employee. Please try again.');
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    try {
      console.log('Deleting employee:', employeeId);
      await deleteEmployee(employeeId);
      triggerSuccessAnimation();
      setSnackbar('Employee deleted successfully!');
      
      // Refresh data
      await loadInitialData();
    } catch (error) {
      console.error('Error deleting employee:', error);
      setSnackbar('Failed to delete employee. Please try again.');
    }
  };

  // Multi-select functions
  const handleSelectEmployee = (employeeId: string) => {
    setSelectedEmployees(prev => {
      const newSelection = prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId];
      setShowBulkActions(newSelection.length > 0);
      return newSelection;
    });
  };

  const handleSelectAllEmployees = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
      setShowBulkActions(false);
    } else {
      const allIds = filteredEmployees.map(emp => emp.id);
      setSelectedEmployees(allIds);
      setShowBulkActions(true);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEmployees.length === 0) return;
    
    Alert.alert(
      'Confirm Bulk Delete',
      `Are you sure you want to delete ${selectedEmployees.length} employee(s)? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setRefreshing(true);
              const deletePromises = selectedEmployees.map(id => deleteEmployee(id));
              await Promise.all(deletePromises);
              
              triggerSuccessAnimation();
              setSnackbar(`Successfully deleted ${selectedEmployees.length} employee(s)!`);
              setSelectedEmployees([]);
              setShowBulkActions(false);
              await loadInitialData();
            } catch (error) {
              console.error('Error bulk deleting employees:', error);
              setSnackbar('Failed to delete some employees. Please try again.');
            } finally {
              setRefreshing(false);
            }
          }
        }
      ]
    );
  };

  const handleBulkSendVisaReminder = async () => {
    if (selectedEmployees.length === 0) {
      setSnackbar('No employees selected.');
      return;
    }

    try {
      setRefreshing(true);
      setSnackbar(`Sending reminders to ${selectedEmployees.length} employee(s)...`);

      // Get selected employee objects
      const selectedEmployeeObjects = employees?.filter(emp => 
        selectedEmployees.includes(emp.id)
      ) || [];

      if (selectedEmployeeObjects.length === 0) {
        setSnackbar('No valid employees found for sending reminders.');
        return;
      }

      // Send visa expiry reminders
      const results = await sendVisaExpiryReminders(selectedEmployeeObjects);

      // Show results
      if (results.sent > 0) {
        triggerSuccessAnimation();
        if (results.failed > 0) {
          setSnackbar(`Sent ${results.sent} reminders successfully, ${results.failed} failed.`);
        } else {
          setSnackbar(`Successfully sent reminders to ${results.sent} employee(s)! 📧`);
        }
      } else {
        setSnackbar(`Failed to send reminders. ${results.failed} errors occurred.`);
      }

      // Clear selection
      setSelectedEmployees([]);
      setShowBulkActions(false);

    } catch (error) {
      console.error('Error sending visa reminders:', error);
      setSnackbar('Failed to send reminders. Please check your email configuration and try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const resetForm = () => {
    setNewEmployee({
      name: '',
      trade: '',
      nationality: '',
      date_of_birth: '',
      mobile_number: '',
      email_id: '',
      company_name: '',
      join_date: '',
      visa_expiry_date: '',
      passport_number: '',
      employee_id: '',
      visa_status: 'ACTIVE',
    });
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
    switch (status) {
      case 'ACTIVE': return CONSISTENT_COLORS.active;
      case 'INACTIVE': return CONSISTENT_COLORS.expired;
      case 'EXPIRY': return CONSISTENT_COLORS.expiring;
      default: return CONSISTENT_COLORS.gray;
    }
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

  const navigateToEmployeeDetails = (employeeId: string) => {
    router.push(`/(admin)/employees/${employeeId}`);
  };

  const navigateToDocuments = (employeeId: string) => {
    router.push(`/(admin)/documents?employeeId=${employeeId}`);
  };

  // Dramatically improved table view with full height and better styling
  const renderTableView = () => (
    <View style={styles.fullHeightTableContainer}>
      <Surface style={[styles.modernTableContainer, { backgroundColor: theme.colors.surface }]} elevation={4}>
        {/* Table Header with Actions */}
        <View style={styles.tableHeader}>
          <Text variant="titleLarge" style={[styles.tableTitle, { color: CONSISTENT_COLORS.primary }]}>
            📊 Employee Database ({filteredEmployees.length} employees)
          </Text>
          
          {/* Bulk Actions Bar */}
          {showBulkActions && (
            <Surface style={[styles.bulkActionsBar, { backgroundColor: CONSISTENT_COLORS.primary + '10' }]} elevation={2}>
              <Text variant="bodyMedium" style={{ color: CONSISTENT_COLORS.primary, fontWeight: 'bold' }}>
                {selectedEmployees.length} employee(s) selected
              </Text>
              <View style={styles.bulkActions}>
                <Button
                  mode="contained"
                  onPress={handleBulkSendVisaReminder}
                  style={[styles.bulkActionButton, { backgroundColor: CONSISTENT_COLORS.info, marginRight: 8 }]}
                  labelStyle={{ color: 'white', fontSize: 12 }}
                  icon="email-fast"
                  compact
                >
                  Send Reminder
                </Button>
                <Button
                  mode="contained"
                  onPress={handleBulkDelete}
                  style={[styles.bulkActionButton, { backgroundColor: CONSISTENT_COLORS.error }]}
                  labelStyle={{ color: 'white', fontSize: 12 }}
                  icon="delete"
                  compact
                >
                  Delete Selected
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setSelectedEmployees([]);
                    setShowBulkActions(false);
                  }}
                  style={[styles.bulkActionButton, { borderColor: CONSISTENT_COLORS.gray }]}
                  labelStyle={{ color: CONSISTENT_COLORS.gray, fontSize: 12 }}
                  compact
                >
                  Cancel
                </Button>
              </View>
            </Surface>
          )}
        </View>
        
        {/* Scrollable Table Content */}
        <ScrollView 
          style={styles.tableScrollView}
          showsVerticalScrollIndicator={true}
          bounces={true}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh}
              colors={[CONSISTENT_COLORS.primary]}
              tintColor={CONSISTENT_COLORS.primary}
            />
          }
        >
          {/* Modern Table Header */}
          <View style={[styles.modernTableHeader, { backgroundColor: CONSISTENT_COLORS.primary + '15' }]}>
            <View style={[styles.tableCell, styles.selectColumn]}>
              <IconButton
                icon={selectedEmployees.length === filteredEmployees.length ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={20}
                iconColor={CONSISTENT_COLORS.primary}
                onPress={handleSelectAllEmployees}
              />
            </View>
            <View style={[styles.tableCell, styles.employeeColumn]}>
              <Text style={[styles.headerText, { color: CONSISTENT_COLORS.primary }]}>👤 Employee</Text>
            </View>
            <View style={[styles.tableCell, styles.companyColumn]}>
              <Text style={[styles.headerText, { color: CONSISTENT_COLORS.primary }]}>🏢 Company</Text>
            </View>
            <View style={[styles.tableCell, styles.compactColumn]}>
              <Text style={[styles.headerText, { color: CONSISTENT_COLORS.primary }]}>💼 Role</Text>
            </View>
            <View style={[styles.tableCell, styles.compactColumn]}>
              <Text style={[styles.headerText, { color: CONSISTENT_COLORS.primary }]}>📞 Contact</Text>
            </View>
            <View style={[styles.tableCell, styles.compactColumn]}>
              <Text style={[styles.headerText, { color: CONSISTENT_COLORS.primary }]}>🛂 Visa Status</Text>
            </View>
            <View style={[styles.tableCell, styles.actionsColumn]}>
              <Text style={[styles.headerText, { color: CONSISTENT_COLORS.primary }]}>⚡ Actions</Text>
            </View>
          </View>

          {/* Modern Table Rows with Enhanced Mobile Support */}
          {filteredEmployees.map((employee, index) => (
            <TouchableOpacity
              key={employee.id}
              onPressIn={() => setPressedRow(employee.id)}
              onPressOut={() => setPressedRow(null)}
              onPress={() => navigateToEmployeeDetails(employee.id)}
              activeOpacity={0.95}
            >
              <Animated.View
                style={[
                  styles.modernTableRow,
                  {
                    backgroundColor: pressedRow === employee.id
                      ? CONSISTENT_COLORS.primary + '10'
                      : index % 2 === 0 
                        ? theme.colors.surface 
                        : theme.colors.surfaceVariant + '20',
                    borderLeftColor: employee.is_active 
                      ? CONSISTENT_COLORS.active 
                      : CONSISTENT_COLORS.gray,
                    borderLeftWidth: 3,
                  }
                ]}
              >
                {/* Select Checkbox */}
                <View style={[styles.tableCell, styles.selectColumn]}>
                  <IconButton
                    icon={selectedEmployees.includes(employee.id) ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={18}
                    iconColor={CONSISTENT_COLORS.primary}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleSelectEmployee(employee.id);
                    }}
                  />
                </View>

                {/* Employee Info - Compact with reduced spacing */}
                <View style={[styles.tableCell, styles.employeeColumn]}>
                  <View style={styles.employeeInfoContainer}>
                    <Text style={[styles.employeeName, { color: CONSISTENT_COLORS.primary }]} numberOfLines={1}>
                      {employee.name || 'Unknown Name'}
                    </Text>
                    <Text style={[styles.employeeId, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
                      {employee.employee_id || 'No ID'}
                    </Text>
                  </View>
                </View>

                {/* Company - Now with more space and no truncation */}
                <View style={[styles.tableCell, styles.companyColumn]}>
                  <Text style={[styles.cellMainText, { color: theme.colors.onSurface }]} numberOfLines={2}>
                    {employee.company_name || 'No Company'}
                  </Text>
                  <Text style={[styles.cellSubText, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
                    {formatDate(employee.join_date || '')}
                  </Text>
                </View>

                {/* Role - Compact */}
                <View style={[styles.tableCell, styles.compactColumn]}>
                  <Text style={[styles.cellMainText, { color: theme.colors.onSurface }]} numberOfLines={1}>
                    {employee.trade || 'No Trade'}
                  </Text>
                  <Text style={[styles.cellSubText, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
                    {employee.nationality || 'Unknown'}
                  </Text>
                </View>
                
                {/* Contact - Compact */}
                <View style={[styles.tableCell, styles.compactColumn]}>
                  <Text style={[styles.cellMainText, { color: theme.colors.onSurface }]} numberOfLines={1}>
                    {employee.mobile_number || 'No phone'}
                  </Text>
                  <Text style={[styles.cellSubText, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
                    {employee.email_id ? 
                      (employee.email_id.length > 12 ? employee.email_id.substring(0, 12) + '...' : employee.email_id)
                      : 'No email'
                    }
                  </Text>
                </View>

                {/* Visa Status - Using appropriate colors */}
                <View style={[styles.tableCell, styles.compactColumn]}>
                  <Chip
                    mode="flat"
                    compact
                    style={[
                      styles.modernChip,
                      { 
                        backgroundColor: getVisaStatusColor(getVisaStatusFromDate(employee.visa_expiry_date || '')) + '20'
                      }
                    ]}
                    textStyle={[
                      styles.chipText,
                      { 
                        color: getVisaStatusColor(getVisaStatusFromDate(employee.visa_expiry_date || ''))
                      }
                    ]}
                  >
                    {getVisaStatusFromDate(employee.visa_expiry_date || '')}
                  </Chip>
                  <Text style={[styles.cellSubText, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
                    {formatDate(employee.visa_expiry_date || '')}
                  </Text>
                </View>

                {/* Actions - Compact and Functional */}
                <View style={[styles.tableCell, styles.actionsColumn]}>
                  <View style={styles.modernActionButtons}>
                    <IconButton
                      icon="eye"
                      size={16}
                      iconColor={CONSISTENT_COLORS.info}
                      style={[styles.actionBtn, { backgroundColor: CONSISTENT_COLORS.info + '15' }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        navigateToEmployeeDetails(employee.id);
                      }}
                    />
                    <IconButton
                      icon="pencil"
                      size={16}
                      iconColor={CONSISTENT_COLORS.warning}
                      style={[styles.actionBtn, { backgroundColor: CONSISTENT_COLORS.warning + '15' }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleEditEmployee(employee);
                      }}
                    />
                    <IconButton
                      icon="delete"
                      size={16}
                      iconColor={CONSISTENT_COLORS.error}
                      style={[styles.actionBtn, { backgroundColor: CONSISTENT_COLORS.error + '15' }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteEmployee(employee.id);
                      }}
                    />
                  </View>
                </View>
              </Animated.View>
            </TouchableOpacity>
          ))}
          
          {/* Bottom spacing for FAB */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </Surface>
    </View>
  );

  return (
    <AdminLayout title="Employees" currentRoute="/admin/employees">
      <View style={[styles.container]}>
        {/* Enhanced Header with Search and Filters */}
        <Surface style={styles.headerControls} elevation={2}>
          <View style={styles.searchContainer}>
            <Searchbar
              placeholder="Search employees..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.modernSearchBar}
              iconColor={CONSISTENT_COLORS.primary}
            />
          </View>
          
          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterButtons}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Chip
                  selected={filterStatus === 'all'}
                  onPress={() => setFilterStatus('all')}
                  style={[styles.filterChip, { backgroundColor: filterStatus === 'all' ? CONSISTENT_COLORS.primary + '20' : theme.colors.surface }]}
                  textStyle={{ color: filterStatus === 'all' ? CONSISTENT_COLORS.primary : theme.colors.onSurface }}
                  showSelectedOverlay
                >
                  All ({filteredEmployees.length})
                </Chip>
                <Chip
                  selected={filterStatus === 'active'}
                  onPress={() => setFilterStatus('active')}
                  style={[styles.filterChip, { backgroundColor: filterStatus === 'active' ? CONSISTENT_COLORS.active + '20' : theme.colors.surface }]}
                  textStyle={{ color: filterStatus === 'active' ? CONSISTENT_COLORS.active : theme.colors.onSurface }}
                  showSelectedOverlay
                >
                  Active ({employees?.filter(e => e.is_active).length || 0})
                </Chip>
                <Chip
                  selected={filterStatus === 'inactive'}
                  onPress={() => setFilterStatus('inactive')}
                  style={[styles.filterChip, { backgroundColor: filterStatus === 'inactive' ? CONSISTENT_COLORS.error + '20' : theme.colors.surface }]}
                  textStyle={{ color: filterStatus === 'inactive' ? CONSISTENT_COLORS.error : theme.colors.onSurface }}
                  showSelectedOverlay
                >
                  Inactive ({employees?.filter(e => !e.is_active).length || 0})
                </Chip>
              </View>
            </ScrollView>

            <View style={styles.viewControls}>
              <IconButton
                icon="sort"
                onPress={() => setMenuVisible(true)}
                iconColor={theme.colors.onSurface}
                style={[styles.controlButton, { backgroundColor: theme.colors.surfaceVariant }]}
              />
            </View>
          </View>
        </Surface>

        {/* Content with full height and proper scrolling */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Animated.View style={{
              transform: [{
                rotate: loadingAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                })
              }]
            }}>
              <ActivityIndicator size="large" color={CONSISTENT_COLORS.primary} />
            </Animated.View>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginTop: 16 }}>
              Loading employees...
            </Text>
          </View>
        ) : filteredEmployees.length > 0 ? (
          <Animated.View style={[styles.content, { opacity: fadeAnimation }]}>
            {renderTableView()}
          </Animated.View>
        ) : (
          <View style={styles.emptyState}>
            <IconButton icon="account-group" size={64} iconColor={theme.colors.onSurfaceVariant} />
            <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, marginTop: 16 }}>
              No employees found
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>
              {searchQuery ? 'Try adjusting your search criteria' : 'Add your first employee to get started'}
            </Text>
            {!searchQuery && (
              <Button 
                mode="contained" 
                onPress={() => setShowAddModal(true)}
                style={[styles.modernButton, { marginTop: 24, backgroundColor: CONSISTENT_COLORS.primary }]}
                labelStyle={{ color: 'white', fontWeight: '600' }}
                icon="plus"
              >
                Add Employee
              </Button>
            )}
          </View>
        )}

        {/* Beautiful Floating Action Button */}
        <FAB
          icon="plus"
          style={[styles.modernFab, { backgroundColor: CONSISTENT_COLORS.primary }]}
          onPress={() => setShowAddModal(true)}
          label="Add Employee"
          color="white"
        />

        {/* Success Overlay */}
        <Animated.View style={[
          styles.successOverlay,
          {
            opacity: successAnimation,
            transform: [{
              scale: successAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              })
            }]
          }
        ]}>
          <View style={[styles.successContainer, { backgroundColor: CONSISTENT_COLORS.success }]}>
            <IconButton
              icon="check-circle"
              size={48}
              iconColor="white"
            />
            <Text style={styles.successText}>Operation completed successfully! 🎉</Text>
          </View>
        </Animated.View>

        {/* Menu and Modal components remain the same */}
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={<View />}
        >
          <Menu.Item
            onPress={() => {
              setSortBy('name');
              setMenuVisible(false);
            }}
            title="Sort by Name"
            leadingIcon={sortBy === 'name' ? 'check' : undefined}
          />
          <Menu.Item
            onPress={() => {
              setSortBy('join_date');
              setMenuVisible(false);
            }}
            title="Sort by Join Date"
            leadingIcon={sortBy === 'join_date' ? 'check' : undefined}
          />
          <Menu.Item
            onPress={() => {
              setSortBy('visa_expiry');
              setMenuVisible(false);
            }}
            title="Sort by Visa Expiry"
            leadingIcon={sortBy === 'visa_expiry' ? 'check' : undefined}
          />
        </Menu>

        {/* Enhanced Add/Edit Employee Modal */}
        <Portal>
          <Modal
            visible={showAddModal}
            onDismiss={() => {
              setShowAddModal(false);
              setEditingEmployee(null);
              resetForm();
            }}
            contentContainerStyle={styles.modalContainer}
          >
            <Surface style={[styles.modernModal, { backgroundColor: theme.colors.surface }]} elevation={5}>
              <Text variant="headlineSmall" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
              </Text>
              
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                {/* Basic Information */}
                <View style={styles.formSection}>
                  <Text variant="titleMedium" style={[styles.sectionTitle, { color: CONSISTENT_COLORS.primary }]}>
                    Basic Information
                  </Text>
                  
                  <TextInput
                    label="Employee ID *"
                    value={newEmployee.employee_id}
                    onChangeText={(text) => setNewEmployee({...newEmployee, employee_id: text})}
                    style={styles.modernInput}
                    mode="outlined"
                    left={<TextInput.Icon icon="badge-account" />}
                    theme={{ colors: { primary: CONSISTENT_COLORS.primary } }}
                  />
                  
                  <TextInput
                    label="Full Name *"
                    value={newEmployee.name}
                    onChangeText={(text) => setNewEmployee({...newEmployee, name: text})}
                    style={styles.modernInput}
                    mode="outlined"
                    left={<TextInput.Icon icon="account" />}
                    theme={{ colors: { primary: CONSISTENT_COLORS.primary } }}
                  />
                  
                  <TextInput
                    label="Trade/Position *"
                    value={newEmployee.trade}
                    onChangeText={(text) => setNewEmployee({...newEmployee, trade: text})}
                    style={styles.modernInput}
                    mode="outlined"
                    left={<TextInput.Icon icon="hammer-wrench" />}
                    theme={{ colors: { primary: CONSISTENT_COLORS.primary } }}
                  />
                  
                  <TextInput
                    label="Nationality *"
                    value={newEmployee.nationality}
                    onChangeText={(text) => setNewEmployee({...newEmployee, nationality: text})}
                    style={styles.modernInput}
                    mode="outlined"
                    left={<TextInput.Icon icon="flag" />}
                    theme={{ colors: { primary: CONSISTENT_COLORS.primary } }}
                  />
                  
                  {/* Company Dropdown */}
                  <View style={styles.dropdownContainer}>
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
                          style={[styles.modernDropdownButton, { borderColor: CONSISTENT_COLORS.primary }]}
                          contentStyle={styles.dropdownContent}
                          icon="domain"
                          labelStyle={{ color: theme.colors.onSurface, fontWeight: '500' }}
                        >
                          {newEmployee.company_name || 'Select Company'}
                        </Button>
                      }
                    >
                      {companies.map((company) => (
                        <Menu.Item
                          key={company}
                          onPress={() => {
                            setNewEmployee({...newEmployee, company_name: company});
                            setCompanyMenuVisible(false);
                          }}
                          title={company}
                          leadingIcon={newEmployee.company_name === company ? 'check' : undefined}
                        />
                      ))}
                    </Menu>
                  </View>
                </View>

                <Divider style={[styles.sectionDivider, { backgroundColor: theme.colors.outline }]} />

                {/* Contact Information */}
                <View style={styles.formSection}>
                  <Text variant="titleMedium" style={[styles.sectionTitle, { color: CONSISTENT_COLORS.primary }]}>
                    Contact Information
                  </Text>
                  
                  <TextInput
                    label="Email Address *"
                    value={newEmployee.email_id}
                    onChangeText={(text) => setNewEmployee({...newEmployee, email_id: text})}
                    style={styles.modernInput}
                    mode="outlined"
                    keyboardType="email-address"
                    left={<TextInput.Icon icon="email" />}
                    theme={{ colors: { primary: CONSISTENT_COLORS.primary } }}
                  />
                  
                  <TextInput
                    label="Mobile Number *"
                    value={newEmployee.mobile_number}
                    onChangeText={(text) => setNewEmployee({...newEmployee, mobile_number: text})}
                    style={styles.modernInput}
                    mode="outlined"
                    keyboardType="phone-pad"
                    left={<TextInput.Icon icon="phone" />}
                    theme={{ colors: { primary: CONSISTENT_COLORS.primary } }}
                  />
                  
                  <TextInput
                    label="Passport Number"
                    value={newEmployee.passport_number}
                    onChangeText={(text) => setNewEmployee({...newEmployee, passport_number: text})}
                    style={styles.modernInput}
                    mode="outlined"
                    left={<TextInput.Icon icon="passport" />}
                    theme={{ colors: { primary: CONSISTENT_COLORS.primary } }}
                  />
                </View>

                <Divider style={[styles.sectionDivider, { backgroundColor: theme.colors.outline }]} />

                {/* Date Information - Web Compatible */}
                <View style={styles.formSection}>
                  <Text variant="titleMedium" style={[styles.sectionTitle, { color: CONSISTENT_COLORS.primary }]}>
                    Date Information
                  </Text>
                  
                  {/* Web-compatible date inputs */}
                  <TextInput
                    label="Date of Birth (DD-MM-YYYY) *"
                    value={newEmployee.date_of_birth}
                    onChangeText={(text) => setNewEmployee({...newEmployee, date_of_birth: text})}
                    style={styles.modernInput}
                    mode="outlined"
                    left={<TextInput.Icon icon="cake-variant" />}
                    theme={{ colors: { primary: CONSISTENT_COLORS.primary } }}
                    placeholder="01-01-1990"
                  />
                  
                  <TextInput
                    label="Joining Date (DD-MM-YYYY) *"
                    value={newEmployee.join_date}
                    onChangeText={(text) => setNewEmployee({...newEmployee, join_date: text})}
                    style={styles.modernInput}
                    mode="outlined"
                    left={<TextInput.Icon icon="calendar-clock" />}
                    theme={{ colors: { primary: CONSISTENT_COLORS.primary } }}
                    placeholder="01-01-2024"
                  />
                  
                  <TextInput
                    label="Visa Expiry Date (DD-MM-YYYY)"
                    value={newEmployee.visa_expiry_date}
                    onChangeText={(text) => setNewEmployee({...newEmployee, visa_expiry_date: text})}
                    style={styles.modernInput}
                    mode="outlined"
                    left={<TextInput.Icon icon="card-account-details" />}
                    theme={{ colors: { primary: CONSISTENT_COLORS.primary } }}
                    placeholder="31-12-2025"
                  />
                </View>

                <Divider style={[styles.sectionDivider, { backgroundColor: theme.colors.outline }]} />

                {/* Visa Status */}
                <View style={styles.formSection}>
                  <Text variant="titleMedium" style={[styles.sectionTitle, { color: CONSISTENT_COLORS.primary }]}>
                    Visa Status
                  </Text>
                  
                  <SegmentedButtons
                    value={newEmployee.visa_status}
                    onValueChange={(value) => setNewEmployee({...newEmployee, visa_status: value})}
                    buttons={VISA_STATUS_OPTIONS.map(option => ({
                      value: option.value,
                      label: option.label,
                      icon: option.value === 'ACTIVE' ? 'check-circle' : 
                            option.value === 'INACTIVE' ? 'close-circle' : 'alert-circle'
                    }))}
                    style={styles.modernSegmentedButtons}
                  />
                </View>
              </ScrollView>

              <View style={styles.modernModalActions}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setShowAddModal(false);
                    setEditingEmployee(null);
                    resetForm();
                  }}
                  style={[styles.modernButton, { flex: 1, marginRight: 8, borderColor: CONSISTENT_COLORS.gray }]}
                  labelStyle={{ color: theme.colors.onSurface, fontWeight: '600' }}
                  icon="close"
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={editingEmployee ? handleUpdateEmployee : handleAddEmployee}
                  style={[styles.modernButton, { flex: 1, marginLeft: 8, backgroundColor: CONSISTENT_COLORS.primary }]}
                  labelStyle={{ color: 'white', fontWeight: '600' }}
                  icon={editingEmployee ? "check" : "plus"}
                >
                  {editingEmployee ? 'Update' : 'Add'}
                </Button>
              </View>
            </Surface>
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
          style={{ backgroundColor: theme.colors.surfaceVariant }}
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
    backgroundColor: '#FAFAFA',
  },
  headerControls: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(197, 48, 48, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#C53030',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(197,48,48,0.1)',
      }
    })
  },
  searchContainer: {
    marginBottom: 16,
  },
  modernSearchBar: {
    borderRadius: 12,
    elevation: 2,
    backgroundColor: 'white',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  filterChip: {
    marginRight: 8,
    borderRadius: 20,
  },
  modernFilterButton: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#C53030', // Updated to new professional red
  },
  viewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernViewButton: {
    borderRadius: 8,
    backgroundColor: 'rgba(197, 48, 48, 0.1)', // Updated to new professional red
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  modernFab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    borderRadius: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
  },
  modernModal: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    padding: 24,
    borderRadius: 20,
  },
  modalContent: {
    maxHeight: 500,
  },
  modalTitle: {
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  fieldLabel: {
    marginBottom: 8,
    fontWeight: '500',
  },
  modernInput: {
    marginBottom: 16,
    borderRadius: 12,
  },
  dropdownContainer: {
    marginBottom: 16,
  },
  modernDropdownButton: {
    marginBottom: 16,
    justifyContent: 'flex-start',
    borderRadius: 12,
  },
  dropdownContent: {
    justifyContent: 'flex-start',
    paddingHorizontal: 12,
  },
  sectionDivider: {
    height: 1,
    marginVertical: 20,
  },
  modernSegmentedButtons: {
    marginBottom: 16,
    borderRadius: 12,
  },
  modernModalActions: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  modernButton: {
    borderRadius: 12,
    paddingVertical: 4,
  },
  
  // Modern Table Styles - Enhanced for full height and better UI
  modernTableContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    margin: 16,
    marginBottom: 0,
  },
  tableHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tableTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  tableScrollView: {
    flex: 1,
    maxHeight: '100%',
  },
  modernTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    zIndex: 1,
  },
  modernTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    minHeight: 82,
  },
  tableCell: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  selectColumn: {
    width: 50,
    alignItems: 'center',
  },
  employeeColumn: {
    flex: 1.8,
    minWidth: 130,
  },
  companyColumn: {
    flex: 2.2,
    minWidth: 160,
  },
  compactColumn: {
    flex: 1,
    minWidth: 100,
  },
  actionsColumn: {
    width: 110,
    alignItems: 'center',
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  employeeInfoContainer: {
    flex: 1,
  },
  employeeName: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 1,
  },
  employeeId: {
    fontSize: 12,
    opacity: 0.8,
  },
  cellMainText: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
    lineHeight: 16,
  },
  cellSubText: {
    fontSize: 11,
    opacity: 0.7,
  },
  modernChip: {
    height: 24,
    marginBottom: 4,
  },
  chipText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  modernActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    margin: 0,
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  successContainer: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
    marginTop: 16,
  },
  filterScrollView: {
    flex: 1,
  },
  viewControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    borderRadius: 12,
  },
  bulkActionsBar: {
    padding: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(220, 20, 60, 0.2)',
    backgroundColor: 'linear-gradient(135deg, #ffffff 0%, #fef7f7 100%)',
  },
  bulkActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bulkActionButton: {
    borderRadius: 12,
    paddingVertical: 4,
  },
  fullHeightTableContainer: {
    flex: 1,
    paddingHorizontal: 0,
  },
});

