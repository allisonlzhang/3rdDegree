// src/lib/api.ts
const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    credentials: "include",
    ...init,
  });

  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");

  let data: any = null;
  if (isJson) {
    try { data = await res.json(); } catch { data = null; }
  } else {
    // try to read text; ignore if empty
    try { const t = await res.text(); data = t ? { _text: t } : null; } catch {}
  }

  if (!res.ok) {
    const msg = (data && (data.message || data.detail)) || res.statusText;
    throw new Error(`HTTP ${res.status}: ${msg}`);
  }
  return (data ?? ({} as T));
}

export async function logout() {
  try { await api("/host/logout", { method: "POST" }); } catch {}
  localStorage.removeItem("member_id");
  localStorage.removeItem("party_id");
}
