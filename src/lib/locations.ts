import type { LatLng } from "./geo";

export interface CampusLocation extends LatLng {
  id: string;
  // Short label for chips and cards, e.g. "KK12"
  label: string;
  name: string;
}

// Starting points a student can pick. Coordinates are from Google Places.
// To add faculties later, append entries here; ids must stay unique.
export const CAMPUS_LOCATIONS: CampusLocation[] = [
  { id: "kk1", label: "KK1", name: "First Residential College", latitude: 3.11737, longitude: 101.65935 },
  { id: "kk2", label: "KK2", name: "Tuanku Bahiyah", latitude: 3.11763, longitude: 101.65719 },
  { id: "kk3", label: "KK3", name: "Tuanku Kurshiah", latitude: 3.12382, longitude: 101.6501 },
  { id: "kk4", label: "KK4", name: "Bestari", latitude: 3.12485, longitude: 101.64945 },
  { id: "kk5", label: "KK5", name: "Fifth Residential College", latitude: 3.1267, longitude: 101.65975 },
  { id: "kk6", label: "KK6", name: "Ibnu Sina (Avicenna)", latitude: 3.11516, longitude: 101.6553 },
  { id: "kk7", label: "KK7", name: "Za'ba", latitude: 3.1263, longitude: 101.65042 },
  { id: "kk8", label: "KK8", name: "Kinabalu", latitude: 3.12992, longitude: 101.64935 },
  { id: "kk9", label: "KK9", name: "Tun Syed Zahiruddin", latitude: 3.12091, longitude: 101.64573 },
  { id: "kk10", label: "KK10", name: "Tun Ahmad Zaidi", latitude: 3.13064, longitude: 101.65048 },
  { id: "kk11", label: "KK11", name: "Eleventh Residential College", latitude: 3.12929, longitude: 101.66056 },
  { id: "kk12", label: "KK12", name: "Raja Dr. Nazrin Shah", latitude: 3.12568, longitude: 101.66084 },
  { id: "kk13", label: "KK13", name: "Thirteenth Residential College", latitude: 3.119, longitude: 101.63868 },
];

export const DEFAULT_LOCATION_ID = "kk12";

export function findLocation(id: string | undefined): CampusLocation {
  return (
    CAMPUS_LOCATIONS.find((loc) => loc.id === id) ??
    CAMPUS_LOCATIONS.find((loc) => loc.id === DEFAULT_LOCATION_ID)!
  );
}
