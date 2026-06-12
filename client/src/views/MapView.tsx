// MapView — настоящая карта (Leaflet + OpenStreetMap) в тёплой архивной тонировке:
// маркеры мест, маршруты миграций, рельса мест справа. (По дизайну MapView из ui_kits.)
import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Badge } from "../design/Badge";
import { Icon } from "../design/Icon";
import { useStore } from "../state/store";

const WARM_FILTER = "sepia(0.28) saturate(0.82) hue-rotate(-8deg) brightness(1.04)";

function markerIcon(count: number): L.DivIcon {
  return L.divIcon({
    className: "",
    iconSize: [30, 38],
    iconAnchor: [15, 34],
    html: `<span style="
      display:inline-flex;align-items:center;justify-content:center;
      width:30px;height:30px;border-radius:50% 50% 50% 2px;transform:rotate(45deg);
      background:var(--evergreen-600);box-shadow:var(--shadow-md);border:2px solid var(--paper-0);">
      <span style="transform:rotate(-45deg);color:#fff;font:600 11px/1 'IBM Plex Mono',monospace;">${count}</span>
    </span>`,
  });
}

export function MapView() {
  const { places, events } = useStore();
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const located = useMemo(() => places.filter((p) => p.lat != null && p.lng != null), [places]);

  const countFor = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of events) {
      if (e.place_id) counts.set(e.place_id, (counts.get(e.place_id) ?? 0) + 1);
    }
    return (id: string) => counts.get(id) ?? 0;
  }, [events]);

  // Маршруты миграций: move-события с описанием «A → B» между известными местами.
  const routes = useMemo(() => {
    const byName = new Map(located.map((p) => [p.name.toLowerCase(), p]));
    const result: { from: typeof located[number]; to: typeof located[number]; label: string }[] = [];
    for (const e of events) {
      if (e.type !== "move" && e.type !== "emigration") continue;
      const m = /([А-ЯЁA-Z][^→]*?)\s*→\s*([А-ЯЁA-Z][^,·]*)/u.exec(e.description ?? "");
      if (!m) continue;
      const from = byName.get(m[1].trim().toLowerCase());
      const to = byName.get(m[2].trim().toLowerCase());
      if (from && to) result.push({ from, to, label: e.description ?? "" });
    }
    return result;
  }, [events, located]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      className: "pg-warm-tiles",
    }).addTo(map);
    map.setView([55, 37], 6);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const layer = L.layerGroup().addTo(map);

    for (const p of located) {
      L.marker([p.lat!, p.lng!], { icon: markerIcon(countFor(p.id)) })
        .bindPopup(`<div style="font:600 14px/1.3 Spectral,serif;color:#211C12">${p.name}</div>
          <div style="font:12px/1.4 'IBM Plex Sans',sans-serif;color:#6E6353">События: ${countFor(p.id)}</div>`)
        .addTo(layer);
    }
    for (const r of routes) {
      L.polyline(
        [[r.from.lat!, r.from.lng!], [r.to.lat!, r.to.lng!]],
        { color: "#9A7434", weight: 2.4, dashArray: "4 8", opacity: 0.85 },
      ).bindPopup(r.label).addTo(layer);
    }
    if (located.length > 0) {
      map.fitBounds(L.latLngBounds(located.map((p) => [p.lat!, p.lng!] as [number, number])), {
        padding: [60, 60], maxZoom: 9,
      });
    }
    return () => { layer.remove(); };
  }, [located, routes, countFor]);

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
      <style>{`.pg-warm-tiles { filter: ${WARM_FILTER}; }`}</style>
      <div ref={containerRef} style={{ flex: 1, background: "#EFE7D6" }} />

      <div style={{
        width: 260, flex: "0 0 260px", borderLeft: "1px solid var(--line-strong)",
        background: "var(--bg-panel)", padding: 16, overflow: "auto",
      }}>
        <span className="pg-overline">Места семьи</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          {located.length === 0 && (
            <p style={{ font: "var(--text-ui-small)", color: "var(--text-faint)" }}>
              Мест пока нет — они появятся из событий и импорта.
            </p>
          )}
          {located.map((pl) => (
            <button key={pl.id}
              onClick={() => mapRef.current?.setView([pl.lat!, pl.lng!], 10)}
              style={{
                display: "flex", gap: 11, alignItems: "center", padding: "10px 11px", textAlign: "left",
                background: "var(--surface-card)", border: "1px solid var(--line)",
                borderRadius: "var(--radius-md)", cursor: "pointer",
              }}>
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32,
                borderRadius: "var(--radius-sm)", background: "var(--evergreen-050)", color: "var(--evergreen-700)",
              }}>
                <Icon name="map-pin" size={17} />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ font: "var(--w-semibold) 14px/1.2 var(--font-serif)", color: "var(--text-strong)" }}>
                  {pl.name}
                </div>
                <div style={{ font: "12px/1.3 var(--font-sans)", color: "var(--text-muted)", marginTop: 1 }}>
                  {pl.period ?? `События: ${countFor(pl.id)}`}
                </div>
              </div>
              <Badge tone="neutral" size="sm">{countFor(pl.id)}</Badge>
            </button>
          ))}
        </div>
        {routes.map((r, i) => (
          <div key={i} style={{
            marginTop: 16, padding: "11px 12px", background: "var(--brass-050)",
            border: "1px solid var(--brass-100)", borderRadius: "var(--radius-md)", display: "flex", gap: 9,
          }}>
            <Icon name="route" size={16} style={{ color: "var(--brass-700)", marginTop: 1 }} />
            <span style={{ font: "var(--text-ui-small)", color: "var(--ink-700)" }}>{r.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
