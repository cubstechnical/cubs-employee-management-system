import { useEffect } from 'react';
import { Platform } from 'react-native';
// import * as SplashScreen from 'expo-splash-screen';

// Prevent the splash screen from auto-hiding
// SplashScreen.preventAutoHideAsync().catch(() => {
//   // Ignore errors
// });

export function useFrameworkReady() {
  useEffect(() => {
    async function prepare() {
      try {
        // Add any additional initialization logic here
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for stability
      } catch (e) {
        console.warn(e);
      } finally {
        // Hide the splash screen
        if (Platform.OS !== 'web') {
          // await SplashScreen.hideAsync();
        }
      }
    }

    prepare();
  }, []);
}