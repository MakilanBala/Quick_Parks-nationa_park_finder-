import React from "react";
import ParkLookUp from "../components/ParkLookUp";
import ParkCard from "../components/ParkCard";


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
  // Read-only: only use savedCodes
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [parks, setParks] = React.useState([]);

  

  return (
    <ParkLookUp>
      {loading && <div>Loading saved parks…</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      {!loading && parks.length === 0 && <div>No saved parks yet.</div>}
      {!loading && parks.length > 0 && (
        <div className="parks-grid">
          {parks.map((p) => (
            <ParkCard key={p.id || p.parkCode} park={p} />
          ))}
        </div>
      )}
    </ParkLookUp>
  );
}
