import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId, personaId, type = "SINGLE", title } = await req.json();

    // --- validation ---
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }
    if (!["SINGLE", "DEBATE"].includes(type)) {
      return NextResponse.json({ error: "Invalid chat type" }, { status: 400 });
    }

    if (personaId) {
      const personaExists = await prisma.persona.findUnique({
        where: { id: personaId },
      });
      if (!personaExists) {
        return NextResponse.json(
          { error: "Persona not found" },
          { status: 404 }
        );
      }
    }

    // --- create conversation ---
    const conversation = await prisma.conversation.create({
      data: {
        userId,
        personaId: personaId ?? null,
        type,
        title: title ?? null,
      },
      select: {
        id: true,
        type: true,
        personaId: true,
        title: true,
        createdAt: true,
      },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (err) {
    console.error("Error creating conversation:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
