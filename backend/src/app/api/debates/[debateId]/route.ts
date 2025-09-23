import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        participants: {
          include: {
            persona: {
              select: {
                id: true,
                name: true,
                slug: true,
                imageUrl: true,
              },
            },
          },
        },
        conversation: {
          include: {
            messages: {
              include: {
                authorUser: { select: { id: true, name: true } },
                authorPersona: {
                  select: { id: true, name: true, imageUrl: true },
                },
                citations: true,
              },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    if (!debate) {
      return NextResponse.json({ error: "Debate not found" }, { status: 404 });
    }

    return NextResponse.json(debate);
  } catch (err) {
    console.error("Error fetching debate:", err);
    return NextResponse.json(
      { error: "Failed to fetch debate" },
      { status: 500 }
    );
  }
}
