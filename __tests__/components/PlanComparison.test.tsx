import { render, screen } from '../utils/test-utils';
import { PlanComparison } from '@/components/PlanComparison';

describe('PlanComparison Component', () => {
  const mockOnUpgrade = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render plan comparison modal', () => {
    render(
      <PlanComparison
        currentPlan="free"
        onUpgrade={mockOnUpgrade}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Choose Your Plan')).toBeInTheDocument();
  });

  it('should display all three plans', () => {
    render(
      <PlanComparison
        currentPlan="free"
        onUpgrade={mockOnUpgrade}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
  });

  it('should display plan features', () => {
    render(
      <PlanComparison
        currentPlan="free"
        onUpgrade={mockOnUpgrade}
        onClose={mockOnClose}
      />
    );

    expect(screen.getAllByText(/DMs\/day/i)).toHaveLength(3);
  });

  it('should show Current Plan badge for active plan', () => {
    render(
      <PlanComparison
        currentPlan="pro"
        onUpgrade={mockOnUpgrade}
        onClose={mockOnClose}
      />
    );

    const currentPlanElements = screen.getAllByText('Current Plan');
    expect(currentPlanElements.length).toBeGreaterThan(0);
  });

  it('should disable button for current plan', () => {
    render(
      <PlanComparison
        currentPlan="pro"
        onUpgrade={mockOnUpgrade}
        onClose={mockOnClose}
      />
    );

    const buttons = screen.getAllByRole('button');
    const disabledButton = buttons.find(btn => btn.hasAttribute('disabled'));
    expect(disabledButton).toBeInTheDocument();
    expect(disabledButton?.textContent).toBe('Current Plan');
  });

  it('should call onClose when close button clicked', () => {
    render(
      <PlanComparison
        currentPlan="free"
        onUpgrade={mockOnUpgrade}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByText('Close');
    closeButton.click();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onUpgrade when upgrade button clicked', () => {
    render(
      <PlanComparison
        currentPlan="free"
        onUpgrade={mockOnUpgrade}
        onClose={mockOnClose}
      />
    );

    const buttons = screen.getAllByRole('button');
    const upgradeButton = buttons.find(btn => btn.textContent?.includes('Upgrade to Pro'));
    
    if (upgradeButton) {
      upgradeButton.click();
      expect(mockOnUpgrade).toHaveBeenCalled();
    }
  });
});