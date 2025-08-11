import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom"; // <-- add
import ParkLookUp from "../components/ParkLookUp";
import { useNpsData } from "../components/NpsDataProvider";
import ActivityMultiSelect from "../components/ActivityMultiSelect";
import TopicMultiSelect from "../components/TopicMultiSelect";
import RankableList from "../components/RankableList";


// Build what you’ll pass to results
function buildSearchPayload({ mustHaveActs, mustHaveTops, rankedActs, rankedTops, radius }) {
  return {
    mustHaveActivityIds: mustHaveActs,
    mustHaveTopicIds: mustHaveTops,
    rankedActivityIds: rankedActs.map(a => a.id),
    rankedTopicIds: rankedTops.map(t => t.id),
    radiusMiles: radius,
  };
}

export default function HomePage() {
  const { activities, topics, loading, error } = useNpsData();

  const [mustHaveActs, setMustHaveActs] = useState([]);   // selected activity IDs
  const [mustHaveTops, setMustHaveTops] = useState([]);   // selected topic IDs
  const [rankedActs, setRankedActs] = useState([]);       // selected activities, ordered
  const [radius, setRadius] = useState(50);
  const [rankedTops, setRankedTops] = useState([]);       // selected topics, ordered
  const [origin, setOrigin] = useState(null); // { lat, lon }
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});

  // Keep rankedActs in sync with selected IDs, preserving existing order
  useEffect(() => {
    if (!activities.length) return;
    const byId = new Map(activities.map(a => [a.id, a]));
    const kept = rankedActs.filter(a => mustHaveActs.includes(a.id) && byId.has(a.id));
    const newOnes = mustHaveActs
      .filter(id => !kept.some(a => a.id === id))
      .map(id => byId.get(id))
      .filter(Boolean);
    const next = [...kept, ...newOnes];
    if (next.length !== rankedActs.length || next.some((a, i) => a.id !== rankedActs[i]?.id)) {
      setRankedActs(next);
    }
  }, [mustHaveActs, activities]); // DO NOT depend on rankedActs to avoid loops

  // Keep rankedTops in sync with selected topic IDs, preserving existing order
  useEffect(() => {
    if (!topics.length) return;
    const byId = new Map(topics.map(t => [t.id, t]));
    const kept = rankedTops.filter(t => mustHaveTops.includes(t.id) && byId.has(t.id));
    const newOnes = mustHaveTops
      .filter(id => !kept.some(t => t.id === id))
      .map(id => byId.get(id))
      .filter(Boolean);
    const next = [...kept, ...newOnes];
    if (next.length !== rankedTops.length || next.some((t, i) => t.id !== rankedTops[i]?.id)) {
      setRankedTops(next);
    }
  }, [mustHaveTops, topics]); // DO NOT depend on rankedTops

  const activityOptions = useMemo(() => activities, [activities]);
  const topicOptions = useMemo(() => topics, [topics]);

  // REMOVE these early returns (they skip hooks below and break order)
  // if (loading) return <ParkLookUp><div>Loading NPS data…</div></ParkLookUp>;
  // if (error) return <ParkLookUp><div style={{ color: "red" }}>Error: {error}</div></ParkLookUp>;

  const getLocation = React.useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        setOrigin({ lat: latitude, lon: longitude });
      },
      err => {
        console.error("Geolocation error:", err);
        alert("Unable to get location. Check permissions and try again.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  const handleSearch = React.useCallback(() => {
    const missing = {};
    if (mustHaveActs.length === 0) missing.mustHaveActs = "Select at least one activity.";
    if (mustHaveTops.length === 0) missing.mustHaveTops = "Select at least one topic.";
    if (!radius || radius <= 0) missing.radius = "Choose a distance.";

    if (Object.keys(missing).length > 0) {
      setErrors(missing);
      document.querySelector(".park-lookup-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setErrors({});
    const payload = buildSearchPayload({ mustHaveActs, mustHaveTops, rankedActs, rankedTops, radius });
    payload.origin = origin;
    navigate("/results", { state: payload });
  }, [mustHaveActs, mustHaveTops, rankedActs, rankedTops, radius, origin, navigate]);

  return (
    <ParkLookUp>
      {loading ? (
        <div>Loading NPS data…</div>
      ) : error ? (
        <div style={{ color: "red" }}>Error: {error}</div>
      ) : (
        <>
          <div style={{ display: "grid", gap: "2rem" }}>
            <ActivityMultiSelect
              options={activityOptions}
              selectedIds={mustHaveActs}
              onChange={setMustHaveActs}
            />

            <TopicMultiSelect
              options={topicOptions}
              selectedIds={mustHaveTops}
              onChange={setMustHaveTops}
            />

            <div>
              <h3>Max distance from your location</h3>
              <input
                type="range"
                min="10"
                max="7000"
                step="10"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                style={{ width: "100%" }}
              />
              <div>{radius} miles</div>
              <button type="button" onClick={getLocation}>Use my current location</button>
              {origin && <div>Using: {origin.lat.toFixed(4)}, {origin.lon.toFixed(4)}</div>}
            </div>
          </div>

          {Object.keys(errors).length > 0 && (
            <div className="error-banner">
              {errors.mustHaveActs && <div>{errors.mustHaveActs}</div>}
              {errors.mustHaveTops && <div>{errors.mustHaveTops}</div>}
              {errors.radius && <div>{errors.radius}</div>}
            </div>
          )}

          <div className="actions">
            <button className="submitButton" onClick={handleSearch}>Search</button>
          </div>
        </>
      )}
    </ParkLookUp>
  );
}
