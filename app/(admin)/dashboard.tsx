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
import { DESIGN_SYSTEM } from '../../theme/designSystem';

const { width, height } = Dimensions.get('window');
const isMobile = width < DESIGN_SYSTEM.breakpoints.tablet;
const isTablet = width < DESIGN_SYSTEM.breakpoints.desktop;

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
  email_id: string;
  company_name?: string;
  trade?: string;
  department?: string;
  visa_expiry_date?: string;
  is_active?: boolean;
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
  inactiveEmployees: number;
  expiringVisas: number;
  expiredVisas: number;
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
    inactiveEmployees: 0,
    expiringVisas: 0,
    expiredVisas: 0,
    documentsUploaded: 0,
    pendingApprovals: 0,
    recentNotifications: 0,
    companySummary: [],
    tradeSummary: [],
    visaAlerts: [],
  });

  // Enhanced animations for staggered loading effect
  const [fadeAnimation] = useState(new Animated.Value(0));
  const [metricsAnimations] = useState(() => 
    Array.from({ length: 8 }, () => new Animated.Value(0))
  );
  const [chartAnimation] = useState(new Animated.Value(0));

  // ENHANCED: Professional color scheme for better visibility
  const DASHBOARD_COLORS = {
    primary: DESIGN_SYSTEM.colors.primary[500],
    success: DESIGN_SYSTEM.colors.success.main,
    warning: DESIGN_SYSTEM.colors.warning.main,
    error: DESIGN_SYSTEM.colors.error.main,
    info: DESIGN_SYSTEM.colors.info.main,
    purple: '#8B5CF6',
    teal: '#14B8A6',
    indigo: '#6366F1',
    gradients: [
      DESIGN_SYSTEM.colors.primary[500], 
      DESIGN_SYSTEM.colors.info.main, 
      DESIGN_SYSTEM.colors.success.main, 
      DESIGN_SYSTEM.colors.warning.main,
      DESIGN_SYSTEM.colors.error.main, 
      '#8B5CF6', 
      '#EC4899', 
      '#14B8A6'
    ]
  };

  // ENHANCED: Professional chart configuration with better visibility
  const chartConfig = {
    backgroundColor: DESIGN_SYSTEM.colors.neutral[0],
    backgroundGradientFrom: DESIGN_SYSTEM.colors.neutral[0],
    backgroundGradientTo: DESIGN_SYSTEM.colors.neutral[50],
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`, // Enhanced contrast
    style: {
      borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    },
    propsForLabels: {
      fontSize: 14, // Increased from 12
      fontWeight: '600', // Enhanced weight
      fill: DESIGN_SYSTEM.colors.neutral[700],
    },
    propsForVerticalLabels: {
      fontSize: 12, // Increased from 10
      fontWeight: '500',
    },
    propsForHorizontalLabels: {
      fontSize: 12, // Increased from 10
      fontWeight: '500',
    },
    strokeWidth: 3, // Increased from 2
    barPercentage: 0.7,
    fillShadowGradient: DESIGN_SYSTEM.colors.primary[500],
    fillShadowGradientOpacity: 0.4, // Increased visibility
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (employees) {
      calculateStats();
    }
  }, [employees]);

  useEffect(() => {
    if (!isLoading) {
      // Enhanced staggered animations
      Animated.sequence([
        Animated.timing(fadeAnimation, {
        toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.stagger(100, 
          metricsAnimations.map(animation => 
            Animated.spring(animation, {
        toValue: 1,
        tension: 80,
        friction: 8,
              useNativeDriver: true,
            })
          )
        ),
    Animated.timing(chartAnimation, {
      toValue: 1,
          duration: 800,
          useNativeDriver: true,
      }),
    ]).start();
    }
  }, [isLoading]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      await refreshEmployees();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ENHANCED: More accurate statistics calculation
  const calculateStats = () => {
    if (!employees || employees.length === 0) {
      setStats(prev => ({ ...prev, totalEmployees: 0 }));
        return;
      }

    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));

    // Calculate core metrics
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(emp => emp.is_active === true).length;
    const inactiveEmployees = employees.filter(emp => emp.is_active === false).length;

    // Calculate visa statistics
    const employeesWithVisaData = employees.filter(emp => emp.visa_expiry_date);
    const expiringVisas = employeesWithVisaData.filter(emp => {
      const expiryDate = new Date(emp.visa_expiry_date!);
      return expiryDate > today && expiryDate <= thirtyDaysFromNow;
    }).length;

    const expiredVisas = employeesWithVisaData.filter(emp => {
      const expiryDate = new Date(emp.visa_expiry_date!);
      return expiryDate <= today;
    }).length;

    // Calculate company and trade statistics
    const companies = [...new Set(employees.map(emp => emp.company_name).filter(Boolean))];
    const trades = [...new Set(employees.map(emp => emp.trade).filter(Boolean))];

    // Generate company summary
    const companySummary: CompanySummary[] = companies.map(company => {
      const companyEmployees = employees.filter(emp => emp.company_name === company);
      const companyTrades = [...new Set(companyEmployees.map(emp => emp.trade).filter(Boolean))];
      const urgentRenewals = companyEmployees.filter(emp => {
        if (!emp.visa_expiry_date) return false;
        const expiryDate = new Date(emp.visa_expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry > 0 && daysUntilExpiry <= 7; // Critical: 7 days
      }).length;

      return {
            company,
        total_employees: companyEmployees.length,
        unique_trades: companyTrades.length,
        unique_departments: 0, // Can be enhanced later
        urgent_renewals: urgentRenewals,
      };
    }).sort((a, b) => b.total_employees - a.total_employees);

    // Generate trade summary
    const tradeSummary: TradeSummary[] = trades.map(trade => {
      const tradeEmployees = employees.filter(emp => emp.trade === trade);
      const tradeCompanies = [...new Set(tradeEmployees.map(emp => emp.company_name).filter(Boolean))];
      
      // Calculate average days to expiry for this trade
      const employeesWithExpiry = tradeEmployees.filter(emp => emp.visa_expiry_date);
      const avgDaysToExpiry = employeesWithExpiry.length > 0 ? 
        employeesWithExpiry.reduce((sum, emp) => {
          const daysUntilExpiry = Math.ceil((new Date(emp.visa_expiry_date!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return sum + Math.max(0, daysUntilExpiry);
        }, 0) / employeesWithExpiry.length : 0;

      return {
            trade,
        employee_count: tradeEmployees.length,
        companies: tradeCompanies.length,
        avg_days_to_expiry: Math.round(avgDaysToExpiry),
      };
    }).sort((a, b) => b.employee_count - a.employee_count);

    setStats({
      totalEmployees,
      totalCompanies: companies.length,
      totalTrades: trades.length,
      urgentRenewals: expiringVisas + expiredVisas,
      activeEmployees,
      inactiveEmployees,
      expiringVisas,
      expiredVisas,
      documentsUploaded: 0, // To be implemented
      pendingApprovals: 0, // To be implemented
      recentNotifications: 0, // To be implemented
        companySummary,
        tradeSummary,
      visaAlerts: [], // To be implemented
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  // ENHANCED: Metric cards with better styling and visibility
  const MetricCard = ({ 
    title, 
    value, 
    icon, 
    color, 
    subtitle, 
    onPress, 
    index 
  }: { 
    title: string; 
    value: number; 
    icon: string; 
    color: string; 
    subtitle?: string;
    onPress?: () => void;
    index: number;
  }) => (
    <Animated.View
      style={[
        {
          opacity: metricsAnimations[index],
          transform: [{
            translateY: metricsAnimations[index].interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0],
            }),
          }],
        },
      ]}
    >
      <TouchableOpacity onPress={onPress} disabled={!onPress}>
        <Surface style={[styles.metricCard, { elevation: isMobile ? 3 : 6 }]}>
          <LinearGradient
            colors={[color, `${color}95`]}
            style={styles.metricGradient}
          >
            <View style={styles.metricHeader}>
              <View style={styles.metricIconContainer}>
                <Ionicons name={icon as any} size={isMobile ? 20 : 24} color="white" />
              </View>
              {onPress && (
                <IconButton
                  icon="chevron-right"
                  size={isMobile ? 14 : 16}
                  iconColor="rgba(255,255,255,0.8)"
                  style={styles.metricChevron}
                />
              )}
            </View>
            
            <View style={styles.metricContent}>
              <Text 
                variant={isMobile ? "headlineMedium" : "displaySmall"} 
                style={styles.metricValue}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {value.toLocaleString()}
              </Text>
              <Text 
                variant={isMobile ? "bodyMedium" : "titleMedium"} 
                style={styles.metricTitle}
                numberOfLines={isMobile ? 1 : 2}
              >
                {title}
              </Text>
              {subtitle && (
                <Text 
                  variant="bodySmall" 
                  style={styles.metricSubtitle}
                  numberOfLines={1}
                >
                  {subtitle}
                </Text>
              )}
            </View>
          </LinearGradient>
        </Surface>
      </TouchableOpacity>
    </Animated.View>
  );

  // ENHANCED: Professional chart components - Focus on Visa Expiry Risk
  const VisaExpiryBreakdownChart = () => {
    if (!employees || employees.length === 0) {
      return (
        <Surface style={[styles.chartContainer, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Text variant="titleMedium" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
            Visa Expiry Risk Assessment
          </Text>
          <View style={styles.emptyChartState}>
            <IconButton
              icon="passport"
              size={48}
              iconColor={theme.colors.onSurfaceVariant}
            />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              No visa data available
            </Text>
          </View>
        </Surface>
      );
    }

    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    const employeesWithVisas = employees.filter(emp => emp.visa_expiry_date);
    
    const expiringIn30Days = employeesWithVisas.filter(emp => {
      const expiryDate = new Date(emp.visa_expiry_date!);
      return expiryDate > today && expiryDate <= thirtyDaysFromNow;
    });

    const expiredVisas = employeesWithVisas.filter(emp => {
      const expiryDate = new Date(emp.visa_expiry_date!);
      return expiryDate <= today;
    });

    const validVisas = employeesWithVisas.filter(emp => {
      const expiryDate = new Date(emp.visa_expiry_date!);
      return expiryDate > thirtyDaysFromNow;
    });

    const pieData = [
      {
        name: 'Valid (>30 days)',
        population: validVisas.length,
        color: DASHBOARD_COLORS.success,
        legendFontColor: DESIGN_SYSTEM.colors.neutral[700],
        legendFontSize: 14,
        legendFontWeight: '600',
      },
      {
        name: 'Expiring (≤30 days)',
        population: expiringIn30Days.length,
        color: DASHBOARD_COLORS.warning,
        legendFontColor: DESIGN_SYSTEM.colors.neutral[700],
        legendFontSize: 14,
        legendFontWeight: '600',
      },
      {
        name: 'Expired',
        population: expiredVisas.length,
        color: DASHBOARD_COLORS.error,
        legendFontColor: DESIGN_SYSTEM.colors.neutral[700],
        legendFontSize: 14,
        legendFontWeight: '600',
      },
    ].filter(item => item.population > 0);

    return (
      <Animated.View style={{ opacity: chartAnimation }}>
        <Surface style={[styles.chartContainer, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Text variant="titleLarge" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
            Visa Expiry Risk Assessment
          </Text>
          
          {/* Urgent Alert Card */}
          {(expiringIn30Days.length > 0 || expiredVisas.length > 0) && (
            <Surface style={[styles.alertCard, { 
              backgroundColor: DASHBOARD_COLORS.error + '10',
              borderLeftColor: DASHBOARD_COLORS.error,
              borderLeftWidth: 4,
              padding: 12,
              marginBottom: 16,
              borderRadius: 8,
            }]} elevation={1}>
              <Text variant="titleMedium" style={{ color: DASHBOARD_COLORS.error, fontWeight: 'bold' }}>
                ⚠️ Urgent Visa Renewals Required
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginTop: 4 }}>
                {expiredVisas.length} visas expired • {expiringIn30Days.length} expiring within 30 days
              </Text>
            </Surface>
          )}

          <View style={styles.chartWrapper}>
            <PieChart
              data={pieData}
              width={isMobile ? width - 80 : 350}
              height={220}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft={isMobile ? "15" : "15"}
              center={[isMobile ? -20 : 0, 0]}
              absolute
            />
          </View>
          
          {/* Enhanced Legend with Risk Levels */}
          <View style={styles.chartLegend}>
            {pieData.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <Text variant="bodyMedium" style={[styles.legendText, { color: theme.colors.onSurface }]}>
                  {item.name}: {item.population}
                </Text>
              </View>
            ))}
          </View>

          {/* Quick Action Button */}
          {(expiringIn30Days.length > 0 || expiredVisas.length > 0) && (
            <Button
              mode="contained"
              icon="calendar-alert"
              onPress={() => router.push('/(admin)/employees')}
              style={[styles.chartActionButton, { 
                backgroundColor: DASHBOARD_COLORS.warning,
                marginTop: 12,
              }]}
              labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
              compact
            >
              View Renewal List ({expiringIn30Days.length + expiredVisas.length})
            </Button>
          )}
        </Surface>
      </Animated.View>
    );
  };

  // ENHANCED: Company distribution chart to replace VisaStatusChart
  const CompanyDistributionChart = () => {
    if (stats.companySummary.length === 0) {
      return (
        <Surface style={[styles.chartContainer, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Text variant="titleMedium" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
            Employee Distribution by Company
          </Text>
          <View style={styles.emptyChartState}>
            <IconButton
              icon="domain"
              size={48}
              iconColor={theme.colors.onSurfaceVariant}
            />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              No company data available
            </Text>
          </View>
        </Surface>
      );
    }

    // Take top 6 companies, group others as "Others"
    const topCompanies = stats.companySummary.slice(0, 6);
    const othersCount = stats.companySummary.slice(6).reduce((sum, company) => sum + company.total_employees, 0);
    
    const chartData = {
      labels: [
        ...topCompanies.map(company => 
          company.company.length > 15 ? company.company.substring(0, 15) + '...' : company.company
        ),
        ...(othersCount > 0 ? ['Others'] : [])
      ],
      datasets: [{
        data: [
          ...topCompanies.map(company => company.total_employees),
          ...(othersCount > 0 ? [othersCount] : [])
        ],
        colors: [...topCompanies, ...(othersCount > 0 ? [{ company: 'Others', total_employees: othersCount }] : [])].map((_, index) => 
          () => DASHBOARD_COLORS.gradients[index % DASHBOARD_COLORS.gradients.length]
        )
      }]
    };

    return (
      <Animated.View style={{ opacity: chartAnimation }}>
        <Surface style={[styles.chartContainer, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Text variant="titleLarge" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
            Employee Distribution by Company
          </Text>
          
          {/* Company Insights Summary */}
          <View style={[styles.insightCard, { 
            backgroundColor: DASHBOARD_COLORS.info + '10',
            borderLeftColor: DASHBOARD_COLORS.info,
            borderLeftWidth: 4,
            padding: 12,
            marginBottom: 16,
            borderRadius: 8,
          }]}>
            <Text variant="titleMedium" style={{ color: DASHBOARD_COLORS.info, fontWeight: 'bold' }}>
              📊 Company Insights
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginTop: 4 }}>
              Top company: {topCompanies[0]?.company} ({topCompanies[0]?.total_employees} employees)
              {topCompanies[0]?.urgent_renewals > 0 && ` • ${topCompanies[0].urgent_renewals} urgent renewals`}
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chartWrapper}>
              <BarChart
                data={chartData}
                width={Math.max(400, chartData.labels.length * 80)}
                height={260}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                  ...chartConfig,
                  decimalPlaces: 0,
                  propsForLabels: {
                    fontSize: 11,
                    fontWeight: '600',
                    fill: DESIGN_SYSTEM.colors.neutral[700],
                  },
                }}
                verticalLabelRotation={30}
                showValuesOnTopOfBars
                fromZero
                style={{
                  borderRadius: DESIGN_SYSTEM.borderRadius.lg,
                }}
              />
            </View>
          </ScrollView>
          
          {/* Enhanced Company Summary */}
          <View style={styles.chartSummary}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              {stats.totalCompanies} total companies • {topCompanies.length} shown
            </Text>
          </View>

          {/* Quick Action Button */}
          <Button
            mode="outlined"
            icon="domain"
            onPress={() => router.push('/(admin)/companies')}
            style={[styles.chartActionButton, { 
              borderColor: DASHBOARD_COLORS.info,
              marginTop: 12,
            }]}
            labelStyle={{ color: DASHBOARD_COLORS.info, fontWeight: 'bold' }}
            compact
          >
            View All Companies
          </Button>
        </Surface>
      </Animated.View>
    );
  };

  // ENHANCED: Trade distribution bar chart
  const TradeDistributionChart = () => {
    if (stats.tradeSummary.length === 0) {
      return (
        <Surface style={[styles.chartContainer, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Text variant="titleMedium" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
            Employee Distribution by Trade
          </Text>
          <View style={styles.emptyChartState}>
            <IconButton
              icon="chart-bar"
              size={48}
              iconColor={theme.colors.onSurfaceVariant}
            />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              No trade data available
            </Text>
          </View>
        </Surface>
      );
    }

    const topTrades = stats.tradeSummary.slice(0, 8); // Show top 8 trades
    const chartData = {
      labels: topTrades.map(trade => 
        trade.trade.length > 12 ? trade.trade.substring(0, 12) + '...' : trade.trade
      ),
      datasets: [{
        data: topTrades.map(trade => trade.employee_count),
        colors: topTrades.map((_, index) => () => DASHBOARD_COLORS.gradients[index % DASHBOARD_COLORS.gradients.length])
      }]
    };

    return (
      <Animated.View style={{ opacity: chartAnimation }}>
        <Surface style={[styles.chartContainer, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Text variant="titleLarge" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
            Employee Distribution by Trade
          </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chartWrapper}>
              <BarChart
                data={chartData}
                width={Math.max(400, topTrades.length * 60)}
                height={260}
                yAxisLabel=""
                yAxisSuffix=""
            chartConfig={{
              ...chartConfig,
                  decimalPlaces: 0,
                  propsForLabels: {
                    fontSize: 12,
                    fontWeight: '600',
                    fill: DESIGN_SYSTEM.colors.neutral[700],
                  },
                }}
                verticalLabelRotation={45}
                showValuesOnTopOfBars
                fromZero
            style={{
                  borderRadius: DESIGN_SYSTEM.borderRadius.lg,
            }}
          />
            </View>
        </ScrollView>
          
          {/* Summary Stats */}
          <View style={styles.chartSummary}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              Showing top {topTrades.length} trades • Total: {stats.totalTrades} trades
            </Text>
          </View>
      </Surface>
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <AdminLayout title="Dashboard" currentRoute="/(admin)/dashboard">
        <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator size="large" color={DASHBOARD_COLORS.primary} />
          <Text variant="bodyLarge" style={[styles.loadingText, { color: theme.colors.onSurface }]}>
            Loading dashboard...
        </Text>
      </View>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard" currentRoute="/(admin)/dashboard">
      <Animated.View style={[styles.container, { opacity: fadeAnimation, backgroundColor: theme.colors.background }]}>
      <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[DASHBOARD_COLORS.primary]}
              tintColor={DASHBOARD_COLORS.primary}
            />
          }
        >
          {/* ENHANCED: Welcome Header */}
          <Surface style={[styles.welcomeHeader, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <LinearGradient
              colors={[DASHBOARD_COLORS.primary + '10', 'transparent']}
              style={styles.welcomeGradient}
            >
              <View style={styles.welcomeContent}>
                <Text variant={isMobile ? "titleLarge" : "headlineMedium"} style={[styles.welcomeTitle, { 
                  color: theme.colors.onSurface,
                  fontSize: isMobile ? 18 : 24,
                  lineHeight: isMobile ? 20 : 28,
                  marginBottom: isMobile ? 4 : 8,
                }]}>
                  Welcome back, {user?.name || 'Admin'}! 👋
                </Text>
                <Text variant={isMobile ? "bodyMedium" : "bodyLarge"} style={[styles.welcomeSubtitle, { 
                  color: theme.colors.onSurfaceVariant,
                  fontSize: isMobile ? 13 : 16,
                  lineHeight: isMobile ? 15 : 20,
                  marginBottom: isMobile ? 4 : 8,
                }]}>
                  Here's your workforce overview for today
                </Text>
              </View>
              {!isMobile && (
                <View style={styles.welcomeStats}>
                  <Text variant="titleMedium" style={[styles.dateText, { color: DASHBOARD_COLORS.primary }]}>
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </Text>
                </View>
              )}
              {isMobile && (
                <View style={styles.mobileDate}>
                  <Text variant="bodySmall" style={[styles.mobileDateText, { 
                    color: DASHBOARD_COLORS.primary,
                    fontSize: 11,
                    fontWeight: '600',
                  }]}>
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </Text>
                </View>
              )}
            </LinearGradient>
          </Surface>

          {/* ENHANCED: Metrics Grid */}
          <View style={styles.metricsGrid}>
            <MetricCard
              title="Total Employees"
              value={stats.totalEmployees}
              icon="people"
              color={DASHBOARD_COLORS.primary}
              subtitle="Total workforce"
              onPress={() => router.push('/(admin)/employees')}
              index={0}
            />
            <MetricCard
              title="Active Employees"
              value={stats.activeEmployees}
              icon="person-add"
              color={DASHBOARD_COLORS.success}
              subtitle={`${((stats.activeEmployees / Math.max(stats.totalEmployees, 1)) * 100).toFixed(1)}% of total`}
              onPress={() => router.push('/(admin)/employees')}
              index={1}
            />
            <MetricCard
              title="Companies"
              value={stats.totalCompanies}
              icon="business"
              color={DASHBOARD_COLORS.info}
              subtitle="Active companies"
              index={2}
            />
            <MetricCard
              title="Trades"
              value={stats.totalTrades}
              icon="construct"
              color={DASHBOARD_COLORS.purple}
              subtitle="Different trades"
              index={3}
            />
            <MetricCard
              title="Expiring Visas"
              value={stats.expiringVisas}
              icon="calendar"
              color={DASHBOARD_COLORS.warning}
              subtitle="Next 30 days"
              onPress={() => router.push('/(admin)/employees')}
              index={4}
            />
            <MetricCard
              title="Expired Visas"
              value={stats.expiredVisas}
              icon="close-circle"
              color={DASHBOARD_COLORS.error}
              subtitle="Needs renewal"
              onPress={() => router.push('/(admin)/employees')}
              index={5}
            />
            <MetricCard
              title="Inactive"
              value={stats.inactiveEmployees}
              icon="person-remove"
              color={DESIGN_SYSTEM.colors.neutral[500]}
              subtitle="Inactive employees"
              index={6}
            />
            <MetricCard
              title="Urgent Renewals"
              value={stats.urgentRenewals}
              icon="warning"
              color={DASHBOARD_COLORS.error}
              subtitle="Immediate attention"
              onPress={() => router.push('/(admin)/notifications')}
              index={7}
            />
          </View>

          {/* Visa Renewal Alert - Full Width */}
          {(stats.expiringVisas > 0 || stats.expiredVisas > 0) && (
            <Surface style={[styles.urgentAlertCard, { 
              backgroundColor: theme.colors.surface,
              borderColor: DASHBOARD_COLORS.error,
              borderWidth: 2,
              borderRadius: 12,
              marginBottom: isMobile ? 12 : 20,
              padding: isMobile ? 12 : 16,
            }]} elevation={3}>
              <View style={styles.alertHeader}>
                <View style={styles.alertIcon}>
                  <IconButton
                    icon="calendar-alert"
                    size={isMobile ? 24 : 32}
                    iconColor={DASHBOARD_COLORS.error}
                    style={{ margin: 0 }}
                  />
                </View>
                <View style={styles.alertContent}>
                  <Text variant={isMobile ? "titleMedium" : "titleLarge"} style={[styles.alertTitle, { 
                    color: DASHBOARD_COLORS.error,
                    fontWeight: 'bold',
                    fontSize: isMobile ? 16 : 20,
                  }]}>
                    🚨 {stats.expiringVisas + stats.expiredVisas} Employees Need Visa Renewals
                  </Text>
                  <Text variant="bodyMedium" style={[styles.alertSubtitle, { 
                    color: theme.colors.onSurface,
                    marginTop: 4,
                    fontSize: isMobile ? 13 : 14,
                  }]}>
                    {stats.expiredVisas} visas already expired • {stats.expiringVisas} expiring within 30 days
                  </Text>
                </View>
                <Button
                  mode="contained"
                  icon="arrow-right"
                  onPress={() => router.push('/(admin)/employees')}
                  style={[styles.alertButton, { 
                    backgroundColor: DASHBOARD_COLORS.error,
                    borderRadius: 8,
                  }]}
                  labelStyle={{ 
                    color: '#ffffff', 
                    fontWeight: 'bold',
                    fontSize: isMobile ? 11 : 12,
                  }}
                  contentStyle={{
                    paddingHorizontal: isMobile ? 8 : 12,
                    paddingVertical: isMobile ? 4 : 6,
                  }}
                  compact={isMobile}
                >
                  {isMobile ? 'View' : 'View All'}
                </Button>
              </View>
            </Surface>
          )}

          {/* ENHANCED: Charts Section with Better Layout */}
          <View style={styles.chartsSection}>
            <Text variant={isMobile ? "titleLarge" : "headlineSmall"} style={[styles.chartsSectionTitle, { 
              color: theme.colors.onSurface,
              marginBottom: isMobile ? 12 : 16,
              fontWeight: 'bold',
            }]}>
              Analytics & Insights
            </Text>
            
            {/* Charts Grid - Fixed Responsive Layout */}
            <View style={styles.chartsGrid}>
              {/* Row 1: Visa Expiry Chart - Full Width on Mobile */}
              <View style={[styles.chartWrapper, { 
                width: '100%',
                marginBottom: isMobile ? 12 : 16,
              }]}>
                <VisaExpiryBreakdownChart />
              </View>
              
              {/* Row 2: Company & Trade Charts - Side by Side on Desktop */}
              <View style={[styles.chartDualRow, {
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? 12 : 16,
              }]}>
                <View style={[styles.chartWrapper, { 
                  flex: 1,
                  marginBottom: isMobile ? 12 : 0,
                }]}>
                  <CompanyDistributionChart />
                </View>
                
                <View style={[styles.chartWrapper, { 
                  flex: 1,
                }]}>
                  <TradeDistributionChart />
                </View>
              </View>
            </View>
          </View>

          {/* ENHANCED: Compact Quick Actions with Better Spacing */}
          <Surface style={[styles.quickActionsSection, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <View style={styles.quickActionsHeader}>
              <Text variant={isMobile ? "titleMedium" : "titleLarge"} style={[styles.sectionTitle, { 
                color: theme.colors.onSurface,
                marginBottom: 4,
                fontWeight: 'bold',
              }]}>
                Quick Actions
              </Text>
              <Text variant="bodySmall" style={{ 
                color: theme.colors.onSurfaceVariant,
                fontStyle: 'italic',
                marginBottom: isMobile ? 12 : 16,
              }}>
                Essential tasks at your fingertips
              </Text>
            </View>
            
            <View style={[styles.quickActionsGrid, {
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: isMobile ? 8 : 12,
              justifyContent: 'space-between',
            }]}>
              <TouchableOpacity
                onPress={() => router.push('/(admin)/employees/new')}
                style={[styles.quickActionCard, { 
                  backgroundColor: DASHBOARD_COLORS.primary + '15',
                  width: isMobile ? '48%' : '32%',
                  minWidth: isMobile ? 140 : 180,
                }]}
              >
                <View style={styles.quickActionIconContainer}>
                  <IconButton
                    icon="account-plus"
                    size={isMobile ? 20 : 24}
                    iconColor={DASHBOARD_COLORS.primary}
                    style={{ margin: 0 }}
                  />
                </View>
                <Text variant="labelMedium" style={[styles.quickActionLabel, { 
                  color: DASHBOARD_COLORS.primary,
                  fontWeight: 'bold',
                  fontSize: isMobile ? 12 : 14,
                  textAlign: 'center',
                }]}>
                  {isMobile ? 'Add Employee' : 'Add New Employee'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/(admin)/notifications')}
                style={[styles.quickActionCard, { 
                  backgroundColor: DASHBOARD_COLORS.warning + '15',
                  width: isMobile ? '48%' : '32%',
                  minWidth: isMobile ? 140 : 180,
                }]}
              >
                <View style={styles.quickActionIconContainer}>
                  <IconButton
                    icon="email-send"
                    size={isMobile ? 20 : 24}
                    iconColor={DASHBOARD_COLORS.warning}
                    style={{ margin: 0 }}
                  />
                </View>
                <Text variant="labelMedium" style={[styles.quickActionLabel, { 
                  color: DASHBOARD_COLORS.warning,
                  fontWeight: 'bold',
                  fontSize: isMobile ? 12 : 14,
                  textAlign: 'center',
                }]}>
                  {isMobile ? 'Send Alerts' : 'Send Notifications'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/(admin)/documents')}
                style={[styles.quickActionCard, { 
                  backgroundColor: DASHBOARD_COLORS.info + '15',
                  width: isMobile ? '48%' : '32%',
                  minWidth: isMobile ? 140 : 180,
                }]}
              >
                <View style={styles.quickActionIconContainer}>
                  <IconButton
                    icon="upload"
                    size={isMobile ? 20 : 24}
                    iconColor={DASHBOARD_COLORS.info}
                    style={{ margin: 0 }}
                  />
                </View>
                <Text variant="labelMedium" style={[styles.quickActionLabel, { 
                  color: DASHBOARD_COLORS.info,
                  fontWeight: 'bold',
                  fontSize: isMobile ? 12 : 14,
                  textAlign: 'center',
                }]}>
                  {isMobile ? 'Upload Docs' : 'Upload Documents'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/(admin)/reports')}
                style={[styles.quickActionCard, { 
                  backgroundColor: DASHBOARD_COLORS.success + '15',
                  width: isMobile ? '48%' : '32%',
                  minWidth: isMobile ? 140 : 180,
                }]}
              >
                <View style={styles.quickActionIconContainer}>
                  <IconButton
                    icon="chart-line"
                    size={isMobile ? 20 : 24}
                    iconColor={DASHBOARD_COLORS.success}
                    style={{ margin: 0 }}
                  />
                </View>
                <Text variant="labelMedium" style={[styles.quickActionLabel, { 
                  color: DASHBOARD_COLORS.success,
                  fontWeight: 'bold',
                  fontSize: isMobile ? 12 : 14,
                  textAlign: 'center',
                }]}>
                  {isMobile ? 'Reports' : 'Generate Reports'}
                </Text>
              </TouchableOpacity>
            </View>
          </Surface>
        </ScrollView>
      </Animated.View>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    padding: isMobile ? 12 : 20,
  },
  welcomeHeader: {
    padding: isMobile ? 12 : 20,
    borderRadius: 0,
    marginBottom: isMobile ? 12 : 20,
  },
  welcomeGradient: {
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'flex-start' : 'center',
    padding: isMobile ? 12 : 20,
    borderRadius: 0,
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeTitle: {
    marginBottom: isMobile ? 4 : 8,
    fontWeight: 'bold',
    textAlign: 'left',
    fontSize: isMobile ? 18 : 24,
  },
  welcomeSubtitle: {
    marginBottom: isMobile ? 4 : 8,
    fontWeight: '500',
    textAlign: 'left',
  },
  welcomeStats: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: isMobile ? 12 : 20,
    gap: isMobile ? 8 : 12,
    justifyContent: 'space-between',
    paddingHorizontal: isMobile ? 4 : 0,
  },
  metricCard: {
    width: isMobile ? (width - 40) / 2 : isTablet ? (width - 80) / 3 : (width - 120) / 4,
    borderRadius: isMobile ? 12 : 16,
    marginBottom: isMobile ? 8 : 12,
    minHeight: isMobile ? 100 : 120,
    maxWidth: isMobile ? 180 : 220,
  },
  metricSurface: {
    flex: 1,
    borderRadius: isMobile ? 12 : 16,
    overflow: 'hidden',
  },
  metricContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  metricGradient: {
    flex: 1,
    borderRadius: isMobile ? 12 : 16,
    padding: isMobile ? 12 : 16,
    justifyContent: 'space-between',
    minHeight: isMobile ? 96 : 116,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: isMobile ? 8 : 12,
  },
  metricIconContainer: {
    margin: 0,
    marginRight: isMobile ? 6 : 8,
  },
  metricIcon: {
    marginRight: isMobile ? 8 : 12,
  },
  metricChevron: {
    marginLeft: 'auto',
  },
  metricTextSection: {
    flex: 1,
  },
  metricTitle: {
    fontSize: isMobile ? 12 : 14,
    fontWeight: '700',
    flex: 1,
    lineHeight: isMobile ? 14 : 16,
  },
  metricValue: {
    fontSize: isMobile ? 20 : 24,
    fontWeight: 'bold',
    marginVertical: isMobile ? 4 : 6,
    lineHeight: isMobile ? 22 : 26,
  },
  metricSubtitle: {
    fontSize: isMobile ? 10 : 11,
    fontWeight: '500',
    opacity: 0.8,
    lineHeight: isMobile ? 12 : 13,
  },
  chartsSection: {
    marginBottom: isMobile ? 16 : 24,
    paddingHorizontal: isMobile ? 4 : 0,
  },
  chartsSectionTitle: {
    fontWeight: 'bold',
    marginBottom: isMobile ? 12 : 16,
    paddingHorizontal: isMobile ? 8 : 0,
  },
  chartsGrid: {
    gap: isMobile ? 12 : 16,
  },
  chartWrapper: {
    borderRadius: isMobile ? 12 : 16,
    overflow: 'hidden',
  },
  chartRow: {
    marginBottom: isMobile ? 12 : 16,
  },
  chartContainer: {
    borderRadius: isMobile ? 12 : 16,
    padding: isMobile ? 12 : 16,
    marginHorizontal: isMobile ? 4 : 0,
    marginBottom: isMobile ? 12 : 16,
  },
  chartTitle: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: 'bold',
    marginBottom: isMobile ? 8 : 12,
  },
  chartContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isMobile ? 8 : 12,
  },
  chartInsights: {
    marginTop: isMobile ? 8 : 12,
    paddingTop: isMobile ? 8 : 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  insightLabel: {
    fontWeight: '500',
    flex: 1,
  },
  insightValue: {
    fontWeight: '600',
    textAlign: 'right',
    flex: 2,
  },
  emptyChartState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isMobile ? 20 : 30,
  },
  emptyStateText: {
    marginTop: 8,
    textAlign: 'center',
  },
  quickActionsSection: {
    padding: isMobile ? 16 : 20,
    borderRadius: isMobile ? 12 : 16,
    marginBottom: isMobile ? 16 : 20,
    marginHorizontal: isMobile ? 4 : 0,
  },
  quickActionsHeader: {
    marginBottom: isMobile ? 12 : 16,
    alignItems: 'flex-start',
  },
  sectionTitle: {
    fontSize: isMobile ? 16 : 20,
    fontWeight: 'bold',
    marginBottom: isMobile ? 8 : 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: isMobile ? 8 : 12,
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: isMobile ? '48%' : '32%',
    aspectRatio: isMobile ? 1.2 : 1.1,
    borderRadius: isMobile ? 12 : 16,
    padding: isMobile ? 12 : 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: isMobile ? 8 : 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  quickActionIconContainer: {
    marginBottom: isMobile ? 6 : 8,
  },
  quickActionLabel: {
    textAlign: 'center',
    fontSize: isMobile ? 11 : 12,
    lineHeight: isMobile ? 13 : 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  legendItem: {
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
  },
  chartSummary: {
    marginTop: 12,
    alignItems: 'center',
  },
  alertCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIcon: {
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontWeight: 'bold',
    fontSize: isMobile ? 16 : 20,
  },
  alertSubtitle: {
    fontSize: isMobile ? 13 : 14,
  },
  alertButton: {
    marginLeft: 'auto',
  },
  chartDualRow: {
    flexDirection: 'row',
    gap: isMobile ? 12 : 16,
  },
  mobileDate: {
    alignItems: isMobile ? 'flex-start' : 'flex-end',
    marginTop: isMobile ? 8 : 0,
  },
  mobileDateText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chartActionButton: {
    marginTop: 12,
  },
  urgentAlertCard: {
    padding: 12,
    borderRadius: 12,
    marginBottom: isMobile ? 12 : 20,
  },
  insightCard: {
    borderRadius: 8,
    marginBottom: 12,
  },
});

export default withAuthGuard({
  WrappedComponent: AdminDashboard,
  allowedRoles: ['admin']
});

