import React from "react";
import ParkLookUp from "../components/ParkLookUp";
import ParkCard from "../components/ParkCard";
import useSavedParks from "../hooks/useSavedParks";

const API = "https://developer.nps.gov/api/v1";
const KEY = import.meta.env.VITE_NPS_API_KEY;

async function fetchParkDetailsByCodes(codes) {
  const all = [];
  for (let i = 0; i < codes.length; i += 40) {
    const chunk = codes.slice(i, i + 40);
    const url = `${API}/parks?parkCode=${chunk.map(encodeURIComponent).join(",")}&fields=fullName,states,images,description,url,latLong&limit=500`;
    const res = await fetch(url, { headers: { "X-Api-Key": KEY } });
    if (!res.ok) throw new Error(`Parks details error: ${res.status} ${res.statusText}`);
    const json = await res.json();
    all.push(...(json?.data || []));
  }
  return all;
}

export default function SavedParksPage() {
  const { savedCodes, hasToken, loading: savedLoading } = useSavedParks();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [parks, setParks] = React.useState([]);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!hasToken) { setParks([]); return; }
      const codes = Array.from(savedCodes || []);
      if (codes.length === 0) { setParks([]); return; }
      setLoading(true); setError(null);
      try {
        const details = await fetchParkDetailsByCodes(codes);
        if (!cancelled) setParks(details);
      } catch (e) {
        if (!cancelled) setError(e.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [savedCodes, hasToken]);

  const showLoading = loading || savedLoading;

  return (
    <ParkLookUp>
      {!hasToken && <div>Please log in to view saved parks.</div>}
      {showLoading && <div>Loading saved parks…</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      {!showLoading && hasToken && parks.length === 0 && <div>No saved parks yet.</div>}
      {!showLoading && parks.length > 0 && (
        <div className="parks-grid">
          {parks.map((p) => (
            <ParkCard key={p.id || p.parkCode} park={p} />
          ))}
        </div>
      )}
    </ParkLookUp>
  );
}
