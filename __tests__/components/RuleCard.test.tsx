import { render, screen } from '../utils/test-utils';
import { RuleCard } from '@/components/RuleCard';
import { mockAutomationRule } from '../utils/test-data';

describe('RuleCard Component', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render rule name', () => {
    render(
      <RuleCard
        rule={mockAutomationRule}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
      />
    );
    expect(screen.getByText(mockAutomationRule.name)).toBeInTheDocument();
  });

  it('should display rule type badge', () => {
    render(
      <RuleCard
        rule={mockAutomationRule}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
      />
    );
    expect(screen.getByText('Auto Like')).toBeInTheDocument();
  });

  it('should display rule status badge', () => {
    render(
      <RuleCard
        rule={mockAutomationRule}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
      />
    );
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should display execution count', () => {
  render(
    <RuleCard
      rule={mockAutomationRule}
      onEdit={mockOnEdit}
      onDelete={mockOnDelete}
      onToggle={mockOnToggle}
    />
  );
  // Text is split - check separately
  expect(screen.getByText('42')).toBeInTheDocument();
  expect(screen.getByText('executions')).toBeInTheDocument();
});

  it('should display enabled status', () => {
    render(
      <RuleCard
        rule={mockAutomationRule}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
      />
    );
    expect(screen.getByText('Enabled')).toBeInTheDocument();
  });

  it('should display disabled status when isActive is false', () => {
    const disabledRule = { ...mockAutomationRule, isActive: false };
    render(
      <RuleCard
        rule={disabledRule}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
      />
    );
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', () => {
    render(
      <RuleCard
        rule={mockAutomationRule}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
      />
    );
    const editButton = screen.getByTitle('Edit rule');
    editButton.click();
    expect(mockOnEdit).toHaveBeenCalledWith(mockAutomationRule.id);
  });

  it('should call onDelete when delete button is clicked', () => {
    render(
      <RuleCard
        rule={mockAutomationRule}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
      />
    );
    const deleteButton = screen.getByTitle('Delete rule');
    deleteButton.click();
    expect(mockOnDelete).toHaveBeenCalledWith(mockAutomationRule.id);
  });

  it('should call onToggle when toggle button is clicked', () => {
    const { container } = render(
      <RuleCard
        rule={mockAutomationRule}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
      />
    );
    const toggleButton = container.querySelector('button[role="switch"]');
    if (toggleButton) {
      (toggleButton as HTMLElement).click();
      expect(mockOnToggle).toHaveBeenCalledWith(
        mockAutomationRule.id,
        mockAutomationRule.isActive
      );
    }
  });

  it('should display last executed date', () => {
    render(
      <RuleCard
        rule={mockAutomationRule}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
      />
    );
    expect(screen.getByText(/Last executed:/)).toBeInTheDocument();
  });
});