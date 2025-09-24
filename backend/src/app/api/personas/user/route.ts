import { NextResponse } from "next/server";
import { listUserPersonas, createUserPersona } from "@/lib/persona/personas";

export async function GET() {
  try {
    // Get only user-created personas (exclude admin personas)
    const personas = await listUserPersonas(true);
    return NextResponse.json(personas);
  } catch (error) {
    console.error("Error fetching user personas:", error);
    return NextResponse.json(
      { error: "Failed to fetch user personas" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, shortBio, imageUrl } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const persona = await createUserPersona({
      name,
      slug,
      shortBio,
      imageUrl,
      userId: "temp-user", // For now, using a temporary user ID
    });

    return NextResponse.json(persona, { status: 201 });
  } catch (error) {
    console.error("Error creating user persona:", error);
    return NextResponse.json(
      { error: "Failed to create persona" },
      { status: 500 }
    );
  }
}