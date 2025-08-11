import React from "react";
import { listSavedParks, savePark, unsavePark } from "../api/savedParksAPI";

const norm = v => String(v || "").trim().toLowerCase();

export default function useSavedParks() {
  const [saved, setSaved] = React.useState(new Set());
  const [loading, setLoading] = React.useState(false);
  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

  // Load on mount or when token changes
  React.useEffect(() => {
    if (!token) { setSaved(new Set()); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const rows = await listSavedParks();
        if (!cancelled) setSaved(new Set(rows.map(r => norm(r.key))));
      } catch (e) {
        console.warn("[useSavedParks] load failed:", e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const isSaved = React.useCallback(code => saved.has(norm(code)), [saved]);

  const optimistic = updater => {
    setSaved(prev => {
      const next = new Set(prev);
      updater(next);
      return next;
    });
  };

  const save = React.useCallback(async (code, label) => {
    if (!token) return;
    const k = norm(code);
    if (saved.has(k)) return;
    optimistic(set => set.add(k));
    try {
      await savePark(k, label || k);
    } catch (e) {
      console.warn("save failed, reverting:", e.message);
      optimistic(set => set.delete(k));
    }
  }, [saved, token]);

  const unsave = React.useCallback(async code => {
    if (!token) return;
    const k = norm(code);
    if (!saved.has(k)) return;
    optimistic(set => set.delete(k));
    try {
      await unsavePark(k);
    } catch (e) {
      console.warn("unsave failed, reverting:", e.message);
      optimistic(set => set.add(k));
    }
  }, [saved, token]);

  const toggleSave = React.useCallback((code, label) => {
    return isSaved(code) ? unsave(code) : save(code, label);
  }, [isSaved, save, unsave]);

  return {
    loading,
    savedCodes: saved,
    isSaved,
    save,
    unsave,
    toggleSave,
    hasToken: !!token
  };
}