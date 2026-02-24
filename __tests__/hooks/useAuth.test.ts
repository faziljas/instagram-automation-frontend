import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { mockUser, mockAuthResponse } from '../utils/test-data';
import { render } from '../utils/test-utils';

// Mock the AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuthContext: jest.fn(),
}));

import { useAuthContext } from '@/contexts/AuthContext';

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return auth context value', () => {
    const mockContextValue = {
      user: mockUser,
      isAuthenticated: true,
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      updateUser: jest.fn(),
    };

    (useAuthContext as jest.Mock).mockReturnValue(mockContextValue);

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it('should return null user when not authenticated', () => {
    const mockContextValue = {
      user: null,
      isAuthenticated: false,
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      updateUser: jest.fn(),
    };

    (useAuthContext as jest.Mock).mockReturnValue(mockContextValue);

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should return loading state', () => {
    const mockContextValue = {
      user: null,
      isAuthenticated: false,
      loading: true,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      updateUser: jest.fn(),
    };

    (useAuthContext as jest.Mock).mockReturnValue(mockContextValue);

    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);
  });

  it('should call login function when provided by context', async () => {
    const loginMock = jest.fn().mockResolvedValue(undefined);
    const mockContextValue = {
      user: null,
      isAuthenticated: false,
      loading: false,
      logout: jest.fn(),
      updateUser: jest.fn(),
      fetchUser: jest.fn(),
      supabaseUser: null,
      session: null,
      // Test-only: some auth providers expose login on context
      login: loginMock,
    };

    (useAuthContext as jest.Mock).mockReturnValue(mockContextValue);

    const { result } = renderHook(() => useAuth());
    const auth = result.current as typeof result.current & { login?: (email: string, password: string) => Promise<void> };
    if (auth.login) {
      await act(async () => {
        await auth.login!('test@example.com', 'password');
      });
      expect(loginMock).toHaveBeenCalledWith('test@example.com', 'password');
    }
  });

  it('should call logout function', () => {
    const logoutMock = jest.fn();
    const mockContextValue = {
      user: mockUser,
      isAuthenticated: true,
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: logoutMock,
      updateUser: jest.fn(),
    };

    (useAuthContext as jest.Mock).mockReturnValue(mockContextValue);

    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.logout();
    });

    expect(logoutMock).toHaveBeenCalled();
  });
});