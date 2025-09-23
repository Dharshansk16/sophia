/** biome-ignore-all lint/suspicious/noExplicitAny: <fix it> */
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";
import GitHubProvider from "next-auth/providers/github";
import crypto from "node:crypto";

const ACCESS_TOKEN_EXPIRY = 24 * 60 * 60; // 1 day
const REFRESH_TOKEN_EXPIRY = 365 * 24 * 60 * 60; // 1 year

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: string;
      accessToken?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    role: string;
  }
}

async function generateRefreshToken(userId: string) {
  const rawToken = crypto.randomBytes(32).toString("hex");

  const hashedToken = await bcrypt.hash(rawToken, 10);

  await prisma.refreshToken.create({
    data: {
      id: crypto.randomUUID(),
      hashedToken,
      userId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000),
    },
  });

  return rawToken;
}

async function validateRefreshToken(rawToken: string, userId: string) {
  const tokens = await prisma.refreshToken.findMany({
    where: {
      userId,
      revoked: false,
      expiresAt: { gt: new Date() },
    },
  });

  for (const t of tokens) {
    const isMatch = await bcrypt.compare(rawToken, t.hashedToken);
    if (isMatch) return true;
  }

  return false;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error("Missing email or password");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) throw new Error("Invalid credentials");

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: (user as any).image,
          role: user.role,
        };
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    DiscordProvider({
        clientId: process.env.DISCORD_CLIENT_ID ?? "",
        clientSecret: process.env.DISCORD_CLIENT_SECRET ?? "",
    }),
    GitHubProvider({
        clientId: process.env.GITHUB_CLIENT_ID ?? "",
        clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      const now = Math.floor(Date.now() / 1000);

      // On initial sign-in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
        token.role = (user as any).role;

        token.accessToken = crypto.randomBytes(16).toString("hex");
        token.accessTokenExpires = now + ACCESS_TOKEN_EXPIRY;
        token.refreshToken = await generateRefreshToken(user.id);

        return token;
      }

      // If access token still valid, return it
      if (token.accessTokenExpires && now < (token.accessTokenExpires as number)) {
        return token;
      }

      // Otherwise, try refreshing
      if (token.refreshToken && token.id) {
        const isValid = await validateRefreshToken(
          token.refreshToken as string,
          token.id as string
        );
        if (isValid) {
          token.accessToken = crypto.randomBytes(16).toString("hex");
          token.accessTokenExpires = now + ACCESS_TOKEN_EXPIRY;
          return token;
        }
      }

      // If refresh fails → force sign out
      return { ...token, error: "RefreshTokenError" };
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;
        session.user.role = token.role as string;
        session.user.accessToken = token.accessToken as string;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
