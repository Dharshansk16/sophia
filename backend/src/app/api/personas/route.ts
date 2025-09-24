import { NextResponse } from "next/server";
import { listPersonas, listUserPersonas, listAdminPersonas, createPersona } from "@/lib/persona/personas";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');
    
    let personas;
    
    switch (filter) {
      case 'user':
        personas = await listUserPersonas(true); // exclude admin personas
        break;
      case 'admin':
        personas = await listAdminPersonas();
        break;
      default:
        personas = await listPersonas();
        break;
    }
    
    return NextResponse.json(personas);
  } catch (error) {
    console.error("Error fetching personas:", error);
    return NextResponse.json(
      { error: "Failed to fetch personas" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const persona = await createPersona(body);
    return NextResponse.json(persona, { status: 201 });
  } catch (error) {
    console.error("Error creating persona:", error);
    return NextResponse.json(
      { error: "Failed to create persona" },
      { status: 500 }
    );
  }
}
