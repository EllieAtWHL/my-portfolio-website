import { render } from '@testing-library/react';
import { CompetitionIcon } from '../CompetitionIcon';

describe('CompetitionIcon', () => {
  it('renders the fallback icon when no iconSvg is given', () => {
    const { container } = render(<CompetitionIcon />);
    expect(container.querySelector('svg path')).toHaveAttribute(
      'd',
      expect.stringContaining('M10.394 2.08a1 1 0 00-.788 0l-7 3')
    );
  });

  it('renders the given iconSvg instead of the fallback', () => {
    const { container } = render(
      <CompetitionIcon iconSvg="<svg data-testid='custom-icon'><circle r='5' /></svg>" />
    );
    expect(container.querySelector('circle')).toBeInTheDocument();
    expect(container.querySelector('svg path')).not.toBeInTheDocument();
  });

  it('applies the given className, defaulting to w-5 h-5', () => {
    const { container: defaultContainer } = render(<CompetitionIcon />);
    expect(defaultContainer.querySelector('svg')).toHaveClass('w-5', 'h-5');

    const { container: customContainer } = render(<CompetitionIcon className="w-4 h-4" />);
    expect(customContainer.firstChild).toHaveClass('w-4', 'h-4');
  });
});
