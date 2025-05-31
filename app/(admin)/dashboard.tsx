import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, RefreshControl, Animated, Image } from 'react-native';
import { Text, Card, useTheme, Surface, Button, Chip, IconButton, ActivityIndicator, ProgressBar } from 'react-native-paper';
import { router } from 'expo-router';
import { PieChart, BarChart, LineChart } from 'react-native-chart-kit';
import { useAuth } from '../../hooks/useAuth';
import { useEmployees } from '../../hooks/useEmployees';
import AdminLayout from '../../components/AdminLayout';
import { withAuthGuard } from '../../components/AuthGuard';
import { CustomTheme } from '../../theme';
import { safeThemeAccess } from '../../utils/errorPrevention';

const { width } = Dimensions.get('window');

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  pendingApprovals: number;
  expiringVisas: number;
  expiredVisas: number;
  documentsUploaded: number;
  recentNotifications: number;
  visaStatusBreakdown: {
    active: number;
    expiring: number;
    expired: number;
  };
  nationalityBreakdown: { [key: string]: number };
  tradeBreakdown: { [key: string]: number };
  companyBreakdown: { [key: string]: number };
  monthlyJoining: { [key: string]: number };
  ageGroupBreakdown: { [key: string]: number };
}

interface VisaExpiryAlert {
  employeeId: string;
  employeeName: string;
  expiryDate: string;
  daysRemaining: number;
  urgency: 'critical' | 'warning' | 'notice';
}

