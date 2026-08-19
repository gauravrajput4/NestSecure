import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { reverseGeocode } from '../utils/reverseGeocode.js';

// Fix Leaflet default icon path issue with Vite (same as PGMap).
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DEFAULT_CENTER = [12.9716, 77.5946]; // Bangalore
const DEFAULT_ZOOM = 13;
const LOCATE_ZOOM = 16;

const pinIcon = L.divIcon({
  className: 'location-picker-marker',
  html: `<span style="display:block;width:34px;height:42px;">
    <svg viewBox="0 0 34 42" width="34" height="42" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17 41C17 41 32 27.5 32 16.2 32 7.8 25.3 1 17 1S2 7.8 2 16.2C2 27.5 17 41 17 41Z"
            fill="#4F46E5" stroke="#ffffff" stroke-width="2"/>
      <path d="M10.5 17.2 17 11.5l6.5 5.7V24a1.2 1.2 0 0 1-1.2 1.2h-3.1v-4.1h-4.4v4.1h-3.1A1.2 1.2 0 0 1 10.5 24z"
            fill="#ffffff"/>
    </svg>
  </span>`,
  iconSize: [34, 42],
  iconAnchor: [17, 42],
});

function FlyTo({ target, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo(target, zoom ?? map.getZoom(), { duration: 0.75 });
  }, [target, zoom, map]);
  return null;
}

function parseCoords(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (
    latitude === '' ||
    longitude === '' ||
    Number.isNaN(lat) ||
    Number.isNaN(lng)
  ) {
    return null;
  }
  return [lat, lng];
}

/**
 * Interactive map for picking a PG location.
 * - Drag the pin → reverse-geocode → fill address, city, lat, lng
 * - Location button → browser geolocation → same field mapping
 */
export default function LocationPickerMap({
  latitude,
  longitude,
  onLocationChange,
  onError,
  className = '',
}) {
  const initial = parseCoords(latitude, longitude) || DEFAULT_CENTER;
  const [position, setPosition] = useState(initial);
  const [flyTarget, setFlyTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  // Keep the pin in sync when lat/lng are typed manually.
  useEffect(() => {
    const next = parseCoords(latitude, longitude);
    if (!next) return;
    setPosition((prev) =>
      prev[0] === next[0] && prev[1] === next[1] ? prev : next
    );
  }, [latitude, longitude]);

  const resolveAndEmit = async (lat, lng, { fly = false } = {}) => {
    const rounded = {
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
    };
    setPosition([rounded.latitude, rounded.longitude]);
    if (fly) setFlyTarget([rounded.latitude, rounded.longitude]);

    setBusy(true);
    try {
      const place = await reverseGeocode(rounded.latitude, rounded.longitude);
      onLocationChange({
        ...rounded,
        address: place.address || undefined,
        city: place.city || undefined,
      });
    } catch {
      onLocationChange(rounded);
      onError?.('Could not resolve the street address — coordinates were saved.');
    } finally {
      setBusy(false);
    }
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      onError?.('Geolocation is not supported by your browser.');
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolveAndEmit(pos.coords.latitude, pos.coords.longitude, {
          fly: true,
        });
      },
      (err) => {
        setBusy(false);
        const msg =
          err?.code === 1
            ? 'Location permission denied. Enable access and try again.'
            : 'Could not get your current location. Try again.';
        onError?.(msg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  return (
    <div
      className={`relative rounded-xl2 overflow-hidden border-2 border-ink/10 ${className}`}
    >
      <MapContainer
        center={initial}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        className="h-64 sm:h-72 w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <FlyTo target={flyTarget} zoom={LOCATE_ZOOM} />
        <Marker
          position={position}
          draggable
          icon={pinIcon}
          eventHandlers={{
            dragend: (e) => {
              const { lat, lng } = e.target.getLatLng();
              resolveAndEmit(lat, lng);
            },
          }}
        />
      </MapContainer>

      {/* Current-location control */}
      <button
        type="button"
        onClick={handleLocate}
        disabled={busy}
        title="Use my current location"
        aria-label="Use my current location"
        className="absolute top-3 right-3 z-[1000] h-10 w-10 rounded-xl bg-white shadow-card border border-ink/10 text-indigo-brand hover:bg-indigo-brand hover:text-white disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center transition"
      >
        {busy ? (
          <svg
            className="h-5 w-5 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-90"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
            />
          </svg>
        ) : (
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            <circle cx="12" cy="12" r="8" />
          </svg>
        )}
      </button>

      <p className="absolute bottom-2 left-2 right-14 z-[1000] pointer-events-none text-[11px] sm:text-xs font-medium text-ink/70 bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1.5 shadow-sm">
        Drag the pin or use the location button to set address, city &amp;
        coordinates.
      </p>
    </div>
  );
}
