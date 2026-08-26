import { render, screen, fireEvent } from '@testing-library/react';
import { DateRangeFilter } from '../DateRangeFilter';

describe('DateRangeFilter', () => {
  it('reflects the given from/to values and calls the right handler for each', () => {
    const onFromChange = jest.fn();
    const onToChange = jest.fn();
    render(
      <DateRangeFilter fromValue="2026-01-01" toValue="2026-06-01" onFromChange={onFromChange} onToChange={onToChange} />
    );

    expect(screen.getByLabelText('From')).toHaveValue('2026-01-01');
    expect(screen.getByLabelText('To')).toHaveValue('2026-06-01');

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-02-01' } });
    expect(onFromChange).toHaveBeenCalledWith('2026-02-01');

    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-07-01' } });
    expect(onToChange).toHaveBeenCalledWith('2026-07-01');
  });
});
