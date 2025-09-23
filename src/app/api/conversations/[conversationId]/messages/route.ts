import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchContextForAI } from "@/lib/FetchContextForAI/context-for-ai";
import callAI from "@/lib/callAI";

type RequestBody = {
  content: string;
  authorUserId?: string;
};

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await context.params;
  const body: RequestBody = await req.json();
  const { content, authorUserId } = body;

  // --- Validation ---
  if (!content?.trim()) {
    return NextResponse.json(
      { error: "Message content is required" },
      { status: 400 }
    );
  }

  // --- Fetch conversation ---
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, personaId: true, debateId: true, userId: true },
  });

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }

  if (conversation.debateId) {
    return NextResponse.json(
      { error: "This conversation belongs to a debate. Use the debate API." },
      { status: 400 }
    );
  }

  // --- Save user message ---
  const userMessage = await prisma.message.create({
    data: {
      conversationId,
      content,
      authorUserId: authorUserId ?? conversation.userId,
      authorPersonaId: null,
    },
    select: { id: true, content: true, authorUserId: true, createdAt: true },
  });

  // --- Generate AI response ---
  const contextData = await fetchContextForAI(
    content,
    conversation.personaId ?? ""
  );

  const aiContent = await callAI({
    prompt: content,
    context: contextData.llmContext,
    personaId: conversation.personaId,
  });
  console.log("AI Response:", aiContent.answer);
  // --- Save AI message ---
  const aiMessage = await prisma.message.create({
    data: {
      conversationId,
      content: aiContent.answer,
      authorUserId: null,
      authorPersonaId: conversation.personaId,
    },
    select: { id: true, content: true, authorPersonaId: true, createdAt: true },
  });
  // --- Return both messages ---
  return NextResponse.json({ userMessage, aiMessage }, { status: 201 });
}
