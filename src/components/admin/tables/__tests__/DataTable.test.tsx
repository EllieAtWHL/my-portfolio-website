import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable } from '../DataTable';

interface Row {
  id: number;
  name: string;
}

const rows: Row[] = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
const columns = [{ key: 'name', label: 'Name', render: (row: Row) => row.name }];

describe('DataTable', () => {
  it('renders a header cell per column and a row per record', () => {
    render(<DataTable columns={columns} records={rows} getRowKey={(r) => r.id} onRowClick={() => {}} emptyMessage="None" />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('calls onRowClick with the clicked record', () => {
    const onRowClick = jest.fn();
    render(<DataTable columns={columns} records={rows} getRowKey={(r) => r.id} onRowClick={onRowClick} emptyMessage="None" />);

    fireEvent.click(screen.getByText('Bob'));

    expect(onRowClick).toHaveBeenCalledWith(rows[1]);
  });

  it('shows the empty message spanning all columns when there are no records', () => {
    render(<DataTable columns={columns} records={[]} getRowKey={(r) => r.id} onRowClick={() => {}} emptyMessage="No rows found" />);

    const emptyCell = screen.getByText('No rows found');
    expect(emptyCell).toBeInTheDocument();
    expect(emptyCell.closest('td')).toHaveAttribute('colspan', String(columns.length));
  });
});
