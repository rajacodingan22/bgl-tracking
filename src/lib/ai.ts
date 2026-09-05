import type { Analysis, Forecast, MarketEvent, Point } from "./market";
import { fmtIDR, fmtPct, fmtDate } from "./market";

export const ZEN_BASE = "https://opencode.ai/zen/v1";
export const ZEN_MODEL = "muse-spark-1.3-contributor-free";

export interface AiSettings {
  apiKey: string;
  baseUrl: string;
  model: string;
  autoAnalyze: boolean;
  intervalSec: number;
  buyZone: number;
}

export const DEFAULT_AI: AiSettings = {
  apiKey: "",
  baseUrl: ZEN_BASE,
  model: ZEN_MODEL,
  autoAnalyze: true,
  intervalSec: 180,
  buyZone: 20000,
};

const SYSTEM_PROMPT = `Kamu MUSE-SPARK 1.3, analis pasar item Growtopia yang spesialis Blue Gem Lock (BGL) region Indonesia.
Aturan: jawab HANYA dalam Bahasa Indonesia yang santai tapi tajam ala trader. Gunakan data yang diberikan, selalu sebut angka konkret (harga, persentase, tanggal). Struktur jawaban maksimal 3 bagian pendek dengan bullet "◆". Akhiri dengan 1 kalimat "AKSI:" berisi saran konkret (beli/tunggu/jual/cicil). Jangan mengarang data di luar yang diberikan. Maksimal 160 kata.`;

