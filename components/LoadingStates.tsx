import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Surface, useTheme } from 'react-native-paper';
import { getDeviceInfo, getResponsiveSpacing } from '../utils/mobileUtils';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

// Enhanced Skeleton Component with shimmer effect
const Skeleton: React.FC<SkeletonProps> = ({ 
  width = '100%', 
  height = 20, 
  borderRadius = 4, 
  style 
}) => {
  const theme = useTheme();
  const shimmerAnimation = new Animated.Value(0);

  React.useEffect(() => {
    const shimmer = () => {
      shimmerAnimation.setValue(0);
      Animated.timing(shimmerAnimation, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }).start(() => shimmer());
    };
    shimmer();
  }, []);

  const translateX = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.surfaceVariant,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [{ translateX }],
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            width: 200,
          },
        ]}
      />
    </View>
  );
};

// Employee Table Skeleton
export const EmployeeTableSkeleton: React.FC = () => {
  const { isPhone } = getDeviceInfo();
  const spacing = getResponsiveSpacing('md');

  return (
    <Surface style={[styles.container, { padding: spacing }]}>
      {/* Header Skeleton */}
      <View style={styles.headerSkeleton}>
        <Skeleton width="40%" height={24} />
        <Skeleton width={120} height={36} borderRadius={18} />
      </View>

      {/* Search Bar Skeleton */}
      <Skeleton 
        width="100%" 
        height={isPhone ? 44 : 48} 
        borderRadius={8} 
        style={{ marginVertical: spacing }} 
      />

      {/* Table Skeleton */}
      <View style={styles.tableSkeleton}>
        {/* Table Header */}
        <View style={styles.tableHeaderSkeleton}>
          {Array.from({ length: isPhone ? 3 : 6 }, (_, i) => (
            <Skeleton key={i} width={isPhone ? 80 : 120} height={16} />
          ))}
        </View>

        {/* Table Rows */}
        {Array.from({ length: 10 }, (_, rowIndex) => (
          <View key={rowIndex} style={styles.tableRowSkeleton}>
            <Skeleton width={40} height={40} borderRadius={20} />
            <View style={styles.employeeInfoSkeleton}>
              <Skeleton width="70%" height={16} />
              <Skeleton width="50%" height={12} style={{ marginTop: 4 }} />
            </View>
            {!isPhone && (
              <>
                <Skeleton width={80} height={16} />
                <Skeleton width={90} height={16} />
                <Skeleton width={100} height={16} />
              </>
            )}
            <Skeleton width={60} height={20} borderRadius={10} />
          </View>
        ))}
      </View>
    </Surface>
  );
};

// Dashboard Skeleton
export const DashboardSkeleton: React.FC = () => {
  const { isPhone } = getDeviceInfo();
  const spacing = getResponsiveSpacing('md');

  return (
    <View style={[styles.container, { padding: spacing }]}>
      {/* Header */}
      <View style={styles.headerSkeleton}>
        <Skeleton width="60%" height={28} />
        <Skeleton width="30%" height={16} style={{ marginTop: 8 }} />
      </View>

      {/* Stats Cards */}
      <View style={[styles.statsGrid, { marginTop: spacing * 2 }]}>
        {Array.from({ length: isPhone ? 2 : 4 }, (_, i) => (
          <Surface key={i} style={styles.statCard}>
            <View style={styles.statCardContent}>
              <View style={{ flex: 1 }}>
                <Skeleton width="60%" height={16} />
                <Skeleton width={40} height={32} style={{ marginTop: 8 }} />
              </View>
              <Skeleton width={48} height={48} borderRadius={24} />
            </View>
          </Surface>
        ))}
      </View>

      {/* Charts Section */}
      <View style={[styles.chartsSection, { marginTop: spacing * 2 }]}>
        <Surface style={styles.chartCard}>
          <Skeleton width="40%" height={20} style={{ marginBottom: spacing }} />
          <Skeleton width="100%" height={200} borderRadius={8} />
        </Surface>
      </View>

      {/* Recent Activity */}
      <View style={[styles.activitySection, { marginTop: spacing * 2 }]}>
        <Skeleton width="50%" height={20} style={{ marginBottom: spacing }} />
        {Array.from({ length: 5 }, (_, i) => (
          <View key={i} style={styles.activityItem}>
            <Skeleton width={32} height={32} borderRadius={16} />
            <View style={styles.activityContent}>
              <Skeleton width="80%" height={16} />
              <Skeleton width="60%" height={12} style={{ marginTop: 4 }} />
            </View>
            <Skeleton width={60} height={12} />
          </View>
        ))}
      </View>
    </View>
  );
};

