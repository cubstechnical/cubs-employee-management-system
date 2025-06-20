import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import {
  Banner,
  Button,
  Card,
  Text,
  IconButton,
  Surface,
  Portal,
  Modal,
  Switch,
  List,
  Divider,
} from 'react-native-paper';
import { getDeviceInfo, platformUtils } from '../utils/mobileUtils';

interface PWAInstallBannerProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

// PWA Install Banner Component
export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({
  onInstall,
  onDismiss,
}) => {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (!platformUtils.isWeb) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the install banner
      setShowBanner(true);
    };

    const handleAppInstalled = () => {
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;

    if (!isStandalone && !isIOSStandalone) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      onInstall?.();
    }

    // Clear the stored prompt
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    onDismiss?.();
  };

  if (!platformUtils.isWeb || !showBanner) {
    return null;
  }

  return (
    <Banner
      visible={showBanner}
      actions={[
        {
          label: 'Install',
          onPress: handleInstallClick,
        },
        {
          label: 'Later',
          onPress: handleDismiss,
        },
      ]}
      icon="download"
    >
      Install CUBS Employee Management as an app for better experience!
    </Banner>
  );
};

// Offline Status Component
export const OfflineStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (!platformUtils.isWeb) return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <Banner
      visible={!isOnline}
      icon="wifi-off"
      style={styles.offlineBanner}
    >
      You're currently offline. Some features may not be available.
    </Banner>
  );
};

// App Update Notification
export const AppUpdateNotification: React.FC = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!platformUtils.isWeb || !('serviceWorker' in navigator)) return;

    const checkForUpdates = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        setRegistration(registration);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setShowUpdate(true);
              }
            });
          }
        });

        // Check for waiting service worker
        if (registration.waiting) {
          setShowUpdate(true);
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    };

    checkForUpdates();
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  if (!showUpdate) return null;

  return (
    <Banner
      visible={showUpdate}
      actions={[
        {
          label: 'Update',
          onPress: handleUpdate,
        },
        {
          label: 'Later',
          onPress: () => setShowUpdate(false),
        },
      ]}
      icon="update"
    >
      A new version is available. Update now for the latest features!
    </Banner>
  );
};

// PWA Features Modal
interface PWAFeaturesProps {
  visible: boolean;
  onDismiss: () => void;
}

export const PWAFeaturesModal: React.FC<PWAFeaturesProps> = ({
  visible,
  onDismiss,
}) => {
  const { isPhone } = getDeviceInfo();

  const features = [
    {
      icon: 'download',
      title: 'Install as App',
      description: 'Add to your home screen for quick access',
    },
    {
      icon: 'wifi-off',
      title: 'Offline Support',
      description: 'View data even when you\'re offline',
    },
    {
      icon: 'bell',
      title: 'Push Notifications',
      description: 'Get notified about important updates',
    },
    {
      icon: 'cached',
      title: 'Fast Loading',
      description: 'Data is cached for instant access',
    },
    {
      icon: 'sync',
      title: 'Background Sync',
      description: 'Changes sync when connection returns',
    },
  ];

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContainer,
          isPhone && styles.modalContainerMobile,
        ]}
      >
        <Surface style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text variant="headlineSmall">App Features</Text>
            <IconButton icon="close" onPress={onDismiss} />
          </View>

          <Divider />

          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <List.Item
                key={index}
                title={feature.title}
                description={feature.description}
                left={() => <List.Icon icon={feature.icon} />}
                style={styles.featureItem}
              />
            ))}
          </View>

          <View style={styles.modalActions}>
            <Button mode="contained" onPress={onDismiss}>
              Got it!
            </Button>
          </View>
        </Surface>
      </Modal>
    </Portal>
  );
};

// Background Sync Status
export const BackgroundSyncStatus: React.FC = () => {
  const [pendingSync, setPendingSync] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    // Check for pending changes in localStorage
    const checkPendingChanges = () => {
      if (!platformUtils.isWeb) return;

      const pendingChanges = localStorage.getItem('pendingChanges');
      setPendingSync(!!pendingChanges);

      const lastSyncTime = localStorage.getItem('lastSync');
      if (lastSyncTime) {
        setLastSync(new Date(lastSyncTime));
      }
    };

    checkPendingChanges();

    // Listen for storage changes
    const handleStorageChange = () => {
      checkPendingChanges();
    };

    if (platformUtils.isWeb) {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  if (!pendingSync && !lastSync) return null;

  return (
    <Card style={styles.syncStatus}>
      <Card.Content>
        <View style={styles.syncStatusContent}>
          <View style={{ flex: 1 }}>
            {pendingSync ? (
              <>
                <Text variant="titleSmall">Sync Pending</Text>
                <Text variant="bodySmall">
                  Changes will sync when connection is restored
                </Text>
              </>
            ) : (
              <>
                <Text variant="titleSmall">Synced</Text>
                <Text variant="bodySmall">
                  Last updated: {lastSync?.toLocaleTimeString()}
                </Text>
              </>
            )}
          </View>
          <IconButton
            icon={pendingSync ? 'sync' : 'check-circle'}
            iconColor={pendingSync ? '#f59e0b' : '#22c55e'}
          />
        </View>
      </Card.Content>
    </Card>
  );
};

// Cache Management Component
export const CacheManager: React.FC = () => {
  const [cacheSize, setCacheSize] = useState<string>('0 MB');
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    estimateCacheSize();
  }, []);

  const estimateCacheSize = async () => {
    if (!platformUtils.isWeb || !('storage' in navigator)) return;

    try {
      const estimate = await navigator.storage.estimate();
      const sizeInMB = ((estimate.usage || 0) / 1024 / 1024).toFixed(2);
      setCacheSize(`${sizeInMB} MB`);
    } catch (error) {
      console.error('Error estimating cache size:', error);
    }
  };

  const clearCache = async () => {
    if (!platformUtils.isWeb) return;

    setClearing(true);
    try {
      // Clear various caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // Clear localStorage (except important data)
      const keysToKeep = ['authToken', 'userPreferences'];
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });

      setCacheSize('0 MB');
    } catch (error) {
      console.error('Error clearing cache:', error);
    } finally {
      setClearing(false);
    }
  };

  return (
    <Card style={styles.cacheManager}>
      <Card.Content>
        <Text variant="titleSmall">Storage</Text>
        <Text variant="bodySmall" style={{ marginTop: 4 }}>
          Cache size: {cacheSize}
        </Text>
      </Card.Content>
      <Card.Actions>
        <Button
          mode="outlined"
          onPress={clearCache}
          loading={clearing}
          disabled={clearing}
          compact
        >
          Clear Cache
        </Button>
      </Card.Actions>
    </Card>
  );
};

const styles = StyleSheet.create({
  offlineBanner: {
    backgroundColor: '#fef3c7',
  },
  modalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainerMobile: {
    padding: 16,
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxWidth: 500,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  featuresContainer: {
    paddingVertical: 8,
  },
  featureItem: {
    paddingHorizontal: 16,
  },
  modalActions: {
    padding: 16,
    alignItems: 'flex-end',
  },
  syncStatus: {
    margin: 8,
  },
  syncStatusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cacheManager: {
    margin: 8,
  },
});

export default {
  PWAInstallBanner,
  OfflineStatus,
  AppUpdateNotification,
  PWAFeaturesModal,
  BackgroundSyncStatus,
  CacheManager,
}; 