import { render } from '@testing-library/react';
import { ChevronIcon } from '../ChevronIcon';

describe('ChevronIcon', () => {
  it('renders a left-pointing path for direction="left"', () => {
    const { container } = render(<ChevronIcon direction="left" />);
    expect(container.querySelector('path')).toHaveAttribute('d', 'M15 19l-7-7 7-7');
  });

  it('renders a right-pointing path for direction="right"', () => {
    const { container } = render(<ChevronIcon direction="right" />);
    expect(container.querySelector('path')).toHaveAttribute('d', 'M9 5l7 7-7 7');
  });

  it('applies the given className, defaulting to w-6 h-6', () => {
    const { container: defaultContainer } = render(<ChevronIcon direction="left" />);
    expect(defaultContainer.querySelector('svg')).toHaveClass('w-6', 'h-6');

    const { container: customContainer } = render(<ChevronIcon direction="left" className="w-3 h-3 animate-pulse" />);
    expect(customContainer.querySelector('svg')).toHaveClass('w-3', 'h-3', 'animate-pulse');
  });
});
