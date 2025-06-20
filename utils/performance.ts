// Performance Optimization Utilities for CUBS EMS
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Performance Configuration
export const PERFORMANCE_CONFIG = {
  // Memory management
  MAX_CACHE_SIZE: 50 * 1024 * 1024, // 50MB cache limit
  MAX_EMPLOYEE_CACHE: 1000, // Maximum employees to cache
  CACHE_EXPIRY: 5 * 60 * 1000, // 5 minutes cache expiry
  
  // Image optimization
  IMAGE_QUALITY: 0.8,
  MAX_IMAGE_SIZE: 1024, // Max width/height in pixels
  
  // Network optimization
  REQUEST_TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  DEBOUNCE_DELAY: 300, // ms
  
  // UI optimization
  LIST_VIRTUALIZATION_THRESHOLD: 50, // Virtualize lists with >50 items
  ANIMATION_DURATION: 200, // Faster animations
  
  // Bundle optimization
  LAZY_LOAD_THRESHOLD: 100, // Lazy load components with >100 items
};

// Memory Cache Implementation
class MemoryCache {
  private cache = new Map<string, { data: any; timestamp: number; size: number }>();
  private totalSize = 0;

  set(key: string, data: any): void {
    const dataSize = this.calculateSize(data);
    
    // Clear old entries if cache is full
    if (this.totalSize + dataSize > PERFORMANCE_CONFIG.MAX_CACHE_SIZE) {
      this.clearExpired();
      this.evictLRU(dataSize);
    }

    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      this.totalSize -= this.cache.get(key)!.size;
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      size: dataSize,
    });
    
    this.totalSize += dataSize;
    console.log(`📦 Cache: Stored ${key} (${dataSize} bytes, total: ${this.totalSize})`);
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > PERFORMANCE_CONFIG.CACHE_EXPIRY) {
      this.cache.delete(key);
      this.totalSize -= entry.size;
      return null;
    }
    
    console.log(`📦 Cache: Retrieved ${key}`);
    return entry.data;
  }

  has(key: string): boolean {
    return this.cache.has(key) && this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
    this.totalSize = 0;
    console.log('📦 Cache: Cleared all entries');
  }

  private calculateSize(data: any): number {
    // Rough estimation of object size
    return JSON.stringify(data).length * 2; // 2 bytes per character
  }

  private clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > PERFORMANCE_CONFIG.CACHE_EXPIRY) {
        this.cache.delete(key);
        this.totalSize -= entry.size;
      }
    }
  }

  private evictLRU(requiredSize: number): void {
    // Simple LRU: remove oldest entries until we have enough space
    const sortedEntries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);
    
    for (const [key, entry] of sortedEntries) {
      if (this.totalSize + requiredSize <= PERFORMANCE_CONFIG.MAX_CACHE_SIZE) break;
      
      this.cache.delete(key);
      this.totalSize -= entry.size;
      console.log(`📦 Cache: Evicted ${key} (LRU)`);
    }
  }

  getStats(): { size: number; entries: number; maxSize: number } {
    return {
      size: this.totalSize,
      entries: this.cache.size,
      maxSize: PERFORMANCE_CONFIG.MAX_CACHE_SIZE,
    };
  }
}

// Global cache instance
export const memoryCache = new MemoryCache();

// Debounce utility for performance
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number = PERFORMANCE_CONFIG.DEBOUNCE_DELAY
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay) as unknown as NodeJS.Timeout;
  };
}

// Throttle utility for performance
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Image optimization utility
export function optimizeImageSize(width: number, height: number): { width: number; height: number } {
  const maxSize = PERFORMANCE_CONFIG.MAX_IMAGE_SIZE;
  
  if (width <= maxSize && height <= maxSize) {
    return { width, height };
  }
  
  const aspectRatio = width / height;
  
  if (width > height) {
    return {
      width: maxSize,
      height: Math.round(maxSize / aspectRatio),
    };
  } else {
    return {
      width: Math.round(maxSize * aspectRatio),
      height: maxSize,
    };
  }
}

// Batch processing utility
export function batchProcess<T, R>(
  items: T[],
  processor: (batch: T[]) => Promise<R[]>,
  batchSize: number = 10
): Promise<R[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const results: R[] = [];
      
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await processor(batch);
        results.push(...batchResults);
        
        // Allow UI to update between batches
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      
      resolve(results);
    } catch (error) {
      reject(error);
    }
  });
}

// Lazy loading utility
export function createLazyLoader<T>(
  loadFunction: () => Promise<T>,
  key: string
): () => Promise<T> {
  let cached: T | null = null;
  let loading = false;
  let loadPromise: Promise<T> | null = null;

  return async (): Promise<T> => {
    // Return cached value if available
    if (cached !== null) return cached;
    
    // Return existing promise if already loading
    if (loading && loadPromise) return loadPromise;
    
    // Check memory cache
    const cachedData = memoryCache.get(key);
    if (cachedData !== null) {
      cached = cachedData as T;
      return cached;
    }
    
    // Load data
    loading = true;
    loadPromise = loadFunction();
    
    try {
      const result = await loadPromise;
      cached = result;
      memoryCache.set(key, result);
      return result;
    } finally {
      loading = false;
      loadPromise = null;
    }
  };
}

