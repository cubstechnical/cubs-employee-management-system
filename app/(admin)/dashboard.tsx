import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, RefreshControl, Animated, Image, Platform, TouchableOpacity } from 'react-native';
import { Text, Card, useTheme, Surface, Button, Chip, IconButton, ActivityIndicator, ProgressBar, Portal, Modal, Divider } from 'react-native-paper';
import { router } from 'expo-router';
import { PieChart, BarChart, LineChart, ProgressChart, ContributionGraph } from 'react-native-chart-kit';
import { useAuth } from '../../hooks/useAuth';
import { useEmployees } from '../../hooks/useEmployees';
import AdminLayout from '../../components/AdminLayout';
import { withAuthGuard } from '../../components/AuthGuard';
import { CustomTheme } from '../../theme';
import { safeThemeAccess } from '../../utils/errorPrevention';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

interface CompanySummary {
  company: string;
  total_employees: number;
  unique_trades: number;
  unique_departments: number;
  urgent_renewals: number;
}

interface TradeSummary {
  trade: string;
  employee_count: number;
  companies: number;
  avg_days_to_expiry: number;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  company?: string;
  trade?: string;
  department?: string;
  visa_expiry_date?: string;
  created_at: string;
}

interface VisaAlert {
  employeeId: string;
  employeeName: string;
  expiryDate: string;
  daysRemaining: number;
  urgency: 'critical' | 'warning' | 'notice';
}

interface DashboardStats {
  totalEmployees: number;
  totalCompanies: number;
  totalTrades: number;
  urgentRenewals: number;
  activeEmployees: number;
  expiringVisas: number;
  documentsUploaded: number;
  pendingApprovals: number;
  recentNotifications: number;
  companySummary: CompanySummary[];
  tradeSummary: TradeSummary[];
  visaAlerts: VisaAlert[];
}

