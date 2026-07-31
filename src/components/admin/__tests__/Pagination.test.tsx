import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from '../Pagination';

describe('Pagination', () => {
  it('renders nothing when there is only one page', () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={1}
        totalItems={5}
        perPage={20}
        itemLabel="matches"
        onPageChange={() => {}}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the current range and page count', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={3}
        totalItems={45}
        perPage={20}
        itemLabel="matches"
        onPageChange={() => {}}
      />
    );

    expect(screen.getByText('Showing 21 to 40 of 45 matches')).toBeInTheDocument();
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
  });

  it('disables Previous on the first page and Next on the last page', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={3}
        totalItems={45}
        perPage={20}
        itemLabel="matches"
        onPageChange={() => {}}
      />
    );

    expect(screen.getByText('Previous')).toBeDisabled();
    expect(screen.getByText('Next')).not.toBeDisabled();
  });

  it('calls onPageChange with the adjacent page', () => {
    const onPageChange = jest.fn();
    render(
      <Pagination
        currentPage={2}
        totalPages={3}
        totalItems={45}
        perPage={20}
        itemLabel="matches"
        onPageChange={onPageChange}
      />
    );

    fireEvent.click(screen.getByText('Next'));
    expect(onPageChange).toHaveBeenCalledWith(3);

    fireEvent.click(screen.getByText('Previous'));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});
