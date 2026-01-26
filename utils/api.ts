import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { supabase } from '@/lib/supabase';

// Create Axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 120000, // 120 seconds - increased for Instagram authentication
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Inject Supabase JWT token
api.interceptors.request.use(
  async (config) => {
    // Get token from Supabase session
    if (typeof window !== 'undefined') {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Explicitly check for valid token (not null, undefined, or empty string)
        const accessToken = session?.access_token;
        const isValidToken = accessToken && 
                            typeof accessToken === 'string' && 
                            accessToken.trim() !== '' &&
                            accessToken.toLowerCase() !== 'null' &&
                            accessToken.toLowerCase() !== 'undefined';
        
        if (isValidToken) {
          // Validate token format before sending (JWT should have 3 parts)
          const tokenParts = accessToken.split('.');
          if (tokenParts.length === 3 && tokenParts.every(part => part.length > 0)) {
            config.headers.Authorization = `Bearer ${accessToken}`;
          } else {
            console.warn('[API Interceptor] Invalid token format, skipping Authorization header', {
              parts: tokenParts.length,
              tokenLength: accessToken.length,
              tokenPreview: accessToken.substring(0, 20)
            });
            // Don't set Authorization header if token is invalid
          }
        } else {
          // Log why token was rejected
          if (!session) {
            console.warn('[API Interceptor] No active session found');
          } else if (!accessToken) {
            console.warn('[API Interceptor] Session exists but access_token is missing or null');
          } else if (typeof accessToken !== 'string') {
            console.warn('[API Interceptor] access_token is not a string:', typeof accessToken);
          } else if (accessToken.trim() === '') {
            console.warn('[API Interceptor] access_token is empty string');
          }
          // Don't set Authorization header if no valid token
        }
      } catch (error) {
        console.error('[API Interceptor] Error getting Supabase session:', error);
        // Don't set Authorization header on error
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    console.log('[API Interceptor] Error:', {
      status: error.response?.status,
      url: originalRequest.url,
      data: error.response?.data,
    });

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Don't redirect if this is a sync-user request - let the auth context handle the error
      const isAuthRequest = originalRequest.url?.includes('/auth/sync-user');
      
      console.log('[API Interceptor] Is auth request?', isAuthRequest);
      
      if (!isAuthRequest && !originalRequest._retry) {
        // Only redirect for authenticated routes with expired tokens
        console.log('[API Interceptor] Redirecting to login');
        if (typeof window !== 'undefined') {
          // Sign out from Supabase
          await supabase.auth.signOut();
          window.location.href = '/login';
        }
        return Promise.reject(new Error('Session expired. Please login again.'));
      }
    }

    // Handle other errors
    // Backend returns: { detail: "Error message" }
    const errorMessage = 
      error.response?.data?.detail || 
      error.response?.data?.message || 
      error.message || 
      'An error occurred';
    
    console.log('[API Interceptor] Throwing error:', errorMessage);
    return Promise.reject(new Error(errorMessage));
  }
);

// Transform snake_case to camelCase for user objects
function transformUserResponse(data: any): any {
  if (data && typeof data === 'object') {
    if (data.first_name !== undefined || data.last_name !== undefined) {
      return {
        ...data,
        firstName: data.first_name,
        lastName: data.last_name,
      };
    }
  }
  return data;
}

// Generic GET method
export async function get<T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await api.get<T>(url, config);
  return transformUserResponse(response.data);
}

// Generic POST method
export async function post<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await api.post<T>(url, data, config);
  return response.data;
}

// Generic PUT method
export async function put<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await api.put<T>(url, data, config);
  return transformUserResponse(response.data);
}

// Generic DELETE method
export async function del<T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await api.delete<T>(url, config);
  return response.data;
}

// Export axios instance for direct use if needed
export default api;
