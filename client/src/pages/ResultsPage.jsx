import React from "react";
import { useLocation, Navigate } from "react-router-dom";
import ParkLookUp from "../components/ParkLookUp";
import ParkCard from "../components/ParkCard";
import useSavedParks from "../hooks/useSavedParks";


const API = "https://developer.nps.gov/api/v1";
const KEY = import.meta.env.VITE_NPS_API_KEY;

// Helper: GUID check + name normalizer
function isGuidish(id) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
function norm(s) {
  return String(s).toLowerCase().replace(/\s+/g, " ").trim();
}
// Add: preference weights (earlier in list = higher weight)
function makeWeights(ids) {
  const unique = Array.from(new Set(ids || []));
  const n = unique.length;
  const map = new Map();
  unique.forEach((id, idx) => map.set(id, n - idx)); // first gets n, next n-1, ...
  return map;
}

//
// Distance + details helpers
//
function parseLatLong(latLong) {
  if (!latLong) return null;
  const m = String(latLong).match(/lat:\s*([-0-9.]+)\s*,\s*long:\s*([-0-9.]+)/i);
  if (!m) return null;
  return { lat: Number(m[1]), lon: Number(m[2]) };
}
function toRad(d) { return (d * Math.PI) / 180; }
function haversineMiles(a, b) {
  const R = 3958.7613;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
async function fetchParkDetailsByCodes(codes) {
  const all = [];
  for (let i = 0; i < codes.length; i += 40) {
    const chunk = codes.slice(i, i + 40);
    const url = `${API}/parks?parkCode=${chunk.map(encodeURIComponent).join(",")}&fields=latLong,fullName,states,images,description,url&limit=500`;
    const res = await fetch(url, { headers: { "X-Api-Key": KEY } });
    if (!res.ok) throw new Error(`Parks details error: ${res.status} ${res.statusText}`);
    const json = await res.json();
    all.push(...(json?.data || []));
  }
  return all;
}

// Fetch all pages from an NPS endpoint (uses total/start/limit)
async function fetchAllPages(baseUrl, pageSize = 200, fetchOpts = {}) {
  let start = 0;
  const rows = [];
  while (true) {
    const sep = baseUrl.includes("?") ? "&" : "?";
    const url = `${baseUrl}${sep}start=${start}&limit=${pageSize}`;
    const res = await fetch(url, fetchOpts);
    if (!res.ok) throw new Error(`NPS paging error: ${res.status} ${res.statusText}`);
    const page = await res.json();
    const data = page?.data || [];
    rows.push(...data);
    const total = Number(page?.total ?? rows.length);
    start += pageSize;
    if (data.length < pageSize || start >= total) break; // last page reached
  }
  return rows;
}

// Resolve activity names -> GUID IDs using the master list
async function resolveActivityIds(activities) {
  const items = (activities || [])
    .map(x => (typeof x === "string" ? x : x?.id || x?.name || x?.label || x?.value))
    .filter(Boolean);

  const guids = items.filter(isGuidish);
  const names = items.filter(x => !isGuidish(x)).map(norm);
  if (!names.length) {
    const unique = Array.from(new Set(guids));
    console.log("[ResultsPage] Resolved activity IDs:", unique);
    return unique;
  }

  const list = await fetchAllPages(`${API}/activities`, 200, { headers: { "X-Api-Key": KEY } });

  const byName = new Map(list.map(x => [norm(x.name), x.id]));
  const loose = list.map(x => ({ id: x.id, name: norm(x.name) }));

  names.forEach(n => {
    let id = byName.get(n);
    if (!id) {
      const hit = loose.find(x => x.name.includes(n));
      if (hit) id = hit.id;
    }
    if (id) guids.push(id);
  });

  const unique = Array.from(new Set(guids));
  console.log("[ResultsPage] Resolved activity IDs:", unique);
  return unique;
}

// Get parks for a list of activities (names or GUIDs). Returns parkCodes present in ALL activities (intersection).
async function parksByActivities(activities) {
  const activityIds = Array.from(new Set(await resolveActivityIds(activities)));
  console.log("[ResultsPage] Using activity IDs:", activityIds);
  if (!activityIds.length) return { codes: [], codeToAct: new Map() };

  const perActivity = new Map(); // actId -> Set(parkCode)
  const codeToAct = new Map();   // parkCode -> Set(actId)

  for (const id of activityIds) {
    const base = `${API}/activities/parks?id=${encodeURIComponent(id)}`;
    const rows = await fetchAllPages(base, 200, { headers: { "X-Api-Key": KEY } });

    const set = new Set();
    rows.forEach(row => {
      (row.parks || []).forEach(p => {
        set.add(p.parkCode);
        const s = codeToAct.get(p.parkCode) || new Set();
        s.add(id);
        codeToAct.set(p.parkCode, s);
      });
    });

    console.log(`[ResultsPage] Activity ${id} matched ${set.size} parkCodes`);
    perActivity.set(id, set);
  }

  if (activityIds.some(id => !perActivity.get(id) || perActivity.get(id).size === 0)) {
    console.warn("[ResultsPage] One or more activities returned 0 parks; intersection is empty");
    return { codes: [], codeToAct };
  }

  let acc = null;
  for (const id of activityIds) {
    const set = perActivity.get(id);
    if (acc == null) acc = new Set(set);
    else for (const code of Array.from(acc)) if (!set.has(code)) acc.delete(code);
  }

  const result = Array.from(acc || []);
  console.log("[ResultsPage] Intersection size:", result.length);
  return { codes: result, codeToAct };
}

// Resolve topic names -> GUID IDs using the master list (paginated)
async function resolveTopicIds(topics) {
  const items = (topics || [])
    .map(x => (typeof x === "string" ? x : x?.id || x?.name || x?.label || x?.value))
    .filter(Boolean);

  const guids = items.filter(isGuidish);
  const names = items.filter(x => !isGuidish(x)).map(norm);
  if (!names.length) {
    const unique = Array.from(new Set(guids));
    console.log("[ResultsPage] Resolved topic IDs:", unique);
    return unique;
  }

  const list = await fetchAllPages(`${API}/topics`, 200, { headers: { "X-Api-Key": KEY } });
  const byName = new Map(list.map(x => [norm(x.name), x.id]));
  const loose = list.map(x => ({ id: x.id, name: norm(x.name) }));

  names.forEach(n => {
    let id = byName.get(n);
    if (!id) {
      const hit = loose.find(x => x.name.includes(n));
      if (hit) id = hit.id;
    }
    if (id) guids.push(id);
  });

  const unique = Array.from(new Set(guids));
  console.log("[ResultsPage] Resolved topic IDs:", unique);
  return unique;
}

// Get parks for a list of topics (names or GUIDs). Returns parkCodes present in ALL topics (intersection).
async function parksByTopics(topics) {
  const topicIds = Array.from(new Set(await resolveTopicIds(topics)));
  console.log("[ResultsPage] Using topic IDs:", topicIds);
  if (!topicIds.length) return { codes: [], codeToTopic: new Map() };

  const perTopic = new Map();   // topicId -> Set(parkCode)
  const codeToTopic = new Map(); // parkCode -> Set(topicId)

  for (const id of topicIds) {
    const base = `${API}/topics/parks?id=${encodeURIComponent(id)}`;
    const rows = await fetchAllPages(base, 200, { headers: { "X-Api-Key": KEY } });

    const set = new Set();
    rows.forEach(row => {
      (row.parks || []).forEach(p => {
        set.add(p.parkCode);
        const s = codeToTopic.get(p.parkCode) || new Set();
        s.add(id);
        codeToTopic.set(p.parkCode, s);
      });
    });

    console.log(`[ResultsPage] Topic ${id} matched ${set.size} parkCodes`);
    perTopic.set(id, set);
  }

  if (topicIds.some(id => !perTopic.get(id) || perTopic.get(id).size === 0)) {
    console.warn("[ResultsPage] One or more topics returned 0 parks; intersection is empty");
    return { codes: [], codeToTopic };
  }

  let acc = null;
  for (const id of topicIds) {
    const set = perTopic.get(id);
    if (acc == null) acc = new Set(set);
    else for (const code of Array.from(acc)) if (!set.has(code)) acc.delete(code);
  }

  const result = Array.from(acc || []);
  console.log("[ResultsPage] Topic intersection size:", result.length);
  return { codes: result, codeToTopic };
}

// Removed popularity-based helpers:
// - buildGlobalPopularity()
// - rankParkByPopularity()

export default function ResultsPage() {
  const { state } = useLocation();

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [parkCodes, setParkCodes] = React.useState([]);
  const [parks, setParks] = React.useState([]);
  const { isSaved, toggleSave, hasToken } = useSavedParks();

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      const activities = state?.mustHaveActivityIds || [];
      const topics = state?.mustHaveTopicIds || [];
      const origin = state?.origin || null;
      const radiusMiles = state?.radiusMiles || 0;
      if (!activities.length && !topics.length) { setParkCodes([]); return; }

      try {
        setLoading(true);
        setError(null);

        const [actRes, topRes] = await Promise.all([
          activities.length ? parksByActivities(activities) : Promise.resolve({ codes: [], codeToAct: new Map() }),
          topics.length ? parksByTopics(topics) : Promise.resolve({ codes: [], codeToTopic: new Map() }),
        ]);

        // Intersect across groups
        let codes = [];
        if (activities.length && topics.length) {
          const topSet = new Set(topRes.codes);
          codes = actRes.codes.filter(c => topSet.has(c));
          console.log(`[ResultsPage] Intersected activities (${actRes.codes.length}) ∩ topics (${topRes.codes.length}) -> ${codes.length} parks`);
        } else {
          codes = activities.length ? actRes.codes : topRes.codes;
          console.log(`[ResultsPage] Single-group result -> ${codes.length} parks`);
        }

        // Radius filter (keeps same count intent after sorting applied below)
        if (origin && Number(radiusMiles) > 0 && codes.length) {
          const details = await fetchParkDetailsByCodes(codes);
          const within = [];
          for (const p of details) {
            const ll = parseLatLong(p.latLong);
            if (!ll) continue;
            const dist = haversineMiles(origin, { lat: ll.lat, lon: ll.lon });
            if (dist <= radiusMiles) within.push(p.parkCode);
          }
          codes = Array.from(new Set(within));
          console.log(`[ResultsPage] Radius filter ≤ ${radiusMiles} mi -> ${codes.length} parks`);
        }

        // Distance-based sort (ascending), same set size
        if (origin && codes.length) {
          const details = await fetchParkDetailsByCodes(codes);
          const byCode = new Map(details.map(p => [p.parkCode, p]));
          const scored = codes.map(code => {
            const p = byCode.get(code);
            const ll = p ? parseLatLong(p.latLong) : null;
            const dist = ll ? haversineMiles(origin, { lat: ll.lat, lon: ll.lon }) : Number.POSITIVE_INFINITY;
            return { code, dist };
          });
          scored.sort((a, b) => (a.dist - b.dist) || a.code.localeCompare(b.code));
          codes = scored.map(x => x.code);
          console.log(`[ResultsPage] Sorted ${codes.length} parks by distance (top 5):`, scored.slice(0, 5));
        }

        if (!cancelled) setParkCodes(codes);

        // Fetch details to render cards (preserve order of `codes`)
        if (codes.length) {
          const detailsRaw = await fetchParkDetailsByCodes(codes);
          const byCode = new Map(detailsRaw.map(p => [p.parkCode, p]));
          // add distance to each park (if origin available) and keep original order
          const ordered = codes
            .map(c => byCode.get(c))
            .filter(Boolean)
            .map(p => {
              const ll = parseLatLong(p.latLong);
              const dist = origin && ll ? haversineMiles(origin, { lat: ll.lat, lon: ll.lon }) : undefined;
              return { ...p, _dist: dist };
            });
          if (!cancelled) setParks(ordered);
        } else {
          if (!cancelled) setParks([]);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (state) run();
    return () => { cancelled = true; };
  }, [state]);

  // Log whenever parkCodes changes
  React.useEffect(() => {
    console.log(`[ResultsPage] Current parks count: ${parkCodes.length}`);
  }, [parkCodes]);

  if (!state) return <Navigate to="/home" replace />;

  return (
    <div>
      <ParkLookUp>
        <h2>Results</h2>
        {loading && <div>Loading…</div>}
        {error && <div className="error-banner">Error: {error}</div>}
        {!loading && !error && (
          parks.length === 0 ? (
            <div>No parks found, try adjusting your filters.</div>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              {parks.map(p => {
                const code = (p.parkCode || "").trim().toLowerCase();
                const canSave = hasToken && !!code;
                return (
                  <ParkCard
                    key={p.id || code}
                    park={p}
                    distanceMiles={p._dist}
                    isSaved={code ? isSaved(code) : false}
                    onToggleSave={
                      canSave
                        ? () => {
                            console.debug("[Save] click", { code, wasSaved: isSaved(code) });
                            toggleSave(code, p.fullName);
                          }
                        : undefined
                    }
                  />
                );
              })}
            </div>
          )
        )}
      </ParkLookUp>
    </div>
  );
}