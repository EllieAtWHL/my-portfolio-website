import { render, screen, fireEvent } from '@testing-library/react';
import { FormModal } from '../FormModal';

describe('FormModal', () => {
  it('renders the title, children, and submit label', () => {
    render(
      <FormModal title="Add Thing" onCancel={() => {}} onSubmit={() => {}} submitLabel="Create">
        <div>field content</div>
      </FormModal>
    );

    expect(screen.getByText('Add Thing')).toBeInTheDocument();
    expect(screen.getByText('field content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('omits the Delete button when onDelete is not provided', () => {
    render(
      <FormModal title="Add Thing" onCancel={() => {}} onSubmit={() => {}} submitLabel="Create">
        <div />
      </FormModal>
    );

    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('shows the Delete button and calls onDelete when provided', () => {
    const onDelete = jest.fn();
    render(
      <FormModal title="Edit Thing" onCancel={() => {}} onSubmit={() => {}} onDelete={onDelete} submitLabel="Update">
        <div />
      </FormModal>
    );

    fireEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('shows an error banner only when an error is provided', () => {
    const { rerender } = render(
      <FormModal title="Add Thing" onCancel={() => {}} onSubmit={() => {}} submitLabel="Create">
        <div />
      </FormModal>
    );
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();

    rerender(
      <FormModal title="Add Thing" error="Something went wrong" onCancel={() => {}} onSubmit={() => {}} submitLabel="Create">
        <div />
      </FormModal>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('announces the error banner as a live region', () => {
    render(
      <FormModal title="Add Thing" error="Something went wrong" onCancel={() => {}} onSubmit={() => {}} submitLabel="Create">
        <div />
      </FormModal>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
  });

  it('calls onCancel and onSubmit', () => {
    const onCancel = jest.fn();
    const onSubmit = jest.fn();
    render(
      <FormModal title="Add Thing" onCancel={onCancel} onSubmit={onSubmit} submitLabel="Create">
        <div />
      </FormModal>
    );

    fireEvent.click(screen.getByText('Cancel'));
    fireEvent.click(screen.getByText('Create'));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
