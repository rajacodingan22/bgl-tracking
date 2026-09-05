import React from "react";
import type { Forecast, MarketEvent } from "../lib/market";
import { fmtIDR, fmtPct } from "../lib/market";
import { SectionHead } from "./Bits";
import { IFlame, IUp, IDown, IRadar, IClock } from "./Icons";

/* ================= TIMELINE PENYEBAB ================= */
export function EventTimeline({ events }: { events: MarketEvent[] }) {
  return (
    <div className="panel brk-amber brk h-full p-5 sm:p-6">
      <SectionHead
        icon={<IFlame size={16} />}
        kicker="Kenapa Harga Naik / Turun"
        title="Timeline Penyebab"
        right={
          <div className="flex gap-3 text-[10px] uppercase tracking-widest text-mute">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rotate-45 bg-mint" /> naik</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rotate-45 bg-coral" /> turun</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rotate-45 bg-mute" /> netral</span>
          </div>
        }
      />

      <div className="relative ml-2 border-l-2 border-line pl-5">
        {events.map((e, i) => {
          const color =
            e.impact === "naik" ? "var(--color-mint)" : e.impact === "turun" ? "var(--color-coral)" : "var(--color-mute)";
          return (
            <div key={i} className={`group relative pb-5 last:pb-0 ${e.future ? "opacity-90" : ""}`}>
              <span
                className="absolute -left-[27px] top-1 h-3 w-3 rotate-45 border-2 transition-transform group-hover:scale-125"
                style={{ borderColor: color, background: e.future ? "transparent" : color }}
              />
              <div
                className={`border p-3 transition-all group-hover:-translate-y-0.5 group-hover:border-line2 ${
                  e.future ? "border-dashed border-line bg-transparent" : "border-line bg-deep/50"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-mute">
                    <IClock size={10} />
                    {e.date}
                  </span>
                  {e.future && (
                    <span className="border border-amber/50 bg-amber/10 px-1.5 py-px text-[9px] font-bold uppercase tracking-widest text-amber">
                      Akan datang
                    </span>
                  )}
                  <span
                    className="ml-auto flex items-center gap-1 px-1.5 py-px text-[10px] font-bold uppercase tracking-widest"
                    style={{ color, background: `color-mix(in srgb, ${color} 12%, transparent)` }}
                  >
                    {e.impact === "naik" ? <IUp size={10} /> : e.impact === "turun" ? <IDown size={10} /> : null}
                    {e.impact}
                    {e.mag > 0 && <span className="nums">~{fmtPct(e.mag, false)}</span>}
                  </span>
                </div>
                <h3 className="mt-1.5 font-display text-base font-semibold uppercase leading-snug text-fog">
                  {e.title}
                </h3>
                <p className="mt-1 text-[12.5px] leading-relaxed text-mute">{e.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================= PANEL PREDIKSI ================= */
export function ForecastPanel({ forecast: f, live }: { forecast: Forecast; live: number }) {
  const downLead = f.probDown >= f.probUp;
  return (
    <div className="panel brk h-full p-5 sm:p-6">
      <SectionHead
        icon={<IRadar size={16} />}
        kicker="Prediksi Naik / Turun"
        title="Proyeksi Model"
        right={
          <span className="border border-line bg-deep px-2 py-1 text-[10px] uppercase tracking-widest text-mute">
            konfidensi <span className="nums text-gem">{f.confidence}%</span>
          </span>
        }
      />

      {/* meteran tarik-tambang */}
      <div className="border border-line bg-deep/60 p-4">
        <div className="mb-2 flex items-end justify-between">
          <div>
            <div className="font-display text-2xl font-bold leading-none" style={{ color: downLead ? "var(--color-coral)" : "var(--color-mint)" }}>
              {downLead ? "TURUN" : "NAIK"} {Math.max(f.probDown, f.probUp)}%
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-widest text-mute">arah dominan 30 hari</div>
          </div>
          <div className="text-right text-[11px] uppercase tracking-widest text-mute">
            dasar perkiraan
            <div className="nums font-display text-lg font-bold leading-tight text-amber">
              {fmtIDR(f.bottom.price)}
            </div>
            hari ke-{f.bottom.day}
          </div>
        </div>
        <div className="relative flex h-4 w-full overflow-hidden border border-line">
          <div
            className="h-full transition-all duration-1000"
            style={{ width: `${f.probDown}%`, background: "linear-gradient(90deg, rgba(255,93,108,0.85), rgba(255,93,108,0.45))" }}
          />
          <div
            className="h-full transition-all duration-1000"
            style={{ width: `${f.probUp}%`, background: "linear-gradient(90deg, rgba(53,230,164,0.45), rgba(53,230,164,0.85))" }}
          />
          <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-fog/80" />
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] font-bold uppercase tracking-widest">
          <span className="text-coral">Turun {f.probDown}%</span>
          <span className="text-mint">Naik {f.probUp}%</span>
        </div>
      </div>

      {/* target */}
      <div className="mt-4 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
        {f.targets.map((t) => (
          <div key={t.d} className="group bg-panel p-3 transition-colors hover:bg-panel2">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-mute">
              +{t.d} hari
              {t.dir === "naik" ? <IUp size={11} className="text-mint" /> : <IDown size={11} className="text-coral" />}
            </div>
            <div className="nums mt-1 font-display text-[15px] font-bold leading-tight text-fog">{fmtIDR(t.price)}</div>
            <div className="mt-1.5 h-1 w-full bg-deep">
              <div
                className="h-full transition-all duration-700"
                style={{
                  width: `${t.prob}%`,
                  background: t.dir === "naik" ? "var(--color-mint)" : "var(--color-coral)",
                }}
              />
            </div>
            <div className="nums mt-1 text-[10px] text-mute">prob {t.prob}%</div>
          </div>
        ))}
      </div>

      <p className="mt-4 border-l-2 border-amber/60 bg-amber/5 py-2 pl-3 text-[13px] leading-relaxed text-fog/85">
        {f.summary}
      </p>

      <p className="mt-3 text-[11px] text-mute">
        Posisi sekarang <span className="nums font-semibold text-gem">{fmtIDR(live)}</span> · model diperbarui
        otomatis tiap siklus scan & bisa ditanya lebih lanjut ke Muse-Spark di panel analis.
      </p>
    </div>
  );
}
