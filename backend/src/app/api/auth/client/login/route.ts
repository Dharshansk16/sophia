/** biome-ignore-all lint/suspicious/noExplicitAny: <fix> */
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import crypto from "node:crypto";

const ACCESS_TOKEN_EXPIRY = 24 * 60 * 60; // 1 day
const REFRESH_TOKEN_EXPIRY = 365 * 24 * 60 * 60; // 1 year

async function generateRefreshToken(userId: string) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = await bcrypt.hash(rawToken, 10);

  await prisma.refreshToken.create({
    data: {
      id: crypto.randomUUID(),
      hashedToken,
      userId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000),
      revoked: false,
    },
  });

  return rawToken;
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const now = Math.floor(Date.now() / 1000);
    const accessToken = crypto.randomBytes(16).toString("hex");
    const accessTokenExpires = now + ACCESS_TOKEN_EXPIRY;
    const refreshToken = await generateRefreshToken(user.id);

    return NextResponse.json({
      accessToken,
      accessTokenExpires,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: (user as any).image,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}