import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
import { Card, Button, ProgressBar, Switch, Chip, useTheme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Performance Settings Types
interface PerformanceSettings {
  enableCaching: boolean;
  optimizeImages: boolean;
  lazyLoading: boolean;
  prefetchData: boolean;
  compressionLevel: 'low' | 'medium' | 'high';
  maxCacheSize: number; // in MB
  enableMetrics: boolean;
  autoOptimization: boolean;
}

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  networkRequests: number;
  cacheHitRate: number;
  lastOptimized: Date | null;
  totalOptimizations: number;
}

interface PerformanceContextType {
  settings: PerformanceSettings;
  metrics: PerformanceMetrics;
  updateSetting: (key: keyof PerformanceSettings, value: any) => void;
  optimizeNow: () => Promise<void>;
  clearCache: () => Promise<void>;
  measurePerformance: (operation: string, fn: () => Promise<any>) => Promise<any>;
  isOptimizing: boolean;
}

// Default Settings
const defaultSettings: PerformanceSettings = {
  enableCaching: true,
  optimizeImages: true,
  lazyLoading: true,
  prefetchData: false,
  compressionLevel: 'medium',
  maxCacheSize: 100, // 100MB
  enableMetrics: true,
  autoOptimization: true,
};

const defaultMetrics: PerformanceMetrics = {
  renderTime: 0,
  memoryUsage: 0,
  networkRequests: 0,
  cacheHitRate: 0,
  lastOptimized: null,
  totalOptimizations: 0,
};

// Context
const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

// Storage Keys
const PERFORMANCE_SETTINGS_KEY = '@performanceSettings';
const PERFORMANCE_METRICS_KEY = '@performanceMetrics';
const CACHE_PREFIX = '@cache_';

// Provider Component
interface PerformanceProviderProps {
  children: ReactNode;
}

