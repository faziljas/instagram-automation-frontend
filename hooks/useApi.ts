import { useState } from 'react';
import { post, put, patch, del } from '@/utils/api';

interface UseApiState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (url: string, data?: unknown) => Promise<T | null>;
  reset: () => void;
}

type ApiMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

function useApiMethod<T = unknown>(method: ApiMethod): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    error: null,
    loading: false,
  });

  const execute = async (url: string, data?: unknown): Promise<T | null> => {
    setState({ data: null, error: null, loading: true });

    try {
      let response: T;

      switch (method) {
        case 'POST':
          response = await post<T>(url, data);
          break;
        case 'PUT':
          response = await put<T>(url, data);
          break;
        case 'PATCH':
          response = await patch<T>(url, data);
          break;
        case 'DELETE':
          response = await del<T>(url);
          break;
      }

      setState({ data: response, error: null, loading: false });
      return response;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      setState({ data: null, error: err, loading: false });
      throw err;
    }
  };

  const reset = () => {
    setState({ data: null, error: null, loading: false });
  };

  return {
    ...state,
    execute,
    reset,
  };
}

export function usePost<T = unknown>(): UseApiReturn<T> {
  return useApiMethod<T>('POST');
}

export function usePut<T = unknown>(): UseApiReturn<T> {
  return useApiMethod<T>('PUT');
}

export function usePatch<T = unknown>(): UseApiReturn<T> {
  return useApiMethod<T>('PATCH');
}

export function useDelete<T = unknown>(): UseApiReturn<T> {
  return useApiMethod<T>('DELETE');
}

// Generic useApi hook that defaults to POST
export function useApi<T = unknown>(method: ApiMethod = 'POST'): UseApiReturn<T> {
  return useApiMethod<T>(method);
}