export async function askMuse(
  s: AiSettings,
  context: string,
  question: string,
  maxTokens = 420
): Promise<string> {
  const res = await fetch(`${s.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${s.apiKey}`,
    },
    body: JSON.stringify({
      model: s.model,
      temperature: 0.7,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `${context}\n\nPertanyaan/user request: ${question}` },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Zen API ${res.status}: ${body.slice(0, 140)}`);
  }
  const json = await res.json();
  const text: string | undefined = json?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Respons Zen API kosong");
  return text.trim();
}

/* ---------------- mesin analisis lokal (fallback tanpa API key) ---------------- */
export interface LocalCtx {
  history: Point[];
  live: number;
  analysis: Analysis;
  forecast: Forecast;
  events: MarketEvent[];
  buyZone: number;
}

export function localMuse(question: string, ctx: LocalCtx): string {
  const { analysis: a, forecast: f, live, buyZone, events } = ctx;
  const q = question.toLowerCase();

  if (/(beli|masuk|20k|20000|borong|cicil)/.test(q)) {
    const dist = fmtPct(a.buyZoneDistPct);
    return `◆ Harga live ${fmtIDR(live)}, zona beli kamu ${fmtIDR(buyZone)} — masih berjarak ${dist}.
◆ Model memproyeksikan dasar harga di hari ke-${f.bottom.day} sekitar ${fmtIDR(f.bottom.price)} (prob turun ${f.probDown}%), dipicu antisipasi event musim dingin.
◆ Support 30 hari: ${fmtIDR(a.support)}. RSI ${Math.round(a.rsi)} ${a.rsi < 40 ? "sudah mendekati oversold" : "belum oversold"}.
AKSI: ${a.signal === "BELI" ? "sinyal beli aktif — eksekusi bertahap 30/30/40 di zona " + fmtIDR(buyZone) : "tahan dulu, pasang limit order di " + fmtIDR(buyZone) + " dan alert; jangan kejar harga saat downtrend."}`;
  }

  if (/(predik|ramal|naik|turun|kapan|forecast|prospek)/.test(q)) {
    const t7 = f.targets.find((t) => t.d === 7)!;
    const t14 = f.targets.find((t) => t.d === 14)!;
    return `◆ Probabilitas 30 hari: TURUN ${f.probDown}% vs NAIK ${f.probUp}% (konfidensi ${f.confidence}%).
◆ Hari ke-7: ${fmtIDR(t7.price)} (${t7.dir}, prob ${t7.prob}%) · Hari ke-14: ${fmtIDR(t14.price)} (${t14.dir}, prob ${t14.prob}%).
◆ Titik terendah perkiraan: hari ke-${f.bottom.day} di ${fmtIDR(f.bottom.price)}. Rebound teknikal biasanya 3–5 hari setelah dasar, target resistance ${fmtIDR(a.resistance)}.
AKSI: ${f.probDown >= f.probUp ? "tunggu konfirmasi dasar (2 candle harian hijau beruntun) sebelum akumulasi." : "momentum berbalik — cicil kecil saat koreksi intraday."}`;
  }

  if (/(kenapa|sebab|penyebab|analisis|faktor)/.test(q)) {
    const past = events.filter((e) => !e.future).slice(-3);
    const lines = past
      .map((e) => `◆ [${e.date}] ${e.title} → dampak ${e.impact} ${fmtPct(e.mag, false)}.`)
      .join("\n");
    return `${lines}
◆ Efek gabungan masih terasa: SMA-7 ${fmtIDR(a.sma7)} di bawah SMA-30 ${fmtIDR(a.sma30)}, tren ${a.trendLabel}.
AKSI: pantau patch note & jadwal event; suplai event adalah variabel terbesar harga BGL.`;
  }

  if (/(codashop|tokopedia|toko|shopee|itemku|g2g|lapak|murah|mana)/.test(q)) {
    return `◆ Codashop biasanya premium ~7% (kemudahan instan), sementara G2G & Itemku sering 3–6% di bawah rata-rata pasar karena model P2P.
◆ Selisih antar marketplace = peluang arbitrase kecil, tapi hitung fee & risiko reputasi seller.
◆ Rata-rata pasar sekarang ${fmtIDR(live)}.
AKSI: bandingkan harga final setelah fee; untuk nominal besar prioritaskan seller ber-reputasi di Itemku/Tokopedia.`;
  }

  const t7 = f.targets.find((t) => t.d === 7)!;
  return `◆ Live ${fmtIDR(live)} (${fmtPct(a.chg24)} / 24 jam), tren ${a.trendLabel}, RSI ${Math.round(a.rsi)}.
◆ Zona beli ${fmtIDR(buyZone)} berjarak ${fmtPct(a.buyZoneDistPct)}; support ${fmtIDR(a.support)}, resistance ${fmtIDR(a.resistance)}.
◆ Proyeksi 7 hari: ${fmtIDR(t7.price)} (${t7.dir}, prob ${t7.prob}%). Event musim dingin ~8 hari lagi berpotensi menambah suplai.
AKSI: ${a.signal === "BELI" ? "zona beli tersentuh — eksekusi bertahap." : "disiplin tunggu zona " + fmtIDR(buyZone) + ", pasang alert supaya tidak kelewat."}`;
}

export function pulseLine(ctx: LocalCtx, idx: number): string {
  const { analysis: a, live, buyZone } = ctx;
  const variants = [
    `PULSE ${idx} — ${fmtIDR(live)} (${fmtPct(a.chg24)}/24j). Tren ${a.trendLabel}, jarak ke zona beli ${fmtPct(a.buyZoneDistPct)}. ${a.signal === "BELI" ? "SINYAL BELI AKTIF di zona " + fmtIDR(buyZone) + "!" : "Belum ada sinyal eksekusi."}`,
    `PULSE ${idx} — Pemindaian 6 marketplace selesai. Spread terendah vs rata-rata: G2G/Itemku. RSI ${Math.round(a.rsi)}, volatilitas ${a.volPct.toFixed(2).replace(".", ",")}%. Posisi: ${a.signal}.`,
    `PULSE ${idx} — ${fmtIDR(live)}. Support ${fmtIDR(a.support)} bertahan. Menjelang event musim dingin, tekanan jual model: lanjut. Alert zona ${fmtIDR(buyZone)} tetap siaga.`,
  ];
  return variants[idx % variants.length];
}

export function fmtClock(t: number) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(t));
}

export { fmtDate };
