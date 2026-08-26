import { render, screen, fireEvent } from '@testing-library/react';
import { AttendedFilter } from '../AttendedFilter';

describe('AttendedFilter', () => {
  it('reflects the given value and calls onChange with the new selection', () => {
    const onChange = jest.fn();
    render(<AttendedFilter value="all" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Attended'), { target: { value: 'attended' } });
    expect(onChange).toHaveBeenCalledWith('attended');
  });
});
