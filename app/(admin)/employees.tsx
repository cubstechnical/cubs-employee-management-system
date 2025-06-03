import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, RefreshControl, TouchableOpacity, Platform, Animated, Alert, FlatList } from 'react-native';
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
  Badge,
  Checkbox,
  Tooltip,
} from 'react-native-paper';
import { router } from 'expo-router';
import { useEmployees } from '../../hooks/useEmployees';
import AdminLayout from '../../components/AdminLayout';
import { CustomTheme } from '../../theme';
import { Employee } from '../../types/employee';
import { sendVisaExpiryReminders } from '../../services/emailService';
import { DESIGN_SYSTEM } from '../../theme/designSystem';
import { withAuthGuard } from '../../components/AuthGuard';

const { width, height } = Dimensions.get('window');

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
  'AL MACEN TRADING & CONTRACTING W.L.L.',
  'Temporary Worker'
];

// Enhanced responsive breakpoints
const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
};

const isMobile = width <= BREAKPOINTS.mobile;
const isTablet = width <= BREAKPOINTS.tablet;

// ENHANCED: Professional status configuration
const STATUS_CONFIG = {
  all: { label: 'All Status', color: DESIGN_SYSTEM.colors.neutral[600], icon: 'format-list-bulleted' },
  active: { label: 'Active', color: DESIGN_SYSTEM.colors.success.main, icon: 'check-circle' },
  inactive: { label: 'Inactive', color: DESIGN_SYSTEM.colors.neutral[500], icon: 'close-circle' },
  expiring: { label: 'Visa Expiring', color: DESIGN_SYSTEM.colors.warning.main, icon: 'alert-circle' },
};

// ENHANCED: Sort options for professional use
const SORT_OPTIONS = [
  { value: 'name', label: 'Name (A-Z)', icon: 'sort-alphabetical-ascending' },
  { value: 'join_date', label: 'Join Date', icon: 'calendar-check' },
  { value: 'visa_expiry', label: 'Visa Expiry', icon: 'calendar-alert' },
  { value: 'company', label: 'Company', icon: 'domain' },
  { value: 'trade', label: 'Trade', icon: 'hammer-wrench' },
];

