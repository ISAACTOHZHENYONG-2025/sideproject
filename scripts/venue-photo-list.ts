// Prints the photo filename every venue in venues.csv is looking for (<id>.jpg, the Place ID), and whether it is there yet.
// In `npm run dev` the "Upload photo" button on each card writes these files for you; you can also drop
// JPEGs into public/venues/ by hand using these exact names. Cards without one fall back to a coloured
// tile, so you can work through the list in any order.
//
//   npm run venues:photos          # every venue
//   npm run venues:photos -- todo  # only the ones still missing a photo

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseCsv } from "./csv";

const ROOT = path.join(import.meta.dirname, "..");
const PHOTO_DIR = path.join(ROOT, "public", "venues");

async function main() {
  const todoOnly = process.argv.includes("todo");
  const rows = parseCsv(await readFile(path.join(ROOT, "venues.csv"), "utf8"));
  const idColumn = rows[0].indexOf("id");
  const nameColumn = rows[0].indexOf("name");
  if (idColumn === -1 || nameColumn === -1) throw new Error("venues.csv needs 'id' and 'name' columns");

  const venues = rows
    .slice(1)
    .map((row) => ({ id: row[idColumn]?.trim(), name: row[nameColumn]?.trim() }))
    .filter((venue) => venue.id && venue.name)
    .map(({ id, name }) => {
      const file = `${id}.jpg`;
      return { name, file, have: existsSync(path.join(PHOTO_DIR, file)) };
    });

  const missing = venues.filter((venue) => !venue.have);
  for (const venue of todoOnly ? missing : venues) {
    console.log(`${venue.have ? "✓" : " "} ${venue.file.padEnd(32)} ${venue.name}`);
  }

  console.log(`\n${venues.length - missing.length}/${venues.length} venues have a photo in public/venues/`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