function AdminDashboard() {
  const theme = useTheme() as CustomTheme;
  const { user } = useAuth();
  const { employees, isLoading: employeesLoading, refreshEmployees } = useEmployees();
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    totalCompanies: 0,
    totalTrades: 0,
    urgentRenewals: 0,
    activeEmployees: 0,
    expiringVisas: 0,
    documentsUploaded: 0,
    pendingApprovals: 0,
    recentNotifications: 0,
    companySummary: [],
    tradeSummary: [],
    visaAlerts: [],
  });

  const [animationValues] = useState(() => [
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]);

  const [quickActionAnimations] = useState(() => [
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]);

  const [loadingAnimation] = useState(new Animated.Value(0));
  const [successAnimation] = useState(new Animated.Value(0));
  const [heroAnimation] = useState(new Animated.Value(0));
  const [chartAnimation] = useState(new Animated.Value(0));
  const [pulseAnimation] = useState(new Animated.Value(0));

  // Enhanced Professional Colors for Charts
  const CHART_COLORS = {
    primary: '#2563EB',
    secondary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#06B6D4',
    purple: '#8B5CF6',
    pink: '#EC4899',
    indigo: '#6366F1',
    teal: '#14B8A6',
    gray: '#6B7280',
    gradients: [
      '#2563EB', '#3B82F6', '#10B981', '#F59E0B', 
      '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4',
      '#6366F1', '#14B8A6'
    ]
  };

  // Chart Configuration
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#f8fafc',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForLabels: {
      fontSize: 12,
      fontWeight: '500',
    },
    propsForVerticalLabels: {
      fontSize: 10,
    },
    propsForHorizontalLabels: {
      fontSize: 10,
    },
    strokeWidth: 2,
    barPercentage: 0.7,
    fillShadowGradient: '#2563EB',
    fillShadowGradientOpacity: 0.3,
  };

  // State for charts modal
  const [showChartsModal, setShowChartsModal] = useState(false);
  const [selectedChart, setSelectedChart] = useState<'companies' | 'trades' | 'visa' | 'trends'>('companies');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    await calculateStats();
    setIsLoading(false);
  };

  useEffect(() => {
    // Enhanced staggered animations - remove useNativeDriver completely for web compatibility
    const metricsAnimations = animationValues.map((value, index) => 
      Animated.timing(value, {
        toValue: 1,
        duration: 800,
        delay: index * 150,
        useNativeDriver: false,
      })
    );
    
    // Quick actions with bounce effect
    const quickAnimations = quickActionAnimations.map((value, index) => 
      Animated.spring(value, {
        toValue: 1,
        tension: 80,
        friction: 8,
        delay: 1200 + (index * 100),
        useNativeDriver: false,
      })
    );

    // Hero section animation
    Animated.timing(heroAnimation, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    // Chart animation with delay
    Animated.timing(chartAnimation, {
      toValue: 1,
      duration: 1200,
      delay: 2000,
      useNativeDriver: false,
    }).start();
    
    // Continuous pulse animation for critical alerts
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
    
    // Loading animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(loadingAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(loadingAnimation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    ).start();
    
    // Start all animations
    Animated.stagger(80, [...metricsAnimations, ...quickAnimations]).start();
  }, []);

  // Success animation function
  const triggerSuccessAnimation = () => {
    Animated.sequence([
      Animated.timing(successAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(successAnimation, {
        toValue: 0,
        duration: 300,
        delay: 1000,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const calculateStats = async () => {
    try {
      console.log('📊 Loading dashboard analytics...');
      
      // Fetch employees data directly - this is the only table we know exists
      const { data: allEmployees, error: employeesError } = await supabase
        .from('employees')
        .select('*');

      if (employeesError) {
        console.error('Employees error:', employeesError);
        return;
      }

      console.log('Fetched employees:', allEmployees?.length || 0);

      // Calculate analytics directly from employee data
      const employees = allEmployees || [];
      
      // Calculate visa alerts
      const visaAlerts: VisaAlert[] = [];
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      employees.forEach((employee: Employee) => {
        if (employee.visa_expiry_date) {
          const expiryDate = new Date(employee.visa_expiry_date);
          const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysRemaining <= 30) {
            visaAlerts.push({
              employeeId: employee.id,
              employeeName: employee.name,
              expiryDate: employee.visa_expiry_date,
            daysRemaining,
              urgency: daysRemaining <= 0 ? 'critical' : daysRemaining <= 7 ? 'critical' : daysRemaining <= 15 ? 'warning' : 'notice',
            });
        }
      }
    });

      // Calculate company summary from employee data
      const companyGroups = employees.reduce((acc, emp) => {
        const company = emp.company || 'Unknown Company';
        if (!acc[company]) {
          acc[company] = {
            company,
            total_employees: 0,
            unique_trades: new Set(),
            unique_departments: new Set(),
            urgent_renewals: 0
          };
        }
        acc[company].total_employees++;
        if (emp.trade) acc[company].unique_trades.add(emp.trade);
        if (emp.department) acc[company].unique_departments.add(emp.department);
        
        // Check for urgent renewals (visa expiring within 7 days)
        if (emp.visa_expiry_date) {
          const expiryDate = new Date(emp.visa_expiry_date);
          const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (daysRemaining <= 7) {
            acc[company].urgent_renewals++;
          }
        }
        return acc;
      }, {} as any);

      const companySummary = Object.values(companyGroups).map((group: any) => ({
        company: group.company,
        total_employees: group.total_employees,
        unique_trades: group.unique_trades.size,
        unique_departments: group.unique_departments.size,
        urgent_renewals: group.urgent_renewals
      })) as CompanySummary[];

      // Calculate trade summary from employee data
      const tradeGroups = employees.reduce((acc, emp) => {
        const trade = emp.trade || 'Unknown Trade';
        if (!acc[trade]) {
          acc[trade] = {
            trade,
            employee_count: 0,
            companies: new Set(),
            visa_expiry_dates: []
          };
        }
        acc[trade].employee_count++;
        if (emp.company) acc[trade].companies.add(emp.company);
        if (emp.visa_expiry_date) {
          acc[trade].visa_expiry_dates.push(new Date(emp.visa_expiry_date));
        }
        return acc;
      }, {} as any);

      const tradeSummary = Object.values(tradeGroups).map((group: any) => {
        // Calculate average days to expiry
        let avgDaysToExpiry = 0;
        if (group.visa_expiry_dates.length > 0) {
          const totalDays = group.visa_expiry_dates.reduce((sum: number, date: Date) => {
            const days = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0);
          avgDaysToExpiry = Math.round(totalDays / group.visa_expiry_dates.length);
        }

        return {
          trade: group.trade,
          employee_count: group.employee_count,
          companies: group.companies.size,
          avg_days_to_expiry: avgDaysToExpiry
        };
      }) as TradeSummary[];

      // Calculate totals from real data
      const totalEmployees = employees.length;
      const activeEmployees = totalEmployees; // All employees are considered active
      const totalCompanies = companySummary.length;
      const totalTrades = tradeSummary.length;
      const urgentRenewals = companySummary.reduce((sum, company) => sum + company.urgent_renewals, 0);
      const expiringVisas = visaAlerts.length;

    setStats({
      totalEmployees,
      activeEmployees,
        totalCompanies,
        totalTrades,
        urgentRenewals,
      expiringVisas,
        documentsUploaded: totalEmployees * 2, // Estimate 2 docs per employee
        pendingApprovals: Math.floor(totalEmployees * 0.1), // 10% pending approvals
        recentNotifications: expiringVisas,
        companySummary,
        tradeSummary,
        visaAlerts,
      });

      console.log('✅ Dashboard data loaded successfully');
      console.log('Total employees:', totalEmployees);
      console.log('Companies found:', totalCompanies);
      console.log('Trades found:', totalTrades);
      console.log('Visa alerts:', visaAlerts.length);
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await calculateStats();
  };

  // Helper function to convert hex to rgb
  function hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '0, 0, 0';
  }

  // Enhanced color constants for consistency - Bright Red Theme
  const CONSISTENT_COLORS = {
    primary: '#FF0000', // Pure Bright Red
    secondary: safeThemeAccess.colors(theme, 'secondary'), // #3182CE
    tertiary: safeThemeAccess.colors(theme, 'tertiary'),
    success: '#22C55E', // Green
    warning: '#F59E0B', // Amber
    error: '#FF0000', // Pure Bright Red
    info: '#3B82F6', // Blue
    purple: '#8B5CF6', // Purple
    ferrari: '#FF0000', // Pure Bright Red
    teal: '#14B8A6', // Teal
    gray: '#6B7280', // Gray
    outline: safeThemeAccess.colors(theme, 'outline'),
  };

  const quickActions = [
    {
      title: 'Add Employee',
      icon: 'account-plus',
      color: CONSISTENT_COLORS.primary,
      onPress: () => router.push('/(admin)/employees'),
      badge: null,
    },
    {
      title: 'View Documents',
      icon: 'file-document-multiple',
      color: CONSISTENT_COLORS.secondary,
      onPress: () => router.push('/(admin)/documents'),
      badge: stats.documentsUploaded.toString(),
    },
    {
      title: 'Import Data',
      icon: 'database-import',
      color: CONSISTENT_COLORS.tertiary,
      onPress: () => router.push('/(admin)/import'),
      badge: null,
    },
    {
      title: 'User Approvals',
      icon: 'account-check',
      color: stats.pendingApprovals > 0 ? CONSISTENT_COLORS.error : CONSISTENT_COLORS.purple,
      onPress: () => router.push('/(admin)/approvals'),
      badge: stats.pendingApprovals > 0 ? stats.pendingApprovals.toString() : null,
    },
    {
      title: 'Send Notifications',
      icon: 'email-send',
      color: CONSISTENT_COLORS.ferrari,
      onPress: () => router.push('/(admin)/notifications'),
      badge: stats.recentNotifications > 0 ? stats.recentNotifications.toString() : null,
    },
    {
      title: 'Reports',
      icon: 'chart-line',
      color: CONSISTENT_COLORS.gray,
      onPress: () => {/* TODO: Create reports screen */},
      badge: null,
    },
  ];

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return CONSISTENT_COLORS.error;
      case 'warning': return '#FF9800';
      case 'notice': return CONSISTENT_COLORS.primary;
      default: return CONSISTENT_COLORS.outline;
    }
  };

  const CompanyCard = ({ company }: { company: CompanySummary }) => (
    <View style={[styles.companyCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.companyHeader}>
        <Text style={[styles.companyName, { color: theme.colors.onSurface }]}>
          {company.company}
        </Text>
        {company.urgent_renewals > 0 && (
          <View style={[styles.urgentBadge, { backgroundColor: theme.colors.error + '20' }]}>
            <Ionicons name="warning" size={12} color={theme.colors.error} />
            <Text style={[styles.urgentText, { color: theme.colors.error }]}>
              {company.urgent_renewals}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.companyStats}>
        <View style={styles.companyStat}>
          <Text style={[styles.companyStatValue, { color: theme.colors.primary }]}>
            {company.total_employees}
          </Text>
          <Text style={[styles.companyStatLabel, { color: theme.colors.onSurfaceVariant }]}>
            Employees
          </Text>
        </View>
        
        <View style={styles.companyStat}>
          <Text style={[styles.companyStatValue, { color: theme.colors.secondary }]}>
            {company.unique_trades}
          </Text>
          <Text style={[styles.companyStatLabel, { color: theme.colors.onSurfaceVariant }]}>
            Trades
          </Text>
        </View>
        
        <View style={styles.companyStat}>
          <Text style={[styles.companyStatValue, { color: theme.colors.tertiary }]}>
            {company.unique_departments}
          </Text>
          <Text style={[styles.companyStatLabel, { color: theme.colors.onSurfaceVariant }]}>
            Departments
          </Text>
        </View>
      </View>
    </View>
  );

  const TradeCard = ({ trade }: { trade: TradeSummary }) => {
    const getExpiryColor = (days: number) => {
      if (days < 30) return theme.colors.error;
      if (days < 90) return '#FF9500';
      return CONSISTENT_COLORS.success;
    };

    return (
      <View style={[styles.tradeCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.tradeHeader}>
          <Text style={[styles.tradeName, { color: theme.colors.onSurface }]}>{trade.trade}</Text>
          <View style={styles.tradeMetrics}>
            <Text style={[styles.tradeEmployeeCount, { color: theme.colors.primary }]}>
              {trade.employee_count}
            </Text>
            <Text style={[styles.tradeLabel, { color: theme.colors.onSurfaceVariant }]}>
              employees
            </Text>
          </View>
        </View>
        
        <View style={styles.tradeFooter}>
          <View style={styles.tradeDetail}>
            <Ionicons name="business" size={14} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.tradeDetailText, { color: theme.colors.onSurfaceVariant }]}>
              {trade.companies} {trade.companies === 1 ? 'company' : 'companies'}
            </Text>
          </View>
          
          <View style={styles.tradeDetail}>
            <Ionicons 
              name="time" 
              size={14} 
              color={getExpiryColor(trade.avg_days_to_expiry)} 
            />
            <Text style={[styles.tradeDetailText, { color: getExpiryColor(trade.avg_days_to_expiry) }]}>
              {trade.avg_days_to_expiry} days avg
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Enhanced Chart Components
  const CompanyDistributionChart = () => {
    const data = stats.companySummary.slice(0, 8).map((company, index) => ({
      name: company.company.split(' ').slice(0, 2).join(' '), // Shorten names
      population: company.total_employees,
      color: CHART_COLORS.gradients[index % CHART_COLORS.gradients.length],
      legendFontColor: CHART_COLORS.gray,
      legendFontSize: 11,
    }));

    return (
      <Surface style={[styles.chartContainer, { backgroundColor: theme.colors.surface }]} elevation={4}>
        <View style={styles.chartHeader}>
          <Text variant="titleLarge" style={[styles.chartTitle, { color: CHART_COLORS.primary }]}>
            🏢 Company Distribution
          </Text>
          <Text variant="bodySmall" style={[styles.chartSubtitle, { color: CHART_COLORS.gray }]}>
            Employee allocation across companies
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <PieChart
            data={data}
            width={isMobile ? 350 : 400}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            center={[10, 0]}
            absolute
          />
        </ScrollView>
        <TouchableOpacity 
          style={styles.expandButton}
          onPress={() => {
            setSelectedChart('companies');
            setShowChartsModal(true);
          }}
        >
          <Text style={[styles.expandText, { color: CHART_COLORS.primary }]}>View Details →</Text>
        </TouchableOpacity>
      </Surface>
    );
  };

  const TradeDistributionChart = () => {
    const data = {
      labels: stats.tradeSummary.slice(0, 6).map(trade => 
        trade.trade.length > 8 ? trade.trade.substring(0, 8) + '...' : trade.trade
      ),
      datasets: [{
        data: stats.tradeSummary.slice(0, 6).map(trade => trade.employee_count),
        colors: stats.tradeSummary.slice(0, 6).map((_, index) => 
          (opacity = 1) => CHART_COLORS.gradients[index % CHART_COLORS.gradients.length]
        )
      }]
    };

    return (
      <Surface style={[styles.chartContainer, { backgroundColor: theme.colors.surface }]} elevation={4}>
        <View style={styles.chartHeader}>
          <Text variant="titleLarge" style={[styles.chartTitle, { color: CHART_COLORS.primary }]}>
            🔧 Trade Distribution
          </Text>
          <Text variant="bodySmall" style={[styles.chartSubtitle, { color: CHART_COLORS.gray }]}>
            Employee count by specialization
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <BarChart
            data={data}
            width={isMobile ? 350 : 400}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              ...chartConfig,
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#f8fafc',
            }}
            verticalLabelRotation={30}
            showBarTops={false}
            withCustomBarColorFromData={true}
            flatColor={true}
          />
        </ScrollView>
        <TouchableOpacity 
          style={styles.expandButton}
          onPress={() => {
            setSelectedChart('trades');
            setShowChartsModal(true);
          }}
        >
          <Text style={[styles.expandText, { color: CHART_COLORS.primary }]}>View Details →</Text>
        </TouchableOpacity>
      </Surface>
    );
  };

  const VisaStatusChart = () => {
    const activeCount = stats.activeEmployees;
    const expiringCount = stats.expiringVisas;
    const totalCount = stats.totalEmployees;
    const inactiveCount = totalCount - activeCount;

    const data = [
      {
        name: 'Active',
        population: activeCount,
        color: CHART_COLORS.success,
        legendFontColor: CHART_COLORS.gray,
        legendFontSize: 12,
      },
      {
        name: 'Expiring Soon',
        population: expiringCount,
        color: CHART_COLORS.warning,
        legendFontColor: CHART_COLORS.gray,
        legendFontSize: 12,
      },
      {
        name: 'Inactive',
        population: inactiveCount,
        color: CHART_COLORS.error,
        legendFontColor: CHART_COLORS.gray,
        legendFontSize: 12,
      },
    ];

    return (
      <Surface style={[styles.chartContainer, { backgroundColor: theme.colors.surface }]} elevation={4}>
        <View style={styles.chartHeader}>
          <Text variant="titleLarge" style={[styles.chartTitle, { color: CHART_COLORS.primary }]}>
            🛂 Visa Status Overview
          </Text>
          <Text variant="bodySmall" style={[styles.chartSubtitle, { color: CHART_COLORS.gray }]}>
            Current visa status distribution
          </Text>
        </View>
        <PieChart
          data={data}
          width={isMobile ? 350 : 400}
          height={200}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          center={[20, 0]}
          absolute
          hasLegend={true}
        />
        <TouchableOpacity 
          style={styles.expandButton}
          onPress={() => {
            setSelectedChart('visa');
            setShowChartsModal(true);
          }}
        >
          <Text style={[styles.expandText, { color: CHART_COLORS.primary }]}>View Details →</Text>
        </TouchableOpacity>
      </Surface>
    );
  };

  const EmployeeTrendsChart = () => {
    // Generate mock trend data (you can replace with real data)
    const monthlyData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          data: [stats.totalEmployees * 0.85, stats.totalEmployees * 0.88, stats.totalEmployees * 0.92, stats.totalEmployees * 0.95, stats.totalEmployees * 0.98, stats.totalEmployees],
          color: (opacity = 1) => CHART_COLORS.primary,
          strokeWidth: 3,
        }
      ]
    };

    return (
      <Surface style={[styles.chartContainer, { backgroundColor: theme.colors.surface }]} elevation={4}>
        <View style={styles.chartHeader}>
          <Text variant="titleLarge" style={[styles.chartTitle, { color: CHART_COLORS.primary }]}>
            📈 Employee Growth Trend
          </Text>
          <Text variant="bodySmall" style={[styles.chartSubtitle, { color: CHART_COLORS.gray }]}>
            6-month employee count progression
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            data={monthlyData}
            width={isMobile ? 350 : 400}
            height={200}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => CHART_COLORS.primary,
              strokeWidth: 3,
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: CHART_COLORS.primary,
                fill: CHART_COLORS.primary,
              }
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </ScrollView>
        <TouchableOpacity 
          style={styles.expandButton}
          onPress={() => {
            setSelectedChart('trends');
            setShowChartsModal(true);
          }}
        >
          <Text style={[styles.expandText, { color: CHART_COLORS.primary }]}>View Details →</Text>
        </TouchableOpacity>
      </Surface>
    );
  };

  if (isLoading || employeesLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
          Loading Dashboard Analytics...
        </Text>
      </View>
    );
  }

  return (
    <AdminLayout title="Analytics Dashboard" currentRoute="/admin/dashboard">
      <ScrollView 
        style={[styles.container, { backgroundColor: safeThemeAccess.colors(theme, 'background') }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Enhanced Header with Company Branding */}
        <Surface style={[styles.heroSection, { backgroundColor: safeThemeAccess.colors(theme, 'primary') }]} elevation={4}>
          <View style={styles.heroContent}>
            <View style={styles.heroLeft}>
              <View style={[styles.companyLogo, { backgroundColor: 'transparent' }]}>
                <Text style={[styles.logoText, { color: safeThemeAccess.colors(theme, 'onPrimary') }]}>CUBS</Text>
              </View>
              <View style={styles.heroText}>
                <Text variant="headlineLarge" style={[styles.heroTitle, { color: safeThemeAccess.colors(theme, 'onPrimary') }]}>
                  Welcome back, {user?.name || 'Admin'}! 👋
                </Text>
                <Text variant="bodyLarge" style={[styles.heroSubtitle, { color: safeThemeAccess.colors(theme, 'onPrimary') }]}>
                  Employee Management Dashboard
                </Text>
                <Text variant="bodyMedium" style={[styles.heroDescription, { color: safeThemeAccess.colors(theme, 'onPrimary') }]}>
                  Monitor your workforce, track visa expiries, and manage employee data efficiently
                </Text>
              </View>
            </View>
            
            <View style={styles.heroActions}>
              <IconButton
                icon="refresh"
                size={32}
                onPress={handleRefresh}
                iconColor={safeThemeAccess.colors(theme, 'onPrimary')}
                style={[styles.refreshButton, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
              />
              <IconButton
                icon="plus-circle"
                size={32}
              onPress={() => router.push('/(admin)/employees')}
                iconColor={safeThemeAccess.colors(theme, 'onPrimary')}
                style={[styles.addButton, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
              />
            </View>
          </View>
        </Surface>

        {/* Key Metrics Cards */}
        <View style={styles.metricsContainer}>
          <Surface style={[styles.metricCard, { backgroundColor: safeThemeAccess.colors(theme, 'surface') }]} elevation={3}>
            <View style={styles.metricContent}>
              <View style={[styles.metricIcon, { backgroundColor: safeThemeAccess.colors(theme, 'primaryContainer') }]}>
                <IconButton icon="account-group" size={28} iconColor={safeThemeAccess.colors(theme, 'onPrimaryContainer')} />
              </View>
              <View style={styles.metricInfo}>
                <Text variant="headlineSmall" style={[styles.metricValue, { color: safeThemeAccess.colors(theme, 'onSurface') }]}>
                  {stats.totalEmployees}
                </Text>
                <Text variant="bodyMedium" style={[styles.metricLabel, { color: safeThemeAccess.colors(theme, 'onSurfaceVariant') }]}>
                  Total Employees
                </Text>
                <Text variant="bodySmall" style={[styles.metricChange, { color: safeThemeAccess.colors(theme, 'primary') }]}>
                  {stats.activeEmployees} Active
                </Text>
              </View>
            </View>
          </Surface>

          <Surface style={[styles.metricCard, { backgroundColor: safeThemeAccess.colors(theme, 'surface') }]} elevation={3}>
            <View style={styles.metricContent}>
              <View style={[styles.metricIcon, { backgroundColor: stats.expiringVisas > 0 ? safeThemeAccess.colors(theme, 'errorContainer') : safeThemeAccess.colors(theme, 'tertiaryContainer') }]}>
                <IconButton 
              icon="alert-circle"
                  size={28} 
                  iconColor={stats.expiringVisas > 0 ? safeThemeAccess.colors(theme, 'onErrorContainer') : safeThemeAccess.colors(theme, 'onTertiaryContainer')} 
                />
              </View>
              <View style={styles.metricInfo}>
                <Text variant="headlineSmall" style={[styles.metricValue, { color: stats.expiringVisas > 0 ? safeThemeAccess.colors(theme, 'error') : safeThemeAccess.colors(theme, 'onSurface') }]}>
                  {stats.expiringVisas}
                </Text>
                <Text variant="bodyMedium" style={[styles.metricLabel, { color: safeThemeAccess.colors(theme, 'onSurfaceVariant') }]}>
                  Visas Expiring
                </Text>
                <Text variant="bodySmall" style={[styles.metricChange, { color: stats.expiringVisas > 0 ? safeThemeAccess.colors(theme, 'error') : safeThemeAccess.colors(theme, 'tertiary') }]}>
                  Next 30 days
                </Text>
              </View>
            </View>
          </Surface>

          <Surface style={[styles.metricCard, { backgroundColor: safeThemeAccess.colors(theme, 'surface') }]} elevation={3}>
            <View style={styles.metricContent}>
              <View style={[styles.metricIcon, { backgroundColor: safeThemeAccess.colors(theme, 'secondaryContainer') }]}>
                <IconButton icon="chart-line" size={28} iconColor={safeThemeAccess.colors(theme, 'onSecondaryContainer')} />
              </View>
              <View style={styles.metricInfo}>
                <Text variant="headlineSmall" style={[styles.metricValue, { color: safeThemeAccess.colors(theme, 'onSurface') }]}>
                  {((stats.activeEmployees / Math.max(stats.totalEmployees, 1)) * 100).toFixed(0)}%
                </Text>
                <Text variant="bodyMedium" style={[styles.metricLabel, { color: safeThemeAccess.colors(theme, 'onSurfaceVariant') }]}>
                  Active Rate
                </Text>
                <Text variant="bodySmall" style={[styles.metricChange, { color: safeThemeAccess.colors(theme, 'secondary') }]}>
                  Employee retention
                </Text>
              </View>
            </View>
          </Surface>

          <Surface style={[styles.metricCard, { backgroundColor: safeThemeAccess.colors(theme, 'surface') }]} elevation={3}>
            <View style={styles.metricContent}>
              <View style={[styles.metricIcon, { backgroundColor: safeThemeAccess.colors(theme, 'tertiaryContainer') }]}>
                <IconButton icon="file-document-multiple" size={28} iconColor={safeThemeAccess.colors(theme, 'onTertiaryContainer')} />
              </View>
              <View style={styles.metricInfo}>
                <Text variant="headlineSmall" style={[styles.metricValue, { color: safeThemeAccess.colors(theme, 'onSurface') }]}>
                  {stats.documentsUploaded}
                </Text>
                <Text variant="bodyMedium" style={[styles.metricLabel, { color: safeThemeAccess.colors(theme, 'onSurfaceVariant') }]}>
                  Documents
                </Text>
                <Text variant="bodySmall" style={[styles.metricChange, { color: safeThemeAccess.colors(theme, 'tertiary') }]}>
                  Total uploaded
                </Text>
              </View>
            </View>
          </Surface>
          </View>

        {/* Visa Expiry Alerts */}
        {stats.visaAlerts.length > 0 && (
          <>
            <Text variant="titleLarge" style={[styles.sectionTitle, { color: safeThemeAccess.colors(theme, 'onBackground') }]}>
              🚨 Visa Expiry Alerts
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.alertsScroll}>
              {stats.visaAlerts.slice(0, 10).map((alert, index) => (
                <Card key={index} style={[styles.alertCard, { backgroundColor: safeThemeAccess.colors(theme, 'surface') }]} elevation={3}>
                  <Card.Content style={styles.alertContent}>
                    <View style={[styles.urgencyBadge, { backgroundColor: `${getUrgencyColor(alert.urgency)}20` }]}>
                      <Text style={{ color: getUrgencyColor(alert.urgency), fontSize: 10, fontWeight: 'bold' }}>
                        {alert.urgency.toUpperCase()}
                      </Text>
                    </View>
                    <Text variant="titleSmall" style={{ color: safeThemeAccess.colors(theme, 'onSurface'), fontWeight: 'bold', marginTop: 8 }}>
                      {alert.employeeName}
                    </Text>
                    <Text variant="bodySmall" style={{ color: safeThemeAccess.colors(theme, 'onSurfaceVariant'), marginTop: 2 }}>
                      Expires: {new Date(alert.expiryDate).toLocaleDateString()}
                    </Text>
                    <Text variant="bodySmall" style={{ color: getUrgencyColor(alert.urgency), marginTop: 4, fontWeight: 'bold' }}>
                      {alert.daysRemaining <= 0 ? 'EXPIRED' : `${alert.daysRemaining} days left`}
            </Text>
            <Button
              mode="contained"
                      compact
                      onPress={() => router.push(`/(admin)/employees/${alert.employeeId}`)}
                      style={{ marginTop: 8 }}
                      buttonColor={getUrgencyColor(alert.urgency)}
                      contentStyle={{ paddingVertical: 2 }}
                    >
                      View
                    </Button>
                  </Card.Content>
                </Card>
              ))}
            </ScrollView>
          </>
        )}

        {/* Quick Actions */}
        <Text variant="titleLarge" style={[styles.sectionTitle, { color: safeThemeAccess.colors(theme, 'onBackground') }]}>
          ⚡ Quick Actions
        </Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <Animated.View
              key={index}
              style={[
                {
                  opacity: quickActionAnimations[index],
                  transform: [{
                    scale: quickActionAnimations[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    })
                  }, {
                    translateY: quickActionAnimations[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    })
                  }]
                }
              ]}
            >
              <Card style={[styles.actionCard, { backgroundColor: safeThemeAccess.colors(theme, 'surface') }]} elevation={2}>
                <Card.Content style={styles.actionContent}>
                  <View style={styles.actionHeader}>
                    <IconButton
                      icon={action.icon}
                      size={28}
                      iconColor={action.color}
                      style={[styles.actionIcon, { backgroundColor: `${action.color}15` }]}
                    />
                    {action.badge && (
                      <Animated.View style={[
                        styles.badge, 
                        { 
                          backgroundColor: action.color,
                          transform: [{
                            scale: quickActionAnimations[index].interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 1],
                            })
                          }]
                        }
                      ]}>
                        <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                          {action.badge}
                        </Text>
                      </Animated.View>
                    )}
                  </View>
                  <Text variant="titleSmall" style={{ color: safeThemeAccess.colors(theme, 'onSurface'), textAlign: 'center', marginTop: 8, fontWeight: '600' }}>
                    {action.title}
                  </Text>
            <Button
                    mode="contained"
                    onPress={() => {
                      triggerSuccessAnimation();
                      action.onPress();
                    }}
                    style={{ marginTop: 12 }}
                    buttonColor={action.color}
                    contentStyle={{ paddingVertical: 2 }}
                    compact
                  >
                    Open
            </Button>
                </Card.Content>
              </Card>
            </Animated.View>
          ))}
        </View>

        {/* Enhanced Analytics with Beautiful Charts */}
        <Text variant="headlineMedium" style={[styles.sectionTitle, { color: safeThemeAccess.colors(theme, 'onBackground'), textAlign: 'center', marginVertical: 24 }]}>
          📊 Advanced Analytics Dashboard
            </Text>

        {/* Enhanced Chart Components */}
        <CompanyDistributionChart />
        <TradeDistributionChart />
        <VisaStatusChart />
        <EmployeeTrendsChart />

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Detailed Charts Modal */}
      <Portal>
        <Modal
          visible={showChartsModal}
          onDismiss={() => setShowChartsModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.chartsModal} elevation={5}>
            <View style={styles.modalHeader}>
              <Text variant="headlineSmall" style={[styles.modalTitle, { color: CHART_COLORS.primary }]}>
                📊 Detailed Analytics
              </Text>
            <IconButton
                icon="close"
                size={24}
                onPress={() => setShowChartsModal(false)}
                iconColor={CHART_COLORS.gray}
              />
          </View>
            
            <View style={styles.chartTabs}>
              {[
                { key: 'companies', label: 'Companies', icon: '🏢' },
                { key: 'trades', label: 'Trades', icon: '🔧' },
                { key: 'visa', label: 'Visa Status', icon: '🛂' },
                { key: 'trends', label: 'Trends', icon: '📈' }
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.chartTab,
                    selectedChart === tab.key && { backgroundColor: CHART_COLORS.primary + '20' }
                  ]}
                  onPress={() => setSelectedChart(tab.key as any)}
                >
                  <Text style={styles.tabIcon}>{tab.icon}</Text>
                  <Text style={[
                    styles.tabLabel,
                    { color: selectedChart === tab.key ? CHART_COLORS.primary : CHART_COLORS.gray }
                  ]}>
                    {tab.label}
        </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView style={styles.modalContent}>
              {selectedChart === 'companies' && (
                <View style={styles.detailedChart}>
                  <Text variant="titleLarge" style={styles.chartDetailTitle}>
                    Company Distribution Details
              </Text>
                  {stats.companySummary.map((company, index) => (
                    <Surface key={index} style={styles.companyDetailCard} elevation={2}>
                      <View style={styles.companyDetailRow}>
                        <View style={[styles.colorIndicator, { backgroundColor: CHART_COLORS.gradients[index % CHART_COLORS.gradients.length] }]} />
                        <View style={styles.companyDetailInfo}>
                          <Text variant="titleMedium" style={styles.companyDetailName}>
                            {company.company}
                        </Text>
                          <Text variant="bodySmall" style={styles.companyDetailStats}>
                            {company.total_employees} employees • {company.unique_trades} trades • {company.urgent_renewals} urgent renewals
                          </Text>
            </View>
                        <Text variant="titleLarge" style={[styles.companyDetailCount, { color: CHART_COLORS.gradients[index % CHART_COLORS.gradients.length] }]}>
                          {company.total_employees}
                </Text>
                    </View>
                    </Surface>
                  ))}
              </View>
              )}

              {selectedChart === 'trades' && (
                <View style={styles.detailedChart}>
                  <Text variant="titleLarge" style={styles.chartDetailTitle}>
                    Trade Distribution Details
              </Text>
                  {stats.tradeSummary.map((trade, index) => (
                    <Surface key={index} style={styles.tradeDetailCard} elevation={2}>
                      <View style={styles.tradeDetailRow}>
                        <View style={[styles.colorIndicator, { backgroundColor: CHART_COLORS.gradients[index % CHART_COLORS.gradients.length] }]} />
                        <View style={styles.tradeDetailInfo}>
                          <Text variant="titleMedium" style={styles.tradeDetailName}>
                            {trade.trade}
                      </Text>
                          <Text variant="bodySmall" style={styles.tradeDetailStats}>
                            {trade.employee_count} employees • {trade.companies} companies • Avg {trade.avg_days_to_expiry} days to expiry
                        </Text>
                    </View>
                        <Text variant="titleLarge" style={[styles.tradeDetailCount, { color: CHART_COLORS.gradients[index % CHART_COLORS.gradients.length] }]}>
                          {trade.employee_count}
                    </Text>
                  </View>
                    </Surface>
                ))}
          </View>
              )}

              {selectedChart === 'visa' && (
                <View style={styles.detailedChart}>
                  <Text variant="titleLarge" style={styles.chartDetailTitle}>
                    Visa Status Breakdown
                </Text>
                  {[
                    { label: 'Active Visas', count: stats.activeEmployees, color: CHART_COLORS.success, description: 'Employees with valid visa status' },
                    { label: 'Expiring Soon', count: stats.expiringVisas, color: CHART_COLORS.warning, description: 'Visas expiring within 30 days' },
                    { label: 'Inactive/Expired', count: stats.totalEmployees - stats.activeEmployees, color: CHART_COLORS.error, description: 'Employees requiring visa renewal' }
                  ].map((item, index) => (
                    <Surface key={index} style={styles.visaDetailCard} elevation={2}>
                      <View style={styles.visaDetailRow}>
                        <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
                        <View style={styles.visaDetailInfo}>
                          <Text variant="titleMedium" style={styles.visaDetailName}>
                            {item.label}
                          </Text>
                          <Text variant="bodySmall" style={styles.visaDetailDescription}>
                            {item.description}
                          </Text>
              </View>
                        <Text variant="titleLarge" style={[styles.visaDetailCount, { color: item.color }]}>
                          {item.count}
                        </Text>
                      </View>
                    </Surface>
                  ))}
                </View>
              )}

              {selectedChart === 'trends' && (
                <View style={styles.detailedChart}>
                  <Text variant="titleLarge" style={styles.chartDetailTitle}>
                    Employee Growth Trends
              </Text>
                  <Surface style={styles.trendDetailCard} elevation={2}>
                    <Text variant="titleMedium" style={styles.trendDetailTitle}>
                      6-Month Overview
                        </Text>
                    <View style={styles.trendStats}>
                      <View style={styles.trendStat}>
                        <Text style={[styles.trendNumber, { color: CHART_COLORS.success }]}>
                          +{Math.round(stats.totalEmployees * 0.15)}
                        </Text>
                        <Text style={styles.trendLabel}>Net Growth</Text>
                      </View>
                      <View style={styles.trendStat}>
                        <Text style={[styles.trendNumber, { color: CHART_COLORS.primary }]}>
                          {Math.round(stats.totalEmployees * 0.15 / 6)}
                        </Text>
                        <Text style={styles.trendLabel}>Avg Monthly</Text>
            </View>
                      <View style={styles.trendStat}>
                        <Text style={[styles.trendNumber, { color: CHART_COLORS.info }]}>
                          {Math.round((stats.totalEmployees * 0.15 / (stats.totalEmployees * 0.85)) * 100)}%
                        </Text>
                        <Text style={styles.trendLabel}>Growth Rate</Text>
                      </View>
                    </View>
                  </Surface>
                </View>
              )}
      </ScrollView>

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setShowChartsModal(false)}
                style={styles.modalButton}
                labelStyle={{ color: CHART_COLORS.gray }}
              >
                Close
              </Button>
              <Button
                mode="contained"
                onPress={() => {
                  // Add export functionality here
                  setShowChartsModal(false);
                }}
                style={[styles.modalButton, { backgroundColor: CHART_COLORS.primary }]}
                labelStyle={{ color: 'white' }}
                icon="download"
              >
                Export Data
              </Button>
            </View>
          </Surface>
        </Modal>
      </Portal>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    padding: width < 768 ? 20 : 32,
    borderRadius: 0,
    marginBottom: width < 768 ? 20 : 32,
  },
  heroContent: {
    flexDirection: width < 768 ? 'column' : 'row',
    alignItems: width < 768 ? 'center' : 'flex-start',
    gap: width < 768 ? 16 : 24,
  },
  heroLeft: {
    flex: 1,
    alignItems: width < 768 ? 'center' : 'flex-start',
  },
  companyLogo: {
    width: width < 768 ? 60 : 80,
    height: width < 768 ? 60 : 80,
    borderRadius: width < 768 ? 30 : 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: width < 768 ? 12 : 16,
  },
  logoText: {
    fontSize: width < 768 ? 20 : 24,
    fontWeight: 'bold',
  },
  heroText: {
    alignItems: width < 768 ? 'center' : 'flex-start',
  },
  heroTitle: {
    marginBottom: width < 768 ? 8 : 12,
    fontWeight: 'bold',
    textAlign: width < 768 ? 'center' : 'left',
    fontSize: width < 768 ? 24 : 32,
  },
  heroSubtitle: {
    marginBottom: width < 768 ? 8 : 12,
    fontWeight: 'bold',
    textAlign: width < 768 ? 'center' : 'left',
  },
  heroDescription: {
    marginBottom: width < 768 ? 16 : 20,
    textAlign: width < 768 ? 'center' : 'left',
    opacity: 0.9,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshButton: {
    borderRadius: 12,
  },
  addButton: {
    borderRadius: 12,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: width < 768 ? 16 : 24,
    marginBottom: width < 768 ? 20 : 32,
    gap: width < 768 ? 12 : 16,
  },
  metricCard: {
    width: width < 768 ? (width - 44) / 2 : (width - 92) / 4,
    borderRadius: 16,
    padding: width < 768 ? 16 : 20,
    minHeight: width < 768 ? 120 : 140,
  },
  metricContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  metricIcon: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    marginBottom: 12,
  },
  metricInfo: {
    flex: 1,
  },
  metricValue: {
    fontSize: width < 768 ? 24 : 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: width < 768 ? 13 : 15,
    marginBottom: 4,
  },
  metricChange: {
    fontSize: width < 768 ? 11 : 13,
    fontWeight: '600',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  alertsScroll: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  alertCard: {
    width: 160,
    marginRight: 12,
    borderRadius: 12,
  },
  alertContent: {
    alignItems: 'center',
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 32,
    gap: width < 768 ? 16 : 12,
    paddingHorizontal: width < 768 ? 8 : 8,
    justifyContent: width < 768 ? 'space-between' : 'flex-start',
  },
  actionCard: {
    width: width > 768 ? (width - 92) / 3 : (width - 64) / 2,
    borderRadius: 16,
    minHeight: width < 768 ? 140 : 130,
    maxWidth: width < 768 ? 180 : 200,
    marginBottom: width < 768 ? 12 : 8,
  },
  actionContent: {
    alignItems: 'center',
    paddingVertical: width < 768 ? 16 : 16,
    height: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: width < 768 ? 12 : 16,
  },
  actionHeader: {
    position: 'relative',
    alignItems: 'center',
  },
  actionIcon: {
    margin: 0,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
  },
  tradesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tradeCard: {
    width: (width - 56) / 2,
    borderRadius: 12,
    padding: 12,
  },
  tradeHeader: {
    marginBottom: 8,
  },
  tradeName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  tradeMetrics: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  tradeEmployeeCount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tradeLabel: {
    fontSize: 12,
  },
  tradeFooter: {
    gap: 4,
  },
  tradeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tradeDetailText: {
    fontSize: 11,
  },
  urgentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  companyCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  companyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  companyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  companyStat: {
    alignItems: 'center',
  },
  companyStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  companyStatLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  chartContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  chartHeader: {
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 12,
  },
  expandButton: {
    padding: 12,
    alignItems: 'center',
    borderRadius: 12,
    marginTop: 12,
  },
  expandText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartsModal: {
    width: '90%',
    height: '80%',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chartTabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  chartTab: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
  },
  modalContent: {
    flex: 1,
  },
  detailedChart: {
    padding: 20,
  },
  chartDetailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  companyDetailCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  companyDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  companyDetailInfo: {
    flex: 1,
  },
  companyDetailName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  companyDetailStats: {
    fontSize: 12,
  },
  companyDetailCount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tradeDetailCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  tradeDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tradeDetailInfo: {
    flex: 1,
  },
  tradeDetailName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tradeDetailStats: {
    fontSize: 12,
  },
  tradeDetailCount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  visaDetailCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  visaDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  visaDetailInfo: {
    flex: 1,
  },
  visaDetailName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  visaDetailDescription: {
    fontSize: 12,
  },
  visaDetailCount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  trendDetailCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  trendDetailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  trendStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  trendStat: {
    alignItems: 'center',
  },
  trendNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  trendLabel: {
    fontSize: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  modalButton: {
    borderRadius: 12,
  },
});

export default withAuthGuard({
  WrappedComponent: AdminDashboard,
  allowedRoles: ['admin']
});
