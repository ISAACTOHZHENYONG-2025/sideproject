# Venue photos

JPEGs named after the venue id (the Google Place ID, also the Firestore doc id), e.g.
`ChIJlzIJRXpJzDERvkxxxoAitks.jpg`. Cards fall back to a coloured tile when a file is missing.

- In `npm run dev` every card has an **Upload photo** button: pick a JPG, PNG or WebP and it is
  resized to 1024px wide and saved here under the right name, replacing any earlier photo. The
  button and its `/api/dev/venue-photo` route do nothing outside development.
- `npm run venues:photos` prints the filename wanted for every venue in `venues.csv`.
- 16:9 crops look best.
