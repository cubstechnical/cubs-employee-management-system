import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Surface, Text, Card, useTheme } from 'react-native-paper';
import { MODERN_COLORS, SPACING, StatusBadge, ModernCard } from './ModernDesignSystem';
import { getDeviceInfo, getResponsiveSpacing } from '../utils/mobileUtils';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
  trend?: 'up' | 'down' | 'stable';
  percentage?: number;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  icon?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

// Enhanced Metrics Card
export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  color = MODERN_COLORS.primary[500],
  size = 'md',
}) => {
  const { isPhone } = getDeviceInfo();
  const spacing = getResponsiveSpacing('md');

  const sizes = {
    sm: { padding: SPACING[4], iconSize: 20, valueSize: 24 },
    md: { padding: SPACING[6], iconSize: 24, valueSize: 32 },
    lg: { padding: SPACING[8], iconSize: 28, valueSize: 40 },
  };

  const getTrendColor = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return MODERN_COLORS.success[500];
      case 'down': return MODERN_COLORS.error[500];
      case 'stable': return MODERN_COLORS.gray[500];
      default: return MODERN_COLORS.gray[500];
    }
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      case 'stable': return '→';
      default: return '';
    }
  };

  return (
    <ModernCard
      variant="elevated"
      padding={size === 'sm' ? 4 : 6}
      style={[
        styles.metricCard,
        { minHeight: isPhone ? 120 : 140 },
        isPhone && size === 'lg' && { minHeight: 160 }
      ]}
    >
      <View style={styles.metricHeader}>
        <View style={styles.metricTitleRow}>
          {icon && (
            <View style={[
              styles.metricIcon,
              { backgroundColor: color + '15' }
            ]}>
              <Text style={[styles.metricIconText, { color }]}>
                {icon}
              </Text>
            </View>
          )}
          <Text variant="labelMedium" style={styles.metricTitle}>
            {title}
          </Text>
        </View>
        
        {trend && trendValue && (
          <View style={[styles.trendContainer, { backgroundColor: getTrendColor(trend) + '15' }]}>
            <Text style={[styles.trendIcon, { color: getTrendColor(trend) }]}>
              {getTrendIcon(trend)}
            </Text>
            <Text style={[styles.trendValue, { color: getTrendColor(trend) }]}>
              {trendValue}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.metricContent}>
        <Text style={[
          styles.metricValue,
          { fontSize: sizes[size].valueSize, color }
        ]}>
          {value}
        </Text>
        {subtitle && (
          <Text variant="bodySmall" style={styles.metricSubtitle}>
            {subtitle}
          </Text>
        )}
      </View>
    </ModernCard>
  );
};

