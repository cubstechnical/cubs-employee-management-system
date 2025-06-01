import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Dimensions, Animated, Image, Platform } from 'react-native';
import { Text, TextInput, Button, Card, useTheme, Surface, IconButton, Chip, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { CustomTheme } from '../../theme';

const { width, height } = Dimensions.get('window');
const logoImage = require('../../assets/logo.png');

export default function LoginScreen() {
  const theme = useTheme() as CustomTheme;
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Enhanced animations
  const [fadeAnimation] = useState(new Animated.Value(0));
  const [slideAnimation] = useState(new Animated.Value(30));
  const [logoAnimation] = useState(new Animated.Value(0));
  const [cardAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    // Staggered entrance animations
    Animated.sequence([
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(slideAnimation, {
          toValue: 0,
          tension: 40,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(logoAnimation, {
          toValue: 1,
          tension: 30,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.spring(cardAnimation, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      console.log('🔐 [LOGIN] Attempting login for:', email);
      await signIn(email, password);
      console.log('✅ [LOGIN] Login successful, redirecting to dashboard');
      router.replace('/(admin)/dashboard');
    } catch (error) {
      console.error('❌ [LOGIN] Login failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      
      // Provide user-friendly error messages
      let userMessage = 'Invalid credentials. Please try again.';
      
      if (errorMessage.includes('Invalid login credentials')) {
        userMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (errorMessage.includes('Email not confirmed')) {
        userMessage = 'Please check your email and confirm your account before signing in.';
      } else if (errorMessage.includes('Too many requests')) {
        userMessage = 'Too many login attempts. Please wait a moment and try again.';
      } else if (errorMessage.includes('Network')) {
        userMessage = 'Network error. Please check your connection and try again.';
      }
      
      Alert.alert('Login Failed', userMessage);
    }
  };

  return (
    <View style={styles.container}>
      {/* Enhanced Background Gradient */}
      <LinearGradient
        colors={['#DC143C', '#B71C1C', '#8B0000']} // Ferrari Red gradient - back to original
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Animated Background Elements */}
        <Animated.View style={[
          styles.backgroundCircle1,
          {
            opacity: fadeAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.1],
            }),
            transform: [{
              scale: logoAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1.2],
              })
            }]
          }
        ]} />
        <Animated.View style={[
          styles.backgroundCircle2,
          {
            opacity: fadeAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.05],
            }),
            transform: [{
              scale: cardAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [1.2, 0.9],
              })
            }]
          }
        ]} />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Company Logo and Branding */}
          <Animated.View style={[
            styles.logoSection,
            {
              opacity: logoAnimation,
              transform: [{
                translateY: logoAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                })
              }, {
                scale: logoAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                })
              }]
            }
          ]}>
            <Surface style={styles.logoContainer} elevation={5}>
              <Image 
                source={logoImage} 
                style={styles.companyLogo}
                resizeMode="contain"
              />
            </Surface>
            <Text variant="displaySmall" style={styles.companyName}>
              CUBS Technical
            </Text>
            <Text variant="titleLarge" style={styles.tagline}>
              Employee Management System
            </Text>
          </Animated.View>

          {/* Enhanced Login Card */}
          <Animated.View style={[
            {
              opacity: cardAnimation,
              transform: [
                {
                  translateY: cardAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  })
                },
                {
                  scale: cardAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1],
                  })
                }
              ]
            }
          ]}>
            <Surface style={styles.loginCard} elevation={5}>
              <View style={styles.cardHeader}>
                <Text variant="headlineMedium" style={styles.welcomeTitle}>
                  Welcome Back! 👋
                </Text>
                <Text variant="bodyLarge" style={styles.welcomeSubtitle}>
                  Sign in to access your dashboard
                </Text>
              </View>

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
                      primary: '#DC143C', // Ferrari Red
                      outline: '#DC143C',
                    }
                  }}
                />

                <TextInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                  theme={{
                    colors: {
                      primary: '#DC143C', // Ferrari Red
                      outline: '#DC143C',
                    }
                  }}
                />

                <Button
                  mode="contained"
                  onPress={handleLogin}
                  loading={isLoading}
                  disabled={isLoading}
                  style={styles.loginButton}
                  labelStyle={styles.loginButtonText}
                  icon="login"
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>

                {/* Additional Auth Options */}
                <View style={styles.authOptions}>
                  <Button
                    mode="text"
                    onPress={() => router.push('/(auth)/forgot-password')}
                    style={styles.textButton}
                    labelStyle={[styles.textButtonLabel, { color: theme.colors.primary }]}
                  >
                    Forgot Password?
                  </Button>

                  {/* Divider */}
                  <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text variant="bodySmall" style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  {/* Google Sign In */}
                  <Button
                    mode="outlined"
                    onPress={() => Alert.alert('Google Sign In', 'Google authentication will be implemented')}
                    style={[styles.googleButton, { borderColor: theme.colors.primary }]}
                    labelStyle={[styles.googleButtonText, { color: theme.colors.primary }]}
                    icon="google"
                    contentStyle={styles.googleButtonContent}
                  >
                    Continue with Google
                  </Button>

                  {/* Sign Up Link */}
                  <View style={styles.signupContainer}>
                    <Text variant="bodyMedium" style={styles.signupText}>
                      Don't have an account?{' '}
                    </Text>
                    <Button
                      mode="text"
                      onPress={() => router.push('/(auth)/signup')}
                      style={styles.signupButton}
                      labelStyle={[styles.signupButtonLabel, { color: theme.colors.primary }]}
                      compact
                    >
                      Sign Up
                    </Button>
                  </View>
                </View>
              </View>
            </Surface>
          </Animated.View>

          {/* Animated Footer */}
          <Animated.View style={[
            styles.footer,
            {
              opacity: fadeAnimation,
              transform: [{
                translateY: slideAnimation
              }]
            }
          ]}>
            <Text variant="bodySmall" style={styles.footerText}>
              © 2024 CUBS Technical Contracting. All rights reserved.
            </Text>
            <Text variant="bodySmall" style={styles.footerSubtext}>
              Powered by advanced cloud technology
            </Text>
          </Animated.View>
        </ScrollView>

        {/* Loading Overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <Surface style={styles.loadingContainer} elevation={5}>
              <ActivityIndicator size="large" color="#DC143C" />
              <Text variant="bodyMedium" style={styles.loadingText}>
                Authenticating...
              </Text>
            </Surface>
          </View>
        )}
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
    position: 'relative',
  },
  backgroundCircle1: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    backgroundColor: 'white',
    top: -width * 0.7,
    right: -width * 0.5,
  },
  backgroundCircle2: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: 'white',
    bottom: -width * 0.6,
    left: -width * 0.4,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    minHeight: height,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
  },
  companyLogo: {
    width: 80,
    height: 80,
  },
  companyName: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    ...Platform.select({
      ios: {
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
      },
      android: {
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
      },
      web: {
        textShadow: '0px 2px 4px rgba(0,0,0,0.3)',
      }
    })
  },
  tagline: {
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  loginCard: {
    borderRadius: 24,
    padding: 32,
    backgroundColor: 'rgba(255,255,255,0.98)',
    marginHorizontal: width < 768 ? 0 : 40,
    ...Platform.select({
      ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px 8px 20px rgba(0,0,0,0.15)',
      }
    })
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeTitle: {
    color: '#1a1a1a',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    color: '#666',
    textAlign: 'center',
    opacity: 0.8,
  },
  form: {
    gap: 20,
  },
  input: {
    backgroundColor: 'transparent',
  },
  loginButton: {
    backgroundColor: '#C53030', // Updated professional red
    borderRadius: 16,
    paddingVertical: 8,
    marginTop: 8,
    elevation: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#C53030',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
      },
      android: {
    elevation: 6,
      },
      web: {
        boxShadow: '0px 4px 8px rgba(197,48,48,0.3)',
      }
    })
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  securityBadge: {
    borderRadius: 16,
    padding: 20,
    backgroundColor: 'rgba(248,250,252,0.95)',
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(220,20,60,0.1)',
  },
  securityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  securityIcon: {
    backgroundColor: 'rgba(220,20,60,0.1)',
    borderRadius: 20,
  },
  securityText: {
    flex: 1,
    marginLeft: 12,
  },
  securityTitle: {
    color: '#1a1a1a',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  securityDescription: {
    color: '#666',
    lineHeight: 16,
  },
  securityFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  securityFeature: {
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    color: '#666',
    fontSize: 10,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    paddingTop: 20,
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
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
    color: '#DC143C',
    fontWeight: '500',
  },
  authOptions: {
    marginTop: 24,
    gap: 16,
  },
  textButton: {
    alignSelf: 'center',
  },
  textButtonLabel: {
    fontWeight: '600',
    fontSize: 14,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  dividerText: {
    color: 'rgba(0,0,0,0.5)',
    marginHorizontal: 16,
    fontSize: 12,
  },
  googleButton: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 6,
  },
  googleButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  googleButtonContent: {
    paddingVertical: 4,
  },
  signupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  signupText: {
    color: '#666',
    fontSize: 14,
  },
  signupButton: {
    padding: 0,
    minWidth: 0,
  },
  signupButtonLabel: {
    fontWeight: 'bold',
    fontSize: 14,
  },
}); 
