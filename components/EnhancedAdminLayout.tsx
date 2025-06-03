// 🏗️ Enhanced Admin Layout for CUBS Enterprise HR Platform
// Modern navigation, global search, theme switching, and responsive design

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, ScrollView, Pressable } from 'react-native';
import {
  Text,
  Surface,
  IconButton,
  Button,
  Badge,
  Portal,
  Modal,
  List,
  Divider,
  Avatar,
  Menu,
  Chip,
  Switch,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { router, usePathname } from 'expo-router';
import { useEnhancedTheme, useResponsive } from './EnhancedThemeProvider';
import { GlobalSearch, useGlobalSearch } from './GlobalSearch';
import { ENHANCED_DESIGN_SYSTEM } from '../theme/enhancedDesignSystem';
import { useAuth } from '../hooks/useAuth';
import { useEmployees } from '../hooks/useEmployees';

// Navigation items
const NAVIGATION_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'view-dashboard',
    route: '/(admin)/dashboard',
    description: 'Overview & analytics',
    badge: null,
  },
  {
    id: 'employees',
    label: 'Employees',
    icon: 'account-group',
    route: '/(admin)/employees',
    description: 'Manage workforce',
    badge: 'dynamic', // Will show count
  },
  {
    id: 'companies',
    label: 'Companies',
    icon: 'domain',
    route: '/(admin)/companies',
    description: 'Partner organizations',
    badge: null,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: 'bell',
    route: '/(admin)/notifications',
    description: 'Alerts & reminders',
    badge: 'urgent', // Will show urgent count
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: 'file-document-multiple',
    route: '/(admin)/documents',
    description: 'File management',
    badge: null,
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: 'chart-box',
    route: '/(admin)/reports',
    description: 'Analytics & insights',
    badge: null,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'cog',
    route: '/(admin)/settings',
    description: 'System configuration',
    badge: null,
  },
];

// Quick actions for the action center
const QUICK_ACTIONS = [
  {
    id: 'add-employee',
    label: 'Add Employee',
    icon: 'account-plus',
    color: '#2563EB',
    action: () => router.push('/(admin)/employees/add'),
  },
  {
    id: 'send-reminders',
    label: 'Send Reminders',
    icon: 'email-send',
    color: '#DC2626',
    action: () => router.push('/(admin)/notifications'),
  },
  {
    id: 'export-data',
    label: 'Export Data',
    icon: 'file-export',
    color: '#059669',
    action: () => {/* Export functionality */},
  },
];

interface EnhancedAdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  currentRoute?: string;
  showSearch?: boolean;
  actions?: React.ReactNode;
}

