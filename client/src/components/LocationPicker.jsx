import { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon path issue with Vite (same fix as PGMap.jsx)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DEFAULT_CENTER = [12.9716, 77.5946]; // Bangalore
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

// Custom draggable house-pin marker (marigold accent so it reads as a "pick this
// spot" affordance, distinct from the indigo listing markers on PGMap).
const pickerIcon = L.divIcon({
  className: 'pg-picker-marker',
  html: `
    <span class="pg-picker-pin" style="width:38px;height:46px;display:block;">
      <svg viewBox="0 0 34 42" width="38" height="46" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M17 41C17 41 32 27.5 32 16.2 32 7.8 25.3 1 17 1S2 7.8 2 16.2C2 27.5 17 41 17 41Z"
              fill="#F59E0B" stroke="#ffffff" stroke-width="2"/>
        <path d="M10.5 17.2 17 11.5l6.5 5.7V24a1.2 1.2 0 0 1-1.2 1.2h-3.1v-4.1h-4.4v4.1h-3.1A1.2 1.2 0 0 1 10.5 24z"
              fill="#ffffff"/>
      </svg>
    </span>`,
  iconSize: [38, 46],
  iconAnchor: [19, 46], // tip of the pin sits on the coordinate
  popupAnchor: [0, -40],
});

// Reverse-geocode a lat/lng pair via Nominatim and distill it into the address
// + city strings the AddListing form expects. Returns null on failure.
async function reverseGeocode(lat, lng) {
  try {
    const url = `${NOMINATIM_BASE}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error('Reverse geocode failed');
    const data = await res.json();
    const a = data?.address || {};
    // India-centric field fallbacks: city/town/village/county/district
    const city =
      a.city ||
      a.town ||
      a.village ||
      a.county ||
      a.district ||
      a.state_district ||
      a.state ||
      '';
    const streetParts = [
      a.house_number,
      a.building,
      a.road,
      a.neighbourhood,
      a.suburb,
      a.area,
    ].filter(Boolean);
    const address = streetParts.length
      ? streetParts.join(', ')
      : data.display_name?.split(',').slice(0, 3).join(', ') || '';
    return { address, city, displayName: data.display_name || '' };
  } catch (err) {
    console.error('reverseGeocode', err);
    return null;
  }
}

// Imperatively recenter the map whenever `center` changes (e.g. when the user
// hits "Use my current location" or the parent pushes a saved coordinate).
function RecenterMap({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom ?? map.getZoom());
  }, [center, zoom, map]);
  return null;
}

// Capture map clicks so the owner can also drop the marker by tapping the map.
function ClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick?.(e.latlng);
    },
  });
  return null;
}

// Props:
//   value: { latitude, longitude, address, city } (strings, matching AddListing form)
//   onChange: (partial) => void  — called with the merged patch to apply
//   className, mapHeight
export default function LocationPicker({
  value,
  onChange,
  className = '',
  mapHeight = 320,
}) {
  const hasCoords =
    value.latitude !== '' && value.longitude !== '' &&
    !Number.isNaN(Number(value.latitude)) &&
    !Number.isNaN(Number(value.longitude));
  const initialCenter = hasCoords
    ? [Number(value.latitude), Number(value.longitude)]
    : DEFAULT_CENTER;
  const initialMarker = hasCoords
    ? [Number(value.latitude), Number(value.longitude)]
    : null;

  const [marker, setMarker] = useState(initialMarker);
  const [center, setCenter] = useState(initialCenter);
  const [locating, setLocating] = useState(false); // "Use current location" spinner
  const [hint, setHint] = useState(
    initialMarker ? 'Marker placed on your saved location.' : 'Drag the marker or click the map to place your PG.'
  );
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Push coordinate updates up to the parent and trigger reverse geocoding so
  // the address/city inputs auto-fill. `source` is just for hint messages.
  const fromLatLng = async (lat, lng, source) => {
    const latR = Number(lat.toFixed(6));
    const lngR = Number(lng.toFixed(6));
    setMarker([latR, lngR]);
    setCenter([latR, lngR]);
    onChange?.({
      latitude: String(latR),
      longitude: String(lngR),
    });
    setHint('Looking up address…');
    const geo = await reverseGeocode(latR, lngR);
    if (!mountedRef.current) return;
    if (geo) {
      const patch = {};
      if (geo.address) patch.address = geo.address;
      if (geo.city) patch.city = geo.city;
      if (Object.keys(patch).length) onChange?.(patch);
      setHint(
        source === 'geo'
          ? 'Locked on to your current location — address fields updated.'
          : 'Marker moved — address and city updated.'
      );
    } else {
      setHint('Could not resolve an address for this spot — enter one manually.');
    }
  };

  const handleMarkerDragEnd = (e) => {
    const { lat, lng } = e.target.getLatLng();
    fromLatLng(lat, lng, 'drag');
  };

  const handleMapClick = (latlng) => fromLatLng(latlng.lat, latlng.lng, 'click');

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setHint('Geolocation is not supported by this browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await fromLatLng(pos.coords.latitude, pos.coords.longitude, 'geo');
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setHint(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied.'
            : 'Could not get your current location.'
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">
            Pin your PG on the map
          </p>
          <p className="text-sm text-ink/60">
            Drag the marker, click a spot, or use your current location. The
            address fields and coordinates below update automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          aria-label="Use my current location"
          title="Use my current location"
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-brand text-white hover:bg-indigo-brand/90 focus:outline-none focus:ring-2 focus:ring-indigo-brand/30 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {locating ? (
            <svg
              className="animate-spin h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
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
            </svg>
          )}
        </button>
      </div>

      <div
        className="rounded-xl2 overflow-hidden shadow-card border border-ink/10 relative"
        style={{ height: mapHeight }}
      >
        <MapContainer
          center={center}
          zoom={14}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <RecenterMap center={center} />
          <ClickHandler onClick={handleMapClick} />
          {marker && (
            <Marker
              position={marker}
              icon={pickerIcon}
              draggable
              eventHandlers={{ dragend: handleMarkerDragEnd }}
            />
          )}
        </MapContainer>
      </div>

      <p className="text-sm text-ink/60">{hint}</p>
      {marker && (
        <p className="font-mono text-xs text-ink/50">
          {marker[0].toFixed(6)}, {marker[1].toFixed(6)}
        </p>
      )}
    </div>
  );
}
