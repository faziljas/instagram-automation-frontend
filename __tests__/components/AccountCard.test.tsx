import { render, screen } from '../utils/test-utils';
import { AccountCard } from '@/components/AccountCard';
import { mockInstagramAccount } from '../utils/test-data';

describe('AccountCard Component', () => {
  const mockOnDelete = jest.fn();
  const mockOnEdit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render account username', () => {
    render(
      <AccountCard
        account={mockInstagramAccount}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );
    expect(screen.getByText(`@${mockInstagramAccount.username}`)).toBeInTheDocument();
  });

  it('should display follower count', () => {
  render(
    <AccountCard
      account={mockInstagramAccount}
      onDelete={mockOnDelete}
      onEdit={mockOnEdit}
    />
  );
  // Text is split across elements, so check for the number separately
  expect(screen.getByText('1,000')).toBeInTheDocument();
  expect(screen.getByText('followers')).toBeInTheDocument();
});

it('should display following count', () => {
  render(
    <AccountCard
      account={mockInstagramAccount}
      onDelete={mockOnDelete}
      onEdit={mockOnEdit}
    />
  );
  expect(screen.getByText('500')).toBeInTheDocument();
  expect(screen.getByText('following')).toBeInTheDocument();
});

it('should display posts count', () => {
  render(
    <AccountCard
      account={mockInstagramAccount}
      onDelete={mockOnDelete}
      onEdit={mockOnEdit}
    />
  );
  expect(screen.getByText('50')).toBeInTheDocument();
  expect(screen.getByText('posts')).toBeInTheDocument();
});

  it('should show active status badge', () => {
    render(
      <AccountCard
        account={mockInstagramAccount}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should show inactive status badge', () => {
    const inactiveAccount = { ...mockInstagramAccount, isActive: false };
    render(
      <AccountCard
        account={inactiveAccount}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('should call onDelete when delete button is clicked', () => {
    render(
      <AccountCard
        account={mockInstagramAccount}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );
    const deleteButton = screen.getByTitle('Delete account');
    deleteButton.click();
    expect(mockOnDelete).toHaveBeenCalledWith(mockInstagramAccount.id);
  });

  it('should call onEdit when edit button is clicked', () => {
    render(
      <AccountCard
        account={mockInstagramAccount}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );
    const editButton = screen.getByTitle('Edit account');
    editButton.click();
    expect(mockOnEdit).toHaveBeenCalledWith(mockInstagramAccount.id);
  });

  it('should render profile picture when available', () => {
    const { container } = render(
      <AccountCard
        account={mockInstagramAccount}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );
     const image = container.querySelector('img');
    expect(image).toBeInTheDocument();
    expect(image?.getAttribute('src')).toContain('example.com%2Fprofile.jpg');
  });

  it('should render avatar placeholder when profile picture is not available', () => {
    const accountWithoutPicture = { ...mockInstagramAccount, profilePictureUrl: undefined };
    const { container } = render(
      <AccountCard
        account={accountWithoutPicture}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );
    const placeholder = container.querySelector('.bg-gradient-to-br');
    expect(placeholder).toBeInTheDocument();
  });

  it('should display connected date', () => {
    render(
      <AccountCard
        account={mockInstagramAccount}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );
    expect(screen.getByText(/Connected.*2024/)).toBeInTheDocument();
  });
});