import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon path issue with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Small house-pin marker rendered as an inline SVG divIcon so every listing
// shows a recognizable home on its coordinates (no external image request).
// `active` swaps to the marigold accent for the highlighted/hovered PG.
const houseMarker = (active = false) => {
  const fill = active ? '#F59E0B' : '#4F46E5'; // marigold vs indigo-brand
  const scale = active ? 1.15 : 1;
  const w = Math.round(34 * scale);
  const h = Math.round(42 * scale);
  return L.divIcon({
    className: 'pg-home-marker',
    html: `
      <span class="pg-home-pin${active ? ' is-active' : ''}" style="width:${w}px;height:${h}px;">
        <svg viewBox="0 0 34 42" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M17 41C17 41 32 27.5 32 16.2 32 7.8 25.3 1 17 1S2 7.8 2 16.2C2 27.5 17 41 17 41Z"
                fill="${fill}" stroke="#ffffff" stroke-width="2"/>
          <path d="M10.5 17.2 17 11.5l6.5 5.7V24a1.2 1.2 0 0 1-1.2 1.2h-3.1v-4.1h-4.4v4.1h-3.1A1.2 1.2 0 0 1 10.5 24z"
                fill="#ffffff"/>
        </svg>
      </span>`,
    iconSize: [w, h],
    iconAnchor: [Math.round(w / 2), h], // tip of the pin sits on the coordinate
    popupAnchor: [0, -h + 6],
  });
};

// Cache the two variants so we don't rebuild an icon per render/marker.
const defaultIcon = houseMarker(false);
const highlightIcon = houseMarker(true);

const toLatLng = (pg) => ({
  ...pg,
  lat: Number(pg.latitude),
  lng: Number(pg.longitude),
});

// Recenter the map when the `center` prop changes — but only until the view has
// been fitted to the PG markers. Once the markers drive the view, user-location
// recentering must not override it. Defined at module scope so its identity is
// stable across renders (no unmount/remount churn on every PGMap re-render).
function RecenterMap({ center, viewAdjustedRef }) {
  const map = useMap();
  useEffect(() => {
    if (center && !viewAdjustedRef.current) {
      map.setView(center, map.getZoom());
    }
  }, [center, map, viewAdjustedRef]);
  return null;
}

// Fit the map bounds to show every PG marker. Re-runs only when the actual set
// of PG coordinates changes (signature guard) — never on hover/center changes —
// so the view is not yanked around after the user has interacted with the map.
function MapFitter({ pgs, viewAdjustedRef }) {
  const map = useMap();
  const lastFitted = useRef(null);

  useEffect(() => {
    if (pgs.length === 0) return;

    const signature = pgs
      .map((pg) => `${pg._id}:${pg.lat.toFixed(6)},${pg.lng.toFixed(6)}`)
      .join('|');
    if (lastFitted.current === signature) return;
    lastFitted.current = signature;

    map.fitBounds(
      L.latLngBounds(pgs.map((pg) => [pg.lat, pg.lng])),
      { padding: [50, 50] }
    );
    viewAdjustedRef.current = true;
  }, [pgs, map, viewAdjustedRef]);

  return null;
}

// Keep tiles/markers correctly positioned when the map container is resized
// (responsive grid, modal opening, etc.) without recreating the map.
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const el = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(el);
    return () => observer.disconnect();
  }, [map]);
  return null;
}

export default function PGMap({
  pgs = [],
  center,
  zoom = 13,
  highlightedPG,
  onMarkerClick,
  className = '',
}) {
  const viewAdjustedRef = useRef(false);
  const mapCenter = center || [12.9716, 77.5946]; // Bangalore default

  // Normalize coordinates and drop any PG without valid lat/lng so no marker is
  // ever rendered at an invalid (invisible) position.
  const validPGs = useMemo(
    () =>
      pgs
        .map(toLatLng)
        .filter((pg) => Number.isFinite(pg.lat) && Number.isFinite(pg.lng)),
    [pgs]
  );

  return (
    <div className={`relative z-10 overflow-hidden ${className}`}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <RecenterMap center={center} viewAdjustedRef={viewAdjustedRef} />
        <MapFitter pgs={validPGs} viewAdjustedRef={viewAdjustedRef} />
        <MapResizer />
        {validPGs.map((pg) => (
          <Marker
            key={pg._id}
            position={[pg.lat, pg.lng]}
            icon={highlightedPG === pg._id ? highlightIcon : defaultIcon}
            eventHandlers={{
              click: () => onMarkerClick?.(pg),
            }}
          >
            <Popup>
              <div className="text-sm">
                <h3 className="font-display font-bold text-ink mb-1">
                  {pg.name}
                </h3>
                <p className="font-display font-extrabold text-ink">
                  ₹{pg.price != null ? pg.price.toLocaleString('en-IN') : '—'}
                  <span className="text-xs font-semibold text-ink/50">/mo</span>
                </p>
                <div className="flex items-center gap-1 mt-1 text-xs text-ink/70">
                  <span className="text-marigold" aria-hidden="true">★</span>
                  <span>{pg.rating != null ? pg.rating.toFixed(1) : '—'}</span>
                  <span>·</span>
                  <span>{pg.reviewCount ?? 0} reviews</span>
                </div>
                {pg.distance != null && (
                  <p className="mt-1 text-xs font-mono text-ink/60">
                    {pg.distance.toFixed(1)} km away
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
