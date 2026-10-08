import { NextRequest, NextResponse } from "next/server";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface JoinMemberPayload {
  roomCode: string;
  memberName: string;
  maxBudget: number;
  availableTimeMins: number;
  transportMode: "walk_or_public" | "private_vehicle";
  dietaryRestrictions: string[];
}

export async function POST(req: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Firestore is not initialized. Check .env.local configuration." },
        { status: 500 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as Partial<JoinMemberPayload>;
    const roomCode = body.roomCode?.trim().toUpperCase();

    if (!roomCode) {
      return NextResponse.json(
        { error: "roomCode is required to join a session." },
        { status: 400 }
      );
    }

    // Find the room by roomCode
    const roomsRef = collection(db, "group_rooms");
    const q = query(roomsRef, where("roomCode", "==", roomCode));
    const roomSnapshot = await getDocs(q);

    if (roomSnapshot.empty) {
      return NextResponse.json(
        { error: `Group room with code '${roomCode}' not found.` },
        { status: 404 }
      );
    }

    const roomDoc = roomSnapshot.docs[0];

    const participantData = {
      memberName: (body.memberName || "Anonymous Student").trim(),
      maxBudget: Number(body.maxBudget ?? 15),
      availableTimeMins: Number(body.availableTimeMins ?? 30),
      transportMode:
        body.transportMode === "private_vehicle" ? "private_vehicle" : "walk_or_public",
      dietaryRestrictions: Array.isArray(body.dietaryRestrictions)
        ? body.dietaryRestrictions
        : [],
      joinedAt: new Date().toISOString(),
    };

    // Add to participants subcollection
    const participantsRef = collection(db, "group_rooms", roomDoc.id, "participants");
    await addDoc(participantsRef, participantData);

    return NextResponse.json(
      {
        success: true,
        message: "Joined session",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in /api/group/join:", error);
    return NextResponse.json(
      {
        error: "Failed to join group session.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
