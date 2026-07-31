import { render, screen, fireEvent } from '@testing-library/react';
import { ColorPicker } from '../ColorPicker';

describe('ColorPicker', () => {
  it('shows "None" on the swatch button when no color is set', () => {
    render(<ColorPicker value={null} onChange={() => {}} label="Primary Color" />);

    expect(screen.getByText('None')).toBeInTheDocument();
    expect(screen.getByText('Primary Color')).toBeInTheDocument();
  });

  it('calls onChange when typing a color name directly', () => {
    const onChange = jest.fn();
    render(<ColorPicker value={null} onChange={onChange} />);

    fireEvent.change(screen.getByPlaceholderText('e.g., blue-500'), { target: { value: 'blue-500' } });

    expect(onChange).toHaveBeenCalledWith('blue-500');
  });

  it('opens the swatch grid, picks a color, and closes', () => {
    const onChange = jest.fn();
    render(<ColorPicker value={null} onChange={onChange} />);

    fireEvent.click(screen.getByText('None'));
    expect(screen.getByText('Select a Color')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('blue-500'));

    expect(onChange).toHaveBeenCalledWith('blue-500');
    expect(screen.queryByText('Select a Color')).not.toBeInTheDocument();
  });

  it('clears the selection via Clear Selection', () => {
    const onChange = jest.fn();
    render(<ColorPicker value="blue-500" onChange={onChange} />);

    // The swatch toggle button has no text when a color is already set - it's
    // the only button rendered before the picker opens.
    fireEvent.click(screen.getAllByRole('button')[0]);
    fireEvent.click(screen.getByText('Clear Selection'));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('closes the picker without changing the value on Cancel', () => {
    const onChange = jest.fn();
    render(<ColorPicker value={null} onChange={onChange} />);

    fireEvent.click(screen.getByText('None'));
    fireEvent.click(screen.getByText('Cancel'));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByText('Select a Color')).not.toBeInTheDocument();
  });
});
