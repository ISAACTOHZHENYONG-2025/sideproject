// Byte-order mark: makes Excel read the file as UTF-8.
export const BOM = String.fromCharCode(0xfeff);

// halal (halal / non-halal / unknown), vegetarian, vegan, noSeafood (yes / no / unknown), nonHalal, noBeef (Y/N; noBeef is kept for a later filter), priceMYR (a price range such as "12-25"; a single number means min = max), serves, allergyNotes and researchNotes are the columns to fill in; db:import-sheet reads columns by name and ignores the rest. googleVegOptions is read-only: Google says the menu has some veg dishes, a hint for filling in vegetarian.
export const SHEET_COLUMNS = [
  "id",
  "name",
  "halal",
  "vegetarian",
  "googleVegOptions",
  "vegan",
  "noSeafood",
  "nonHalal",
  "noBeef",
  "priceMYR",
  "serves",
  "allergyNotes",
  "cuisine",
  "description",
  "services",
  "openingHours",
  "rating",
  "ratingCount",
  "distanceFromCampusM",
  "address",
  "mapsUrl",
  "researchNotes",
] as const;

// Minimal RFC 4180 CSV helpers for the venues sheet (quoted fields, commas and newlines inside quotes).

export function toCsv(rows: (string | number | undefined)[][]): string {
  const cell = (value: string | number | undefined) => {
    const text = value === undefined ? "" : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return rows.map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n";
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const input = text.startsWith(BOM) ? text.slice(1) : text;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inQuotes) {
      if (ch === '"' && input[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}
