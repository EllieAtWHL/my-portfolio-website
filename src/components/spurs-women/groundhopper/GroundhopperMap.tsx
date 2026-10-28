'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { LatLng } from '@/lib/groundhopper';

interface GroundhopperMapProps {
  guess: LatLng | null;
  // Set once the round is revealed - draws the real location and a line to it.
  answer: LatLng | null;
  interactive: boolean;
  onGuess: (guess: LatLng) => void;
  // Changes each round so the view resets to the starting view.
  roundKey: number;
}

// Esri's Dark Gray Canvas *base* layer - its place names live in a separate
// reference layer we deliberately don't load, since a labelled map would give
// the answer away. Needs no API key (CARTO's dark_nolabels now does). Tiles
// are <img>s, which the CSP's img-src (https:) already allows. See
// reference/spurs-women/groundhopper/README.md for the provider choice.
const TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
const TILE_ATTRIBUTION = 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors';
// The base layer starts drawing road names from about zoom 15 ("Stadium Way"
// would be a giveaway); at 13 only county boundary names show, and individual
// London grounds are still easy to tell apart.
const MAX_ZOOM = 13;

// Great Britain, padded - most grounds are in England. Players zoom out for
// the odd one abroad (e.g. pre-season in Spain).
const START_BOUNDS = L.latLngBounds([49.8, -8.2], [58.7, 1.9]);

const toLeaflet = (point: LatLng) => L.latLng(point.latitude, point.longitude);

export default function GroundhopperMap({ guess, answer, interactive, onGuess, roundKey }: GroundhopperMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const interactiveRef = useRef(interactive);
  const onGuessRef = useRef(onGuess);

  useEffect(() => {
    interactiveRef.current = interactive;
    onGuessRef.current = onGuess;
  });

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    const map = L.map(containerRef.current, {
      worldCopyJump: true,
      minZoom: 3,
      maxZoom: MAX_ZOOM,
      zoomSnap: 0.5,
    });
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: MAX_ZOOM }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    map.fitBounds(START_BOUNDS);

    const guessFrom = (latlng: L.LatLng) => {
      const wrapped = latlng.wrap();
      onGuessRef.current({ latitude: wrapped.lat, longitude: wrapped.lng });
    };
    map.on('click', (event: L.LeafletMouseEvent) => {
      if (interactiveRef.current) {
        guessFrom(event.latlng);
      }
    });
    // Keyboard alternative to tapping: arrow keys pan (Leaflet's own keyboard
    // handler), Enter/Space drops the pin at the centre crosshair.
    // Clicking also focuses the container, so the crosshair is keyed off
    // data-keyboard (set by a key press, cleared by the pointer) rather than
    // :focus-visible, which Chrome matches here after a click too.
    const container = map.getContainer();
    const onKeyDown = (event: KeyboardEvent) => {
      container.dataset.keyboard = 'true';
      if (interactiveRef.current && (event.key === 'Enter' || event.key === ' ') && event.target === container) {
        event.preventDefault();
        guessFrom(map.getCenter());
      }
    };
    const onPointerDown = () => {
      delete container.dataset.keyboard;
    };
    container.addEventListener('keydown', onKeyDown);
    container.addEventListener('pointerdown', onPointerDown);
    mapRef.current = map;

    return () => {
      container.removeEventListener('keydown', onKeyDown);
      container.removeEventListener('pointerdown', onPointerDown);
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    mapRef.current?.fitBounds(START_BOUNDS);
  }, [roundKey]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) {
      return;
    }
    layer.clearLayers();

    if (guess) {
      L.circleMarker(toLeaflet(guess), { radius: 8, weight: 3, className: 'groundhopper-guess-marker' }).addTo(layer);
    }
    if (answer) {
      L.circleMarker(toLeaflet(answer), { radius: 9, weight: 3, className: 'groundhopper-answer-marker' }).addTo(layer);
      if (guess) {
        L.polyline([toLeaflet(guess), toLeaflet(answer)], { weight: 2, dashArray: '6 6', className: 'groundhopper-line' }).addTo(layer);
        map.fitBounds(L.latLngBounds([toLeaflet(guess), toLeaflet(answer)]), { padding: [48, 48], maxZoom: MAX_ZOOM });
      } else {
        map.setView(toLeaflet(answer), MAX_ZOOM);
      }
    }
  }, [guess, answer]);

  return (
    <div className={`groundhopper-map-frame${interactive ? ' is-interactive' : ''}`}>
      <div
        ref={containerRef}
        className="groundhopper-map"
        role="application"
        aria-label={
          interactive
            ? 'Map. Tap where you think the stadium is, or use the arrow keys to move the map and press Enter to drop a pin at the centre.'
            : 'Map showing your guess and the stadium’s real location.'
        }
      />
      {interactive && <div className="groundhopper-crosshair" aria-hidden="true" />}
    </div>
  );
}
