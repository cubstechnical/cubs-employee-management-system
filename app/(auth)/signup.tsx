import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Dimensions, Animated, Image } from 'react-native';
import { Text, TextInput, Button, Card, useTheme, Surface, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { CustomTheme } from '../../theme';

const { width, height } = Dimensions.get('window');

export default function SignupScreen() {
  const theme = useTheme() as CustomTheme;
  const { signUp, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const handleSignup = async () => {
    const { email, password, confirmPassword, fullName } = formData;

    if (!email || !password || !fullName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    try {
      await signUp(email, password, fullName);
      Alert.alert(
        'Success',
        'Account created successfully! Please check your email to verify your account.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (error) {
      Alert.alert('Signup Failed', 'Unable to create account. Please try again.');
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#DC143C', '#B71C1C', '#8B0000']}
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
              style={styles.backButton}
            />
            <Text variant="headlineSmall" style={styles.headerTitle}>
              Create Account
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
              <Image 
                source={require('../../assets/logo.png')} 
                style={styles.companyLogo}
                resizeMode="contain"
              />
            </Surface>
            <Text variant="titleLarge" style={styles.welcomeText}>
              Join CUBS Technical
            </Text>
            <Text variant="bodyMedium" style={styles.subtitleText}>
              Start managing your workforce today
            </Text>
          </Animated.View>

          {/* Signup Form */}
          <Animated.View style={[
            {
              opacity: fadeAnimation,
              transform: [{ translateY: slideAnimation }]
            }
          ]}>
            <Surface style={styles.formCard} elevation={5}>
              <View style={styles.form}>
                <TextInput
                  label="Full Name *"
                  value={formData.fullName}
                  onChangeText={(value) => updateFormData('fullName', value)}
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Icon icon="account" />}
                  theme={{ colors: { primary: '#DC143C', outline: '#DC143C' } }}
                />

                <TextInput
                  label="Email Address *"
                  value={formData.email}
                  onChangeText={(value) => updateFormData('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Icon icon="email" />}
                  theme={{ colors: { primary: '#DC143C', outline: '#DC143C' } }}
                />

                <TextInput
                  label="Password *"
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
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
                  theme={{ colors: { primary: '#DC143C', outline: '#DC143C' } }}
                />

                <TextInput
                  label="Confirm Password *"
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateFormData('confirmPassword', value)}
                  secureTextEntry={!showConfirmPassword}
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Icon icon="lock-check" />}
                  right={
                    <TextInput.Icon
                      icon={showConfirmPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    />
                  }
                  theme={{ colors: { primary: '#DC143C', outline: '#DC143C' } }}
                />

                <Button
                  mode="contained"
                  onPress={handleSignup}
                  loading={isLoading}
                  disabled={isLoading}
                  style={styles.signupButton}
                  labelStyle={styles.signupButtonText}
                  icon="account-plus"
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>

                {/* Sign In Link */}
                <View style={styles.signinContainer}>
                  <Text variant="bodyMedium" style={styles.signinText}>
                    Already have an account?{' '}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 40,
  },
  backButton: {
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
    gap: 16,
  },
  input: {
    backgroundColor: 'transparent',
  },
  signupButton: {
    backgroundColor: '#DC143C',
    borderRadius: 12,
    paddingVertical: 8,
    marginTop: 8,
  },
  signupButtonText: {
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
}); 