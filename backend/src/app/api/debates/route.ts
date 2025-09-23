import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { topic, participantIds, userId, type = "DEBATE" } = await req.json();

    // ---------------- VALIDATIONS ----------------
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }
    if (!topic) {
      return NextResponse.json({ error: "topic is required" }, { status: 400 });
    }
    if (!Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json(
        { error: "At least one participant is required" },
        { status: 400 }
      );
    }
    if (!["SINGLE", "DEBATE"].includes(type)) {
      return NextResponse.json({ error: "Invalid chat type" }, { status: 400 });
    }

    // ---------------- CREATE CONVERSATION ----------------
    const conversation = await prisma.conversation.create({
      data: {
        userId,
        type: type as "SINGLE" | "DEBATE",
      },
    });

    // ---------------- CREATE DEBATE ----------------
    const debate = await prisma.debate.create({
      data: {
        topic,
        createdById: userId,
        conversationId: conversation.id,
        participants: {
          create: participantIds.map((p: any) => ({
            personaId: p.personaId,
            role: p.role,
          })),
        },
      },
      include: { participants: true },
    });

    return NextResponse.json(debate);
  } catch (err) {
    console.error("Error creating debate:", err);
    return NextResponse.json(
      { error: "Failed to create debate" },
      { status: 500 }
    );
  }
}
