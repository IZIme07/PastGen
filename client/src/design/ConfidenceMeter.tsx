import type { CSSProperties } from "react";

export interface ConfidenceMeterProps {
  value?: number;
  variant?: "ring" | "bar";
  size?: number;
  showValue?: boolean;
  showLabel?: boolean;
  thickness?: number;
  style?: CSSProperties;
}

/**
 * ConfidenceMeter — фирменный элемент PastGen: насколько система и пользователь
 * доверяют утверждению (0–100). Кольцо (по умолчанию) или полоса.
 * ≥85 подтверждено · ≥60 вероятно · ≥35 косвенно · иначе гипотеза.
 */
export function ConfidenceMeter({
  value = 0, variant = "ring", size = 48, showValue = true,
  showLabel = false, thickness, style = {},
}: ConfidenceMeterProps) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const level =
    v >= 85 ? { key: "confirmed",  color: "var(--conf-confirmed)",  ru: "подтверждено" }
  : v >= 60 ? { key: "probable",   color: "var(--conf-probable)",   ru: "вероятно" }
  : v >= 35 ? { key: "inferred",   color: "var(--conf-inferred)",   ru: "косвенно" }
  :           { key: "hypothesis", color: "var(--conf-hypothesis)", ru: "гипотеза" };

  if (variant === "bar") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 120, ...style }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "baseline",
          font: "var(--w-medium) 12px/1 var(--font-mono)", color: "var(--text-muted)",
        }}>
          <span style={{ color: level.color, fontWeight: 600 }}>{v}%</span>
          {showLabel && <span>{level.ru}</span>}
        </div>
        <div style={{ height: 6, borderRadius: 999, background: "var(--paper-2)", overflow: "hidden" }}>
          <div style={{
            width: `${v}%`, height: "100%", borderRadius: 999, background: level.color,
            transition: "width var(--dur-slow) var(--ease-out)",
          }} />
        </div>
      </div>
    );
  }

  const stroke = thickness || Math.max(3, Math.round(size * 0.1));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (v / 100) * c;

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 4, ...style }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke="var(--paper-2)" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={level.color} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            style={{ transition: "stroke-dasharray var(--dur-slow) var(--ease-out)" }} />
        </svg>
        {showValue && (
          <span style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            font: `var(--w-semibold) ${Math.round(size * 0.28)}px/1 var(--font-mono)`,
            color: "var(--text-strong)", letterSpacing: "-0.02em",
          }}>
            {v}
          </span>
        )}
      </div>
      {showLabel && (
        <span style={{ font: "var(--w-medium) 11px/1 var(--font-sans)", color: level.color, letterSpacing: "0.02em" }}>
          {level.ru}
        </span>
      )}
    </div>
  );
}
