import { render, screen, fireEvent } from '@testing-library/react';
import SearchInput from '../SearchInput';

describe('SearchInput', () => {
  it('renders a visible, associated label by default', () => {
    render(
      <SearchInput id="widgets-search" label="Search widgets" placeholder="Search..." value="" onChange={jest.fn()} />
    );

    const input = screen.getByRole('textbox', { name: 'Search widgets' });
    expect(input).toHaveAttribute('placeholder', 'Search...');
    expect(screen.getByText('Search widgets')).not.toHaveClass('sr-only');
  });

  it('keeps the label accessible but visually hidden when srOnlyLabel is set', () => {
    render(
      <SearchInput id="widgets-search" label="Search widgets" srOnlyLabel placeholder="Search..." value="" onChange={jest.fn()} />
    );

    // Still has an accessible name via the associated <label>...
    expect(screen.getByRole('textbox', { name: 'Search widgets' })).toBeInTheDocument();
    // ...but the label itself isn't visible.
    expect(screen.getByText('Search widgets')).toHaveClass('sr-only');
  });

  it('reflects the value prop and calls onChange with the new value on input', () => {
    const onChange = jest.fn();
    render(
      <SearchInput id="widgets-search" label="Search widgets" placeholder="Search..." value="foo" onChange={onChange} />
    );

    const input = screen.getByRole('textbox', { name: 'Search widgets' });
    expect(input).toHaveValue('foo');

    fireEvent.change(input, { target: { value: 'bar' } });

    expect(onChange).toHaveBeenCalledWith('bar');
  });
});
