import { render, screen, fireEvent } from '@testing-library/react';
import LightboxGallery from '../spurs-women/LightboxGallery';
import type { PhotoMedia } from '@/types/media';

const photos: PhotoMedia[] = [
  { id: 1, url: 'https://example.com/a.jpg', caption: 'First photo', type: 'photo' },
  { id: 2, url: 'https://example.com/b.jpg', caption: 'Second photo', type: 'photo' },
];

describe('LightboxGallery', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <LightboxGallery photos={photos} isOpen={false} onClose={jest.fn()} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('shows a pulsing placeholder, not a spinner, before the image loads', () => {
    const { container } = render(
      <LightboxGallery photos={photos} isOpen={true} onClose={jest.fn()} />
    );

    expect(container.querySelector('.animate-spin')).not.toBeInTheDocument();
    expect(screen.getByRole('status', { name: /loading image/i })).toHaveClass('animate-pulse');
  });

  it('hides the loading indicator once the image fires onLoad', () => {
    render(<LightboxGallery photos={photos} isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByRole('status', { name: /loading image/i })).toBeInTheDocument();

    fireEvent.load(screen.getByAltText('First photo'));

    expect(screen.queryByRole('status', { name: /loading image/i })).not.toBeInTheDocument();
  });

  it('resets to the loading state when navigating to a different photo', () => {
    render(<LightboxGallery photos={photos} isOpen={true} onClose={jest.fn()} />);

    fireEvent.load(screen.getByAltText('First photo'));
    expect(screen.queryByRole('status', { name: /loading image/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Next photo'));

    expect(screen.getByRole('status', { name: /loading image/i })).toBeInTheDocument();
    expect(screen.getByAltText('Second photo')).toBeInTheDocument();
  });
});
