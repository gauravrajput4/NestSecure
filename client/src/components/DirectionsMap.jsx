import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fit the map to the route bounds on mount and whenever they change.
function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [50, 50] });
  }, [bounds, map]);
  return null;
}

// In-app directions powered by OSRM routing. Fetches the route from the user's
// current location to the PG, draws a polyline on the Leaflet map, and displays
// the distance + estimated time ride-app style. Falls back to a straight line
// and a Google Maps link when OSRM fails or geolocation is unavailable.
export default function DirectionsMap({ pg, onClose }) {
  const [userLocation, setUserLocation] = useState(null);
  const [route, setRoute] = useState(null); // { coordinates, distance, duration }
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user location, then fetch the route from OSRM.
    if (!navigator.geolocation) {
      setError('Geolocation not available');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const origin = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(origin);

        try {
          // OSRM public demo instance (self-host for production).
          const url = `https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${pg.longitude},${pg.latitude}?overview=full&geometries=geojson`;
          const res = await fetch(url);
          if (!res.ok) throw new Error('Routing failed');
          const data = await res.json();
          if (!data.routes || data.routes.length === 0) {
            throw new Error('No route found');
          }
          const r = data.routes[0];
          setRoute({
            coordinates: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
            distance: r.distance, // meters
            duration: r.duration, // seconds
          });
        } catch (err) {
          console.error(err);
          // Fallback: straight line from user to PG.
          setRoute({
            coordinates: [origin, [pg.latitude, pg.longitude]],
            distance: null,
            duration: null,
          });
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError('Location permission denied');
        setLoading(false);
      }
    );
  }, [pg]);

  const origin = userLocation || [12.9716, 77.5946]; // fallback center
  const dest = [pg.latitude, pg.longitude];
  const bounds =
    route && userLocation
      ? L.latLngBounds([userLocation, [pg.latitude, pg.longitude]])
      : L.latLngBounds([dest]);

  const distanceKm = route?.distance ? (route.distance / 1000).toFixed(1) : null;
  const etaMin = route?.duration ? Math.round(route.duration / 60) : null;

  // Origin marker (user location) — blue pin.
  const originIcon = L.divIcon({
    className: 'origin-marker',
    html: `<div style="width:24px;height:24px;background:#3B82F6;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  // Destination marker (PG) — marigold house pin matching the map markers.
  const destIcon = L.divIcon({
    className: 'dest-marker',
    html: `<span style="display:block;width:34px;height:42px;">
      <svg viewBox="0 0 34 42" width="34" height="42" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 41C17 41 32 27.5 32 16.2 32 7.8 25.3 1 17 1S2 7.8 2 16.2C2 27.5 17 41 17 41Z" fill="#F59E0B" stroke="#ffffff" stroke-width="2"/>
        <path d="M10.5 17.2 17 11.5l6.5 5.7V24a1.2 1.2 0 0 1-1.2 1.2h-3.1v-4.1h-4.4v4.1h-3.1A1.2 1.2 0 0 1 10.5 24z" fill="#ffffff"/>
      </svg>
    </span>`,
    iconSize: [34, 42],
    iconAnchor: [17, 42],
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header (ride-app style) */}
      <div className="px-6 py-4 border-b border-ink/10 flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-lg text-ink">Directions</h2>
          <p className="text-sm text-ink/60">
            {loading
              ? 'Calculating route...'
              : error
                ? error
                : distanceKm && etaMin
                  ? `${distanceKm} km · ${etaMin} min`
                  : 'Straight-line distance'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-9 w-9 flex items-center justify-center rounded-lg text-ink/50 hover:bg-ink/5 hover:text-ink"
          aria-label="Close"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={origin}
          zoom={13}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {bounds && <FitBounds bounds={bounds} />}

          {/* Origin marker (user location) */}
          {userLocation && (
            <Marker position={userLocation} icon={originIcon} />
          )}

          {/* Destination marker (PG) */}
          <Marker position={dest} icon={destIcon} />

          {/* Route polyline */}
          {route && (
            <Polyline
              positions={route.coordinates}
              color="#4F46E5"
              weight={4}
              opacity={0.8}
            />
          )}
        </MapContainer>
      </div>

      {/* Footer with fallback link */}
      {!loading && (
        <div className="px-6 py-4 border-t border-ink/10 bg-paper">
          <a
            href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation?.[0] || ''},${userLocation?.[1] || ''}&destination=${pg.latitude},${pg.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-brand hover:underline"
          >
            Open in Google Maps →
          </a>
        </div>
      )}
    </div>
  );
}
