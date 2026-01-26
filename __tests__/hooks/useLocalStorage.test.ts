import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

describe('useLocalStorage Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with provided value', () => {
    const { result } = renderHook(() => useLocalStorage('test', 'initial'));
    expect(result.current[0]).toBe('initial');
  });

  it('should read from localStorage if key exists', () => {
    localStorage.setItem('existing', JSON.stringify('stored'));
    const { result } = renderHook(() => useLocalStorage('existing', 'default'));
    expect(result.current[0]).toBe('stored');
  });

  it('should persist value to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(localStorage.getItem('test')).toBe(JSON.stringify('updated'));
    expect(result.current[0]).toBe('updated');
  });

  it('should handle objects', () => {
    const testObj = { key: 'value' };
    const { result } = renderHook(() => useLocalStorage('obj', {}));

    act(() => {
      result.current[1](testObj);
    });

    expect(result.current[0]).toEqual(testObj);
    expect(localStorage.getItem('obj')).toBe(JSON.stringify(testObj));
  });

  it('should remove value from localStorage', () => {
    localStorage.setItem('test', JSON.stringify('value'));
    const { result } = renderHook(() => useLocalStorage('test', 'initial'));

    act(() => {
      result.current[2](); // Call removeValue
    });

    expect(localStorage.getItem('test')).toBeNull();
    expect(result.current[0]).toBe('initial');
  });

  it('should handle rapid updates', () => {
    const { result } = renderHook(() => useLocalStorage('test', 0));

    act(() => {
      result.current[1](1);
      result.current[1](2);
      result.current[1](3);
    });

    expect(result.current[0]).toBe(3);
    expect(localStorage.getItem('test')).toBe('3');
  });

  it('should handle function updates', () => {
    const { result } = renderHook(() => useLocalStorage('counter', 0));

    act(() => {
      result.current[1]((prev: number) => prev + 1);
    });

    expect(result.current[0]).toBe(1);
  });

  it('should handle errors gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    const { result } = renderHook(() => useLocalStorage('test', 'initial'));

    act(() => {
      result.current[1]('value');
    });

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});