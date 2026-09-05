import React, { useMemo, useRef, useState } from "react";
import type { Forecast, MarketEvent, Point } from "../lib/market";
import { DAYS, fmtDate, fmtIDR, fmtPct } from "../lib/market";
import { SectionHead } from "./Bits";
import { IPulse } from "./Icons";

const W = 920;
const H = 360;
const PL = 64;
const PR = 20;
const PT = 22;
const PB = 34;

type RangeId = "30" | "90" | "180" | "all";
const RANGES: { id: RangeId; label: string }[] = [
  { id: "30", label: "30 HARI" },
  { id: "90", label: "90 HARI" },
  { id: "180", label: "6 BULAN" },
  { id: "all", label: "SEMUA" },
];

interface Props {
  history: Point[];
  forecast: Forecast;
  events: MarketEvent[];
  buyZone: number;
  range: RangeId;
  onRange: (r: RangeId) => void;
}

export default function PriceChart({ history, forecast, events, buyZone, range, onRange }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<{ i: number } | null>(null);

  const data = useMemo(
    () => (range === "all" ? history : history.slice(-parseInt(range))),
    [history, range]
  );

  const { yMin, yMax } = useMemo(() => {
    const vals = [...data.map((p) => p.v), ...forecast.path.map((p) => p.v)];
    let mn = Math.min(...vals, buyZone - 600);
    let mx = Math.max(...vals, buyZone + 600);
    const pad = (mx - mn) * 0.08;
    return { yMin: mn - pad, yMax: mx + pad };
  }, [data, forecast, buyZone]);

  const totalPts = data.length + forecast.path.length;
  const iw = W - PL - PR;
  const ih = H - PT - PB;
  const x = (i: number) => PL + (i / (totalPts - 1)) * iw;
  const y = (v: number) => PT + (1 - (v - yMin) / (yMax - yMin)) * ih;
  const lastIdx = data.length - 1;

  const linePath = useMemo(
    () => "M" + data.map((p, i) => `${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" L"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, yMin, yMax, range]
  );
  const areaPath = useMemo(
    () =>
      `M${PL},${H - PB} L` +
      data.map((p, i) => `${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" L") +
      ` L${x(lastIdx).toFixed(1)},${H - PB} Z`,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, yMin, yMax, range]
  );
  const fcPath = useMemo(
    () =>
      "M" +
      [data[lastIdx], ...forecast.path]
        .map((p, i) => `${x(lastIdx + i).toFixed(1)},${y(p.v).toFixed(1)}`)
        .join(" L"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, forecast, yMin, yMax, range]
  );
  const conePath = useMemo(() => {
    const upper = forecast.path.map((p, i) => {
      const band = p.v * 0.0035 * (i + 1);
      return `${x(lastIdx + i + 1).toFixed(1)},${y(p.v + band).toFixed(1)}`;
    });
    const lower = forecast.path
      .map((p, i) => {
        const band = p.v * 0.0035 * (i + 1);
        return `${x(lastIdx + i + 1).toFixed(1)},${y(p.v - band).toFixed(1)}`;
      })
      .reverse();
    return `M${x(lastIdx).toFixed(1)},${y(data[lastIdx].v).toFixed(1)} L${upper.join(" L")} L${lower.join(" L")} Z`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, forecast, yMin, yMax, range]);

  const yTicks = useMemo(() => {
    const n = 5;
    return Array.from({ length: n + 1 }, (_, i) => yMin + ((yMax - yMin) * i) / n);
  }, [yMin, yMax]);

  const xTicks = useMemo(() => {
    const n = 6;
    return Array.from({ length: n }, (_, i) => Math.round((data.length - 1) * (i / (n - 1))));
  }, [data.length]);

  const eventMarkers = useMemo(
    () =>
      events
        .filter((e) => !e.future)
        .map((e) => ({ e, idx: e.day - (DAYS - data.length) }))
        .filter((m) => m.idx >= 0 && m.idx < data.length),
    [events, data.length]
  );

  function onMove(ev: React.MouseEvent) {
    const el = svgRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = ((ev.clientX - r.left) / r.width) * W;
    const idx = Math.round(((px - PL) / iw) * (totalPts - 1));
    if (idx < 0 || idx > totalPts - 1) return setHover(null);
    setHover({ i: idx });
  }

  const hoverPt =
    hover == null
      ? null
      : hover.i <= lastIdx
      ? { p: data[hover.i], fc: false, i: hover.i }
      : { p: forecast.path[hover.i - lastIdx - 1], fc: true, i: hover.i };

  const hoverPrev =
    hoverPt && !hoverPt.fc && hoverPt.i > 0 ? data[hoverPt.i - 1].v : null;

  return (
    <div className="panel brk p-5 sm:p-6">
      <SectionHead
        icon={<IPulse size={16} />}
        kicker="Riwayat + Prakiraan 30 Hari"
        title="Peta Harga BGL"
        right={
          <div className="flex flex-wrap gap-1.5">
            {RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => onRange(r.id)}
                className={`btn-pixel text-[11px] ${range === r.id ? "is-on" : ""}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full cursor-crosshair select-none"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="areafill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3fd6ff" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#3fd6ff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* grid + label Y */}
          {yTicks.map((t, i) => (
            <g key={i}>
              <line x1={PL} x2={W - PR} y1={y(t)} y2={y(t)} stroke="#14405a" strokeOpacity="0.45" strokeDasharray="3 5" />
              <text x={PL - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#7ba4b4" fontFamily="Chakra Petch">
                {(t / 1000).toFixed(1).replace(".", ",")} rb
              </text>
            </g>
          ))}

          {/* label X */}
          {xTicks.map((i, k) => (
            <text key={k} x={x(i)} y={H - 12} textAnchor="middle" fontSize="11" fill="#7ba4b4" fontFamily="Chakra Petch">
              {fmtDate(data[i].t)}
            </text>
          ))}

          {/* zona beli */}
          <rect
            x={PL}
            y={y(buyZone + 400)}
            width={iw}
            height={Math.max(0, y(buyZone - 400) - y(buyZone + 400))}
            fill="rgba(53,230,164,0.06)"
          />
          <line x1={PL} x2={W - PR} y1={y(buyZone)} y2={y(buyZone)} stroke="#35e6a4" strokeOpacity="0.7" strokeDasharray="7 5" />
          <text x={W - PR - 4} y={y(buyZone) - 6} textAnchor="end" fontSize="11" fontWeight="700" fill="#35e6a4" fontFamily="Pixelify Sans">
            ZONA BELI {fmtIDR(buyZone)}
          </text>

          {/* pembatas hari ini */}
          <line x1={x(lastIdx)} x2={x(lastIdx)} y1={PT} y2={H - PB} stroke="#ffb020" strokeOpacity="0.5" strokeDasharray="2 4" />
          <text x={x(lastIdx) + 5} y={PT + 12} fontSize="10" fill="#ffb020" fontFamily="Pixelify Sans" letterSpacing="1">
            HARI INI →
          </text>

          {/* cone prakiraan */}
          <path d={conePath} fill="rgba(63,214,255,0.06)" />

          {/* area + garis riwayat */}
          <path d={areaPath} fill="url(#areafill)" />
          <path key={range} d={linePath} fill="none" stroke="#3fd6ff" strokeWidth="2.2" className="chart-draw" />

          {/* garis prakiraan */}
          <path d={fcPath} fill="none" stroke="#35e6a4" strokeWidth="2" strokeDasharray="6 6" opacity="0.9" />

          {/* titik dasar prakiraan */}
          {(() => {
            const bi = forecast.bottom.day - 1;
            const bp = forecast.path[bi];
            return (
              <g>
                <rect
                  x={x(lastIdx + bi + 1) - 4}
                  y={y(bp.v) - 4}
                  width="8"
                  height="8"
                  transform={`rotate(45 ${x(lastIdx + bi + 1)} ${y(bp.v)})`}
                  fill="#ffb020"
                />
                <text x={x(lastIdx + bi + 1)} y={y(bp.v) + 18} textAnchor="middle" fontSize="10" fill="#ffb020" fontFamily="Pixelify Sans">
                  DASAR? {fmtIDR(bp.v)}
                </text>
              </g>
            );
          })()}

          {/* marker event */}
          {eventMarkers.map(({ e, idx }) => (
            <g key={e.day} opacity="0.95">
              <rect
                x={x(idx) - 3.5}
                y={y(data[idx].v) - 3.5}
                width="7"
                height="7"
                transform={`rotate(45 ${x(idx)} ${y(data[idx].v)})`}
                fill={e.impact === "naik" ? "#35e6a4" : e.impact === "turun" ? "#ff5d6c" : "#7ba4b4"}
              >
                <title>{`${e.date} — ${e.title}`}</title>
              </rect>
            </g>
          ))}

          {/* titik live */}
          <circle cx={x(lastIdx)} cy={y(data[lastIdx].v)} r="4.5" fill="#3fd6ff" />
          <circle cx={x(lastIdx)} cy={y(data[lastIdx].v)} r="9" fill="none" stroke="#3fd6ff" strokeOpacity="0.4" />

          {/* crosshair */}
          {hoverPt && (
            <g>
              <line x1={x(hoverPt.i)} x2={x(hoverPt.i)} y1={PT} y2={H - PB} stroke="#d6eef7" strokeOpacity="0.3" />
              <circle
                cx={x(hoverPt.i)}
                cy={y(hoverPt.p.v)}
                r="4"
                fill={hoverPt.fc ? "#35e6a4" : "#d6eef7"}
                stroke="#04121a"
                strokeWidth="1.5"
              />
            </g>
          )}
        </svg>

        {/* tooltip */}
        {hoverPt && (
          <div
            className="pointer-events-none absolute z-10 border border-line2 bg-deep px-3 py-2 shadow-lg"
            style={{
              left: `${(x(hoverPt.i) / W) * 100}%`,
              top: `${(y(hoverPt.p.v) / H) * 100}%`,
              transform: `translate(${hoverPt.i > totalPts * 0.7 ? "-108%" : "8%"}, -110%)`,
            }}
          >
            <div className="text-[10px] uppercase tracking-widest text-mute">
              {fmtDate(hoverPt.p.t)} {hoverPt.fc && <span className="text-mint">· prakiraan</span>}
            </div>
            <div className="nums font-display text-lg font-bold leading-tight text-fog">{fmtIDR(hoverPt.p.v)}</div>
            {hoverPrev != null && (
              <div className={`nums text-[11px] font-semibold ${hoverPt.p.v >= hoverPrev ? "text-mint" : "text-coral"}`}>
                {fmtPct(((hoverPt.p.v - hoverPrev) / hoverPrev) * 100)} vs hari sebelumnya
              </div>
            )}
          </div>
        )}
      </div>

      {/* legenda */}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] uppercase tracking-wider text-mute">
        <span className="flex items-center gap-2">
          <span className="h-0.5 w-6 bg-gem" /> Riwayat harga
        </span>
        <span className="flex items-center gap-2">
          <span className="h-0 w-6 border-t-2 border-dashed border-mint" /> Prakiraan AI
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rotate-45 bg-amber" /> Dasar perkiraan
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rotate-45 bg-mint" /> Event naik
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rotate-45 bg-coral" /> Event turun
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-6 border border-dashed border-mint bg-mint/5" /> Zona beli
        </span>
      </div>
    </div>
  );
}