export const EnhancedAdminLayout: React.FC<EnhancedAdminLayoutProps> = ({
  children,
  title,
  currentRoute,
  showSearch = true,
  actions,
}) => {
  const { theme, colors, toggleTheme, isSystemTheme, setSystemTheme } = useEnhancedTheme();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const { user, logout } = useAuth();
  const { employees } = useEmployees();
  const { searchVisible, openSearch, closeSearch } = useGlobalSearch();
  
  const [sidebarVisible, setSidebarVisible] = useState(!isMobile);
  const [userMenuVisible, setUserMenuVisible] = useState(false);
  const [actionCenterVisible, setActionCenterVisible] = useState(false);
  const [themeMenuVisible, setThemeMenuVisible] = useState(false);
  
  const pathname = usePathname();

  // Calculate dynamic badges
  const getBadgeCount = (badgeType: string) => {
    switch (badgeType) {
      case 'dynamic':
        return employees?.length || 0;
      case 'urgent':
        if (!employees) return 0;
        const today = new Date();
        const urgentCount = employees.filter(emp => {
          if (!emp.visa_expiry_date) return false;
          const expiryDate = new Date(emp.visa_expiry_date);
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
        }).length;
        return urgentCount;
      default:
        return 0;
    }
  };

  // Handle navigation
  const handleNavigation = (route: string) => {
    router.push(route as any);
    if (isMobile) {
      setSidebarVisible(false);
    }
  };

  // User menu component
  const UserMenu = () => (
    <Menu
      visible={userMenuVisible}
      onDismiss={() => setUserMenuVisible(false)}
      anchor={
        <Pressable
          onPress={() => setUserMenuVisible(true)}
          style={[styles.userButton, { backgroundColor: colors.primaryContainer }]}
        >
          <Avatar.Text
            size={32}
            label={(user?.name || 'U').charAt(0).toUpperCase()}
            style={{ backgroundColor: colors.primary[500] }}
            labelStyle={{ color: colors.primary[50] }}
          />
          <View style={styles.userInfo}>
            <Text variant="bodyMedium" style={{ color: colors.onSurface, fontWeight: '600' }}>
              {user?.name || 'User'}
            </Text>
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
              {user?.role || 'Admin'}
            </Text>
          </View>
          <IconButton
            icon="chevron-down"
            size={16}
            iconColor={colors.onSurfaceVariant}
          />
        </Pressable>
      }
    >
      <Menu.Item
        leadingIcon="account"
        title="Profile"
        onPress={() => {
          setUserMenuVisible(false);
          router.push('/(admin)/profile');
        }}
      />
      <Menu.Item
        leadingIcon="cog"
        title="Settings"
        onPress={() => {
          setUserMenuVisible(false);
          router.push('/(admin)/settings');
        }}
      />
      <Divider />
      <Menu.Item
        leadingIcon="logout"
        title="Sign Out"
        onPress={() => {
          setUserMenuVisible(false);
          logout();
        }}
      />
    </Menu>
  );

  // Theme menu component
  const ThemeMenu = () => (
    <Menu
      visible={themeMenuVisible}
      onDismiss={() => setThemeMenuVisible(false)}
      anchor={
        <IconButton
          icon={theme === 'dark' ? 'weather-night' : 'weather-sunny'}
          size={24}
          iconColor={colors.onSurfaceVariant}
          onPress={() => setThemeMenuVisible(true)}
          style={styles.themeButton}
        />
      }
    >
      <Menu.Item
        leadingIcon="weather-sunny"
        title="Light Theme"
        onPress={() => {
          setThemeMenuVisible(false);
          // setTheme('light');
        }}
      />
      <Menu.Item
        leadingIcon="weather-night"
        title="Dark Theme"
        onPress={() => {
          setThemeMenuVisible(false);
          // setTheme('dark');
        }}
      />
      <Divider />
      <View style={styles.systemThemeOption}>
        <Text variant="bodyMedium" style={{ color: colors.onSurface, flex: 1 }}>
          Use System Theme
        </Text>
        <Switch
          value={isSystemTheme}
          onValueChange={setSystemTheme}
          color={colors.primary[500]}
        />
      </View>
    </Menu>
  );

  // Action center modal
  const ActionCenter = () => (
    <Portal>
      <Modal
        visible={actionCenterVisible}
        onDismiss={() => setActionCenterVisible(false)}
        contentContainerStyle={[
          styles.actionCenterModal,
          { backgroundColor: colors.surface }
        ]}
      >
        <Surface style={styles.actionCenterContent} elevation={4}>
          <View style={styles.actionCenterHeader}>
            <Text variant="headlineSmall" style={{ color: colors.onSurface, fontWeight: 'bold' }}>
              Quick Actions
            </Text>
            <IconButton
              icon="close"
              onPress={() => setActionCenterVisible(false)}
            />
          </View>
          
          <View style={styles.quickActionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.id}
                onPress={() => {
                  action.action();
                  setActionCenterVisible(false);
                }}
                style={[
                  styles.quickActionButton,
                  { backgroundColor: `${action.color}10` }
                ]}
              >
                <IconButton
                  icon={action.icon}
                  size={32}
                  iconColor={action.color}
                  style={{ margin: 0 }}
                />
                <Text
                  variant="bodyMedium"
                  style={{ color: colors.onSurface, fontWeight: '600', textAlign: 'center' }}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Surface>
      </Modal>
    </Portal>
  );

  // Main navigation sidebar
  const Sidebar = () => (
    <Surface
      style={[
        styles.sidebar,
        {
          backgroundColor: colors.surface,
          width: isMobile ? '85%' : isTablet ? 280 : 320,
        }
      ]}
      elevation={isMobile ? 5 : 1}
    >
      {/* Sidebar Header */}
      <LinearGradient
        colors={[colors.primary[500], colors.primary[600]]}
        style={styles.sidebarHeader}
      >
        <View style={styles.logoSection}>
          <Avatar.Text
            size={40}
            label="C"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            labelStyle={{ color: 'white', fontWeight: 'bold' }}
          />
          <View style={styles.logoText}>
            <Text variant="titleLarge" style={{ color: 'white', fontWeight: 'bold' }}>
              CUBS
            </Text>
            <Text variant="bodySmall" style={{ color: 'rgba(255,255,255,0.8)' }}>
              Enterprise HR
            </Text>
          </View>
        </View>
        
        {isMobile && (
          <IconButton
            icon="close"
            iconColor="white"
            onPress={() => setSidebarVisible(false)}
          />
        )}
      </LinearGradient>

      {/* Navigation Items */}
      <ScrollView style={styles.navigationList} showsVerticalScrollIndicator={false}>
        {NAVIGATION_ITEMS.map((item) => {
          const isActive = pathname === item.route || currentRoute === item.route;
          const badgeCount = item.badge ? getBadgeCount(item.badge) : 0;
          
          return (
            <Pressable
              key={item.id}
              onPress={() => handleNavigation(item.route)}
              style={[
                styles.navigationItem,
                {
                  backgroundColor: isActive ? `${colors.primary[500]}15` : 'transparent',
                  borderRightWidth: isActive ? 3 : 0,
                  borderRightColor: colors.primary[500],
                }
              ]}
            >
              <View style={styles.navigationIcon}>
                <IconButton
                  icon={item.icon}
                  size={24}
                  iconColor={isActive ? colors.primary[500] : colors.onSurfaceVariant}
                  style={{ margin: 0 }}
                />
                {badgeCount > 0 && (
                  <Badge
                    size={18}
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      backgroundColor: item.badge === 'urgent' ? colors.error[500] : colors.warning[500],
                    }}
                  >
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </Badge>
                )}
              </View>
              
              <View style={styles.navigationContent}>
                <Text
                  variant="bodyMedium"
                  style={{
                    color: isActive ? colors.primary[500] : colors.onSurface,
                    fontWeight: isActive ? '600' : 'normal',
                  }}
                >
                  {item.label}
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: colors.onSurfaceVariant }}
                >
                  {item.description}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Sidebar Footer */}
      <View style={styles.sidebarFooter}>
        <ThemeMenu />
        <UserMenu />
      </View>
    </Surface>
  );

  // Top app bar
  const TopBar = () => (
    <Surface
      style={[styles.topBar, { backgroundColor: colors.surface }]}
      elevation={1}
    >
      <View style={styles.topBarLeft}>
        {isMobile && (
          <IconButton
            icon="menu"
            size={24}
            iconColor={colors.onSurface}
            onPress={() => setSidebarVisible(true)}
          />
        )}
        
        {title && (
          <View style={styles.titleSection}>
            <Text variant="headlineSmall" style={{ color: colors.onSurface, fontWeight: 'bold' }}>
              {title}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.topBarRight}>
        {showSearch && (
          <IconButton
            icon="magnify"
            size={24}
            iconColor={colors.onSurfaceVariant}
            onPress={openSearch}
            style={styles.searchButton}
          />
        )}
        
        <IconButton
          icon="lightning-bolt"
          size={24}
          iconColor={colors.onSurfaceVariant}
          onPress={() => setActionCenterVisible(true)}
          style={styles.actionButton}
        />
        
        {!isMobile && <UserMenu />}
        {!isMobile && <ThemeMenu />}
      </View>
    </Surface>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar />}
      
      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarVisible && (
        <>
          <Pressable
            style={styles.sidebarOverlay}
            onPress={() => setSidebarVisible(false)}
          />
          <Sidebar />
        </>
      )}

      {/* Main Content Area */}
      <View style={[styles.mainContent, { marginLeft: !isMobile ? (isTablet ? 280 : 320) : 0 }]}>
        <TopBar />
        
        {/* Page Content */}
        <View style={styles.pageContent}>
          {children}
        </View>
      </View>

      {/* Modals and Overlays */}
      <GlobalSearch
        visible={searchVisible}
        onDismiss={closeSearch}
        placeholder="Search employees, companies, actions..."
      />
      
      <ActionCenter />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sidebar: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 1000,
  },
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
  sidebarHeader: {
    padding: ENHANCED_DESIGN_SYSTEM.spacing[6],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    marginLeft: ENHANCED_DESIGN_SYSTEM.spacing[3],
  },
  navigationList: {
    flex: 1,
    paddingVertical: ENHANCED_DESIGN_SYSTEM.spacing[4],
  },
  navigationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: ENHANCED_DESIGN_SYSTEM.spacing[3],
    paddingHorizontal: ENHANCED_DESIGN_SYSTEM.spacing[4],
    marginHorizontal: ENHANCED_DESIGN_SYSTEM.spacing[2],
    borderRadius: ENHANCED_DESIGN_SYSTEM.borderRadius.lg,
  },
  navigationIcon: {
    position: 'relative',
    marginRight: ENHANCED_DESIGN_SYSTEM.spacing[3],
  },
  navigationContent: {
    flex: 1,
  },
  sidebarFooter: {
    padding: ENHANCED_DESIGN_SYSTEM.spacing[4],
    borderTopWidth: 1,
    borderTopColor: ENHANCED_DESIGN_SYSTEM.themes.light.outline,
  },
  mainContent: {
    flex: 1,
  },
  topBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ENHANCED_DESIGN_SYSTEM.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: ENHANCED_DESIGN_SYSTEM.themes.light.outlineVariant,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleSection: {
    marginLeft: ENHANCED_DESIGN_SYSTEM.spacing[3],
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ENHANCED_DESIGN_SYSTEM.spacing[1],
  },
  searchButton: {
    backgroundColor: ENHANCED_DESIGN_SYSTEM.themes.light.surfaceVariant,
    borderRadius: ENHANCED_DESIGN_SYSTEM.borderRadius.lg,
  },
  actionButton: {
    backgroundColor: ENHANCED_DESIGN_SYSTEM.themes.light.surfaceVariant,
    borderRadius: ENHANCED_DESIGN_SYSTEM.borderRadius.lg,
  },
  themeButton: {
    backgroundColor: ENHANCED_DESIGN_SYSTEM.themes.light.surfaceVariant,
    borderRadius: ENHANCED_DESIGN_SYSTEM.borderRadius.lg,
  },
  userButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ENHANCED_DESIGN_SYSTEM.spacing[2],
    borderRadius: ENHANCED_DESIGN_SYSTEM.borderRadius.lg,
  },
  userInfo: {
    marginLeft: ENHANCED_DESIGN_SYSTEM.spacing[2],
    marginRight: ENHANCED_DESIGN_SYSTEM.spacing[1],
  },
  systemThemeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ENHANCED_DESIGN_SYSTEM.spacing[4],
    paddingVertical: ENHANCED_DESIGN_SYSTEM.spacing[2],
  },
  pageContent: {
    flex: 1,
  },
  actionCenterModal: {
    margin: ENHANCED_DESIGN_SYSTEM.spacing[6],
    borderRadius: ENHANCED_DESIGN_SYSTEM.borderRadius.xl,
  },
  actionCenterContent: {
    borderRadius: ENHANCED_DESIGN_SYSTEM.borderRadius.xl,
    padding: ENHANCED_DESIGN_SYSTEM.spacing[6],
  },
  actionCenterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ENHANCED_DESIGN_SYSTEM.spacing[6],
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ENHANCED_DESIGN_SYSTEM.spacing[4],
  },
  quickActionButton: {
    alignItems: 'center',
    padding: ENHANCED_DESIGN_SYSTEM.spacing[6],
    borderRadius: ENHANCED_DESIGN_SYSTEM.borderRadius.xl,
    minWidth: 120,
    flex: 1,
    maxWidth: '48%',
  },
});

export default EnhancedAdminLayout; 