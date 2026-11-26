// Where you are: geolocation, place names and city search.
// Network lookups are optional: everything falls back to the built-in city list.

export const NEW_YORK = { name: 'New York', lat: 40.7128, lon: -74.006, tz: 'America/New_York' };

export const CITIES = [
  NEW_YORK,
  { name: 'Crown Heights', lat: 40.6694, lon: -73.9422, tz: 'America/New_York' },
  { name: 'Jerusalem', lat: 31.7683, lon: 35.2137, tz: 'Asia/Jerusalem' },
  { name: 'Tel Aviv', lat: 32.0853, lon: 34.7818, tz: 'Asia/Jerusalem' },
  { name: 'Kfar Chabad', lat: 31.9897, lon: 34.8519, tz: 'Asia/Jerusalem' },
  { name: 'Tzfas', lat: 32.9646, lon: 35.496, tz: 'Asia/Jerusalem' },
  { name: 'Haifa', lat: 32.794, lon: 34.9896, tz: 'Asia/Jerusalem' },
  { name: 'Miami', lat: 25.7617, lon: -80.1918, tz: 'America/New_York' },
  { name: 'Chicago', lat: 41.8781, lon: -87.6298, tz: 'America/Chicago' },
  { name: 'Los Angeles', lat: 34.0522, lon: -118.2437, tz: 'America/Los_Angeles' },
  { name: 'Toronto', lat: 43.6532, lon: -79.3832, tz: 'America/Toronto' },
  { name: 'Montreal', lat: 45.5017, lon: -73.5673, tz: 'America/Toronto' },
  { name: 'London', lat: 51.5072, lon: -0.1276, tz: 'Europe/London' },
  { name: 'Paris', lat: 48.8566, lon: 2.3522, tz: 'Europe/Paris' },
  { name: 'Antwerp', lat: 51.2194, lon: 4.4025, tz: 'Europe/Brussels' },
  { name: 'Moscow', lat: 55.7558, lon: 37.6173, tz: 'Europe/Moscow' },
  { name: 'Johannesburg', lat: -26.2041, lon: 28.0473, tz: 'Africa/Johannesburg' },
  { name: 'Melbourne', lat: -37.8136, lon: 144.9631, tz: 'Australia/Melbourne' },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093, tz: 'Australia/Sydney' },
  { name: 'Buenos Aires', lat: -34.6037, lon: -58.3816, tz: 'America/Argentina/Buenos_Aires' },
  { name: 'São Paulo', lat: -23.5505, lon: -46.6333, tz: 'America/Sao_Paulo' },
];

export function distanceKm(a, b) {
  const r = Math.PI / 180;
  const h = Math.sin(((b.lat - a.lat) * r) / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lon - a.lon) * r) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

export const isIsrael = (loc) => loc.tz === 'Asia/Jerusalem';

/** Minutes before shkiah for candle lighting, by local custom. */
export function candleMinutes(loc) {
  if (distanceKm(loc, { lat: 31.7683, lon: 35.2137 }) < 25) return 40;
  if (distanceKm(loc, { lat: 32.794, lon: 34.9896 }) < 20) return 30;
  return 18;
}

async function getJSON(url, ms = 6000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

export function geolocate() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('unsupported'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: +p.coords.latitude.toFixed(4), lon: +p.coords.longitude.toFixed(4), tz: Intl.DateTimeFormat().resolvedOptions().timeZone }),
      reject,
      { timeout: 12000, maximumAge: 15 * 60000, enableHighAccuracy: false }
    );
  });
}

export async function geoPermission() {
  try {
    return (await navigator.permissions.query({ name: 'geolocation' })).state;
  } catch {
    return 'prompt';
  }
}

/** A readable name for coordinates. */
export async function placeName({ lat, lon }) {
  try {
    const j = await getJSON(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
    const n = j.locality || j.city || j.principalSubdivision;
    if (n) return n;
  } catch {}
  const near = CITIES.map((c) => [distanceKm(c, { lat, lon }), c]).sort((a, b) => a[0] - b[0])[0];
  return near[0] < 40 ? `Near ${near[1].name}` : `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
}

/** Search any city by name. Returns [] when offline. */
export async function searchPlaces(q) {
  try {
    const j = await getJSON(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=en&format=json`);
    return (j.results || []).map((r) => ({
      name: r.name, detail: [r.admin1, r.country].filter(Boolean).join(', '),
      lat: +r.latitude.toFixed(4), lon: +r.longitude.toFixed(4), tz: r.timezone,
    }));
  } catch {
    return null;
  }
}
