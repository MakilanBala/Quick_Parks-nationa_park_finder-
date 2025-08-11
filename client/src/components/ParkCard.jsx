import React from "react";

export default function ParkCard({ park, distanceMiles, isSaved, onToggleSave }) {
  const img = park.images?.[0];
  const distText = typeof distanceMiles === "number" ? `${distanceMiles.toFixed(1)} mi from you` : null;

  const [expanded, setExpanded] = React.useState(false);
  const desc = park.description || "No description available.";
  const shouldTruncate = desc.length > 220; // simple heuristic
  const clampLines = 3;

  

  return (
    <article
      style={{
        display: "flex",
        gap: 16,
        padding: 16,
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        background: "#fff",
      }}
    >
      <div style={{ width: 160, minWidth: 160, height: 120, overflow: "hidden", borderRadius: 8, background: "#f3f4f6" }}>
        {img ? (
          <img
            src={img.url}
            alt={img.altText || park.fullName}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            loading="lazy"
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "#9ca3af" }}>
            No image
          </div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0, display: "grid", gap: 8 }}>
        <header style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{park.fullName}</h3>
          {park.states && (
            <span style={{ fontSize: 12, color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: 999, padding: "2px 8px" }}>
              {park.states}
            </span>
          )}
          {distText && (
            <span
              style={{
                marginLeft: "auto",
                fontSize: 13,
                color: "#2563eb",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              
              {distText}
            </span>
          )}
        </header>

        <div style={{ position: "relative" }}>
          <p
            style={{
              margin: "4px 0 0",
              color: "#374151",
              lineHeight: 1.45,
              ...(expanded
                ? {}
                : {
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: clampLines,
                    WebkitBoxOrient: "vertical",
                  }),
            }}
          >
            {desc}
          </p>

          {!expanded && shouldTruncate && (
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: "auto 0 0 0",
                height: 36,
                background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, #ffffff 70%)",
              }}
            />
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {typeof onToggleSave === "function" && (
            <button
              type="button"
              onClick={onToggleSave}
              style={{
                appearance: "none",
                border: "1px solid #e5e7eb",
                background: isSaved ? "#fef2f2" : "#f9fafb",
                color: isSaved ? "#b91c1c" : "#111827",
                padding: "6px 10px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer"
              }}
            >
              {isSaved ? "Unsave" : "Save"}
            </button>
          )}
          {shouldTruncate && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              style={{
                appearance: "none",
                border: "1px solid #e5e7eb",
                background: "#f9fafb",
                color: "#111827",
                padding: "6px 10px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}

          <a
            href={park.url}
            target="_blank"
            rel="noreferrer"
            style={{ marginLeft: "auto", fontSize: 14, color: "#2563eb", textDecoration: "none", fontWeight: 500 }}
          >
            View park details →
          </a>
        </div>
      </div>
    </article>
  );
}