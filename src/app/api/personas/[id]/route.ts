import { NextRequest, NextResponse } from "next/server";
import {
  getPersona,
  updatePersona,
  deletePersona,
} from "@/lib/persona/personas";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const persona = await getPersona(id);
  if (!persona)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(persona);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await req.json();
  const updated = await updatePersona(id, body);
  return NextResponse.json(updated);
}

export async function DELETE(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const deleted = await deletePersona(id);
  return NextResponse.json(deleted);
}
