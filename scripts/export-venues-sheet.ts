// Writes every Firestore venue to venues.csv so halal, price and food types can be filled in by hand.
//   npm run db:export-sheet
//   npm run db:export-sheet -- --file=my-venues.csv
// Edit the file in Google Sheets or Excel, save it as CSV, then run `npm run db:import-sheet`.

import * as fs from "fs";
import { collection, getDocs } from "firebase/firestore";
import type { Venue } from "../src/lib/types";
import { googleMapsUrl } from "../src/lib/maps";
import { BOM, SHEET_COLUMNS, toCsv } from "./csv";
import { connectFirestore, runScript } from "./firestore";

const yesNo = (value: boolean | undefined) => (value === undefined ? "" : value ? "Y" : "N");

runScript(async () => {
  const fileArg = process.argv.find((a) => a.startsWith("--file="));
  const file = fileArg ? fileArg.split("=")[1] : "venues.csv";

  const db = connectFirestore();
  const venues = (await getDocs(collection(db, "venues"))).docs
    .map((d) => ({ ...(d.data() as Venue), id: d.id }))
    .sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity) || a.name.localeCompare(b.name));

  const rows = venues.map((v) => [
    v.id,
    v.name,
    yesNo(v.isHalal),
    // Blank means nobody has checked yet
    yesNo(v.vegetarian),
    yesNo(v.vegan),
    yesNo(v.noSeafoodOption),
    v.avgPriceMYR,
    // Empty for venues that haven't been filled in yet; kept on re-export so nothing is lost.
    (v.serves ?? []).join(", "),
    v.allergyNotes,
    v.cuisine,
    v.description,
    (v.services ?? []).join(", "),
    (v.openingHours ?? []).join("; "),
    v.rating,
    v.ratingCount,
    v.distanceMeters,
    v.location,
    v.mapsUrl ?? googleMapsUrl(v),
  ]);

  // The BOM makes Excel open the file as UTF-8 so names with accents survive.
  fs.writeFileSync(file, BOM + toCsv([[...SHEET_COLUMNS], ...rows]), "utf-8");
  console.log(`Wrote ${venues.length} venue(s) to ${file}.`);
  console.log("Fill in halal, vegetarian, vegan, noSeafood (Y/N), priceMYR, serves (e.g. \"rice, noodles\") and allergyNotes, then run: npm run db:import-sheet -- --dry-run");
});
