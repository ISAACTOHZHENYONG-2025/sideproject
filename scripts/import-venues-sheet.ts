// Reads venues.csv (from db:export-sheet) and updates each venue's halal, diet flags, price, food types and allergy notes by id.
//   npm run db:import-sheet -- --dry-run   # show what would change, write nothing
//   npm run db:import-sheet                # write the changes to Firestore
//   npm run db:import-sheet -- --file=my-venues.csv
// Blank cells leave that field as it is. Rows with bad values are skipped.

import * as fs from "fs";
import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import type { Venue } from "../src/lib/types";
import { parseCsv } from "./csv";
import { connectFirestore, runScript } from "./firestore";

const MAX_PRICE_MYR = 200;
const PLACEHOLDER_MENU_ITEM = "Typical meal";

type Update = Partial<
  Pick<Venue, "isHalal" | "vegetarian" | "vegan" | "noSeafoodOption" | "allergyNotes" | "avgPriceMYR" | "serves" | "menuItems">
>;

const MAX_NOTE_LENGTH = 200;

function parseYesNo(column: string, value: string): boolean | undefined | Error {
  const v = value.trim().toLowerCase();
  if (!v) return undefined;
  if (["y", "yes", "true", "1"].includes(v)) return true;
  if (["n", "no", "false", "0"].includes(v)) return false;
  return new Error(`${column} must be Y or N, got "${value}"`);
}

function parseNote(value: string): string | undefined | Error {
  const note = value.trim().replace(/\s+/g, " ");
  if (note.length > MAX_NOTE_LENGTH) return new Error(`allergyNotes is over ${MAX_NOTE_LENGTH} characters`);
  return note || undefined;
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
  for (const required of ["id", "halal", "vegetarian", "vegan", "noseafood", "pricemyr", "serves", "allergynotes"]) {
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
    const halal = parseYesNo("halal", cell("halal"));
    const vegetarian = parseYesNo("vegetarian", cell("vegetarian"));
    const vegan = parseYesNo("vegan", cell("vegan"));
    const noSeafood = parseYesNo("noSeafood", cell("noseafood"));
    const note = parseNote(cell("allergynotes"));
    const price = parsePrice(cell("pricemyr"));
    const problems = [halal, vegetarian, vegan, noSeafood, note, price].filter((v): v is Error => v instanceof Error);
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
    const flags = [
      ["vegetarian", "vegetarian", vegetarian],
      ["vegan", "vegan", vegan],
      ["noSeafood", "noSeafoodOption", noSeafood],
    ] as const;
    for (const [label, field, value] of flags) {
      if (typeof value === "boolean" && value !== venue[field]) {
        data[field] = value;
        const was = venue[field] === undefined ? "blank" : venue[field] ? "Y" : "N";
        changes.push(`${label} ${was} -> ${value ? "Y" : "N"}`);
      }
    }
    if (typeof note === "string" && note !== venue.allergyNotes) {
      data.allergyNotes = note;
      changes.push(`allergyNotes "${venue.allergyNotes ?? ""}" -> "${note}"`);
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
