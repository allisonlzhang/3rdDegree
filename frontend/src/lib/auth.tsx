// src/lib/auth.tsx
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api } from "./api";

type User = {
  id: string;
  name?: string;
  contact?: string;
  answer?: "yes" | "no" | "maybe";
  // add fields your /parties/{partyId}/me returns
} | null;

type Ctx = { user: User; loading: boolean; refresh: () => Promise<void> };

const AuthCtx = createContext<Ctx>({ user: null, loading: true, refresh: async () => {} });

function getStoredIds() {
  return {
    memberId: localStorage.getItem("member_id") || "",
    partyId: localStorage.getItem("party_id") || "",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const { memberId, partyId } = getStoredIds();
      if (!memberId) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      // Check if we're on the login page - if so, don't try to authenticate
      if (window.location.pathname === '/login' || window.location.hash === '#/login') {
        setUser(null);
        setLoading(false);
        return;
      }
      
      // Always use the host/me endpoint for hosts (it handles both cases)
      const me = await api<User>(`/host/me?member_id=${encodeURIComponent(memberId)}${partyId ? `&party_id=${encodeURIComponent(partyId)}` : ""}`);
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return <AuthCtx.Provider value={{ user, loading, refresh }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}
