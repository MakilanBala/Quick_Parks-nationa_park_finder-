import React from "react";

/* Simple up/down ranker: items [{id, name}], order is items array order */
export default function RankableList({ title = "Rank activities", items, onChange }) {
  const move = (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  };
  return (
    <div>
      <h3>{title}</h3>
      <ol style={{ paddingLeft: 18, maxHeight: 420, overflow: "auto", margin: 0 }}>
        {items.map((it, idx) => (
          <li key={it.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ flex: 1 }}>{it.name}</span>
            <button type="button" onClick={() => move(idx, -1)}>↑</button>
            <button type="button" onClick={() => move(idx, 1)}>↓</button>
          </li>
        ))}
      </ol>
    </div>
  );
}