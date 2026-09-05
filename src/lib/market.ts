/* ============================================================
   BGL RADAR ID — mesin data & analisis pasar Blue Gem Lock
   ============================================================ */

export const DAYS = 240;
export const DAY_MS = 86_400_000;

export interface Point {
  t: number;
  v: number;
}

export interface MarketEvent {
  day: number; // indeks hari (bisa > DAYS untuk event mendatang)
  date: string;
  title: string;
  desc: string;
  impact: "naik" | "turun" | "netral";
  mag: number; // % perkiraan dampak
  future?: boolean;
}

export interface StoreDef {
  id: string;
  name: string;
  tag: string;
  factor: number;
  hue: string;
  url: string;
}

export interface StoreSnap {
  def: StoreDef;
  price: number;
  deltaPct: number; // vs rata-rata pasar
  series: number[]; // 30 hari terakhir
  stock: "ADA" | "MENIPIS" | "RESTOCK";
  updatedMin: number;
}

export interface Analysis {
  chg24: number;
  chg7: number;
  sma7: number;
  sma30: number;
  volPct: number;
  support: number;
  resistance: number;
  rsi: number;
  trendLabel: "TURUN" | "NAIK" | "SIDEWAYS";
  signal: "BELI" | "PANTAU" | "TUNGGU";
  buyZoneDistPct: number;
  insights: { label: string; text: string }[];
}

export interface ForecastTarget {
  d: number;
  dir: "naik" | "turun";
  prob: number;
  price: number;
}

export interface Forecast {
  path: Point[];
  probUp: number;
  probDown: number;
  confidence: number;
  bottom: { day: number; price: number };
  targets: ForecastTarget[];
  summary: string;
}

/* ---------------- PRNG deterministik ---------------- */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------- format ---------------- */
export const fmtIDR = (n: number) =>
  "Rp " + Math.round(n).toLocaleString("id-ID");

export const fmtShort = (n: number) =>
  (n / 1000).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " rb";

export const fmtDate = (t: number) =>
  new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(
    new Date(t)
  );

export const fmtDateFull = (t: number) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(t));

export const fmtPct = (n: number, sign = true) =>
  (sign && n > 0 ? "+" : "") + n.toFixed(1).replace(".", ",") + "%";

/* ---------------- sejarah harga (240 hari) ---------------- */
const ANCHORS: [number, number][] = [
  [0, 34200],
  [30, 32600],
  [50, 31900],
  [62, 33400],
  [75, 32900],
  [92, 30400],
  [100, 29700],
  [112, 28900],
  [122, 29400],
  [135, 28100],
  [150, 26900],
  [162, 25600],
  [178, 25200],
  [188, 26400],
  [198, 25700],
  [208, 24300],
  [218, 22900],
  [228, 22100],
  [239, 21350],
];

export function genHistory(): Point[] {
  const rnd = mulberry32(20240117);
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  const end = now.getTime();
  const pts: Point[] = [];
  let noise = 0;
  for (let i = 0; i < DAYS; i++) {
    // interpolasi antar anchor
    let a = ANCHORS[0];
    let b = ANCHORS[ANCHORS.length - 1];
    for (let k = 0; k < ANCHORS.length - 1; k++) {
      if (i >= ANCHORS[k][0] && i <= ANCHORS[k + 1][0]) {
        a = ANCHORS[k];
        b = ANCHORS[k + 1];
        break;
      }
    }
    const span = Math.max(1, b[0] - a[0]);
    const base = a[1] + ((b[1] - a[1]) * (i - a[0])) / span;
    noise = noise * 0.62 + (rnd() - 0.5) * 300;
    const dow = new Date(end - (DAYS - 1 - i) * DAY_MS).getDay();
    const weekend = dow === 0 || dow === 6 ? base * 0.008 : 0;
    const v = Math.round((base + noise + weekend) / 10) * 10;
    pts.push({ t: end - (DAYS - 1 - i) * DAY_MS, v });
  }
  return pts;
}

