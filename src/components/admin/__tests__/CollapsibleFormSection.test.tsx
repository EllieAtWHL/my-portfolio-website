import { render, screen, fireEvent } from '@testing-library/react';
import { CollapsibleFormSection } from '../CollapsibleFormSection';

describe('CollapsibleFormSection', () => {
  it('hides its children and shows a right-pointing chevron when closed', () => {
    render(
      <CollapsibleFormSection title="Match Stats" isOpen={false} onToggle={jest.fn()} controlsId="section-1">
        <p>Section content</p>
      </CollapsibleFormSection>
    );

    expect(screen.queryByText('Section content')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Match Stats/ })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('▶')).toBeInTheDocument();
  });

  it('shows its children and a down-pointing chevron when open', () => {
    render(
      <CollapsibleFormSection title="Match Stats" isOpen={true} onToggle={jest.fn()} controlsId="section-1">
        <p>Section content</p>
      </CollapsibleFormSection>
    );

    expect(screen.getByText('Section content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Match Stats/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('▼')).toBeInTheDocument();
  });

  it('calls onToggle when the header button is clicked', () => {
    const onToggle = jest.fn();
    render(
      <CollapsibleFormSection title="Match Stats" isOpen={false} onToggle={onToggle} controlsId="section-1">
        <p>Section content</p>
      </CollapsibleFormSection>
    );

    fireEvent.click(screen.getByRole('button', { name: /Match Stats/ }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
