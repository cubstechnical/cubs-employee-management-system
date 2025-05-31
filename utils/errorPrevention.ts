import { CustomTheme } from '../theme';

/**
 * Safe theme property access to prevent "Cannot read property 'xs' of undefined" errors
 */
export const safeThemeAccess = {
  spacing: (theme: CustomTheme | undefined, size: keyof CustomTheme['spacing'] = 'md'): number => {
    if (!theme?.spacing) {
      console.warn('Theme spacing not available, using fallback');
      const fallbackSpacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
      return fallbackSpacing[size] || 16;
    }
    return theme.spacing[size] || 16;
  },

  breakpoints: (theme: CustomTheme | undefined, size: keyof CustomTheme['breakpoints'] = 'md'): number => {
    if (!theme?.breakpoints) {
      console.warn('Theme breakpoints not available, using fallback');
      const fallbackBreakpoints = { xs: 0, sm: 576, md: 768, lg: 992, xl: 1200 };
      return fallbackBreakpoints[size] || 768;
    }
    return theme.breakpoints[size] || 768;
  },

  layout: (theme: CustomTheme | undefined, size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md'): number => {
    if (!theme?.layout && !theme?.breakpoints) {
      console.warn('Theme layout/breakpoints not available, using fallback');
      const fallbackLayout = { xs: 0, sm: 576, md: 768, lg: 992, xl: 1200 };
      return fallbackLayout[size] || 768;
    }
    return (theme.layout?.[size] || theme.breakpoints?.[size]) || 768;
  },

  screen: (theme: CustomTheme | undefined, size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md'): number => {
    if (!theme?.screen && !theme?.breakpoints) {
      console.warn('Theme screen/breakpoints not available, using fallback');
      const fallbackScreen = { xs: 0, sm: 576, md: 768, lg: 992, xl: 1200 };
      return fallbackScreen[size] || 768;
    }
    return (theme.screen?.[size] || theme.breakpoints?.[size]) || 768;
  },

  colors: (theme: CustomTheme | undefined, color: string = 'primary'): string => {
    if (!theme?.colors) {
      console.warn('Theme colors not available, using fallback');
      return '#DD1A51'; // CUBS primary color
    }
    
    // Handle nested properties like 'brand.primary' or 'status.expiring'
    if (color.includes('.')) {
      const parts = color.split('.');
      let value = theme.colors as any;
      for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
          value = value[part];
        } else {
          console.warn(`Theme color property '${color}' not found, using fallback`);
          return '#DD1A51';
        }
      }
      return typeof value === 'string' ? value : '#DD1A51';
    }
    
    return (theme.colors as any)[color] || '#DD1A51';
  },

  borderRadius: (theme: CustomTheme | undefined, size: keyof CustomTheme['borderRadius'] = 'medium'): number => {
    if (!theme?.borderRadius) {
      console.warn('Theme borderRadius not available, using fallback');
      const fallbackRadius = { small: 8, medium: 12, large: 16, xlarge: 24 };
      return fallbackRadius[size] || 12;
    }
    return theme.borderRadius[size] || 12;
  },

  shadows: (theme: CustomTheme | undefined, size: keyof CustomTheme['shadows'] = 'medium'): object => {
    if (!theme?.shadows) {
      console.warn('Theme shadows not available, using fallback');
      return {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
      };
    }
    return theme.shadows[size] || {};
  },
};

/**
 * Safe data access utilities
 */
export const safeDataAccess = {
  getString: (obj: any, path: string, fallback: string = ''): string => {
    try {
      const value = path.split('.').reduce((current, key) => current?.[key], obj);
      return typeof value === 'string' ? value : fallback;
    } catch {
      return fallback;
    }
  },

  getNumber: (obj: any, path: string, fallback: number = 0): number => {
    try {
      const value = path.split('.').reduce((current, key) => current?.[key], obj);
      return typeof value === 'number' ? value : fallback;
    } catch {
      return fallback;
    }
  },

  getArray: <T>(obj: any, path: string, fallback: T[] = []): T[] => {
    try {
      const value = path.split('.').reduce((current, key) => current?.[key], obj);
      return Array.isArray(value) ? value : fallback;
    } catch {
      return fallback;
    }
  },
};

/**
 * Input validation utilities
 */
export const validation = {
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidDate: (date: string): boolean => {
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  },

  isValidEmployeeId: (id: string): boolean => {
    return typeof id === 'string' && id.length > 0 && id.trim().length > 0;
  },

  sanitizeString: (str: string): string => {
    return typeof str === 'string' ? str.trim() : '';
  },
};

/**
 * Error logging utility
 */
export const errorLogger = {
  log: (error: Error, context?: string) => {
    console.error(`[ERROR${context ? ` - ${context}` : ''}]:`, error);
    // In production, send to error reporting service like Sentry
  },

  warn: (message: string, context?: string) => {
    console.warn(`[WARNING${context ? ` - ${context}` : ''}]:`, message);
  },

  info: (message: string, context?: string) => {
    console.info(`[INFO${context ? ` - ${context}` : ''}]:`, message);
  },
};

/**
 * Async operation wrapper with error handling
 */
export const safeAsync = async <T>(
  operation: () => Promise<T>,
  fallback: T,
  context?: string
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    errorLogger.log(error as Error, context);
    return fallback;
  }
};

/**
 * Component prop validation
 */
export const validateProps = {
  employee: (employee: any): boolean => {
    return (
      employee &&
      typeof employee.id === 'string' &&
      typeof employee.name === 'string' &&
      typeof employee.employee_id === 'string'
    );
  },

  theme: (theme: any): boolean => {
    return (
      theme &&
      theme.colors &&
      theme.spacing &&
      theme.borderRadius &&
      theme.shadows &&
      theme.breakpoints // Ensure breakpoints are present
    );
  },

  themeResponsive: (theme: any): boolean => {
    return (
      validateProps.theme(theme) &&
      (theme.breakpoints?.xs !== undefined) &&
      (theme.spacing?.xs !== undefined)
    );
  },
};

export default {
  safeThemeAccess,
  safeDataAccess,
  validation,
  errorLogger,
  safeAsync,
  validateProps,
}; 