import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { refreshToken } = await req.json();
    if (!refreshToken)
      return NextResponse.json({ error: "Missing token" }, { status: 400 });

    await prisma.refreshToken.updateMany({
      where: { revoked: false },
      data: { revoked: true },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}