// @ts-nocheck
// 🚨 CUBS Employee Management System - Error Monitoring & Performance Tracking
// Real-time error monitoring with Sentry integration

import React from 'react';
import { Platform } from 'react-native';

// Error types for better categorization
export interface CUBSError {
  id: string;
  type: 'UI' | 'API' | 'DATABASE' | 'AUTH' | 'PERFORMANCE' | 'NETWORK';
  message: string;
  stack?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  route?: string;
  device?: {
    platform: string;
    version: string;
    model?: string;
  };
}

// Performance metrics interface
export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  timestamp: Date;
  route?: string;
  metadata?: Record<string, any>;
}

class ErrorMonitoringService {
  private isInitialized = false;
  private userId?: string;
  private environment: 'development' | 'staging' | 'production' = 'development';

  // Initialize monitoring service
  init(config: {
    dsn?: string;
    environment?: 'development' | 'staging' | 'production';
    userId?: string;
  }) {
    this.environment = config.environment || 'development';
    this.userId = config.userId;

    // Only enable in production or when explicitly configured
    if (this.environment === 'production' && config.dsn) {
      this.initSentry(config.dsn);
    }

    this.isInitialized = true;
    console.log(`🚨 [MONITORING] Initialized for ${this.environment} environment`);
  }

  // Initialize Sentry (when available)
  private initSentry(dsn: string) {
    try {
      // For React Native, you would use @sentry/react-native
      // For now, we'll use a mock implementation
      console.log('🚨 [SENTRY] Would initialize with DSN:', dsn);
      
      // TODO: Actual Sentry initialization
      // import * as Sentry from '@sentry/react-native';
      // Sentry.init({
      //   dsn,
      //   environment: this.environment,
      //   integrations: [
      //     new Sentry.ReactNativeTracing(),
      //   ],
      //   tracesSampleRate: 1.0,
      // });
    } catch (error) {
      console.error('🚨 [SENTRY] Failed to initialize:', error);
    }
  }

  // Set user context
  setUser(userId: string, metadata?: Record<string, any>) {
    this.userId = userId;
    
    if (this.isInitialized) {
      console.log('🚨 [MONITORING] User context set:', userId);
      // Sentry.setUser({ id: userId, ...metadata });
    }
  }

  // Capture error with enhanced context
  captureError(error: Error | string, context?: {
    type?: CUBSError['type'];
    route?: string;
    metadata?: Record<string, any>;
    level?: 'error' | 'warning' | 'info';
  }) {
    const errorData: CUBSError = {
      id: this.generateId(),
      type: context?.type || 'UI',
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      metadata: {
        ...context?.metadata,
        platform: Platform.OS,
        version: Platform.Version,
      },
      timestamp: new Date(),
      userId: this.userId,
      route: context?.route,
      device: {
        platform: Platform.OS,
        version: Platform.Version.toString(),
      },
    };

    // Log locally for development
    if (this.environment === 'development') {
      console.group(`🚨 [ERROR] ${errorData.type} Error`);
      console.error('Message:', errorData.message);
      console.error('Route:', errorData.route);
      console.error('Stack:', errorData.stack);
      console.error('Metadata:', errorData.metadata);
      console.groupEnd();
    }

    // Send to Sentry in production
    if (this.environment === 'production') {
      // Sentry.captureException(error, {
      //   tags: {
      //     type: errorData.type,
      //     route: errorData.route,
      //   },
      //   extra: errorData.metadata,
      //   level: context?.level || 'error',
      // });
    }

    // Store locally for offline analysis
    this.storeErrorLocally(errorData);

    return errorData.id;
  }

  // Capture performance metrics
  capturePerformance(name: string, value: number, metadata?: Record<string, any>) {
    const metric: PerformanceMetric = {
      id: this.generateId(),
      name,
      value,
      timestamp: new Date(),
      metadata: {
        ...metadata,
        platform: Platform.OS,
        version: Platform.Version,
      },
    };

    if (this.environment === 'development') {
      console.log(`⚡ [PERFORMANCE] ${name}: ${value}ms`, metadata);
    }

    // Send to analytics service
    this.storePerformanceLocally(metric);

    return metric.id;
  }

  // Measure function execution time
  measurePerformance<T>(
    name: string,
    fn: () => Promise<T> | T,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now();
    
    return Promise.resolve(fn())
      .then((result) => {
        const duration = Date.now() - startTime;
        this.capturePerformance(name, duration, metadata);
        return result;
      })
      .catch((error) => {
        const duration = Date.now() - startTime;
        this.capturePerformance(`${name}_failed`, duration, metadata);
        this.captureError(error, {
          type: 'PERFORMANCE',
          metadata: { ...metadata, duration },
        });
        throw error;
      });
  }

  // Capture user interactions for UX analytics
  captureUserAction(action: string, metadata?: Record<string, any>) {
    if (this.environment === 'development') {
      console.log(`👤 [USER] ${action}`, metadata);
    }

    // Send to analytics service
    // Analytics.track(action, metadata);
  }

