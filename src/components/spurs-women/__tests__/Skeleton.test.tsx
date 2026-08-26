import { render } from '@testing-library/react';
import { Skeleton } from '../Skeleton';

describe('Skeleton', () => {
  it('renders a pulsing placeholder with the given className and style', () => {
    const { container } = render(<Skeleton className="h-8 w-28 rounded-full" style={{ paddingBottom: '66.67%' }} />);

    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('animate-pulse');
    expect(el.className).toContain('h-8 w-28 rounded-full');
    expect(el).toHaveStyle({ paddingBottom: '66.67%' });
  });
});
