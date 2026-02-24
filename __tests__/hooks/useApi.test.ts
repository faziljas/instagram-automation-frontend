import { renderHook, act, waitFor } from '@testing-library/react';
import { useApi, usePost, usePut, useDelete } from '@/hooks/useApi';
// Mock the API module
jest.mock('@/utils/api', () => ({
  post: jest.fn(),
  put: jest.fn(),
  del: jest.fn(),
}));

import { post, put, del } from '@/utils/api';

describe('useApi Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('usePost', () => {
    it('should initialize with null data and false loading', () => {
      const { result } = renderHook(() => usePost());

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should execute POST request successfully', async () => {
      const mockData = { id: '1', name: 'Test' };
      (post as jest.Mock).mockResolvedValue(mockData);

      const { result } = renderHook(() => usePost());

      let response;
      await act(async () => {
        response = await result.current.execute('/test', { name: 'Test' });
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
        expect(result.current.loading).toBe(false);
      });

      expect(response).toEqual(mockData);
      expect(post).toHaveBeenCalledWith('/test', { name: 'Test' });
    });

    it('should handle POST request error', async () => {
      (post as jest.Mock).mockRejectedValue(new Error('Request failed'));

      const { result } = renderHook(() => usePost());

      await act(async () => {
        try {
          await result.current.execute('/test', { name: 'Test' });
        } catch {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
        expect(result.current.loading).toBe(false);
      });
    });

    it('should reset state', async () => {
      const mockData = { id: '1', name: 'Test' };
      (post as jest.Mock).mockResolvedValue(mockData);

      const { result } = renderHook(() => usePost());

      await act(async () => {
        await result.current.execute('/test', {});
      });

      await waitFor(() => {
        expect(result.current.data).toBeTruthy();
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  describe('usePut', () => {
    it('should execute PUT request successfully', async () => {
      const mockData = { id: '1', name: 'Updated' };
      (put as jest.Mock).mockResolvedValue(mockData);

      const { result } = renderHook(() => usePut());

      await act(async () => {
        await result.current.execute('/test/1', { name: 'Updated' });
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });

      expect(put).toHaveBeenCalledWith('/test/1', { name: 'Updated' });
    });
  });

  describe('useDelete', () => {
    it('should execute DELETE request successfully', async () => {
      const mockData = { success: true };
      (del as jest.Mock).mockResolvedValue(mockData);

      const { result } = renderHook(() => useDelete());

      await act(async () => {
        await result.current.execute('/test/1');
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });

      expect(del).toHaveBeenCalledWith('/test/1');
    });
  });

  describe('useApi', () => {
    it('should default to POST method', async () => {
      const mockData = { id: '1' };
      (post as jest.Mock).mockResolvedValue(mockData);

      const { result } = renderHook(() => useApi());

      await act(async () => {
        await result.current.execute('/test', {});
      });

      expect(post).toHaveBeenCalled();
    });

    it('should support custom method', async () => {
      const mockData = { success: true };
      (del as jest.Mock).mockResolvedValue(mockData);

      const { result } = renderHook(() => useApi('DELETE'));

      await act(async () => {
        await result.current.execute('/test/1');
      });

      expect(del).toHaveBeenCalled();
    });
  });
});