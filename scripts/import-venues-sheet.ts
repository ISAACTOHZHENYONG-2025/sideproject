// Reads venues.csv (from db:export-sheet) and updates each venue's halal, price and food types by id.
//   npm run db:import-sheet -- --dry-run   # show what would change, write nothing
//   npm run db:import-sheet                # write the changes to Firestore
//   npm run db:import-sheet -- --file=my-venues.csv
// Blank halal/priceMYR/serves cells leave that field as it is. Rows with bad values are skipped.

import * as fs from "fs";
import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import type { Venue } from "../src/lib/types";
import { parseCsv } from "./csv";
import { connectFirestore, runScript } from "./firestore";

const MAX_PRICE_MYR = 200;
const PLACEHOLDER_MENU_ITEM = "Typical meal";

type Update = Partial<Pick<Venue, "isHalal" | "avgPriceMYR" | "serves" | "menuItems">>;

function parseHalal(value: string): boolean | undefined | Error {
  const v = value.trim().toLowerCase();
  if (!v) return undefined;
  if (["y", "yes", "true", "1"].includes(v)) return true;
  if (["n", "no", "false", "0"].includes(v)) return false;
  return new Error(`halal must be Y or N, got "${value}"`);
}

function parsePrice(value: string): number | undefined | Error {
  const v = value.trim().replace(/^rm\s*/i, "");
  if (!v) return undefined;
  const price = Number(v);
  if (!Number.isFinite(price) || price <= 0 || price > MAX_PRICE_MYR) {
    return new Error(`priceMYR must be a number between 0 and ${MAX_PRICE_MYR}, got "${value}"`);
  }
  return Math.round(price * 100) / 100;
}

function parseServes(value: string): string[] | undefined {
  const items = value
    .split(/[,;]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return items.length > 0 ? [...new Set(items)] : undefined;
}

const sameList = (a: string[] = [], b: string[] = []) => a.join("|") === b.join("|");

runScript(async () => {
  const dryRun = process.argv.includes("--dry-run");
  const fileArg = process.argv.find((a) => a.startsWith("--file="));
  const file = fileArg ? fileArg.split("=")[1] : "venues.csv";
  if (!fs.existsSync(file)) {
    console.error(`${file} not found. Run npm run db:export-sheet first.`);
    process.exit(1);
  }

  const [header, ...rows] = parseCsv(fs.readFileSync(file, "utf-8"));
  const col = Object.fromEntries((header ?? []).map((name, i) => [name.trim().toLowerCase(), i]));
  for (const required of ["id", "halal", "pricemyr", "serves"]) {
    if (col[required] === undefined) {
      console.error(`${file} is missing the "${required}" column. Expected the columns from db:export-sheet.`);
      process.exit(1);
    }
  }

  const db = connectFirestore();
  const venues = new Map(
    (await getDocs(collection(db, "venues"))).docs.map((d) => [d.id, d.data() as Venue]),
  );

  const updates: { id: string; name: string; data: Update }[] = [];
  let skipped = 0;

  rows.forEach((row, index) => {
    const line = index + 2; // header is line 1
    const cell = (name: string) => row[col[name]] ?? "";
    const id = cell("id").trim();
    const venue = venues.get(id);
    const label = `Line ${line} (${cell("name") || id || "no id"})`;

    if (!venue) {
      console.log(`SKIP  ${label}: no venue with id "${id}"`);
      skipped++;
      return;
    }
    const halal = parseHalal(cell("halal"));
    const price = parsePrice(cell("pricemyr"));
    const problems = [halal, price].filter((v): v is Error => v instanceof Error);
    if (problems.length > 0) {
      console.log(`SKIP  ${label}: ${problems.map((p) => p.message).join("; ")}`);
      skipped++;
      return;
    }

    const serves = parseServes(cell("serves"));
    const data: Update = {};
    const changes: string[] = [];

    if (typeof halal === "boolean" && halal !== Boolean(venue.isHalal)) {
      data.isHalal = halal;
      changes.push(`halal ${venue.isHalal ? "Y" : "N"} -> ${halal ? "Y" : "N"}`);
    }
    if (typeof price === "number" && price !== venue.avgPriceMYR) {
      data.avgPriceMYR = price;
      changes.push(`price RM${venue.avgPriceMYR} -> RM${price}`);
      // Imported venues carry one placeholder menu item at the average price; keep it in step.
      if (venue.menuItems?.length === 1 && venue.menuItems[0].itemName === PLACEHOLDER_MENU_ITEM) {
        data.menuItems = [{ itemName: PLACEHOLDER_MENU_ITEM, priceMYR: price }];
      }
    }
    if (serves && !sameList(serves, venue.serves)) {
      data.serves = serves;
      changes.push(`serves [${(venue.serves ?? []).join(", ")}] -> [${serves.join(", ")}]`);
    }

    if (changes.length > 0) {
      updates.push({ id, name: venue.name, data });
      console.log(`EDIT  ${venue.name}: ${changes.join("; ")}`);
    }
  });

  console.log(`\n${rows.length} row(s): ${updates.length} to update, ${skipped} skipped, ${rows.length - updates.length - skipped} unchanged.`);

  if (dryRun) {
    console.log("Dry run: nothing written.");
    return;
  }
  for (let i = 0; i < updates.length; i += 400) {
    const batch = writeBatch(db);
    for (const u of updates.slice(i, i + 400)) batch.update(doc(db, "venues", u.id), u.data);
    await batch.commit();
  }
  if (updates.length > 0) console.log(`Updated ${updates.length} venue(s) in Firestore.`);
});
