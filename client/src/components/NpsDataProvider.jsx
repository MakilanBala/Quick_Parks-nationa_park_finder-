import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

// Use backend proxy base
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

const NpsDataContext = createContext(null);

export function NpsDataProvider({ children }) {
  const [activities, setActivities] = useState(() => {
    const cached = sessionStorage.getItem("nps_activities");
    return cached ? JSON.parse(cached) : [];
  });
  const [topics, setTopics] = useState(() => {
    const cached = sessionStorage.getItem("nps_topics");
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(!(activities.length && topics.length));
  const [error, setError] = useState(null);

  // Pager via proxy (handles activities/topics even if paginated)
  async function fetchAllPagesProxy(path, pageSize = 200) {
    let start = 0;
    const all = [];
    while (true) {
      const sep = path.includes("?") ? "&" : "?";
      const url = `${API_BASE}/api/nps${path}${sep}start=${start}&limit=${pageSize}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`NPS ${res.status} ${res.statusText}`);
      const json = await res.json();
      const data = json?.data || [];
      all.push(...data);
      const total = Number(json?.total ?? all.length);
      start += pageSize;
      if (data.length < pageSize || start >= total) break;
    }
    return all;
  }

  useEffect(() => {
    if (activities.length && topics.length) return; // already cached
    setLoading(true);
    Promise.all([
      fetchAllPagesProxy("/activities"),
      fetchAllPagesProxy("/topics"),
    ])
      .then(([acts, tops]) => {
        setActivities(acts);
        setTopics(tops);
        sessionStorage.setItem("nps_activities", JSON.stringify(acts));
        sessionStorage.setItem("nps_topics", JSON.stringify(tops));
      })
      .catch((e) => setError(e.message || String(e)))
      .finally(() => setLoading(false));
  }, [activities.length, topics.length]);

  const value = useMemo(
    () => ({ activities, topics, loading, error }),
    [activities, topics, loading, error]
  );

  return <NpsDataContext.Provider value={value}>{children}</NpsDataContext.Provider>;
}

export function useNpsData() {
  const ctx = useContext(NpsDataContext);
  if (!ctx) throw new Error("useNpsData must be used within NpsDataProvider");
  return ctx;
}