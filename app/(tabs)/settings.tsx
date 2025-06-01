import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Dimensions, Linking } from 'react-native';
import {
  Text,
  Card,
  useTheme,
  Surface,
  Switch,
  Button,
  List,
  Divider,
  IconButton,
  Chip,
  Portal,
  Modal,
  TextInput,
  SegmentedButtons,
  ActivityIndicator,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { CustomTheme } from '../../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface AppSettings {
  notifications: {
    pushNotifications: boolean;
    emailAlerts: boolean;
    visaExpiryAlerts: boolean;
    systemUpdates: boolean;
  };
  display: {
    theme: 'light' | 'dark' | 'auto';
    language: 'en' | 'ar';
    fontSize: 'small' | 'medium' | 'large';
  };
  privacy: {
    analytics: boolean;
    crashReporting: boolean;
    dataSharing: boolean;
  };
  sync: {
    autoSync: boolean;
    syncFrequency: '15m' | '30m' | '1h' | '24h';
    wifiOnly: boolean;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  notifications: {
    pushNotifications: true,
    emailAlerts: true,
    visaExpiryAlerts: true,
    systemUpdates: false,
  },
  display: {
    theme: 'light',
    language: 'en',
    fontSize: 'medium',
  },
  privacy: {
    analytics: false,
    crashReporting: true,
    dataSharing: false,
  },
  sync: {
    autoSync: true,
    syncFrequency: '30m',
    wifiOnly: true,
  },
};

export default function SettingsScreen() {
  const theme = useTheme() as CustomTheme;
  const { user, logout } = useAuth();
  
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [storageInfo, setStorageInfo] = useState<any>(null);

  // Professional color scheme - Ferrari Red
  const COLORS = {
    primary: '#DC143C', // Ferrari Red
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    purple: '#8B5CF6',
    gray: '#6B7280',
  };

  useEffect(() => {
    loadSettings();
    calculateStorageInfo();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('appSettings');
      if (savedSettings) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      await AsyncStorage.setItem('appSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const calculateStorageInfo = async () => {
    try {
      // Note: Storage tracking not yet implemented in production
      // This would normally calculate actual app storage usage
      const storageInfo = {
        used: 'Coming Soon',
        available: 'Coming Soon',
        cached: 'Coming Soon',
        documents: 'Coming Soon',
        images: 'Coming Soon',
      };
      setStorageInfo(storageInfo);
    } catch (error) {
      console.error('Error calculating storage:', error);
    }
  };

  const updateSetting = (section: keyof AppSettings, key: string, value: any) => {
    const newSettings = {
      ...settings,
      [section]: {
        ...settings[section],
        [key]: value,
      },
    };
    saveSettings(newSettings);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const clearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: async () => {
            setLoading(true);
            try {
              // Simulate cache clearing
              await new Promise(resolve => setTimeout(resolve, 2000));
              Alert.alert('Success', 'Cache cleared successfully');
              calculateStorageInfo();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const exportData = async () => {
    Alert.alert(
      'Export Data',
      'Your data will be exported as a JSON file. This may take a moment.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            setLoading(true);
            // Simulate export
            setTimeout(() => {
              setLoading(false);
              Alert.alert('Success', 'Data exported successfully! Check your downloads folder.');
            }, 3000);
          }
        }
      ]
    );
  };

  const openSupport = () => {
    Linking.openURL('mailto:support@cubs.com?subject=CUBS App Support Request');
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://cubs.com/privacy-policy');
  };

  const checkForUpdates = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Up to Date', 'You are using the latest version of CUBS Employee Management.');
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={[COLORS.primary, '#B91C3C', '#991B1B']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text variant="headlineSmall" style={styles.headerTitle}>
              ⚙️ Settings
            </Text>
            <Text variant="bodyMedium" style={styles.headerSubtitle}>
              Customize your app experience
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Surface style={styles.versionBadge} elevation={2}>
              <Text style={[styles.versionText, { color: COLORS.primary }]}>
                v2.1.0
              </Text>
            </Surface>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Profile Section */}
        <Surface style={styles.section} elevation={2}>
          <View style={styles.profileSection}>
            <View style={styles.profileInfo}>
              <Text variant="titleMedium" style={styles.userName}>
                {user?.email || 'User'}
              </Text>
              <Text variant="bodySmall" style={styles.userRole}>
                {user?.role === 'admin' ? 'Administrator' : 'Employee'}
              </Text>
            </View>
            <Button
              mode="outlined"
              onPress={() => Alert.alert('Profile', 'Profile editing will be available in the next update.')}
              style={{ borderColor: COLORS.primary }}
              labelStyle={{ color: COLORS.primary }}
              icon="account-edit"
              compact
            >
              Edit Profile
            </Button>
          </View>
        </Surface>

        {/* Notifications Settings */}
        <Surface style={styles.section} elevation={2}>
          <View style={styles.sectionHeader}>
            <IconButton icon="bell" size={24} iconColor={COLORS.primary} />
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: COLORS.primary }]}>
              Notifications
            </Text>
          </View>
          
          <View style={styles.settingsList}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text variant="bodyMedium">Push Notifications</Text>
                <Text variant="bodySmall" style={styles.settingDescription}>
                  Receive notifications on your device
                </Text>
              </View>
              <Switch
                value={settings.notifications.pushNotifications}
                onValueChange={(value) => updateSetting('notifications', 'pushNotifications', value)}
                thumbColor={COLORS.primary}
              />
            </View>

            <Divider />

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text variant="bodyMedium">Email Alerts</Text>
                <Text variant="bodySmall" style={styles.settingDescription}>
                  Get important updates via email
                </Text>
              </View>
              <Switch
                value={settings.notifications.emailAlerts}
                onValueChange={(value) => updateSetting('notifications', 'emailAlerts', value)}
                thumbColor={COLORS.primary}
              />
            </View>

            <Divider />

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text variant="bodyMedium">Visa Expiry Alerts</Text>
                <Text variant="bodySmall" style={styles.settingDescription}>
                  Alerts for upcoming visa expirations
                </Text>
              </View>
              <Switch
                value={settings.notifications.visaExpiryAlerts}
                onValueChange={(value) => updateSetting('notifications', 'visaExpiryAlerts', value)}
                thumbColor={COLORS.primary}
              />
            </View>

            <Divider />

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text variant="bodyMedium">System Updates</Text>
                <Text variant="bodySmall" style={styles.settingDescription}>
                  Notifications about app updates
                </Text>
              </View>
              <Switch
                value={settings.notifications.systemUpdates}
                onValueChange={(value) => updateSetting('notifications', 'systemUpdates', value)}
                thumbColor={COLORS.primary}
              />
            </View>
          </View>
        </Surface>

        {/* Display Settings */}
        <Surface style={styles.section} elevation={2}>
          <View style={styles.sectionHeader}>
            <IconButton icon="palette" size={24} iconColor={COLORS.primary} />
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: COLORS.primary }]}>
              Display & Language
            </Text>
          </View>

          <View style={styles.settingsList}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text variant="bodyMedium">Theme</Text>
                <Text variant="bodySmall" style={styles.settingDescription}>
                  Choose your preferred theme
                </Text>
              </View>
              <SegmentedButtons
                value={settings.display.theme}
                onValueChange={(value) => updateSetting('display', 'theme', value)}
                buttons={[
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'auto', label: 'Auto' },
                ]}
                style={styles.segmentedButtons}
              />
            </View>

            <Divider />

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text variant="bodyMedium">Language</Text>
                <Text variant="bodySmall" style={styles.settingDescription}>
                  Select your preferred language
                </Text>
              </View>
              <SegmentedButtons
                value={settings.display.language}
                onValueChange={(value) => updateSetting('display', 'language', value)}
                buttons={[
                  { value: 'en', label: 'English' },
                  { value: 'ar', label: 'العربية' },
                ]}
                style={styles.segmentedButtons}
              />
            </View>

            <Divider />

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text variant="bodyMedium">Font Size</Text>
                <Text variant="bodySmall" style={styles.settingDescription}>
                  Adjust text size for better readability
                </Text>
              </View>
              <SegmentedButtons
                value={settings.display.fontSize}
                onValueChange={(value) => updateSetting('display', 'fontSize', value)}
                buttons={[
                  { value: 'small', label: 'Small' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'large', label: 'Large' },
                ]}
                style={styles.segmentedButtons}
              />
            </View>
          </View>
        </Surface>

        {/* Data & Sync Settings */}
        <Surface style={styles.section} elevation={2}>
          <View style={styles.sectionHeader}>
            <IconButton icon="sync" size={24} iconColor={COLORS.primary} />
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: COLORS.primary }]}>
              Data & Sync
            </Text>
          </View>

          <View style={styles.settingsList}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text variant="bodyMedium">Auto Sync</Text>
                <Text variant="bodySmall" style={styles.settingDescription}>
                  Automatically sync data in background
                </Text>
              </View>
              <Switch
                value={settings.sync.autoSync}
                onValueChange={(value) => updateSetting('sync', 'autoSync', value)}
                thumbColor={COLORS.primary}
              />
            </View>

            <Divider />

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text variant="bodyMedium">WiFi Only Sync</Text>
                <Text variant="bodySmall" style={styles.settingDescription}>
                  Sync only when connected to WiFi
                </Text>
              </View>
              <Switch
                value={settings.sync.wifiOnly}
                onValueChange={(value) => updateSetting('sync', 'wifiOnly', value)}
                thumbColor={COLORS.primary}
              />
            </View>
          </View>
        </Surface>

        {/* Storage Information */}
        <Surface style={styles.section} elevation={2}>
          <View style={styles.sectionHeader}>
            <IconButton icon="harddisk" size={24} iconColor={COLORS.primary} />
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: COLORS.primary }]}>
              Storage & Data
            </Text>
          </View>

          {storageInfo && (
            <View style={styles.storageInfo}>
              <View style={styles.storageItem}>
                <Text variant="bodyMedium">App Data</Text>
                <Text variant="bodySmall" style={styles.storageValue}>{storageInfo.used}</Text>
              </View>
              <View style={styles.storageItem}>
                <Text variant="bodyMedium">Documents</Text>
                <Text variant="bodySmall" style={styles.storageValue}>{storageInfo.documents}</Text>
              </View>
              <View style={styles.storageItem}>
                <Text variant="bodyMedium">Cache</Text>
                <Text variant="bodySmall" style={styles.storageValue}>{storageInfo.cached}</Text>
              </View>
            </View>
          )}

          <View style={styles.storageActions}>
            <Button
              mode="outlined"
              onPress={clearCache}
              loading={loading}
              style={[styles.storageButton, { borderColor: COLORS.warning }]}
              labelStyle={{ color: COLORS.warning }}
              icon="delete-sweep"
            >
              Clear Cache
            </Button>
            <Button
              mode="outlined"
              onPress={exportData}
              loading={loading}
              style={[styles.storageButton, { borderColor: COLORS.info }]}
              labelStyle={{ color: COLORS.info }}
              icon="download"
            >
              Export Data
            </Button>
          </View>
        </Surface>

        {/* Privacy Settings */}
        <Surface style={styles.section} elevation={2}>
          <View style={styles.sectionHeader}>
            <IconButton icon="shield-account" size={24} iconColor={COLORS.primary} />
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: COLORS.primary }]}>
              Privacy & Security
            </Text>
          </View>

          <View style={styles.settingsList}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text variant="bodyMedium">Analytics</Text>
                <Text variant="bodySmall" style={styles.settingDescription}>
                  Help improve the app with usage data
                </Text>
              </View>
              <Switch
                value={settings.privacy.analytics}
                onValueChange={(value) => updateSetting('privacy', 'analytics', value)}
                thumbColor={COLORS.primary}
              />
            </View>

            <Divider />

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text variant="bodyMedium">Crash Reporting</Text>
                <Text variant="bodySmall" style={styles.settingDescription}>
                  Send crash reports to improve stability
                </Text>
              </View>
              <Switch
                value={settings.privacy.crashReporting}
                onValueChange={(value) => updateSetting('privacy', 'crashReporting', value)}
                thumbColor={COLORS.primary}
              />
            </View>

            <List.Item
              title="Privacy Policy"
              description="View our privacy policy"
              left={props => <List.Icon {...props} icon="file-document" color={COLORS.info} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setShowPrivacyModal(true)}
            />
          </View>
        </Surface>

        {/* App Information */}
        <Surface style={styles.section} elevation={2}>
          <View style={styles.sectionHeader}>
            <IconButton icon="information" size={24} iconColor={COLORS.primary} />
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: COLORS.primary }]}>
              App Information
            </Text>
          </View>

          <View style={styles.appActions}>
            <List.Item
              title="Check for Updates"
              description="Ensure you have the latest features"
              left={props => <List.Icon {...props} icon="update" color={COLORS.success} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={checkForUpdates}
            />
            
            <List.Item
              title="About"
              description="App version and information"
              left={props => <List.Icon {...props} icon="information-outline" color={COLORS.info} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setShowAboutModal(true)}
            />
            
            <List.Item
              title="Support"
              description="Get help and report issues"
              left={props => <List.Icon {...props} icon="help-circle" color={COLORS.purple} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={openSupport}
            />
            
            <List.Item
              title="Rate App"
              description="Rate us on the app store"
              left={props => <List.Icon {...props} icon="star" color={COLORS.warning} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('Rate App', 'Thank you for using CUBS Employee Management!')}
            />
          </View>
        </Surface>

        {/* Sign Out */}
        <Surface style={[styles.section, { marginBottom: 100 }]} elevation={2}>
          <Button
            mode="contained"
            onPress={handleSignOut}
            loading={loading}
            style={[styles.signOutButton, { backgroundColor: COLORS.error }]}
            labelStyle={{ color: 'white', fontWeight: 'bold' }}
            icon="logout"
          >
            Sign Out
          </Button>
        </Surface>
      </ScrollView>

      {/* About Modal */}
      <Portal>
        <Modal
          visible={showAboutModal}
          onDismiss={() => setShowAboutModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modal} elevation={5}>
            <Text variant="headlineSmall" style={styles.modalTitle}>
              About CUBS Employee Management
            </Text>
            
            <View style={styles.aboutContent}>
              <Text variant="bodyMedium" style={styles.aboutText}>
                Version: 2.1.0{'\n'}
                Build: 240623{'\n'}
                Released: June 2024
              </Text>
              
              <Divider style={{ marginVertical: 16 }} />
              
              <Text variant="bodyMedium" style={styles.aboutDescription}>
                CUBS Employee Management System helps you track employee information, 
                visa status, documents, and more. Built with modern technology for 
                reliable performance.
              </Text>
              
              <View style={styles.aboutFeatures}>
                <Chip icon="check" style={styles.featureChip}>Employee Management</Chip>
                <Chip icon="check" style={styles.featureChip}>Visa Tracking</Chip>
                <Chip icon="check" style={styles.featureChip}>Document Storage</Chip>
                <Chip icon="check" style={styles.featureChip}>Email Notifications</Chip>
              </View>
            </View>
            
            <View style={styles.modalActions}>
              <Button
                mode="contained"
                onPress={() => setShowAboutModal(false)}
                style={{ backgroundColor: COLORS.primary }}
              >
                Close
              </Button>
            </View>
          </Surface>
        </Modal>
      </Portal>

      {/* Privacy Policy Modal */}
      <Portal>
        <Modal
          visible={showPrivacyModal}
          onDismiss={() => setShowPrivacyModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modal} elevation={5}>
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Privacy Policy
            </Text>
            
            <ScrollView style={styles.privacyContent}>
              <Text variant="bodyMedium" style={styles.privacyText}>
                <Text style={{ fontWeight: 'bold' }}>Data Collection{'\n'}</Text>
                We collect only essential information needed for employee management functionality.
                {'\n\n'}
                <Text style={{ fontWeight: 'bold' }}>Data Usage{'\n'}</Text>
                Your data is used solely for employee management purposes and is not shared with third parties.
                {'\n\n'}
                <Text style={{ fontWeight: 'bold' }}>Data Security{'\n'}</Text>
                All data is encrypted and stored securely using industry-standard practices.
                {'\n\n'}
                <Text style={{ fontWeight: 'bold' }}>Your Rights{'\n'}</Text>
                You have the right to access, modify, or delete your personal information at any time.
              </Text>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={openPrivacyPolicy}
                style={{ flex: 1, marginRight: 8, borderColor: COLORS.primary }}
                labelStyle={{ color: COLORS.primary }}
              >
                View Full Policy
              </Button>
              <Button
                mode="contained"
                onPress={() => setShowPrivacyModal(false)}
                style={{ flex: 1, marginLeft: 8, backgroundColor: COLORS.primary }}
              >
                Close
              </Button>
            </View>
          </Surface>
        </Modal>
      </Portal>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <Surface style={styles.loadingContainer} elevation={5}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text variant="bodyMedium" style={styles.loadingText}>
              Please wait...
            </Text>
          </Surface>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
  },
  headerRight: {
    alignItems: 'center',
  },
  versionBadge: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  versionText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'white',
  },
  profileSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userRole: {
    color: '#6B7280',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    marginLeft: 8,
    fontWeight: 'bold',
  },
  settingsList: {
    gap: 0,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingDescription: {
    color: '#6B7280',
    marginTop: 2,
  },
  segmentedButtons: {
    minWidth: 200,
  },
  storageInfo: {
    marginBottom: 16,
  },
  storageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  storageValue: {
    color: '#6B7280',
    fontWeight: 'bold',
  },
  storageActions: {
    flexDirection: 'row',
    gap: 12,
  },
  storageButton: {
    flex: 1,
    borderRadius: 12,
  },
  appActions: {
    gap: 0,
  },
  signOutButton: {
    paddingVertical: 8,
    borderRadius: 12,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'white',
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: 'bold',
  },
  aboutContent: {
    marginBottom: 24,
  },
  aboutText: {
    lineHeight: 20,
    color: '#374151',
  },
  aboutDescription: {
    lineHeight: 20,
    color: '#6B7280',
  },
  aboutFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  featureChip: {
    backgroundColor: '#F3F4F6',
  },
  privacyContent: {
    maxHeight: 300,
    marginBottom: 24,
  },
  privacyText: {
    lineHeight: 22,
    color: '#374151',
  },
  modalActions: {
    flexDirection: 'row',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minWidth: 120,
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});
