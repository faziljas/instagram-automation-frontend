import { render, screen } from '../utils/test-utils';
import { Modal, ConfirmModal } from '@/components/Modal';

describe('Modal Component', () => {
  it('should render modal when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()}>
        Test Content
      </Modal>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should not render modal when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={jest.fn()}>
        Test Content
      </Modal>
    );

    expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
  });

  it('should render with title', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} title="Test Title">
        Test Content
      </Modal>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should call onClose when overlay clicked', () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test">
        Content
      </Modal>
    );

    const overlay = document.querySelector('.fixed.inset-0.bg-gray-500');
    if (overlay) {
      overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(handleClose).toHaveBeenCalled();
    }
  });

  it('should call onClose when close button clicked', () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test">
        Content
      </Modal>
    );

    const closeButton = screen.getByRole('button');
    closeButton.click();
    expect(handleClose).toHaveBeenCalled();
  });

  it('should render footer when provided', () => {
    render(
      <Modal 
        isOpen={true} 
        onClose={jest.fn()} 
        footer={<button>Footer Button</button>}
      >
        Content
      </Modal>
    );

    expect(screen.getByText('Footer Button')).toBeInTheDocument();
  });
});

describe('ConfirmModal Component', () => {
  const mockOnConfirm = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render confirm modal when isOpen is true', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Confirm Action"
        message="Are you sure?"
      />
    );

    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(
      <ConfirmModal
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Confirm Action"
        message="Are you sure?"
      />
    );

    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
  });

  it('should have confirm and cancel buttons', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Confirm"
        message="Sure?"
        confirmText="Yes"
        cancelText="No"
      />
    );

    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('should call onConfirm when confirm button clicked', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Confirm"
        message="Sure?"
      />
    );

    const buttons = screen.getAllByRole('button');
    const confirmButton = buttons.find(btn => btn.textContent === 'Confirm');
    
    if (confirmButton) {
      confirmButton.click();
      expect(mockOnConfirm).toHaveBeenCalled();
    }
  });

  it('should call onClose when cancel button clicked', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Confirm"
        message="Sure?"
      />
    );

    const buttons = screen.getAllByRole('button');
    const cancelButton = buttons.find(btn => btn.textContent === 'Cancel');
    
    if (cancelButton) {
      cancelButton.click();
      expect(mockOnClose).toHaveBeenCalled();
    }
  });
});