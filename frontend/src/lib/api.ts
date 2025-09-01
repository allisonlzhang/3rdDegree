// src/lib/api.ts
const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    credentials: "include", // cookies for session
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function logout() {
  // if you expose /host/logout, use it; otherwise no-op
  try {
    await api<{ ok: boolean }>("/host/logout", { method: "POST" });
  } catch {
    // ignore network errors on logout
  } finally {
    localStorage.removeItem("member_id");
    localStorage.removeItem("party_id");
  }
}
