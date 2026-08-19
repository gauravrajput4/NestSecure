/**
 * Reverse-geocode lat/lng via OpenStreetMap Nominatim.
 * Returns a street-ish address + city suitable for the listing form.
 */
export async function reverseGeocode(lat, lng) {
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('format', 'json');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('zoom', '18');

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error('Reverse geocoding failed');

  const data = await res.json();
  const addr = data.address || {};

  const streetLine = [addr.house_number, addr.road].filter(Boolean).join(' ');
  const locality =
    addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || '';
  const address =
    [streetLine, locality].filter(Boolean).join(', ') ||
    data.display_name?.split(',').slice(0, 2).join(',').trim() ||
    '';

  const city =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.municipality ||
    addr.city_district ||
    addr.county ||
    addr.state_district ||
    '';

  return { address, city, displayName: data.display_name || '' };
}
