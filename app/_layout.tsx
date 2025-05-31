import React from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundaryWrapper } from '../components/ErrorBoundary';
import { ThemeProvider } from '../components/ThemeProvider';

export default function RootLayout() {
  return (
    <ErrorBoundaryWrapper>
      <SafeAreaProvider>
        <ThemeProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <StatusBar style="auto" />
            <Slot />
          </GestureHandlerRootView>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundaryWrapper>
  );
} 