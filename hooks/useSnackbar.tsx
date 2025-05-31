import React, { useState, useCallback } from 'react';
import { Snackbar } from 'react-native-paper';

interface SnackbarState {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

export const useSnackbar = () => {
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    visible: false,
    message: '',
    type: 'info',
  });

  const showSnackbar = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setSnackbar({ visible: true, message, type });
  }, []);

  const hideSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, visible: false }));
  }, []);

  const SnackbarComponent = () => (
    <Snackbar
      visible={snackbar.visible}
      onDismiss={hideSnackbar}
      duration={3000}
      style={{
        backgroundColor: 
          snackbar.type === 'success' ? '#4CAF50' :
          snackbar.type === 'error' ? '#F44336' :
          '#2196F3'
      }}
    >
      {snackbar.message}
    </Snackbar>
  );

  return {
    showSnackbar,
    hideSnackbar,
    SnackbarComponent,
  };
}; 