// Simple Donut Chart
interface DonutChartProps {
  data: DataPoint[];
  size?: number;
  strokeWidth?: number;
  centerContent?: React.ReactNode;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  size = 120,
  strokeWidth = 12,
  centerContent,
}) => {
  const { isPhone } = getDeviceInfo();
  const adjustedSize = isPhone ? Math.min(size, 100) : size;
  const radius = (adjustedSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  let currentOffset = 0;

  return (
    <View style={[styles.chartContainer, { width: adjustedSize, height: adjustedSize }]}>
      <svg width={adjustedSize} height={adjustedSize} style={styles.svgChart}>
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100;
          const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
          const strokeDashoffset = -currentOffset;
          currentOffset += (percentage / 100) * circumference;

          return (
            <circle
              key={index}
              cx={adjustedSize / 2}
              cy={adjustedSize / 2}
              r={radius}
              fill="transparent"
              stroke={item.color || MODERN_COLORS.primary[500]}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${adjustedSize / 2} ${adjustedSize / 2})`}
            />
          );
        })}
      </svg>
      
      {centerContent && (
        <View style={[styles.chartCenter, { 
          width: adjustedSize - strokeWidth * 2, 
          height: adjustedSize - strokeWidth * 2 
        }]}>
          {centerContent}
        </View>
      )}
    </View>
  );
};

// Progress Ring
interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showLabel?: boolean;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 60,
  strokeWidth = 6,
  color = MODERN_COLORS.primary[500],
  backgroundColor = MODERN_COLORS.gray[200],
  showLabel = true,
}) => {
  const { isPhone } = getDeviceInfo();
  const adjustedSize = isPhone ? Math.min(size, 50) : size;
  const radius = (adjustedSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${(progress / 100) * circumference} ${circumference}`;

  return (
    <View style={[styles.progressContainer, { width: adjustedSize, height: adjustedSize }]}>
      <svg width={adjustedSize} height={adjustedSize}>
        {/* Background circle */}
        <circle
          cx={adjustedSize / 2}
          cy={adjustedSize / 2}
          r={radius}
          fill="transparent"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={adjustedSize / 2}
          cy={adjustedSize / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(-90 ${adjustedSize / 2} ${adjustedSize / 2})`}
        />
      </svg>
      
      {showLabel && (
        <View style={styles.progressLabel}>
          <Text style={[styles.progressText, { fontSize: adjustedSize * 0.2 }]}>
            {Math.round(progress)}%
          </Text>
        </View>
      )}
    </View>
  );
};

// Bar Chart
interface BarChartProps {
  data: DataPoint[];
  height?: number;
  showValues?: boolean;
  horizontal?: boolean;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 200,
  showValues = true,
  horizontal = false,
}) => {
  const { isPhone } = getDeviceInfo();
  const { width: screenWidth } = Dimensions.get('window');
  const chartWidth = isPhone ? screenWidth - SPACING[8] : 400;
  
  const maxValue = Math.max(...data.map(item => item.value));
  const barThickness = horizontal ? 24 : Math.max(20, (chartWidth - SPACING[4]) / data.length - SPACING[2]);

  return (
    <ModernCard padding={4} style={styles.chartCard}>
      <View style={[
        styles.barChart,
        { 
          height: horizontal ? data.length * (barThickness + SPACING[2]) : height,
          width: chartWidth,
          flexDirection: horizontal ? 'column' : 'row',
        }
      ]}>
        {data.map((item, index) => {
          const barSize = (item.value / maxValue) * (horizontal ? chartWidth - 100 : height - 40);
          
          return (
            <View
              key={index}
              style={[
                styles.barContainer,
                horizontal ? styles.horizontalBar : styles.verticalBar,
                { 
                  [horizontal ? 'height' : 'width']: barThickness,
                  marginBottom: horizontal ? SPACING[2] : 0,
                  marginRight: horizontal ? 0 : SPACING[2],
                }
              ]}
            >
              <View
                style={[
                  styles.bar,
                  {
                    backgroundColor: item.color || MODERN_COLORS.primary[500],
                    [horizontal ? 'width' : 'height']: barSize,
                    [horizontal ? 'height' : 'width']: barThickness,
                  }
                ]}
              />
              
              <Text style={[
                styles.barLabel,
                horizontal && styles.horizontalBarLabel
              ]}>
                {item.label}
              </Text>
              
              {showValues && (
                <Text style={[
                  styles.barValue,
                  horizontal && styles.horizontalBarValue
                ]}>
                  {item.value}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </ModernCard>
  );
};

// Dashboard Grid Component
interface DashboardGridProps {
  children: React.ReactNode;
  columns?: number;
  gap?: number;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  children,
  columns,
  gap = SPACING[4],
}) => {
  const { isPhone, isTablet } = getDeviceInfo();
  
  const responsiveColumns = columns || (isPhone ? 1 : isTablet ? 2 : 3);

  return (
    <View style={[
      styles.dashboardGrid,
      {
        gap,
        gridTemplateColumns: `repeat(${responsiveColumns}, 1fr)`,
      }
    ]}>
      {children}
    </View>
  );
};

// Status Distribution Chart
interface StatusDistributionProps {
  statuses: Array<{
    label: string;
    count: number;
    status: 'active' | 'warning' | 'error' | 'neutral';
  }>;
}

export const StatusDistribution: React.FC<StatusDistributionProps> = ({ statuses }) => {
  const total = statuses.reduce((sum, status) => sum + status.count, 0);
  
  const chartData = statuses.map(status => ({
    label: status.label,
    value: status.count,
    color: status.status === 'active' ? MODERN_COLORS.success[500] :
           status.status === 'warning' ? MODERN_COLORS.warning[500] :
           status.status === 'error' ? MODERN_COLORS.error[500] :
           MODERN_COLORS.gray[500],
  }));

  return (
    <ModernCard padding={6}>
      <Text variant="titleMedium" style={styles.chartTitle}>
        Status Distribution
      </Text>
      
      <View style={styles.statusDistribution}>
        <DonutChart
          data={chartData}
          size={140}
          centerContent={
            <View style={styles.donutCenter}>
              <Text style={styles.donutTotal}>{total}</Text>
              <Text style={styles.donutLabel}>Total</Text>
            </View>
          }
        />
        
        <View style={styles.statusLegend}>
          {statuses.map((status, index) => (
            <View key={index} style={styles.legendItem}>
              <StatusBadge
                status={status.status}
                label={status.label}
                size="sm"
                dot
              />
              <Text style={styles.legendValue}>{status.count}</Text>
            </View>
          ))}
        </View>
      </View>
    </ModernCard>
  );
};

const styles = StyleSheet.create({
  metricCard: {
    minWidth: 200,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING[3],
  },
  metricTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING[2],
  },
  metricIconText: {
    fontSize: 16,
    fontWeight: '600',
  },
  metricTitle: {
    color: MODERN_COLORS.gray[600],
    fontWeight: '500',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[1],
    borderRadius: 12,
  },
  trendIcon: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: SPACING[1],
  },
  trendValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  metricValue: {
    fontWeight: '700',
    marginBottom: SPACING[1],
  },
  metricSubtitle: {
    color: MODERN_COLORS.gray[500],
  },
  chartContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgChart: {
    position: 'absolute',
  },
  chartCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  progressContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontWeight: '600',
    color: MODERN_COLORS.gray[700],
  },
  chartCard: {
    alignItems: 'center',
  },
  barChart: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  verticalBar: {
    justifyContent: 'flex-end',
  },
  horizontalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  bar: {
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    marginTop: SPACING[1],
    textAlign: 'center',
    color: MODERN_COLORS.gray[600],
  },
  horizontalBarLabel: {
    marginTop: 0,
    marginLeft: SPACING[2],
    textAlign: 'left',
  },
  barValue: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: SPACING[0.5],
    color: MODERN_COLORS.gray[700],
  },
  horizontalBarValue: {
    marginTop: 0,
    marginLeft: SPACING[1],
  },
  dashboardGrid: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  chartTitle: {
    marginBottom: SPACING[4],
    fontWeight: '600',
  },
  statusDistribution: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  donutCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutTotal: {
    fontSize: 24,
    fontWeight: '700',
    color: MODERN_COLORS.gray[900],
  },
  donutLabel: {
    fontSize: 12,
    color: MODERN_COLORS.gray[500],
    marginTop: 2,
  },
  statusLegend: {
    flex: 1,
    marginLeft: SPACING[4],
  },
  legendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[2],
  },
  legendValue: {
    fontWeight: '600',
    color: MODERN_COLORS.gray[700],
  },
});

export default {
  MetricCard,
  DonutChart,
  ProgressRing,
  BarChart,
  DashboardGrid,
  StatusDistribution,
}; 