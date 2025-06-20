import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { View, Text, StyleSheet, Platform, AccessibilityInfo } from 'react-native';
import { Switch, Button, Card, Divider, useTheme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Accessibility Settings Types
interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  voiceOver: boolean;
  boldText: boolean;
  underlineLinks: boolean;
  focusIndicators: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: (key: keyof AccessibilitySettings, value: boolean) => void;
  isScreenReaderEnabled: boolean;
  announceForAccessibility: (message: string) => void;
  getAccessibilityLabel: (text: string, context?: string) => string;
  getAccessibilityHint: (action: string) => string;
}

// Default Settings
const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  screenReader: false,
  voiceOver: false,
  boldText: false,
  underlineLinks: false,
  focusIndicators: true,
};

// Context
const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

// Storage Key
const ACCESSIBILITY_SETTINGS_KEY = '@accessibilitySettings';

// Provider Component
interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);

  // Initialize accessibility settings
  useEffect(() => {
    const initializeAccessibility = async () => {
      try {
        // Load saved settings
        const savedSettings = await AsyncStorage.getItem(ACCESSIBILITY_SETTINGS_KEY);
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }

        // Check system accessibility settings
        const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
        setIsScreenReaderEnabled(screenReaderEnabled);

        // Listen for screen reader changes
        const subscription = AccessibilityInfo.addEventListener(
          'screenReaderChanged',
          setIsScreenReaderEnabled
        );

        return () => subscription?.remove();
      } catch (error) {
        console.error('Error initializing accessibility settings:', error);
      }
    };

    initializeAccessibility();
  }, []);

  // Update setting
  const updateSetting = async (key: keyof AccessibilitySettings, value: boolean) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await AsyncStorage.setItem(ACCESSIBILITY_SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error updating accessibility setting:', error);
    }
  };

  // Announce for accessibility
  const announceForAccessibility = (message: string) => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      AccessibilityInfo.announceForAccessibility(message);
    }
  };

  // Get accessibility label
  const getAccessibilityLabel = (text: string, context?: string): string => {
    if (context) {
      return `${text}, ${context}`;
    }
    return text;
  };

  // Get accessibility hint
  const getAccessibilityHint = (action: string): string => {
    return `Double tap to ${action}`;
  };

  const value: AccessibilityContextType = {
    settings,
    updateSetting,
    isScreenReaderEnabled,
    announceForAccessibility,
    getAccessibilityLabel,
    getAccessibilityHint,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// Hook to use accessibility
export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

// Accessibility Settings Panel Component
export const AccessibilitySettingsPanel: React.FC = () => {
  const theme = useTheme();
  const { settings, updateSetting, isScreenReaderEnabled, announceForAccessibility } = useAccessibility();

  const handleSettingChange = (key: keyof AccessibilitySettings, value: boolean) => {
    updateSetting(key, value);
    announceForAccessibility(`${key} ${value ? 'enabled' : 'disabled'}`);
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Accessibility Settings</Text>
          <Text style={styles.subtitle}>
            Customize the app to meet your accessibility needs
          </Text>

          <Divider style={styles.divider} />

          {/* Visual Settings */}
          <Text style={styles.sectionTitle}>Visual</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>High Contrast</Text>
              <Text style={styles.settingDescription}>
                Increase contrast for better visibility
              </Text>
            </View>
            <Switch
              value={settings.highContrast}
              onValueChange={(value) => handleSettingChange('highContrast', value)}
              accessibilityLabel="Toggle high contrast mode"
              accessibilityHint="Double tap to enable or disable high contrast"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Large Text</Text>
              <Text style={styles.settingDescription}>
                Increase text size for better readability
              </Text>
            </View>
            <Switch
              value={settings.largeText}
              onValueChange={(value) => handleSettingChange('largeText', value)}
              accessibilityLabel="Toggle large text"
              accessibilityHint="Double tap to enable or disable large text"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Bold Text</Text>
              <Text style={styles.settingDescription}>
                Make text bold for better visibility
              </Text>
            </View>
            <Switch
              value={settings.boldText}
              onValueChange={(value) => handleSettingChange('boldText', value)}
              accessibilityLabel="Toggle bold text"
              accessibilityHint="Double tap to enable or disable bold text"
            />
          </View>

          <Divider style={styles.divider} />

          {/* Motion Settings */}
          <Text style={styles.sectionTitle}>Motion</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Reduced Motion</Text>
              <Text style={styles.settingDescription}>
                Minimize animations and transitions
              </Text>
            </View>
            <Switch
              value={settings.reducedMotion}
              onValueChange={(value) => handleSettingChange('reducedMotion', value)}
              accessibilityLabel="Toggle reduced motion"
              accessibilityHint="Double tap to enable or disable reduced motion"
            />
          </View>

          <Divider style={styles.divider} />

          {/* Navigation Settings */}
          <Text style={styles.sectionTitle}>Navigation</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Focus Indicators</Text>
              <Text style={styles.settingDescription}>
                Show focus indicators for keyboard navigation
              </Text>
            </View>
            <Switch
              value={settings.focusIndicators}
              onValueChange={(value) => handleSettingChange('focusIndicators', value)}
              accessibilityLabel="Toggle focus indicators"
              accessibilityHint="Double tap to enable or disable focus indicators"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Underline Links</Text>
              <Text style={styles.settingDescription}>
                Underline all clickable links
              </Text>
            </View>
            <Switch
              value={settings.underlineLinks}
              onValueChange={(value) => handleSettingChange('underlineLinks', value)}
              accessibilityLabel="Toggle underlined links"
              accessibilityHint="Double tap to enable or disable underlined links"
            />
          </View>

          <Divider style={styles.divider} />

          {/* System Information */}
          <Text style={styles.sectionTitle}>System Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Screen Reader:</Text>
            <Text style={styles.infoValue}>
              {isScreenReaderEnabled ? 'Enabled' : 'Disabled'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Platform:</Text>
            <Text style={styles.infoValue}>{Platform.OS}</Text>
          </View>

          {/* Reset Button */}
          <Button
            mode="outlined"
            onPress={() => {
              Object.keys(defaultSettings).forEach((key) => {
                handleSettingChange(
                  key as keyof AccessibilitySettings,
                  defaultSettings[key as keyof AccessibilitySettings]
                );
              });
              announceForAccessibility('Accessibility settings reset to default');
            }}
            style={styles.resetButton}
            accessibilityLabel="Reset accessibility settings"
            accessibilityHint="Double tap to reset all accessibility settings to default"
          >
            Reset to Default
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
};

// Accessible Text Component
interface AccessibleTextProps {
  children: string;
  style?: any;
  accessibilityRole?: 'text' | 'header' | 'button' | 'link';
  accessibilityHint?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export const AccessibleText: React.FC<AccessibleTextProps> = ({
  children,
  style,
  accessibilityRole = 'text',
  accessibilityHint,
  level,
}) => {
  const { settings } = useAccessibility();

  const textStyle = [
    style,
    settings.largeText && styles.largeText,
    settings.boldText && styles.boldText,
    settings.highContrast && styles.highContrastText,
  ];

  const accessibilityProps = {
    accessibilityRole,
    accessibilityLabel: children,
    accessibilityHint,
  };

  return (
    <Text style={textStyle} {...accessibilityProps}>
      {children}
    </Text>
  );
};

// Accessible Button Component
interface AccessibleButtonProps {
  title: string;
  onPress: () => void;
  mode?: 'text' | 'outlined' | 'contained';
  disabled?: boolean;
  accessibilityHint?: string;
  style?: any;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  title,
  onPress,
  mode = 'contained',
  disabled = false,
  accessibilityHint,
  style,
}) => {
  const { settings, getAccessibilityHint } = useAccessibility();

  const buttonStyle = [
    style,
    settings.focusIndicators && styles.focusIndicator,
  ];

  return (
    <Button
      mode={mode}
      onPress={onPress}
      disabled={disabled}
      style={buttonStyle}
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint || getAccessibilityHint(title.toLowerCase())}
      accessibilityRole="button"
    >
      {title}
    </Button>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1976D2',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  resetButton: {
    marginTop: 24,
  },
  // Accessibility Styles
  largeText: {
    fontSize: 18,
  },
  boldText: {
    fontWeight: 'bold',
  },
  highContrastText: {
    color: '#000000',
  },
  focusIndicator: {
    borderWidth: 2,
    borderColor: '#2196F3',
  },
});
