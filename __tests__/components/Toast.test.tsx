import { render, screen, waitFor, act } from '../utils/test-utils';
import { useToast } from '@/components/Toast';

function ToastTestComponent() {
  const toast = useToast();

  return (
    <div>
      <button onClick={() => toast.success('Success!')}>Show Success</button>
      <button onClick={() => toast.error('Error!')}>Show Error</button>
      <button onClick={() => toast.warning('Warning!')}>Show Warning</button>
      <button onClick={() => toast.info('Info!')}>Show Info</button>
    </div>
  );
}

describe('Toast Component', () => {
  it('should show success toast', async () => {
    render(<ToastTestComponent />);
    const button = screen.getByText('Show Success');
    await act(async () => {
      button.click();
    });
    await waitFor(() => {
      expect(screen.getByText('Success!')).toBeInTheDocument();
    });
  });

  it('should show error toast', async () => {
    render(<ToastTestComponent />);
    const button = screen.getByText('Show Error');
    await act(async () => {
      button.click();
    });
    await waitFor(() => {
      expect(screen.getByText('Error!')).toBeInTheDocument();
    });
  });

  it('should show warning toast', async () => {
    render(<ToastTestComponent />);
    const button = screen.getByText('Show Warning');
    await act(async () => {
      button.click();
    });
    await waitFor(() => {
      expect(screen.getByText('Warning!')).toBeInTheDocument();
    });
  });

  it('should show info toast', async () => {
    render(<ToastTestComponent />);
    const button = screen.getByText('Show Info');
    await act(async () => {
      button.click();
    });
    await waitFor(() => {
      expect(screen.getByText('Info!')).toBeInTheDocument();
    });
  });

  it('should remove toast when close button is clicked', async () => {
    render(<ToastTestComponent />);
    const button = screen.getByText('Show Success');
    await act(async () => {
      button.click();
    });
    await waitFor(() => {
      expect(screen.getByText('Success!')).toBeInTheDocument();
    });

    const closeButtons = screen.getAllByRole('button', { name: '' });
    const closeButton = closeButtons[closeButtons.length - 1];

    if (closeButton) {
      await act(async () => {
        closeButton.click();
      });
      await waitFor(() => {
        expect(screen.queryByText('Success!')).not.toBeInTheDocument();
      });
    }
  });

  it('should auto-remove toast after duration', async () => {
    jest.useFakeTimers();

    render(<ToastTestComponent />);
    const button = screen.getByText('Show Success');
    await act(async () => {
      button.click();
    });
    await waitFor(() => {
      expect(screen.getByText('Success!')).toBeInTheDocument();
    });

    await act(async () => {
      jest.advanceTimersByTime(5500);
    });
    await waitFor(() => {
      expect(screen.queryByText('Success!')).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  }, 10000);
});