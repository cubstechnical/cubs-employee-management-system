import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Dimensions } from 'react-native';
import {
  Text,
  Card,
  TextInput,
  Button,
  useTheme,
  Surface,
  ProgressBar,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { supabase } from '../../services/supabase';
import { CustomTheme } from '../../theme';
import { safeThemeAccess } from '../../utils/errorPrevention';
import { useSecureAuth } from '../../hooks/useSecureAuth';
import { Session } from '@supabase/supabase-js';

const { width } = Dimensions.get('window');

const resetPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
});

export default function ResetPasswordScreen() {
  const theme = useTheme() as CustomTheme;
  const { checkPasswordStrength } = useSecureAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, errors: [] as string[] });
  const [session, setSession] = useState<Session | null>(null);

  // Get session from URL params or check current session
  const params = useLocalSearchParams();

  useEffect(() => {
    // Check if user has a valid session (they just clicked reset link)
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session error:', error);
        Alert.alert(
          'Invalid Reset Link',
          'Your password reset link is invalid or has expired. Please request a new one.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
        );
        return;
      }

      if (!session) {
        Alert.alert(
          'Session Required',
          'Please click the password reset link in your email to access this page.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
        );
        return;
      }

      setSession(session);
    } catch (error) {
      console.error('Error checking session:', error);
      router.replace('/(auth)/login');
    }
  };

  const handlePasswordChange = async (password: string) => {
    if (password.length > 0) {
      const strength = await checkPasswordStrength(password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength({ score: 0, errors: [] });
    }
  };

  const handleResetPassword = async (values: { password: string; confirmPassword: string }) => {
    try {
      setIsLoading(true);

      // Validate password strength
      const strength = await checkPasswordStrength(values.password);
      if (strength.score < 70) {
        Alert.alert(
          'Weak Password',
          'Please choose a stronger password. Your password should be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and special characters.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password: values.password
      });

      if (error) {
        throw error;
      }

      // Sign out to force fresh login with new password
      await supabase.auth.signOut();

      Alert.alert(
        'Password Updated Successfully',
        'Your password has been updated. Please sign in with your new password.',
        [
          {
            text: 'Sign In',
            onPress: () => router.replace('/(auth)/login')
          }
        ]
      );
    } catch (error) {
      console.error('Reset password error:', error);
      Alert.alert(
        'Error',
        (error as Error)?.message || 'Failed to update password. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score < 40) return theme.colors.error;
    if (passwordStrength.score < 70) return safeThemeAccess.colors(theme, 'warning') || '#FF9800';
    return theme.colors.primary;
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength.score < 40) return 'Weak';
    if (passwordStrength.score < 70) return 'Medium';
    return 'Strong';
  };

  if (!session) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: safeThemeAccess.colors(theme, 'background') }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: safeThemeAccess.colors(theme, 'onBackground') }]}>
            Verifying reset link...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: safeThemeAccess.colors(theme, 'background') }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text variant="headlineMedium" style={[styles.title, { color: safeThemeAccess.colors(theme, 'onBackground') }]}>
              Reset Your Password
            </Text>
            <Text variant="bodyMedium" style={[styles.subtitle, { color: safeThemeAccess.colors(theme, 'onSurfaceVariant') }]}>
              Enter your new password below. Make sure it's strong and secure.
            </Text>
          </View>

          {/* Reset Form */}
          <Card style={[styles.resetCard, { backgroundColor: safeThemeAccess.colors(theme, 'surface') }]} elevation={4}>
            <Card.Content style={styles.cardContent}>
              <Formik
                initialValues={{ password: '', confirmPassword: '' }}
                validationSchema={resetPasswordSchema}
                onSubmit={handleResetPassword}
              >
                {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
                  <View style={styles.form}>
                    <TextInput
                      label="New Password"
                      value={values.password}
                      onChangeText={(text) => {
                        handleChange('password')(text);
                        handlePasswordChange(text);
                      }}
                      onBlur={handleBlur('password')}
                      error={touched.password && !!errors.password}
                      secureTextEntry={!showPassword}
                      mode="outlined"
                      left={<TextInput.Icon icon="lock" />}
                      right={
                        <TextInput.Icon
                          icon={showPassword ? 'eye-off' : 'eye'}
                          onPress={() => setShowPassword(!showPassword)}
                        />
                      }
                      style={styles.input}
                      theme={{ colors: { primary: safeThemeAccess.colors(theme, 'primary') } }}
                      disabled={isLoading}
                    />
                    {touched.password && errors.password && (
                      <Text style={[styles.errorText, { color: safeThemeAccess.colors(theme, 'error') }]}>
                        {errors.password}
                      </Text>
                    )}

                    {/* Password Strength Indicator */}
                    {values.password.length > 0 && (
                      <View style={styles.passwordStrength}>
                        <View style={styles.strengthHeader}>
                          <Text variant="bodySmall" style={{ color: safeThemeAccess.colors(theme, 'onSurfaceVariant') }}>
                            Password Strength: {getPasswordStrengthText()}
                          </Text>
                          <Text variant="bodySmall" style={{ color: getPasswordStrengthColor() }}>
                            {passwordStrength.score}%
                          </Text>
                        </View>
                        <ProgressBar
                          progress={passwordStrength.score / 100}
                          color={getPasswordStrengthColor()}
                          style={styles.strengthBar}
                        />
                        {passwordStrength.errors.length > 0 && (
                          <View style={styles.strengthErrors}>
                            {passwordStrength.errors.slice(0, 2).map((error, index) => (
                              <Text 
                                key={index} 
                                variant="bodySmall" 
                                style={[styles.strengthError, { color: safeThemeAccess.colors(theme, 'error') }]}
                              >
                                • {error}
                              </Text>
                            ))}
                          </View>
                        )}
                      </View>
                    )}

                    <TextInput
                      label="Confirm New Password"
                      value={values.confirmPassword}
                      onChangeText={handleChange('confirmPassword')}
                      onBlur={handleBlur('confirmPassword')}
                      error={touched.confirmPassword && !!errors.confirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      mode="outlined"
                      left={<TextInput.Icon icon="lock-check" />}
                      right={
                        <TextInput.Icon
                          icon={showConfirmPassword ? 'eye-off' : 'eye'}
                          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        />
                      }
                      style={styles.input}
                      theme={{ colors: { primary: safeThemeAccess.colors(theme, 'primary') } }}
                      disabled={isLoading}
                    />
                    {touched.confirmPassword && errors.confirmPassword && (
                      <Text style={[styles.errorText, { color: safeThemeAccess.colors(theme, 'error') }]}>
                        {errors.confirmPassword}
                      </Text>
                    )}

                    <Button
                      mode="contained"
                      onPress={() => handleSubmit()}
                      loading={isSubmitting || isLoading}
                      disabled={isSubmitting || isLoading || passwordStrength.score < 70}
                      style={[styles.resetButton, { backgroundColor: safeThemeAccess.colors(theme, 'primary') }]}
                      labelStyle={{ color: safeThemeAccess.colors(theme, 'onPrimary') }}
                      icon="check-circle"
                    >
                      {isSubmitting || isLoading ? 'Updating Password...' : 'Update Password'}
                    </Button>

                    <Button
                      mode="text"
                      onPress={() => router.replace('/(auth)/login')}
                      style={styles.backButton}
                      labelStyle={{ color: safeThemeAccess.colors(theme, 'primary') }}
                      icon="arrow-left"
                      disabled={isLoading}
                    >
                      Back to Login
                    </Button>
                  </View>
                )}
              </Formik>
            </Card.Content>
          </Card>

          {/* Security Notice */}
          <Surface style={[styles.securityNotice, { backgroundColor: safeThemeAccess.colors(theme, 'primaryContainer') }]} elevation={1}>
            <Text variant="bodySmall" style={[styles.securityText, { color: safeThemeAccess.colors(theme, 'onPrimaryContainer') }]}>
              🔒 For your security, you'll be signed out after updating your password and will need to sign in again.
            </Text>
          </Surface>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  resetCard: {
    borderRadius: 16,
    marginBottom: 24,
  },
  cardContent: {
    padding: 24,
  },
  form: {
    gap: 16,
  },
  input: {
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 12,
  },
  passwordStrength: {
    marginTop: 8,
    marginBottom: 8,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  strengthBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  strengthErrors: {
    gap: 4,
  },
  strengthError: {
    fontSize: 11,
    marginLeft: 8,
  },
  resetButton: {
    borderRadius: 12,
    paddingVertical: 4,
    marginTop: 8,
  },
  backButton: {
    marginTop: 8,
  },
  securityNotice: {
    padding: 16,
    borderRadius: 12,
  },
  securityText: {
    textAlign: 'center',
    lineHeight: 20,
  },
}); 