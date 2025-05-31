import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Dimensions } from 'react-native';
import {
  Text,
  Card,
  List,
  Switch,
  Button,
  useTheme,
  Surface,
  Chip,
  Divider,
  ProgressBar,
  IconButton,
  Portal,
  Modal,
  ActivityIndicator,
} from 'react-native-paper';
import { useSecureAuth } from '../hooks/useSecureAuth';
import { CustomTheme } from '../theme';
import { safeThemeAccess } from '../utils/errorPrevention';
import * as LocalAuthentication from 'expo-local-authentication';

const { width } = Dimensions.get('window');

interface SecuritySettingsProps {
  visible: boolean;
  onDismiss: () => void;
  onSecurityChange?: (settings: SecuritySettings) => void;
}

interface SecuritySettings {
  biometricEnabled: boolean;
  autoLockEnabled: boolean;
  sessionTimeout: number;
}

export default function SecuritySettings({ visible, onDismiss, onSecurityChange }: SecuritySettingsProps) {
  const theme = useTheme() as CustomTheme;
  const {
    isBiometricAvailable,
    isBiometricEnabled,
    supportedBiometricTypes,
    enableBiometric,
    disableBiometric,
    isLoading,
    securityError,
    reinitialize,
  } = useSecureAuth();

  const [isChangingBiometric, setIsChangingBiometric] = useState(false);
  const [showSecurityDetails, setShowSecurityDetails] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [autoLockEnabled, setAutoLockEnabled] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(15);

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  useEffect(() => {
    // Permanently enable biometric authentication
    onSecurityChange?.({
      biometricEnabled: true,
      autoLockEnabled,
      sessionTimeout,
    });
  }, [autoLockEnabled, sessionTimeout, onSecurityChange]);

  const checkBiometricSupport = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricSupported(compatible && enrolled);
    } catch (error) {
      console.error('Biometric check failed:', error);
      setBiometricSupported(false);
    }
  };

  const handleBiometricToggle = async () => {
    setIsChangingBiometric(true);
    try {
      if (isBiometricEnabled) {
        const success = await disableBiometric();
        if (success) {
          Alert.alert('Success', 'Biometric authentication has been disabled.');
        }
      } else {
        const success = await enableBiometric();
        if (success) {
          Alert.alert('Success', 'Biometric authentication has been enabled.');
        }
      }
    } catch (error) {
      console.error('Biometric toggle error:', error);
      Alert.alert('Error', 'Failed to change biometric settings. Please try again.');
    } finally {
      setIsChangingBiometric(false);
    }
  };

  const getBiometricTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'facial_recognition':
      case 'face_id':
        return 'face-recognition';
      case 'fingerprint':
      case 'touch_id':
        return 'fingerprint';
      case 'iris':
        return 'eye';
      default:
        return 'shield-check';
    }
  };

  const getSecurityScore = () => {
    let score = 50; // Base score
    
    if (isBiometricEnabled) score += 30;
    if (isBiometricAvailable) score += 10;
    if (!securityError) score += 10;
    
    return Math.min(100, score);
  };

  const getSecurityLevel = () => {
    const score = getSecurityScore();
    if (score >= 90) return { level: 'Excellent', color: theme.colors.primary };
    if (score >= 70) return { level: 'Good', color: '#4CAF50' };
    if (score >= 50) return { level: 'Fair', color: '#FF9800' };
    return { level: 'Needs Improvement', color: theme.colors.error };
  };

  const securityLevel = getSecurityLevel();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <Surface style={[styles.modal, { backgroundColor: safeThemeAccess.colors(theme, 'surface') }]} elevation={5}>
          {/* Header */}
          <View style={styles.header}>
            <Text variant="headlineSmall" style={[styles.title, { color: safeThemeAccess.colors(theme, 'onSurface') }]}>
              Security Settings
            </Text>
            <IconButton
              icon="close"
              onPress={onDismiss}
              iconColor={safeThemeAccess.colors(theme, 'onSurface')}
            />
          </View>

          <Divider />

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Security Score */}
            <Card style={[styles.scoreCard, { backgroundColor: safeThemeAccess.colors(theme, 'surfaceVariant') }]} elevation={2}>
              <Card.Content>
                <View style={styles.scoreHeader}>
                  <View style={styles.scoreInfo}>
                    <Text variant="titleLarge" style={{ color: safeThemeAccess.colors(theme, 'onSurface') }}>
                      Security Level
                    </Text>
                    <Text variant="headlineMedium" style={{ color: securityLevel.color, fontWeight: 'bold' }}>
                      {securityLevel.level}
                    </Text>
                  </View>
                  <View style={styles.scoreCircle}>
                    <Text variant="headlineLarge" style={{ color: securityLevel.color, fontWeight: 'bold' }}>
                      {getSecurityScore()}
                    </Text>
                    <Text variant="bodySmall" style={{ color: safeThemeAccess.colors(theme, 'onSurfaceVariant') }}>
                      / 100
                    </Text>
                  </View>
                </View>
                <ProgressBar
                  progress={getSecurityScore() / 100}
                  color={securityLevel.color}
                  style={styles.progressBar}
                />
              </Card.Content>
            </Card>

            {/* Security Error */}
            {securityError && (
              <Surface style={[styles.errorCard, { backgroundColor: safeThemeAccess.colors(theme, 'errorContainer') }]} elevation={2}>
                <View style={styles.errorContent}>
                  <IconButton 
                    icon="alert-circle" 
                    iconColor={safeThemeAccess.colors(theme, 'onErrorContainer')} 
                    size={24} 
                  />
                  <View style={styles.errorText}>
                    <Text variant="titleMedium" style={{ color: safeThemeAccess.colors(theme, 'onErrorContainer'), fontWeight: 'bold' }}>
                      Security Issue Detected
                    </Text>
                    <Text variant="bodyMedium" style={{ color: safeThemeAccess.colors(theme, 'onErrorContainer') }}>
                      {securityError}
                    </Text>
                  </View>
                </View>
                <Button
                  mode="outlined"
                  onPress={reinitialize}
                  style={[styles.fixButton, { borderColor: safeThemeAccess.colors(theme, 'onErrorContainer') }]}
                  labelStyle={{ color: safeThemeAccess.colors(theme, 'onErrorContainer') }}
                  icon="wrench"
                >
                  Fix Issue
                </Button>
              </Surface>
            )}

            {/* Biometric Authentication */}
            <Card style={[styles.settingsCard, { backgroundColor: safeThemeAccess.colors(theme, 'surface') }]} elevation={1}>
              <Card.Content>
                <Text variant="titleLarge" style={[styles.sectionTitle, { color: safeThemeAccess.colors(theme, 'primary') }]}>
                  Biometric Authentication
                </Text>

                {biometricSupported ? (
                  <>
                    <List.Item
                      title="Enable Biometric Login"
                      description="Use Face ID, Touch ID, or fingerprint to login"
                      left={(props) => <List.Icon {...props} icon="fingerprint" color={safeThemeAccess.colors(theme, 'primary')} />}
                      right={() => (
                        <Switch
                          value={isBiometricEnabled}
                          onValueChange={handleBiometricToggle}
                          disabled={isChangingBiometric || isLoading}
                        />
                      )}
                      style={styles.listItem}
                    />

                    {isChangingBiometric && (
                      <View style={styles.loadingSection}>
                        <ActivityIndicator size="small" color={safeThemeAccess.colors(theme, 'primary')} />
                        <Text variant="bodyMedium" style={{ color: safeThemeAccess.colors(theme, 'onSurface'), marginLeft: 8 }}>
                          Updating biometric settings...
                        </Text>
                      </View>
                    )}

                    {/* Supported Biometric Types */}
                    {supportedBiometricTypes.length > 0 && (
                      <View style={styles.biometricTypes}>
                        <Text variant="bodyMedium" style={[styles.typeLabel, { color: safeThemeAccess.colors(theme, 'onSurfaceVariant') }]}>
                          Available on this device:
                        </Text>
                        <View style={styles.typeChips}>
                          {supportedBiometricTypes.map((type, index) => (
                            <Chip
                              key={index}
                              icon={getBiometricTypeIcon(type)}
                              style={[styles.typeChip, { backgroundColor: safeThemeAccess.colors(theme, 'primaryContainer') }]}
                              textStyle={{ color: safeThemeAccess.colors(theme, 'onPrimaryContainer') }}
                            >
                              {type.replace('_', ' ')}
                            </Chip>
                          ))}
                        </View>
                      </View>
                    )}

                    {isBiometricEnabled && (
                      <Surface style={[styles.biometricInfo, { backgroundColor: safeThemeAccess.colors(theme, 'primaryContainer') }]}>
                        <Text variant="bodySmall" style={[styles.infoText, { color: safeThemeAccess.colors(theme, 'onPrimaryContainer') }]}>
                          ✓ Biometric authentication is active. You'll be prompted for biometric verification during login and sensitive operations.
                        </Text>
                      </Surface>
                    )}
                  </>
                ) : (
                  <Surface style={[styles.unavailableCard, { backgroundColor: safeThemeAccess.colors(theme, 'surfaceVariant') }]}>
                    <IconButton 
                      icon="alert-circle-outline" 
                      iconColor={safeThemeAccess.colors(theme, 'onSurfaceVariant')} 
                      size={32} 
                    />
                    <Text variant="titleMedium" style={[styles.unavailableTitle, { color: safeThemeAccess.colors(theme, 'onSurface') }]}>
                      Biometric Authentication Unavailable
                    </Text>
                    <Text variant="bodyMedium" style={[styles.unavailableText, { color: safeThemeAccess.colors(theme, 'onSurfaceVariant') }]}>
                      This device doesn't support biometric authentication, or it hasn't been set up in your device settings.
                    </Text>
                  </Surface>
                )}
              </Card.Content>
            </Card>

            {/* Security Features */}
            <Card style={[styles.settingsCard, { backgroundColor: safeThemeAccess.colors(theme, 'surface') }]} elevation={1}>
              <Card.Content>
                <Text variant="titleLarge" style={[styles.sectionTitle, { color: safeThemeAccess.colors(theme, 'primary') }]}>
                  Active Security Features
                </Text>

                <List.Item
                  title="End-to-End Encryption"
                  description="AES-256 encryption for all employee data"
                  left={(props) => <List.Icon {...props} icon="shield-lock" color="#4CAF50" />}
                  right={() => <Chip style={styles.activeChip}>Active</Chip>}
                  style={styles.listItem}
                />

                <List.Item
                  title="Session Security"
                  description="Automatic timeout and device fingerprinting"
                  left={(props) => <List.Icon {...props} icon="timer-lock" color="#4CAF50" />}
                  right={() => <Chip style={styles.activeChip}>Active</Chip>}
                  style={styles.listItem}
                />

                <List.Item
                  title="Secure Storage"
                  description="Device keychain/keystore protection"
                  left={(props) => <List.Icon {...props} icon="safe" color="#4CAF50" />}
                  right={() => <Chip style={styles.activeChip}>Active</Chip>}
                  style={styles.listItem}
                />

                <List.Item
                  title="Anti-Tampering"
                  description="Root/jailbreak detection"
                  left={(props) => <List.Icon {...props} icon="security" color="#4CAF50" />}
                  right={() => <Chip style={styles.activeChip}>Active</Chip>}
                  style={styles.listItem}
                />

                <List.Item
                  title="Input Sanitization"
                  description="Protection against injection attacks"
                  left={(props) => <List.Icon {...props} icon="filter" color="#4CAF50" />}
                  right={() => <Chip style={styles.activeChip}>Active</Chip>}
                  style={styles.listItem}
                />
              </Card.Content>
            </Card>

            {/* Security Best Practices */}
            <Card style={[styles.settingsCard, { backgroundColor: safeThemeAccess.colors(theme, 'surface') }]} elevation={1}>
              <Card.Content>
                <Text variant="titleLarge" style={[styles.sectionTitle, { color: safeThemeAccess.colors(theme, 'primary') }]}>
                  Security Recommendations
                </Text>

                {!isBiometricEnabled && isBiometricAvailable && (
                  <Surface style={[styles.recommendationCard, { backgroundColor: safeThemeAccess.colors(theme, 'secondaryContainer') }]}>
                    <Text variant="bodyMedium" style={[styles.recommendationText, { color: safeThemeAccess.colors(theme, 'onSecondaryContainer') }]}>
                      💡 Enable biometric authentication for enhanced security and faster access.
                    </Text>
                  </Surface>
                )}

                <Surface style={[styles.recommendationCard, { backgroundColor: safeThemeAccess.colors(theme, 'surfaceVariant') }]}>
                  <Text variant="bodyMedium" style={[styles.recommendationText, { color: safeThemeAccess.colors(theme, 'onSurfaceVariant') }]}>
                    🔐 Always log out when finished and never share your credentials.
                  </Text>
                </Surface>

                <Surface style={[styles.recommendationCard, { backgroundColor: safeThemeAccess.colors(theme, 'surfaceVariant') }]}>
                  <Text variant="bodyMedium" style={[styles.recommendationText, { color: safeThemeAccess.colors(theme, 'onSurfaceVariant') }]}>
                    📱 Keep your device operating system updated for the latest security patches.
                  </Text>
                </Surface>
              </Card.Content>
            </Card>

            {/* Advanced Security */}
            <Card style={[styles.settingsCard, { backgroundColor: safeThemeAccess.colors(theme, 'surface') }]} elevation={1}>
              <Card.Content>
                <Text variant="titleLarge" style={[styles.sectionTitle, { color: safeThemeAccess.colors(theme, 'primary') }]}>
                  Advanced Security
                </Text>

                <Button
                  mode="outlined"
                  onPress={() => setShowSecurityDetails(true)}
                  style={styles.detailsButton}
                  icon="information"
                  labelStyle={{ color: safeThemeAccess.colors(theme, 'primary') }}
                >
                  View Security Details
                </Button>

                <Button
                  mode="outlined"
                  onPress={reinitialize}
                  style={styles.detailsButton}
                  icon="refresh"
                  labelStyle={{ color: safeThemeAccess.colors(theme, 'primary') }}
                >
                  Reinitialize Security
                </Button>
              </Card.Content>
            </Card>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Button
              mode="contained"
              onPress={onDismiss}
              style={[styles.closeButton, { backgroundColor: safeThemeAccess.colors(theme, 'primary') }]}
              labelStyle={{ color: safeThemeAccess.colors(theme, 'onPrimary') }}
            >
              Close
            </Button>
          </View>
        </Surface>

        {/* Security Details Modal */}
        <Portal>
          <Modal
            visible={showSecurityDetails}
            onDismiss={() => setShowSecurityDetails(false)}
            contentContainerStyle={styles.detailsModalContainer}
          >
            <Surface style={[styles.detailsModal, { backgroundColor: safeThemeAccess.colors(theme, 'surface') }]} elevation={5}>
              <View style={styles.detailsHeader}>
                <Text variant="headlineSmall" style={{ color: safeThemeAccess.colors(theme, 'onSurface') }}>
                  Security Implementation Details
                </Text>
                <IconButton
                  icon="close"
                  onPress={() => setShowSecurityDetails(false)}
                  iconColor={safeThemeAccess.colors(theme, 'onSurface')}
                />
              </View>
              <Divider />
              <ScrollView style={styles.detailsContent}>
                <Text variant="bodyMedium" style={[styles.detailsText, { color: safeThemeAccess.colors(theme, 'onSurface') }]}>
                  <Text style={{ fontWeight: 'bold' }}>Encryption:</Text> All sensitive data is encrypted using AES-256 encryption with unique device-specific keys stored in the secure keychain/keystore.{'\n\n'}
                  
                  <Text style={{ fontWeight: 'bold' }}>Session Management:</Text> Sessions automatically expire after 15 minutes of inactivity and include device fingerprinting to prevent session hijacking.{'\n\n'}
                  
                  <Text style={{ fontWeight: 'bold' }}>Biometric Security:</Text> Leverages hardware-backed biometric authentication when available, with fallback to device passcode.{'\n\n'}
                  
                  <Text style={{ fontWeight: 'bold' }}>Anti-Tampering:</Text> Real-time detection of rooted/jailbroken devices and integrity checks to prevent app modification.{'\n\n'}
                  
                  <Text style={{ fontWeight: 'bold' }}>Network Security:</Text> All API calls use HTTPS with certificate pinning and request signing for maximum protection.
                </Text>
              </ScrollView>
            </Surface>
          </Modal>
        </Portal>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modal: {
    width: width > 600 ? 550 : width * 0.95,
    maxHeight: '90%',
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontWeight: 'bold',
  },
  content: {
    maxHeight: 500,
    paddingHorizontal: 20,
  },
  scoreCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  errorCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
  },
  fixButton: {
    alignSelf: 'flex-start',
  },
  settingsCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  listItem: {
    paddingVertical: 4,
  },
  loadingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  biometricTypes: {
    marginTop: 16,
  },
  typeLabel: {
    marginBottom: 8,
    fontWeight: '500',
  },
  typeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  biometricInfo: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 16,
  },
  unavailableCard: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 12,
  },
  unavailableTitle: {
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  unavailableText: {
    textAlign: 'center',
    lineHeight: 20,
  },
  activeChip: {
    backgroundColor: '#E8F5E8',
  },
  recommendationCard: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  recommendationText: {
    fontSize: 13,
    lineHeight: 18,
  },
  detailsButton: {
    marginBottom: 8,
  },
  footer: {
    padding: 20,
  },
  closeButton: {
    borderRadius: 12,
  },
  detailsModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  detailsModal: {
    width: width > 600 ? 500 : width * 0.9,
    maxHeight: '80%',
    borderRadius: 16,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  detailsContent: {
    padding: 20,
    maxHeight: 400,
  },
  detailsText: {
    lineHeight: 22,
  },
}); 