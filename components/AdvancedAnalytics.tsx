import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { Card, Button, Chip, ProgressBar, useTheme } from 'react-native-paper';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { useEmployees } from '../hooks/useEmployees';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 32;

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, color = '#2196F3' }) => (
  <Card style={[styles.metricCard, { borderLeftColor: color }]}>
    <Card.Content>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </Card.Content>
  </Card>
);

export const AdvancedAnalytics: React.FC = () => {
  const { employees } = useEmployees();
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const analyticsData = useMemo(() => {
    if (!employees || employees.length === 0) {
      return { totalEmployees: 0, activeEmployees: 0, expiredVisas: 0, expiringVisas: 0, byCompany: {}, visaStatusDistribution: {} };
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(emp => emp.visa_status === 'ACTIVE').length;
    
    let expiredVisas = 0;
    let expiringVisas = 0;

    employees.forEach(emp => {
      if (emp.visa_expiry_date) {
        const expiryDate = new Date(emp.visa_expiry_date);
        if (expiryDate < now) expiredVisas++;
        else if (expiryDate <= thirtyDaysFromNow) expiringVisas++;
      }
    });

    const byCompany = employees.reduce((acc, emp) => {
      const company = emp.company_name || 'Unknown';
      acc[company] = (acc[company] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const visaStatusDistribution = employees.reduce((acc, emp) => {
      const status = emp.visa_status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { totalEmployees, activeEmployees, expiredVisas, expiringVisas, byCompany, visaStatusDistribution };
  }, [employees]);

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  };

  const barChartData = {
    labels: Object.keys(analyticsData.byCompany).slice(0, 5),
    datasets: [{ data: Object.values(analyticsData.byCompany).slice(0, 5) }],
  };

  const pieChartData = Object.entries(analyticsData.visaStatusDistribution).map(([status, count], index) => ({
    name: status,
    population: count,
    color: ['#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0'][index % 5],
    legendFontColor: '#000000',
    legendFontSize: 12,
  }));

  return (
    <ScrollView style={styles.container}>
      <View style={styles.timeRangeContainer}>
        {['7d', '30d', '90d', '1y'].map((range) => (
          <Chip key={range} selected={selectedTimeRange === range} onPress={() => setSelectedTimeRange(range as any)}>
            {range.toUpperCase()}
          </Chip>
        ))}
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard title="Total Employees" value={analyticsData.totalEmployees} subtitle="Registered" color="#2196F3" />
        <MetricCard title="Active Employees" value={analyticsData.activeEmployees} subtitle="Working" color="#4CAF50" />
        <MetricCard title="Expired Visas" value={analyticsData.expiredVisas} subtitle="Need attention" color="#F44336" />
        <MetricCard title="Expiring Soon" value={analyticsData.expiringVisas} subtitle="Next 30 days" color="#FF9800" />
      </View>

      {Object.keys(analyticsData.byCompany).length > 0 && (
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text style={styles.chartTitle}>Employees by Company</Text>
            <BarChart data={barChartData} width={chartWidth - 32} height={220} chartConfig={chartConfig} yAxisLabel="" yAxisSuffix="" />
          </Card.Content>
        </Card>
      )}

      {pieChartData.length > 0 && (
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text style={styles.chartTitle}>Visa Status Distribution</Text>
            <PieChart data={pieChartData} width={chartWidth - 32} height={220} chartConfig={chartConfig} accessor="population" backgroundColor="transparent" paddingLeft="15" />
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  timeRangeContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  metricCard: { width: '48%', marginBottom: 12, borderLeftWidth: 4 },
  metricTitle: { fontSize: 12, color: '#666', marginBottom: 4 },
  metricValue: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  metricSubtitle: { fontSize: 10, color: '#999' },
  chartCard: { marginBottom: 16 },
  chartTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16, color: '#333' },
});
