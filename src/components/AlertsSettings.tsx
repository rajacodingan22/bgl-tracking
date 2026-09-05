import React, { useState } from "react";
import type { AiSettings } from "../lib/ai";
import { askMuse } from "../lib/ai";
import { fmtIDR } from "../lib/market";
import { SectionHead } from "./Bits";
import { IBell, IPlus, ITrash, IX, ICheck, IGear } from "./Icons";

export interface AlertDef {
  id: string;
  label: string;
  threshold: number;
  dir: "below" | "above";
  active: boolean;
  triggeredAt: number | null;
}

export interface LogEntry {
  id: number;
  time: string;
  msg: string;
}

/* ================= PANEL ALERT ================= */
export function AlertsPanel({
  alerts,
  log,
  onAdd,
  onToggle,
  onDelete,
}: {
  alerts: AlertDef[];
  log: LogEntry[];
  onAdd: (a: Omit<AlertDef, "id" | "triggeredAt">) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [label, setLabel] = useState("Zona beli cadangan");
  const [threshold, setThreshold] = useState("19000");
  const [dir, setDir] = useState<"below" | "above">("below");

  function add(e: React.FormEvent) {
    e.preventDefault();
    const t = parseInt(threshold.replace(/\D/g, ""));
    if (!t || t < 1000) return;
    onAdd({ label: label.trim() || "Alert custom", threshold: t, dir, active: true });
  }

  return (
    <div className="panel brk h-full p-5 sm:p-6">
      <SectionHead icon={<IBell size={16} />} kicker="Notifikasi Harga" title="Alert & Log" />

      {/* form */}
      <form onSubmit={add} className="grid grid-cols-2 gap-2 sm:grid-cols-[1.2fr_0.8fr_0.7fr_auto]">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Nama alert"
          className="col-span-2 border border-line bg-deep px-3 py-2 text-[13px] text-fog placeholder:text-mute/60 sm:col-span-1"
        />
        <input
          value={threshold}
          onChange={(e) => setThreshold(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          placeholder="20000"
          className="nums border border-line bg-deep px-3 py-2 text-[13px] text-fog"
        />
        <select
          value={dir}
          onChange={(e) => setDir(e.target.value as "below" | "above")}
          className="border border-line bg-deep px-2 py-2 text-[13px] text-fog"
        >
          <option value="below">≤ saat turun ke</option>
          <option value="above">≥ saat naik ke</option>
        </select>
        <button type="submit" className="btn-pixel text-[11px]">
          <IPlus size={12} className="mr-1 inline" /> Pasang
        </button>
      </form>

      {/* daftar */}
      <div className="mt-4 space-y-2">
        {alerts.map((a) => (
          <div
            key={a.id}
            className={`flex items-center gap-3 border px-3 py-2.5 transition-all hover:-translate-y-0.5 ${
              a.triggeredAt ? "border-mint/60 bg-mint/5" : "border-line bg-deep/50"
            } ${!a.active ? "opacity-50" : ""}`}
          >
            <IBell size={15} className={a.triggeredAt ? "text-mint" : "text-amber"} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-sm font-semibold uppercase text-fog">{a.label}</div>
              <div className="nums text-[11px] text-mute">
                {a.dir === "below" ? "turun ke ≤" : "naik ke ≥"} {fmtIDR(a.threshold)}
              </div>
            </div>
            <span
              className={`border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                a.triggeredAt ? "border-mint/60 bg-mint/10 text-mint" : "border-amber/50 bg-amber/10 text-amber"
              }`}
            >
              {a.triggeredAt
                ? "Tersentuh " +
                  new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(a.triggeredAt)
                : a.active
                ? "Siaga"
                : "Nonaktif"}
            </span>
            <button
              onClick={() => onToggle(a.id)}
              className={`flex h-5 w-9 items-center border px-0.5 transition-colors ${
                a.active ? "justify-end border-mint/60 bg-mint/15" : "justify-start border-line bg-deep"
              }`}
              title={a.active ? "Nonaktifkan" : "Aktifkan"}
            >
              <span className={`h-3 w-3 ${a.active ? "bg-mint" : "bg-mute"}`} />
            </button>
            <button onClick={() => onDelete(a.id)} className="text-mute transition-colors hover:text-coral" title="Hapus alert">
              <ITrash size={14} />
            </button>
          </div>
        ))}
        {alerts.length === 0 && (
          <p className="border border-dashed border-line p-4 text-center text-[12px] text-mute">
            Belum ada alert. Pasang alert di zona beli kamu supaya tidak kelewat momen.
          </p>
        )}
      </div>

      {/* log */}
      <div className="mt-5">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-mute">Log pemicu</div>
        <div className="scroll-slim max-h-36 space-y-1.5 overflow-y-auto border border-line bg-deep/50 p-3">
          {log.length === 0 && (
            <p className="text-[12px] text-mute">Belum ada alert yang tersentuh. Radar terus memantau tiap tick harga.</p>
          )}
          {log.map((l) => (
            <div key={l.id} className="flex gap-2 text-[12px] leading-snug">
              <span className="nums shrink-0 text-gem">{l.time}</span>
              <span className="text-fog/85">{l.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================= MODAL PENGATURAN ================= */
export function SettingsModal({
  open,
  settings,
  onClose,
  onSave,
}: {
  open: boolean;
  settings: AiSettings;
  onClose: () => void;
  onSave: (s: AiSettings) => void;
}) {
  const [draft, setDraft] = useState<AiSettings>(settings);
  const [testState, setTestState] = useState<"idle" | "busy" | "ok" | "fail">("idle");
  const [testMsg, setTestMsg] = useState("");

  React.useEffect(() => {
    setDraft(settings);
    setTestState("idle");
    setTestMsg("");
  }, [settings, open]);

  if (!open) return null;

  async function test() {
    setTestState("busy");
    try {
      const r = await askMuse(draft, "Konteks: uji koneksi.", "Jawab dengan satu kata: SIAP.", 20);
      setTestState("ok");
      setTestMsg(`Terhubung. Respons: "${r.slice(0, 60)}"`);
    } catch (e: unknown) {
      setTestState("fail");
      setTestMsg(e instanceof Error ? e.message : "Gagal terhubung");
    }
  }

  const field =
    "w-full border border-line bg-deep px-3 py-2 text-[13px] text-fog placeholder:text-mute/50";
  const lbl = "mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-mute";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/80 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div className="panel brk w-full max-w-lg p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-display text-xl font-bold uppercase text-fog">
            <IGear size={18} className="text-gem" /> Pengaturan Radar
          </h3>
          <button onClick={onClose} className="text-mute transition-colors hover:text-coral" aria-label="Tutup">
            <IX size={14} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className={lbl}>API Key OpenCode Zen (gratis di opencode.ai/zen)</label>
            <input
              type="password"
              value={draft.apiKey}
              onChange={(e) => setDraft({ ...draft, apiKey: e.target.value.trim() })}
              placeholder="sk-zen-…"
              className={field}
            />
            <p className="mt-1 text-[11px] text-mute">
              Tanpa key, analis berjalan di <span className="text-amber">mode lokal</span> (tetap lengkap, tanpa LLM).
              Key disimpan hanya di browser kamu.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={lbl}>Base URL</label>
              <input
                value={draft.baseUrl}
                onChange={(e) => setDraft({ ...draft, baseUrl: e.target.value.trim() })}
                className={field}
              />
            </div>
            <div>
              <label className={lbl}>Model</label>
              <input
                value={draft.model}
                onChange={(e) => setDraft({ ...draft, model: e.target.value.trim() })}
                className={field}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={lbl}>Zona beli (Rp)</label>
              <input
                value={String(draft.buyZone)}
                onChange={(e) => setDraft({ ...draft, buyZone: parseInt(e.target.value.replace(/\D/g, "") || "0") })}
                inputMode="numeric"
                className={`${field} nums`}
              />
            </div>
            <div>
              <label className={lbl}>Interval analisis otomatis</label>
              <select
                value={draft.intervalSec}
                onChange={(e) => setDraft({ ...draft, intervalSec: parseInt(e.target.value) })}
                className={field}
              >
                <option value={90}>Tiap 90 detik</option>
                <option value={180}>Tiap 3 menit</option>
                <option value={300}>Tiap 5 menit</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => setDraft({ ...draft, autoAnalyze: !draft.autoAnalyze })}
            className="flex w-full items-center justify-between border border-line bg-deep px-3 py-2.5"
          >
            <span className="text-[13px] text-fog">Analisis otomatis berkelanjutan (pulse AI)</span>
            <span
              className={`flex h-5 w-9 items-center border px-0.5 transition-colors ${
                draft.autoAnalyze ? "justify-end border-mint/60 bg-mint/15" : "justify-start border-line bg-panel"
              }`}
            >
              <span className={`h-3 w-3 ${draft.autoAnalyze ? "bg-mint" : "bg-mute"}`} />
            </span>
          </button>

          <div className="flex items-center gap-2 text-[12px]">
            {testState === "busy" && <span className="text-mute">Menguji koneksi…</span>}
            {testState === "ok" && (
              <span className="flex items-center gap-1.5 text-mint">
                <ICheck size={12} /> {testMsg}
              </span>
            )}
            {testState === "fail" && <span className="text-coral">{testMsg}</span>}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button onClick={test} disabled={testState === "busy" || !draft.apiKey} className="btn-pixel text-[11px] disabled:opacity-40">
              Uji koneksi
            </button>
            <button
              onClick={() => {
                onSave(draft);
                onClose();
              }}
              className="btn-pixel is-on text-[11px]"
            >
              Simpan pengaturan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
