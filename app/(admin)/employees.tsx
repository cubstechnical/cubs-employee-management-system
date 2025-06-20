import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, RefreshControl, TouchableOpacity, Platform, Animated, Alert, Switch } from 'react-native';
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
  Avatar,
  Badge
} from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import { useEmployees } from '../../hooks/useEmployees';
import { usePaginatedEmployees } from '../../hooks/usePaginatedEmployees';
import AdminLayout from '../../components/AdminLayout';
import { CustomTheme } from '../../theme';
import { Employee } from '../../types/employee';
import { sendVisaExpiryReminders } from '../../services/emailService';
import { getDeviceInfo, getResponsiveSpacing, performanceUtils } from '../../utils/mobileUtils';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

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

const CONSISTENT_COLORS = {
  primary: '#2563EB', // Professional Blue
  secondary: '#3182CE',
  tertiary: '#8B5CF6',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#DC2626',
  info: '#3B82F6',
  purple: '#8B5CF6',
  professional: '#2563EB',
  teal: '#14B8A6',
  gray: '#6B7280',
  expired: '#DC2626',
  expiring: '#F59E0B',
  active: '#22C55E',
};

export default function EmployeesScreen() {
  const theme = useTheme() as CustomTheme;
  const { employees, isLoading, refreshEmployees, addEmployee, updateEmployee, deleteEmployee } = useEmployees();
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filter states
  const [filterCompany, setFilterCompany] = useState<string>('all');
  const [filterTrade, setFilterTrade] = useState<string>('all');
  const [filterVisaStatus, setFilterVisaStatus] = useState<string>('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 3. Extract unique trades from employees
  const allTrades = Array.from(new Set(employees.map(emp => emp.trade).filter(Boolean)));
  const allVisaStatuses = ['ACTIVE', 'EXPIRING', 'EXPIRED'];

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
    passport_no: '',
    employee_id: '',
    visa_status: 'ACTIVE',
  });

  // UI state
  const [companyMenuVisible, setCompanyMenuVisible] = useState(false);

  // 1. Add a state for display mode
  const [displayMode, setDisplayMode] = useState<'view' | 'editor'>('view');

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

  // 4. Update filteredEmployees logic to include new filters
  const filteredEmployees = employees?.filter(employee => {
    const matchesSearch =
      (employee.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (employee.trade || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (employee.company_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (employee.employee_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (employee.passport_no || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCompany = filterCompany === 'all' || employee.company_name === filterCompany;
    const matchesTrade = filterTrade === 'all' || employee.trade === filterTrade;
    const matchesVisaStatus = filterVisaStatus === 'all' || (employee.visa_status || '').toUpperCase() === filterVisaStatus;

    return matchesSearch && matchesCompany && matchesTrade && matchesVisaStatus;
  })?.sort((a, b) => {
    // Sort by employee name alphabetically
    const nameA = (a.name || '').toLowerCase();
    const nameB = (b.name || '').toLowerCase();
    return nameA.localeCompare(nameB);
  }) || [];

  // 5. Pagination logic
  const totalPages = Math.ceil(filteredEmployees.length / pageSize);
  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
        passport_no: newEmployee.passport_no || '',
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

  const handleEdit = (employee: Employee) => {
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
      passport_no: employee.passport_no || '',
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
        passport_no: newEmployee.passport_no || '',
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
  const handleSelectEmployee = (employeeId: string | undefined) => {
    if (!employeeId) return;
    
    if (selectedEmployees.includes(employeeId)) {
      setSelectedEmployees(selectedEmployees.filter(id => id !== employeeId));
    } else {
      setSelectedEmployees([...selectedEmployees, employeeId]);
    }
  };

  const handleSelectAllEmployees = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
      setShowBulkActions(false);
    } else {
      const allIds = filteredEmployees.map(emp => emp.employee_id).filter(Boolean) as string[];
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
        selectedEmployees.includes(emp.employee_id || '')
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
      passport_no: '',
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

  // Navigation helper - FIXED
  const navigateToEmployeeDetails = (employee: Employee) => {
    const employeeId = employee.employee_id || employee.id;
    if (!employeeId) {
      console.warn('No employee ID found for navigation');
      return;
    }
    
    console.log('Navigating to employee details with ID:', employeeId);
    
    // Use router.push for both web and mobile
    router.push(`/(admin)/employees/${employeeId}`);
  };

  const navigateToDocuments = (employeeId: string) => {
    router.push(`/(admin)/documents?employeeId=${employeeId}`);
  };

  // Completely redesign renderTableView with modern UI/UX
  const renderTableView = () => {
    // Show paginated employees (10 per page)
    const displayEmployees = paginatedEmployees;

    const renderStatusChip = (status: string, type: 'visa' | 'employee') => {
      const getStatusConfig = () => {
        if (type === 'visa') {
          switch (status?.toLowerCase()) {
            case 'active': return { color: '#10B981', bg: '#D1FAE5', text: 'Active' };
            case 'expiring': return { color: '#F59E0B', bg: '#FEF3C7', text: 'Expiry Soon' };
            case 'expired': return { color: '#EF4444', bg: '#FEE2E2', text: 'Expired' };
            default: return { color: '#6B7280', bg: '#F3F4F6', text: 'Unknown' };
          }
        } else {
          return status === 'active' 
            ? { color: '#10B981', bg: '#D1FAE5', text: 'Active' }
            : { color: '#6B7280', bg: '#F3F4F6', text: 'Inactive' };
        }
      };

      const config = getStatusConfig();
      return (
        <View style={[styles.statusChip, { backgroundColor: config.bg }]}>
          <Text style={[styles.statusChipText, { color: config.color }]}>
            {config.text}
          </Text>
        </View>
      );
    };

    return (
      <View style={styles.tableContainer}>
        {/* Clean Header Section */}
        <View style={styles.tableHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.titleContainer}>
              <Text style={styles.pageTitle}>Employee List</Text>
              <Text style={styles.employeeCount}>({filteredEmployees.length} employees)</Text>
            </View>
            <View style={styles.headerControls}>
              <View style={styles.entriesControl}>
                <Text style={styles.entriesLabel}>Rows Per Page</Text>
                <TouchableOpacity
                  style={styles.entriesDropdown}
                  onPress={() => {
                    // Cycle through page size options
                    const pageSizeOptions = [10, 25, 50];
                    const currentIndex = pageSizeOptions.indexOf(pageSize);
                    const nextIndex = (currentIndex + 1) % pageSizeOptions.length;
                    const newPageSize = pageSizeOptions[nextIndex];
                    setCurrentPage(1); // Reset to first page when changing page size
                    // Update pageSize through a new state variable
                    setPageSize(newPageSize);
                  }}
                >
                  <Text style={styles.entriesDropdownText}>{pageSize}</Text>
                  <Text style={styles.entriesDropdownArrow}>▼</Text>
                </TouchableOpacity>
                <Text style={styles.entriesText}>Entries</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.headerRight}>
            <View style={styles.filterControls}>
              {/* Company Filter Dropdown */}
              <TouchableOpacity
                style={styles.filterDropdown}
                onPress={() => {
                  // Simple cycling through company options
                  const companyOptions = ['all', ...Array.from(new Set(employees.map(emp => emp.company_name).filter(Boolean))).sort()];
                  const currentIndex = companyOptions.indexOf(filterCompany);
                  const nextIndex = (currentIndex + 1) % companyOptions.length;
                  setFilterCompany(companyOptions[nextIndex]);
                }}
              >
                <Text style={styles.filterDropdownText} numberOfLines={1}>
                  {filterCompany === 'all' ? 'All Companies' : filterCompany}
                </Text>
                <Text style={styles.filterDropdownArrow}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Active Filter Indicator */}
        {filterCompany !== 'all' && (
          <View style={styles.filterIndicator}>
            <Text style={styles.filterIndicatorText}>
              Showing employees from: {filterCompany}
            </Text>
            <TouchableOpacity 
              onPress={() => setFilterCompany('all')}
              style={styles.clearFilterButton}
            >
              <Text style={styles.clearFilterText}>Clear Filter</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Professional Data Table with Horizontal Scroll */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={true} 
          style={styles.horizontalScrollContainer}
          contentContainerStyle={{ flexGrow: 1, flexDirection: 'column' }}
        >
          <View style={styles.dataTable}>
            {/* Table Header */}
            <View style={styles.dataTableHeader}>
              <View style={styles.checkboxColumn}>
                <TouchableOpacity onPress={handleSelectAllEmployees}>
                  <View style={styles.checkbox}>
                    {selectedEmployees.length === displayEmployees.length && displayEmployees.length > 0 && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
              <View style={styles.employeeColumn}>
                <Text style={styles.columnHeader}>Employee</Text>
              </View>
              <View style={styles.tradeColumn}>
                <Text style={styles.columnHeader}>Trade</Text>
              </View>
              <View style={styles.nationalityColumn}>
                <Text style={styles.columnHeader}>Nationality</Text>
              </View>
              <View style={styles.passportColumn}>
                <Text style={styles.columnHeader}>Passport No.</Text>
              </View>
              <View style={styles.labourcardColumn}>
                <Text style={styles.columnHeader}>Labour Card</Text>
              </View>
              <View style={styles.eidColumn}>
                <Text style={styles.columnHeader}>EID</Text>
              </View>
              <View style={styles.wccColumn}>
                <Text style={styles.columnHeader}>WCC</Text>
              </View>
              <View style={styles.expiryColumn}>
                <Text style={styles.columnHeader}>Expiry Date</Text>
              </View>
              <View style={styles.visaStatusColumn}>
                <Text style={styles.columnHeader}>Visa Status</Text>
              </View>
            </View>

            {/* Table Body */}
            <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={false}>
              {displayEmployees.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No employees found</Text>
                  <Text style={styles.emptyStateSubtext}>Try adjusting your search or filters</Text>
                </View>
              ) : (
                displayEmployees.map((employee, index) => (
                  <View 
                    key={employee.id || index}
                    style={[
                      styles.dataTableRow,
                      employee.employee_id && selectedEmployees.includes(employee.employee_id) && styles.selectedRow
                    ]}
                  >
                    <View style={styles.checkboxColumn}>
                      <TouchableOpacity 
                        style={styles.checkbox}
                        onPress={() => handleSelectEmployee(employee.employee_id)}
                      >
                        {employee.employee_id && selectedEmployees.includes(employee.employee_id) && (
                          <Text style={styles.checkmark}>✓</Text>
                        )}
                      </TouchableOpacity>
                    </View>

                    <View style={styles.employeeColumn}>
                      <TouchableOpacity onPress={() => navigateToEmployeeDetails(employee)}>
                        <Text style={[styles.cellText, styles.clickableEmployeeName]}>
                          {employee.name || 'N/A'}
                        </Text>
                        <Text style={[styles.cellText, { fontSize: 12, color: '#666' }]}>
                          ID: {employee.employee_id || 'N/A'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.tradeColumn}>
                      <Text style={styles.cellText}>{employee.trade || 'N/A'}</Text>
                    </View>

                    <View style={styles.nationalityColumn}>
                      <Text style={styles.cellText}>{employee.nationality || 'N/A'}</Text>
                    </View>

                    <View style={styles.passportColumn}>
                      <Text style={styles.cellText}>{employee.passport_no || 'N/A'}</Text>
                    </View>

                    <View style={styles.labourcardColumn}>
                      <Text style={styles.cellText}>{employee.labourcard_no || 'N/A'}</Text>
                    </View>

                    <View style={styles.eidColumn}>
                      <Text style={styles.cellText}>{employee.eid || 'N/A'}</Text>
                    </View>

                    <View style={styles.wccColumn}>
                      <Text style={styles.cellText}>{employee.wcc || 'N/A'}</Text>
                    </View>

                    <View style={styles.expiryColumn}>
                      <Text style={styles.cellText}>
                        {employee.visa_expiry_date ? formatDateDDMMYYYY(employee.visa_expiry_date) : 'N/A'}
                      </Text>
                    </View>

                    <View style={styles.visaStatusColumn}>
                      {employee.visa_expiry_date && renderStatusChip(getVisaStatusFromDate(employee.visa_expiry_date), 'visa')}
                    </View>

                    <View style={styles.actionsColumn}>
                      <IconButton 
                        icon="pencil" 
                        size={16} 
                        onPress={() => handleEdit(employee)} 
                      />
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </ScrollView>
        
        {/* Pagination Controls */}
        <View style={styles.paginationContainer}>
          <Text style={styles.paginationInfo}>
            Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredEmployees.length)} of {filteredEmployees.length} employees
          </Text>
          
          <View style={styles.paginationControls}>
            <TouchableOpacity
              style={[styles.paginationButton, currentPage === 1 && { opacity: 0.5 }]}
              onPress={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <Text style={styles.paginationButtonText}>Previous</Text>
            </TouchableOpacity>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <TouchableOpacity
                  key={pageNum}
                  style={[
                    styles.paginationButton,
                    currentPage === pageNum && styles.paginationButtonActive
                  ]}
                  onPress={() => setCurrentPage(pageNum)}
                >
                  <Text style={[
                    styles.paginationButtonText,
                    currentPage === pageNum && styles.paginationButtonTextActive
                  ]}>
                    {pageNum}
                  </Text>
                </TouchableOpacity>
              );
            })}
            
            <TouchableOpacity
              style={[styles.paginationButton, currentPage === totalPages && { opacity: 0.5 }]}
              onPress={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <Text style={styles.paginationButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <AdminLayout title="Employees" currentRoute="/admin/employees">
      <View style={[styles.container]}>
        {/* Search Bar */}
        <Surface style={styles.searchHeaderControls} elevation={1}>
          <Searchbar
            placeholder="Search employees..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            iconColor={CONSISTENT_COLORS.primary}
            clearIcon={searchQuery ? 'close' : undefined}
            onIconPress={() => setSearchQuery('')}
          />
          
          {/* Add Employee Button */}
          <Button
            mode="contained"
            onPress={() => setShowAddModal(true)}
            style={styles.addEmployeeButton}
            icon="plus"
            buttonColor={CONSISTENT_COLORS.primary}
          >
            Add Employee
          </Button>
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
            <View style={styles.emptyStateContainer}>
              <IconButton icon="account-group" size={64} iconColor={CONSISTENT_COLORS.gray} />
              <Text variant="titleMedium" style={styles.emptyStateTitle}>
                {snackbar ? 'Error loading employees' : 'No employees found'}
              </Text>
              <Text variant="bodyMedium" style={styles.emptyStateSubtitle}>
                {snackbar ? 'There was a problem loading employee data. Please try again.' : 'Try adjusting your filters or add a new employee.'}
              </Text>
              {snackbar ? (
                <Button mode="contained" onPress={handleRefresh} style={styles.emptyStateButton} icon="refresh">
                  Retry
                </Button>
              ) : (
                <Button mode="contained" onPress={() => setShowAddModal(true)} style={styles.emptyStateButton} icon="plus">
                  Add Employee
                </Button>
              )}
            </View>
          )}



        {/* Modern Success Animation */}
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
                    <Picker
                      selectedValue={newEmployee.company_name}
                      onValueChange={(value) => setNewEmployee({...newEmployee, company_name: value})}
                      style={{ backgroundColor: 'white', borderRadius: 8 }}
                    >
                      {companies.map((company) => (
                        <Picker.Item key={company} label={company} value={company} />
                      ))}
                    </Picker>
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
                    value={newEmployee.passport_no}
                    onChangeText={(text) => setNewEmployee({...newEmployee, passport_no: text})}
                    style={styles.modernInput}
                    mode="outlined"
                    placeholder="Enter passport number"
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
                  
                  <Picker
                    selectedValue={newEmployee.visa_status}
                    onValueChange={(value) => setNewEmployee({...newEmployee, visa_status: value})}
                  >
                    {VISA_STATUS_OPTIONS.map(option => (
                      <Picker.Item key={option.value} label={option.label} value={option.value} />
                    ))}
                  </Picker>
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
    backgroundColor: '#f5f5f5',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  modernSearchBar: {
    borderRadius: 8,
    elevation: 2,
    backgroundColor: '#ffffff',
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  filterChip: {
    marginRight: 6,
    marginBottom: 6,
  },
  viewModeContainer: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulkActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 8,
    borderRadius: 6,
    marginVertical: 6,
    marginHorizontal: 16,
  },
  bulkActionsText: {
    flex: 1,
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 13,
    color: '#1976D2',
  },
  gridContainer: {
    padding: 12,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  employeeCard: {
    flex: 1,
    marginHorizontal: 3,
    maxWidth: isMobile ? '100%' : '48%',
    minWidth: isMobile ? '100%' : 280,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginBottom: 6,
  },
  employeeCardContent: {
    padding: 10,
  },
  employeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  employeeInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  employeeName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 1,
  },
  clickableEmployeeName: {
    color: '#2563EB',
    textDecorationLine: 'underline',
  },
  employeeId: {
    fontSize: 11,
    color: '#666666',
  },
  employeeDetails: {
    flex: 1,
    marginLeft: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  detailLabel: {
    fontSize: 10,
    color: '#666666',
    flex: 1,
  },
  detailValue: {
    fontSize: 10,
    color: '#1a1a1a',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    marginLeft: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginTop: 6,
  },
  emptyStateButton: {
    marginTop: 6,
    minWidth: 140,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  // SUCCESS OVERLAY STYLES (FIXED)
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  successContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    margin: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22C55E',
    textAlign: 'center',
  },
  // MODAL STYLES (FIXED)
  modalContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modernModal: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 0,
    width: '100%',
    maxWidth: 500,
    maxHeight: Platform.OS === 'web' ? 500 : 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalContent: {
    maxHeight: Platform.OS === 'web' ? 300 : 250,
    paddingHorizontal: 20,
  },
  formSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  modernInput: {
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
  },
  dropdownContainer: {
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  sectionDivider: {
    marginVertical: 12,
  },
  modernModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  modernButton: {
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  // TABLE STYLES (FIXED)
  dataTable: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 2,
    marginTop: 12,
    minWidth: 1200,
  },
  dataTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  columnHeader: {
    fontSize: 10,
    fontWeight: '600',
    color: '#495057',
  },
  dataTableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
    alignItems: 'center',
    minHeight: 32,
  },
  selectedRow: {
    backgroundColor: '#E3F2FD',
  },
  checkboxColumn: {
    width: 40,
    alignItems: 'center',
  },
  employeeColumn: {
    width: 160,
  },
  tradeColumn: {
    width: 100,
  },
  nationalityColumn: {
    width: 100,
  },
  passportColumn: {
    width: 100,
  },
  labourcardColumn: {
    width: 100,
  },
  eidColumn: {
    width: 80,
  },
  wccColumn: {
    width: 80,
  },
  expiryColumn: {
    width: 100,
  },
  visaStatusColumn: {
    width: 100,
    alignItems: 'center',
  },
  actionsColumn: {
    width: 80,
    alignItems: 'center',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cellText: {
    fontSize: 10,
    color: '#495057',
  },
  horizontalScrollContainer: {
    flex: 1,
  },
  // TABLE HEADER STYLES
  tableContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 2,
    marginTop: 12,
    marginHorizontal: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {
    flex: 1,
  },
  titleContainer: {
    marginBottom: 6,
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  employeeCount: {
    fontSize: 12,
    color: '#666666',
  },
  entriesControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  entriesLabel: {
    fontSize: 12,
    color: '#666666',
    marginRight: 6,
  },
  entriesDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
  },
  entriesDropdownText: {
    fontSize: 12,
    color: '#1a1a1a',
    marginRight: 3,
  },
  entriesDropdownArrow: {
    fontSize: 8,
    color: '#666666',
  },
  entriesText: {
    fontSize: 12,
    color: '#666666',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  filterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: 120,
  },
  filterDropdownText: {
    fontSize: 12,
    color: '#1a1a1a',
    marginRight: 3,
    flex: 1,
  },
  filterDropdownArrow: {
    fontSize: 8,
    color: '#666666',
  },
  filterIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterIndicatorText: {
    fontSize: 10,
    color: '#666666',
    marginRight: 6,
  },
  clearFilterButton: {
    backgroundColor: '#dc3545',
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  clearFilterText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '500',
  },
  tableBody: {
    maxHeight: 500,
  },
  // SEARCH STYLES
  searchHeaderControls: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchBar: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#f8f9fa',
  },
  addEmployeeButton: {
    backgroundColor: '#2563EB',
  },
  content: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: 12,
    right: 0,
    bottom: 0,
    backgroundColor: '#2563EB',
  },
  snackbar: {
    backgroundColor: '#2563EB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
  },
  // PAGINATION STYLES
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  paginationInfo: {
    fontSize: 12,
    color: '#666666',
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paginationButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 2,
    borderRadius: 4,
    backgroundColor: '#f8f9fa',
  },
  paginationButtonActive: {
    backgroundColor: '#2563EB',
  },
  paginationButtonText: {
    fontSize: 12,
    color: '#666666',
  },
  paginationButtonTextActive: {
    color: '#ffffff',
  },
});