function EmployeesScreen() {
  const theme = useTheme() as CustomTheme;
  const { 
    employees, 
    isLoading, 
    refreshEmployees, 
    addEmployee, 
    updateEmployee, 
    deleteEmployee,
    availableTrades,
    availableCompanies,
  } = useEmployees();
  
  // ENHANCED: Professional state management
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<keyof typeof STATUS_CONFIG>('all');
  const [selectedTrade, setSelectedTrade] = useState<string>('all');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'join_date' | 'visa_expiry' | 'company' | 'trade'>('name');
  const [sortDirection, setSortDirection] = useState<'ascending' | 'descending'>('ascending');
  
  // UI State - Auto switch to cards on mobile
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(isMobile ? 'cards' : 'table');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [snackbar, setSnackbar] = useState('');
  
  // Menu states
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [tradeMenuVisible, setTradeMenuVisible] = useState(false);
  const [companyMenuVisible, setCompanyMenuVisible] = useState(false);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  
  // Table pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(isMobile ? 10 : 20);
  
  // Animation
  const [fadeAnimation] = useState(new Animated.Value(0));
  const [successAnimation] = useState(new Animated.Value(0));

  // Form state for add/edit
  const [formData, setFormData] = useState({
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

  // ENHANCED: Optimized filtered and sorted employees using useMemo
  const filteredAndSortedEmployees = useMemo(() => {
    if (!employees || employees.length === 0) return [];

    let filtered = [...employees];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(employee =>
        (employee.name || '').toLowerCase().includes(query) ||
        (employee.trade || '').toLowerCase().includes(query) ||
        (employee.company_name || '').toLowerCase().includes(query) ||
        (employee.email_id || '').toLowerCase().includes(query) ||
        (employee.employee_id || '').toLowerCase().includes(query) ||
        (employee.nationality || '').toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      switch (filterStatus) {
        case 'active':
          filtered = filtered.filter(emp => emp.is_active === true);
          break;
        case 'inactive':
          filtered = filtered.filter(emp => emp.is_active === false);
          break;
        case 'expiring':
          filtered = filtered.filter(emp => {
            if (!emp.visa_expiry_date) return false;
            const expiryDate = new Date(emp.visa_expiry_date);
            const today = new Date();
            const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
          });
          break;
      }
    }

    // Apply trade filter
    if (selectedTrade !== 'all') {
      filtered = filtered.filter(emp => emp.trade === selectedTrade);
    }

    // Apply company filter
    if (selectedCompany !== 'all') {
      filtered = filtered.filter(emp => emp.company_name === selectedCompany);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = '';
      let bValue: any = '';

      switch (sortBy) {
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'join_date':
          aValue = new Date(a.join_date || '');
          bValue = new Date(b.join_date || '');
          break;
        case 'visa_expiry':
          aValue = new Date(a.visa_expiry_date || '');
          bValue = new Date(b.visa_expiry_date || '');
          break;
        case 'company':
          aValue = (a.company_name || '').toLowerCase();
          bValue = (b.company_name || '').toLowerCase();
          break;
        case 'trade':
          aValue = (a.trade || '').toLowerCase();
          bValue = (b.trade || '').toLowerCase();
          break;
      }

      if (aValue < bValue) return sortDirection === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'ascending' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [employees, searchQuery, filterStatus, selectedTrade, selectedCompany, sortBy, sortDirection]);

  // ENHANCED: Paginated employees calculation
  const paginatedEmployees = useMemo(() => {
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedEmployees.slice(startIndex, endIndex);
  }, [filteredAndSortedEmployees, currentPage, itemsPerPage]);

  // Enhanced companies and trades lists
  const companiesList = useMemo(() => {
    const fromEmployees = employees ? [...new Set(employees.map(emp => emp.company_name).filter(Boolean))] : [];
    return [...new Set([...DEFAULT_COMPANIES, ...fromEmployees])].sort();
  }, [employees]);

  const tradesList = useMemo(() => {
    return employees ? [...new Set(employees.map(emp => emp.trade).filter(Boolean))].sort() : [];
  }, [employees]);

  useEffect(() => {
    Animated.timing(fadeAnimation, {
        toValue: 1,
      duration: 600,
        useNativeDriver: true,
    }).start();

    loadInitialData();
  }, []);

  useEffect(() => {
    // Reset pagination when filters change
    setCurrentPage(0);
  }, [searchQuery, filterStatus, selectedTrade, selectedCompany]);

  const loadInitialData = async () => {
    try {
        await refreshEmployees();
    } catch (error) {
      console.error('Error loading employees:', error);
      setSnackbar('Failed to load employees data');
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshEmployees();
      setSnackbar('Data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
      setSnackbar('Failed to refresh data');
    } finally {
    setRefreshing(false);
    }
  }, [refreshEmployees]);

  const triggerSuccessAnimation = useCallback(() => {
    Animated.sequence([
      Animated.timing(successAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(successAnimation, {
        toValue: 0,
        duration: 300,
        delay: 1500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ENHANCED: Professional add employee function
  const handleAddEmployee = async () => {
    if (!formData.name.trim() || !formData.email_id.trim()) {
      setSnackbar('Please fill in required fields');
        return;
      }

    try {
      await addEmployee(formData);
      resetForm();
      setShowAddModal(false);
      triggerSuccessAnimation();
      setSnackbar('Employee added successfully');
      await refreshEmployees();
    } catch (error) {
      console.error('Error adding employee:', error);
      setSnackbar('Failed to add employee');
    }
  };

  const handleEditEmployee = useCallback((employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name || '',
      trade: employee.trade || '',
      nationality: employee.nationality || '',
      date_of_birth: employee.date_of_birth || '',
      mobile_number: employee.mobile_number || '',
      email_id: employee.email_id || '',
      company_name: employee.company_name || '',
      join_date: employee.join_date || '',
      visa_expiry_date: employee.visa_expiry_date || '',
      passport_number: employee.passport_number || '',
      employee_id: employee.employee_id || '',
      visa_status: employee.visa_status || 'ACTIVE',
    });
    setShowAddModal(true);
  }, []);

  const handleDeleteEmployee = useCallback(async (employee: Employee) => {
    try {
      // Show confirmation dialog
      const confirmed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Delete Employee',
          `Are you sure you want to delete ${employee.name}? This action cannot be undone.`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
          ]
        );
      });

      if (confirmed) {
        await deleteEmployee(employee.id);
        triggerSuccessAnimation();
        setSnackbar('Employee deleted successfully');
        await refreshEmployees();
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      setSnackbar('Failed to delete employee');
    }
  }, [deleteEmployee, refreshEmployees, triggerSuccessAnimation]);

  const resetForm = useCallback(() => {
    setFormData({
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
    setEditingEmployee(null);
  }, []);

  // Utility functions
  const getVisaStatusColor = useCallback((status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return DESIGN_SYSTEM.colors.success.main;
      case 'expiring': return DESIGN_SYSTEM.colors.warning.main;
      case 'expired': return DESIGN_SYSTEM.colors.error.main;
      default: return DESIGN_SYSTEM.colors.neutral[500];
    }
  }, []);

  // ENHANCED: Get visa status with icon and color
  const getVisaStatus = useCallback((visaExpiryDate: string | null | undefined) => {
    if (!visaExpiryDate) {
      return {
        label: 'No Data',
        color: DESIGN_SYSTEM.colors.neutral[500],
        icon: 'help-circle'
      };
    }

    const today = new Date();
    const expiryDate = new Date(visaExpiryDate);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return {
        label: 'Expired',
        color: DESIGN_SYSTEM.colors.error.main,
        icon: 'alert-circle'
      };
    } else if (daysUntilExpiry <= 30) {
      return {
        label: 'Expiring Soon',
        color: DESIGN_SYSTEM.colors.warning.main,
        icon: 'calendar-alert'
      };
    } else {
      return {
        label: 'Valid',
        color: DESIGN_SYSTEM.colors.success.main,
        icon: 'check-circle'
      };
    }
  }, []);

  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-GB');
    } catch {
      return 'Invalid Date';
    }
  }, []);

  const navigateToEmployeeDetails = useCallback((employeeId: string) => {
    router.push(`/(admin)/employees/${employeeId}` as any);
  }, []);

  // ENHANCED: Handle sort functionality
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'ascending' ? 'descending' : 'ascending');
    } else {
      setSortBy(column as any);
      setSortDirection('ascending');
    }
  };

  // ENHANCED: Professional Header Section
  const renderHeader = () => (
    <Surface style={[styles.headerSection, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <View style={styles.headerTop}>
        <View style={styles.headerInfo}>
          <Text variant="headlineMedium" style={[styles.pageTitle, { 
            color: theme.colors.onSurface,
            fontSize: isMobile ? 20 : 26,
            fontWeight: 'bold',
            lineHeight: isMobile ? 22 : 28,
            marginBottom: isMobile ? 4 : 6,
          }]} numberOfLines={isMobile ? 1 : 1}>
            Employee Management
          </Text>
          <Text variant="bodyMedium" style={[styles.subtitle, { 
            color: theme.colors.onSurfaceVariant,
            fontSize: isMobile ? 12 : 14,
            lineHeight: isMobile ? 14 : 16,
            marginBottom: isMobile ? 8 : 10,
          }]} numberOfLines={isMobile ? 1 : 1}>
            Manage your workforce • {filteredAndSortedEmployees.length} employees
          </Text>
        </View>
        
        <View style={styles.headerActions}>
          <Button
            mode="outlined"
            icon="refresh"
            onPress={handleRefresh}
            loading={refreshing}
            style={[styles.refreshButton, { 
              borderColor: theme.colors.primary,
              borderWidth: 1.5,
              minHeight: isMobile ? 40 : 44,
              marginRight: isMobile ? 8 : 12,
            }]}
            labelStyle={{ 
              color: theme.colors.primary,
              fontWeight: '600',
              fontSize: isMobile ? 12 : 14,
            }}
            contentStyle={{ 
              height: isMobile ? 36 : 40,
              paddingHorizontal: isMobile ? 12 : 16,
            }}
            compact={isMobile}
          >
            {isMobile ? 'Refresh' : 'Refresh'}
          </Button>
          
          <Button
            mode="contained"
            icon="plus"
            onPress={() => router.push('/(admin)/employees/new')}
            style={[styles.addButton, { 
              backgroundColor: '#10B981',
              minHeight: isMobile ? 40 : 44,
            }]}
            labelStyle={{ 
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: isMobile ? 12 : 14,
            }}
            contentStyle={{ 
              height: isMobile ? 36 : 40,
              paddingHorizontal: isMobile ? 12 : 16,
            }}
            compact={isMobile}
          >
            {isMobile ? 'Add' : 'Add Employee'}
          </Button>
        </View>
      </View>
      
      {/* Enhanced Search Bar - Better Spacing */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search employees, trades, companies..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchInput, { 
            backgroundColor: theme.colors.surfaceVariant,
            height: isMobile ? 44 : 48,
            flex: 1,
            marginRight: isMobile ? 8 : 12,
          }]}
          iconColor={theme.colors.onSurfaceVariant}
          inputStyle={{ 
            color: theme.colors.onSurface,
            fontSize: isMobile ? 14 : 16,
          }}
          elevation={0}
        />
        
        <Button
          mode={showFilters ? "contained" : "outlined"}
          icon="filter-variant"
          onPress={() => setShowFilters(!showFilters)}
          style={[styles.filterToggle, {
            minHeight: isMobile ? 44 : 48,
            backgroundColor: showFilters ? theme.colors.primary : 'transparent',
            borderColor: theme.colors.primary,
            borderWidth: 1,
          }]}
          contentStyle={{
            height: isMobile ? 40 : 44,
            paddingHorizontal: isMobile ? 12 : 16,
          }}
          labelStyle={{
            fontSize: isMobile ? 12 : 14,
            color: showFilters ? '#ffffff' : theme.colors.primary,
            fontWeight: '600',
          }}
          compact={isMobile}
        >
          {isMobile ? 'Filter' : 'Filters'}
        </Button>
      </View>

      {/* Enhanced Filters Section - Improved Layout */}
      {showFilters && (
        <Animated.View
          style={[
            styles.filterSection,
            { 
              backgroundColor: theme.colors.surfaceVariant,
              opacity: fadeAnimation,
              paddingVertical: isMobile ? 12 : 16,
              paddingHorizontal: isMobile ? 8 : 12,
              borderRadius: isMobile ? 8 : 12,
              marginTop: isMobile ? 8 : 12,
            }
          ]}
        >
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.filterRow}
            contentContainerStyle={{ 
              gap: isMobile ? 8 : 12,
              paddingHorizontal: isMobile ? 4 : 8,
            }}
          >
            {/* Status Filter */}
            <Menu
              visible={statusMenuVisible}
              onDismiss={() => setStatusMenuVisible(false)}
              anchor={
                <Chip
                  icon={STATUS_CONFIG[filterStatus].icon}
                  onPress={() => setStatusMenuVisible(true)}
                  selected={filterStatus !== 'all'}
                  style={[styles.filterChip, { 
                    backgroundColor: theme.colors.surface,
                    height: isMobile ? 36 : 40,
                    borderWidth: 1,
                    borderColor: filterStatus !== 'all' ? theme.colors.primary : theme.colors.outline,
                  }]}
                  textStyle={{
                    fontSize: isMobile ? 12 : 14,
                    fontWeight: '600',
                    color: filterStatus !== 'all' ? theme.colors.primary : theme.colors.onSurface,
                  }}
                >
                  {isMobile && filterStatus !== 'all' ? STATUS_CONFIG[filterStatus].label.split(' ')[0] : STATUS_CONFIG[filterStatus].label}
                </Chip>
              }
            >
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <Menu.Item
                  key={key}
                  onPress={() => {
                    setFilterStatus(key as keyof typeof STATUS_CONFIG);
                    setStatusMenuVisible(false);
                  }}
                  title={config.label}
                  leadingIcon={config.icon}
                />
              ))}
            </Menu>

            {/* Trade Filter */}
            <Menu
              visible={tradeMenuVisible}
              onDismiss={() => setTradeMenuVisible(false)}
              anchor={
                <Chip
                  icon="hammer-wrench"
                  onPress={() => setTradeMenuVisible(true)}
                  selected={selectedTrade !== 'all'}
                  style={[styles.filterChip, { 
                    backgroundColor: theme.colors.surface,
                    height: isMobile ? 36 : 40,
                    borderWidth: 1,
                    borderColor: selectedTrade !== 'all' ? theme.colors.primary : theme.colors.outline,
                  }]}
                  textStyle={{
                    fontSize: isMobile ? 12 : 14,
                    fontWeight: '600',
                    color: selectedTrade !== 'all' ? theme.colors.primary : theme.colors.onSurface,
                  }}
                >
                  {selectedTrade === 'all' ? (isMobile ? 'Trades' : 'All Trades') : (isMobile ? selectedTrade.substring(0, 8) + '...' : selectedTrade)}
                </Chip>
              }
            >
              <Menu.Item
                onPress={() => {
                  setSelectedTrade('all');
                  setTradeMenuVisible(false);
                }}
                title="All Trades"
                leadingIcon="format-list-bulleted"
              />
              {tradesList.map((trade) => (
                <Menu.Item
                  key={trade}
                  onPress={() => {
                    setSelectedTrade(trade);
                    setTradeMenuVisible(false);
                  }}
                  title={trade}
                  leadingIcon="hammer-wrench"
                />
              ))}
            </Menu>

            {/* Company Filter */}
            <Menu
              visible={companyMenuVisible}
              onDismiss={() => setCompanyMenuVisible(false)}
              anchor={
                <Chip
                  icon="domain"
                  onPress={() => setCompanyMenuVisible(true)}
                  selected={selectedCompany !== 'all'}
                  style={[styles.filterChip, { 
                    backgroundColor: theme.colors.surface,
                    height: isMobile ? 36 : 40,
                    borderWidth: 1,
                    borderColor: selectedCompany !== 'all' ? theme.colors.primary : theme.colors.outline,
                  }]}
                  textStyle={{
                    fontSize: isMobile ? 12 : 14,
                    fontWeight: '600',
                    color: selectedCompany !== 'all' ? theme.colors.primary : theme.colors.onSurface,
                  }}
                >
                  {selectedCompany === 'all' ? (isMobile ? 'Companies' : 'All Companies') : (isMobile ? selectedCompany.substring(0, 10) + '...' : selectedCompany.length > 20 ? `${selectedCompany.substring(0, 20)}...` : selectedCompany)}
                </Chip>
              }
            >
              <Menu.Item
                onPress={() => {
                  setSelectedCompany('all');
                  setCompanyMenuVisible(false);
                }}
                title="All Companies"
                leadingIcon="format-list-bulleted"
              />
              {companiesList.map((company) => (
                <Menu.Item
                  key={company}
                  onPress={() => {
                    setSelectedCompany(company);
                    setCompanyMenuVisible(false);
                  }}
                  title={company}
                  leadingIcon="domain"
                />
              ))}
            </Menu>

            {/* Sort Filter */}
            <Menu
              visible={sortMenuVisible}
              onDismiss={() => setSortMenuVisible(false)}
              anchor={
                <Chip
                  icon={SORT_OPTIONS.find(opt => opt.value === sortBy)?.icon || 'sort'}
                  onPress={() => setSortMenuVisible(true)}
                  style={[styles.filterChip, { 
                    backgroundColor: theme.colors.surface,
                    height: isMobile ? 36 : 40,
                    borderWidth: 1,
                    borderColor: theme.colors.outline,
                  }]}
                  textStyle={{
                    fontSize: isMobile ? 12 : 14,
                    fontWeight: '600',
                    color: theme.colors.onSurface,
                  }}
                >
                  {isMobile ? 'Sort' : (SORT_OPTIONS.find(opt => opt.value === sortBy)?.label || 'Sort')}
                </Chip>
              }
            >
              {SORT_OPTIONS.map((option) => (
                <Menu.Item
                  key={option.value}
                  onPress={() => {
                    if (sortBy === option.value) {
                      setSortDirection(sortDirection === 'ascending' ? 'descending' : 'ascending');
                    } else {
                      setSortBy(option.value as any);
                      setSortDirection('ascending');
                    }
                    setSortMenuVisible(false);
                  }}
                  title={`${option.label} ${sortBy === option.value ? (sortDirection === 'ascending' ? '↑' : '↓') : ''}`}
                  leadingIcon={option.icon}
                />
              ))}
            </Menu>

            {/* Clear Filters */}
            <Chip
              icon="filter-remove"
              onPress={() => {
                setFilterStatus('all');
                setSelectedTrade('all');
                setSelectedCompany('all');
                setSortBy('name');
                setSortDirection('ascending');
                setSearchQuery('');
              }}
              style={[styles.filterChip, { 
                backgroundColor: theme.colors.errorContainer,
                height: isMobile ? 36 : 40,
                borderWidth: 1,
                borderColor: theme.colors.error,
              }]}
              textStyle={{ 
                color: theme.colors.onErrorContainer,
                fontSize: isMobile ? 12 : 14,
                fontWeight: '600',
              }}
            >
              {isMobile ? 'Clear' : 'Clear All'}
            </Chip>
          </ScrollView>
        </Animated.View>
      )}

      {/* View Mode Toggle - Enhanced Layout */}
      <View style={styles.viewModeSection}>
        <View style={styles.viewModeContainer}>
          <SegmentedButtons
            value={viewMode}
            onValueChange={(value) => setViewMode(value as 'table' | 'cards')}
            buttons={[
              {
                value: 'table',
                label: isMobile ? 'Table' : 'Table View',
                icon: 'table',
                style: { paddingVertical: isMobile ? 8 : 10 },
              },
              {
                value: 'cards',
                label: isMobile ? 'Cards' : 'Card View',
                icon: 'card-text',
                style: { paddingVertical: isMobile ? 8 : 10 },
              },
            ]}
            style={[styles.viewModeToggle, {
              height: isMobile ? 40 : 44,
              flex: isMobile ? 1 : 0,
              minWidth: isMobile ? '100%' : 250,
            }]}
            density={isMobile ? 'small' : 'regular'}
          />
          
          <Text variant="bodySmall" style={[styles.resultCount, { 
            color: theme.colors.onSurfaceVariant,
            fontSize: isMobile ? 11 : 12,
            marginTop: isMobile ? 8 : 0,
            marginLeft: isMobile ? 0 : 16,
            textAlign: isMobile ? 'center' : 'right',
          }]}>
            {Math.min(filteredAndSortedEmployees.length, itemsPerPage)} of {filteredAndSortedEmployees.length} employees
          </Text>
        </View>
      </View>
    </Surface>
  );

  // ENHANCED: Professional Employee Table with Fixed Layout and Full Columns
  const renderTable = () => (
    <View style={styles.tableScrollView}>
      <Surface style={[styles.tableContainer, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <DataTable style={styles.dataTable}>
          {/* Enhanced Table Header with All Columns */}
          <DataTable.Header style={[styles.tableHeader, { 
            backgroundColor: theme.colors.surfaceVariant,
            borderBottomWidth: 2,
            borderBottomColor: theme.colors.outline,
            minHeight: isMobile ? 48 : 56,
          }]}>
            <DataTable.Title 
              style={[styles.nameColumn, { 
                flex: isMobile ? 2 : 2.5,
                minWidth: isMobile ? 100 : 140,
                justifyContent: 'flex-start',
              }]}
              textStyle={[styles.headerText, { 
                color: theme.colors.onSurfaceVariant,
                fontWeight: 'bold',
                fontSize: isMobile ? 11 : 14,
              }]}
              sortDirection={sortBy === 'name' ? sortDirection : undefined}
              onPress={() => handleSort('name')}
            >
              Employee
            </DataTable.Title>
            
            <DataTable.Title 
              style={[styles.emailColumn, { 
                flex: isMobile ? 1.8 : 2,
                minWidth: isMobile ? 90 : 120,
                justifyContent: 'center',
              }]}
              textStyle={[styles.headerText, { 
                color: theme.colors.onSurfaceVariant,
                fontWeight: 'bold',
                fontSize: isMobile ? 11 : 14,
              }]}
            >
              Email
            </DataTable.Title>
            
            <DataTable.Title 
              style={[styles.mobileColumn, { 
                flex: isMobile ? 1.2 : 1.5,
                minWidth: isMobile ? 80 : 110,
                justifyContent: 'center',
              }]}
              textStyle={[styles.headerText, { 
                color: theme.colors.onSurfaceVariant,
                fontWeight: 'bold',
                fontSize: isMobile ? 11 : 14,
              }]}
            >
              Mobile
            </DataTable.Title>
            
            <DataTable.Title 
              style={[styles.tradeColumn, { 
                flex: isMobile ? 1.2 : 1.5,
                minWidth: isMobile ? 70 : 100,
                justifyContent: 'center',
              }]}
              textStyle={[styles.headerText, { 
                color: theme.colors.onSurfaceVariant,
                fontWeight: 'bold',
                fontSize: isMobile ? 11 : 14,
              }]}
              sortDirection={sortBy === 'trade' ? sortDirection : undefined}
              onPress={() => handleSort('trade')}
            >
              Trade
            </DataTable.Title>
            
            <DataTable.Title 
              style={[styles.companyColumn, { 
                flex: isMobile ? 1.5 : 2,
                minWidth: isMobile ? 90 : 130,
                justifyContent: 'center',
              }]}
              textStyle={[styles.headerText, { 
                color: theme.colors.onSurfaceVariant,
                fontWeight: 'bold',
                fontSize: isMobile ? 11 : 14,
              }]}
              sortDirection={sortBy === 'company' ? sortDirection : undefined}
              onPress={() => handleSort('company')}
            >
              Company
            </DataTable.Title>
            
            <DataTable.Title 
              style={[styles.visaColumn, { 
                flex: isMobile ? 1.2 : 1.5,
                minWidth: isMobile ? 80 : 100,
                justifyContent: 'center',
              }]}
              textStyle={[styles.headerText, { 
                color: theme.colors.onSurfaceVariant,
                fontWeight: 'bold',
                fontSize: isMobile ? 11 : 14,
              }]}
              sortDirection={sortBy === 'visa_expiry' ? sortDirection : undefined}
              onPress={() => handleSort('visa_expiry')}
            >
              Visa
            </DataTable.Title>
            
            <DataTable.Title 
              style={[styles.statusColumn, { 
                flex: isMobile ? 1 : 1.2,
                minWidth: isMobile ? 60 : 80,
                justifyContent: 'center',
              }]}
              textStyle={[styles.headerText, { 
                color: theme.colors.onSurfaceVariant,
                fontWeight: 'bold',
                fontSize: isMobile ? 11 : 14,
              }]}
            >
              Status
            </DataTable.Title>
            
            <DataTable.Title 
              style={[styles.actionsColumn, { 
                flex: isMobile ? 1.5 : 2,
                minWidth: isMobile ? 80 : 120,
                justifyContent: 'center',
              }]}
              textStyle={[styles.headerText, { 
                color: theme.colors.onSurfaceVariant,
                fontWeight: 'bold',
                fontSize: isMobile ? 11 : 14,
              }]}
            >
              Actions
            </DataTable.Title>
          </DataTable.Header>

          {/* Enhanced Table Rows with All Columns */}
          {paginatedEmployees.map((employee, index) => {
            const isEvenRow = index % 2 === 0;
            const rowBackgroundColor = isEvenRow 
              ? theme.colors.surface 
              : `${theme.colors.surfaceVariant}40`;
            
            return (
              <DataTable.Row 
                key={employee.id} 
                style={[styles.tableRow, { 
                  backgroundColor: rowBackgroundColor,
                  borderBottomWidth: 1,
                  borderBottomColor: `${theme.colors.outline}20`,
                  minHeight: isMobile ? 56 : 64,
                }]}
              >
                {/* Employee Name & Avatar Cell */}
                <DataTable.Cell 
                  style={[styles.nameColumn, { 
                    flex: isMobile ? 2 : 2.5,
                    minWidth: isMobile ? 100 : 140,
                    paddingLeft: isMobile ? 4 : 8,
                  }]}
                >
                  <View style={styles.employeeInfo}>
                    <Avatar.Text 
                      size={isMobile ? 28 : 36} 
                      label={employee.name?.charAt(0) || 'E'}
                      style={[styles.avatar, { 
                        backgroundColor: employee.is_active ? DESIGN_SYSTEM.colors.success.main : DESIGN_SYSTEM.colors.neutral[500],
                        marginRight: isMobile ? 6 : 10,
                      }]}
                      labelStyle={{ 
                        color: '#ffffff',
                        fontSize: isMobile ? 10 : 14,
                        fontWeight: 'bold',
                      }}
                    />
                    <View style={styles.nameInfo}>
                      <Text 
                        variant="bodyMedium" 
                        style={[styles.employeeName, { 
                          color: theme.colors.onSurface,
                          fontWeight: '600',
                          fontSize: isMobile ? 12 : 14,
                          marginBottom: 1,
                        }]}
                        numberOfLines={1}
                      >
                        {employee.name}
                      </Text>
                      <Text 
                        variant="bodySmall" 
                        style={[styles.employeeId, { 
                          color: theme.colors.onSurfaceVariant,
                          fontSize: isMobile ? 9 : 11,
                        }]}
                        numberOfLines={1}
                      >
                        {employee.employee_id}
                      </Text>
                    </View>
                  </View>
                </DataTable.Cell>

                {/* Email Cell */}
                <DataTable.Cell 
                  style={[styles.emailColumn, { 
                    flex: isMobile ? 1.8 : 2,
                    minWidth: isMobile ? 90 : 120,
                    justifyContent: 'center',
                  }]}
                >
                  <Text 
                    variant="bodySmall" 
                    style={[styles.emailText, { 
                      color: theme.colors.onSurface,
                      fontSize: isMobile ? 10 : 12,
                      textAlign: 'center',
                    }]}
                    numberOfLines={1}
                  >
                    {employee.email_id || 'N/A'}
                  </Text>
                </DataTable.Cell>

                {/* Mobile Cell */}
                <DataTable.Cell 
                  style={[styles.mobileColumn, { 
                    flex: isMobile ? 1.2 : 1.5,
                    minWidth: isMobile ? 80 : 110,
                    justifyContent: 'center',
                  }]}
                >
                  <Text 
                    variant="bodySmall" 
                    style={[styles.mobileText, { 
                      color: theme.colors.onSurface,
                      fontSize: isMobile ? 10 : 12,
                      textAlign: 'center',
                    }]}
                    numberOfLines={1}
                  >
                    {employee.mobile_number || 'N/A'}
                  </Text>
                </DataTable.Cell>

                {/* Trade Cell */}
                <DataTable.Cell 
                  style={[styles.tradeColumn, { 
                    flex: isMobile ? 1.2 : 1.5,
                    minWidth: isMobile ? 70 : 100,
                    justifyContent: 'center',
                  }]}
                >
                  <Chip
                    icon="hammer-wrench"
                    style={[styles.tradeChip, { 
                      backgroundColor: theme.colors.secondaryContainer,
                      height: isMobile ? 24 : 28,
                      borderRadius: isMobile ? 12 : 14,
                    }]}
                    textStyle={{ 
                      color: theme.colors.onSecondaryContainer,
                      fontSize: isMobile ? 9 : 11,
                      fontWeight: '600',
                    }}
                    compact
                  >
                    {isMobile && employee.trade && employee.trade.length > 6 
                      ? `${employee.trade.substring(0, 4)}...` 
                      : employee.trade || 'N/A'}
                  </Chip>
                </DataTable.Cell>

                {/* Company Cell */}
                <DataTable.Cell 
                  style={[styles.companyColumn, { 
                    flex: isMobile ? 1.5 : 2,
                    minWidth: isMobile ? 90 : 130,
                    justifyContent: 'center',
                  }]}
                >
                  <Text 
                    variant="bodySmall" 
                    style={[styles.companyText, { 
                      color: theme.colors.onSurface,
                      fontSize: isMobile ? 10 : 12,
                      fontWeight: '500',
                      textAlign: 'center',
                    }]}
                    numberOfLines={1}
                  >
                    {isMobile && employee.company_name && employee.company_name.length > 8
                      ? `${employee.company_name.substring(0, 6)}...`
                      : employee.company_name || 'N/A'}
                  </Text>
                </DataTable.Cell>

                {/* Visa Status Cell */}
                <DataTable.Cell 
                  style={[styles.visaColumn, { 
                    flex: isMobile ? 1.2 : 1.5,
                    minWidth: isMobile ? 80 : 100,
                    justifyContent: 'center',
                  }]}
                >
                  <Chip
                    icon={getVisaStatus(employee.visa_expiry_date).icon}
                    style={[styles.visaChip, { 
                      backgroundColor: getVisaStatus(employee.visa_expiry_date).color,
                      height: isMobile ? 24 : 28,
                      borderRadius: isMobile ? 12 : 14,
                    }]}
                    textStyle={{ 
                      color: '#ffffff',
                      fontSize: isMobile ? 8 : 10,
                      fontWeight: 'bold',
                    }}
                    compact
                  >
                    {isMobile 
                      ? getVisaStatus(employee.visa_expiry_date).label.split(' ')[0]
                      : getVisaStatus(employee.visa_expiry_date).label}
                  </Chip>
                </DataTable.Cell>

                {/* Status Cell */}
                <DataTable.Cell 
                  style={[styles.statusColumn, { 
                    flex: isMobile ? 1 : 1.2,
                    minWidth: isMobile ? 60 : 80,
                    justifyContent: 'center',
                  }]}
                >
                  <Chip
                    icon={employee.is_active ? 'check-circle' : 'close-circle'}
                    style={[styles.statusChip, { 
                      backgroundColor: employee.is_active ? DESIGN_SYSTEM.colors.success.main : DESIGN_SYSTEM.colors.neutral[500],
                      height: isMobile ? 24 : 28,
                      borderRadius: isMobile ? 12 : 14,
                    }]}
                    textStyle={{ 
                      color: '#ffffff',
                      fontSize: isMobile ? 8 : 10,
                      fontWeight: 'bold',
                    }}
                    compact
                  >
                    {employee.is_active ? 'Active' : 'Inactive'}
                  </Chip>
                </DataTable.Cell>

                {/* Enhanced Actions Cell with View, Edit, Delete */}
                <DataTable.Cell 
                  style={[styles.actionsColumn, { 
                    flex: isMobile ? 1.5 : 2,
                    minWidth: isMobile ? 80 : 120,
                    justifyContent: 'center',
                  }]}
                >
                  <View style={styles.actionButtons}>
                    <IconButton
                      icon="eye"
                      size={isMobile ? 16 : 20}
                      onPress={() => router.push(`/(admin)/employees/${employee.id}`)}
                      iconColor={theme.colors.primary}
                      style={[styles.actionButton, { 
                        backgroundColor: `${theme.colors.primary}15`,
                        margin: isMobile ? 1 : 2,
                      }]}
                      containerColor="transparent"
                    />
                    <IconButton
                      icon="pencil"
                      size={isMobile ? 16 : 20}
                      onPress={() => handleEditEmployee(employee)}
                      iconColor={DESIGN_SYSTEM.colors.warning.main}
                      style={[styles.actionButton, { 
                        backgroundColor: `${DESIGN_SYSTEM.colors.warning.main}15`,
                        margin: isMobile ? 1 : 2,
                      }]}
                      containerColor="transparent"
                    />
                    <IconButton
                      icon="delete"
                      size={isMobile ? 16 : 20}
                      onPress={() => handleDeleteEmployee(employee)}
                      iconColor={DESIGN_SYSTEM.colors.error.main}
                      style={[styles.actionButton, { 
                        backgroundColor: `${DESIGN_SYSTEM.colors.error.main}15`,
                        margin: isMobile ? 1 : 2,
                      }]}
                      containerColor="transparent"
                    />
                  </View>
                </DataTable.Cell>
              </DataTable.Row>
            );
          })}
        </DataTable>

        {/* Enhanced Pagination */}
        <DataTable.Pagination
          page={currentPage}
          numberOfPages={Math.ceil(filteredAndSortedEmployees.length / itemsPerPage)}
          onPageChange={setCurrentPage}
          label={`${Math.min((currentPage * itemsPerPage) + 1, filteredAndSortedEmployees.length)}-${Math.min((currentPage + 1) * itemsPerPage, filteredAndSortedEmployees.length)} of ${filteredAndSortedEmployees.length}`}
          numberOfItemsPerPageList={[10, 20, 50]}
          numberOfItemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          showFastPaginationControls
          selectPageDropdownLabel="Rows per page"
          style={[styles.pagination, { 
            backgroundColor: theme.colors.surfaceVariant,
            paddingVertical: isMobile ? 12 : 16,
            paddingHorizontal: isMobile ? 8 : 16,
            borderTopWidth: 1,
            borderTopColor: theme.colors.outline,
          }]}
        />
      </Surface>
    </View>
  );

  // Enhanced Cards View for mobile with consistent data
  const renderCardsView = () => (
    <FlatList
      data={filteredAndSortedEmployees.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)}
      renderItem={({ item: employee }) => (
        <Card style={[styles.employeeCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <View style={styles.cardEmployeeInfo}>
                <Avatar.Text 
                  size={40} 
                  label={(employee.name || 'N').charAt(0).toUpperCase()} 
                  style={{ 
                    backgroundColor: employee.is_active ? DESIGN_SYSTEM.colors.success.main : DESIGN_SYSTEM.colors.neutral[500] 
                  }}
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                />
                <View style={styles.cardEmployeeDetails}>
                  <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                    {employee.name || 'N/A'}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    ID: {employee.employee_id || 'No ID'}
                  </Text>
                </View>
              </View>
              <Chip
                icon={employee.is_active ? 'check-circle' : 'close-circle'}
                style={[
                  styles.cardStatusBadge,
                  { backgroundColor: employee.is_active ? DESIGN_SYSTEM.colors.success.main : DESIGN_SYSTEM.colors.neutral[500] }
                ]}
                textStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                compact
              >
                {employee.is_active ? 'Active' : 'Inactive'}
              </Chip>
            </View>
            
            <Divider style={styles.cardDivider} />
            
            <View style={styles.cardContent}>
              <View style={styles.cardInfoRow}>
                <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Email:</Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, flex: 1, textAlign: 'right' }} numberOfLines={1}>
                  {employee.email_id || 'N/A'}
                </Text>
              </View>
              <View style={styles.cardInfoRow}>
                <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Mobile:</Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, flex: 1, textAlign: 'right' }} numberOfLines={1}>
                  {employee.mobile_number || 'N/A'}
                </Text>
              </View>
              <View style={styles.cardInfoRow}>
                <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Company:</Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, flex: 1, textAlign: 'right' }} numberOfLines={1}>
                  {employee.company_name || 'N/A'}
                </Text>
              </View>
              <View style={styles.cardInfoRow}>
                <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Trade:</Text>
                <Chip compact style={{ backgroundColor: theme.colors.secondaryContainer }}>
                  {employee.trade || 'N/A'}
                </Chip>
              </View>
              <View style={styles.cardInfoRow}>
                <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Visa Status:</Text>
                <Chip 
                  compact 
                  style={{ 
                    backgroundColor: getVisaStatus(employee.visa_expiry_date).color 
                  }}
                  textStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                >
                  {getVisaStatus(employee.visa_expiry_date).label}
                </Chip>
              </View>
              <View style={styles.cardInfoRow}>
                <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Visa Expiry:</Text>
                <Text variant="bodyMedium" style={{ 
                  color: employee.visa_expiry_date && new Date(employee.visa_expiry_date) < new Date() ? 
                    DESIGN_SYSTEM.colors.error.main : theme.colors.onSurface,
                  flex: 1,
                  textAlign: 'right'
                }}>
                  {formatDate(employee.visa_expiry_date || '')}
                </Text>
              </View>
            </View>
          </Card.Content>
          
          <Card.Actions style={styles.cardActions}>
            <Button 
              mode="outlined" 
              onPress={() => navigateToEmployeeDetails(employee.id)} 
              compact
              icon="eye"
              style={styles.cardActionButton}
            >
              View
            </Button>
            <Button 
              mode="outlined" 
              onPress={() => handleEditEmployee(employee)} 
              compact
              icon="pencil"
              style={styles.cardActionButton}
              textColor={DESIGN_SYSTEM.colors.warning.main}
            >
              Edit
            </Button>
            <Button 
              mode="outlined" 
              onPress={() => handleDeleteEmployee(employee)} 
              compact
              icon="delete"
              style={styles.cardActionButton}
              textColor={DESIGN_SYSTEM.colors.error.main}
            >
              Delete
            </Button>
          </Card.Actions>
        </Card>
      )}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.cardsContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    />
  );

  // Loading state
  if (isLoading && !employees) {
    return (
      <AdminLayout title="Employees" currentRoute="/(admin)/employees">
        <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator size="large" color={DESIGN_SYSTEM.colors.primary[500]} />
          <Text variant="bodyLarge" style={[styles.loadingText, { color: theme.colors.onSurface }]}>
                Loading employees...
              </Text>
          </View>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Employee Management" currentRoute="/(admin)/employees">
      <Animated.View style={[styles.container, { opacity: fadeAnimation, backgroundColor: theme.colors.background }]}>
        {renderHeader()}
        
        <View style={styles.content}>
          {filteredAndSortedEmployees.length === 0 ? (
            <Surface style={[styles.emptyState, { backgroundColor: theme.colors.surface }]} elevation={1}>
              <IconButton
                icon="account-group-outline"
                size={64}
                iconColor={theme.colors.onSurfaceVariant}
              />
              <Text variant="headlineSmall" style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
                No employees found
              </Text>
              <Text variant="bodyMedium" style={[styles.emptyMessage, { color: theme.colors.onSurfaceVariant }]}>
                {employees && employees.length > 0 
                  ? 'Try adjusting your filters or search criteria'
                  : 'Get started by adding your first employee'
                }
              </Text>
                <Button 
                  mode="contained" 
                  icon="plus"
                onPress={() => setShowAddModal(true)}
                style={[styles.emptyAction, { backgroundColor: DESIGN_SYSTEM.colors.primary[500] }]}
                >
                Add First Employee
                </Button>
            </Surface>
          ) : (
            viewMode === 'table' ? renderTable() : renderCardsView()
              )}
            </View>

        {/* Add/Edit Employee Modal */}
        <Portal>
          <Modal
            visible={showAddModal}
            onDismiss={() => {
              setShowAddModal(false);
              resetForm();
            }}
            contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text variant="headlineSmall" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
              </Text>
              
              <View style={styles.formContainer}>
                {/* Form fields would go here - abbreviated for space */}
                  <TextInput
                    label="Full Name *"
                  value={formData.name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                    mode="outlined"
                  style={styles.formInput}
                />
                  
                  <TextInput
                    label="Email Address *"
                  value={formData.email_id}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, email_id: text }))}
                    mode="outlined"
                    keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.formInput}
                />
                
                {/* Additional form fields... */}
                </View>

              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  style={styles.cancelButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleAddEmployee}
                  loading={isLoading}
                  style={[styles.saveButton, { backgroundColor: DESIGN_SYSTEM.colors.primary[500] }]}
                >
                  {editingEmployee ? 'Update' : 'Add'} Employee
                </Button>
              </View>
            </ScrollView>
          </Modal>
        </Portal>

        {/* Success Animation Overlay */}
        <Animated.View
          style={[
            styles.successOverlay,
            {
              opacity: successAnimation,
              backgroundColor: 'rgba(0,0,0,0.8)',
            }
          ]}
          pointerEvents="none"
        >
          <Surface style={styles.successCard} elevation={5}>
            <IconButton
              icon="check-circle"
              size={48}
              iconColor={DESIGN_SYSTEM.colors.success.main}
            />
            <Text variant="titleMedium" style={[styles.successText, { color: theme.colors.onSurface }]}>
              Operation Successful!
            </Text>
          </Surface>
        </Animated.View>

        {/* Snackbar for notifications */}
        <Snackbar
          visible={!!snackbar}
          onDismiss={() => setSnackbar('')}
          duration={4000}
          action={{
            label: 'Dismiss',
            onPress: () => setSnackbar(''),
            labelStyle: { color: '#ffffff' }
          }}
          style={[
            snackbar.includes('success') || snackbar.includes('created') || snackbar.includes('updated') 
              ? styles.successSnackbar 
              : styles.errorSnackbar
          ]}
        >
          <Text style={styles.snackbarText}>
            {snackbar}
          </Text>
        </Snackbar>
      </Animated.View>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    paddingHorizontal: isMobile ? 8 : 16,
    paddingTop: isMobile ? 8 : 16,
  },
  
  // Header Styles - Mobile Optimized
  headerSection: {
    marginBottom: isMobile ? 12 : 16,
    paddingHorizontal: isMobile ? 12 : 16,
    paddingVertical: isMobile ? 12 : 16,
  },
  headerTop: {
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'flex-start' : 'center',
    marginBottom: isMobile ? 12 : 16,
  },
  headerInfo: {
    flex: isMobile ? 0 : 1,
    marginBottom: isMobile ? 12 : 0,
  },
  pageTitle: {
    fontWeight: 'bold',
  },
  subtitle: {
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isMobile ? 8 : 12,
  },
  refreshButton: {
    borderRadius: 8,
  },
  addButton: {
    borderRadius: 8,
  },
  
  // Search and Filter Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: isMobile ? 8 : 12,
    gap: isMobile ? 8 : 12,
  },
  searchInput: {
    borderRadius: 8,
  },
  filterToggle: {
    borderRadius: 8,
  },
  filterSection: {
    borderRadius: 8,
  },
  filterRow: {
    flexDirection: 'row',
  },
  filterChip: {
    marginRight: isMobile ? 6 : 8,
  },
  
  // View Mode Styles
  viewModeSection: {
    marginTop: isMobile ? 8 : 12,
    paddingHorizontal: isMobile ? 4 : 8,
  },
  viewModeContainer: {
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'stretch' : 'center',
    gap: isMobile ? 8 : 12,
  },
  viewModeToggle: {
    borderRadius: 8,
  },
  resultCount: {
    fontWeight: '500',
  },
  
  // Table Styles
  tableScrollView: {
    flex: 1,
  },
  tableContainer: {
    borderRadius: isMobile ? 8 : 12,
    overflow: 'hidden',
  },
  dataTable: {
    minWidth: '100%',
  },
  tableHeader: {
    paddingHorizontal: isMobile ? 4 : 8,
  },
  headerText: {
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  tableRow: {
    paddingHorizontal: isMobile ? 4 : 8,
  },
  
  // Column Styles
  nameColumn: {
    flex: 2,
    minWidth: isMobile ? 100 : 140,
  },
  emailColumn: {
    flex: 1.8,
    minWidth: isMobile ? 90 : 120,
  },
  mobileColumn: {
    flex: 1.2,
    minWidth: isMobile ? 80 : 110,
  },
  tradeColumn: {
    flex: 1.2,
    minWidth: isMobile ? 70 : 100,
  },
  companyColumn: {
    flex: 1.5,
    minWidth: isMobile ? 90 : 130,
  },
  visaColumn: {
    flex: 1.2,
    minWidth: isMobile ? 80 : 100,
  },
  statusColumn: {
    flex: 1,
    minWidth: isMobile ? 60 : 80,
  },
  actionsColumn: {
    flex: 1.5,
    minWidth: isMobile ? 80 : 120,
  },
  
  // Cell Content Styles
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: isMobile ? 6 : 10,
  },
  nameInfo: {
    flex: 1,
  },
  employeeName: {
    fontWeight: '600',
  },
  employeeId: {
    opacity: 0.7,
  },
  emailText: {
    textAlign: 'center',
  },
  mobileText: {
    textAlign: 'center',
  },
  tradeChip: {
    alignSelf: 'center',
  },
  companyText: {
    textAlign: 'center',
  },
  visaChip: {
    alignSelf: 'center',
  },
  statusChip: {
    alignSelf: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: isMobile ? 2 : 4,
  },
  actionButton: {
    borderRadius: 6,
    width: isMobile ? 24 : 32,
    height: isMobile ? 24 : 32,
  },
  viewButton: {
    borderRadius: 8,
  },
  
  // Pagination Styles
  pagination: {
    borderTopWidth: 1,
  },
  
  // Card View Styles
  employeeCard: {
    marginHorizontal: DESIGN_SYSTEM.spacing[2],
    marginVertical: DESIGN_SYSTEM.spacing[1],
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DESIGN_SYSTEM.spacing[2],
  },
  cardEmployeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardEmployeeDetails: {
    marginLeft: DESIGN_SYSTEM.spacing[2],
    flex: 1,
  },
  cardStatusBadge: {
    marginLeft: DESIGN_SYSTEM.spacing[2],
  },
  cardDivider: {
    marginVertical: DESIGN_SYSTEM.spacing[2],
  },
  cardContent: {
    gap: DESIGN_SYSTEM.spacing[2],
  },
  cardInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardsContainer: {
    paddingHorizontal: DESIGN_SYSTEM.spacing[2],
    paddingBottom: DESIGN_SYSTEM.spacing[4],
  },
  
  // Loading and Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: DESIGN_SYSTEM.spacing[16],
  },
  loadingText: {
    marginTop: DESIGN_SYSTEM.spacing[4],
    fontSize: DESIGN_SYSTEM.typography.fontSize.lg,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: DESIGN_SYSTEM.spacing[16],
    paddingHorizontal: DESIGN_SYSTEM.spacing[6],
    marginHorizontal: DESIGN_SYSTEM.spacing[4],
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
  },
  emptyTitle: {
    marginTop: DESIGN_SYSTEM.spacing[4],
    marginBottom: DESIGN_SYSTEM.spacing[2],
    textAlign: 'center',
    fontWeight: 'bold',
  },
  emptyMessage: {
    textAlign: 'center',
    marginBottom: DESIGN_SYSTEM.spacing[4],
    lineHeight: 24,
  },
  emptyAction: {
    marginTop: DESIGN_SYSTEM.spacing[4],
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
  },
  
  // Content Container
  contentContainer: {
    flex: 1,
  },
  
  // FAB Group
  fabGroup: {
    paddingBottom: Platform.OS === 'ios' ? 34 : DESIGN_SYSTEM.spacing[4],
  },
  
  // Modal Styles
  modalContainer: {
    margin: DESIGN_SYSTEM.spacing[5],
    borderRadius: DESIGN_SYSTEM.borderRadius.xl,
    padding: DESIGN_SYSTEM.spacing[6],
    maxHeight: '90%',
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: DESIGN_SYSTEM.spacing[6],
    fontWeight: 'bold',
  },
  formContainer: {
    gap: DESIGN_SYSTEM.spacing[4],
  },
  formInput: {
    backgroundColor: 'transparent',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: DESIGN_SYSTEM.spacing[6],
    gap: DESIGN_SYSTEM.spacing[3],
  },
  cancelButton: {
    flex: 1,
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
  },
  saveButton: {
    flex: 1,
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
  },
  
  // Success Animation
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  successCard: {
    paddingHorizontal: DESIGN_SYSTEM.spacing[8],
    paddingVertical: DESIGN_SYSTEM.spacing[6],
    borderRadius: DESIGN_SYSTEM.borderRadius.xl,
    alignItems: 'center',
  },
  successText: {
    marginTop: DESIGN_SYSTEM.spacing[3],
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  // FAB Styles
  fab: {
    position: 'absolute',
    right: DESIGN_SYSTEM.spacing[4],
    bottom: DESIGN_SYSTEM.spacing[4],
    borderRadius: DESIGN_SYSTEM.borderRadius.full,
  },
  
  // Error message styling
  errorText: {
    color: '#f44336',
    fontSize: DESIGN_SYSTEM.typography.fontSize.sm,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 4,
  },
  
  // Snackbar styling
  successSnackbar: {
    backgroundColor: '#4CAF50',
  },
  errorSnackbar: {
    backgroundColor: '#f44336',
  },
  snackbarText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
  },
  cardActionButton: {
    borderRadius: 8,
    flex: 1,
  },
});

export default withAuthGuard({
  WrappedComponent: EmployeesScreen,
  allowedRoles: ['admin']
});