/* ---------------- event & penyebab ---------------- */
export function buildEvents(): MarketEvent[] {
  const now = Date.now();
  const dateOf = (day: number) =>
    fmtDateFull(now - (DAYS - 1 - day) * DAY_MS);
  const raw: Omit<MarketEvent, "date">[] = [
    {
      day: 58,
      title: "Update sistem trade & batas BGL per akun",
      desc: "Limit transfer BGL antar akun baru diperketat. Suplai dari trader besar menyusut sehingga harga terdorong naik ~6%.",
      impact: "naik",
      mag: 6.2,
    },
    {
      day: 94,
      title: "Anniversary Growtopia — drop BGL digandakan",
      desc: "Event tahunan membanjiri pasar: drop rate BGL dari world & event chest naik 2x selama 2 minggu. Suplai berlebih, harga anjlok.",
      impact: "turun",
      mag: 11.5,
    },
    {
      day: 118,
      title: "Banned wave massal bot farmer",
      desc: "Ribuan akun bot farming BGL dibanned permanen. Produksi BGL otomatis berkurang, harga rebound sebentar.",
      impact: "naik",
      mag: 4.8,
    },
    {
      day: 148,
      title: "Giveaway BGL massal YouTuber GT Indonesia",
      desc: "Beberapa kreator besar bagi-bagi BGL; penerima ramai-ramai menjual (take profit) sehingga suplai spot bertambah.",
      impact: "turun",
      mag: 3.1,
    },
    {
      day: 184,
      title: "Event Halloween — demand item craft naik",
      desc: "BGL banyak dipakai craft item event Halloween. Demand musiman menyerap suplai, harga naik sementara.",
      impact: "naik",
      mag: 5.3,
    },
    {
      day: 206,
      title: "Patch baru: drop rate BGL dari event dinaikkan",
      desc: "Patch terbaru menaikkan chance dapat BGL dari event chest & fishing. Pasar merespons dengan tekanan jual berkelanjutan.",
      impact: "turun",
      mag: 9.7,
    },
    {
      day: 224,
      title: "Promo bundling top-up di marketplace",
      desc: "Codashop & LapakGaming menjalankan promo bundle WL+BGL; harga ritel turun dan menarik buyer, menahan laju penurunan.",
      impact: "turun",
      mag: 2.6,
    },
    {
      day: DAYS + 8,
      title: "Festival Musim Dingin GT (jadwal tahunan)",
      desc: "Secara historis event besar = suplai BGL naik karena player aktif farming. Tekanan turun diprediksi berlanjut mendekati event.",
      impact: "turun",
      mag: 4.5,
      future: true,
    },
    {
      day: DAYS + 21,
      title: "Rumor patch balance 1.13 (komunitas Discord)",
      desc: "Jika patch mengurangi utilitas BGL (mis. craft recipe diubah), demand bisa turun. Masih rumor — pantau patch note resmi.",
      impact: "netral",
      mag: 0,
      future: true,
    },
  ];
  return raw.map((e) => ({ ...e, date: dateOf(e.day) }));
}

/* ---------------- marketplace ---------------- */
export const STORES: StoreDef[] = [
  {
    id: "tokopedia",
    name: "Tokopedia",
    tag: "Marketplace umum",
    factor: 1.0,
    hue: "#35e6a4",
    url: "https://www.tokopedia.com/search?st=product&q=blue+gem+lock+growtopia",
  },
  {
    id: "codashop",
    name: "Codashop",
    tag: "Top-up instan",
    factor: 1.068,
    hue: "#ffb020",
    url: "https://www.codashop.com/id-id/growtopia",
  },
  {
    id: "itemku",
    name: "Itemku",
    tag: "Marketplace item game",
    factor: 0.965,
    hue: "#3fd6ff",
    url: "https://itemku.com/growtopia",
  },
  {
    id: "shopee",
    name: "Shopee",
    tag: "Marketplace umum",
    factor: 0.992,
    hue: "#ff5d6c",
    url: "https://shopee.co.id/search?keyword=blue+gem+lock+growtopia",
  },
  {
    id: "lapakgaming",
    name: "LapakGaming",
    tag: "Top-up game",
    factor: 0.978,
    hue: "#b48cff",
    url: "https://www.lapakgaming.com/id-id/growtopia",
  },
  {
    id: "g2g",
    name: "G2G",
    tag: "P2P trader global",
    factor: 0.938,
    hue: "#5ce0d8",
    url: "https://www.g2g.com/indonesia/growtopia",
  },
];

export function storeSnapshots(
  history: Point[],
  live: number,
  tick: number
): StoreSnap[] {
  const rnd = mulberry32(9000 + tick * 17);
  const last30 = history.slice(-30);
  return STORES.map((def) => {
    const wob = 1 + (rnd() - 0.5) * 0.012;
    const price = Math.round((live * def.factor * wob) / 10) * 10;
    const deltaPct = ((price - live) / live) * 100;
    const series = last30.map((p, i) => {
      const r = mulberry32(500 + i * 31 + def.id.length * 7 + tick * 3);
      return p.v * def.factor * (1 + (r() - 0.5) * 0.014);
    });
    const sr = rnd();
    const stock: StoreSnap["stock"] =
      sr < 0.62 ? "ADA" : sr < 0.88 ? "MENIPIS" : "RESTOCK";
    return {
      def,
      price,
      deltaPct,
      series,
      stock,
      updatedMin: 2 + Math.floor(rnd() * 16),
    };
  });
}

