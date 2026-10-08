// Smoke test for the pages and API routes. Start the app first (`npm run dev`), then:
//   node scripts/smoke-test.mjs [baseUrl]
// Note: the group steps write a test room and two participants to Firestore.

const BASE = process.argv[2] ?? "http://localhost:3000";
let failed = 0;

function report(name, ok, detail = "") {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
}

async function page(path) {
  try {
    const res = await fetch(BASE + path);
    report(`GET ${path}`, res.status === 200, `status ${res.status}`);
  } catch (err) {
    report(`GET ${path}`, false, err.message);
  }
}

async function post(path, body) {
  try {
    const res = await fetch(BASE + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  } catch (err) {
    return { status: 0, data: { error: err.message } };
  }
}

console.log(`Testing ${BASE}\n`);

try {
  await fetch(BASE);
} catch (err) {
  const cause = err.cause?.code ?? err.cause?.message ?? err.message;
  console.error(`Cannot reach ${BASE} (${cause}).`);
  console.error("Start the app with `npm run dev`, then pass its URL, e.g. node scripts/smoke-test.mjs http://127.0.0.1:3000");
  process.exit(2);
}

for (const path of ["/", "/group", "/filter"]) await page(path);

// /api/decide
const decideCases = [
  { label: "walk, any craving", transportMode: "walk_or_public", craving: "", maxBudget: 15, availableTimeMins: 30, dietaryRestrictions: ["Halal"] },
  { label: "drive, any craving", transportMode: "private_vehicle", craving: "", maxBudget: 15, availableTimeMins: 30, dietaryRestrictions: ["Halal"] },
  { label: "noodles, RM10, halal", transportMode: "walk_or_public", craving: "noodles", maxBudget: 10, availableTimeMins: 30, dietaryRestrictions: ["Halal"] },
];
for (const { label, ...payload } of decideCases) {
  const { status, data } = await post("/api/decide", { locationId: "kk12", ...payload });
  const recs = data.recommendations;
  const more = data.moreMatches;
  report(
    `POST /api/decide (${label})`,
    status === 200 && Array.isArray(recs) && Array.isArray(more),
    status === 200 ? `${recs?.length ?? 0} top, ${more?.length ?? 0} more, engine ${data.engine}` : `status ${status}: ${data.error ?? ""}`,
  );
  if (Array.isArray(recs) && Array.isArray(more)) {
    const all = [...recs, ...more];
    report(`  top picks <= 3 (${label})`, recs.length <= 3);
    report(`  all within RM${payload.maxBudget} (${label})`, all.every((r) => r.estimatedCostMYR <= payload.maxBudget));
    report(`  all within ${payload.availableTimeMins} mins (${label})`, all.every((r) => r.estimatedTimeMins <= payload.availableTimeMins));
    report(`  all halal (${label})`, all.every((r) => r.isHalal));
    report(`  all have a Maps link (${label})`, all.every((r) => /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&/.test(r.mapsUrl)));
  }
}

// /api/group/*
const created = await post("/api/group/create", { hostName: "SmokeTest Host" });
const roomCode = created.data.roomCode;
report(
  "POST /api/group/create",
  created.status === 200 && /^UM-[A-Z0-9]{3}$/.test(roomCode ?? ""),
  created.status === 200 ? roomCode : `status ${created.status}: ${created.data.error ?? ""}`,
);

if (roomCode) {
  const empty = await post("/api/group/resolve", { roomCode });
  report("POST /api/group/resolve (no members) -> 400", empty.status === 400, `status ${empty.status}`);

  const members = [
    { memberName: "Alex", maxBudget: 10, availableTimeMins: 30, transportMode: "walk_or_public", dietaryRestrictions: ["Halal"] },
    { memberName: "Sarah", maxBudget: 20, availableTimeMins: 45, transportMode: "private_vehicle", dietaryRestrictions: [] },
  ];
  for (const m of members) {
    const joined = await post("/api/group/join", { roomCode, ...m });
    report(`POST /api/group/join (${m.memberName})`, joined.status === 200 && joined.data.success === true, `status ${joined.status}`);
  }

  try {
    const res = await fetch(`${BASE}/api/group/members?roomCode=${roomCode}`);
    const room = await res.json();
    const names = (room.participants ?? []).map((p) => p.memberName).join(", ");
    report("GET /api/group/members (2 members)", res.status === 200 && room.participants?.length === 2, names);
  } catch (err) {
    report("GET /api/group/members", false, err.message);
  }

  const resolved = await post("/api/group/resolve", { roomCode });
  report("POST /api/group/resolve (2 members)", resolved.status === 200, `status ${resolved.status}: ${resolved.data.error ?? ""}`);
  if (resolved.status === 200) console.log("  response keys:", Object.keys(resolved.data).join(", "));
}

// error cases
const noMembersCode = await fetch(`${BASE}/api/group/members`);
report("GET /api/group/members (no roomCode) -> 400", noMembersCode.status === 400, `status ${noMembersCode.status}`);
const unknownRoom = await fetch(`${BASE}/api/group/members?roomCode=UM-ZZZ`);
report("GET /api/group/members (unknown room) -> 404", unknownRoom.status === 404, `status ${unknownRoom.status}`);
const noCode = await post("/api/group/join", { memberName: "X" });
report("POST /api/group/join (no roomCode) -> 400", noCode.status === 400, `status ${noCode.status}`);
const badCode = await post("/api/group/join", { roomCode: "UM-ZZZ" });
report("POST /api/group/join (unknown room) -> 404", badCode.status === 404, `status ${badCode.status}`);
const badResolve = await post("/api/group/resolve", {});
report("POST /api/group/resolve (no roomCode) -> 400", badResolve.status === 400, `status ${badResolve.status}`);

console.log(failed === 0 ? "\nAll checks passed." : `\n${failed} check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
