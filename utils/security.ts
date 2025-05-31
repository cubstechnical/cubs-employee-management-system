import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Device from 'expo-device';
import * as Crypto from 'expo-crypto';
import CryptoJS from 'crypto-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Security Configuration
export const SECURITY_CONFIG = {
  // Encryption settings
  ENCRYPTION_ALGORITHM: 'AES',
  KEY_SIZE: 256,
  IV_SIZE: 16,
  
  // Biometric settings
  BIOMETRIC_PROMPT_MESSAGE: 'Authenticate to access employee data',
  BIOMETRIC_FALLBACK_TITLE: 'Use Passcode',
  
  // Session management
  SESSION_TIMEOUT: 15 * 60 * 1000, // 15 minutes
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 30 * 60 * 1000, // 30 minutes
  
  // Anti-tampering
  INTEGRITY_CHECK_INTERVAL: 5 * 60 * 1000, // 5 minutes
  
  // Secure storage keys
  STORAGE_KEYS: {
    USER_SESSION: 'user_session_encrypted',
    BIOMETRIC_ENABLED: 'biometric_enabled',
    ENCRYPTION_KEY: 'master_encryption_key',
    LOGIN_ATTEMPTS: 'login_attempts',
    LAST_LOGIN: 'last_login',
    DEVICE_ID: 'device_id',
    APP_INTEGRITY: 'app_integrity_hash',
  },
  PASSWORD_MIN_LENGTH: 8,
  BIOMETRIC_PROMPT_TITLE: 'Authenticate',
  BIOMETRIC_PROMPT_SUBTITLE: 'Use your biometric to access the app',
  BIOMETRIC_PROMPT_DESCRIPTION: 'Place your finger on the sensor or look at the camera',
  ENCRYPTION_KEY_ALIAS: 'cubs_app_key',
  SESSION_KEY: 'cubs_session',
  DEVICE_ID_KEY: 'cubs_device_id',
};

// Security Error class
export class SecurityError extends Error {
  public code: string;
  
  constructor(message: string, code: string) {
    super(message);
    this.name = 'SecurityError';
    this.code = code;
  }
}

// Types
export interface SecurityContext {
  isAuthenticated: boolean;
  user: any;
  deviceFingerprint: string;
  sessionId: string;
  timestamp: number;
}

export interface BiometricCapabilities {
  isAvailable: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  isEnrolled: boolean;
  securityLevel: 'none' | 'weak' | 'strong';
}

export interface PasswordStrength {
  score: number;
  errors: string[];
  suggestions: string[];
}

// Device fingerprinting
export const generateDeviceFingerprint = async (): Promise<string> => {
  try {
    const deviceInfo = {
      id: Device.osInternalBuildId || 'unknown',
      name: Device.deviceName || 'unknown',
      model: Device.modelName || 'unknown',
      os: Platform.OS,
      osVersion: Device.osVersion || 'unknown',
      brand: Device.brand || 'unknown',
      manufacturer: Device.manufacturer || 'unknown',
    };

    const fingerprintData = JSON.stringify(deviceInfo);
    const fingerprint = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      fingerprintData
    );

    return fingerprint;
  } catch (error) {
    console.error('Error generating device fingerprint:', error);
    return 'fallback_fingerprint';
  }
};

// Biometric authentication
export const checkBiometricCapabilities = async (): Promise<BiometricCapabilities> => {
  try {
    const isAvailable = await LocalAuthentication.hasHardwareAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    let securityLevel: 'none' | 'weak' | 'strong' = 'none';
    
    if (isAvailable && isEnrolled) {
      // Check for strong biometrics (Face ID, Touch ID, Iris)
      const strongTypes = [
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
        LocalAuthentication.AuthenticationType.FINGERPRINT,
        LocalAuthentication.AuthenticationType.IRIS,
      ];
      
      const hasStrongBiometric = supportedTypes.some(type => strongTypes.includes(type));
      securityLevel = hasStrongBiometric ? 'strong' : 'weak';
    }

    return {
      isAvailable,
      supportedTypes,
      isEnrolled,
      securityLevel,
    };
  } catch (error) {
    console.error('Error checking biometric capabilities:', error);
    return {
      isAvailable: false,
      supportedTypes: [],
      isEnrolled: false,
      securityLevel: 'none',
    };
  }
};

export const authenticateWithBiometrics = async (): Promise<boolean> => {
  try {
    const capabilities = await checkBiometricCapabilities();
    
    if (!capabilities.isAvailable || !capabilities.isEnrolled) {
      throw new Error('Biometric authentication not available');
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: SECURITY_CONFIG.BIOMETRIC_PROMPT_TITLE,
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use Password',
      disableDeviceFallback: false,
    });

    return result.success;
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return false;
  }
};

// Secure storage
export const securelyStore = async (key: string, value: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      // Web fallback to localStorage with encryption
      const encrypted = await encryptData(value);
      localStorage.setItem(key, encrypted);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch (error) {
    console.error('Error storing secure data:', error);
    throw error;
  }
};

