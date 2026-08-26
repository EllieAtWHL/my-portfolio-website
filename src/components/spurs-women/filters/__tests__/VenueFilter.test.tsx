import { render, screen, fireEvent } from '@testing-library/react';
import { VenueFilter } from '../VenueFilter';

describe('VenueFilter', () => {
  it('reflects the given value and calls onChange with the new selection', () => {
    const onChange = jest.fn();
    render(<VenueFilter value="home" onChange={onChange} />);

    expect(screen.getByLabelText('Home/Away')).toHaveValue('home');

    fireEvent.change(screen.getByLabelText('Home/Away'), { target: { value: 'away' } });
    expect(onChange).toHaveBeenCalledWith('away');
  });
});
