import { render } from '@testing-library/react';
import { ExternalLinkIcon } from '../ExternalLinkIcon';

describe('ExternalLinkIcon', () => {
  it('renders the external-link svg path', () => {
    const { container } = render(<ExternalLinkIcon />);
    expect(container.querySelector('path')).toHaveAttribute(
      'd',
      'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
    );
  });

  it('defaults to w-4 h-4 text-gray-400 and accepts a custom className', () => {
    const { container: defaultContainer } = render(<ExternalLinkIcon />);
    expect(defaultContainer.querySelector('svg')).toHaveClass('w-4', 'h-4', 'text-gray-400');

    const { container: customContainer } = render(<ExternalLinkIcon className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />);
    expect(customContainer.querySelector('svg')).toHaveClass('ml-2', 'flex-shrink-0');
  });
});
