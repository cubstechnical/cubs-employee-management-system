import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ScrollView, BackHandler, Animated, Platform } from 'react-native';
import {
  Appbar,
  Drawer,
  Text,
  IconButton,
  useTheme,
  Surface,
  Switch,
  Portal,
  Modal,
  Button,
  Divider,
  Avatar,
  Badge,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme } from './ThemeProvider';
import { CustomTheme } from '../theme';
import { safeThemeAccess } from '../utils/errorPrevention';
import SecuritySettings from './SecuritySettings';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = 320;

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  currentRoute: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export default function AdminLayout({ 
  children, 
  title, 
  currentRoute, 
  showBackButton = false,
  onBackPress 
}: AdminLayoutProps) {
  const [sidebarVisible, setSidebarVisible] = useState(width > 768);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [securitySettingsVisible, setSecuritySettingsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(width <= 768);
  const sidebarAnimation = new Animated.Value(width > 768 ? 0 : -SIDEBAR_WIDTH);
  const overlayAnimation = new Animated.Value(0);
  
  const theme = useTheme() as CustomTheme;
  const { isDarkMode, toggleTheme } = useAppTheme();
  const { user, logout } = useAuth();

  // Update mobile state on window resize
  useEffect(() => {
    const updateLayout = () => {
      const newWidth = Dimensions.get('window').width;
      const newIsMobile = newWidth <= 768;
      setIsMobile(newIsMobile);
      
      if (newIsMobile !== isMobile) {
        setSidebarVisible(!newIsMobile);
      }
    };

    const subscription = Dimensions.addEventListener('change', updateLayout);
    return () => subscription?.remove();
  }, [isMobile]);

  // Animate sidebar visibility
  useEffect(() => {
    const targetValue = sidebarVisible ? 0 : -SIDEBAR_WIDTH;
    
    Animated.parallel([
      Animated.spring(sidebarAnimation, {
        toValue: targetValue,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(overlayAnimation, {
        toValue: sidebarVisible && isMobile ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  }, [sidebarVisible, isMobile]);

  // Handle hardware back button on Android
  useEffect(() => {
    const backAction = () => {
      if (sidebarVisible && isMobile) {
        setSidebarVisible(false);
        return true;
      }
      if (onBackPress) {
        onBackPress();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [sidebarVisible, isMobile, onBackPress]);

  const navigationItems = [
    {
      label: 'Dashboard',
      icon: 'view-dashboard',
      route: '/(admin)/dashboard',
      active: currentRoute.includes('dashboard'),
      badge: null,
    },
    {
      label: 'Employees',
      icon: 'account-group',
      route: '/(admin)/employees',
      active: currentRoute.includes('employees'),
      badge: null,
    },
    {
      label: 'Documents',
      icon: 'file-document-multiple',
      route: '/(admin)/documents',
      active: currentRoute.includes('documents'),
      badge: null,
    },
    {
      label: 'Notifications',
      icon: 'bell',
      route: '/(admin)/notifications',
      active: currentRoute.includes('notifications'),
      badge: '3', // Dynamic badge
    },
    {
      label: 'User Approvals',
      icon: 'account-check',
      route: '/(admin)/approvals',
      active: currentRoute.includes('approvals'),
      badge: '2', // Dynamic badge
    },
    {
      label: 'Import Data',
      icon: 'database-import',
      route: '/(admin)/import',
      active: currentRoute.includes('import'),
      badge: null,
    },
  ];

  const handleNavigation = (route: string) => {
    router.push(route as any);
    if (isMobile) {
      setSidebarVisible(false);
    }
  };

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: safeThemeAccess.colors(theme, 'background') }]}>
      <View style={styles.layout}>
        {/* Enhanced Mobile Sidebar */}
        {(sidebarVisible || !isMobile) && (
          <>
            {/* Mobile Overlay */}
            {isMobile && (
              <Animated.View 
                style={[
                  styles.overlay,
                  {
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    opacity: overlayAnimation,
                  }
                ]} 
                onTouchStart={() => setSidebarVisible(false)} 
              />
            )}
            <Animated.View 
              style={[
                styles.sidebar, 
                isMobile && styles.sidebarMobile,
                { 
                  borderRightWidth: isMobile ? 0 : 1,
                  borderRightColor: safeThemeAccess.colors(theme, 'outline'),
                  transform: [
                    { translateX: sidebarAnimation },
                  ],
                }
              ]} 
            >
              <Surface 
                style={[
                  styles.sidebarSurface, 
                  { backgroundColor: safeThemeAccess.colors(theme, 'surface') }
                ]} 
                elevation={isMobile ? 5 : 0}
              >
                {/* Enhanced Sidebar Header */}
                <Surface style={[styles.sidebarHeader, { backgroundColor: safeThemeAccess.colors(theme, 'primary') }]} elevation={4}>
                  <View style={styles.headerContainer}>
                    {isMobile && (
                      <IconButton
                        icon="close"
                        size={24}
                        onPress={() => setSidebarVisible(false)}
                        iconColor={safeThemeAccess.colors(theme, 'onPrimary')}
                        style={styles.closeButton}
                      />
                    )}
                    
                    <View style={styles.brandingContainer}>
                      <View style={[styles.logoContainer, { backgroundColor: safeThemeAccess.colors(theme, 'onPrimary') }]}>
                        <View style={styles.logoWrapper}>
                          <Text style={[styles.logoText, { color: safeThemeAccess.colors(theme, 'primary') }]}>CUBS</Text>
                          <View style={[styles.logoAccent, { backgroundColor: safeThemeAccess.colors(theme, 'primary') }]} />
                        </View>
                      </View>
                      <Text variant="titleLarge" style={[styles.brandTitle, { color: safeThemeAccess.colors(theme, 'onPrimary') }]}>
                        CUBS Technical
                      </Text>
                      <Text variant="bodyMedium" style={[styles.brandSubtitle, { color: safeThemeAccess.colors(theme, 'onPrimary') }]}>
                        Employee Management System
                      </Text>
                      
                      {/* User Info */}
                      <View style={styles.userInfo}>
                        <Avatar.Text 
                          size={32} 
                          label={user?.name?.charAt(0) || 'A'} 
                          style={[styles.userAvatar, { backgroundColor: safeThemeAccess.colors(theme, 'onPrimary') }]}
                          labelStyle={{ color: safeThemeAccess.colors(theme, 'primary'), fontSize: 14 }}
                        />
                        <View style={styles.userDetails}>
                          <Text variant="bodyMedium" style={[styles.userName, { color: safeThemeAccess.colors(theme, 'onPrimary') }]}>
                            {user?.name || 'Administrator'}
                          </Text>
                          <Text variant="bodySmall" style={[styles.userRole, { color: safeThemeAccess.colors(theme, 'onPrimary') }]}>
                            {user?.role === 'admin' ? '👑 Admin' : '👤 User'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </Surface>

                {/* Enhanced Navigation */}
                <ScrollView style={styles.sidebarContent} showsVerticalScrollIndicator={false}>
                  <View style={styles.navigationSection}>
                    <Text variant="labelLarge" style={[styles.sectionLabel, { color: safeThemeAccess.colors(theme, 'onSurfaceVariant') }]}>
                      MAIN NAVIGATION
                    </Text>
                    {navigationItems.map((item, index) => (
                      <View key={index} style={styles.drawerItemContainer}>
                        <Drawer.Item
                          label={item.label}
                          icon={item.icon}
                          active={item.active}
                          onPress={() => handleNavigation(item.route)}
                          style={[
                            styles.drawerItem,
                            item.active && { 
                              backgroundColor: safeThemeAccess.colors(theme, 'primaryContainer'),
                              marginHorizontal: 12,
                              borderRadius: 12,
                            }
                          ]}
                        />
                        {item.badge && (
                          <Badge 
                            style={[styles.badge, { backgroundColor: safeThemeAccess.colors(theme, 'error') }]}
                            size={20}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </View>
                    ))}
                  </View>

                  <Divider style={[styles.divider, { backgroundColor: safeThemeAccess.colors(theme, 'outline') }]} />
                  
                  {/* Quick Actions */}
                  <View style={styles.quickActionsSection}>
                    <Text variant="labelLarge" style={[styles.sectionLabel, { color: safeThemeAccess.colors(theme, 'onSurfaceVariant') }]}>
                      QUICK ACTIONS
                    </Text>
                    
                    <Button
                      mode="contained"
                      onPress={() => handleNavigation('/(admin)/employees')}
                      style={[styles.quickActionButton, { backgroundColor: safeThemeAccess.colors(theme, 'primary') }]}
                      contentStyle={styles.quickActionContent}
                      icon="plus"
                      labelStyle={{ color: safeThemeAccess.colors(theme, 'onPrimary'), fontWeight: 'bold' }}
                    >
                      Add Employee
                    </Button>
                    
                    <Button
                      mode="outlined"
                      onPress={() => handleNavigation('/(admin)/notifications')}
                      style={[styles.quickActionButton, { borderColor: safeThemeAccess.colors(theme, 'primary') }]}
                      contentStyle={styles.quickActionContent}
                      icon="email-send"
                      labelStyle={{ color: safeThemeAccess.colors(theme, 'primary'), fontWeight: 'bold' }}
                    >
                      Send Notifications
                    </Button>
                  </View>

                  <Divider style={[styles.divider, { backgroundColor: safeThemeAccess.colors(theme, 'outline') }]} />
                  
                  {/* Enhanced Settings */}
                  <View style={styles.settingsSection}>
                    <Text variant="labelLarge" style={[styles.sectionLabel, { color: safeThemeAccess.colors(theme, 'onSurfaceVariant') }]}>
                      SETTINGS & PREFERENCES
                    </Text>
                    
                    {/* Theme Toggle */}
                    <View style={styles.settingItem}>
                      <View style={styles.settingContent}>
                        <IconButton 
                          icon={isDarkMode ? "moon-waning-crescent" : "white-balance-sunny"} 
                          size={20}
                          iconColor={safeThemeAccess.colors(theme, 'onSurface')}
                        />
                        <Text variant="bodyMedium" style={[styles.settingText, { color: safeThemeAccess.colors(theme, 'onSurface') }]}>
                          {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                        </Text>
                        <Switch value={isDarkMode} onValueChange={toggleTheme} />
                      </View>
                    </View>

                    {/* Security Settings */}
                    <View style={styles.settingItem}>
                      <View style={styles.settingContent}>
                        <IconButton 
                          icon="shield-check" 
                          size={20}
                          iconColor={safeThemeAccess.colors(theme, 'onSurface')}
                        />
                        <Text variant="bodyMedium" style={[styles.settingText, { color: safeThemeAccess.colors(theme, 'onSurface') }]}>
                          Security Settings
                        </Text>
                        <IconButton
                          icon="chevron-right"
                          size={16}
                          iconColor={safeThemeAccess.colors(theme, 'onSurfaceVariant')}
                          onPress={() => setSecuritySettingsVisible(true)}
                        />
                      </View>
                    </View>
                    
                    {/* Logout Button */}
                    <Button 
                      mode="contained" 
                      onPress={handleLogout}
                      style={[styles.logoutButton, { backgroundColor: safeThemeAccess.colors(theme, 'error') }]}
                      contentStyle={styles.logoutContent}
                      icon="logout"
                      labelStyle={{ color: safeThemeAccess.colors(theme, 'onError'), fontWeight: 'bold' }}
                    >
                      Sign Out
                    </Button>
                  </View>
                </ScrollView>
              </Surface>
            </Animated.View>
          </>
        )}

        {/* Enhanced Main Content Area */}
        <View 
          style={[
            styles.mainContent,
            !isMobile && sidebarVisible && { marginLeft: SIDEBAR_WIDTH },
          ]}
        >
          {/* Enhanced Header with Back Button */}
          <Surface style={[styles.header, { backgroundColor: safeThemeAccess.colors(theme, 'primary') }]} elevation={4}>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                {showBackButton ? (
                  <IconButton
                    icon="arrow-left"
                    size={24}
                    onPress={handleBackPress}
                    iconColor={safeThemeAccess.colors(theme, 'onPrimary')}
                  />
                ) : (
                  <IconButton
                    icon={sidebarVisible ? "menu-open" : "menu"}
                    size={24}
                    onPress={toggleSidebar}
                    iconColor={safeThemeAccess.colors(theme, 'onPrimary')}
                  />
                )}
                <Text variant="headlineSmall" style={[styles.headerTitle, { color: safeThemeAccess.colors(theme, 'onPrimary') }]}>
                  {title}
                </Text>
              </View>
              
              <View style={styles.headerRight}>
                <IconButton
                  icon="bell"
                  size={24}
                  onPress={() => handleNavigation('/(admin)/notifications')}
                  iconColor={safeThemeAccess.colors(theme, 'onPrimary')}
                />
                <IconButton
                  icon="account-circle"
                  size={24}
                  onPress={() => setSettingsVisible(true)}
                  iconColor={safeThemeAccess.colors(theme, 'onPrimary')}
                />
                <IconButton
                  icon="logout"
                  size={24}
                  onPress={handleLogout}
                  iconColor={safeThemeAccess.colors(theme, 'onPrimary')}
                  style={[styles.logoutHeaderButton, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                />
              </View>
            </View>
          </Surface>

          {/* Page Content */}
          <View style={styles.pageContent}>
            {children}
          </View>
        </View>
      </View>

      {/* Security Settings Modal */}
      <SecuritySettings
        visible={securitySettingsVisible}
        onDismiss={() => setSecuritySettingsVisible(false)}
      />

      {/* Settings Modal */}
      <Portal>
        <Modal
          visible={settingsVisible}
          onDismiss={() => setSettingsVisible(false)}
          contentContainerStyle={styles.settingsContainer}
        >
          <Surface style={styles.settingsModal} elevation={5}>
            <View style={styles.settingsHeader}>
              <Text variant="headlineSmall" style={{ color: safeThemeAccess.colors(theme, 'onSurface'), fontWeight: 'bold' }}>
                Settings
              </Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setSettingsVisible(false)}
                iconColor={safeThemeAccess.colors(theme, 'onSurface')}
              />
            </View>

            <Divider />

            <ScrollView style={styles.settingsContent}>
              {/* User Profile Section */}
              <View style={styles.profileSection}>
                <Text variant="titleMedium" style={{ color: safeThemeAccess.colors(theme, 'onSurface'), marginBottom: 16 }}>
                  Profile Information
                </Text>
                <View style={styles.profileCard}>
                  <Avatar.Text 
                    size={48} 
                    label={user?.name?.charAt(0) || 'A'} 
                    style={{ backgroundColor: safeThemeAccess.colors(theme, 'primaryContainer') }}
                    labelStyle={{ color: safeThemeAccess.colors(theme, 'onPrimaryContainer') }}
                  />
                  <View style={styles.profileInfo}>
                    <Text variant="titleMedium" style={{ color: safeThemeAccess.colors(theme, 'onSurface') }}>
                      {user?.name || 'Admin User'}
                    </Text>
                    <Text variant="bodyMedium" style={{ color: safeThemeAccess.colors(theme, 'onSurfaceVariant') }}>
                      {user?.email || 'admin@cubs.com'}
                    </Text>
                    <Text variant="bodySmall" style={{ color: safeThemeAccess.colors(theme, 'primary') }}>
                      Role: {user?.role || 'Admin'}
                    </Text>
                  </View>
                </View>
              </View>

              <Divider style={{ marginVertical: 24 }} />

              {/* Theme Settings */}
              <View style={styles.themeSection}>
                <Text variant="titleMedium" style={{ color: safeThemeAccess.colors(theme, 'onSurface'), marginBottom: 16 }}>
                  Appearance
                </Text>
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text variant="bodyLarge" style={{ color: safeThemeAccess.colors(theme, 'onSurface') }}>
                      Dark Mode
                    </Text>
                    <Text variant="bodySmall" style={{ color: safeThemeAccess.colors(theme, 'onSurfaceVariant') }}>
                      Switch between light and dark themes
                    </Text>
                  </View>
                  <Switch value={isDarkMode} onValueChange={toggleTheme} />
                </View>
              </View>

              <Divider style={{ marginVertical: 24 }} />

              {/* Security Section */}
              <View style={styles.securitySection}>
                <Text variant="titleMedium" style={{ color: safeThemeAccess.colors(theme, 'onSurface'), marginBottom: 16 }}>
                  Security
                </Text>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setSettingsVisible(false);
                    setSecuritySettingsVisible(true);
                  }}
                  style={styles.securityButton}
                  icon="shield-check"
                  labelStyle={{ color: safeThemeAccess.colors(theme, 'primary') }}
                >
                  Manage Security Settings
                </Button>
              </View>
            </ScrollView>
          </Surface>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  layout: {
    flex: 1,
    flexDirection: 'row',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 2,
  },
  sidebarMobile: {
    width: SIDEBAR_WIDTH,
    maxWidth: '85%',
    position: 'absolute',
  },
  sidebarHeader: {
    padding: 24,
    alignItems: 'center',
    minHeight: 140,
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 10,
  },
  brandingContainer: {
    alignItems: 'center',
    width: '100%',
  },
  logoContainer: {
    width: 64,
    height: 64,
    backgroundColor: 'white',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
      }
    })
  },
  logoWrapper: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoAccent: {
    width: 24,
    height: 3,
    borderRadius: 2,
    marginTop: 4,
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  brandTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  brandSubtitle: {
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  userAvatar: {
    marginRight: 8,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  userRole: {
    fontSize: 12,
    opacity: 0.8,
  },
  sidebarContent: {
    flex: 1,
    paddingBottom: 20,
  },
  navigationSection: {
    paddingVertical: 8,
  },
  sectionLabel: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    fontSize: 12,
  },
  drawerItemContainer: {
    position: 'relative',
  },
  drawerItem: {
    marginVertical: 2,
    marginHorizontal: 8,
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 20,
    zIndex: 10,
  },
  divider: {
    height: 1,
    marginVertical: 16,
    marginHorizontal: 20,
    opacity: 0.2,
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  quickActionButton: {
    marginBottom: 12,
    borderRadius: 12,
  },
  quickActionContent: {
    paddingVertical: 12,
  },
  settingsSection: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  settingItem: {
    marginVertical: 4,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  settingText: {
    flex: 1,
    marginLeft: 8,
  },
  logoutButton: {
    marginTop: 16,
    borderRadius: 12,
  },
  logoutContent: {
    paddingVertical: 12,
  },
  mainContent: {
    flex: 1,
    height: '100%',
  },
  mainContentWithOverlay: {
    flex: 1,
  },
  header: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 64,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    marginLeft: 8,
    fontWeight: 'bold',
    flex: 1,
    fontSize: width <= 768 ? 18 : 20,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageContent: {
    flex: 1,
  },
  
  // Settings Modal Styles
  settingsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  settingsModal: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 16,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  settingsContent: {
    padding: 20,
  },
  profileSection: {
    marginBottom: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  themeSection: {
    marginBottom: 16,
  },
  settingInfo: {
    flex: 1,
  },
  securitySection: {
    marginBottom: 16,
  },
  securityButton: {
    borderRadius: 12,
  },
  logoutHeaderButton: {
    borderRadius: 12,
  },
  sidebarSurface: {
    flex: 1,
    borderRadius: 0,
  },
}); 