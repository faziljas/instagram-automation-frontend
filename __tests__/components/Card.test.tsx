import { render, screen } from '../utils/test-utils';
import { Card } from '@/components/Card';

describe('Card Component', () => {
  it('should render card with children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('should have base styles', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.querySelector('.bg-white');
    expect(card).toHaveClass('rounded-lg');
  });

  it('should render with no padding', () => {
    const { container } = render(<Card padding="none">Content</Card>);
    const card = container.firstChild;
    expect(card).not.toHaveClass('p-4', 'p-6', 'p-8');
  });

  it('should render with small padding', () => {
    const { container } = render(<Card padding="sm">Content</Card>);
    const card = container.firstChild;
    expect(card).toHaveClass('p-4');
  });

  it('should render with medium padding', () => {
    const { container } = render(<Card padding="md">Content</Card>);
    const card = container.firstChild;
    expect(card).toHaveClass('p-6');
  });

  it('should render with large padding', () => {
    const { container } = render(<Card padding="lg">Content</Card>);
    const card = container.firstChild;
    expect(card).toHaveClass('p-8');
  });

  it('should render with no shadow', () => {
    const { container } = render(<Card shadow="none">Content</Card>);
    const card = container.firstChild;
    expect(card).not.toHaveClass('shadow-sm', 'shadow', 'shadow-lg');
  });

  it('should render with small shadow', () => {
    const { container } = render(<Card shadow="sm">Content</Card>);
    const card = container.firstChild;
    expect(card).toHaveClass('shadow-sm');
  });

  it('should render with medium shadow', () => {
    const { container } = render(<Card shadow="md">Content</Card>);
    const card = container.firstChild;
    expect(card).toHaveClass('shadow');
  });

  it('should render with large shadow', () => {
    const { container } = render(<Card shadow="lg">Content</Card>);
    const card = container.firstChild;
    expect(card).toHaveClass('shadow-lg');
  });

  it('should accept custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    const card = container.firstChild;
    expect(card).toHaveClass('custom-class');
  });

  it('should render multiple children', () => {
    render(
      <Card>
        <h1>Title</h1>
        <p>Content</p>
      </Card>
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});