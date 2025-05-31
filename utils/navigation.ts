import { useRouter, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';

export const useSafeNavigation = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if navigation is ready
    if (navigation && router) {
      setIsReady(true);
    }
  }, [navigation, router]);

  const navigate = (route: string) => {
    if (!isReady) {
      console.warn('Navigation is not ready yet');
      return;
    }

    if (!route) {
      console.warn('Navigation route is undefined');
      return;
    }

    try {
      // Use replace for auth flows and push for regular navigation
      if (route.includes('(auth)')) {
        router.replace(route as any);
      } else {
        router.push(route as any);
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const goBack = () => {
    if (!isReady) {
      console.warn('Navigation is not ready yet');
      return;
    }

    try {
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Go back error:', error);
    }
  };

  return {
    navigate,
    goBack,
    isReady,
  };
}; 