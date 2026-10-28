import { fireEvent, render } from '@testing-library/react';
import GroundhopperMap from '../GroundhopperMap';

// Real Leaflet under jsdom: no tiles load and nothing has a layout size, but
// map setup, the keyboard guess and the vector markers all still run.
const wembley = { latitude: 51.5556, longitude: -0.2794 };
const guess = { latitude: 52, longitude: -1 };

function renderMap(props: Partial<React.ComponentProps<typeof GroundhopperMap>> = {}) {
  const onGuess = jest.fn();
  const utils = render(
    <GroundhopperMap guess={null} answer={null} interactive onGuess={onGuess} roundKey={0} {...props} />
  );
  return { ...utils, onGuess, map: utils.container.querySelector('.groundhopper-map') as HTMLElement };
}

describe('GroundhopperMap', () => {
  it('drops a pin at the map centre on Enter, and shows the keyboard crosshair', () => {
    const { map, onGuess, container } = renderMap();

    fireEvent.keyDown(map, { key: 'Enter' });

    expect(onGuess).toHaveBeenCalledTimes(1);
    const [{ latitude, longitude }] = onGuess.mock.calls[0];
    expect(Number.isFinite(latitude)).toBe(true);
    expect(Number.isFinite(longitude)).toBe(true);
    expect(map.dataset.keyboard).toBe('true');
    expect(container.querySelector('.groundhopper-crosshair')).toBeInTheDocument();

    fireEvent.pointerDown(map);
    expect(map.dataset.keyboard).toBeUndefined();
  });

  it('ignores keyboard guesses once the round is revealed', () => {
    const { map, onGuess, container } = renderMap({ interactive: false });

    fireEvent.keyDown(map, { key: 'Enter' });

    expect(onGuess).not.toHaveBeenCalled();
    expect(container.querySelector('.groundhopper-crosshair')).not.toBeInTheDocument();
  });

  it('draws the guess, then the answer and a line between them on reveal', () => {
    const { container, rerender, onGuess } = renderMap({ guess });
    expect(container.querySelectorAll('.groundhopper-guess-marker')).toHaveLength(1);
    expect(container.querySelector('.groundhopper-answer-marker')).toBeNull();

    rerender(<GroundhopperMap guess={guess} answer={wembley} interactive={false} onGuess={onGuess} roundKey={0} />);
    expect(container.querySelectorAll('.groundhopper-answer-marker')).toHaveLength(1);
    expect(container.querySelectorAll('.groundhopper-line')).toHaveLength(1);

    rerender(<GroundhopperMap guess={null} answer={null} interactive onGuess={onGuess} roundKey={1} />);
    expect(container.querySelector('.groundhopper-guess-marker')).toBeNull();
    expect(container.querySelector('.groundhopper-line')).toBeNull();
  });

  it('cleans up the Leaflet map on unmount', () => {
    const { unmount, map } = renderMap();
    // Leaflet tags its container with _leaflet_id while a map is attached;
    // map.remove() clears it (it leaves the CSS classes behind).
    const leafletId = () => (map as HTMLElement & { _leaflet_id?: number })._leaflet_id;
    expect(leafletId()).toBeDefined();
    unmount();
    expect(leafletId()).toBeUndefined();
  });
});
