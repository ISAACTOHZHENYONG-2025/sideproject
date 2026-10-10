# makanApa

Campus dining matches for Universiti Malaya students. Pick a craving, a budget, a distance and any
diet needs, and the app suggests where to eat around UM, with a short reason for each pick and a
Google Maps link.

Built with Next.js 16 (App Router), React 19, Tailwind CSS 4, Firebase Firestore and Gemini.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in the keys below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

All of these go in `.env.local`, which is gitignored.

| Variable | Used for |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`, `_AUTH_DOMAIN`, `_PROJECT_ID`, `_STORAGE_BUCKET`, `_MESSAGING_SENDER_ID`, `_APP_ID` | Firestore, which holds the `venues` collection (and group rooms). |
| `GEMINI_API_KEY` | Ranking matches and writing the reasons in `/api/decide`. Server-side only. |
| `GOOGLE_MAPS_API_KEY` | `npm run db:import-nearby` only. Needs Places API (New) enabled. |
| `NEXT_PUBLIC_ENABLE_GROUP` | Turns group mode on. See [Feature flags](#feature-flags). |

The app still works without `GEMINI_API_KEY`. `/api/decide` falls back to code-only matching
(the craving checked against each venue's foods, name, tags and menu) and reports
`engine: "fallback"`. It does the same when Gemini fails or returns nothing usable.

## How it works

- **`/`**: the home feed, with the top recommendations and a list of more matches.
- **`/filter`**: the filter sheet (craving, budget, distance, diet). Diet and other simple toggles
  filter the cached cards on the client right away. Budget and distance changes mark the results
  stale until the user asks for an update. Halal and Non-halal can be picked one, both or neither
  (both or neither means no halal preference).
- **`POST /api/decide`**: loads venues from Firestore plus a few hard-coded off-campus spots, filters
  them by budget, diet and straight-line distance from the UM campus centre, then asks Gemini to rank
  the candidates and explain each pick. A venue known to break a ticked diet filter is dropped. A venue
  nobody has checked (`unknown`) is kept, but only under See more with an "unconfirmed" label, after the
  confirmed ones; the top 3 are always confirmed.

Code layout:

```
src/app/            pages and API routes
src/components/     home feed, filter sheet, group room, bottom nav
src/lib/            shared logic: diet rules, filters, geo, maps links, Firebase, venue images
scripts/            venue data tools and the smoke test
public/venues/      venue photos
```

The UI follows the design system in [DESIGN.md](DESIGN.md).

## Managing venue data

Venues live in the Firestore `venues` collection. Every script reads its keys from `.env.local`.

| Command | What it does |
| --- | --- |
| `npm run db:import-nearby` | Imports food places around UM from Google Places. Supports `--area=<um, bangsar, ss2, taman-paramount or sec17>`, `--min-reviews=<n>`, `--dry-run`, `--extent=<metres>`, `--max-calls=<n>`, `--resume` and `--use-cache`. Safe to re-run: places are keyed by Google place ID and near-duplicates are skipped. |
| `npm run db:export-sheet` | Writes every venue to `venues.csv` so halal, diet flags, price, foods and allergy notes can be filled in by hand. |
| `npm run db:import-sheet` | Reads the edited `venues.csv` back into Firestore. Use `--dry-run` first. Blank cells leave a field unchanged. `halal` is `halal`, `non-halal` or `unknown`; `vegetarian`, `vegan` and `noSeafood` are `yes`, `no` or `unknown` (the old `Y` / `N` still load). |
| `npm run db:cli` | Interactive terminal tool to view, add, edit and delete venues. |

The usual loop is import nearby → export sheet → edit in Google Sheets or Excel → import sheet.
The Places project allows 100 nearby searches a day, so a large import may need `--resume` the
next day.

## Venue photos

Cards look for a JPEG in `public/venues/`, named after the venue's slug (for example,
"He & She Coffee" becomes `he-and-she-coffee.jpg`). Run `npm run venues:photos` for the list of
wanted filenames and what is still missing (`npm run venues:photos -- todo` lists only the gaps). It
reads `venues.csv`, so run `db:export-sheet` first. A venue with no photo falls back to a
cuisine-coloured tile, so the list can be worked through in any order. 16:9 crops look best.

`next.config.ts` only allows image optimisation for `/venues/**`. Add any other local image path
there before pointing `next/image` at it.

## Feature flags

Group mode (room codes, shared diet filters) is built but kept off the public site: the `/group`
page and every `/api/group/*` route return 404, and the Group nav tab is hidden. Set
`NEXT_PUBLIC_ENABLE_GROUP=true` in `.env.local` to turn all of it back on for local work. The flag
is read at build time, so a deploy without it ships no group route at all.

## Testing

With the dev server running:

```bash
node scripts/smoke-test.mjs                 # against http://localhost:3000
node scripts/smoke-test.mjs https://example # or any other base URL
```

It checks that every page and API route returns what it should. The group checks are skipped when
group mode is off. When it is on, they write a test room and two participants to Firestore.

Run `npm run lint` for ESLint and `npm run build` for a production build.
