// MapView — stylized archival map of family places & migration routes.
function MapView({ }) {
  const { Badge, Icon } = window.PastGenDesignSystem_7468cb;
  const D = window.PG_DATA;
  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
      {/* map canvas */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden",
        background: "radial-gradient(120% 120% at 30% 20%, #EFE7D6 0%, #E6DBC4 60%, #DED1B6 100%)" }}>
        {/* faint graticule */}
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.5 }}>
          <defs>
            <pattern id="grat" width="64" height="64" patternUnits="userSpaceOnUse">
              <path d="M64 0H0V64" fill="none" stroke="rgba(124,102,72,0.18)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grat)" />
        </svg>
        {/* migration route Тула → Москва (dashed) */}
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
          <path d="M 34% 46% C 38% 40%, 41% 38%, 44% 38%" stroke="var(--brass-600)" strokeWidth="2.2"
            strokeDasharray="3 6" strokeLinecap="round" fill="none" />
        </svg>
        {D.places.map((pl) => (
          <div key={pl.id} style={{ position: "absolute", top: pl.top, left: pl.left, transform: "translate(-50%,-100%)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 30, height: 30, borderRadius: "50% 50% 50% 2px", transform: "rotate(45deg)",
              background: "var(--evergreen-600)", boxShadow: "var(--shadow-md)", border: "2px solid var(--paper-0)" }}>
              <span style={{ transform: "rotate(-45deg)", color: "#fff", font: "var(--w-semibold) 11px/1 var(--font-mono)" }}>{pl.count}</span>
            </span>
            <span style={{ background: "var(--surface-card)", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-pill)",
              padding: "2px 9px", font: "var(--w-semibold) 12px/1.4 var(--font-serif)", color: "var(--ink-900)", boxShadow: "var(--shadow-xs)" }}>{pl.name}</span>
          </div>
        ))}
      </div>
      {/* places rail */}
      <div style={{ width: 260, flex: "0 0 260px", borderLeft: "1px solid var(--line-strong)", background: "var(--bg-panel)", padding: 16, overflow: "auto" }}>
        <span className="pg-overline">Места семьи</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          {D.places.map((pl) => (
            <div key={pl.id} style={{ display: "flex", gap: 11, alignItems: "center", padding: "10px 11px",
              background: "var(--surface-card)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32,
                borderRadius: "var(--radius-sm)", background: "var(--evergreen-050)", color: "var(--evergreen-700)" }}>
                <Icon name="map-pin" size={17} />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ font: "var(--w-semibold) 14px/1.2 var(--font-serif)", color: "var(--text-strong)" }}>{pl.name}</div>
                <div style={{ font: "12px/1.3 var(--font-sans)", color: "var(--text-muted)", marginTop: 1 }}>{pl.kind}</div>
              </div>
              <Badge tone="neutral" size="sm">{pl.count}</Badge>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: "11px 12px", background: "var(--brass-050)", border: "1px solid var(--brass-100)",
          borderRadius: "var(--radius-md)", display: "flex", gap: 9 }}>
          <Icon name="route" size={16} style={{ color: "var(--brass-700)", marginTop: 1 }} />
          <span style={{ font: "var(--text-ui-small)", color: "var(--ink-700)" }}>Маршрут миграции: Тула → Москва, 1941 (эвакуация)</span>
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { MapView });
