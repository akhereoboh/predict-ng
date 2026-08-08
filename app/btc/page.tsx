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
  volume_naira: number | null;
  trader_count: number | null;
};

type Point = { t: number; price: number };

type ArrowHeadProps = {
  cx?: number;
  cy?: number;
  color: string;
  bgColor: string;
  angle: number;
};

function ArrowHead({ cx, cy, color, bgColor, angle }: ArrowHeadProps) {
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
        transform={`rotate(${angle} ${cx} ${cy})`}
      />
    </g>
  );
}

export default function BtcLive() {
  const { theme, toggleTheme, t, isLoggedIn, setIsLoggedIn } = useTheme();
  const router = useRouter();

  const [live, setLive] = useState<LiveData | null>(null);
  const [history, setHistory] = useState<Point[]>([]);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [amount, setAmount] = useState(5);
  const [orderBookOpen, setOrderBookOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [editing, setEditing] = useState(false);
  const [customAmounts, setCustomAmounts] = useState([1, 5, 7]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [orderBookLiquidity] = useState(() => ({
    up: [0.48, 0.49, 0.50, 0.51].map(() => Math.floor(Math.random() * 500 + 100)),
    down: [0.49, 0.50, 0.51, 0.52].map(() => Math.floor(Math.random() * 500 + 100)),
  }));

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
  const lineColor = isUp ? "#22C55E" : isDown ? "#EF4444" : theme === "dark" ? "#CCFF00" : "#3B82F6";

  const arrowAngle = (() => {
    const WINDOW = 6;
    if (history.length < 2) return 0;
    const recent = history.slice(-WINDOW);
    const delta = recent[recent.length - 1].price - recent[0].price;
    const maxDelta = 6;
    const clamped = Math.max(-maxDelta, Math.min(maxDelta, delta));
    return -(clamped / maxDelta) * 45;
  })();

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

  const yes = live?.price_yes ?? 50;
  const no = live?.price_no ?? 50;
  const chanceDelta = yes - 50; // round always opens locked at 50/50
  const price = side === "YES" ? yes / 100 : no / 100;
  const payout = price > 0 ? (amount / price).toFixed(2) : "0.00";
  const fee = (amount * 0.02).toFixed(2);
  const volume = live?.volume_naira ?? 0;
  const traders = live?.trader_count ?? 0;

  const cryptoBadge = theme === "dark" ? "bg-[#F7931A]/15 text-[#F7931A]" : "bg-orange-100 text-orange-700";

  return (
    <div className={`min-h-screen ${t.pageBg} ${t.textPrimary} font-sans pb-64`}>
      {/* NAV */}
      <nav className={`sticky top-0 z-10 ${t.navBg} border-b ${t.border} shadow-sm px-4 h-12 flex items-center justify-between`}>
        <button onClick={() => router.back()} className={`flex items-center gap-1.5 ${t.textMuted} cursor-pointer border-none bg-transparent text-sm`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="flex items-center gap-1.5">
          <span className={`w-5 h-5 rounded-md ${t.accent} flex items-center justify-center text-white text-xs font-black italic`}>E</span>
          <span className={`text-sm font-bold ${t.textPrimary}`}>Eris</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className={`w-7 h-7 rounded-full border ${t.border} flex items-center justify-center cursor-pointer ${t.navBg}`}>
            {theme === "light" ? (
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>
          <button onClick={() => setBookmarked(!bookmarked)} className={`p-1.5 cursor-pointer border-none bg-transparent ${bookmarked ? t.accentText : t.textMuted}`}>
            <svg className="w-4 h-4" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          <button className={`p-1.5 cursor-pointer border-none bg-transparent ${t.textMuted}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {/* HEADER */}
        <div className="mb-4">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cryptoBadge}`}>Crypto</span>
          <h1 className={`text-xl font-bold ${t.textPrimary} mt-2 leading-snug flex items-center gap-2`}>
            <span className="w-6 h-6 rounded-full bg-[#F7931A] flex items-center justify-center text-white text-xs font-bold shrink-0">₿</span>
            BTC Up or Down 5m
          </h1>
          {timeRangeLabel && <p className={`text-xs ${t.textMuted} mt-1`}>{timeRangeLabel}</p>}
        </div>

        {error && (
          <div className={`text-xs px-3 py-2 rounded-lg mb-3 ${theme === "dark" ? "bg-[#3B1B1B] text-[#EF4444]" : "bg-red-50 text-red-600"}`}>
            {error}
          </div>
        )}

        {/* CHANCE */}
        <div className="flex items-center gap-3 mb-4">
          <div>
            <div className={`text-3xl font-bold ${t.textPrimary}`}>{Math.round(yes)}%</div>
            <div className={`text-xs ${t.textMuted} uppercase tracking-wide`}>Chance of Up</div>
          </div>
          <div className={`flex items-center gap-1 text-sm font-medium ${chanceDelta >= 0 ? "text-green-500" : "text-red-500"}`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={chanceDelta >= 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
            </svg>
            {Math.abs(chanceDelta).toFixed(0)}% this round
          </div>
        </div>

        {/* YES/NO PILL */}
        <div className="flex gap-2 mb-4">
          {(["YES", "NO"] as const).map((s) => (
            <button key={s} onClick={() => setSide(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border cursor-pointer transition-colors ${
                side === s
                  ? s === "YES"
                    ? theme === "dark" ? "bg-green-500 border-transparent text-black" : `${t.accent} border-transparent text-white`
                    : theme === "dark" ? "bg-red-500 border-transparent text-white" : "bg-[#6B0D0D] border-transparent text-white"
                  : `${t.navBg} ${t.border} ${t.textMuted}`
              }`}
            >{s === "YES" ? "Up" : "Down"}</button>
          ))}
        </div>

        {/* LIVE CHART */}
        <div className={`${t.cardBg} border ${t.border} rounded-xl p-4 mb-4 shadow-sm`}>
          <div style={{ height: 260 }}>
            {history.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 16, right: 56, left: 0, bottom: 0 }}>
                  <CartesianGrid horizontal vertical={false} stroke={theme === "dark" ? "#1E1E1E" : "#EEF2F6"} />
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
                      label={{ value: "open", position: "insideLeft", fill: theme === "dark" ? "#888888" : "#94A3B8", fontSize: 10 }}
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
                      <ArrowHead cx={props.cx} cy={props.cy} color={lineColor} bgColor={theme === "dark" ? "#111111" : "#FFFFFF"} angle={arrowAngle} />
                    )}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className={`h-full flex items-center justify-center text-sm ${t.textMuted}`}>Loading live price…</div>
            )}
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className={`flex items-center gap-3 text-xs ${t.textMuted}`}>
              <span>{traders} trader{traders === 1 ? "" : "s"}</span>
              <span className={`w-px h-3 ${theme === "dark" ? "bg-zinc-700" : "bg-slate-200"}`} />
              <span>₦{volume.toLocaleString(undefined, { maximumFractionDigits: 0 })} vol</span>
            </div>
            {mins != null && (
              <span className={`text-xs px-2 py-1 rounded flex items-center gap-1.5 ${theme === "dark" ? "bg-[#1A1A1A]" : "bg-slate-100"}`}>
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EF4444] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#EF4444]"></span>
                </span>
                <span className={`font-medium ${t.textPrimary}`}>{mins}:{String(secs).padStart(2, "0")} left</span>
              </span>
            )}
          </div>
        </div>

        {/* ORDER BOOK */}
        <div className={`${t.cardBg} border ${t.border} rounded-xl mb-4 shadow-sm overflow-hidden`}>
          <button onClick={() => setOrderBookOpen(!orderBookOpen)} className="w-full flex items-center justify-between px-4 py-3 cursor-pointer border-none bg-transparent text-left">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${t.textPrimary}`}>Order Book</span>
              <span className={`w-4 h-4 rounded-full ${t.accentBg} ${t.accentText} text-xs flex items-center justify-center font-bold`}>?</span>
            </div>
            <svg className={`w-4 h-4 ${t.textMuted} transition-transform ${orderBookOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {orderBookOpen && (
            <div className="px-4 pb-4">
              <p className={`text-xs ${t.textMuted} mb-3`}>View real-time buy & sell liquidity at different price offers</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium text-green-500 mb-2">UP Bids</p>
                  {[0.48, 0.49, 0.50, 0.51].map((p, i) => (
                    <div key={p} className={`flex justify-between text-xs ${t.textMuted} py-1 border-b ${t.borderLight}`}>
                      <span className="text-green-500 font-medium">{p.toFixed(2)}e</span>
                      <span>{orderBookLiquidity.up[i]}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-medium text-red-500 mb-2">DOWN Bids</p>
                  {[0.49, 0.50, 0.51, 0.52].map((p, i) => (
                    <div key={p} className={`flex justify-between text-xs ${t.textMuted} py-1 border-b ${t.borderLight}`}>
                      <span className="text-red-500 font-medium">{p.toFixed(2)}e</span>
                      <span>{orderBookLiquidity.down[i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MARKET RULES */}
        <div className={`${t.cardBg} border ${t.border} rounded-xl p-4 mb-4 shadow-sm`}>
          <h3 className={`text-sm font-semibold ${t.textPrimary} mb-3`}>Market Rules & Timelines</h3>
          <p className={`text-sm ${t.textMuted} mb-3 leading-relaxed`}>
            This is a recurring 5-minute market. When each round opens, the current BTC/USD price (sourced from Chainlink&apos;s on-chain price feed) is locked in as the &quot;Price To Beat.&quot; Five minutes later, the round resolves automatically by comparing the closing price to that opening price.
          </p>
          <p className={`text-sm ${t.textMuted} mb-1`}>
            This market will resolve as <span className={`${t.accentText} font-medium`}>Up</span> if the closing BTC price is higher than the opening price.
          </p>
          <p className={`text-sm ${t.textMuted} mb-3`}>
            It will resolve as <span className="text-red-500 font-medium">Down</span> if the closing price is lower than or equal to the opening price.
          </p>
          <p className={`text-xs ${t.textMuted}`}>A new round starts automatically the instant this one resolves — there&apos;s no need to do anything to keep playing.</p>
        </div>

        {/* TIMELINE */}
        <div className={`${t.cardBg} border ${t.border} rounded-xl mb-4 shadow-sm overflow-hidden`}>
          <button onClick={() => setTimelineOpen(!timelineOpen)} className="w-full flex items-center justify-between px-4 py-3 cursor-pointer border-none bg-transparent text-left">
            <span className={`text-sm font-semibold ${t.textPrimary}`}>Timeline & Payout</span>
            <svg className={`w-4 h-4 ${t.textMuted} transition-transform ${timelineOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {timelineOpen && (
            <div className="px-4 pb-4">
              {[
                { label: "Round Open", date: timeRangeLabel ? timeRangeLabel.split(", ")[1]?.split("–")[0] ?? "—" : "—", done: true },
                { label: "Round Close", date: timeRangeLabel ? timeRangeLabel.split("–")[1] ?? "—" : "—", done: false },
                { label: "Payout", date: "Immediately after close", done: false },
              ].map((step, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="flex flex-col items-center">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${step.done ? "border-green-500 bg-green-500" : `${t.border} ${t.navBg}`}`}>
                      {step.done && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    {i < 2 && <div className={`w-px h-6 ${theme === "dark" ? "bg-zinc-700" : "bg-slate-200"} mt-1`} />}
                  </div>
                  <div className="pb-4">
                    <p className={`text-sm font-medium ${step.done ? "text-green-500" : t.textPrimary}`}>{step.label}</p>
                    <p className={`text-xs ${t.textMuted}`}>{step.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BACK TO CRYPTO */}
        <div className="mb-4">
          <button
            onClick={() => router.push("/?filter=Crypto")}
            className={`text-xs px-3 py-1.5 rounded-full border ${t.border} ${t.textMuted} cursor-pointer bg-transparent transition-colors`}
          >
            ← Back to Crypto markets
          </button>
        </div>
      </div>

      {/* FIXED BOTTOM TRADE PANEL */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        <div className={`${t.navBg} border-t ${t.border} shadow-lg`}>
          <div className="max-w-2xl mx-auto px-4 pt-3 pb-2">
            <div className="flex gap-2 mb-2">
              <button onClick={() => setSide("YES")}
                className={`flex-1 h-12 rounded-xl text-sm font-bold border-none cursor-pointer transition-colors ${
                  side === "YES" ? (theme === "dark" ? "bg-green-500 text-black" : `${t.accent} text-white`) : `${t.inputBg} ${t.textMuted}`
                }`}
              >
                Up {(yes / 100).toFixed(2)}e
              </button>
              <button onClick={() => setSide("NO")}
                className={`flex-1 h-12 rounded-xl text-sm font-bold border-none cursor-pointer transition-colors ${
                  side === "NO" ? (theme === "dark" ? "bg-red-500 text-white" : "bg-[#6B0D0D] text-white") : `${t.inputBg} ${t.textMuted}`
                }`}
              >
                Down {(no / 100).toFixed(2)}e
              </button>
            </div>

            <div className="flex justify-between items-center mb-2">
              <span className={`text-xs ${t.textMuted}`}>${amount}.00 cash</span>
              <button onClick={() => setEditing(!editing)} className={`text-xs ${t.accentText} font-medium cursor-pointer border-none bg-transparent`}>
                {editing ? "Done" : "Edit"}
              </button>
            </div>

            {editing && (
              <div className="flex gap-2 mb-2">
                {customAmounts.map((a, i) => (
                  <input key={i} type="number" value={a}
                    onChange={(e) => {
                      const updated = [...customAmounts];
                      updated[i] = Number(e.target.value);
                      setCustomAmounts(updated);
                    }}
                    className={`flex-1 text-center text-sm font-bold ${t.inputBg} border ${t.border} rounded-xl py-2.5 outline-none ${t.textPrimary} w-0`}
                  />
                ))}
              </div>
            )}

            {!editing && (
              <div className="flex gap-2 mb-2">
                {customAmounts.map((a) => (
                  <button key={a} onClick={() => setAmount(a)}
                    className={`flex-1 rounded-xl py-3 cursor-pointer border-none transition-colors flex flex-col items-center gap-0.5 ${
                      amount === a
                        ? theme === "dark"
                          ? side === "YES" ? "bg-green-500 text-black" : "bg-red-500 text-white"
                          : `${t.amountActive} ${t.amountActiveText}`
                        : `${t.inputBg} ${t.textPrimary}`
                    }`}
                  >
                    <span className="text-sm font-bold">${a}</span>
                    <span className={`text-xs ${amount === a ? t.amountActiveSub : "text-green-500"}`}>
                      win ${price > 0 ? (a / price).toFixed(0) : "0"}¢
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="text-center py-1">
              <span className={`text-xs ${t.textMuted}`}>Potential win if {side === "YES" ? "Up" : "Down"}: </span>
              <span className={`text-sm font-bold ${t.accentText}`}>${payout}</span>
              <span className={`text-xs ${t.textMuted}`}> · Fee: ₦{fee}</span>
            </div>

            {!isLoggedIn && (
              <button
                onClick={() => setShowAuthModal(true)}
                className={`w-full h-11 rounded-xl text-sm font-bold border-none cursor-pointer mt-1 ${theme === "dark" ? "bg-green-500 text-black" : `${t.accent} text-white`}`}
              >
                Sign in to trade
              </button>
            )}
          </div>
        </div>

        {/* BOTTOM NAV */}
        <nav className={`${t.bottomNav} border-t ${t.bottomNavBorder} flex items-center justify-around px-4 py-2`}>
          {[
            { label: "Home", icon: "home" },
            { label: "Search", icon: "search" },
            { label: "Breaking", icon: "breaking" },
            { label: `E${(amount / (price || 1)).toFixed(0)}`, icon: "portfolio" },
          ].map((item) => (
            <button key={item.label}
              onClick={() => { if (item.icon === "home") router.push("/"); if (item.icon === "breaking") router.push("/breaking"); if (item.icon === "search") router.push("/?search=1"); }}
              className={`flex flex-col items-center gap-1 ${t.textMuted} transition-colors cursor-pointer border-none bg-transparent py-1 px-3`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {item.icon === "home" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />}
                {item.icon === "search" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />}
                {item.icon === "breaking" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />}
                {item.icon === "portfolio" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />}
              </svg>
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* AUTH MODAL */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowAuthModal(false)}
        >
          <div className={`${t.cardBg} border ${t.border} rounded-2xl p-6 w-80 shadow-2xl`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-5 justify-center">
              <span className="w-7 h-7 rounded-md bg-[#CCFF00] flex items-center justify-center text-black text-sm font-black italic">E</span>
              <span className={`text-base font-bold ${t.textPrimary}`}>Eris</span>
            </div>
            <h2 className={`text-lg font-bold ${t.textPrimary} text-center mb-1`}>Sign in to trade</h2>
            <p className={`text-xs ${t.textMuted} text-center mb-6`}>You need an account to place trades. Browsing is always free.</p>
            <button
              onClick={() => { setIsLoggedIn(true); setShowAuthModal(false); }}
              className={`w-full py-2.5 rounded-xl font-semibold text-sm mb-3 border-none cursor-pointer transition-colors ${theme === "dark" ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-zinc-800"}`}
            >
              Log in
            </button>
            <button onClick={() => setShowAuthModal(false)} className={`w-full text-xs ${t.textMuted} bg-transparent border-none cursor-pointer`}>
              Continue browsing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}