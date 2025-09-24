import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId, personaId, type = "SINGLE", title } = await req.json();

    console.log("Creating conversation with data:", { userId, personaId, type, title });

    // --- validation ---
    if (!userId) {
      console.error("userId is missing from request");
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    if (typeof userId !== 'string' || userId.trim() === '') {
      console.error("userId is invalid:", userId);
      return NextResponse.json(
        { error: "userId must be a valid string" },
        { status: 400 }
      );
    }

    if (!["SINGLE", "DEBATE"].includes(type)) {
      console.error("Invalid chat type:", type);
      return NextResponse.json({ error: "Invalid chat type" }, { status: 400 });
    }

    // Validate user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!userExists) {
      console.error("User not found:", userId);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (personaId) {
      if (typeof personaId !== 'string' || personaId.trim() === '') {
        console.error("personaId is invalid:", personaId);
        return NextResponse.json(
          { error: "personaId must be a valid string" },
          { status: 400 }
        );
      }

      const personaExists = await prisma.persona.findUnique({
        where: { id: personaId },
      });
      if (!personaExists) {
        console.error("Persona not found:", personaId);
        return NextResponse.json(
          { error: "Persona not found" },
          { status: 404 }
        );
      }
    }

    // --- create conversation ---
    console.log("Attempting to create conversation in database...");
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

    console.log("Conversation created successfully:", conversation);
    return NextResponse.json(conversation, { status: 201 });
  } catch (err) {
    console.error("Error creating conversation:", err);
    console.error("Error details:", {
      name: err instanceof Error ? err.name : 'Unknown',
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : 'No stack trace'
    });
    
    return NextResponse.json(
      { 
        error: "Internal Server Error",
        details: err instanceof Error ? err.message : String(err)
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId query parameter is required" },
        { status: 400 }
      );
    }

    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        personaId: true,
        persona: { select: { name: true } },
        title: true,
        createdAt: true,
      },
    });

    return NextResponse.json(conversations, { status: 200 });
  } catch (err) {
    console.error("Error fetching conversations:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
