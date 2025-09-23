import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchContextForAI } from "@/lib/context/llm-context";
import { callDebateAI } from "@/lib/llm-call/callDebateAI";

type RequestBody = {
  initialMessage?: string;
};

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ debateId: string }> }
) {
  try {
    const { debateId } = await context.params;
    const { initialMessage } = (await req.json()) as RequestBody;

    if (!debateId) {
      return NextResponse.json(
        { error: "debateId is required" },
        { status: 400 }
      );
    }

    // --- Fetch debate + conversation + participants ---
    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
      include: {
        conversation: {
          include: { messages: { orderBy: { createdAt: "asc" } } },
        },
        participants: true,
      },
    });

    if (!debate || !debate.conversation) {
      return NextResponse.json(
        { error: "Debate or conversation not found" },
        { status: 404 }
      );
    }

    const conversationId = debate.conversation.id;
    const participants = debate.participants;

    if (participants.length !== 2) {
      return NextResponse.json(
        { error: "Exactly 2 participants required" },
        { status: 400 }
      );
    }

    // --- Determine next persona (turn-taking) ---
    const lastMessage = debate.conversation.messages.slice(-1)[0];
    const nextPersonaId = !lastMessage
      ? participants[0].personaId
      : participants.find((p) => p.personaId !== lastMessage.authorPersonaId)!
          .personaId;

    // --- Fetch context for this persona from KB/embeddings + KG ---
    const contextData = await fetchContextForAI(
      lastMessage?.content ?? initialMessage ?? "",
      nextPersonaId
    );

    // --- Generate debate response using persona-specific context ---
    const aiContent = await callDebateAI({
      previousMessage: lastMessage?.content ?? initialMessage ?? "",
      context: contextData.llmContext,
      personaId: nextPersonaId,
    });

    // --- Save AI message ---
    const message = await prisma.message.create({
      data: {
        conversationId,
        content: aiContent.answer,
        authorPersonaId: nextPersonaId,
      },
      include: {
        authorPersona: { select: { id: true, name: true, imageUrl: true } },
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    console.error("Error creating debate message:", err);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ debateId: string }> }
) {
  try {
    const { debateId } = await context.params;

    if (!debateId) {
      return NextResponse.json(
        { error: "debateId is required" },
        { status: 400 }
      );
    }

    const messages = await prisma.message.findMany({
      where: { conversation: { debateId } },
      include: {
        authorUser: { select: { id: true, name: true } },
        authorPersona: { select: { id: true, name: true, imageUrl: true } },
        citations: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch (err) {
    console.error("Error fetching debate messages:", err);
    return NextResponse.json(
      { error: "Failed to fetch debate messages" },
      { status: 500 }
    );
  }
}
