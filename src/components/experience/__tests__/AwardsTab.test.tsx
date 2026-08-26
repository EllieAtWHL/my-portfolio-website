import { render, screen, fireEvent } from '@testing-library/react';
import { AwardsTab } from '../AwardsTab';

describe('AwardsTab', () => {
  it('renders both awards', () => {
    render(<AwardsTab />);
    expect(screen.getByText('National Apprenticeship Awards 2023')).toBeInTheDocument();
    expect(screen.getByText('All-Star Trailhead Ranger')).toBeInTheDocument();
  });

  it('opens the detail modal with the additional info when an award is clicked', () => {
    render(<AwardsTab />);

    fireEvent.click(screen.getByText('National Apprenticeship Awards 2023'));

    expect(screen.getByText(/This prestigious award recognises apprentices/)).toBeInTheDocument();
  });

  it('closes the modal when its close control fires onClose', () => {
    render(<AwardsTab />);

    fireEvent.click(screen.getByText('National Apprenticeship Awards 2023'));
    expect(screen.getByText(/This prestigious award recognises apprentices/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByText(/This prestigious award recognises apprentices/)).not.toBeInTheDocument();
  });
});
