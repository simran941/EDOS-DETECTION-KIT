"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { apiClient, type User } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const savedAccessToken = localStorage.getItem("accessToken");
      const savedRefreshToken = localStorage.getItem("refreshToken");
      const savedUser = localStorage.getItem("user");

      if (savedAccessToken && savedUser) {
        setAccessToken(savedAccessToken);
        setRefreshToken(savedRefreshToken);
        setUser(JSON.parse(savedUser));

        // Verify token is still valid
        try {
          await apiClient.verifyToken(savedAccessToken);
          console.log("✅ Token verified");
        } catch (error) {
          // Token expired, try to refresh
          if (savedRefreshToken) {
            try {
              const { accessToken: newToken, user: newUser } =
                await apiClient.refreshToken(savedRefreshToken);
              setAccessToken(newToken);
              setUser(newUser);
              localStorage.setItem("accessToken", newToken);
              console.log("🔄 Token refreshed");
            } catch (refreshError) {
              console.error("❌ Token refresh failed:", refreshError);
              localStorage.removeItem("accessToken");
              localStorage.removeItem("refreshToken");
              localStorage.removeItem("user");
            }
          }
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { accessToken, refreshToken, user } = await apiClient.login(
        email,
        password
      );

      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      setUser(user);

      // Persist to localStorage
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));

      console.log("🔐 Login successful");
    } catch (error) {
      console.error("❌ Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      const { accessToken, refreshToken, user } = await apiClient.register(
        email,
        password,
        name
      );

      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      setUser(user);

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));

      console.log("✅ Registration successful");
    } catch (error) {
      console.error("❌ Registration error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      console.log("🚪 Starting logout process...");

      if (accessToken) {
        await apiClient.logout(accessToken);
      }

      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);

      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      console.log("✅ Successfully logged out");
    } catch (error) {
      console.error("❌ Sign out error:", error);
      // Clear local state anyway
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      localStorage.clear();
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    accessToken,
    loading,
    signOut,
    login,
    register,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
