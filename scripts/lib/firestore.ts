// Shared Firestore setup for the db:* scripts. Reads Firebase keys from .env.local.

import * as fs from "fs";
import * as path from "path";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

export function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      process.env[key] = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    }
  }
}

export function connectFirestore() {
  loadEnvLocal();
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error("Missing Firebase credentials in .env.local.");
    process.exit(1);
  }
  return getFirestore(getApps().length > 0 ? getApp() : initializeApp(firebaseConfig));
}

export function runScript(main: () => Promise<void>) {
  main().then(
    () => process.exit(0),
    (err) => {
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    },
  );
}
