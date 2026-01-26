import { renderHook, waitFor } from '@testing-library/react';
import { useFetch } from '@/hooks/useFetch';
import { mockInstagramAccount, mockApiResponse } from '../utils/test-data';

// Mock useSWR
jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock the API module
jest.mock('@/utils/api', () => ({
  get: jest.fn(),
}));

import useSWR from 'swr';
import { get } from '@/utils/api';

describe('useFetch Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch data successfully', async () => {
    const mockData = mockInstagramAccount;
    const mockResponse = mockApiResponse(mockData);

    (useSWR as jest.Mock).mockReturnValue({
      data: mockResponse,
      error: undefined,
      isValidating: false,
      mutate: jest.fn(),
    });

    const { result } = renderHook(() => useFetch('/accounts'));

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle loading state', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isValidating: true,
      mutate: jest.fn(),
    });

    const { result } = renderHook(() => useFetch('/accounts'));

    expect(result.current.isLoading).toBe(true);
  });

  it('should handle error state', () => {
    const error = new Error('Failed to fetch');

    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error,
      isValidating: false,
      mutate: jest.fn(),
    });

    const { result } = renderHook(() => useFetch('/accounts'));

    expect(result.current.error).toEqual(error);
    expect(result.current.isLoading).toBe(false);
  });

  it('should not fetch when url is null', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isValidating: false,
      mutate: jest.fn(),
    });

    const { result } = renderHook(() => useFetch(null));

    expect(result.current.data).toBeUndefined();
    expect(useSWR).toHaveBeenCalledWith(null, expect.any(Function), expect.any(Object));
  });

  it('should not fetch when enabled is false', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isValidating: false,
      mutate: jest.fn(),
    });

    const { result } = renderHook(() => useFetch('/accounts', { enabled: false }));

    expect(useSWR).toHaveBeenCalledWith(null, expect.any(Function), expect.any(Object));
  });

  it('should return mutate function', () => {
    const mutateMock = jest.fn();
    const mockResponse = mockApiResponse(mockInstagramAccount);

    (useSWR as jest.Mock).mockReturnValue({
      data: mockResponse,
      error: undefined,
      isValidating: false,
      mutate: mutateMock,
    });

    const { result } = renderHook(() => useFetch('/accounts'));

    expect(result.current.mutate).toEqual(mutateMock);
  });

  it('should handle validating state', () => {
    const mockResponse = mockApiResponse(mockInstagramAccount);

    (useSWR as jest.Mock).mockReturnValue({
      data: mockResponse,
      error: undefined,
      isValidating: true,
      mutate: jest.fn(),
    });

    const { result } = renderHook(() => useFetch('/accounts'));

    expect(result.current.isValidating).toBe(true);
  });
});