import { render } from '../utils/test-utils';
import {
  Skeleton,
  TableSkeleton,
  CardSkeleton,
  ListSkeleton,
  StatsCardSkeleton,
} from '@/components/Skeleton';

describe('Skeleton Component', () => {
  it('should render skeleton', () => {
    const { container } = render(<Skeleton />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should have base styles', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.querySelector('.animate-pulse');
    expect(skeleton).toHaveClass('bg-gray-200', 'rounded');
  });

  it('should accept custom className', () => {
    const { container } = render(<Skeleton className="h-4 w-full" />);
    const skeleton = container.querySelector('.animate-pulse');
    expect(skeleton).toHaveClass('h-4', 'w-full');
  });
});

describe('TableSkeleton Component', () => {
  it('should render table skeleton', () => {
    const { container } = render(<TableSkeleton />);
    expect(container.querySelector('table')).toBeInTheDocument();
  });

  it('should render default rows and columns', () => {
    const { container } = render(<TableSkeleton />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(5);
  });

  it('should render custom rows and columns', () => {
    const { container } = render(<TableSkeleton rows={10} columns={6} />);
    const headerCells = container.querySelectorAll('thead th');
    expect(headerCells.length).toBe(6);

    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(10);
  });
});

describe('CardSkeleton Component', () => {
  it('should render card skeleton', () => {
    const { container } = render(<CardSkeleton />);
    expect(container.querySelector('.bg-white')).toBeInTheDocument();
  });

  it('should render default lines', () => {
    const { container } = render(<CardSkeleton />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render image when hasImage is true', () => {
    const { container } = render(<CardSkeleton hasImage={true} />);
    const imageSkeleton = container.querySelector('.h-48');
    expect(imageSkeleton).toBeInTheDocument();
  });

  it('should render button when hasButton is true', () => {
    const { container } = render(<CardSkeleton hasButton={true} />);
    const buttonSkeleton = container.querySelector('.h-10');
    expect(buttonSkeleton).toBeInTheDocument();
  });
});

describe('ListSkeleton Component', () => {
  it('should render list skeleton', () => {
    const { container } = render(<ListSkeleton />);
    const items = container.querySelectorAll('[class*="px-6"]');
    expect(items.length).toBe(5);
  });

  it('should render avatar when hasAvatar is true', () => {
    const { container } = render(<ListSkeleton hasAvatar={true} />);
    const avatarSkeleton = container.querySelector('.rounded-full');
    expect(avatarSkeleton).toBeInTheDocument();
  });

  it('should render custom items count', () => {
    const { container } = render(<ListSkeleton items={10} />);
    const items = container.querySelectorAll('[class*="px-6"]');
    expect(items.length).toBe(10);
  });
});

describe('StatsCardSkeleton Component', () => {
  it('should render stats card skeleton', () => {
    const { container } = render(<StatsCardSkeleton />);
    expect(container.querySelector('.bg-white')).toBeInTheDocument();
  });

  it('should render icon and text skeletons', () => {
    const { container } = render(<StatsCardSkeleton />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});