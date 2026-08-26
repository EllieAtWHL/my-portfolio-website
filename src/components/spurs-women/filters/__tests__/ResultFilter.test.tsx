import { render, screen, fireEvent } from '@testing-library/react';
import { ResultFilter } from '../ResultFilter';

describe('ResultFilter', () => {
  it('reflects the given value and calls onChange with the new selection', () => {
    const onChange = jest.fn();
    render(<ResultFilter value="all" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Result'), { target: { value: 'won' } });
    expect(onChange).toHaveBeenCalledWith('won');
  });
});
