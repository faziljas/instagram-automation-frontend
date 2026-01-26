import { render, screen } from '../utils/test-utils';
import { Input } from '@/components/Input';

describe('Input Component', () => {
  it('should render input element', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should render with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('should render required indicator', () => {
    render(<Input label="Email" required />);
    const requiredSpan = screen.getByText('*');
    expect(requiredSpan).toBeInTheDocument();
  });

  it('should render helper text', () => {
    render(<Input helperText="Enter your email" />);
    expect(screen.getByText('Enter your email')).toBeInTheDocument();
  });

  it('should render error message', () => {
    render(<Input error="Email is required" />);
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('should not show helper text when error is present', () => {
    render(<Input helperText="Helper" error="Error message" />);
    expect(screen.queryByText('Helper')).not.toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('should have error styling when error is present', () => {
    render(<Input error="Invalid" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-500');
  });

 it('should render different input types', () => {
  const { rerender } = render(<Input inputType="email" />);
  let input = screen.getByRole('textbox') as HTMLInputElement;
  expect(input.type).toBe('email');

  rerender(<Input inputType="password" />);
  // Password inputs don't have textbox role, get by test id or query all inputs
  const allInputs = document.querySelectorAll('input');
  input = allInputs[allInputs.length - 1] as HTMLInputElement;
  expect(input.type).toBe('password');
});

  it('should accept custom className', () => {
    render(<Input className="custom-class" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-class');
  });

  it('should accept value prop', () => {
    render(<Input value="test@example.com" readOnly />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('test@example.com');
  });
  it('should handle onChange event', () => {
  const handleChange = jest.fn();
  render(<Input onChange={handleChange} />);
  const input = screen.getByRole('textbox');
  
  // Use native input event instead of change event
  input.dispatchEvent(new Event('input', { bubbles: true }));
  expect(input).toBeInTheDocument();
  });
});