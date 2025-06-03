import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Dimensions, Animated, Image } from 'react-native';
import { Text, TextInput, Button, useTheme, Surface, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { CustomTheme } from '../../theme';
import { DESIGN_SYSTEM } from '../../theme/designSystem';

const { width, height } = Dimensions.get('window');

// FIXED: Enhanced logo import with proper error handling
const getLogo = () => {
  try {
    return require('../../assets/logo.png');
  } catch (error) {
    console.warn('Logo not found at path ../../assets/logo.png, using fallback');
    return null;
  }
};

export default function ForgotPasswordScreen() {
  const theme = useTheme() as CustomTheme;
  const { resetPassword, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const logoImage = getLogo();

  // Animations
  const [fadeAnimation] = useState(new Animated.Value(0));
  const [slideAnimation] = useState(new Animated.Value(30));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      await resetPassword(email);
      setEmailSent(true);
    } catch (error) {
      Alert.alert('Error', 'Unable to send reset email. Please try again.');
    }
  };

  if (emailSent) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[DESIGN_SYSTEM.colors.primary[500], DESIGN_SYSTEM.colors.primary[600], DESIGN_SYSTEM.colors.primary[700]]}
          style={styles.background}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <ScrollView contentContainerStyle={styles.content}>
            <Animated.View style={[
              styles.successContainer,
              { opacity: fadeAnimation }
            ]}>
              <Surface style={styles.successCard} elevation={5}>
                <View style={styles.iconContainer}>
                  <IconButton
                    icon="email-check"
                    size={64}
                    iconColor="#22C55E"
                    style={styles.successIcon}
                  />
                </View>
                
                <Text variant="headlineSmall" style={styles.successTitle}>
                  Check Your Email! 📧
                </Text>
                
                <Text variant="bodyLarge" style={styles.successMessage}>
                  We've sent password reset instructions to:
                </Text>
                
                <Text variant="titleMedium" style={styles.emailText}>
                  {email}
                </Text>
                
                <Text variant="bodyMedium" style={styles.instructionText}>
                  Click the link in the email to reset your password. 
                  The link will expire in 15 minutes for security.
                </Text>

                <View style={styles.actionButtons}>
                  <Button
                    mode="contained"
                    onPress={() => router.push('/(auth)/login')}
                    style={styles.backButton}
                    labelStyle={styles.backButtonText}
                    icon="arrow-left"
                  >
                    Back to Sign In
                  </Button>

                  <Button
                    mode="outlined"
                    onPress={() => setEmailSent(false)}
                    style={styles.resendButton}
                    labelStyle={styles.resendButtonText}
                    icon="email-send"
                  >
                    Send Another Email
                  </Button>
                </View>
              </Surface>
            </Animated.View>
          </ScrollView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[DESIGN_SYSTEM.colors.primary[500], DESIGN_SYSTEM.colors.primary[600], DESIGN_SYSTEM.colors.primary[700]]}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header with back button */}
          <Animated.View style={[
            styles.header,
            {
              opacity: fadeAnimation,
              transform: [{ translateY: slideAnimation }]
            }
          ]}>
            <IconButton
              icon="arrow-left"
              iconColor="white"
              size={24}
              onPress={() => router.back()}
              style={styles.backButtonHeader}
            />
            <Text variant="headlineSmall" style={styles.headerTitle}>
              Reset Password
            </Text>
          </Animated.View>

          {/* Logo Section */}
          <Animated.View style={[
            styles.logoSection,
            {
              opacity: fadeAnimation,
              transform: [{ translateY: slideAnimation }]
            }
          ]}>
            <Surface style={styles.logoContainer} elevation={5}>
              {logoImage ? (
                <Image 
                  source={logoImage} 
                  style={styles.companyLogo}
                  resizeMode="contain"
                />
              ) : (
                <View style={[styles.companyLogo, styles.logoFallback]}>
                  <IconButton
                    icon="domain"
                    size={48}
                    iconColor={DESIGN_SYSTEM.colors.primary[500]}
                  />
                  <Text variant="titleMedium" style={styles.fallbackText}>
                    CUBS
                  </Text>
                </View>
              )}
            </Surface>
            <Text variant="titleLarge" style={styles.welcomeText}>
              Forgot Your Password? 🔐
            </Text>
            <Text variant="bodyMedium" style={styles.subtitleText}>
              Enter your email to receive reset instructions
            </Text>
          </Animated.View>

          {/* Reset Form */}
          <Animated.View style={[
            {
              opacity: fadeAnimation,
              transform: [{ translateY: slideAnimation }]
            }
          ]}>
            <Surface style={styles.formCard} elevation={5}>
              <View style={styles.form}>
                <TextInput
                  label="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Icon icon="email" />}
                  theme={{ 
                    colors: { 
                      primary: DESIGN_SYSTEM.colors.primary[500], 
                      outline: DESIGN_SYSTEM.colors.primary[500] 
                    } 
                  }}
                />

                <Button
                  mode="contained"
                  onPress={handleResetPassword}
                  loading={isLoading}
                  disabled={isLoading || !email}
                  style={styles.resetButton}
                  labelStyle={styles.resetButtonText}
                  icon="email-send"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Email'}
                </Button>

                {/* Back to Sign In */}
                <View style={styles.signinContainer}>
                  <Text variant="bodyMedium" style={styles.signinText}>
                    Remember your password?{' '}
                  </Text>
                  <Button
                    mode="text"
                    onPress={() => router.push('/(auth)/login')}
                    style={styles.signinButton}
                    labelStyle={styles.signinButtonLabel}
                    compact
                  >
                    Sign In
                  </Button>
                </View>
              </View>
            </Surface>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    minHeight: height,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 40,
  },
  backButtonHeader: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 16,
  },
  headerTitle: {
    color: 'white',
    fontWeight: 'bold',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
  },
  companyLogo: {
    width: 50,
    height: 50,
  },
  welcomeText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  formCard: {
    borderRadius: 20,
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.98)',
    marginBottom: 24,
  },
  form: {
    gap: 20,
  },
  input: {
    backgroundColor: 'transparent',
  },
  resetButton: {
    backgroundColor: '#DC143C',
    borderRadius: 12,
    paddingVertical: 8,
    marginTop: 8,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  signinText: {
    color: '#666',
  },
  signinButton: {
    padding: 0,
    minWidth: 0,
  },
  signinButtonLabel: {
    color: '#DC143C',
    fontWeight: 'bold',
  },
  // Success screen styles
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCard: {
    borderRadius: 24,
    padding: 32,
    backgroundColor: 'rgba(255,255,255,0.98)',
    width: '100%',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  successIcon: {
    backgroundColor: 'rgba(34,197,94,0.1)',
  },
  successTitle: {
    color: '#1a1a1a',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  successMessage: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  emailText: {
    color: '#DC143C',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  instructionText: {
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  actionButtons: {
    width: '100%',
    gap: 12,
  },
  backButton: {
    backgroundColor: '#DC143C',
    borderRadius: 12,
    paddingVertical: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  resendButton: {
    borderColor: '#DC143C',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 8,
  },
  resendButtonText: {
    color: '#DC143C',
    fontWeight: 'bold',
  },
  logoFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    color: '#DC143C',
    fontWeight: 'bold',
  },
}); 