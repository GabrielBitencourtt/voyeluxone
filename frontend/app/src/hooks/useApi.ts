import { useState } from 'react';
import { api } from '@/services/api';
import { AxiosRequestConfig } from 'axios';

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

export function useApi<T = any>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const execute = async (config: AxiosRequestConfig): Promise<T> => {
    setState({ data: null, isLoading: true, error: null });
    try {
      const response = await api.request<T>(config);
      setState({ data: response.data, isLoading: false, error: null });
      return response.data;
    } catch (error: any) {
      setState({ data: null, isLoading: false, error });
      throw error;
    }
  };

  return { ...state, execute };
}