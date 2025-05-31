import { useState, useCallback } from 'react';
import { useSnackbar } from './useSnackbar';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
}

export function useApi<T>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });
  const { showSnackbar } = useSnackbar();

  const fetchData = useCallback(async (
    url: string,
    options: RequestInit = {},
    onSuccess?: (data: T) => void,
    onError?: (error: string) => void
  ) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<T> = await response.json();
      
      setState({
        data: result.data,
        loading: false,
        error: null,
      });

      if (result.message) {
        showSnackbar(result.message, 'success');
      }

      if (onSuccess) {
        onSuccess(result.data);
      }

      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      showSnackbar(errorMessage, 'error');

      if (onError) {
        onError(errorMessage);
      }

      throw error;
    }
  }, [showSnackbar]);

  const postData = useCallback(async (
    url: string,
    body: any,
    options: RequestInit = {},
    onSuccess?: (data: T) => void,
    onError?: (error: string) => void
  ) => {
    return fetchData(
      url,
      {
        ...options,
        method: 'POST',
        body: JSON.stringify(body),
      },
      onSuccess,
      onError
    );
  }, [fetchData]);

  const putData = useCallback(async (
    url: string,
    body: any,
    options: RequestInit = {},
    onSuccess?: (data: T) => void,
    onError?: (error: string) => void
  ) => {
    return fetchData(
      url,
      {
        ...options,
        method: 'PUT',
        body: JSON.stringify(body),
      },
      onSuccess,
      onError
    );
  }, [fetchData]);

  const deleteData = useCallback(async (
    url: string,
    options: RequestInit = {},
    onSuccess?: (data: T) => void,
    onError?: (error: string) => void
  ) => {
    return fetchData(
      url,
      {
        ...options,
        method: 'DELETE',
      },
      onSuccess,
      onError
    );
  }, [fetchData]);

  return {
    ...state,
    fetchData,
    postData,
    putData,
    deleteData,
  };
} 