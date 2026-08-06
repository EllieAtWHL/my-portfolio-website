import { render, screen, fireEvent } from '@testing-library/react';
import { TabNav } from '../TabNav';

const tabs = [
  { key: 'details', label: 'Details' },
  { key: 'related', label: 'Related Records' },
] as const;

describe('TabNav', () => {
  it('renders a button per tab', () => {
    render(<TabNav tabs={[...tabs]} activeKey="details" onChange={() => {}} />);

    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Related Records')).toBeInTheDocument();
  });

  it('calls onChange with the clicked tab key', () => {
    const onChange = jest.fn();
    render(<TabNav tabs={[...tabs]} activeKey="details" onChange={onChange} />);

    fireEvent.click(screen.getByText('Related Records'));

    expect(onChange).toHaveBeenCalledWith('related');
  });

  it('styles the active tab differently from inactive tabs', () => {
    render(<TabNav tabs={[...tabs]} activeKey="related" onChange={() => {}} />);

    const active = screen.getByText('Related Records');
    const inactive = screen.getByText('Details');

    expect(active.style.color).toBe('var(--spurs-dark-accent)');
    expect(inactive.style.color).toBe('rgb(209, 213, 219)');
  });

  it('exposes tablist/tab roles and aria-selected state', () => {
    render(<TabNav tabs={[...tabs]} activeKey="related" onChange={() => {}} />);

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Related Records' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Details' })).toHaveAttribute('aria-selected', 'false');
  });

  it('wires aria-controls to a panelId when provided', () => {
    const tabsWithPanels = [
      { key: 'details', label: 'Details', panelId: 'details-panel' },
      { key: 'related', label: 'Related Records', panelId: 'related-panel' },
    ] as const;
    render(<TabNav tabs={[...tabsWithPanels]} activeKey="details" onChange={() => {}} />);

    expect(screen.getByRole('tab', { name: 'Details' })).toHaveAttribute('aria-controls', 'details-panel');
  });
});