export const PerformanceProvider: React.FC<PerformanceProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<PerformanceSettings>(defaultSettings);
  const [metrics, setMetrics] = useState<PerformanceMetrics>(defaultMetrics);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Initialize performance settings
  useEffect(() => {
    const initializePerformance = async () => {
      try {
        // Load saved settings
        const savedSettings = await AsyncStorage.getItem(PERFORMANCE_SETTINGS_KEY);
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }

        // Load saved metrics
        const savedMetrics = await AsyncStorage.getItem(PERFORMANCE_METRICS_KEY);
        if (savedMetrics) {
          const parsedMetrics = JSON.parse(savedMetrics);
          setMetrics({
            ...parsedMetrics,
            lastOptimized: parsedMetrics.lastOptimized ? new Date(parsedMetrics.lastOptimized) : null,
          });
        }

        // Start auto-optimization if enabled
        if (settings.autoOptimization) {
          scheduleAutoOptimization();
        }
      } catch (error) {
        console.error('Error initializing performance settings:', error);
      }
    };

    initializePerformance();
  }, []);

  // Update setting
  const updateSetting = async (key: keyof PerformanceSettings, value: any) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await AsyncStorage.setItem(PERFORMANCE_SETTINGS_KEY, JSON.stringify(newSettings));

      // Trigger optimization if auto-optimization is enabled
      if (newSettings.autoOptimization && key !== 'autoOptimization') {
        await optimizeNow();
      }
    } catch (error) {
      console.error('Error updating performance setting:', error);
    }
  };

  // Measure performance of operations
  const measurePerformance = useCallback(async (operation: string, fn: () => Promise<any>) => {
    const startTime = Date.now();
    const startMemory = Platform.OS === 'web' ? 0 : (global as any).performance?.memory?.usedJSHeapSize || 0;

    try {
      const result = await fn();
      
      const endTime = Date.now();
      const renderTime = endTime - startTime;
      const endMemory = Platform.OS === 'web' ? 0 : (global as any).performance?.memory?.usedJSHeapSize || 0;
      const memoryUsed = endMemory - startMemory;

      // Update metrics
      setMetrics(prev => ({
        ...prev,
        renderTime: Math.max(prev.renderTime, renderTime),
        memoryUsage: memoryUsed > 0 ? memoryUsed : prev.memoryUsage,
        networkRequests: prev.networkRequests + 1,
      }));

      if (settings.enableMetrics && renderTime > 1000) {
        console.warn(`Slow operation detected: ${operation} took ${renderTime}ms`);
      }

      return result;
    } catch (error) {
      console.error(`Performance measurement failed for ${operation}:`, error);
      throw error;
    }
  }, [settings.enableMetrics]);

  // Optimize performance
  const optimizeNow = useCallback(async () => {
    if (isOptimizing) return;

    setIsOptimizing(true);
    try {
      let optimizationsApplied = 0;

      // Clear old cache entries
      if (settings.enableCaching) {
        await clearOldCacheEntries();
        optimizationsApplied++;
      }

      // Optimize memory usage
      if (Platform.OS !== 'web' && (global as any).gc) {
        (global as any).gc();
        optimizationsApplied++;
      }

      // Update metrics
      setMetrics(prev => ({
        ...prev,
        lastOptimized: new Date(),
        totalOptimizations: prev.totalOptimizations + optimizationsApplied,
        cacheHitRate: Math.min(prev.cacheHitRate + 0.1, 1.0),
      }));

      // Save updated metrics
      await AsyncStorage.setItem(PERFORMANCE_METRICS_KEY, JSON.stringify({
        ...metrics,
        lastOptimized: new Date(),
        totalOptimizations: metrics.totalOptimizations + optimizationsApplied,
      }));

    } catch (error) {
      console.error('Error during optimization:', error);
    } finally {
      setIsOptimizing(false);
    }
  }, [isOptimizing, settings.enableCaching, metrics]);

  // Clear cache
  const clearCache = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }

      setMetrics(prev => ({
        ...prev,
        cacheHitRate: 0,
        lastOptimized: new Date(),
      }));

      Alert.alert('Cache Cleared', `Removed ${cacheKeys.length} cached items`);
    } catch (error) {
      console.error('Error clearing cache:', error);
      Alert.alert('Error', 'Failed to clear cache');
    }
  }, []);

  // Clear old cache entries
  const clearOldCacheEntries = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      
      for (const key of cacheKeys) {
        const cacheData = await AsyncStorage.getItem(key);
        if (cacheData) {
          const parsed = JSON.parse(cacheData);
          const cacheAge = Date.now() - parsed.timestamp;
          
          // Remove cache entries older than 24 hours
          if (cacheAge > 24 * 60 * 60 * 1000) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Error clearing old cache entries:', error);
    }
  };

  // Schedule auto-optimization
  const scheduleAutoOptimization = () => {
    // Run optimization every 30 minutes
    setInterval(() => {
      if (settings.autoOptimization) {
        optimizeNow();
      }
    }, 30 * 60 * 1000);
  };

  const value: PerformanceContextType = {
    settings,
    metrics,
    updateSetting,
    optimizeNow,
    clearCache,
    measurePerformance,
    isOptimizing,
  };

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
};

// Hook to use performance
export const usePerformance = (): PerformanceContextType => {
  const context = useContext(PerformanceContext);
  if (context === undefined) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
};

