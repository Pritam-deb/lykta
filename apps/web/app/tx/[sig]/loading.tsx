export default function TxLoading() {
  const pulse: React.CSSProperties = {
    background: "var(--bg-3)",
    borderRadius: 6,
    animation: "pulse 1.5s ease-in-out infinite",
  };

  return (
    <>
      {/* Nav skeleton */}
      <div style={{ height: 56, borderBottom: "1px solid var(--border)", background: "var(--nav-bg)", display: "flex", alignItems: "center", gap: 12, padding: "0 clamp(1rem, 3vw, 2.5rem)" }}>
        <div style={{ ...pulse, width: 64, height: 28 }} />
        <div style={{ ...pulse, width: 80, height: 20 }} />
      </div>

      <main style={{ position: "relative", zIndex: 1, maxWidth: 1280, margin: "0 auto", padding: "clamp(1.5rem, 3vw, 2.5rem) clamp(1rem, 3vw, 2.5rem)" }}>
        {/* Header card skeleton */}
        <div style={{ background: "var(--bg-1)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px", marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <div style={{ ...pulse, width: 80, height: 26 }} />
            <div style={{ ...pulse, width: 100, height: 26 }} />
          </div>
          <div style={{ ...pulse, width: "100%", height: 14, maxWidth: 560 }} />
        </div>

        {/* Chips skeleton */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[100, 80, 120].map((w, i) => (
            <div key={i} style={{ ...pulse, width: w, height: 26, borderRadius: 100 }} />
          ))}
        </div>

        {/* Tab bar skeleton */}
        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", paddingBottom: 0, marginBottom: 0 }}>
          {[80, 96, 110, 88, 80, 72].map((w, i) => (
            <div key={i} style={{ ...pulse, width: w, height: 36, borderRadius: "6px 6px 0 0" }} />
          ))}
        </div>

        {/* Content skeleton */}
        <div style={{ background: "var(--bg-1)", border: "1px solid var(--border)", borderTop: "none", borderRadius: "0 0 12px 12px", padding: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[200, 320, 280, 240, 300, 260].map((w, i) => (
              <div key={i} style={{ ...pulse, width: `min(${w}px, 100%)`, height: 14 }} />
            ))}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </>
  );
}
