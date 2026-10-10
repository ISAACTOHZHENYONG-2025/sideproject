import type { Venue } from "./types";

type MapsTarget = Pick<Venue, "name"> & Partial<Pick<Venue, "location" | "placeId">>;

// Google Maps directions link. With no origin, Maps starts from the user's current
// location and works out the route and travel time itself; on phones it opens the app.
export function googleMapsUrl({ name, location, placeId }: MapsTarget): string {
  const params = new URLSearchParams({
    api: "1",
    destination: location ? `${name}, ${location}` : name,
  });
  if (placeId) params.set("destination_place_id", placeId);
  return `https://www.google.com/maps/dir/?${params}`;
}

// Recommendations only carry the venue name, so look the venue up to get its address and place ID.
export function mapsUrlForVenueName(venueName: string, venues: MapsTarget[]): string {
  const key = venueName.trim().toLowerCase();
  const venue = venues.find((v) => v.name.trim().toLowerCase() === key);
  return googleMapsUrl(venue ?? { name: venueName });
}
