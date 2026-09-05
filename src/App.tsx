import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  analyzeMarket,
  buildAiContext,
  buildEvents,
  buildForecast,
  fmtIDR,
  genHistory,
  storeSnapshots,
} from "./lib/market";
import {
  DEFAULT_AI,
  askMuse,
  fmtClock,
  localMuse,
  pulseLine,
  type AiSettings,
  type LocalCtx,
} from "./lib/ai";
import { LiveDot, Reveal, Sparkles, TickerTape, Toasts, type Toast } from "./components/Bits";
import { IGear, IGemLock, IZap } from "./components/Icons";
import PricePanel from "./components/PricePanel";
import PriceChart from "./components/PriceChart";
import AiPanel, { type AiMsg } from "./components/AiPanel";
import StoreTable from "./components/StoreTable";
import { EventTimeline, ForecastPanel } from "./components/Insights";
import {
  AlertsPanel,
  SettingsModal,
  type AlertDef,
  type LogEntry,
} from "./components/AlertsSettings";

/* ---------- localStorage helpers ---------- */
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
}
function loadArr<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T[];
  } catch {
    return fallback;
  }
}
const save = (key: string, v: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* abaikan */
  }
};

const DEFAULT_ALERTS: AlertDef[] = [
  { id: "a1", label: "Zona beli gw", threshold: 20000, dir: "below", active: true, triggeredAt: null },
];

