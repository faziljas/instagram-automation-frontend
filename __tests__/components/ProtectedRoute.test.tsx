import { render, screen, waitFor, act } from '@testing-library/react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useRouter } from 'next/navigation';

const mockGetSession = jest.fn();
const mockOnAuthStateChange = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
        mockOnAuthStateChange(callback);
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      },
    },
  },
}));

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockImplementation((cb: (e: string, s: unknown) => void) => {
      setTimeout(() => cb('INITIAL_SESSION', null), 0);
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });
  });

  it('should render children when authenticated', async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'token', user: { id: '123' } } },
    });
    mockOnAuthStateChange.mockImplementation(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    }));

    await act(async () => {
      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('should show loading state when checking authentication', async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    mockGetSession.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: { session: null } }), 100))
    );

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockImplementation((cb: (e: string, s: unknown) => void) => {
      setTimeout(() => cb('INITIAL_SESSION', null), 0);
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });

    await act(async () => {
      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('should not render children when not authenticated and loading is false', async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockImplementation((cb: (e: string, s: unknown) => void) => {
      setTimeout(() => cb('INITIAL_SESSION', null), 0);
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });

    await act(async () => {
      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
