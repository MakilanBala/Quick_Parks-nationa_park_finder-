import React from "react";
import { listSavedParks, savePark, unsavePark } from "../api/savedParksAPI";

const norm = code => String(code || "").trim().toLowerCase();

export default function useSavedParks() {
  const [saved, setSaved] = React.useState(new Set());
  const [loading, setLoading] = React.useState(false);
  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

  const isSaved = React.useCallback(code => saved.has(norm(code)), [saved]);

  // optimistic helper
  const optimistic = React.useCallback(updater => {
    setSaved(prev => {
      const next = new Set(prev);
      updater(next);
      return next;
    });
  }, []);

  // Load saved on token change
  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) { setSaved(new Set()); return; }
      setLoading(true);
      try {
        const codes = await listSavedParks();
        if (!cancelled) setSaved(new Set(codes));
      } catch (e) {
        console.warn("[useSavedParks] load failed:", e?.message || e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const onStorage = e => {
      if (e.key === "authToken") load();
    };
    window.addEventListener("storage", onStorage);
    return () => { cancelled = true; window.removeEventListener("storage", onStorage); };
  }, [token]);

  const save = React.useCallback(async (code, label) => {
    const k = norm(code);
    if (!k) return;
    if (!token) return;
    if (saved.has(k)) return;
    optimistic(s => s.add(k));
    try {
      await savePark(k, label || k);
    } catch (e) {
      if (e?.status === 409) return;
      optimistic(s => s.delete(k));
    }
  }, [saved, token, optimistic]);

  const unsave = React.useCallback(async code => {
    const k = norm(code);
    if (!k) return;
    if (!token) return;
    if (!saved.has(k)) return;
    optimistic(s => s.delete(k));
    try {
      await unsavePark(k);
    } catch (e) {
      optimistic(s => s.add(k));
    }
  }, [saved, token, optimistic]);

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