  // Database query monitoring
  captureDBQuery(query: string, duration: number, metadata?: Record<string, any>) {
    this.capturePerformance(`db_query_${query}`, duration, {
      ...metadata,
      queryType: query,
    });

    if (duration > 1000) { // Slow query threshold
      this.captureError(`Slow database query: ${query}`, {
        type: 'DATABASE',
        metadata: { duration, query, ...metadata },
        level: 'warning',
      });
    }
  }

  // API request monitoring
  captureAPIRequest(
    endpoint: string,
    method: string,
    duration: number,
    status: number,
    metadata?: Record<string, any>
  ) {
    this.capturePerformance(`api_${method}_${endpoint}`, duration, {
      ...metadata,
      endpoint,
      method,
      status,
    });

    if (status >= 400) {
      this.captureError(`API Error: ${method} ${endpoint} - ${status}`, {
        type: 'API',
        metadata: { duration, status, endpoint, method, ...metadata },
        level: status >= 500 ? 'error' : 'warning',
      });
    }
  }

  // Network connectivity monitoring
  captureNetworkStatus(isOnline: boolean) {
    if (!isOnline) {
      this.captureError('Network connectivity lost', {
        type: 'NETWORK',
        metadata: { isOnline },
        level: 'warning',
      });
    }
  }

  // Store errors locally for offline analysis
  private storeErrorLocally(error: CUBSError) {
    try {
      // In a real implementation, use AsyncStorage or another persistence layer
      // AsyncStorage.setItem(`error_${error.id}`, JSON.stringify(error));
    } catch (e) {
      console.warn('Failed to store error locally:', e);
    }
  }

  // Store performance metrics locally
  private storePerformanceLocally(metric: PerformanceMetric) {
    try {
      // In a real implementation, use AsyncStorage or another persistence layer
      // AsyncStorage.setItem(`perf_${metric.id}`, JSON.stringify(metric));
    } catch (e) {
      console.warn('Failed to store performance metric locally:', e);
    }
  }

  // Generate unique ID
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get error statistics for admin dashboard
  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    recentErrors: CUBSError[];
  } {
    // In a real implementation, retrieve from storage
    return {
      totalErrors: 0,
      errorsByType: {},
      recentErrors: [],
    };
  }

  // Get performance statistics
  getPerformanceStats(): {
    averageLoadTime: number;
    slowQueries: PerformanceMetric[];
    apiPerformance: Record<string, { avg: number; count: number }>;
  } {
    // In a real implementation, calculate from stored metrics
    return {
      averageLoadTime: 0,
      slowQueries: [],
      apiPerformance: {},
    };
  }
}

// Global error monitoring instance
export const ErrorMonitor = new ErrorMonitoringService();

// React error boundary helper
export class CUBSErrorBoundary extends Error {
  constructor(
    message: string,
    public componentStack?: string,
    public errorInfo?: any
  ) {
    super(message);
    this.name = 'CUBSErrorBoundary';
  }
}

// Higher-order component for error monitoring
export function withErrorMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  return function MonitoredComponent(props: P) {
    React.useEffect(() => {
      ErrorMonitor.captureUserAction(`component_mounted`, {
        component: componentName || Component.name,
      });

      return () => {
        ErrorMonitor.captureUserAction(`component_unmounted`, {
          component: componentName || Component.name,
        });
      };
    }, []);

    try {
      return React.createElement(Component, props);
    } catch (error) {
      ErrorMonitor.captureError(error as Error, {
        type: 'UI',
        metadata: {
          component: componentName || Component.name,
          props: JSON.stringify(props),
        },
      });
      throw error;
    }
  };
}

// Performance monitoring hook
export function usePerformanceMonitoring(componentName: string) {
  const startTime = React.useRef(Date.now());

  React.useEffect(() => {
    const mountTime = Date.now() - startTime.current;
    ErrorMonitor.capturePerformance(`component_mount_${componentName}`, mountTime);

    return () => {
      const totalTime = Date.now() - startTime.current;
      ErrorMonitor.capturePerformance(`component_lifetime_${componentName}`, totalTime);
    };
  }, [componentName]);

  return {
    measureAsync: <T>(name: string, fn: () => Promise<T>) =>
      ErrorMonitor.measurePerformance(`${componentName}_${name}`, fn),
    captureAction: (action: string, metadata?: Record<string, any>) =>
      ErrorMonitor.captureUserAction(`${componentName}_${action}`, metadata),
  };
}

// Initialize monitoring with environment detection
export function initializeMonitoring() {
  const environment = __DEV__ ? 'development' : 'production';
  
  ErrorMonitor.init({
    environment,
    // dsn: process.env.EXPO_PUBLIC_SENTRY_DSN, // Add your Sentry DSN
  });

  // Global error handler
  if (typeof global !== 'undefined') {
    const originalHandler = global.ErrorUtils?.getGlobalHandler?.();
    
    global.ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
      ErrorMonitor.captureError(error, {
        type: 'UI',
        metadata: { isFatal, global: true },
        level: isFatal ? 'error' : 'warning',
      });

      originalHandler?.(error, isFatal);
    });
  }
}

export default ErrorMonitor; 