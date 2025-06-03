import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Animated, Platform, Alert, Image } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  useTheme,
  Surface,
  IconButton,
  Divider,
  Card,
  Snackbar,
  ActivityIndicator,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { CustomTheme } from '../../theme';
import { DESIGN_SYSTEM } from '../../theme/designSystem';

const { width, height } = Dimensions.get('window');

// ENHANCED: Logo import with robust fallback
const getLogo = () => {
  try {
    return require('../../assets/logo.png');
  } catch (error) {
    console.warn('Logo image not found in login, using fallback');
    return null;
  }
};

// ENHANCED: Background image import
const getBackgroundImage = () => {
  try {
    return require('../../assets/bg.jpg');
  } catch (error) {
    console.warn('Background image not found, using fallback gradient');
    return null;
  }
};

export default function LoginScreen() {
  const theme = useTheme() as CustomTheme;
  const { login, isLoading, error } = useAuth();
  const logoImage = getLogo();
  const backgroundImage = getBackgroundImage();
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // UI State
  const [snackbar, setSnackbar] = useState('');
  const [formErrors, setFormErrors] = useState<{email?: string, password?: string}>({});
  
  // Animations
  const [fadeAnimation] = useState(new Animated.Value(0));
  const [slideAnimation] = useState(new Animated.Value(30));

  // ENHANCED: Responsive breakpoints
  const isMobile = width <= DESIGN_SYSTEM.breakpoints.tablet;

  useEffect(() => {
    // Enhanced entrance animation
    Animated.parallel([
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: DESIGN_SYSTEM.animation.duration.slow,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnimation, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ENHANCED: Form validation with accessibility
  const validateForm = () => {
    const errors: {email?: string, password?: string} = {};
    
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!password.trim()) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ENHANCED: Login handler with better error handling
  const handleLogin = async () => {
    if (!validateForm()) return;
    
    try {
      await login(email.trim(), password);
      setSnackbar('Login successful! Redirecting...');
      
      // Smooth transition to dashboard
      setTimeout(() => {
        router.replace('/(admin)/dashboard');
      }, 1000);
      
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error?.message || 'Login failed. Please check your credentials.';
      setSnackbar(errorMessage);
      
      // Shake animation for error feedback
      Animated.sequence([
        Animated.timing(slideAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(slideAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(slideAnimation, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();
    }
  };

  // ENHANCED: Navigation helpers
  const navigateToForgotPassword = () => {
    router.push('/(auth)/forgot-password');
  };

  return (
    <View style={styles.container}>
      {backgroundImage ? (
        <Image 
          source={backgroundImage}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={[
            DESIGN_SYSTEM.colors.primary[500],
            DESIGN_SYSTEM.colors.primary[600],
            DESIGN_SYSTEM.colors.primary[700]
          ]}
          style={styles.background}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}
      
      {/* Dark overlay for better text readability */}
      <View style={styles.overlay} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[
          styles.centerContainer,
          {
            opacity: fadeAnimation,
            transform: [{ translateY: slideAnimation }]
          }
        ]}>
          {/* ENTERPRISE: Logo Section */}
          <Surface style={styles.logoContainer} elevation={5}>
            {logoImage ? (
              <Image 
                source={logoImage} 
                style={styles.companyLogo}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.logoFallback}>
                <IconButton
                  icon="domain"
                  size={48}
                  iconColor={DESIGN_SYSTEM.colors.primary[500]}
                />
                <Text variant="headlineSmall" style={styles.fallbackText}>
                  CUBS
                </Text>
              </View>
            )}
          </Surface>
          
          <Text variant="headlineLarge" style={styles.welcomeTitle}>
            Welcome Back
          </Text>
          <Text variant="titleMedium" style={styles.enterpriseTagline}>
            Enterprise-level Security
          </Text>

          {/* ENTERPRISE: Main Login Card - Perfectly Centered */}
          <Card style={styles.loginCard} elevation={5}>
            <Card.Content style={styles.cardContent}>
              <Text variant="titleLarge" style={styles.loginTitle}>
                Sign In to Your Account
              </Text>
              
              {/* FIXED: Enhanced Email Input with Perfect Styling */}
              <View style={styles.inputGroup}>
                <TextInput
                  label="Email Address"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (formErrors.email) {
                      setFormErrors(prev => ({...prev, email: undefined}));
                    }
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Icon icon="email" />}
                  error={!!formErrors.email}
                  theme={{
                    colors: {
                      primary: DESIGN_SYSTEM.colors.primary[500],
                      outline: formErrors.email ? DESIGN_SYSTEM.colors.error.main : DESIGN_SYSTEM.colors.neutral[300],
                      onSurfaceVariant: DESIGN_SYSTEM.colors.neutral[800],
                      onSurface: DESIGN_SYSTEM.colors.neutral[900],
                      surface: DESIGN_SYSTEM.colors.neutral[0],
                      background: DESIGN_SYSTEM.colors.neutral[0],
                    }
                  }}
                  textColor={DESIGN_SYSTEM.colors.neutral[900]}
                  placeholderTextColor={DESIGN_SYSTEM.colors.neutral[500]}
                  contentStyle={{
                    color: DESIGN_SYSTEM.colors.neutral[900],
                  }}
                />
                {formErrors.email && (
                  <Text variant="bodySmall" style={styles.errorText}>
                    {formErrors.email}
                  </Text>
                )}
              </View>

              {/* FIXED: Enhanced Password Input with Perfect Styling */}
              <View style={styles.inputGroup}>
                <TextInput
                  label="Password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (formErrors.password) {
                      setFormErrors(prev => ({...prev, password: undefined}));
                    }
                  }}
                  secureTextEntry={!showPassword}
                  autoComplete="current-password"
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon 
                      icon={showPassword ? "eye-off" : "eye"} 
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                  error={!!formErrors.password}
                  theme={{
                    colors: {
                      primary: DESIGN_SYSTEM.colors.primary[500],
                      outline: formErrors.password ? DESIGN_SYSTEM.colors.error.main : DESIGN_SYSTEM.colors.neutral[300],
                      onSurfaceVariant: DESIGN_SYSTEM.colors.neutral[800],
                      onSurface: DESIGN_SYSTEM.colors.neutral[900],
                      surface: DESIGN_SYSTEM.colors.neutral[0],
                      background: DESIGN_SYSTEM.colors.neutral[0],
                    }
                  }}
                  textColor={DESIGN_SYSTEM.colors.neutral[900]}
                  placeholderTextColor={DESIGN_SYSTEM.colors.neutral[500]}
                  contentStyle={{
                    color: DESIGN_SYSTEM.colors.neutral[900],
                  }}
                />
                {formErrors.password && (
                  <Text variant="bodySmall" style={styles.errorText}>
                    {formErrors.password}
                  </Text>
                )}
              </View>

              {/* ENTERPRISE: Login Actions */}
              <View style={styles.actionSection}>
                <Button
                  mode="contained"
                  onPress={handleLogin}
                  loading={isLoading}
                  disabled={isLoading}
                  style={styles.loginButton}
                  contentStyle={styles.loginButtonContent}
                  labelStyle={styles.loginButtonLabel}
                  icon="login"
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
                 
                 {/* ENTERPRISE: Forgot Password Link */}
                 <View style={styles.navigationSection}>
                   <Button
                     mode="text"
                     onPress={navigateToForgotPassword}
                     style={styles.linkButton}
                     labelStyle={styles.linkButtonLabel}
                     icon="help-circle"
                   >
                     Forgot Password?
                   </Button>
                 </View>
                </View>
            </Card.Content>
          </Card>

          {/* ENTERPRISE: Security Features Section */}
          <Surface style={styles.securitySection} elevation={3}>
            <Text variant="titleMedium" style={styles.securityTitle}>
              🔒 Enterprise Security Features
            </Text>
            
            <View style={styles.securityFeatures}>
              <View style={styles.securityFeature}>
                <IconButton icon="shield-check" size={20} iconColor={DESIGN_SYSTEM.colors.success.main} />
                <Text variant="bodyMedium" style={styles.securityText}>
                  AES-256 Data Encryption
                </Text>
              </View>
              
              <View style={styles.securityFeature}>
                <IconButton icon="key" size={20} iconColor={DESIGN_SYSTEM.colors.info.main} />
                <Text variant="bodyMedium" style={styles.securityText}>
                  JWT-based Authentication
                </Text>
              </View>
              
              <View style={styles.securityFeature}>
                <IconButton icon="email-outline" size={20} iconColor={DESIGN_SYSTEM.colors.primary[500]} />
                <Text variant="bodyMedium" style={styles.securityText}>
                  Secure Email Verification
                </Text>
              </View>
            </View>
          </Surface>

          {/* Footer Branding */}
          <View style={styles.footer}>
            <Text variant="bodySmall" style={styles.footerText}>
              © 2024 CUBS Technical • Employee Management System
            </Text>
            <Text variant="bodySmall" style={styles.footerSubtext}>
              Enterprise • Secure • Professional
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* ENHANCED: Success/Error Feedback */}
      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar('')}
        duration={4000}
        style={styles.snackbar}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbar(''),
        }}
      >
        {snackbar}
      </Snackbar>
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
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    top: 0,
    left: 0,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DESIGN_SYSTEM.spacing[6],
    minHeight: height,
  },
  centerContainer: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  
  // ENTERPRISE: Logo Section
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DESIGN_SYSTEM.spacing[4],
    padding: DESIGN_SYSTEM.spacing[3],
  },
  companyLogo: {
    width: 70,
    height: 70,
  },
  logoFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    color: DESIGN_SYSTEM.colors.primary[500],
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4,
  },
  
  // ENTERPRISE: Header Section
  welcomeTitle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: DESIGN_SYSTEM.spacing[2],
  },
  enterpriseTagline: {
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: DESIGN_SYSTEM.spacing[8],
    fontSize: 18,
  },
  
  // ENTERPRISE: Main Login Card - Perfectly Centered
  loginCard: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.98)',
    marginBottom: DESIGN_SYSTEM.spacing[6],
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px 8px 32px rgba(0,0,0,0.15)',
      }
    })
  },
  cardContent: {
    padding: DESIGN_SYSTEM.spacing[8],
  },
  loginTitle: {
    color: '#1a1a1a',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: DESIGN_SYSTEM.spacing[6],
  },
  
  // FIXED: Input Styling
  inputGroup: {
    marginBottom: DESIGN_SYSTEM.spacing[4],
  },
  input: {
    backgroundColor: 'white',
    fontSize: 16,
    lineHeight: 20,
  },
  errorText: {
    color: DESIGN_SYSTEM.colors.error.main,
    fontSize: 12,
    marginTop: 4,
    paddingLeft: 12,
  },
  
  // ENTERPRISE: Action Section
  actionSection: {
    marginTop: DESIGN_SYSTEM.spacing[4],
    gap: DESIGN_SYSTEM.spacing[4],
  },
  loginButton: {
    backgroundColor: DESIGN_SYSTEM.colors.primary[500],
    borderRadius: 16,
    paddingVertical: 8,
    elevation: 6,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  loginButtonLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  navigationSection: {
    alignItems: 'center',
    marginTop: DESIGN_SYSTEM.spacing[4],
  },
  linkButton: {
    alignSelf: 'center',
  },
  linkButtonLabel: {
    fontWeight: '600',
    fontSize: 14,
    color: DESIGN_SYSTEM.colors.primary[500],
  },
  
  // ENTERPRISE: Security Section
  securitySection: {
    width: '100%',
    borderRadius: 20,
    padding: DESIGN_SYSTEM.spacing[6],
    backgroundColor: 'rgba(255,255,255,0.95)',
    marginBottom: DESIGN_SYSTEM.spacing[6],
  },
  securityTitle: {
    color: '#1a1a1a',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: DESIGN_SYSTEM.spacing[4],
  },
  securityFeatures: {
    gap: DESIGN_SYSTEM.spacing[3],
  },
  securityFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DESIGN_SYSTEM.spacing[2],
  },
  securityText: {
    color: DESIGN_SYSTEM.colors.neutral[700],
    fontWeight: '500',
    flex: 1,
    marginLeft: DESIGN_SYSTEM.spacing[2],
  },
  
  // Footer
  footer: {
    alignItems: 'center',
    marginTop: DESIGN_SYSTEM.spacing[4],
  },
  footerText: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 4,
  },
  footerSubtext: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  
  // Snackbar
  snackbar: {
    backgroundColor: DESIGN_SYSTEM.colors.primary[500],
  },
}); 
