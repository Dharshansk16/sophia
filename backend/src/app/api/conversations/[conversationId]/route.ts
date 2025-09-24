import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await context.params;

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.findUnique({
      where: { 
        id: conversationId,
        type: "SINGLE"
      },
      select: {
      id: true,
      userId: true,
      personaId: true,
      type: true,
      title: true,
      messages: {
        select: {
        id: true,
        content: true,
        authorUser: true,
        createdAt: true,
        citations: true,
        },
        orderBy: { createdAt: "asc" },
      },
      createdAt: true,
      updatedAt: true,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(conversation, { status: 200 });
  } catch (err) {
    console.error("Error fetching conversation:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