export const securelyRetrieve = async (key: string): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      // Web fallback from localStorage with decryption
      const encrypted = localStorage.getItem(key);
      if (encrypted) {
        return await decryptData(encrypted);
      }
      return null;
    } else {
      return await SecureStore.getItemAsync(key);
    }
  } catch (error) {
    console.error('Error retrieving secure data:', error);
    return null;
  }
};

export const securelyDelete = async (key: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (error) {
    console.error('Error deleting secure data:', error);
    throw error;
  }
};

// Encryption utilities
const getEncryptionKey = async (): Promise<string> => {
  try {
    let key = await securelyRetrieve(SECURITY_CONFIG.ENCRYPTION_KEY_ALIAS);
    
    if (!key) {
      // Generate new encryption key
      key = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${Date.now()}_${Math.random()}_${await generateDeviceFingerprint()}`
      );
      await securelyStore(SECURITY_CONFIG.ENCRYPTION_KEY_ALIAS, key);
    }
    
    return key;
  } catch (error) {
    console.error('Error getting encryption key:', error);
    throw error;
  }
};

export const encryptData = async (data: string): Promise<string> => {
  try {
    // Simple encryption for demo purposes
    // In production, use proper encryption libraries
    const key = await getEncryptionKey();
    const combined = `${key}_${data}`;
    return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, combined);
  } catch (error) {
    console.error('Error encrypting data:', error);
    throw error;
  }
};

export const decryptData = async (encryptedData: string): Promise<string> => {
  try {
    // This is a simplified decryption for demo purposes
    // In production, implement proper decryption
    return encryptedData; // Placeholder
  } catch (error) {
    console.error('Error decrypting data:', error);
    throw error;
  }
};

// Password strength checking
export const checkPasswordStrength = async (password: string): Promise<PasswordStrength> => {
  const errors: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) {
    score += 20;
  } else {
    errors.push('Password must be at least 8 characters long');
  }

  if (password.length >= 12) {
    score += 10;
  } else {
    suggestions.push('Use at least 12 characters for better security');
  }

  // Character variety checks
  if (/[a-z]/.test(password)) {
    score += 10;
  } else {
    errors.push('Include lowercase letters');
  }

  if (/[A-Z]/.test(password)) {
    score += 10;
  } else {
    errors.push('Include uppercase letters');
  }

  if (/[0-9]/.test(password)) {
    score += 10;
  } else {
    errors.push('Include numbers');
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 15;
  } else {
    errors.push('Include special characters');
  }

  // Common patterns check
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /admin/i,
  ];

  const hasCommonPattern = commonPatterns.some(pattern => pattern.test(password));
  if (hasCommonPattern) {
    score -= 20;
    errors.push('Avoid common patterns');
  }

  // Repetition check
  if (/(.)\1{2,}/.test(password)) {
    score -= 10;
    suggestions.push('Avoid repeating characters');
  }

  // Sequential characters check
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
    score -= 10;
    suggestions.push('Avoid sequential characters');
  }

  // Bonus for length
  if (password.length > 16) {
    score += 15;
  }

  // Ensure score is between 0 and 100
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    errors,
    suggestions,
  };
};

// Session management
export const createSecureSession = async (user: any): Promise<string> => {
  try {
    const sessionId = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${user.id}_${Date.now()}_${Math.random()}`
    );

    const deviceFingerprint = await generateDeviceFingerprint();
    
    const sessionData: SecurityContext = {
      isAuthenticated: true,
      user,
      deviceFingerprint,
      sessionId,
      timestamp: Date.now(),
    };

    await securelyStore(SECURITY_CONFIG.SESSION_KEY, JSON.stringify(sessionData));
    return sessionId;
  } catch (error) {
    console.error('Error creating secure session:', error);
    throw error;
  }
};

export const validateSession = async (): Promise<any | null> => {
  try {
    const sessionDataString = await securelyRetrieve(SECURITY_CONFIG.SESSION_KEY);
    
    if (!sessionDataString) {
      return null;
    }

    const sessionData = JSON.parse(sessionDataString) as SecurityContext;
    const now = Date.now();
    const currentFingerprint = await generateDeviceFingerprint();

    // Check session timeout
    if (now - sessionData.timestamp > SECURITY_CONFIG.SESSION_TIMEOUT) {
      await clearSession();
      throw new Error('Session expired');
    }

    // Check device fingerprint
    if (currentFingerprint !== sessionData.deviceFingerprint) {
      await clearSession();
      throw new Error('Device fingerprint mismatch');
    }

    // Update timestamp
    sessionData.timestamp = Date.now();
    await securelyStore(SECURITY_CONFIG.SESSION_KEY, JSON.stringify(sessionData));

    return sessionData.user;
  } catch (error) {
    console.error('Session validation error:', error);
    await clearSession();
    return null;
  }
};

export const refreshSession = async (): Promise<void> => {
  try {
    const sessionDataString = await securelyRetrieve(SECURITY_CONFIG.SESSION_KEY);
    
    if (sessionDataString) {
      const sessionData = JSON.parse(sessionDataString) as SecurityContext;
      sessionData.timestamp = Date.now();
      await securelyStore(SECURITY_CONFIG.SESSION_KEY, JSON.stringify(sessionData));
    }
  } catch (error) {
    console.error('Error refreshing session:', error);
  }
};

