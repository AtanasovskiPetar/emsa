import { createContext, useContext, useState, type ReactNode } from "react";
import type { Role } from "@/constants/enums";

interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (token: string) => AuthUser | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function decodeToken(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1] ?? ""));
    return { id: payload.sub, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

function getStoredToken(): string | null {
  const stored = localStorage.getItem("token");
  if (!stored) return null;
  const valid = decodeToken(stored);
  if (!valid) {
    localStorage.removeItem("token");
    return null;
  }
  return stored;
}

function getStoredUser(): AuthUser | null {
  const stored = localStorage.getItem("token");
  if (!stored) return null;
  return decodeToken(stored);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(getStoredToken);
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);

  function login(newToken: string): AuthUser | null {
    const decoded = decodeToken(newToken);
    if (!decoded) return null;
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(decoded);
    return decoded;
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