// Employee Details Skeleton
export const EmployeeDetailsSkeleton: React.FC = () => {
  const spacing = getResponsiveSpacing('md');

  return (
    <View style={[styles.container, { padding: spacing }]}>
      {/* Header Card */}
      <Surface style={styles.detailsHeader}>
        <View style={styles.detailsHeaderContent}>
          <Skeleton width={80} height={80} borderRadius={40} />
          <View style={styles.detailsHeaderInfo}>
            <Skeleton width="70%" height={24} />
            <Skeleton width="50%" height={16} style={{ marginTop: 8 }} />
            <View style={[styles.chipContainer, { marginTop: 12 }]}>
              <Skeleton width={60} height={24} borderRadius={12} />
              <Skeleton width={80} height={24} borderRadius={12} style={{ marginLeft: 8 }} />
            </View>
          </View>
        </View>
      </Surface>

      {/* Info Sections */}
      {Array.from({ length: 3 }, (_, sectionIndex) => (
        <Surface key={sectionIndex} style={[styles.infoSection, { marginTop: spacing }]}>
          <Skeleton width="40%" height={18} style={{ marginBottom: spacing }} />
          {Array.from({ length: 4 }, (_, i) => (
            <View key={i} style={styles.infoRow}>
              <Skeleton width="30%" height={14} />
              <Skeleton width="60%" height={14} />
            </View>
          ))}
        </Surface>
      ))}
    </View>
  );
};

// Form Skeleton
export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 6 }) => {
  const spacing = getResponsiveSpacing('md');

  return (
    <View style={[styles.container, { padding: spacing }]}>
      <Skeleton width="50%" height={24} style={{ marginBottom: spacing * 2 }} />
      
      {Array.from({ length: fields }, (_, i) => (
        <View key={i} style={styles.formField}>
          <Skeleton width="30%" height={14} style={{ marginBottom: 8 }} />
          <Skeleton width="100%" height={48} borderRadius={8} />
        </View>
      ))}

      <View style={[styles.formActions, { marginTop: spacing * 2 }]}>
        <Skeleton width={100} height={40} borderRadius={20} />
        <Skeleton width={120} height={40} borderRadius={20} />
      </View>
    </View>
  );
};

// Generic List Skeleton
export const ListSkeleton: React.FC<{ items?: number; showAvatar?: boolean }> = ({ 
  items = 8, 
  showAvatar = true 
}) => {
  const spacing = getResponsiveSpacing('md');

  return (
    <View style={[styles.container, { padding: spacing }]}>
      {Array.from({ length: items }, (_, i) => (
        <View key={i} style={styles.listItem}>
          {showAvatar && <Skeleton width={48} height={48} borderRadius={24} />}
          <View style={styles.listItemContent}>
            <Skeleton width="80%" height={16} />
            <Skeleton width="60%" height={12} style={{ marginTop: 6 }} />
          </View>
          <Skeleton width={24} height={24} borderRadius={12} />
        </View>
      ))}
    </View>
  );
};

// Loading Overlay Component
export const LoadingOverlay: React.FC<{ 
  visible: boolean; 
  message?: string;
  children: React.ReactNode;
}> = ({ visible, message = 'Loading...', children }) => {
  const theme = useTheme();
  const fadeAnimation = new Animated.Value(visible ? 1 : 0);

  React.useEffect(() => {
    Animated.timing(fadeAnimation, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!visible) return <>{children}</>;

  return (
    <View style={styles.loadingOverlayContainer}>
      {children}
      <Animated.View 
        style={[
          styles.loadingOverlay,
          { 
            backgroundColor: theme.colors.surface + 'E6',
            opacity: fadeAnimation 
          }
        ]}
      >
        <Surface style={styles.loadingContent} elevation={4}>
          <Skeleton width={60} height={60} borderRadius={30} />
          <Skeleton 
            width={120} 
            height={16} 
            style={{ marginTop: 16 }} 
          />
        </Surface>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tableSkeleton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  tableHeaderSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableRowSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  employeeInfoSkeleton: {
    flex: 1,
    marginLeft: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    padding: 16,
    borderRadius: 12,
  },
  statCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartsSection: {
    flex: 1,
  },
  chartCard: {
    padding: 16,
    borderRadius: 12,
    flex: 1,
  },
  activitySection: {
    flex: 1,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailsHeader: {
    padding: 16,
    borderRadius: 12,
  },
  detailsHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsHeaderInfo: {
    flex: 1,
    marginLeft: 16,
  },
  chipContainer: {
    flexDirection: 'row',
  },
  infoSection: {
    padding: 16,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  formField: {
    marginBottom: 16,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  loadingOverlayContainer: {
    flex: 1,
    position: 'relative',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContent: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
});

export default {
  Skeleton,
  EmployeeTableSkeleton,
  DashboardSkeleton,
  EmployeeDetailsSkeleton,
  FormSkeleton,
  ListSkeleton,
  LoadingOverlay,
}; 