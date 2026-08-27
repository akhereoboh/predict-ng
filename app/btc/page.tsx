"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "../context/theme";
import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, LineSeries, LineStyle, type IChartApi, type ISeriesApi, type IPriceLine, type UTCTimestamp } from "lightweight-charts";
import OrderBookTrade from "../components/OrderBookTrade";
const API_BASE = "https://sireai.uk/pm-api";
const POLL_MS = 1000; // matches btc_stream.py's UPDATE_INTERVAL_SECONDS

type TradeRecord = {
  id: number;
  action: "BUY" | "SELL";
  outcome: "YES" | "NO";
  amount_kobo: number;
  created_at: string;
};

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
  recent_trades: TradeRecord[];
};

// Casino/odometer-style rolling digits -- each numeral is a tiny vertical
// "reel" of 0-9 that slides to the new digit's position via a CSS
// transition, instead of the text just snapping to a new value. Non-digit
// characters ($, comma, period) render statically alongside the reels.
import RollingNumber from "../components/RollingNumber";
import QuickBuyOrderBook from "../components/QuickBuyOrderBook";
export default function BtcLive() {
  const { theme, toggleTheme, t, isLoggedIn, setIsLoggedIn } = useTheme();
  const router = useRouter();

  const [live, setLive] = useState<LiveData | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

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
  const [tradeBubbles, setTradeBubbles] = useState<{ id: number; outcome: "YES" | "NO"; amountNaira: number; x: number }[]>([]);
  const seenTradeIds = useRef<Set<number> | null>(null);

  // Chart refs -- lightweight-charts (TradingView's canvas-based charting
  // library) instead of recharts. recharts redraws its entire SVG tree
  // (every gridline, tick, and the full line path) on each update, which
  // is what caused the choppy motion, jittery tick labels, and sudden
  // rescale "jumps" we kept fighting. lightweight-charts is purpose-built
  // for exactly this -- live tick-updating financial charts -- and handles
  // smooth interpolation, the sliding time axis, and the "last value"
  // marker/label natively, so almost none of that needs to be hand-built
  // anymore.
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const openPriceLineRef = useRef<IPriceLine | null>(null);
  const lastMarketIdRef = useRef<string | null>(null);
  const blipRef = useRef<HTMLDivElement>(null);
  const currentColorRef = useRef<string>("#CCFF00");
  const [chartReady, setChartReady] = useState(false);

  // The last two REAL prices from the backend, used to smoothly glide the
  // chart between them instead of jumping the instant new data arrives.
  const prevRealRef = useRef<{ price: number; time: number } | null>(null);
  const lastRealRef = useRef<{ price: number; time: number } | null>(null);

  // Create the chart once on mount.
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 280,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: theme === "dark" ? "#666666" : "#94A3B8",
        fontSize: 10,
        // The library's license requires SOME form of attribution to
        // TradingView -- either this on-chart logo, or an equivalent link
        // visible elsewhere on the page. We disable the logo here and add
        // a small text credit near the chart instead (see below), so this
        // isn't just deleting a requirement without fulfilling it.
        attributionLogo: false,
      },
      grid: {
        horzLines: { color: theme === "dark" ? "#1E1E1E" : "#EEF2F6" },
        vertLines: { visible: false },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: true,
        // The glide loop below creates a new bar ~15x/sec now (fractional
        // timestamps), not 1x/sec like before -- so barSpacing has to
        // shrink roughly proportionally, or the chart scrolls ~15x faster
        // than intended even though nothing about the real data changed.
        // 14 was calibrated for 1 bar/sec; ~1 keeps the same overall pace
        // at ~15 bars/sec while still looking smooth rather than stepped.
        barSpacing: 1,
      },
      crosshair: { horzLine: { visible: false }, vertLine: { visible: false } },
      handleScroll: false,
      handleScale: false,
    });

    const series = chart.addSeries(LineSeries, {
      color: theme === "dark" ? "#CCFF00" : "#3B82F6",
      lineWidth: 2,
      // Native "last value" dashed line + label -- this replaces the
      // custom lime ReferenceLine we were hand-building with recharts.
      priceLineVisible: true,
      priceLineColor: "#CCFF00",
      priceLineWidth: 1,
      priceLineStyle: LineStyle.Dashed,
      lastValueVisible: true,
      crosshairMarkerVisible: false,
    });

    chartApiRef.current = chart;
    seriesRef.current = series;
    setChartReady(true);

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartApiRef.current = null;
      seriesRef.current = null;
      openPriceLineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-theme the chart when dark/light mode toggles.
  useEffect(() => {
    if (!chartApiRef.current || !seriesRef.current) return;
    chartApiRef.current.applyOptions({
      layout: {
        textColor: theme === "dark" ? "#666666" : "#94A3B8",
      },
      grid: {
        horzLines: { color: theme === "dark" ? "#1E1E1E" : "#EEF2F6" },
      },
    });
  }, [theme, chartReady]);

  // Glide loop -- real data now arrives every ~1s via the SSE push (see
  // below), so instead of the line jumping to each new point, this runs
  // much more frequently (~15x/sec) and feeds the chart a smoothly
  // interpolated value between the last two REAL prices, based on how far
  // through the current update interval we are. lightweight-charts'
  // update() is cheap (canvas-based, no full-tree redraw), so calling it
  // this often is fine performance-wise -- this is what actually produces
  // continuous motion instead of ticks.
  //
  // IMPORTANT: UTCTimestamp is just a plain number under a TypeScript
  // brand -- there's no runtime enforcement that it be a whole second.
  // Flooring to Math.floor(Date.now()/1000) meant every call within the
  // same second produced the IDENTICAL timestamp, so the line could only
  // ever move horizontally once per second no matter how often we updated
  // the price -- that was the real cause of the "ticking" motion. Using
  // the raw fractional value lets both axes glide continuously.
  useEffect(() => {
    const id = setInterval(() => {
      if (!seriesRef.current || !lastRealRef.current) return;
      const prev = prevRealRef.current ?? lastRealRef.current;
      const last = lastRealRef.current;
      const frac = Math.min(1, Math.max(0, (Date.now() - last.time) / POLL_MS));
      const interpolated = prev.price + (last.price - prev.price) * frac;
      const time = (Date.now() / 1000) as UTCTimestamp;
      seriesRef.current.update({ time, value: interpolated });

      // Radar-blip marker -- pins itself to the exact pixel position of
      // the moving line tip every tick, using the chart's own coordinate
      // conversion so it never drifts out of sync with the actual line.
      if (blipRef.current && chartApiRef.current) {
        const x = chartApiRef.current.timeScale().timeToCoordinate(time);
        const y = seriesRef.current.priceToCoordinate(interpolated);
        if (x != null && y != null) {
          blipRef.current.style.left = `${x}px`;
          blipRef.current.style.top = `${y}px`;
          blipRef.current.style.background = currentColorRef.current;
          blipRef.current.style.visibility = "visible";
        } else {
          blipRef.current.style.visibility = "hidden";
        }
      }
    }, 65);
    return () => clearInterval(id);
  }, []);

  // A separate, slower-cadence interpolated value just for the header's
  // rolling-digit "Current Price" text -- reuses the same prev/last real
  // anchors as the chart's glide loop, but updates React state at ~4x/sec
  // instead of ~15x/sec, since re-rendering the whole page that often
  // would be wasteful (the chart itself updates imperatively, bypassing
  // React entirely, which is why it can run much faster).
  const [displayPrice, setDisplayPrice] = useState<number | null>(null);
  useEffect(() => {
    const id = setInterval(() => {
      if (!lastRealRef.current) return;
      const prev = prevRealRef.current ?? lastRealRef.current;
      const last = lastRealRef.current;
      const frac = Math.min(1, Math.max(0, (Date.now() - last.time) / POLL_MS));
      setDisplayPrice(prev.price + (last.price - prev.price) * frac);
    }, 250);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handleData = (data: LiveData) => {
      setLive(data);
      setError(null);

      // Record this real price for interpolation -- the actual chart
      // update happens in a separate, much more frequent interval below
      // (the glide loop), which smoothly moves from the PREVIOUS real
      // price to this one over the next update interval, instead of the
      // line jumping the instant new data arrives.
      const nowMs = Date.now();
      prevRealRef.current = lastRealRef.current ?? { price: data.current_price_usd, time: nowMs };
      lastRealRef.current = { price: data.current_price_usd, time: nowMs };

      if (seriesRef.current) {
        const isUpNow = data.open_price_usd != null && data.current_price_usd > data.open_price_usd;
        const isDownNow = data.open_price_usd != null && data.current_price_usd < data.open_price_usd;
        const nowColor = isUpNow ? "#00D1FF" : isDownNow ? "#FF3B5C" : "#00D1FF";
        seriesRef.current.applyOptions({ color: nowColor });
        currentColorRef.current = nowColor;

        // Recreate the "open" reference line only when the round actually
        // changes (a new market_id) -- not every update, since the open
        // price is fixed for the whole round.
        if (data.market_id && data.market_id !== lastMarketIdRef.current && data.open_price_usd != null) {
          lastMarketIdRef.current = data.market_id;
          if (openPriceLineRef.current) {
            seriesRef.current.removePriceLine(openPriceLineRef.current);
          }
          openPriceLineRef.current = seriesRef.current.createPriceLine({
            price: data.open_price_usd,
            color: theme === "dark" ? "#666666" : "#94A3B8",
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: "open",
          });
        }
      }

      // Only animate trades that are genuinely NEW since the last update --
      // real buys/sells from real users, never simulated. The first
      // message just records what already happened without animating any
      // of it, so opening the page doesn't dump a pile of "historical"
      // bubbles.
      const trades = data.recent_trades ?? [];
      if (seenTradeIds.current === null) {
        seenTradeIds.current = new Set(trades.map((tr) => tr.id));
      } else {
        const fresh = trades.filter((tr) => !seenTradeIds.current!.has(tr.id));
        fresh.forEach((tr) => {
          seenTradeIds.current!.add(tr.id);
          const bubbleId = Date.now() + Math.random();
          const amountNaira = Math.round((tr.amount_kobo || 0) / 100);
          const x = 10 + Math.random() * 75;
          setTradeBubbles((prev) => [...prev, { id: bubbleId, outcome: tr.outcome, amountNaira, x }]);
          setTimeout(() => {
            setTradeBubbles((prev) => prev.filter((b) => b.id !== bubbleId));
          }, 1900);
        });
      }
    };

    // Server-Sent Events instead of REST polling -- the backend pushes an
    // update the instant its shared background loop has one, rather than
    // every client independently asking every few seconds. EventSource
    // also reconnects automatically on a dropped connection, for free.
    const es = new EventSource(`${API_BASE}/markets/btc/stream`);
    es.onmessage = (event) => {
      try {
        const data: LiveData = JSON.parse(event.data);
        handleData(data);
      } catch {
        // malformed message on one tick -- ignore it, the next one will be fine
      }
    };
    es.onerror = () => {
      setError("Can't reach the live price feed right now.");
    };

    return () => es.close();
  }, [theme]);

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
  const price = side === "YES" ? yes / 100 : no / 100;
  const payout = price > 0 ? (amount / price).toFixed(2) : "0.00";
  const fee = (amount * 0.02).toFixed(2);
  const volume = live?.volume_naira ?? 0;
  const traders = live?.trader_count ?? 0;
  const [quickBuyOpen, setQuickBuyOpen] = useState(false);
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
        <div onClick={() => router.push("/portfolio")} className="flex items-center gap-1.5 cursor-pointer">
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

        {/* PRICE TO BEAT + CURRENT PRICE */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className={`text-xs ${t.textMuted} mb-1`}>Price To Beat</div>
            <div className={`text-2xl font-bold ${t.textPrimary}`}>
              ${live?.open_price_usd?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? "—"}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-xs ${t.textMuted} mb-1`}>Current Price</div>
            <div className="flex items-center gap-1.5 justify-end">
              {live?.open_price_usd != null && (
                <span className={`flex items-center gap-0.5 text-xs font-semibold ${isUp ? "text-[#00D1FF]" : isDown ? "text-[#FF3B5C]" : t.textMuted}`}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={isDown ? "M19 14l-7 7m0 0l-7-7m7 7V3" : "M5 10l7-7m0 0l7 7m-7-7v18"} />
                  </svg>
                  ${Math.abs((live?.current_price_usd ?? 0) - (live?.open_price_usd ?? 0)).toFixed(2)}
                </span>
              )}
              <span className="text-2xl font-bold" style={{ lineHeight: 1 }}>
                {displayPrice != null || live?.current_price_usd != null ? (
                  <RollingNumber
                    text={`$${(displayPrice ?? live?.current_price_usd ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`}
                    color="#F7931A"
                  />
                ) : (
                  <span className={t.textPrimary}>—</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* LIVE CHART */}
        <div className={`${t.cardBg} border ${t.border} rounded-xl p-4 mb-4 shadow-sm`}>
          <div className="relative" style={{ height: 280 }}>
            {tradeBubbles.map((b) => (
              <span
                key={b.id}
                className="float-up"
                style={{ left: `${b.x}%`, bottom: "40px", color: b.outcome === "YES" ? "#4ade80" : "#ef4444" }}
              >
                +₦{b.amountNaira}
              </span>
            ))}
            {!chartReady && (
              <div className={`absolute inset-0 flex items-center justify-center text-sm ${t.textMuted}`}>Loading live price…</div>
            )}
            <div ref={chartContainerRef} style={{ width: "100%", height: "100%" }} />
            <div ref={blipRef} className="radar-blip" style={{ visibility: "hidden", background: "#CCFF00" }} />
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
          <p className={`text-[10px] ${t.textMuted} text-right mt-1`}>
            Charts by{" "}
            <a href="https://www.tradingview.com/" target="_blank" rel="noopener noreferrer" className="hover:underline">
              TradingView Lightweight Charts
            </a>
          </p>
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
          {orderBookOpen && live?.market_id && (
            <div className="px-4 pb-4">
              <OrderBookTrade marketId={live.market_id} outcome="YES" />
            </div>
          )}
          {orderBookOpen && !live?.market_id && (
            <div className="px-4 pb-4">
              <p className={`text-xs ${t.textMuted}`}>Loading order book…</p>
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
              <button onClick={() => { setSide("YES"); setQuickBuyOpen(true); }}
                className={`flex-1 h-12 rounded-xl text-sm font-bold border-none cursor-pointer transition-colors ${
                  side === "YES" ? "bg-[#00D1FF] text-black" : `${t.inputBg} ${t.textMuted}`
                }`}
              >
                Up ₦{yes.toFixed(2)}
              </button>
              <button onClick={() => { setSide("NO"); setQuickBuyOpen(true); }}
                className={`flex-1 h-12 rounded-xl text-sm font-bold border-none cursor-pointer transition-colors ${
                  side === "NO" ? "bg-[#FF3B5C] text-white" : `${t.inputBg} ${t.textMuted}`
                }`}
              >
                Down ₦{no.toFixed(2)}
              </button>
           </div>

            <div className="flex justify-between items-center mb-2">
              <span className={`text-xs ${t.textMuted}`}>₦{amount}.00 cash</span>
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
                          ? side === "YES" ? "bg-[#00D1FF] text-black" : "bg-[#FF3B5C] text-white"
                          : `${t.amountActive} ${t.amountActiveText}`
                        : `${t.inputBg} ${t.textPrimary}`
                    }`}
                  >
                    <span className="text-sm font-bold">₦{a}</span>
                    <span className={`text-xs ${amount === a ? t.amountActiveSub : "text-[#00D1FF]"}`}>
                      win ₦{price > 0 ? (a / price).toFixed(0) : "0"}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="text-center py-1">
              <span className={`text-xs ${t.textMuted}`}>Potential win if {side === "YES" ? "Up" : "Down"}: </span>
              <span className={`text-sm font-bold ${t.accentText}`}>₦{payout}</span>
              <span className={`text-xs ${t.textMuted}`}> · Fee: ₦{fee}</span>
            </div>

            {!isLoggedIn && (
              <button
                onClick={() => setShowAuthModal(true)}
                className={`w-full h-11 rounded-xl text-sm font-bold border-none cursor-pointer mt-1 bg-[#00D1FF] text-black`}
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
      {quickBuyOpen && live?.market_id && (
        <QuickBuyOrderBook
          marketId={live.market_id}
          question="BTC Up or Down 5m"
          outcomes={["Yes", "No"]}
          initialOutcome={side === "YES" ? "Yes" : "No"}
          onClose={() => setQuickBuyOpen(false)}
        />
      )}
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