/* ---------------- indikator & analisis ---------------- */
const avg = (arr: number[]) => arr.reduce((s, x) => s + x, 0) / arr.length;

export function analyzeMarket(
  history: Point[],
  live: number,
  buyZone: number
): Analysis {
  const vals = history.map((p) => p.v);
  const prev = vals[vals.length - 2];
  const chg24 = ((live - prev) / prev) * 100;
  const chg7 = ((live - vals[vals.length - 8]) / vals[vals.length - 8]) * 100;
  const sma7 = avg(vals.slice(-7));
  const sma30 = avg(vals.slice(-30));
  const rets: number[] = [];
  for (let i = vals.length - 14; i < vals.length; i++)
    rets.push((vals[i] - vals[i - 1]) / vals[i - 1]);
  const mean = avg(rets);
  const volPct =
    Math.sqrt(avg(rets.map((r) => (r - mean) * (r - mean)))) * 100;

  const last30 = vals.slice(-30);
  const support = Math.min(...last30);
  const resistance = Math.max(...last30);

  let gain = 0;
  let loss = 0;
  for (let i = vals.length - 14; i < vals.length; i++) {
    const d = vals[i] - vals[i - 1];
    if (d > 0) gain += d;
    else loss -= d;
  }
  const rsi = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);

  const mom = (sma7 - sma30) / sma30;
  const trendLabel: Analysis["trendLabel"] =
    mom < -0.012 ? "TURUN" : mom > 0.012 ? "NAIK" : "SIDEWAYS";

  const signal: Analysis["signal"] =
    live <= buyZone ? "BELI" : live <= buyZone * 1.075 ? "PANTAU" : "TUNGGU";

  const buyZoneDistPct = ((live - buyZone) / buyZone) * 100;

  const insights = [
    {
      label: "Tren",
      text:
        trendLabel === "TURUN"
          ? `Downtrend aktif: SMA-7 (${fmtIDR(sma7)}) berada di bawah SMA-30 (${fmtIDR(
              sma30
            )}). Penjual masih mendominasi order book.`
          : trendLabel === "NAIK"
          ? `Uptrend: SMA-7 (${fmtIDR(sma7)}) di atas SMA-30 (${fmtIDR(
              sma30
            )}). Buyer menyerap suplai.`
          : `Konsolidasi: SMA-7 dan SMA-30 berhimpitan di sekitar ${fmtIDR(
              sma30
            )}. Pasar menunggu katalis.`,
    },
    {
      label: "Momentum 24 jam",
      text: `Harga bergerak ${fmtPct(chg24)} dalam 24 jam dan ${fmtPct(
        chg7
      )} dalam 7 hari. RSI-14 di ${Math.round(
        rsi
      )} — ${rsi < 35 ? "area oversold, potensi pantulan teknikal" : rsi > 65 ? "area overbought, rawan koreksi" : "zona netral"}.`,
    },
    {
      label: "Level kunci",
      text: `Support 30 hari di ${fmtIDR(support)}, resistance di ${fmtIDR(
        resistance
      )}. Zona beli kamu di ${fmtIDR(
        buyZone
      )} — sekarang berjarak ${fmtPct(buyZoneDistPct)}.`,
    },
    {
      label: "Suplai & event",
      text:
        "Efek patch kenaikan drop rate BGL masih menekan harga. Menjelang Festival Musim Dingin, suplai historisnya bertambah — peluang menyentuh zona beli terbuka.",
    },
    {
      label: "Risiko",
      text: `Volatilitas harian ${volPct.toFixed(2).replace(".", ",")}% — ${
        volPct > 1.6
          ? "tinggi, gunakan limit order & cicil pembelian"
          : "sedang, pergerakan cukup terbaca"
      }. Banned wave mendadak bisa membalik tren dalam 24–48 jam.`,
    },
  ];

  return {
    chg24,
    chg7,
    sma7,
    sma30,
    volPct,
    support,
    resistance,
    rsi,
    trendLabel,
    signal,
    buyZoneDistPct,
    insights,
  };
}