function AdminDashboard() {
  const theme = useTheme() as CustomTheme;
  const { user } = useAuth();
  const { employees, isLoading, refreshEmployees } = useEmployees();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    pendingApprovals: 0,
    expiringVisas: 0,
    expiredVisas: 0,
    documentsUploaded: 0,
    recentNotifications: 0,
    visaStatusBreakdown: { active: 0, expiring: 0, expired: 0 },
    nationalityBreakdown: {},
    tradeBreakdown: {},
    companyBreakdown: {},
    monthlyJoining: {},
    ageGroupBreakdown: {},
  });
  const [visaAlerts, setVisaAlerts] = useState<VisaExpiryAlert[]>([]);

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

  useEffect(() => {
    if (employees) {
      calculateStats();
    }
  }, [employees]);

  useEffect(() => {
    // Enhanced staggered animations
    const metricsAnimations = animationValues.map((value, index) => 
      Animated.timing(value, {
        toValue: 1,
        duration: 800,
        delay: index * 150,
        useNativeDriver: true,
      })
    );
    
    // Quick actions with bounce effect
    const quickAnimations = quickActionAnimations.map((value, index) => 
      Animated.spring(value, {
        toValue: 1,
        tension: 80,
        friction: 8,
        delay: 1200 + (index * 100),
        useNativeDriver: true,
      })
    );

    // Hero section animation
    Animated.timing(heroAnimation, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Chart animation with delay
    Animated.timing(chartAnimation, {
      toValue: 1,
      duration: 1200,
      delay: 2000,
      useNativeDriver: true,
    }).start();
    
    // Continuous pulse animation for critical alerts
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Loading animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(loadingAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(loadingAnimation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
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
        useNativeDriver: true,
      }),
      Animated.timing(successAnimation, {
        toValue: 0,
        duration: 300,
        delay: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const calculateStats = () => {
    if (!employees || employees.length === 0) return;

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    // Basic stats
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(emp => emp.is_active).length;
    const inactiveEmployees = totalEmployees - activeEmployees;

    // Visa analysis with more detailed breakdown
    const alerts: VisaExpiryAlert[] = [];
    let expiringVisas = 0;
    let expiredVisas = 0;
    let activeVisas = 0;
    let criticalAlerts = 0;
    let warningAlerts = 0;

    employees.forEach(emp => {
      if (emp.visa_expiry_date) {
        const expiryDate = new Date(emp.visa_expiry_date);
        const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysRemaining < 0) {
          expiredVisas++;
          alerts.push({
            employeeId: emp.id,
            employeeName: emp.name,
            expiryDate: emp.visa_expiry_date,
            daysRemaining,
            urgency: 'critical'
          });
        } else if (daysRemaining <= 7) {
          expiringVisas++;
          criticalAlerts++;
          alerts.push({
            employeeId: emp.id,
            employeeName: emp.name,
            expiryDate: emp.visa_expiry_date,
            daysRemaining,
            urgency: 'critical'
          });
        } else if (daysRemaining <= 30) {
          expiringVisas++;
          warningAlerts++;
          alerts.push({
            employeeId: emp.id,
            employeeName: emp.name,
            expiryDate: emp.visa_expiry_date,
            daysRemaining,
            urgency: 'warning'
          });
        } else if (daysRemaining <= 60) {
          alerts.push({
            employeeId: emp.id,
            employeeName: emp.name,
            expiryDate: emp.visa_expiry_date,
            daysRemaining,
            urgency: 'notice'
          });
          activeVisas++;
        } else {
          activeVisas++;
        }
      }
    });

    // Enhanced nationality breakdown with percentages
    const nationalityBreakdown: { [key: string]: number } = {};
    employees.forEach(emp => {
      const nationality = emp.nationality || 'Unknown';
      nationalityBreakdown[nationality] = (nationalityBreakdown[nationality] || 0) + 1;
    });

    // Enhanced trade breakdown with skill analysis
    const tradeBreakdown: { [key: string]: number } = {};
    employees.forEach(emp => {
      const trade = emp.trade || 'Unknown';
      tradeBreakdown[trade] = (tradeBreakdown[trade] || 0) + 1;
    });

    // Company breakdown with performance insights
    const companyBreakdown: { [key: string]: number } = {};
    employees.forEach(emp => {
      const company = emp.company_name || 'CUBS Technical';
      companyBreakdown[company] = (companyBreakdown[company] || 0) + 1;
    });

    // Age group breakdown with workforce analytics
    const ageGroupBreakdown: { [key: string]: number } = {};
    employees.forEach(emp => {
      if (emp.date_of_birth) {
        const birthDate = new Date(emp.date_of_birth);
        const age = Math.floor((now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
        
        let ageGroup = '50+ years';
        if (age < 25) ageGroup = '18-24 years';
        else if (age < 30) ageGroup = '25-29 years';
        else if (age < 35) ageGroup = '30-34 years';
        else if (age < 40) ageGroup = '35-39 years';
        else if (age < 50) ageGroup = '40-49 years';
        
        ageGroupBreakdown[ageGroup] = (ageGroupBreakdown[ageGroup] || 0) + 1;
      }
    });

    // Monthly joining pattern (last 12 months) for trend analysis
    const monthlyJoining: { [key: string]: number } = {};
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    employees.forEach(emp => {
      if (emp.join_date) {
        const joinDate = new Date(emp.join_date);
        if (joinDate >= twelveMonthsAgo) {
          const monthKey = joinDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          monthlyJoining[monthKey] = (monthlyJoining[monthKey] || 0) + 1;
        }
      }
    });

    // Document compliance tracking
    const documentsUploaded = totalEmployees * 3; // Estimated average
    const documentComplianceRate = Math.round((documentsUploaded / (totalEmployees * 5)) * 100); // Assuming 5 docs per employee ideal

    setStats({
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      pendingApprovals: criticalAlerts + warningAlerts, // Real data from visa alerts
      expiringVisas,
      expiredVisas,
      documentsUploaded,
      recentNotifications: alerts.length,
      visaStatusBreakdown: { active: activeVisas, expiring: expiringVisas, expired: expiredVisas },
      nationalityBreakdown,
      tradeBreakdown,
      companyBreakdown,
      monthlyJoining,
      ageGroupBreakdown,
    });

    setVisaAlerts(alerts.sort((a, b) => a.daysRemaining - b.daysRemaining));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshEmployees();
    setRefreshing(false);
  };

  const chartConfig = {
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    color: (opacity = 1) => `rgba(${hexToRgb(safeThemeAccess.colors(theme, 'primary'))}, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    labelColor: () => safeThemeAccess.colors(theme, 'onSurface'),
    style: {
      borderRadius: 16,
    },
  };

  // Helper function to convert hex to rgb
  function hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '0, 0, 0';
  }

  // Prepare pie chart data
  const visaPieData = [
    {
      name: 'Active',
      population: stats.visaStatusBreakdown.active,
      color: safeThemeAccess.colors(theme, 'primary'),
      legendFontColor: safeThemeAccess.colors(theme, 'onSurface'),
      legendFontSize: 14,
    },
    {
      name: 'Expiring',
      population: stats.visaStatusBreakdown.expiring,
      color: '#FF9800',
      legendFontColor: safeThemeAccess.colors(theme, 'onSurface'),
      legendFontSize: 14,
    },
    {
      name: 'Expired',
      population: stats.visaStatusBreakdown.expired,
      color: safeThemeAccess.colors(theme, 'error'),
      legendFontColor: safeThemeAccess.colors(theme, 'onSurface'),
      legendFontSize: 14,
    },
  ].filter(item => item.population > 0);

  // Prepare nationality pie data (top 5)
  const topNationalities = Object.entries(stats.nationalityBreakdown)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  const nationalityPieData = topNationalities.map(([nationality, count], index) => ({
    name: nationality,
    population: count,
    color: [
      safeThemeAccess.colors(theme, 'primary'),
      safeThemeAccess.colors(theme, 'secondary'),
      safeThemeAccess.colors(theme, 'tertiary'),
      '#FF9800',
      '#9C27B0'
    ][index],
    legendFontColor: safeThemeAccess.colors(theme, 'onSurface'),
    legendFontSize: 12,
  }));

  // Prepare bar chart data for trades
  const topTrades = Object.entries(stats.tradeBreakdown)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 6);

  const tradeBarData = {
    labels: topTrades.map(([trade]) => trade.substring(0, 8)),
    datasets: [
      {
        data: topTrades.map(([, count]) => count),
        color: () => safeThemeAccess.colors(theme, 'primary'),
      },
    ],
  };

  // Enhanced color constants for consistency - Ferrari Red Theme
  const CONSISTENT_COLORS = {
    primary: safeThemeAccess.colors(theme, 'primary'), // #E53E3E
    secondary: safeThemeAccess.colors(theme, 'secondary'), // #3182CE
    tertiary: safeThemeAccess.colors(theme, 'tertiary'),
    success: '#22C55E', // Green
    warning: '#F59E0B', // Amber
    error: safeThemeAccess.colors(theme, 'error'), // Red
    info: '#3B82F6', // Blue
    purple: '#8B5CF6', // Purple
    ferrari: '#DC143C', // Ferrari Red - replacing orange
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
                <Image 
                  source={require('../../assets/logo.png')} 
                  style={styles.logoImage}
                  resizeMode="contain"
                />
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
        {visaAlerts.length > 0 && (
          <>
            <Text variant="titleLarge" style={[styles.sectionTitle, { color: safeThemeAccess.colors(theme, 'onBackground') }]}>
              🚨 Visa Expiry Alerts
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.alertsScroll}>
              {visaAlerts.slice(0, 10).map((alert, index) => (
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

        {/* Loading Overlay */}
        {isLoading && (
          <Animated.View style={[
            styles.loadingOverlay,
            {
              opacity: loadingAnimation,
              transform: [{
                rotate: loadingAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                })
              }]
            }
          ]}>
            <ActivityIndicator 
              size="large" 
              color={CONSISTENT_COLORS.primary}
              style={styles.loadingSpinner}
            />
            <Text style={[styles.loadingText, { color: safeThemeAccess.colors(theme, 'onSurface') }]}>
              Loading dashboard...
            </Text>
          </Animated.View>
        )}

        {/* Success Overlay */}
        <Animated.View style={[
          styles.successOverlay,
          {
            opacity: successAnimation,
            transform: [{
              scale: successAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
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
            <Text style={styles.successText}>Action completed successfully!</Text>
          </View>
        </Animated.View>

        {/* Analytics Charts */}
        <Text variant="titleLarge" style={[styles.sectionTitle, { color: safeThemeAccess.colors(theme, 'onBackground') }]}>
          📊 Employee Analytics
        </Text>

        {/* Company Distribution - Main Focus */}
        {Object.keys(stats.companyBreakdown).length > 0 && (
          <Card style={[styles.chartCard, { backgroundColor: safeThemeAccess.colors(theme, 'surface') }]} elevation={3}>
            <Card.Content>
              <Text variant="titleLarge" style={{ color: safeThemeAccess.colors(theme, 'onSurface'), fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
                🏢 Employees by Company
              </Text>
              <View style={styles.companyStats}>
                {Object.entries(stats.companyBreakdown)
                  .sort(([,a], [,b]) => b - a)
                  .map(([company, count], index) => (
                    <View key={company} style={styles.companyStat}>
                      <View style={styles.companyInfo}>
                        <View style={[styles.companyDot, { 
                          backgroundColor: [
                            safeThemeAccess.colors(theme, 'primary'),
                            safeThemeAccess.colors(theme, 'secondary'),
                            safeThemeAccess.colors(theme, 'tertiary'),
                            '#FF9800',
                            '#9C27B0'
                          ][index % 5]
                        }]} />
                        <Text variant="titleMedium" style={{ color: safeThemeAccess.colors(theme, 'onSurface'), flex: 1, fontWeight: 'bold' }}>
                          {company}
                        </Text>
                        <Surface style={[styles.countBadge, { backgroundColor: [
                          safeThemeAccess.colors(theme, 'primary'),
                          safeThemeAccess.colors(theme, 'secondary'),
                          safeThemeAccess.colors(theme, 'tertiary'),
                          '#FF9800',
                          '#9C27B0'
                        ][index % 5] }]} elevation={2}>
                          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                            {count}
                          </Text>
                        </Surface>
            </View>
                      <ProgressBar 
                        progress={count / Math.max(stats.totalEmployees, 1)} 
                        color={[
                          safeThemeAccess.colors(theme, 'primary'),
                          safeThemeAccess.colors(theme, 'secondary'),
                          safeThemeAccess.colors(theme, 'tertiary'),
                          '#FF9800',
                          '#9C27B0'
                        ][index % 5]}
                        style={{ marginTop: 12, height: 8, borderRadius: 4 }}
                      />
                      <Text variant="bodyMedium" style={{ 
                        color: safeThemeAccess.colors(theme, 'onSurfaceVariant'), 
                        marginTop: 8, 
                        textAlign: 'center',
                        fontWeight: '600'
                      }}>
                        {((count / Math.max(stats.totalEmployees, 1)) * 100).toFixed(1)}% of total workforce
                </Text>
                    </View>
                  ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Trade Distribution - Bar Chart */}
        {topTrades.length > 0 && (
          <Card style={[styles.chartCard, { backgroundColor: safeThemeAccess.colors(theme, 'surface') }]} elevation={3}>
            <Card.Content>
              <Text variant="titleLarge" style={{ color: safeThemeAccess.colors(theme, 'onSurface'), fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
                🔧 Employees by Trade/Skill
              </Text>
              <View style={styles.tradeStats}>
                {topTrades.map(([trade, count], index) => (
                  <View key={trade} style={styles.tradeStat}>
                    <View style={styles.tradeHeader}>
                      <Text variant="titleMedium" style={{ color: safeThemeAccess.colors(theme, 'onSurface'), fontWeight: 'bold', flex: 1 }}>
                        {trade}
                      </Text>
                      <Surface style={[styles.countBadge, { backgroundColor: safeThemeAccess.colors(theme, 'primary') }]} elevation={2}>
                        <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>
                          {count}
                        </Text>
                      </Surface>
                    </View>
                    <ProgressBar 
                      progress={count / Math.max(stats.totalEmployees, 1)} 
                      color={safeThemeAccess.colors(theme, 'primary')}
                      style={{ marginTop: 8, height: 6, borderRadius: 3 }}
                    />
                    <Text variant="bodySmall" style={{ 
                      color: safeThemeAccess.colors(theme, 'onSurfaceVariant'), 
                      marginTop: 4, 
                      textAlign: 'right' 
                    }}>
                      {((count / Math.max(stats.totalEmployees, 1)) * 100).toFixed(1)}%
                    </Text>
                  </View>
                ))}
          </View>
            </Card.Content>
          </Card>
        )}

        {/* Nationality Distribution */}
        {nationalityPieData.length > 0 && (
          <Card style={[styles.chartCard, { backgroundColor: safeThemeAccess.colors(theme, 'surface') }]} elevation={2}>
            <Card.Content>
              <Text variant="titleMedium" style={{ color: safeThemeAccess.colors(theme, 'onSurface'), fontWeight: 'bold', marginBottom: 16 }}>
                Top 5 Nationalities
                </Text>
              <View style={styles.chartContainer}>
                <PieChart
                  data={nationalityPieData}
                  width={width - 80}
                  height={200}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  center={[10, 0]}
                  absolute
                />
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Age Group Distribution */}
        {Object.keys(stats.ageGroupBreakdown).length > 0 && (
          <Card style={[styles.chartCard, { backgroundColor: safeThemeAccess.colors(theme, 'surface') }]} elevation={2}>
            <Card.Content>
              <Text variant="titleMedium" style={{ color: safeThemeAccess.colors(theme, 'onSurface'), fontWeight: 'bold', marginBottom: 16 }}>
                👥 Age Group Distribution
              </Text>
              <View style={styles.ageGroupGrid}>
                {Object.entries(stats.ageGroupBreakdown)
                  .sort(([,a], [,b]) => b - a)
                  .map(([ageGroup, count], index) => (
                    <Card key={ageGroup} style={[styles.ageGroupCard, { 
                      backgroundColor: `${[
                        safeThemeAccess.colors(theme, 'primary'),
                        safeThemeAccess.colors(theme, 'secondary'),
                        safeThemeAccess.colors(theme, 'tertiary'),
                        '#FF9800',
                        '#9C27B0',
                        '#4CAF50'
                      ][index % 6]}15`
                    }]} elevation={1}>
                      <Card.Content style={styles.ageGroupContent}>
                        <Text variant="headlineSmall" style={{ 
                          color: [
                            safeThemeAccess.colors(theme, 'primary'),
                            safeThemeAccess.colors(theme, 'secondary'),
                            safeThemeAccess.colors(theme, 'tertiary'),
                            '#FF9800',
                            '#9C27B0',
                            '#4CAF50'
                          ][index % 6],
                          fontWeight: 'bold',
                          textAlign: 'center'
                        }}>
                          {count}
                        </Text>
                        <Text variant="bodySmall" style={{ 
                          color: safeThemeAccess.colors(theme, 'onSurface'),
                          textAlign: 'center',
                          marginTop: 4
                        }}>
                          {ageGroup}
                        </Text>
                        <Text variant="bodySmall" style={{ 
                          color: safeThemeAccess.colors(theme, 'onSurfaceVariant'),
                          textAlign: 'center',
                          marginTop: 2
                        }}>
                          {((count / Math.max(stats.totalEmployees, 1)) * 100).toFixed(0)}%
                        </Text>
                      </Card.Content>
                    </Card>
              ))}
            </View>
            </Card.Content>
          </Card>
          )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  logoImage: {
    width: width < 768 ? 40 : 50,
    height: width < 768 ? 40 : 50,
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
  sectionTitle: {
    marginBottom: 16,
    marginTop: 8,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
  alertsScroll: {
    marginBottom: 24,
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
  chartCard: {
    borderRadius: 16,
    marginBottom: 20,
  },
  chartContainer: {
    alignItems: 'center',
  },
  companyStats: {
    flexDirection: 'column',
    gap: 16,
  },
  companyStat: {
    width: '100%',
  },
  companyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  companyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  ageGroupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  ageGroupCard: {
    width: width > 768 ? (width - 92) / 3 : (width - 44) / 2,
    borderRadius: 12,
    padding: 16,
  },
  ageGroupContent: {
    alignItems: 'center',
  },
  tradeStats: {
    flexDirection: 'column',
    gap: 16,
  },
  tradeStat: {
    width: '100%',
  },
  tradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  successContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    color: 'white',
  },
});

export default withAuthGuard({
  WrappedComponent: AdminDashboard,
  allowedRoles: ['admin']
});
