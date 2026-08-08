"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "../context/theme";
import { useEffect, useRef, useState } from "react";
import { LineChart, Line, ReferenceLine, ReferenceDot, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const API_BASE = "https://sireai.uk/pm-api";
const POLL_MS = 3000;
const MAX_POINTS = 150; // ~7.5 minutes of history at 3s ticks

type LiveData = {
  market_id: string | null;
  question: string | null;
  open_price_usd: number | null;
  cycle_ends_at: string | null;
  price_yes: number | null;
  price_no: number | null;
  current_price_usd: number;
};

type Point = { t: number; price: number };

type ArrowHeadProps = {
  cx?: number;
  cy?: number;
  color: string;
  bgColor: string;
};

function ArrowHead({ cx, cy, color, bgColor }: ArrowHeadProps) {
  if (cx == null || cy == null) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={9} fill={color} opacity={0.22}>
        <animate attributeName="r" values="7;12;7" dur="1.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;0.05;0.3" dur="1.6s" repeatCount="indefinite" />
      </circle>
      <path
        d={`M ${cx - 5} ${cy - 5} L ${cx + 7} ${cy} L ${cx - 5} ${cy + 5} Z`}
        fill={color}
        stroke={bgColor}
        strokeWidth={1.2}
      />
    </g>
  );
}

