import React, { useMemo } from "react";
import type { Analysis, Point } from "../lib/market";
import { fmtIDR, fmtPct } from "../lib/market";
import { LiveDot } from "./Bits";
import { IUp, IDown, ICart, IClock, IZap } from "./Icons";

interface Props {
  live: number;
  flashKey: number;
  flashDir: "up" | "down" | null;
  analysis: Analysis;
  buyZone: number;
  spark: Point[];
}

export default function PricePanel({ live, flashKey, flashDir, analysis: a, buyZone, spark }: Props) {
  const sig = a.signal;
  const sigStyle =
    sig === "BELI"
      ? { bg: "rgba(53,230,164,0.12)", border: "var(--color-mint)", color: "var(--color-mint)", label: "SINYAL BELI AKTIF", pulse: true }
      : sig === "PANTAU"
      ? { bg: "rgba(255,176,32,0.1)", border: "var(--color-amber)", color: "var(--color-amber)", label: "ZONA PANTAU", pulse: false }
      : { bg: "rgba(20,64,90,0.35)", border: "var(--color-line2)", color: "var(--color-mute)", label: "TUNGGU / HOLD", pulse: false };

  const sparkPath = useMemo(() => {
    const w = 260;
    const h = 54;
    const vals = spark.map((p) => p.v);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const rng = Math.max(1, max - min);
    const pts = vals.map(
      (v, i) => `${((i / (vals.length - 1)) * w).toFixed(1)},${(h - 4 - ((v - min) / rng) * (h - 10)).toFixed(1)}`
    );
    return { line: "M" + pts.join(" L"), area: `M0,${h} L` + pts.join(" L") + ` L${w},${h} Z` };
  }, [spark]);

  const zoneProg = Math.max(0, Math.min(100, 100 - a.buyZoneDistPct * 6));

  const stats: { label: string; value: string; tone?: string }[] = [
    { label: "SMA-7", value: fmtIDR(a.sma7) },
    { label: "SMA-30", value: fmtIDR(a.sma30) },
    { label: "RSI-14", value: String(Math.round(a.rsi)), tone: a.rsi < 35 ? "var(--color-mint)" : a.rsi > 65 ? "var(--color-coral)" : undefined },
    { label: "Volatilitas", value: a.volPct.toFixed(2).replace(".", ",") + "%" },
    { label: "Support 30H", value: fmtIDR(a.support), tone: "var(--color-mint)" },
    { label: "Resistance 30H", value: fmtIDR(a.resistance), tone: "var(--color-coral)" },
  ];

  return (
    <div className="panel brk flex h-full flex-col p-5 sm:p-6">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <LiveDot />
          <span className="font-display text-sm uppercase tracking-[0.18em] text-mute">
            Harga Rata-Rata Pasar · BGL
          </span>
        </div>
        <span className="flex items-center gap-1.5 border border-line bg-deep px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gem">
          <IClock size={11} /> Live WIB
        </span>
      </div>

      {/* big price */}
      <div className="mt-4 flex flex-wrap items-end gap-x-5 gap-y-3">
        <div
          key={flashKey}
          className={`nums font-display text-5xl font-bold leading-none text-fog sm:text-6xl ${
            flashDir === "up" ? "flash-up" : flashDir === "down" ? "flash-down" : ""
          }`}
        >
          {fmtIDR(live)}
        </div>
        <div className="flex flex-col gap-1.5 pb-1">
          <span
            className={`nums flex w-fit items-center gap-1 px-1.5 py-0.5 text-xs font-bold ${
              a.chg24 >= 0 ? "bg-mint/10 text-mint" : "bg-coral/10 text-coral"
            }`}
          >
            {a.chg24 >= 0 ? <IUp size={11} /> : <IDown size={11} />}
            {fmtPct(a.chg24)} · 24 jam
          </span>
          <span
            className={`nums flex w-fit items-center gap-1 px-1.5 py-0.5 text-xs font-bold ${
              a.chg7 >= 0 ? "bg-mint/10 text-mint" : "bg-coral/10 text-coral"
            }`}
          >
            {a.chg7 >= 0 ? <IUp size={11} /> : <IDown size={11} />}
            {fmtPct(a.chg7)} · 7 hari
          </span>
        </div>
      </div>

      {/* signal */}
      <div
        className={`mt-5 flex items-center gap-3 border px-4 py-3 ${sigStyle.pulse ? "sig-pulse" : ""}`}
        style={{ background: sigStyle.bg, borderColor: sigStyle.border }}
      >
        <ICart size={22} className="shrink-0" />
        <div className="flex-1">
          <div className="font-display text-lg font-bold uppercase leading-tight" style={{ color: sigStyle.color }}>
            {sigStyle.label}
          </div>
          <div className="text-xs text-mute">
            {sig === "BELI"
              ? `Harga menyentuh zona beli ${fmtIDR(buyZone)} — eksekusi bertahap disarankan.`
              : sig === "PANTAU"
              ? `Mendekati zona beli ${fmtIDR(buyZone)} (jarak ${fmtPct(a.buyZoneDistPct)}). Siagakan alert.`
              : `Masih jauh dari zona beli ${fmtIDR(buyZone)} (jarak ${fmtPct(a.buyZoneDistPct)}). Sabar.`}
          </div>
        </div>
        <IZap size={20} className={sig === "BELI" ? "text-mint" : "text-line2"} />
      </div>

      {/* zone progress */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[11px] uppercase tracking-widest text-mute">
          <span>Progres menuju zona beli</span>
          <span className="nums text-amber">{Math.round(zoneProg)}%</span>
        </div>
        <div className="h-2.5 w-full border border-line bg-deep">
          <div
            className="h-full transition-all duration-700"
            style={{
              width: `${zoneProg}%`,
              background: "linear-gradient(90deg, var(--color-gem), var(--color-mint))",
              boxShadow: "0 0 10px rgba(53,230,164,0.5)",
            }}
          />
        </div>
      </div>

      {/* sparkline */}
      <div className="mt-5 border border-line bg-deep/60 p-3">
        <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-widest text-mute">
          <span>30 hari terakhir</span>
          <span className="nums">{fmtIDR(spark[0].v)} → {fmtIDR(live)}</span>
        </div>
        <svg viewBox="0 0 260 54" className="h-14 w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3fd6ff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#3fd6ff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={sparkPath.area} fill="url(#sparkfill)" />
          <path d={sparkPath.line} fill="none" stroke="#3fd6ff" strokeWidth="1.6" />
        </svg>
      </div>

      {/* stats */}
      <div className="mt-4 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="group bg-panel p-3 transition-colors hover:bg-panel2">
            <div className="text-[10px] uppercase tracking-widest text-mute transition-colors group-hover:text-gem">
              {s.label}
            </div>
            <div className="nums mt-0.5 font-display text-base font-semibold" style={{ color: s.tone ?? "var(--color-fog)" }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* insight ringkas */}
      <ul className="mt-4 space-y-2.5">
        {a.insights.slice(0, 3).map((ins) => (
          <li key={ins.label} className="flex gap-2.5 text-[13px] leading-relaxed text-fog/85">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-gem" />
            <p>
              <span className="font-semibold text-gem">{ins.label} — </span>
              {ins.text}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
