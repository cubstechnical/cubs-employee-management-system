import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Card,
  TextInput,
  Button,
  useTheme,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../hooks/useAuth';
import { CustomTheme } from '../../theme';
import { safeThemeAccess } from '../../utils/errorPrevention';

const registerSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .required('Name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), undefined], 'Passwords must match')
    .required('Please confirm your password'),
  role: Yup.string()
    .oneOf(['admin', 'employee'], 'Please select a valid role')
    .required('Role is required'),
});

export default function RegisterScreen() {
  const theme = useTheme() as CustomTheme;
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async (values: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: string;
  }) => {
    try {
      setIsLoading(true);
      
      await register(values.email, values.password, values.name, values.role as 'admin' | 'employee');
      
      Alert.alert(
        'Registration Successful',
        'Your account has been created successfully! You can now login.',
        [
          {
            text: 'Login',
            onPress: () => router.replace('/(auth)/login')
          }
        ]
      );
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      Alert.alert('Registration Failed', errorMessage, [{ text: 'OK' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: safeThemeAccess.colors(theme, 'background') }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text variant="headlineMedium" style={[styles.title, { color: safeThemeAccess.colors(theme, 'primary') }]}>
              Create Account
            </Text>
            <Text variant="bodyMedium" style={[styles.subtitle, { color: safeThemeAccess.colors(theme, 'onSurfaceVariant') }]}>
              Join CUBS Technical Employee Management System
            </Text>
          </View>

          {/* Registration Form */}
          <Card style={[styles.registerCard, { backgroundColor: safeThemeAccess.colors(theme, 'surface') }]} elevation={4}>
            <Card.Content style={styles.cardContent}>
              <Formik
                initialValues={{ 
                  name: '', 
                  email: '', 
                  password: '', 
                  confirmPassword: '',
                  role: 'employee'
                }}
                validationSchema={registerSchema}
                onSubmit={handleRegister}
              >
                {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
                  <View style={styles.form}>
                    <TextInput
                      label="Full Name"
                      value={values.name}
                      onChangeText={handleChange('name')}
                      onBlur={handleBlur('name')}
                      error={touched.name && !!errors.name}
                      mode="outlined"
                      left={<TextInput.Icon icon="account" />}
                      style={styles.input}
                      disabled={isLoading}
                    />
                    {touched.name && errors.name && (
                      <Text style={[styles.errorText, { color: safeThemeAccess.colors(theme, 'error') }]}>
                        {errors.name}
                      </Text>
                    )}

                    <TextInput
                      label="Email Address"
                      value={values.email}
                      onChangeText={handleChange('email')}
                      onBlur={handleBlur('email')}
                      error={touched.email && !!errors.email}
                      mode="outlined"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      left={<TextInput.Icon icon="email" />}
                      style={styles.input}
                      disabled={isLoading}
                    />
                    {touched.email && errors.email && (
                      <Text style={[styles.errorText, { color: safeThemeAccess.colors(theme, 'error') }]}>
                        {errors.email}
                      </Text>
                    )}

                    {/* Role Selection */}
                    <View style={styles.roleSection}>
                      <Text variant="bodyMedium" style={[styles.roleLabel, { color: safeThemeAccess.colors(theme, 'onSurface') }]}>
                        Select Role
                      </Text>
                      <View style={styles.roleChips}>
                        <Chip
                          selected={values.role === 'employee'}
                          onPress={() => setFieldValue('role', 'employee')}
                          style={styles.roleChip}
                          icon="account"
                        >
                          Employee
                        </Chip>
                        <Chip
                          selected={values.role === 'admin'}
                          onPress={() => setFieldValue('role', 'admin')}
                          style={styles.roleChip}
                          icon="account-star"
                        >
                          Admin
                        </Chip>
                      </View>
                      {touched.role && errors.role && (
                        <Text style={[styles.errorText, { color: safeThemeAccess.colors(theme, 'error') }]}>
                          {errors.role}
                        </Text>
                      )}
                    </View>

                    <TextInput
                      label="Password"
                      value={values.password}
                      onChangeText={handleChange('password')}
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
                      disabled={isLoading}
                    />
                    {touched.password && errors.password && (
                      <Text style={[styles.errorText, { color: safeThemeAccess.colors(theme, 'error') }]}>
                        {errors.password}
                      </Text>
                    )}

                    <TextInput
                      label="Confirm Password"
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
                      loading={isLoading}
                      disabled={isLoading}
                      style={[styles.registerButton, { backgroundColor: safeThemeAccess.colors(theme, 'primary') }]}
                      labelStyle={{ color: safeThemeAccess.colors(theme, 'onPrimary') }}
                      icon="account-plus"
                    >
                      {isLoading ? 'Creating Account...' : 'Create Account'}
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
  registerCard: {
    borderRadius: 16,
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
  roleSection: {
    marginVertical: 8,
  },
  roleLabel: {
    marginBottom: 12,
    fontWeight: '500',
  },
  roleChips: {
    flexDirection: 'row',
    gap: 12,
  },
  roleChip: {
    flex: 1,
  },
  registerButton: {
    borderRadius: 12,
    paddingVertical: 4,
    marginTop: 8,
  },
  backButton: {
    marginTop: 8,
  },
}); 
