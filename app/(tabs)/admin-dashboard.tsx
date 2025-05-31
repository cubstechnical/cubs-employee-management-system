import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import {
  Users,
  UserPlus,
  FileText,
  Settings,
  BarChart3,
  Calendar,
  AlertCircle,
  Clock,
  TrendingUp,
  Shield,
  XCircle
} from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { useEmployees } from '../../hooks/useEmployees';
import { CustomTheme } from '../../theme';
import { Employee } from '../../services/supabase';
import { safeThemeAccess } from '../../utils/errorPrevention';

interface Department {
  id: string;
  name: string;
  headCount: number;
}

export default function AdminDashboardScreen() {
  const theme = useTheme() as CustomTheme;
  
  const width = Dimensions.get('window').width;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: safeThemeAccess.colors(theme, 'background'),
    },
    scrollView: {
      flex: 1,
    },
    header: {
      padding: 24,
      backgroundColor: safeThemeAccess.colors(theme, 'surface'),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 5,
    },
    headerTitle: {
      color: safeThemeAccess.colors(theme, 'onSurface'),
    },
    headerSubtitle: {
      color: safeThemeAccess.colors(theme, 'onSurfaceVariant'),
      marginTop: safeThemeAccess.spacing(theme, 'xs'),
    },
    content: {
      padding: 24,
    },
    section: {
      marginBottom: 24,
    },
    quickActionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: safeThemeAccess.spacing(theme, 'md'),
    },
    quickActionCard: {
      width: (width - 48 - safeThemeAccess.spacing(theme, 'md')) / 2,
      marginBottom: safeThemeAccess.spacing(theme, 'sm'),
      borderRadius: safeThemeAccess.borderRadius(theme, 'large'),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 5,
    },
    quickActionContent: {
      alignItems: 'center',
      padding: safeThemeAccess.spacing(theme, 'md'),
      gap: safeThemeAccess.spacing(theme, 'md'),
    },
    sectionTitle: {
      color: safeThemeAccess.colors(theme, 'onSurface'),
      marginBottom: safeThemeAccess.spacing(theme, 'md'),
    },
    recentEmployeesGrid: {
      gap: safeThemeAccess.spacing(theme, 'md'),
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: safeThemeAccess.colors(theme, 'background'),
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 24,
      gap: safeThemeAccess.spacing(theme, 'md'),
    },
    statsCard: {
      flex: 1,
    },
    statsContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statsNumber: {
      marginTop: safeThemeAccess.spacing(theme, 'xs'),
    },
    alertsContainer: {
      padding: 24,
      gap: safeThemeAccess.spacing(theme, 'md'),
    },
    alertCard: {
      marginBottom: safeThemeAccess.spacing(theme, 'sm'),
    },
    alertContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: safeThemeAccess.spacing(theme, 'md'),
    },
    alertText: {
      flex: 1,
    },
    quickActionsContainer: {
      padding: 24,
    },
    quickActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: safeThemeAccess.spacing(theme, 'md'),
    },
    quickActionButton: {
      flex: 1,
      minWidth: 150,
    },
    recentActivityContainer: {
      padding: 24,
    },
    badge: {
      alignSelf: 'center',
    },
    fab: {
      position: 'absolute',
      right: 24,
      bottom: 24,
    },
  });

  return (
    <View style={styles.container}>
      <Text>Admin Dashboard</Text>
    </View>
  );
} 
