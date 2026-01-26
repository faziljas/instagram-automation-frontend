import { render, screen } from '../utils/test-utils';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';

jest.mock('@/hooks/useAuth');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

import { useRouter } from 'next/navigation';

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when authenticated', () => {
    const mockPush = jest.fn();
    
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { id: '123' },
    });

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should show loading state when checking authentication', () => {
    const mockPush = jest.fn();
    
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      loading: true,
      user: null,
    });

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', () => {
    const mockPush = jest.fn();
    
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      loading: false,
      user: null,
    });

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should not render children when not authenticated and loading is false', () => {
    const mockPush = jest.fn();
    
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      loading: false,
      user: null,
    });

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});