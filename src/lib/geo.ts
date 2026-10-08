export interface LatLng {
  latitude: number;
  longitude: number;
}

// Universiti Malaya campus centre. Distances are measured from here; Google Maps works out the real
// route and travel time (walk, bus, LRT or car) from the student's own location.
export const UM_CAMPUS_CENTER: LatLng = { latitude: 3.1209, longitude: 101.6538 };

// Great-circle (straight-line) distance in metres.
export function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters / 10) * 10} m` : `${(meters / 1000).toFixed(1)} km`;
}
