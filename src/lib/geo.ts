export interface LatLng {
  latitude: number;
  longitude: number;
}

// Universiti Malaya campus centre. Distances and walk times are measured from here;
// Google Maps works out the real route from the student's own location.
export const UM_CAMPUS_CENTER: LatLng = { latitude: 3.1209, longitude: 101.6538 };

const WALK_METERS_PER_MIN = 80;
// Straight-line distance understates road distance; city driving averages about 25 km/h.
const DRIVE_ROAD_FACTOR = 1.4;
const DRIVE_METERS_PER_MIN = 420;
const DRIVE_PARKING_MINS = 3;

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

export function walkMinutes(meters: number): number {
  return Math.max(1, Math.ceil(meters / WALK_METERS_PER_MIN));
}

export function driveMinutes(meters: number): number {
  return Math.ceil((meters * DRIVE_ROAD_FACTOR) / DRIVE_METERS_PER_MIN) + DRIVE_PARKING_MINS;
}

export function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters / 10) * 10} m` : `${(meters / 1000).toFixed(1)} km`;
}
