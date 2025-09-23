import { NextResponse } from "next/server";
import { listPersonas, createPersona } from "@/lib/persona/personas";

export async function GET() {
  const personas = await listPersonas();
  return NextResponse.json(personas);
}

export async function POST(req: Request) {
  const body = await req.json();
  const persona = await createPersona(body);
  return NextResponse.json(persona, { status: 201 });
}
