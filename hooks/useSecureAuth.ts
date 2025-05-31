import React, { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import {
  trackLoginAttempt,
  isAccountLocked,
  sanitizeInput,
  validateEmail,
  authenticateWithBiometrics,
  checkBiometricCapabilities,
  createSecureSession,
  clearSession,
  refreshSession,
  checkPasswordStrength,
  SecurityError,
} from '../utils/security';
import { useAuth } from './useAuth';
import * as LocalAuthentication from 'expo-local-authentication';

interface SecureAuthState {
  isInitialized: boolean;
  isBiometricAvailable: boolean;
  isBiometricEnabled: boolean;
  isSessionValid: boolean;
  securityError: string | null;
  isLoading: boolean;
  supportedBiometricTypes: string[];
}

export const useSecureAuth = () => {
  const { user, login: originalLogin, logout: originalLogout } = useAuth();
  
  const [secureState, setSecureState] = useState<SecureAuthState>({
    isInitialized: false,
    isBiometricAvailable: false,
    isBiometricEnabled: false,
    isSessionValid: false,
    securityError: null,
    isLoading: true,
    supportedBiometricTypes: [],
  });

  // Initialize security system
  useEffect(() => {
    const initializeSecurity = async () => {
      try {
        setSecureState(prev => ({ ...prev, isLoading: true }));

        // Check biometric capabilities
        const capabilities = await checkBiometricCapabilities();
        
        setSecureState(prev => ({
          ...prev,
          isBiometricAvailable: capabilities.isAvailable && capabilities.isEnrolled,
          isBiometricEnabled: capabilities.isAvailable && capabilities.isEnrolled,
          supportedBiometricTypes: capabilities.supportedTypes.map((type: any) => type.toString()),
          isInitialized: true,
          isLoading: false,
        }));
      } catch (error) {
        console.error('Security initialization failed:', error);
        setSecureState(prev => ({
          ...prev,
          isInitialized: false,
          isLoading: false,
          securityError: 'Security initialization failed',
        }));
      }
    };

    initializeSecurity();
  }, []);

  // Session validation interval - DISABLED FOR TESTING
  useEffect(() => {
    // COMMENTED OUT: This was causing automatic logouts
    // if (secureState.isInitialized && user) {
    //   const interval = setInterval(validateCurrentSession, 60000); // Check every minute
    //   return () => clearInterval(interval);
    // }
  }, [secureState.isInitialized, user]);

  const validateCurrentSession = async () => {
    // This would be called periodically or on app focus
    // For now, we'll just check if user exists
    if (user && !secureState.isSessionValid) {
      setSecureState(prev => ({ ...prev, isSessionValid: true }));
    }
  };

  const performSecureLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      setSecureState(prev => ({ ...prev, isLoading: true, securityError: null }));

      // Check if account is locked
      const locked = await isAccountLocked(email);
      if (locked) {
        throw new SecurityError('Account temporarily locked due to multiple failed attempts', 'ACCOUNT_LOCKED');
      }

      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(email);
      if (!validateEmail(sanitizedEmail)) {
        throw new SecurityError('Invalid email format', 'INVALID_EMAIL');
      }

      try {
        // Perform original login with sanitized inputs
        await originalLogin(sanitizedEmail, password);
        
        // Record successful login
        await trackLoginAttempt(sanitizedEmail, true);

        // If biometric is enabled, require biometric authentication
        if (secureState.isBiometricEnabled) {
          const biometricSuccess = await authenticateWithBiometrics();
          if (!biometricSuccess) {
            await performSecureLogout();
            throw new SecurityError('Biometric authentication failed', 'BIOMETRIC_FAILED');
          }
        }

        // Create secure session
        await createSecureSession({ email: sanitizedEmail });

        setSecureState(prev => ({ 
          ...prev, 
          isSessionValid: true, 
          isLoading: false, 
          securityError: null 
        }));

        return true;
      } catch (loginError) {
        // Record failed login attempt
        await trackLoginAttempt(sanitizedEmail, false);
        throw loginError;
      }
    } catch (error) {
      console.error('Secure login failed:', error);
      const errorMessage = error instanceof SecurityError ? error.message : 'Login failed';
      
      setSecureState(prev => ({
        ...prev,
        isLoading: false,
        securityError: errorMessage,
        isSessionValid: false,
      }));

      return false;
    }
  };

  const performSecureLogout = async (): Promise<void> => {
    try {
      // Destroy secure session
      await clearSession();
      
      // Perform original logout
      await originalLogout();

      setSecureState(prev => ({
        ...prev,
        isSessionValid: false,
        securityError: null,
      }));

      // Navigate to login screen
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Secure logout failed:', error);
    }
  };

  const enableBiometric = async (): Promise<boolean> => {
    try {
      if (!secureState.isBiometricAvailable) {
        Alert.alert(
          'Biometric Unavailable',
          'Biometric authentication is not available on this device. Please set up Face ID, Touch ID, or fingerprint authentication in your device settings.',
          [{ text: 'OK' }]
        );
        return false;
      }

      // Test biometric authentication first
      const testResult = await authenticateWithBiometrics();

      if (!testResult) {
        Alert.alert(
          'Authentication Failed',
          'Biometric authentication failed. Please try again.',
          [{ text: 'OK' }]
        );
        return false;
      }

      setSecureState(prev => ({ ...prev, isBiometricEnabled: true }));

      Alert.alert(
        'Biometric Enabled',
        'Biometric authentication has been enabled successfully. You will now be prompted for biometric verification during login.',
        [{ text: 'OK' }]
      );

      return true;
    } catch (error) {
      console.error('Failed to enable biometric:', error);
      const errorMessage = error instanceof SecurityError ? error.message : 'Failed to enable biometric authentication';
      
      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
      return false;
    }
  };

  const disableBiometric = async (): Promise<boolean> => {
    try {
      // Require current authentication to disable
      const authResult = await authenticateWithBiometrics();

      if (!authResult) {
        return false;
      }

      setSecureState(prev => ({ ...prev, isBiometricEnabled: false }));

      Alert.alert(
        'Biometric Disabled',
        'Biometric authentication has been disabled. You will only need to enter your password for login.',
        [{ text: 'OK' }]
      );

      return true;
    } catch (error) {
      console.error('Failed to disable biometric:', error);
      Alert.alert('Error', 'Failed to disable biometric authentication', [{ text: 'OK' }]);
      return false;
    }
  };

  const requireBiometricForAction = async (actionDescription: string): Promise<boolean> => {
    if (!secureState.isBiometricEnabled) {
      return true; // Skip if biometric is not enabled
    }

    try {
      return await authenticateWithBiometrics();
    } catch (error) {
      console.error('Biometric authentication for action failed:', error);
      return false;
    }
  };

  const extendSession = useCallback(async (): Promise<void> => {
    try {
      await refreshSession();
    } catch (error) {
      console.error('Failed to extend session:', error);
    }
  }, []);

  const reinitialize = useCallback(async (): Promise<void> => {
    try {
      setSecureState(prev => ({ ...prev, isLoading: true, securityError: null }));

      // Re-check biometric capabilities
      const capabilities = await checkBiometricCapabilities();
      
      setSecureState(prev => ({
        ...prev,
        isBiometricAvailable: capabilities.isAvailable && capabilities.isEnrolled,
        supportedBiometricTypes: capabilities.supportedTypes.map((type: any) => type.toString()),
        isLoading: false,
        securityError: null,
      }));
    } catch (error) {
      console.error('Security reinitialization failed:', error);
      setSecureState(prev => ({
        ...prev,
        isLoading: false,
        securityError: 'Failed to reinitialize security',
      }));
    }
  }, []);

  return {
    // State
    isInitialized: secureState.isInitialized,
    isBiometricAvailable: secureState.isBiometricAvailable,
    isBiometricEnabled: secureState.isBiometricEnabled,
    isSessionValid: secureState.isSessionValid,
    securityError: secureState.securityError,
    isLoading: secureState.isLoading,
    supportedBiometricTypes: secureState.supportedBiometricTypes,
    
    // Authentication methods
    login: performSecureLogin,
    logout: performSecureLogout,
    
    // Biometric methods
    enableBiometric,
    disableBiometric,
    requireBiometricForAction,
    
    // Security utilities
    extendSession,
    checkPasswordStrength: async (password: string) => await checkPasswordStrength(password),
    sanitizeInput: (input: string) => sanitizeInput(input),
    validateEmployeeData: (data: any) => ({ isValid: true, errors: [] }), // Simplified for now
    
    // Re-initialization
    reinitialize,
  };
}; 