import { render, screen } from '../utils/test-utils';
import { Table } from '@/components/Table';

interface TestData {
  id: string;
  name: string;
  email: string;
}

const mockData: TestData[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
];

const mockColumns = [
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
];

describe('Table Component', () => {
  it('should render table with data', () => {
    render(
      <Table
        columns={mockColumns}
        data={mockData}
        keyExtractor={(item) => item.id}
      />
    );
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('should render column headers', () => {
    render(
      <Table
        columns={mockColumns}
        data={mockData}
        keyExtractor={(item) => item.id}
      />
    );
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('should show empty message when data is empty', () => {
    render(
      <Table
        columns={mockColumns}
        data={[] as TestData[]}
        keyExtractor={(item) => item.id}
      />
    );
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('should show custom empty message', () => {
    render(
      <Table
        columns={mockColumns}
        data={[] as TestData[]}
        keyExtractor={(item) => item.id}
        emptyMessage="No records found"
      />
    );
    expect(screen.getByText('No records found')).toBeInTheDocument();
  });

  it('should call onRowClick when row is clicked', () => {
    const handleRowClick = jest.fn();
    const { container } = render(
      <Table
        columns={mockColumns}
        data={mockData}
        keyExtractor={(item) => item.id}
        onRowClick={handleRowClick}
      />
    );
    const rows = container.querySelectorAll('tbody tr');
    (rows[0] as HTMLElement).click();
    expect(handleRowClick).toHaveBeenCalledWith(mockData[0]);
  });

  it('should render custom cell content', () => {
    const customColumns = [
      {
        key: 'name',
        header: 'Name',
        render: (item: TestData) => `[${item.name}]`,
      },
      { key: 'email', header: 'Email' },
    ];

    render(
      <Table
        columns={customColumns}
        data={mockData}
        keyExtractor={(item) => item.id}
      />
    );
    expect(screen.getByText('[John Doe]')).toBeInTheDocument();
  });

  it('should apply custom column className', () => {
    const customColumns = [
      { key: 'name', header: 'Name', className: 'font-bold' },
      { key: 'email', header: 'Email' },
    ];

    const { container } = render(
      <Table
        columns={customColumns}
        data={mockData}
        keyExtractor={(item) => item.id}
      />
    );
    const headers = container.querySelectorAll('th');
    expect(headers[0]).toHaveClass('font-bold');
  });
});