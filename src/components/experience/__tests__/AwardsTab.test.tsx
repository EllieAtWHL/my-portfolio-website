import { render, screen, fireEvent, within } from '@testing-library/react';
import { AwardsTab } from '../AwardsTab';

describe('AwardsTab', () => {
  it('renders every award, most recent first', () => {
    render(<AwardsTab />);
    const names = screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent);
    expect(names).toEqual([
      'Salesforce Golden Hoodie',
      'National Apprenticeship Awards 2023',
      'All-Star Trailhead Ranger',
    ]);
  });

  it('opens the detail modal for an award without additional info', () => {
    render(<AwardsTab />);

    fireEvent.click(screen.getByText('Salesforce Golden Hoodie'));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Salesforce Golden Hoodie' })).toBeInTheDocument();
    expect(within(dialog).getByRole('img', { name: 'Salesforce Golden Hoodie' })).toHaveAttribute('src', '/img/golden-hoodie.jpg');
    expect(within(dialog).getByText(/October 2026/)).toBeInTheDocument();
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
