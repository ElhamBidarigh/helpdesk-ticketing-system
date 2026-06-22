// frontend/src/context/AuthContext.tsx
// ─────────────────────────────────────────────────────
// React Context برای مدیریت auth state در سراسر app
//
// چرا Context؟ چون user info (role, name) توی خیلی
// component مختلف لازمه — بدون Context باید prop drilling
// می‌کردیم (پاس دادن user از parent به child به child...)
// ─────────────────────────────────────────────────────

import { createContext, useContext, useState, ReactNode } from "react";
import { authApi } from "../api/client";

interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "agent" | "user";
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(email: string, password: string) {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authApi.login(email, password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook — استفاده ساده‌تر از Context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
