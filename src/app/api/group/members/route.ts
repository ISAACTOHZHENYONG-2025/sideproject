import { NextRequest, NextResponse } from "next/server";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { requireGroupEnabled } from "@/lib/featureFlags";
import type { Participant } from "../resolve/route";

export type RoomMember = Participant & { joinedAt: string };

export interface RoomInfo {
  roomCode: string;
  hostName: string;
  status: string;
  participants: RoomMember[];
}

export async function GET(req: NextRequest) {
  // Outside the try: this 404s by throwing, which the catch below would turn into a 500.
  requireGroupEnabled();
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Firestore is not initialized. Check .env.local configuration." },
        { status: 500 }
      );
    }

    const roomCode = req.nextUrl.searchParams.get("roomCode")?.trim().toUpperCase();
    if (!roomCode) {
      return NextResponse.json({ error: "roomCode is required." }, { status: 400 });
    }

    const roomSnapshot = await getDocs(
      query(collection(db, "group_rooms"), where("roomCode", "==", roomCode))
    );
    if (roomSnapshot.empty) {
      return NextResponse.json(
        { error: `Group room with code '${roomCode}' not found.` },
        { status: 404 }
      );
    }

    const roomDoc = roomSnapshot.docs[0];
    const participantsSnap = await getDocs(
      collection(db, "group_rooms", roomDoc.id, "participants")
    );

    const participants: RoomMember[] = participantsSnap.docs
      .map((docSnap) => {
        const data = docSnap.data();
        return {
          memberName: data.memberName || "Student",
          maxBudget: Number(data.maxBudget ?? 15),
          availableTimeMins: Number(data.availableTimeMins ?? 30),
          transportMode:
            data.transportMode === "private_vehicle"
              ? ("private_vehicle" as const)
              : ("walk_or_public" as const),
          dietaryRestrictions: Array.isArray(data.dietaryRestrictions)
            ? (data.dietaryRestrictions as string[])
            : [],
          joinedAt: String(data.joinedAt ?? ""),
        };
      })
      .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));

    const room: RoomInfo = {
      roomCode,
      hostName: roomDoc.data().hostName ?? "Host",
      status: roomDoc.data().status ?? "OPEN",
      participants,
    };
    return NextResponse.json(room, { status: 200 });
  } catch (error: unknown) {
    console.error("Error in /api/group/members:", error);
    return NextResponse.json(
      {
        error: "Failed to load group room.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
