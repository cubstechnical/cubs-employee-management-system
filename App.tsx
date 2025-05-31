import 'expo-router/entry';
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Slot } from 'expo-router';

// Performance monitoring
const startTime = Date.now();

export default function App() {
  // Log app startup time
  useEffect(() => {
    const loadTime = Date.now() - startTime;
    console.log(`App loaded in ${loadTime}ms`);
  }, []);

  return <Slot />;
}
