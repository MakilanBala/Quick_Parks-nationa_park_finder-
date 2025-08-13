const API_BASE = import.meta.env.VITE_API_BASE || "";
const TOKEN_KEY = "authToken";

function authHeaders() {
  const t = localStorage.getItem(TOKEN_KEY);
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function check(res) {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); if (j?.message) msg = j.message; } catch {}
    const err = new Error(msg); err.status = res.status; throw err;
  }
  return res;
}

export async function listSavedParks() {
  const url = `${API_BASE}/api/savedParks`;
  //console.debug("[listSavedParks] URL:", url);
  const r = await check(await fetch(url, { headers: authHeaders() }));
  const j = await r.json();
  const rows = j.data || [];
  return rows.map(r => String(r.key || "").trim().toLowerCase()).filter(Boolean);
}

export async function savePark(key, park) {
  const url = `${API_BASE}/api/savedParks`;
  //console.debug("[savePark] URL:", url);
  await check(await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ key, park })
  }));
}

export async function unsavePark(key) {
  const url = `${API_BASE}/api/savedParks/${encodeURIComponent(key)}`;
  //console.debug("[unsavePark] URL:", url);
  await check(await fetch(url, { method: "DELETE", headers: authHeaders() }));
}