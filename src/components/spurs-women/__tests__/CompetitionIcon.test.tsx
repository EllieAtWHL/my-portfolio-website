import { render } from '@testing-library/react';
import { CompetitionIcon } from '../CompetitionIcon';

// The real shape of a stored icon_svg (a Heroicons solid icon).
const STORED_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">\n' +
  '  <path fill-rule="evenodd" d="M1.5 5.625c0-1.036.84-1.875 1.875-1.875Z" clip-rule="evenodd" />\n' +
  '</svg>';

const FALLBACK_PATH_START = 'M10.394 2.08a1 1 0 00-.788 0l-7 3';

describe('CompetitionIcon', () => {
  it('renders the fallback icon when no iconSvg is given', () => {
    const { container } = render(<CompetitionIcon />);
    expect(container.querySelector('svg path')).toHaveAttribute('d', expect.stringContaining(FALLBACK_PATH_START));
  });

  it('renders the given iconSvg instead of the fallback', () => {
    const { container } = render(<CompetitionIcon iconSvg="<svg><circle r='5' /></svg>" />);
    expect(container.querySelector('circle')).toHaveAttribute('r', '5');
    expect(container.querySelector('svg path')).not.toBeInTheDocument();
  });

  it('renders a stored icon as one svg sized by className, keeping currentColor and path attributes', () => {
    const { container } = render(<CompetitionIcon iconSvg={STORED_ICON} className="w-4 h-4" />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs).toHaveLength(1);
    expect(svgs[0]).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svgs[0]).toHaveAttribute('fill', 'currentColor');
    expect(svgs[0]).toHaveAttribute('class', 'w-4 h-4');
    const path = container.querySelector('path');
    expect(path).toHaveAttribute('fill-rule', 'evenodd');
    expect(path).toHaveAttribute('clip-rule', 'evenodd');
  });

  it.each([
    ['a script element', '<svg><script>alert(1)</script></svg>'],
    ['an event handler', '<svg onload="alert(1)"><path d="M0 0" /></svg>'],
    ['a non-svg root', '<img src="x" onerror="alert(1)">'],
  ])('falls back instead of rendering an icon containing %s', (_label, iconSvg) => {
    const { container } = render(<CompetitionIcon iconSvg={iconSvg} />);
    expect(container.querySelector('script')).not.toBeInTheDocument();
    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.querySelector('[onload]')).not.toBeInTheDocument();
    expect(container.querySelector('svg path')).toHaveAttribute('d', expect.stringContaining(FALLBACK_PATH_START));
  });

  it('applies the given className, defaulting to w-5 h-5', () => {
    const { container: defaultContainer } = render(<CompetitionIcon />);
    expect(defaultContainer.querySelector('svg')).toHaveClass('w-5', 'h-5');

    const { container: customContainer } = render(<CompetitionIcon className="w-4 h-4" />);
    expect(customContainer.firstChild).toHaveClass('w-4', 'h-4');
  });
});
