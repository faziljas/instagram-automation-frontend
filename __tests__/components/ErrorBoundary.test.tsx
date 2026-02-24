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
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Oops! Something went wrong/)).toBeInTheDocument();
    spy.mockRestore();
  });

  it('should show error details in development mode', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const originalEnv = process.env.NODE_ENV;
    const env = process.env as Record<string, string | undefined>;
    env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Error Details/)).toBeInTheDocument();

    env.NODE_ENV = originalEnv as string;
    spy.mockRestore();
  });

  it('should render custom fallback when provided', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary fallback={<div>Custom error UI</div>}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('should show refresh button', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Refresh Page/)).toBeInTheDocument();
    spy.mockRestore();
  });

  it('should show go to dashboard button', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Go to Dashboard/)).toBeInTheDocument();
    spy.mockRestore();
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
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <SectionErrorBoundary sectionName="test section">
        <ThrowError />
      </SectionErrorBoundary>
    );

    expect(screen.getByText(/Failed to load test section/)).toBeInTheDocument();
    spy.mockRestore();
  });

  it('should show retry button', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <SectionErrorBoundary>
        <ThrowError />
      </SectionErrorBoundary>
    );

    expect(screen.getByText(/Retry/)).toBeInTheDocument();
    spy.mockRestore();
  });
});