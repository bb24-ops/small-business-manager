/* oxlint-disable react/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, clearAccessToken, getAccessToken, setAccessToken } from "./api";
import type { AuthUser } from "./types";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login(email: string, password: string): Promise<void>;
  logout(): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(Boolean(getAccessToken()));
  useEffect(() => {
    if (!getAccessToken()) return;
    api.auth.me().then(setUser).catch(clearAccessToken).finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    const unauthorized = () => { setUser(null); queryClient.clear(); };
    window.addEventListener("sbm:unauthorized", unauthorized);
    return () => window.removeEventListener("sbm:unauthorized", unauthorized);
  }, [queryClient]);
  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    login: async (email, password) => {
      const result = await api.auth.login({ email, password });
      queryClient.clear();
      setAccessToken(result.accessToken);
      setUser(result.user);
    },
    logout: () => { clearAccessToken(); queryClient.clear(); setUser(null); },
  }), [loading, queryClient, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth mora biti korišćen unutar AuthProvider-a.");
  return value;
}