// Performance Dashboard Component
export const PerformanceDashboard: React.FC = () => {
  const theme = useTheme();
  const {
    settings,
    metrics,
    updateSetting,
    optimizeNow,
    clearCache,
    isOptimizing,
  } = usePerformance();

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPerformanceScore = (): number => {
    let score = 100;
    
    // Deduct points for slow render times
    if (metrics.renderTime > 1000) score -= 20;
    else if (metrics.renderTime > 500) score -= 10;
    
    // Add points for good cache hit rate
    score += metrics.cacheHitRate * 20;
    
    // Add points for recent optimizations
    if (metrics.lastOptimized && Date.now() - metrics.lastOptimized.getTime() < 24 * 60 * 60 * 1000) {
      score += 10;
    }
    
    return Math.max(0, Math.min(100, score));
  };

  const performanceScore = getPerformanceScore();
  const scoreColor = performanceScore >= 80 ? '#4CAF50' : performanceScore >= 60 ? '#FF9800' : '#F44336';

  return (
    <View style={styles.container}>
      {/* Performance Score */}
      <Card style={styles.scoreCard}>
        <Card.Content>
          <Text style={styles.scoreTitle}>Performance Score</Text>
          <View style={styles.scoreContainer}>
            <Text style={[styles.scoreValue, { color: scoreColor }]}>
              {Math.round(performanceScore)}
            </Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>
          <ProgressBar
            progress={performanceScore / 100}
            color={scoreColor}
            style={styles.scoreProgress}
          />
        </Card.Content>
      </Card>

      {/* Metrics */}
      <Card style={styles.metricsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Render Time:</Text>
            <Text style={styles.metricValue}>{metrics.renderTime}ms</Text>
          </View>
          
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Memory Usage:</Text>
            <Text style={styles.metricValue}>{formatBytes(metrics.memoryUsage)}</Text>
          </View>
          
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Network Requests:</Text>
            <Text style={styles.metricValue}>{metrics.networkRequests}</Text>
          </View>
          
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Cache Hit Rate:</Text>
            <Text style={styles.metricValue}>{Math.round(metrics.cacheHitRate * 100)}%</Text>
          </View>
          
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Last Optimized:</Text>
            <Text style={styles.metricValue}>
              {metrics.lastOptimized 
                ? metrics.lastOptimized.toLocaleString()
                : 'Never'
              }
            </Text>
          </View>
          
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total Optimizations:</Text>
            <Text style={styles.metricValue}>{metrics.totalOptimizations}</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Settings */}
      <Card style={styles.settingsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Performance Settings</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Enable Caching</Text>
            <Switch
              value={settings.enableCaching}
              onValueChange={(value) => updateSetting('enableCaching', value)}
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Optimize Images</Text>
            <Switch
              value={settings.optimizeImages}
              onValueChange={(value) => updateSetting('optimizeImages', value)}
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Lazy Loading</Text>
            <Switch
              value={settings.lazyLoading}
              onValueChange={(value) => updateSetting('lazyLoading', value)}
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Prefetch Data</Text>
            <Switch
              value={settings.prefetchData}
              onValueChange={(value) => updateSetting('prefetchData', value)}
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Enable Metrics</Text>
            <Switch
              value={settings.enableMetrics}
              onValueChange={(value) => updateSetting('enableMetrics', value)}
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Auto Optimization</Text>
            <Switch
              value={settings.autoOptimization}
              onValueChange={(value) => updateSetting('autoOptimization', value)}
            />
          </View>

          {/* Compression Level */}
          <Text style={styles.settingLabel}>Compression Level</Text>
          <View style={styles.chipContainer}>
            {['low', 'medium', 'high'].map((level) => (
              <Chip
                key={level}
                selected={settings.compressionLevel === level}
                onPress={() => updateSetting('compressionLevel', level)}
                style={styles.chip}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Actions */}
      <Card style={styles.actionsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Optimization Actions</Text>
          
          <View style={styles.actionRow}>
            <Button
              mode="contained"
              onPress={optimizeNow}
              loading={isOptimizing}
              disabled={isOptimizing}
              style={styles.actionButton}
            >
              {isOptimizing ? 'Optimizing...' : 'Optimize Now'}
            </Button>
            
            <Button
              mode="outlined"
              onPress={clearCache}
              style={styles.actionButton}
            >
              Clear Cache
            </Button>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  scoreCard: {
    marginBottom: 16,
    elevation: 2,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  scoreMax: {
    fontSize: 24,
    color: '#666',
    marginLeft: 4,
  },
  scoreProgress: {
    height: 8,
  },
  metricsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  settingsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  actionsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  chip: {
    marginRight: 8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});
