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

    console.log("Debate message API called:", { debateId, initialMessage });

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
    // Ensure participants array order is respected (orderIndex)
    const participants = [...debate.participants].sort(
      (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
    );

    if (participants.length !== 2) {
      return NextResponse.json(
        { error: "Exactly 2 participants required" },
        { status: 400 }
      );
    }

    // Determine next persona based on existing messages count (topic messages excluded)
    const existingMessages = debate.conversation.messages || [];
    // Count only messages authored by personas (exclude system/topic)
    const personaMessages = existingMessages.filter(
      (m: any) => !!m.authorPersonaId
    );
    const nextIdx = personaMessages.length % 2; // 0 => first persona, 1 => second persona
    const nextPersona = participants[nextIdx];
    const personaId = nextPersona.personaId;

    console.log("Persona selection:", {
      existingMessagesCount: existingMessages.length,
      personaMessagesCount: personaMessages.length,
      nextIdx,
      nextPersonaId: personaId,
      participants: participants.map((p) => ({
        id: p.personaId,
        orderIndex: p.orderIndex,
      })),
    });

    // Choose last message content (topic or last persona message)
    const lastMessage =
      personaMessages.length > 0
        ? personaMessages[personaMessages.length - 1].content
        : initialMessage;

    // Fetch context and generate response for the chosen persona
    const contextData = await fetchContextForAI(lastMessage ?? "", personaId);
    const aiContent = await callDebateAI({
      previousMessage: lastMessage ?? "",
      context: contextData.llmContext,
      personaId,
    });

    // Save a single message and return it
    const message = await prisma.message.create({
      data: {
        conversationId,
        content: aiContent.answer,
        authorPersonaId: personaId,
      },
      include: {
        authorPersona: { select: { id: true, name: true, imageUrl: true } },
      },
    });

    console.log("Created message:", {
      id: message.id,
      content: message.content.substring(0, 100) + "...",
      authorPersonaId: message.authorPersonaId,
      authorPersonaName: message.authorPersona?.name,
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
