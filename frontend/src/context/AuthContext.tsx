"use client";
import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { authAPI, type User } from "@/lib/api";
import { toast } from "sonner";

type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<void>;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore from storage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("accessToken");
    const storedExpiry = localStorage.getItem("accessTokenExpires");

    if (!storedUser || !storedToken || !storedExpiry) {
      setIsLoading(false);
      return;
    }

    // Check if token is expired
    if (Math.floor(Date.now() / 1000) >= Number(storedExpiry)) {
      console.log("Access token expired, refreshing...");
      refreshToken()
        .catch(() => signOut())
        .finally(() => setIsLoading(false));
    } else {
      setUser(JSON.parse(storedUser));
      setAccessToken(storedToken);
      setIsLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const data = await authAPI.login(email, password);

      setUser(data.user);
      setAccessToken(data.accessToken);

      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem(
        "accessTokenExpires",
        data.accessTokenExpires.toString()
      );

      toast.success("Signed in successfully!");
    } catch (error: any) {
      console.error("Sign in error:", error);
      const errorMessage = error.response?.data?.error || "Failed to sign in";
      toast.error(errorMessage);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authAPI.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
      // Continue with local logout even if server request fails
    }

    setUser(null);
    setAccessToken(null);
    localStorage.clear();
    toast.success("Signed out successfully");
  };

  const refreshToken = async () => {
    const storedRefreshToken = localStorage.getItem("refreshToken");
    if (!storedRefreshToken) {
      await signOut();
      return;
    }

    try {
      const data = await authAPI.refresh(storedRefreshToken);

      setAccessToken(data.accessToken);
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem(
        "accessTokenExpires",
        data.accessTokenExpires.toString()
      );
    } catch (error) {
      console.error("Refresh token error:", error);
      await signOut();
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, accessToken, signIn, signOut, refreshToken, isLoading }}
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
