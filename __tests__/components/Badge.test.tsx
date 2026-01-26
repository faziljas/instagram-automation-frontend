import { render, screen } from '../utils/test-utils';
import { Badge } from '@/components/Badge';

describe('Badge Component', () => {
  it('should render badge with text', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('should have default variant', () => {
    const { container } = render(<Badge>Badge</Badge>);
    const badge = container.firstChild;
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  it('should render with success variant', () => {
    const { container } = render(<Badge variant="success">Success</Badge>);
    const badge = container.firstChild;
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('should render with warning variant', () => {
    const { container } = render(<Badge variant="warning">Warning</Badge>);
    const badge = container.firstChild;
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  it('should render with error variant', () => {
    const { container } = render(<Badge variant="error">Error</Badge>);
    const badge = container.firstChild;
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('should render with info variant', () => {
    const { container } = render(<Badge variant="info">Info</Badge>);
    const badge = container.firstChild;
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('should render with small size', () => {
    const { container } = render(<Badge size="sm">Small</Badge>);
    const badge = container.firstChild;
    expect(badge).toHaveClass('px-2', 'py-0.5', 'text-xs');
  });

  it('should render with medium size', () => {
    const { container } = render(<Badge size="md">Medium</Badge>);
    const badge = container.firstChild;
    expect(badge).toHaveClass('px-2.5', 'py-0.5', 'text-sm');
  });

  it('should render with large size', () => {
    const { container } = render(<Badge size="lg">Large</Badge>);
    const badge = container.firstChild;
    expect(badge).toHaveClass('px-3', 'py-1', 'text-base');
  });

  it('should accept custom className', () => {
    const { container } = render(<Badge className="custom-class">Badge</Badge>);
    const badge = container.firstChild;
    expect(badge).toHaveClass('custom-class');
  });

  it('should have base styles', () => {
    const { container } = render(<Badge>Badge</Badge>);
    const badge = container.firstChild;
    expect(badge).toHaveClass('inline-flex', 'items-center', 'font-semibold', 'rounded-full');
  });
});