export default function App() {
  /* ---------- data inti ---------- */
  const [history] = useState(genHistory);
  const [events] = useState(buildEvents);
  const forecast = useMemo(() => buildForecast(history, events), [history, events]);

  const [settings, setSettings] = useState<AiSettings>(() => load("bglr.settings.v1", DEFAULT_AI));
  const [alerts, setAlerts] = useState<AlertDef[]>(() => loadArr("bglr.alerts.v1", DEFAULT_ALERTS));
  const [log, setLog] = useState<LogEntry[]>(() => loadArr("bglr.log.v1", []));
  const buyZone = settings.buyZone || 20000;

  /* ---------- harga live (random walk menuju target model) ---------- */
  const targetRef = useRef(history[history.length - 1].v);
  const [live, setLive] = useState(history[history.length - 1].v);
  const [flash, setFlash] = useState<{ key: number; dir: "up" | "down" | null }>({ key: 0, dir: null });
  const [tick, setTick] = useState(0);
  const [clock, setClock] = useState("");

  /* ---------- UI state ---------- */
  const [range, setRange] = useState<"30" | "90" | "180" | "all">("90");
  const [messages, setMessages] = useState<AiMsg[]>([]);
  const [busy, setBusy] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const idRef = useRef(1);
  const toastId = useRef(1);
  const triggeredRef = useRef<Set<string>>(new Set());
  const pulseIdx = useRef(0);

  const analysis = useMemo(() => analyzeMarket(history, live, buyZone), [history, live, buyZone]);
  const stores = useMemo(() => storeSnapshots(history, live, tick), [history, live, tick]);

  const ctxRef = useRef<LocalCtx>({ history, live, analysis, forecast, events, buyZone });
  ctxRef.current = { history, live, analysis, forecast, events, buyZone };

  /* ---------- helpers ---------- */
  function pushToast(msg: string, kind: Toast["kind"]) {
    const id = toastId.current++;
    setToasts((t) => [...t.slice(-3), { id, msg, kind }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5200);
  }

  function pushMsg(m: Omit<AiMsg, "id" | "time">) {
    setMessages((prev) => [...prev.slice(-24), { ...m, id: idRef.current++, time: fmtClock(Date.now()) }]);
  }

  /* ---------- jam WIB ---------- */
  useEffect(() => {
    const f = () =>
      setClock(
        new Intl.DateTimeFormat("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "Asia/Jakarta",
        }).format(new Date()) + " WIB"
      );
    f();
    const iv = setInterval(f, 1000);
    return () => clearInterval(iv);
  }, []);

  /* ---------- tick harga + alert ---------- */
  useEffect(() => {
    const iv = setInterval(() => {
      setTick((t) => t + 1);
      setLive((prev) => {
        const tgt = targetRef.current;
        const drift = (tgt - prev) * 0.05;
        const noise = (Math.random() - 0.5) * prev * 0.005;
        const next = Math.round((prev + drift + noise) / 10) * 10;
        setFlash((f) => ({ key: f.key + 1, dir: next > prev ? "up" : next < prev ? "down" : null }));
        return next;
      });
      // target drift perlahan ke arah dasar proyeksi model (menuju zona beli)
      targetRef.current += (forecast.bottom.price - targetRef.current) * 0.02;
    }, 4000);
    return () => clearInterval(iv);
  }, [forecast]);

  useEffect(() => {
    if (messages.length === 0) return; // tunggu inisialisasi
    setAlerts((prev) => {
      let changed = false;
      const next = prev.map((a) => {
        if (!a.active) return a;
        const hit = a.dir === "below" ? live <= a.threshold : live >= a.threshold;
        if (hit && !triggeredRef.current.has(a.id)) {
          triggeredRef.current.add(a.id);
          changed = true;
          const msg = `Alert "${a.label}" tersentuh! BGL di ${fmtIDR(live)} (${a.dir === "below" ? "≤" : "≥"} ${fmtIDR(a.threshold)})`;
          setLog((l) => [{ id: Date.now(), time: fmtClock(Date.now()), msg }, ...l].slice(0, 40));
          pushToast(
            a.dir === "below"
              ? `SINYAL BELI: BGL menyentuh ${fmtIDR(live)} — zona "${a.label}" aktif!`
              : `Alert naik: BGL di ${fmtIDR(live)} melewati ${fmtIDR(a.threshold)}.`,
            a.dir === "below" ? "buy" : "warn"
          );
          return { ...a, triggeredAt: Date.now() };
        }
        if (!hit && triggeredRef.current.has(a.id)) {
          const cleared = a.dir === "below" ? live > a.threshold * 1.015 : live < a.threshold * 0.985;
          if (cleared) {
            triggeredRef.current.delete(a.id);
            changed = true;
            return { ...a, triggeredAt: null };
          }
        }
        return a;
      });
      return changed ? next : prev;
    });
  }, [live, messages.length]);

  /* ---------- sambutan analis ---------- */
  useEffect(() => {
    const c = ctxRef.current;
    const a = c.analysis;
    pushMsg({ role: "sys", text: "RADAR AKTIF · PEMANTAUAN BGL DIMULAI" });
    pushMsg({
      role: "ai",
      tag: "MESIN LOKAL",
      streaming: true,
      text: `Halo, gw MUSE-SPARK — analis BGL region Indonesia. Posisi sekarang ${fmtIDR(
        c.live
      )} (${a.chg24 >= 0 ? "+" : ""}${a.chg24.toFixed(1).replace(".", ",")}% / 24 jam), tren ${a.trendLabel.toLowerCase()}.
◆ Zona beli lo di ${fmtIDR(buyZone)} — jarak ${a.buyZoneDistPct.toFixed(1).replace(".", ",")}%. Alert otomatis gw pasang di sana.
◆ Proyeksi model: prob turun ${c.forecast.probDown}% / naik ${c.forecast.probUp}%, dasar perkiraan hari ke-${c.forecast.bottom.day} di ${fmtIDR(c.forecast.bottom.price)}.
◆ Event musim dingin ~8 hari lagi berpotensi nambah suplai.
AKSI: disiplin tunggu zona, atau tanya gw apa aja — prediksi, penyebab, sampai toko termurah.`,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- auto-analisis berkelanjutan ---------- */
  useEffect(() => {
    if (!settings.autoAnalyze) return;
    const iv = setInterval(async () => {
      if (document.hidden || busy) return;
      const c = ctxRef.current;
      if (settings.apiKey) {
        try {
          const ctx = buildAiContext(c.history, c.live, c.analysis, c.forecast, c.events, c.buyZone);
          const r = await askMuse(settings, ctx, "Beri pulse update pasar 2-3 kalimat singkat dengan angka terbaru.", 140);
          pushMsg({ role: "ai", tag: "ZEN · AUTO", streaming: true, text: r });
          return;
        } catch {
          /* jatuh ke lokal */
        }
      }
      pushMsg({ role: "ai", tag: "AUTO", streaming: true, text: pulseLine(c, pulseIdx.current++) });
    }, settings.intervalSec * 1000);
    return () => clearInterval(iv);
  }, [settings, busy]);

  /* ---------- tanya AI ---------- */
  async function onAsk(q: string) {
    pushMsg({ role: "user", text: q });
    setBusy(true);
    const c = ctxRef.current;
    if (settings.apiKey) {
      try {
        const ctx = buildAiContext(c.history, c.live, c.analysis, c.forecast, c.events, c.buyZone);
        const r = await askMuse(settings, ctx, q);
        pushMsg({ role: "ai", tag: "ZEN API", streaming: true, text: r });
      } catch (e) {
        pushToast(`Zen API gagal (${e instanceof Error ? e.message.slice(0, 60) : "error"}) — pakai mesin lokal.`, "warn");
        pushMsg({ role: "ai", tag: "FALLBACK LOKAL", streaming: true, text: localMuse(q, c) });
      }
    } else {
      await new Promise((r) => setTimeout(r, 900));
      pushMsg({ role: "ai", tag: "MESIN LOKAL", streaming: true, text: localMuse(q, c) });
    }
    setBusy(false);
  }

  /* ---------- simpan pengaturan ---------- */
  function onSaveSettings(s: AiSettings) {
    setSettings(s);
    save("bglr.settings.v1", s);
    pushToast("Pengaturan radar disimpan.", "ok");
    if (s.apiKey && s.apiKey !== settings.apiKey) {
      setBusy(true);
      const c = ctxRef.current;
      const ctx = buildAiContext(c.history, c.live, c.analysis, c.forecast, c.events, s.buyZone);
      askMuse(s, ctx, "API key baru terpasang. Beri ringkasan pembuka 3 kalimat untuk trader BGL Indonesia.")
        .then((r) => pushMsg({ role: "ai", tag: "ZEN API", streaming: true, text: r }))
        .catch(() => pushToast("Key tersimpan, tapi uji panggil pertama gagal — cek kembali key/model.", "warn"))
        .finally(() => setBusy(false));
    }
  }

  /* ---------- CRUD alert ---------- */
  const persistAlerts = (list: AlertDef[]) => {
    setAlerts(list);
    save("bglr.alerts.v1", list);
  };
  useEffect(() => save("bglr.log.v1", log), [log]);

  const hasKey = Boolean(settings.apiKey);

  return (
    <div className="min-h-screen">
      <Sparkles />

      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 border-b border-line bg-ink/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="floaty flex h-10 w-10 items-center justify-center border border-gem/60 bg-gem/10 text-gem">
              <IGemLock size={22} />
            </span>
            <div>
              <div className="font-display text-xl font-bold uppercase leading-none tracking-wide text-fog">
                BGL Radar <span className="glow-gem text-gem">ID</span>
              </div>
              <div className="mt-0.5 hidden text-[9px] font-semibold uppercase tracking-[0.3em] text-mute min-[420px]:block">
                Blue Gem Lock · Growtopia · Indonesia
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <span className="nums hidden text-xs font-semibold tracking-wider text-mute md:block">{clock}</span>
            <span className="hidden items-center gap-2 border border-mint/40 bg-mint/5 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-mint sm:flex">
              <LiveDot /> Live
            </span>
            <button
              onClick={() => setSettingsOpen(true)}
              className={`flex items-center gap-1.5 border px-2 py-1 text-[10px] font-bold uppercase tracking-widest transition-all hover:-translate-y-0.5 ${
                hasKey ? "border-gem/50 bg-gem/5 text-gem" : "border-amber/50 bg-amber/5 text-amber"
              }`}
              title="Status analis AI"
            >
              <IZap size={11} />
              <span className="hidden sm:inline">{hasKey ? "Muse-Spark · Zen" : "Mode Lokal"}</span>
            </button>
            <button onClick={() => setSettingsOpen(true)} className="btn-pixel hidden text-[10px] sm:block">
              <IGear size={13} />
            </button>
          </div>
        </div>
      </header>

      {/* ================= TICKER ================= */}
      <TickerTape snaps={stores} live={live} />

      <main className="mx-auto max-w-7xl px-4 pb-16">
        {/* baris 1: harga + analis */}
        <section className="mt-6 grid gap-5 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Reveal>
              <PricePanel
                live={live}
                flashKey={flash.key}
                flashDir={flash.dir}
                analysis={analysis}
                buyZone={buyZone}
                spark={history.slice(-30)}
              />
            </Reveal>
          </div>
          <div className="lg:col-span-2">
            <Reveal delay={120} className="h-full">
              <AiPanel
                messages={messages}
                busy={busy}
                hasKey={hasKey}
                model={settings.model}
                onAsk={onAsk}
                onOpenSettings={() => setSettingsOpen(true)}
              />
            </Reveal>
          </div>
        </section>

        {/* baris 2: chart */}
        <section className="mt-8">
          <Reveal>
            <PriceChart
              history={history}
              forecast={forecast}
              events={events}
              buyZone={buyZone}
              range={range}
              onRange={setRange}
            />
          </Reveal>
        </section>

        {/* baris 3: toko + alert */}
        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <Reveal>
            <StoreTable snaps={stores} live={live} />
          </Reveal>
          <Reveal delay={120}>
            <AlertsPanel
              alerts={alerts}
              log={log}
              onAdd={(a) => {
                persistAlerts([...alerts, { ...a, id: `a${Date.now()}` , triggeredAt: null }]);
                pushToast(`Alert "${a.label}" dipasang di ${fmtIDR(a.threshold)}.`, "info");
              }}
              onToggle={(id) =>
                persistAlerts(alerts.map((x) => (x.id === id ? { ...x, active: !x.active, triggeredAt: null } : x)))
              }
              onDelete={(id) => {
                persistAlerts(alerts.filter((x) => x.id !== id));
                triggeredRef.current.delete(id);
              }}
            />
          </Reveal>
        </section>

        {/* baris 4: prediksi + penyebab */}
        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <Reveal>
            <ForecastPanel forecast={forecast} live={live} />
          </Reveal>
          <Reveal delay={120}>
            <EventTimeline events={events} />
          </Reveal>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-line bg-deep/60">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-md">
              <div className="flex items-center gap-2 font-display text-lg font-bold uppercase text-fog">
                <IGemLock size={18} className="text-gem" /> BGL Radar <span className="text-gem">ID</span>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-mute">
                Radar harga Blue Gem Lock untuk player Growtopia Indonesia. Agregasi pemantauan: Tokopedia,
                Codashop, Itemku, Shopee, LapakGaming, G2G. Analisis penyebab & prediksi oleh model MUSE-SPARK 1.3
                via OpenCode Zen (gratis) dengan fallback mesin lokal.
              </p>
            </div>
            <div className="text-[11px] uppercase tracking-widest text-mute">
              <div className="mb-2 font-semibold text-fog">Sumber pantauan</div>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-1 normal-case tracking-normal">
                <li>Tokopedia</li>
                <li>Codashop</li>
                <li>Itemku</li>
                <li>Shopee</li>
                <li>LapakGaming</li>
                <li>G2G</li>
              </ul>
            </div>
            <div className="max-w-xs text-[11px] leading-relaxed text-mute">
              <span className="font-semibold text-amber">Disclaimer:</span> bukan saran finansial. Feed harga mode
              demo menyimulasikan pola pasar nyata untuk keperluan radar; verifikasi selalu di marketplace sebelum
              transaksi. DYOR & main aman.
            </div>
          </div>
          <div className="mt-6 border-t border-line pt-4 text-center text-[10px] uppercase tracking-[0.3em] text-mute">
            240 hari riwayat terlacak · alert zona 20K siaga · dibuat untuk komunitas GT Indonesia
          </div>
        </div>
      </footer>

      <Toasts list={toasts} onClose={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
      <SettingsModal open={settingsOpen} settings={settings} onClose={() => setSettingsOpen(false)} onSave={onSaveSettings} />
    </div>
  );
}
