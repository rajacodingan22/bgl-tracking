import React, { useEffect, useMemo, useRef, useState } from "react";
import type { StoreSnap } from "../lib/market";
import { fmtIDR, fmtPct } from "../lib/market";
import { IDiamond, IUp, IDown, ICheck, IBell, IInfo } from "./Icons";

/* ---------- partikel gem melayang ---------- */
export function Sparkles() {
  const parts = useMemo(() => {
    const colors = ["#3fd6ff", "#35e6a4", "#ffb020", "#3fd6ff", "#5ce0d8"];
    return Array.from({ length: 26 }, (_, i) => ({
      left: (i * 137.5) % 100,
      size: 3 + ((i * 7) % 3) * 2,
      dur: 14 + ((i * 13) % 18),
      delay: -((i * 5.3) % 20),
      o: 0.25 + ((i * 11) % 50) / 100,
      c: colors[i % colors.length],
    }));
  }, []);
  return (
    <>
      {parts.map((p, i) => (
        <span
          key={i}
          className="sparkle"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.c,
            boxShadow: `0 0 8px ${p.c}`,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            ["--o" as string]: p.o,
          }}
        />
      ))}
    </>
  );
}

/* ---------- live dot ---------- */
export function LiveDot({ color = "var(--color-mint)" }: { color?: string }) {
  return (
    <span className="relative inline-flex items-center gap-2">
      <span className="live-dot inline-block h-2 w-2" style={{ background: color }} />
    </span>
  );
}

/* ---------- section header ---------- */
export function SectionHead({
  icon,
  kicker,
  title,
  right,
}: {
  icon: React.ReactNode;
  kicker: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-gem">
          <span className="text-gem">{icon}</span>
          {kicker}
        </div>
        <h2 className="font-display text-2xl font-bold uppercase leading-none text-fog sm:text-3xl">
          {title}
        </h2>
      </div>
      {right}
    </div>
  );
}

/* ---------- ticker tape ---------- */
export function TickerTape({ snaps, live }: { snaps: StoreSnap[]; live: number }) {
  const items = useMemo(
    () =>
      snaps.map((s) => ({
        name: s.def.name,
        price: s.price,
        up: s.price >= live,
        hue: s.def.hue,
      })),
    [snaps, live]
  );
  const row = (key: string) => (
    <div key={key} className="flex items-center">
      <span className="mx-4 flex items-center gap-2 whitespace-nowrap font-display text-sm uppercase tracking-wider">
        <span className="text-mute">Rata-rata pasar</span>
        <span className="nums text-fog">{fmtIDR(live)}</span>
      </span>
      <IDiamond className="text-line2" size={10} />
      {items.map((it, i) => (
        <span key={i} className="mx-4 flex items-center gap-2 whitespace-nowrap font-display text-sm uppercase tracking-wider">
          <span style={{ color: it.hue }}>{it.name}</span>
          <span className="nums text-fog">{fmtIDR(it.price)}</span>
          {it.up ? (
            <IUp className="text-mint" size={11} />
          ) : (
            <IDown className="text-coral" size={11} />
          )}
        </span>
      ))}
      <IDiamond className="text-line2" size={10} />
    </div>
  );
  return (
    <div className="ticker relative overflow-hidden border-y border-line bg-deep/80 py-2">
      <div className="tick-track">{[row("a"), row("b")]}</div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-ink to-transparent" />
    </div>
  );
}

/* ---------- scroll reveal ---------- */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add("is-in");
            io.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ---------- toasts ---------- */
export interface Toast {
  id: number;
  msg: string;
  kind: "ok" | "warn" | "buy" | "info";
}

export function Toasts({ list, onClose }: { list: Toast[]; onClose: (id: number) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-[80] flex w-[min(92vw,360px)] flex-col gap-2">
      {list.map((t) => {
        const color =
          t.kind === "buy" ? "var(--color-mint)" : t.kind === "warn" ? "var(--color-coral)" : t.kind === "info" ? "var(--color-gem)" : "var(--color-mint)";
        return (
          <div
            key={t.id}
            className="toast-in panel brk flex items-start gap-3 p-3"
            style={{ borderColor: color }}
          >
            <span className="mt-0.5" style={{ color }}>
              {t.kind === "buy" ? <IBell size={16} /> : t.kind === "warn" ? <IInfo size={16} /> : <ICheck size={16} />}
            </span>
            <p className="flex-1 text-[13px] leading-snug text-fog">{t.msg}</p>
            <button
              onClick={() => onClose(t.id)}
              className="text-mute transition-colors hover:text-coral"
              aria-label="Tutup notifikasi"
            >
              <IXSmall />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function IXSmall() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" shapeRendering="crispEdges" aria-hidden="true">
      <rect x="0" y="0" width="2" height="2" fill="currentColor" />
      <rect x="2" y="2" width="2" height="2" fill="currentColor" />
      <rect x="4" y="4" width="2" height="2" fill="currentColor" />
      <rect x="6" y="6" width="2" height="2" fill="currentColor" />
      <rect x="8" y="8" width="2" height="2" fill="currentColor" />
      <rect x="8" y="0" width="2" height="2" fill="currentColor" />
      <rect x="6" y="2" width="2" height="2" fill="currentColor" />
      <rect x="2" y="6" width="2" height="2" fill="currentColor" />
      <rect x="0" y="8" width="2" height="2" fill="currentColor" />
    </svg>
  );
}

export { fmtPct };
