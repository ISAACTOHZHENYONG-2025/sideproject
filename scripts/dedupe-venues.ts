import * as fs from "fs";
import * as path from "path";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  writeBatch,
} from "firebase/firestore";

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      process.env[key] = val;
    }
  }
}

loadEnvLocal();

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

async function removeDuplicates() {
  console.log("Fetching venues from Cloud Firestore...");
  const snapshot = await getDocs(collection(db, "venues"));

  const seenNames = new Map<string, string>(); // name -> kept document ID
  const duplicateIdsToDelete: { id: string; name: string }[] = [];

  snapshot.forEach((d) => {
    const data = d.data();
    const name = (data.name || "").trim().toLowerCase();

    if (seenNames.has(name)) {
      duplicateIdsToDelete.push({ id: d.id, name: data.name });
    } else {
      seenNames.set(name, d.id);
    }
  });

  console.log(`Total documents found: ${snapshot.size}`);
  console.log(`Unique venues kept: ${seenNames.size}`);
  console.log(`Duplicates to delete: ${duplicateIdsToDelete.length}`);

  if (duplicateIdsToDelete.length === 0) {
    console.log("No duplicates found!");
    process.exit(0);
  }

  // Delete duplicate documents
  const batch = writeBatch(db);
  for (const item of duplicateIdsToDelete) {
    console.log(`  Deleting duplicate: "${item.name}" (ID: ${item.id})`);
    batch.delete(doc(db, "venues", item.id));
  }

  await batch.commit();
  console.log(`\n Successfully removed ${duplicateIdsToDelete.length} duplicate venues!`);
  process.exit(0);
}

removeDuplicates().catch((err) => {
  console.error("Error removing duplicates:", err);
  process.exit(1);
});