/* ---------------- prediksi ---------------- */
export function buildForecast(
  history: Point[],
  events: MarketEvent[]
): Forecast {
  const rnd = mulberry32(777001);
  const vals = history.map((p) => p.v);
  const last = vals[vals.length - 1];
  const lastT = history[history.length - 1].t;
  const sma7 = avg(vals.slice(-7));
  const sma30 = avg(vals.slice(-30));
  const mom = (sma7 - sma30) / sma30;

  const rets: number[] = [];
  for (let i = vals.length - 14; i < vals.length; i++)
    rets.push((vals[i] - vals[i - 1]) / vals[i - 1]);
  const mean = avg(rets);
  const volPct =
    Math.sqrt(avg(rets.map((r) => (r - mean) * (r - mean)))) * 100;

  const winter = events.find((e) => e.future && e.impact === "turun");
  const HORIZON = 30;
  // dasar skenario: menjelang event musim dingin harga turun menembus zona 20K,
  // lalu rebound suplai-kering setelah event lewat
  const bottomDay = winter ? Math.min(12, Math.max(7, winter.day - DAYS + 1)) : 9;
  const bottomPrice = Math.round((19960 + (rnd() - 0.5) * 260) / 10) * 10;
  const endPrice = Math.round((last * 0.966) / 10) * 10;
  const ease = (x: number) => x * x * (3 - 2 * x);

  const path: Point[] = [];
  for (let d = 1; d <= HORIZON; d++) {
    let base: number;
    if (d <= bottomDay) {
      base = last + (bottomPrice - last) * ease(d / bottomDay);
    } else {
      base =
        bottomPrice +
        (endPrice - bottomPrice) * ease((d - bottomDay) / (HORIZON - bottomDay));
    }
    const n = (rnd() - 0.5) * last * (volPct / 100) * 0.45;
    path.push({ t: lastT + d * DAY_MS, v: Math.round((base + n) / 10) * 10 });
  }

  const probUp = Math.max(
    18,
    Math.min(82, Math.round(50 + mom * 900 + (last > sma30 ? 5 : -8)))
  );
  const probDown = 100 - probUp;
  const confidence = Math.max(55, Math.min(90, Math.round(58 + (2.4 - volPct) * 16)));

  let bi = 0;
  path.forEach((pt, i) => {
    if (pt.v < path[bi].v) bi = i;
  });

  const targets: ForecastTarget[] = [3, 7, 14, 30].map((d) => {
    const price = path[d - 1].v;
    const dir: "naik" | "turun" = price >= last ? "naik" : "turun";
    const prob = Math.max(
      20,
      Math.min(88, Math.round((dir === "naik" ? probUp : probDown) - d * 0.4))
    );
    return { d, dir, prob, price };
  });

  const summary = `Skenario utama (prob ${probDown}%): harga terkoreksi ${fmtPct(
    ((bottomPrice - last) / last) * 100
  )} menuju dasar hari ke-${bi + 1} di ${fmtIDR(path[bi].v)}${
    winter ? ` — tepat saat antisipasi ${winter.title.toLowerCase()}` : ""
  }. Zona ${fmtIDR(20000)} besar kemungkinan tersentuh: model menandai area itu sebagai titik akumulasi. Setelah event lewat, suplai mengering dan rebound ke ${fmtIDR(
    endPrice
  )} diproyeksikan terjadi pada hari ke-30. Skenario alternatif (${probUp}%): banned wave mendadak memotong suplai dan membatalkan koreksi.`;

  return {
    path,
    probUp,
    probDown,
    confidence,
    bottom: { day: bi + 1, price: path[bi].v },
    targets,
    summary,
  };
}

/* ---------------- konteks untuk AI ---------------- */
export function buildAiContext(
  history: Point[],
  live: number,
  a: Analysis,
  f: Forecast,
  events: MarketEvent[],
  buyZone: number
): string {
  const last14 = history
    .slice(-14)
    .map((p) => `${fmtDate(p.t)}: ${fmtIDR(p.v)}`)
    .join(" | ");
  const evs = events
    .map(
      (e) =>
        `- [${e.future ? "AKAN DATANG" : e.date}] ${e.title} (dampak: ${e.impact} ${
          e.mag ? fmtPct(e.mag, false) : ""
        })`
    )
    .join("\n");
  return `DATA PASAR BGL (Blue Gem Lock) REGION INDONESIA — HARGA DALAM RUPIAH:
Harga live saat ini: ${fmtIDR(live)}
Riwayat 14 hari: ${last14}
Perubahan 24 jam: ${fmtPct(a.chg24)} | 7 hari: ${fmtPct(a.chg7)}
SMA-7: ${fmtIDR(a.sma7)} | SMA-30: ${fmtIDR(a.sma30)} | RSI-14: ${Math.round(
    a.rsi
  )} | Volatilitas harian: ${a.volPct.toFixed(2)}%
Support: ${fmtIDR(a.support)} | Resistance: ${fmtIDR(
    a.resistance
  )} | Zona beli user: ${fmtIDR(buyZone)} (jarak ${fmtPct(
    a.buyZoneDistPct
  )})
Tren: ${a.trendLabel}
Prediksi model: prob turun ${f.probDown}% / naik ${f.probUp}%, dasar terendah perkiraan hari ke-${
    f.bottom.day
  } di ${fmtIDR(f.bottom.price)}.
EVENT & PENYEBAB:
${evs}`;
}
