"use client";
import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

type User = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role: string;
};

type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Restore from storage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("accessToken");
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setAccessToken(storedToken);
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("accessToken");
    const storedExpiry = localStorage.getItem("accessTokenExpires");

    if (!storedUser || !storedToken || !storedExpiry) {
      return;
    }

    if (Math.floor(Date.now() / 1000) >= Number(storedExpiry)) {
      console.log("Access token expired, refreshing...");
      refreshToken().catch(() => signOut());
    } else {
      setUser(JSON.parse(storedUser));
      setAccessToken(storedToken);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data } = await api.post("/api/auth/client/login", {
      email,
      password,
    });

    setUser(data.user);
    setAccessToken(data.accessToken);
    console.log(data);

    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem(
      "accessTokenExpires",
      data.accessTokenExpires.toString()
    );
  };

  const signOut = async () => {
    try {
      await api.post("/api/auth/client/signOut");
    } catch {
      // ignore
    }
    setUser(null);
    setAccessToken(null);
    localStorage.clear();
  };

  const refreshToken = async () => {
    const storedRefreshToken = localStorage.getItem("refreshToken");
    if (!storedRefreshToken) {
      await signOut();
      return;
    }

    const { data } = await api.post("/api/auth/client/refresh", {
      refreshToken: storedRefreshToken,
    });

    setAccessToken(data.accessToken);
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem(
      "accessTokenExpires",
      data.accessTokenExpires.toString()
    );
  };

  return (
    <AuthContext.Provider
      value={{ user, accessToken, signIn, signOut, refreshToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