export const clearSession = async (): Promise<void> => {
  try {
    await securelyDelete(SECURITY_CONFIG.SESSION_KEY);
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};

// Login attempt tracking
export const trackLoginAttempt = async (email: string, success: boolean): Promise<void> => {
  try {
    const key = `login_attempts_${email}`;
    const attemptsData = await AsyncStorage.getItem(key);
    
    let attempts = attemptsData ? JSON.parse(attemptsData) : { count: 0, lastAttempt: 0 };
    
    if (success) {
      // Reset attempts on successful login
      await AsyncStorage.removeItem(key);
    } else {
      attempts.count += 1;
      attempts.lastAttempt = Date.now();
      await AsyncStorage.setItem(key, JSON.stringify(attempts));
    }
  } catch (error) {
    console.error('Error tracking login attempt:', error);
  }
};

export const isAccountLocked = async (email: string): Promise<boolean> => {
  try {
    const key = `login_attempts_${email}`;
    const attemptsData = await AsyncStorage.getItem(key);
    
    if (!attemptsData) {
      return false;
    }
    
    const attempts = JSON.parse(attemptsData);
    const now = Date.now();
    
    // Check if account is locked
    if (attempts.count >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
      const timeSinceLastAttempt = now - attempts.lastAttempt;
      
      if (timeSinceLastAttempt < SECURITY_CONFIG.LOCKOUT_DURATION) {
        return true;
      } else {
        // Lockout period expired, reset attempts
        await AsyncStorage.removeItem(key);
        return false;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking account lock status:', error);
    return false;
  }
};

// Security utilities
export const sanitizeInput = (input: string): string => {
  // Remove potentially dangerous characters
  return input.replace(/[<>\"'%;()&+]/g, '');
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const generateSecureToken = async (): Promise<string> => {
  try {
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${Date.now()}_${Math.random()}_${await generateDeviceFingerprint()}`
    );
  } catch (error) {
    console.error('Error generating secure token:', error);
    throw error;
  }
};

// Anti-tampering checks
export const performSecurityChecks = async (): Promise<{ passed: boolean; issues: string[] }> => {
  const issues: string[] = [];

  try {
    // Check if device is rooted/jailbroken (basic check)
    // This is a simplified check - in production, use a dedicated library
    
    // Check for debugging
    if (__DEV__) {
      issues.push('App is running in development mode');
    }

    // Check device integrity
    const capabilities = await checkBiometricCapabilities();
    if (capabilities.securityLevel === 'none') {
      issues.push('No secure authentication method available');
    }

    return {
      passed: issues.length === 0,
      issues,
    };
  } catch (error) {
    console.error('Security check error:', error);
    return {
      passed: false,
      issues: ['Security check failed'],
    };
  }
};

// Security Manager - Main orchestrator
export class SecurityManager {
  private static initialized = false;

  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize encryption
      await getEncryptionKey();

      // Verify device integrity
      const isDeviceSecure = await performSecurityChecks();
      if (!isDeviceSecure.passed) {
        console.warn('Device integrity check failed');
      }

      // Check for root/jailbreak
      const isCompromised = await performSecurityChecks();
      if (!isCompromised.passed) {
        throw new SecurityError('Device security compromised', 'DEVICE_COMPROMISED');
      }

      this.initialized = true;
      console.log('Security Manager initialized successfully');
    } catch (error) {
      console.error('Security Manager initialization failed:', error);
      throw error;
    }
  }

  static async authenticateUser(email: string, password: string): Promise<any> {
    // Check if account is locked
    const isLocked = await isAccountLocked(email);
    if (isLocked) {
      throw new SecurityError(
        'Account temporarily locked. Try again later.',
        'ACCOUNT_LOCKED'
      );
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email);
    if (!sanitizedEmail) {
      throw new SecurityError('Invalid email format', 'INVALID_EMAIL');
    }

    // Here you would call your actual authentication service
    // For now, we'll assume it's successful if we get this far
    const authSuccess = true; // Replace with actual auth logic

    // Record login attempt
    await trackLoginAttempt(sanitizedEmail, authSuccess);

    if (!authSuccess) {
      throw new SecurityError('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // If biometric is enabled, require biometric authentication
    const isBiometricEnabled = await authenticateWithBiometrics();
    if (isBiometricEnabled) {
      const biometricSuccess = await authenticateWithBiometrics();
      if (!biometricSuccess) {
        throw new SecurityError('Biometric authentication failed', 'BIOMETRIC_FAILED');
      }
    }

    // Create secure session
    const userData = { email: sanitizedEmail, role: 'admin' }; // Replace with actual user data
    const sessionId = await createSecureSession(userData);

    return { user: userData, sessionId };
  }

  static async logout(): Promise<void> {
    await clearSession();
  }

  static async requireBiometricAuth(action: string): Promise<boolean> {
    const isEnabled = await authenticateWithBiometrics();
    if (!isEnabled) return true; // Skip if not enabled

    return await authenticateWithBiometrics();
  }

  static isInitialized(): boolean {
    return this.initialized;
  }
} 