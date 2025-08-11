import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

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

  useEffect(() => {
    if (activities.length && topics.length) return; // already cached
    const apiKey = import.meta.env.VITE_NPS_API_KEY;
    if (!apiKey) {
      setError("Missing VITE_NPS_API_KEY");
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      fetch(`https://developer.nps.gov/api/v1/activities?api_key=${apiKey}`),
      fetch(`https://developer.nps.gov/api/v1/topics?api_key=${apiKey}`),
    ])
      .then(async ([aRes, tRes]) => {
        if (!aRes.ok || !tRes.ok) throw new Error("NPS fetch failed");
        const aJson = await aRes.json();
        const tJson = await tRes.json();
        const acts = aJson?.data ?? [];
        const tops = tJson?.data ?? [];
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