export default function BtcLive() {
  const { theme, toggleTheme, t, isLoggedIn } = useTheme();
  const router = useRouter();

  const [live, setLive] = useState<LiveData | null>(null);
  const [history, setHistory] = useState<Point[]>([]);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/markets/btc/live`, { cache: "no-store" });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data: LiveData = await res.json();
        setLive(data);
        setError(null);
        setHistory((prev) => {
          const next = [...prev, { t: Date.now(), price: data.current_price_usd }];
          return next.length > MAX_POINTS ? next.slice(next.length - MAX_POINTS) : next;
        });
      } catch {
        setError("Can't reach the live price feed right now.");
      }
    };

    poll();
    pollRef.current = setInterval(poll, POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (!live?.cycle_ends_at) {
      const id = requestAnimationFrame(() => setSecondsLeft(null));
      return () => cancelAnimationFrame(id);
    }
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(live.cycle_ends_at as string).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [live?.cycle_ends_at]);

  const isUp = live?.open_price_usd != null && live.current_price_usd > live.open_price_usd;
  const isDown = live?.open_price_usd != null && live.current_price_usd < live.open_price_usd;
  const lineColor = isUp ? "#10B981" : isDown ? "#E5484D" : theme === "dark" ? "#CCFF00" : "#3B82F6";

  const mins = secondsLeft != null ? Math.floor(secondsLeft / 60) : null;
  const secs = secondsLeft != null ? secondsLeft % 60 : null;

  const timeRangeLabel = (() => {
    if (!live?.cycle_ends_at) return null;
    const closesAt = new Date(live.cycle_ends_at);
    const opensAt = new Date(closesAt.getTime() - 5 * 60 * 1000);
    const dateLabel = opensAt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const openTime = opensAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    const closeTime = closesAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    return `${dateLabel}, ${openTime}–${closeTime}`;
  })();

  return (
    <div className={`min-h-screen ${t.pageBg} ${t.textPrimary} font-sans pb-20`}>
      {/* NAV */}
      <nav className={`sticky top-0 z-10 ${t.navBg} border-b ${t.border} shadow-sm`}>
        <div className="flex items-center justify-between px-3 md:px-6 h-12">
          <div onClick={() => router.push("/")} className="flex items-center gap-1.5 cursor-pointer">
            <span className="w-6 h-6 rounded-md bg-[#CCFF00] flex items-center justify-center text-black text-xs font-black italic">E</span>
            <span className={`text-sm font-bold ${t.textPrimary}`}>Eris</span>
          </div>
          <button
            onClick={toggleTheme}
            className={`w-8 h-8 rounded-full border ${t.border} flex items-center justify-center cursor-pointer ${t.navBg} transition-colors`}
          >
            {theme === "light" ? (
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-3 md:px-6 py-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-full bg-[#F7931A] flex items-center justify-center text-white text-base font-bold shrink-0">₿</span>
            <div>
              <h1 className={`text-base font-bold ${t.textPrimary} leading-tight`}>BTC Up or Down 5m</h1>
              {timeRangeLabel && <p className={`text-xs ${t.textMuted}`}>{timeRangeLabel}</p>}
            </div>
          </div>
          <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${theme === "dark" ? "bg-[#1A1A1A] text-white" : "bg-slate-100 text-slate-700"}`}>
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E5484D] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#E5484D]"></span>
            </span>
            Live
          </span>
        </div>

        {error && (
          <div className={`text-xs px-3 py-2 rounded-lg mb-3 ${theme === "dark" ? "bg-[#3B1B1B] text-[#E5484D]" : "bg-red-50 text-red-600"}`}>
            {error}
          </div>
        )}

        {/* PRICE TO BEAT + FINAL PRICE */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className={`text-xs ${t.textMuted} mb-1`}>Price To Beat</div>
            <div className={`text-2xl font-bold ${t.textPrimary}`}>
              ${live?.open_price_usd?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? "—"}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-xs ${t.textMuted} mb-1`}>Final Price</div>
            <div className="flex items-center gap-1.5 justify-end">
              {live?.open_price_usd != null && (
                <span className={`flex items-center gap-0.5 text-xs font-semibold ${isUp ? "text-emerald-500" : isDown ? "text-[#E5484D]" : t.textMuted}`}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={isDown ? "M19 14l-7 7m0 0l-7-7m7 7V3" : "M5 10l7-7m0 0l7 7m-7-7v18"} />
                  </svg>
                  ${Math.abs((live.current_price_usd ?? 0) - live.open_price_usd).toFixed(2)}
                </span>
              )}
              <span className={`text-2xl font-bold ${t.textPrimary}`}>
                ${live?.current_price_usd?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? "—"}
              </span>
            </div>
          </div>
        </div>

        {secondsLeft != null && (
          <div className={`text-xs ${t.textMuted} mb-2 text-right`}>
            Resolves in <span className={`font-mono font-semibold ${secondsLeft <= 30 ? "text-[#E5484D]" : t.textPrimary}`}>{mins}:{String(secs).padStart(2, "0")}</span>
          </div>
        )}

        {/* LIVE CHART */}
        <div className={`rounded-2xl border ${t.border} ${t.cardBg} p-3 mb-4`} style={{ height: 280 }}>
          {history.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 16, right: 56, left: 0, bottom: 0 }}>
                <CartesianGrid
                  horizontal
                  vertical={false}
                  stroke={theme === "dark" ? "#1E1E1E" : "#EEF2F6"}
                />
                <XAxis dataKey="t" hide />
                <YAxis
                  orientation="right"
                  domain={["dataMin - 20", "dataMax + 20"]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: theme === "dark" ? "#555555" : "#94A3B8" }}
                  tickFormatter={(v) => `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  width={56}
                />
                <Tooltip
                  formatter={(value) => [`$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, "BTC"]}
                  labelFormatter={(label) => new Date(Number(label)).toLocaleTimeString()}
                  contentStyle={{
                    background: theme === "dark" ? "#111111" : "#FFFFFF",
                    border: `1px solid ${theme === "dark" ? "#2A2A2A" : "#E2E8F0"}`,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                {live?.open_price_usd != null && (
                  <ReferenceLine
                    y={live.open_price_usd}
                    stroke={theme === "dark" ? "#666666" : "#94A3B8"}
                    strokeDasharray="4 4"
                    label={{
                      value: "open",
                      position: "insideLeft",
                      fill: theme === "dark" ? "#888888" : "#94A3B8",
                      fontSize: 10,
                    }}
                  />
                )}
                {live?.current_price_usd != null && (
                  <ReferenceLine
                    y={live.current_price_usd}
                    stroke="#CCFF00"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    label={{
                      value: `$${live.current_price_usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
                      position: "right",
                      fill: "#CCFF00",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  />
                )}
                <Line type="monotone" dataKey="price" stroke={lineColor} strokeWidth={2} dot={false} isAnimationActive={false} />
                <ReferenceDot
                  x={history[history.length - 1].t}
                  y={history[history.length - 1].price}
                  r={0}
                  shape={(props: { cx?: number; cy?: number }) => (
                    <ArrowHead cx={props.cx} cy={props.cy} color={lineColor} bgColor={theme === "dark" ? "#111111" : "#FFFFFF"} />
                  )}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className={`h-full flex items-center justify-center text-sm ${t.textMuted}`}>
              Loading live price…
            </div>
          )}
        </div>

        {/* ODDS */}
        {live?.price_yes != null && live?.price_no != null && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => { if (!isLoggedIn) router.push("/?auth=1"); }}
              className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 py-3 text-center cursor-pointer transition-colors hover:bg-emerald-500/25"
            >
              <div className="text-xs text-emerald-500 font-medium mb-0.5">UP (YES)</div>
              <div className="text-lg font-bold text-emerald-500">{live.price_yes.toFixed(0)}¢</div>
            </button>
            <button
              onClick={() => { if (!isLoggedIn) router.push("/?auth=1"); }}
              className="rounded-xl bg-[#E5484D]/15 border border-[#E5484D]/30 py-3 text-center cursor-pointer transition-colors hover:bg-[#E5484D]/25"
            >
              <div className="text-xs text-[#E5484D] font-medium mb-0.5">DOWN (NO)</div>
              <div className="text-lg font-bold text-[#E5484D]">{live.price_no.toFixed(0)}¢</div>
            </button>
          </div>
        )}

        <p className={`text-xs ${t.textMuted}`}>
          A new 5-minute market starts automatically the moment this one resolves. Odds move as people trade YES/NO — the dashed line marks the price this round opened at.
        </p>
      </div>
    </div>
  );
}