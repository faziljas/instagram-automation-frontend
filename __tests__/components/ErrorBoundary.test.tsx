import { render, screen } from '../utils/test-utils';
import { ErrorBoundary, SectionErrorBoundary } from '@/components/ErrorBoundary';

// Component that throws an error
const ThrowError = () => {
  throw new Error('Test error');
};

// Component that renders normally
const NormalComponent = () => <div>Normal content</div>;

describe('ErrorBoundary Component', () => {
  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <NormalComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('should render error UI when child throws error', () => {
    // Suppress console.error for this test
    jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Oops! Something went wrong/)).toBeInTheDocument();
    console.error.mockRestore();
  });

  it('should show error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Error Details/)).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
    console.error.mockRestore();
  });

  it('should render custom fallback when provided', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary fallback={<div>Custom error UI</div>}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
    console.error.mockRestore();
  });

  it('should show refresh button', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Refresh Page/)).toBeInTheDocument();
    console.error.mockRestore();
  });

  it('should show go to dashboard button', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Go to Dashboard/)).toBeInTheDocument();
    console.error.mockRestore();
  });
});

describe('SectionErrorBoundary Component', () => {
  it('should render children when there is no error', () => {
    render(
      <SectionErrorBoundary>
        <NormalComponent />
      </SectionErrorBoundary>
    );
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('should render error UI for section', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <SectionErrorBoundary sectionName="test section">
        <ThrowError />
      </SectionErrorBoundary>
    );

    expect(screen.getByText(/Failed to load test section/)).toBeInTheDocument();
    console.error.mockRestore();
  });

  it('should show retry button', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <SectionErrorBoundary>
        <ThrowError />
      </SectionErrorBoundary>
    );

    expect(screen.getByText(/Retry/)).toBeInTheDocument();
    console.error.mockRestore();
  });
});