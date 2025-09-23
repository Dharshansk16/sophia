/** biome-ignore-all lint/suspicious/noExplicitAny: <fix> */
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import crypto from "node:crypto";

const ACCESS_TOKEN_EXPIRY = 24 * 60 * 60; // 1 day

async function generateAccessToken() {
    return crypto.randomBytes(16).toString("hex");
}

export async function POST(req: Request) {
    try {
        const { refreshToken } = await req.json();
        if (!refreshToken) {
            return NextResponse.json({ error: "Missing refresh token" }, { status: 400 });
        }

        const dbToken = await prisma.refreshToken.findFirst({
            where: { revoked: false },
            orderBy: { expiresAt: "desc" },
        });

        if (!dbToken) {
            return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
        }

        // Compare provided token with hashed token in DB
        const isValid = await bcrypt.compare(refreshToken, dbToken.hashedToken);
        if (!isValid || dbToken.expiresAt < new Date()) {
            return NextResponse.json({ error: "Refresh token expired or invalid" }, { status: 401 });
        }

        // Generate new access token
        const now = Math.floor(Date.now() / 1000);
        const accessToken = await generateAccessToken();
        const accessTokenExpires = now + ACCESS_TOKEN_EXPIRY;

        // Optionally, rotate refresh token (recommended for security)
        // await prisma.refreshToken.update({
        //   where: { id: dbToken.id },
        //   data: { revoked: true }
        // });
        // const newRefreshToken = await generateRefreshToken(dbToken.userId);

        // Get user info
        const user = await prisma.user.findUnique({ where: { id: dbToken.userId } });

        return NextResponse.json({
            accessToken,
            accessTokenExpires,
            // refreshToken: newRefreshToken, // if rotating
            user: {
                id: user?.id,
                email: user?.email,
                name: user?.name,
                image: (user as any)?.image,
                role: user?.role,
            },
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}