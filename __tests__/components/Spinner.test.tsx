import { render, screen } from '../utils/test-utils';
import { Spinner, FullPageSpinner } from '@/components/Spinner';

describe('Spinner Component', () => {
  it('should render spinner', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should render with small size', () => {
    const { container } = render(<Spinner size="sm" />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toHaveClass('h-4', 'w-4', 'border-2');
  });

  it('should render with medium size', () => {
    const { container } = render(<Spinner size="md" />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toHaveClass('h-8', 'w-8', 'border-2');
  });

  it('should render with large size', () => {
    const { container } = render(<Spinner size="lg" />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toHaveClass('h-12', 'w-12', 'border-2');
  });

  it('should render with xl size', () => {
    const { container } = render(<Spinner size="xl" />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toHaveClass('h-16', 'w-16', 'border-3');
  });

  it('should render with primary variant', () => {
    const { container } = render(<Spinner variant="primary" />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toHaveClass('border-blue-600', 'border-t-transparent');
  });

  it('should render with white variant', () => {
    const { container } = render(<Spinner variant="white" />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toHaveClass('border-white', 'border-t-transparent');
  });

  it('should render with gray variant', () => {
    const { container } = render(<Spinner variant="gray" />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toHaveClass('border-gray-600', 'border-t-transparent');
  });

  it('should render text', () => {
    render(<Spinner text="Loading..." />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    const { container } = render(<Spinner className="custom-class" />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('custom-class');
  });
});

describe('FullPageSpinner Component', () => {
  it('should render full page spinner', () => {
    const { container } = render(<FullPageSpinner />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should render with default text', () => {
    render(<FullPageSpinner />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render with custom text', () => {
    render(<FullPageSpinner text="Please wait..." />);
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('should have fixed positioning', () => {
    const { container } = render(<FullPageSpinner />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('fixed', 'inset-0', 'z-50');
  });
});