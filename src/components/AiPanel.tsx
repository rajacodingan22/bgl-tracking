import React, { useEffect, useRef, useState } from "react";
import { IBot, IGear, ISend, IZap } from "./Icons";

export interface AiMsg {
  id: number;
  role: "user" | "ai" | "sys";
  text: string;
  time: string;
  tag?: string;
  streaming?: boolean;
}

function useTyped(text: string, streaming: boolean | undefined, onProgress: () => void) {
  const [n, setN] = useState(streaming ? 0 : text.length);
  useEffect(() => {
    if (!streaming) {
      setN(text.length);
      return;
    }
    setN(0);
    const iv = setInterval(() => {
      setN((prev) => {
        if (prev >= text.length) {
          clearInterval(iv);
          return prev;
        }
        onProgress();
        return prev + 3;
      });
    }, 18);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, streaming]);
  return text.slice(0, n);
}

function Card({
  m,
  scrollToBottom,
}: {
  m: AiMsg;
  scrollToBottom: () => void;
}) {
  const shown = useTyped(m.text, m.streaming, scrollToBottom);
  const done = shown.length >= m.text.length;

  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] border border-line2 bg-panel2 px-3 py-2">
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-fog">{m.text}</p>
          <div className="mt-1 text-right text-[10px] uppercase tracking-widest text-mute">{m.time} · kamu</div>
        </div>
      </div>
    );
  }

  if (m.role === "sys") {
    return (
      <div className="flex items-center gap-2 px-1 text-[11px] uppercase tracking-widest text-mute">
        <span className="h-px flex-1 bg-line" />
        {m.text}
        <span className="h-px flex-1 bg-line" />
      </div>
    );
  }

  return (
    <div className="flex gap-2.5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border border-gem/50 bg-gem/10 text-gem">
        <IBot size={16} />
      </div>
      <div className="max-w-[88%] flex-1 border border-line bg-deep/70 px-3 py-2">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="font-display text-[11px] font-bold uppercase tracking-widest text-gem">Muse-Spark 1.3</span>
          {m.tag && (
            <span className="border border-line2 px-1.5 py-px text-[9px] uppercase tracking-widest text-mute">
              {m.tag}
            </span>
          )}
          <span className="ml-auto text-[10px] uppercase tracking-widest text-mute">{m.time}</span>
        </div>
        <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-fog/90">
          {shown}
          {!done && <span className="caret" />}
        </p>
      </div>
    </div>
  );
}

interface Props {
  messages: AiMsg[];
  busy: boolean;
  hasKey: boolean;
  model: string;
  onAsk: (q: string) => void;
  onOpenSettings: () => void;
}

const QUICK = [
  "Kapan harga turun ke 20k?",
  "Prediksi 7 hari ke depan",
  "Kenapa harga turun terus?",
  "Beli di mana paling murah?",
];

export default function AiPanel({ messages, busy, hasKey, model, onAsk, onOpenSettings }: Props) {
  const [q, setQ] = useState("");
  const feedRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const text = q.trim();
    if (!text || busy) return;
    setQ("");
    onAsk(text);
  }

  return (
    <div className="panel brk-mint brk flex h-full flex-col">
      {/* header */}
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <div className="floaty flex h-10 w-10 items-center justify-center border border-mint/60 bg-mint/10 text-mint">
          <IBot size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-base font-bold uppercase leading-none text-fog">
            Analis AI <span className="text-mint">Muse-Spark 1.3</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-mute">
            <IZap size={10} className="text-amber" />
            {hasKey ? (
              <>
                <span className="live-dot inline-block h-1.5 w-1.5 bg-mint" />
                OpenCode Zen · {model}
              </>
            ) : (
              <>
                <span className="inline-block h-1.5 w-1.5 bg-amber" />
                Mode lokal — pasang API key Zen
              </>
            )}
          </div>
        </div>
        <button onClick={onOpenSettings} className="btn-pixel text-[10px]" title="Pengaturan AI">
          <IGear size={13} className="mr-1 inline" />
          API
        </button>
      </div>

      {/* feed */}
      <div ref={feedRef} className="scroll-slim h-[380px] flex-1 space-y-3 overflow-y-auto p-4 lg:h-auto">
        {messages.map((m) => (
          <Card key={m.id} m={m} scrollToBottom={scrollToBottom} />
        ))}
        {busy && (
          <div className="flex items-center gap-2.5 px-1 text-mute">
            <IBot size={14} className="text-gem" />
            <span className="text-[11px] uppercase tracking-widest">Menganalisis pasar</span>
            <span className="flex gap-1">
              <span className="thinking-dot h-1.5 w-1.5 bg-gem" />
              <span className="thinking-dot h-1.5 w-1.5 bg-gem" />
              <span className="thinking-dot h-1.5 w-1.5 bg-gem" />
            </span>
          </div>
        )}
      </div>

      {/* quick chips */}
      <div className="flex flex-wrap gap-1.5 border-t border-line px-4 pt-3">
        {QUICK.map((c) => (
          <button
            key={c}
            onClick={() => !busy && onAsk(c)}
            className="border border-line bg-deep px-2 py-1 text-[11px] text-mute transition-all hover:-translate-y-0.5 hover:border-gem hover:text-gem"
          >
            {c}
          </button>
        ))}
      </div>

      {/* input */}
      <form onSubmit={submit} className="flex gap-2 p-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tanya soal harga BGL… (mis: harus beli sekarang?)"
          className="min-w-0 flex-1 border border-line bg-deep px-3 py-2.5 text-[13px] text-fog placeholder:text-mute/60"
        />
        <button type="submit" disabled={busy || !q.trim()} className="btn-pixel disabled:cursor-not-allowed disabled:opacity-40">
          <ISend size={14} />
        </button>
      </form>
    </div>
  );
}
