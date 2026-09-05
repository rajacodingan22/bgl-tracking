import React, { useMemo } from "react";
import type { StoreSnap } from "../lib/market";
import { fmtIDR, fmtPct } from "../lib/market";
import { SectionHead } from "./Bits";
import { ICart, ILinkOut } from "./Icons";

function MiniSpark({ series, hue }: { series: number[]; hue: string }) {
  const d = useMemo(() => {
    const w = 84;
    const h = 22;
    const min = Math.min(...series);
    const max = Math.max(...series);
    const rng = Math.max(1, max - min);
    return (
      "M" +
      series
        .map((v, i) => `${((i / (series.length - 1)) * w).toFixed(1)},${(h - 2 - ((v - min) / rng) * (h - 4)).toFixed(1)}`)
        .join(" L")
    );
  }, [series]);
  return (
    <svg viewBox="0 0 84 22" className="h-5 w-[84px]" preserveAspectRatio="none">
      <path d={d} fill="none" stroke={hue} strokeWidth="1.4" />
    </svg>
  );
}

const stockStyle: Record<StoreSnap["stock"], { label: string; cls: string }> = {
  ADA: { label: "STOK ADA", cls: "bg-mint/10 text-mint border-mint/40" },
  MENIPIS: { label: "MENIPIS", cls: "bg-amber/10 text-amber border-amber/40" },
  RESTOCK: { label: "RESTOCK", cls: "bg-coral/10 text-coral border-coral/40" },
};

export default function StoreTable({ snaps, live }: { snaps: StoreSnap[]; live: number }) {
  const cheapest = useMemo(() => snaps.reduce((a, b) => (b.price < a.price ? b : a)), [snaps]);

  return (
    <div className="panel brk p-5 sm:p-6">
      <SectionHead
        icon={<ICart size={16} />}
        kicker="Pemantauan 6 Marketplace"
        title="Harga per Toko"
        right={
          <span className="border border-line bg-deep px-2 py-1 text-[10px] uppercase tracking-widest text-mute">
            diperbarui tiap siklus scan
          </span>
        }
      />

      <div className="scroll-slim overflow-x-auto">
        <div className="min-w-[640px]">
          {/* header */}
          <div className="grid grid-cols-[1.4fr_1fr_0.7fr_0.9fr_0.8fr_0.7fr_0.5fr] gap-2 border-b border-line pb-2 text-[10px] font-semibold uppercase tracking-widest text-mute">
            <span>Marketplace</span>
            <span className="text-right">Harga / BGL</span>
            <span className="text-right">Δ Rata²</span>
            <span>30 Hari</span>
            <span>Stok</span>
            <span>Update</span>
            <span />
          </div>

          {snaps.map((s) => {
            const isCheap = s.def.id === cheapest.def.id;
            return (
              <div
                key={s.def.id}
                className="group grid grid-cols-[1.4fr_1fr_0.7fr_0.9fr_0.8fr_0.7fr_0.5fr] items-center gap-2 border-b border-line/60 py-3 transition-all hover:translate-x-1 hover:bg-panel2/60"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center border font-display text-sm font-bold"
                    style={{ borderColor: s.def.hue, color: s.def.hue, background: `${s.def.hue}14` }}
                  >
                    {s.def.name.slice(0, 1)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 font-display text-sm font-semibold uppercase leading-none text-fog">
                      {s.def.name}
                      {isCheap && (
                        <span className="border border-mint/50 bg-mint/10 px-1 py-px text-[8px] tracking-widest text-mint">
                          TERMURAH
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 truncate text-[10px] text-mute">{s.def.tag}</div>
                  </div>
                </div>

                <div className="nums text-right font-display text-base font-bold text-fog">
                  {fmtIDR(s.price)}
                </div>

                <div
                  className={`nums text-right text-xs font-bold ${
                    s.deltaPct <= 0 ? "text-mint" : "text-amber"
                  }`}
                >
                  {fmtPct(s.deltaPct)}
                </div>

                <MiniSpark series={s.series} hue={s.def.hue} />

                <div>
                  <span className={`border px-1.5 py-0.5 text-[9px] font-bold tracking-widest ${stockStyle[s.stock].cls}`}>
                    {stockStyle[s.stock].label}
                  </span>
                </div>

                <div className="text-[11px] text-mute">{s.updatedMin} mnt lalu</div>

                <a
                  href={s.def.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-7 w-7 items-center justify-center border border-line text-mute transition-all hover:border-gem hover:text-gem"
                  title={`Buka ${s.def.name}`}
                >
                  <ILinkOut size={13} />
                </a>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-mute">
        Rata-rata pasar: <span className="nums font-semibold text-gem">{fmtIDR(live)}</span>. Codashop cenderung
        premium demi proses instan; G2G/Itemku biasanya di bawah pasar (model P2P — cek reputasi seller). Selisih
        antar-toko adalah peluang, tapi selalu hitung fee & biaya admin.
      </p>
    </div>
  );
}
