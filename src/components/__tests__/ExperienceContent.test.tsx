import { render, screen, fireEvent } from '@testing-library/react';
import ExperienceContent from '../ExperienceContent';

describe('ExperienceContent', () => {
  it('shows the Work tab by default', () => {
    render(<ExperienceContent />);
    expect(screen.getByRole('tab', { name: 'Work' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Collinson Group')).toBeInTheDocument();
  });

  it('switches to the Volunteer tab and renders its content', () => {
    render(<ExperienceContent />);
    fireEvent.click(screen.getByRole('tab', { name: 'Volunteer' }));

    expect(screen.getByRole('tab', { name: 'Volunteer' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('RAD Women')).toBeInTheDocument();
    expect(screen.queryByText('Collinson Group')).not.toBeInTheDocument();
  });

  it('switches to the Certifications tab and renders its content', () => {
    render(<ExperienceContent />);
    fireEvent.click(screen.getByRole('tab', { name: 'Certifications' }));

    expect(screen.getByText('Datadog')).toBeInTheDocument();
  });

  it('switches to the Awards tab and renders its content', () => {
    render(<ExperienceContent />);
    fireEvent.click(screen.getByRole('tab', { name: 'Awards' }));

    expect(screen.getByText('National Apprenticeship Awards 2023')).toBeInTheDocument();
  });
});
