import { render, screen, fireEvent } from '@testing-library/react';
import { RelatedList } from '../RelatedList';

interface Row {
  id: string;
  name: string;
}

const rows: Row[] = [
  { id: '1', name: 'Alpha' },
  { id: '2', name: 'Beta' },
  { id: '3', name: 'Gamma' },
];

const columns = [{ key: 'name' as const, label: 'Name' }];

describe('RelatedList', () => {
  it('shows the title with a record count and renders every record when search is omitted', () => {
    render(<RelatedList title="Widgets" records={rows} columns={columns} />);

    expect(screen.getByText('Widgets (3)')).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
  });

  it('does not render a search box or pagination controls when search is omitted', () => {
    render(<RelatedList title="Widgets" records={rows} columns={columns} />);

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
  });

  it('shows the empty message when there are no records, regardless of search', () => {
    render(
      <RelatedList
        title="Widgets"
        records={[]}
        columns={columns}
        emptyMessage="No widgets found"
        search={{ id: 'widgets', placeholder: 'Search...', filterFn: () => true }}
      />
    );

    expect(screen.getByText('No widgets found')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('filters records via the search box when search is provided', () => {
    render(
      <RelatedList
        title="Widgets"
        records={rows}
        columns={columns}
        search={{
          id: 'widgets',
          placeholder: 'Search widgets...',
          filterFn: (row, term) => row.name.toLowerCase().includes(term.toLowerCase()),
        }}
      />
    );

    expect(screen.getByText('Widgets (3)')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Search widgets...'), { target: { value: 'bet' } });

    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
    expect(screen.queryByText('Gamma')).not.toBeInTheDocument();
    // The header count must track the filtered result, not the unfiltered total -
    // otherwise it visibly contradicts the Pagination footer's own count below it.
    expect(screen.getByText('Widgets (1)')).toBeInTheDocument();
  });

  it('shows a "no match" message distinct from the empty-list message when a search matches nothing', () => {
    render(
      <RelatedList
        title="Widgets"
        records={rows}
        columns={columns}
        emptyMessage="No widgets found"
        search={{
          id: 'widgets',
          placeholder: 'Search widgets...',
          filterFn: (row, term) => row.name.toLowerCase().includes(term.toLowerCase()),
        }}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Search widgets...'), { target: { value: 'zzz' } });

    expect(screen.getByText('No widgets match your search')).toBeInTheDocument();
    expect(screen.queryByText('No widgets found')).not.toBeInTheDocument();
  });

  it('paginates records and shows pagination controls when perPage is set', () => {
    render(
      <RelatedList
        title="Widgets"
        records={rows}
        columns={columns}
        search={{ id: 'widgets', placeholder: 'Search...', filterFn: () => true, perPage: 2 }}
      />
    );

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.queryByText('Gamma')).not.toBeInTheDocument();
    expect(screen.getByText('Showing 1 to 2 of 3 widgets')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Next'));

    expect(screen.getByText('Gamma')).toBeInTheDocument();
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
  });

  it('does not paginate when search is provided without perPage', () => {
    render(
      <RelatedList
        title="Widgets"
        records={rows}
        columns={columns}
        search={{ id: 'widgets', placeholder: 'Search...', filterFn: () => true }}
      />
    );

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
  });

  it('still calls onRecordClick and onNew as before when search is enabled', () => {
    const onRecordClick = jest.fn();
    const onNew = jest.fn();
    render(
      <RelatedList
        title="Widgets"
        records={rows}
        columns={columns}
        onNew={onNew}
        onRecordClick={onRecordClick}
        search={{ id: 'widgets', placeholder: 'Search...', filterFn: () => true }}
      />
    );

    fireEvent.click(screen.getByText('New'));
    fireEvent.click(screen.getByText('Alpha'));

    expect(onNew).toHaveBeenCalledTimes(1);
    expect(onRecordClick).toHaveBeenCalledWith(rows[0]);
  });
});
