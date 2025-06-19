import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ScrollView, BackHandler, Animated, Platform, Image } from 'react-native';
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

// ENHANCED: Logo import with multiple fallback options - REMOVED
// const getLogo = () => {
//   try {
//     // Try primary logo first
//     return require('../assets/logo.png');
//   } catch (error) {
//     try {
//       // Try alternative logos
//       return require('../assets/logo2.png');
//     } catch (error2) {
//       try {
//         return require('../assets/logo123.png');
//       } catch (error3) {
//         console.warn('No logo images found in AdminLayout, using text fallback');
//         return null;
//       }
//     }
//   }
// };

// const logoImage = getLogo();

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
  ];

  const handleNavigation = (route: string) => {
    if (router.canGoBack() && route === currentRoute) {
        setSidebarVisible(false);
        return;
    }
    router.push(route as any);
    if (isMobile) {
      setSidebarVisible(false);
    }
  };

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      // Fallback for web if router.back() is not available
      if (Platform.OS === 'web') {
        window.history.back();
      }
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
                {/* Enhanced Sidebar Header - Compact for Mobile */}
                <Surface style={[styles.sidebarHeader, { 
                  backgroundColor: safeThemeAccess.colors(theme, 'primary'),
                  minHeight: isMobile ? 60 : 80,
                  padding: isMobile ? 12 : 20,
                }]} elevation={4}>
                  <View style={styles.headerContainer}>
                    {isMobile && (
                      <IconButton
                        icon="close"
                        size={18}
                        onPress={() => setSidebarVisible(false)}
                        iconColor={safeThemeAccess.colors(theme, 'onPrimary')}
                        style={styles.closeButton}
                      />
                    )}
                    
                    <View style={styles.brandingContainer}>
                      <Text variant={isMobile ? "titleMedium" : "headlineSmall"} style={[styles.brandTitle, { 
                        color: safeThemeAccess.colors(theme, 'onPrimary'),
                        textAlign: 'center',
                        fontWeight: 'bold',
                        marginBottom: isMobile ? 4 : 8,
                        flexWrap: 'wrap',
                        maxWidth: '100%',
                        fontSize: isMobile ? 16 : 20,
                        lineHeight: isMobile ? 18 : 24,
                      }]} numberOfLines={isMobile ? 1 : 1}>
                        CUBS Technical
                      </Text>
                      <Text variant={isMobile ? "bodySmall" : "titleSmall"} style={[styles.brandSubtitle, { 
                        color: safeThemeAccess.colors(theme, 'onPrimary'),
                        textAlign: 'center',
                        opacity: 0.9,
                        marginBottom: isMobile ? 8 : 12,
                        flexWrap: 'wrap',
                        maxWidth: '100%',
                        fontSize: isMobile ? 12 : 14,
                        lineHeight: isMobile ? 14 : 16,
                      }]} numberOfLines={isMobile ? 1 : 1}>
                        Employee Management
                      </Text>
                      
                      {/* Enhanced User Info - Compact for Mobile */}
                      <View style={[styles.userInfo, {
                        paddingHorizontal: isMobile ? 8 : 12,
                        paddingVertical: isMobile ? 6 : 8,
                      }]}>
                        <Avatar.Text 
                          size={isMobile ? 28 : 32} 
                          label={user?.name?.charAt(0) || 'A'} 
                          style={[styles.userAvatar, { backgroundColor: safeThemeAccess.colors(theme, 'onPrimary') }]}
                          labelStyle={{ color: safeThemeAccess.colors(theme, 'primary'), fontSize: isMobile ? 12 : 14, fontWeight: 'bold' }}
                        />
                        <View style={styles.userDetails}>
                          <Text variant={isMobile ? "bodyMedium" : "titleSmall"} style={[styles.userName, { 
                            color: safeThemeAccess.colors(theme, 'onPrimary'),
                            flexWrap: 'wrap',
                            maxWidth: isMobile ? 120 : 150,
                          }]} numberOfLines={1}>
                            {user?.name || 'Administrator'}
                          </Text>
                          <Text variant="bodySmall" style={[styles.userRole, { 
                            color: safeThemeAccess.colors(theme, 'onPrimary'),
                            fontSize: isMobile ? 10 : 12,
                            flexWrap: 'wrap',
                            maxWidth: isMobile ? 120 : 150,
                          }]} numberOfLines={1}>
                            {user?.role === 'admin' ? '👑 Admin Access' : '👤 User Access'}
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
                              borderLeftWidth: 4,
                              borderLeftColor: safeThemeAccess.colors(theme, 'primary'),
                            }
                          ]}
                        />
                        {item.badge && (
                          <Badge 
                            style={[styles.badge, { 
                              backgroundColor: safeThemeAccess.colors(theme, 'error'),
                              borderColor: safeThemeAccess.colors(theme, 'surface'),
                              borderWidth: 2,
                            }]}
                            size={22}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </View>
                    ))}
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
                        <Switch 
                          value={isDarkMode} 
                          onValueChange={toggleTheme}
                          thumbColor={isDarkMode ? safeThemeAccess.colors(theme, 'primary') : undefined}
                          trackColor={{ 
                            false: safeThemeAccess.colors(theme, 'outline'), 
                            true: safeThemeAccess.colors(theme, 'primaryContainer') 
                          }}
                        />
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
                    
                    {/* Enhanced Logout Button */}
                    <Button 
                      mode="contained" 
                      onPress={handleLogout}
                      style={[styles.logoutButton, { backgroundColor: safeThemeAccess.colors(theme, 'error') }]}
                      contentStyle={styles.logoutContent}
                      icon="logout"
                      labelStyle={{ color: safeThemeAccess.colors(theme, 'onError'), fontWeight: 'bold' }}
                    >
                      Sign Out Securely
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
          {/* Enhanced Header with Back Button - Compact for Mobile */}
          <Surface style={[styles.header, { 
            backgroundColor: safeThemeAccess.colors(theme, 'primary'),
            minHeight: isMobile ? 44 : 56,
            paddingVertical: isMobile ? 2 : 6,
            paddingHorizontal: isMobile ? 2 : 6,
          }]} elevation={4}>
            <View style={[styles.headerContent, {
              minHeight: isMobile ? 36 : 48,
              paddingHorizontal: isMobile ? 6 : 10,
            }]}>
              <View style={styles.headerLeft}>
                {showBackButton ? (
                  <IconButton
                    icon="arrow-left"
                    size={isMobile ? 18 : 22}
                    onPress={handleBackPress}
                    iconColor={safeThemeAccess.colors(theme, 'onPrimary')}
                    style={{ margin: 0 }}
                  />
                ) : (
                  <IconButton
                    icon={sidebarVisible ? "menu-open" : "menu"}
                    size={isMobile ? 18 : 22}
                    onPress={toggleSidebar}
                    iconColor={safeThemeAccess.colors(theme, 'onPrimary')}
                    style={{ margin: 0 }}
                  />
                )}
                <Text variant={isMobile ? "titleMedium" : "headlineSmall"} style={[styles.headerTitle, { 
                  color: safeThemeAccess.colors(theme, 'onPrimary'),
                  fontSize: isMobile ? 14 : 18,
                  fontWeight: 'bold',
                  marginLeft: isMobile ? 6 : 10,
                  flex: 1,
                  flexWrap: 'wrap',
                  textAlign: 'left',
                  maxWidth: isMobile ? '75%' : '80%',
                  lineHeight: isMobile ? 16 : 20,
                }]} numberOfLines={isMobile ? 1 : 1}>
                  {title}
                </Text>
              </View>

              <View style={styles.headerRight}>
                {/* User Info - Ultra Compact on Mobile */}
                <View style={styles.userInfoCompact}>
                  <Avatar.Text 
                    size={isMobile ? 24 : 32} 
                    label={user?.name?.charAt(0) || 'U'} 
                    style={[styles.userAvatar, { 
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      marginRight: isMobile ? 4 : 8,
                    }]}
                    labelStyle={{ 
                      color: safeThemeAccess.colors(theme, 'onPrimary'),
                      fontSize: isMobile ? 10 : 14,
                      fontWeight: 'bold',
                    }}
                  />
                  {!isMobile && (
                    <View style={styles.userDetails}>
                      <Text variant="bodySmall" style={[styles.userName, { 
                        color: safeThemeAccess.colors(theme, 'onPrimary'),
                        fontSize: 12,
                        fontWeight: 'bold',
                      }]} numberOfLines={1}>
                        {user?.name}
                      </Text>
                      <Text variant="bodySmall" style={[styles.userRole, { 
                        color: safeThemeAccess.colors(theme, 'onPrimary'),
                        fontSize: 10,
                        opacity: 0.8,
                      }]} numberOfLines={1}>
                        {user?.role}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={[styles.headerRight, {
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: isMobile ? 4 : 8,
                }]}>
                  <IconButton
                    icon="bell"
                    size={isMobile ? 18 : 24}
                    onPress={() => handleNavigation('/(admin)/notifications')}
                    iconColor={safeThemeAccess.colors(theme, 'onPrimary')}
                    style={{ margin: 0 }}
                  />
                  <IconButton
                    icon="account-circle"
                    size={isMobile ? 18 : 24}
                    onPress={() => setSettingsVisible(true)}
                    iconColor={safeThemeAccess.colors(theme, 'onPrimary')}
                    style={{ margin: 0 }}
                  />
                  <IconButton
                    icon="logout"
                    size={isMobile ? 18 : 24}
                    onPress={handleLogout}
                    iconColor={safeThemeAccess.colors(theme, 'onPrimary')}
                    style={[styles.logoutHeaderButton, { 
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      margin: 0,
                    }]}
                  />
                </View>
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
  logoWrapper: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
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
  drawerItemLabel: {
    fontWeight: '500',
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
    marginBottom: 8,
    borderRadius: 8,
    height: 36,
  },
  quickActionContent: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionLabel: {
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 0.3,
    textAlign: 'center',
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
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
  logoFallback: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoAccent: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  userInfoCompact: {
    flexDirection: 'row',
    alignItems: 'center',
  },
}); 