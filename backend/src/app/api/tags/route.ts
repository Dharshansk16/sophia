import { NextResponse } from "next/server";
import { listTags, createTag } from "@/lib/persona/personas";

export async function GET() {
  const tags = await listTags();
  return NextResponse.json(tags);
}

export async function POST(req: Request) {
  const body = await req.json();
  const tag = await createTag(body.name);
  return NextResponse.json(tag, { status: 201 });
}
