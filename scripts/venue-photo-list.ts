// Prints the photo filename every venue in venues.csv is looking for, and whether it is there yet.
// Drop JPEGs into public/venues/ using these exact names; cards without one fall back to a
// coloured tile, so you can work through the list in any order.
//
//   npm run venues:photos          # every venue
//   npm run venues:photos -- todo  # only the ones still missing a photo

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseCsv } from "./csv";
import { venueSlug } from "../src/lib/venueImage";

const ROOT = path.join(import.meta.dirname, "..");
const PHOTO_DIR = path.join(ROOT, "public", "venues");

async function main() {
  const todoOnly = process.argv.includes("todo");
  const rows = parseCsv(await readFile(path.join(ROOT, "venues.csv"), "utf8"));
  const nameColumn = rows[0].indexOf("name");
  if (nameColumn === -1) throw new Error("venues.csv has no 'name' column");

  const venues = rows
    .slice(1)
    .map((row) => row[nameColumn]?.trim())
    .filter((name): name is string => Boolean(name))
    .map((name) => {
      const file = `${venueSlug(name)}.jpg`;
      return { name, file, have: existsSync(path.join(PHOTO_DIR, file)) };
    });

  const missing = venues.filter((venue) => !venue.have);
  for (const venue of todoOnly ? missing : venues) {
    console.log(`${venue.have ? "✓" : " "} ${venue.file.padEnd(44)} ${venue.name}`);
  }

  console.log(`\n${venues.length - missing.length}/${venues.length} venues have a photo in public/venues/`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