// Performance monitoring
export class PerformanceMonitor {
  private static metrics = new Map<string, { startTime: number; endTime?: number }>();

  static start(operationName: string): void {
    this.metrics.set(operationName, { startTime: Date.now() });
    console.log(`⏱️ Performance: Started ${operationName}`);
  }

  static end(operationName: string): number {
    const metric = this.metrics.get(operationName);
    if (!metric) {
      console.warn(`⏱️ Performance: Operation ${operationName} not found`);
      return 0;
    }

    const endTime = Date.now();
    const duration = endTime - metric.startTime;
    
    metric.endTime = endTime;
    console.log(`⏱️ Performance: ${operationName} took ${duration}ms`);
    
    return duration;
  }

  static getMetrics(): Array<{ name: string; duration: number }> {
    return Array.from(this.metrics.entries())
      .filter(([, metric]) => metric.endTime)
      .map(([name, metric]) => ({
        name,
        duration: metric.endTime! - metric.startTime,
      }))
      .sort((a, b) => b.duration - a.duration);
  }

  static reset(): void {
    this.metrics.clear();
    console.log('⏱️ Performance: Metrics reset');
  }
}

// Network optimization
export function optimizeNetworkRequest(request: any): any {
  return {
    ...request,
    timeout: PERFORMANCE_CONFIG.REQUEST_TIMEOUT,
    retry: PERFORMANCE_CONFIG.RETRY_ATTEMPTS,
    cache: true,
  };
}

// Virtual list helper
export function shouldVirtualizeList(itemCount: number): boolean {
  return itemCount > PERFORMANCE_CONFIG.LIST_VIRTUALIZATION_THRESHOLD;
}

// Memory cleanup utility
export function cleanupMemory(): void {
  // Clear expired cache entries
  memoryCache.clear();
  
  // Force garbage collection if available (development only)
  if (__DEV__ && global.gc) {
    global.gc();
    console.log('🧹 Memory: Forced garbage collection');
  }
  
  console.log('🧹 Memory: Cleanup completed');
}

// Bundle size optimization - code splitting helper
export function lazyImport<T>(
  importFunction: () => Promise<{ default: T }>
): () => Promise<T> {
  return async () => {
    const module = await importFunction();
    return module.default;
  };
}

// Performance optimization for React components
export function shouldComponentUpdate(
  prevProps: any,
  nextProps: any,
  keys: string[]
): boolean {
  for (const key of keys) {
    if (prevProps[key] !== nextProps[key]) {
      return true;
    }
  }
  return false;
}

// Storage optimization
export class OptimizedStorage {
  static async setItem(key: string, value: any): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await AsyncStorage.setItem(key, serialized);
      
      // Also cache in memory for faster access
      memoryCache.set(key, value);
    } catch (error) {
      console.error('Storage error:', error);
    }
  }

  static async getItem<T>(key: string): Promise<T | null> {
    try {
      // Check memory cache first
      const cached = memoryCache.get(key);
      if (cached) return cached;
      
      // Fallback to AsyncStorage
      const stored = await AsyncStorage.getItem(key);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      
      // Cache in memory for next time
      memoryCache.set(key, parsed);
      
      return parsed;
    } catch (error) {
      console.error('Storage retrieval error:', error);
      return null;
    }
  }

  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      
      // Also remove from memory cache
      if (memoryCache.has(key)) {
        memoryCache.clear();
      }
    } catch (error) {
      console.error('Storage removal error:', error);
    }
  }
}

// Platform-specific optimizations
export const PlatformOptimizations = {
  // iOS specific optimizations
  ios: {
    enableHermes: true,
    optimizeImages: true,
    useNativeDriver: false, // Disabled for web compatibility
  },
  
  // Android specific optimizations
  android: {
    enableHermes: true,
    useProguard: true,
    optimizeImages: true,
    useNativeDriver: false, // Disabled for web compatibility
  },
  
  // Web specific optimizations
  web: {
    enableServiceWorker: true,
    useWebAssembly: false,
    optimizeBundleSize: true,
    lazyLoadComponents: true,
  },
};

// Get current platform optimizations
export function getCurrentPlatformOptimizations() {
  if (Platform.OS === 'ios') return PlatformOptimizations.ios;
  if (Platform.OS === 'android') return PlatformOptimizations.android;
  return PlatformOptimizations.web;
}

// Performance startup check
export function initializePerformanceOptimizations(): void {
  console.log('🚀 Performance: Initializing optimizations...');
  
  // Clear any expired cache entries on startup
  memoryCache.clear();
  
  // Log platform-specific optimizations
  const platformOpts = getCurrentPlatformOptimizations();
  console.log('🚀 Performance: Platform optimizations:', platformOpts);
  
  // Start performance monitoring
  PerformanceMonitor.start('app_initialization');
  
  console.log('🚀 Performance: Optimizations initialized');
}

// Export all utilities
export default {
  memoryCache,
  debounce,
  throttle,
  optimizeImageSize,
  batchProcess,
  createLazyLoader,
  PerformanceMonitor,
  optimizeNetworkRequest,
  shouldVirtualizeList,
  cleanupMemory,
  lazyImport,
  shouldComponentUpdate,
  OptimizedStorage,
  initializePerformanceOptimizations,
  getCurrentPlatformOptimizations,
}; 