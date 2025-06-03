import 'expo-router/entry';
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Slot } from 'expo-router';
import { initializePlatformServices, getServiceStatusSummary } from './services/platformValidator';

// Performance monitoring
const startTime = Date.now();

export default function App() {
  // Initialize platform services and log app startup time
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize platform-specific services
        await initializePlatformServices();
        
        // Log service status
        const statusSummary = await getServiceStatusSummary();
        console.log('🔧 Service Status Summary:');
        console.log(statusSummary);
        
        // Log app startup time
        const loadTime = Date.now() - startTime;
        console.log(`✅ App loaded in ${loadTime}ms`);
      } catch (error) {
        console.error('❌ App initialization failed:', error);
      }
    };

    initializeApp();
  }, []);

  return <Slot />;
}
