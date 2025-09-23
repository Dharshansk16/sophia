import { NextResponse, NextRequest } from "next/server";
import { assignTag, removeTag } from "@/lib/persona/personas";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; tagId: string }> }
) {
  const { id, tagId } = await context.params;
  const link = await assignTag(id, tagId);
  return NextResponse.json(link, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; tagId: string }> }
) {
  const { id, tagId } = await context.params;
  await removeTag(id, tagId);
  return NextResponse.json({ success: true });
}
