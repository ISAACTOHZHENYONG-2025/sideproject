import { NextRequest, NextResponse } from "next/server";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomPart = "";
  for (let i = 0; i < 3; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `UM-${randomPart}`;
}

export async function POST(req: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Firestore is not initialized. Check .env.local configuration." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const hostName = (body.hostName || "Host").trim();
    const roomCode = generateRoomCode();

    const roomData = {
      roomCode,
      hostName,
      status: "OPEN",
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, "group_rooms"), roomData);

    return NextResponse.json(
      {
        roomCode,
        roomId: docRef.id,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in /api/group/create:", error);
    return NextResponse.json(
      {
        error: "Failed to create group room.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
