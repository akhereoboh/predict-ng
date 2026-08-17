"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useTheme } from "../../context/theme";
import { createChart, ColorType, LineSeries, type IChartApi, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";
import RollingNumber from "../../components/RollingNumber";

const MARKETS = [
  {
    id: "1",
    question: "Will Nigeria's inflation drop below 20% by December 2026?",
    category: "Economy",
    yesPrice: 0.34,
    noPrice: 0.66,
    volume: "240,400",
    traders: 847,
    closes: "Dec 31, 2026",
    opened: "Jan 1, 2026",
    chance: 34,
    change: -5,
    trades: "2.4k",
    description: "This market resolves YES if Nigeria's official inflation rate as published by the National Bureau of Statistics (NBS) falls below 20% before December 31, 2026.",
    resolveYes: "NBS publishes inflation below 20% before Dec 31, 2026.",
    resolveNo: "Inflation remains at or above 20% through Dec 31, 2026.",
    related: [
      { id: "4", question: "Will the naira trade below ₦1,400/$ before July 2026?", chance: 22 },
      { id: "6", question: "Will Nigeria's GDP growth exceed 4% in 2026?", chance: 61 },
    ],
  },
  {
    id: "2",
    question: "Will Peter Obi contest the 2027 presidential election?",
    category: "Politics",
    yesPrice: 0.71,
    noPrice: 0.29,
    volume: "110,200",
    traders: 412,
    closes: "Dec 31, 2026",
    opened: "Mar 1, 2026",
    chance: 71,
    change: 8,
    trades: "1.1k",
    description: "This market resolves YES if Peter Obi officially declares his candidacy for the 2027 Nigerian presidential election before December 31, 2026.",
    resolveYes: "Peter Obi officially declares candidacy before Dec 31, 2026.",
    resolveNo: "No official declaration is made before Dec 31, 2026.",
    related: [{ id: "1", question: "Will Nigeria's inflation drop below 20% by December 2026?", chance: 34 }],
  },
  {
    id: "3",
    question: "Will Nigeria win AFCON 2025?",
    category: "Sports",
    yesPrice: 0.52,
    noPrice: 0.48,
    volume: "89,000",
    traders: 1203,
    closes: "Open",
    opened: "Feb 1, 2026",
    chance: 52,
    change: 3,
    trades: "890",
    description: "This market resolves YES if Nigeria's Super Eagles win the Africa Cup of Nations 2025 tournament.",
    resolveYes: "Nigeria wins the AFCON 2025 final.",
    resolveNo: "Any other team wins AFCON 2025.",
    related: [],
  },
  {
    id: "4",
    question: "Will the naira trade below ₦1,400/$ before July 2026?",
    category: "Economy",
    yesPrice: 0.22,
    noPrice: 0.78,
    volume: "67,000",
    traders: 289,
    closes: "Jul 1, 2026",
    opened: "Jan 15, 2026",
    chance: 22,
    change: -2,
    trades: "670",
    description: "This market resolves YES if the official CBN exchange rate shows the naira trading below ₦1,400 per US dollar at any point before July 1, 2026.",
    resolveYes: "CBN rate shows naira below ₦1,400/$ before Jul 1, 2026.",
    resolveNo: "Naira stays at or above ₦1,400/$ through Jul 1, 2026.",
    related: [{ id: "1", question: "Will Nigeria's inflation drop below 20% by December 2026?", chance: 34 }],
  },
  {
    id: "5",
    question: "Will Dangote refinery hit full capacity before 2027?",
    category: "Economy",
    yesPrice: 0.45,
    noPrice: 0.55,
    volume: "54,300",
    traders: 631,
    closes: "Dec 31, 2026",
    opened: "Apr 1, 2026",
    chance: 45,
    change: 1,
    trades: "543",
    description: "This market resolves YES if the Dangote Petroleum Refinery officially announces and demonstrates full operational capacity before December 31, 2026.",
    resolveYes: "Dangote refinery reaches full capacity before Dec 31, 2026.",
    resolveNo: "Refinery does not reach full capacity before Dec 31, 2026.",
    related: [{ id: "6", question: "Will Nigeria's GDP growth exceed 4% in 2026?", chance: 61 }],
  },
  {
    id: "6",
    question: "Will Nigeria's GDP growth exceed 4% in 2026?",
    category: "Economy",
    yesPrice: 0.61,
    noPrice: 0.39,
    volume: "38,100",
    traders: 198,
    closes: "Dec 31, 2026",
    opened: "Jan 1, 2026",
    chance: 61,
    change: 4,
    trades: "381",
    description: "This market resolves YES if Nigeria's official GDP growth rate for 2026 as published by the NBS exceeds 4%.",
    resolveYes: "NBS publishes 2026 GDP growth above 4%.",
    resolveNo: "GDP growth comes in at 4% or below.",
    related: [
      { id: "1", question: "Will Nigeria's inflation drop below 20% by December 2026?", chance: 34 },
      { id: "5", question: "Will Dangote refinery hit full capacity before 2027?", chance: 45 },
    ],
  },
  {
    id: "7",
    question: "Will Dangote Cement (DANGCEM) close above ₦800 by Aug 2026?",
    category: "Stocks",
    yesPrice: 0.58,
    noPrice: 0.42,
    volume: "31,200",
    traders: 156,
    closes: "Aug 31, 2026",
    opened: "May 1, 2026",
    chance: 58,
    change: 6,
    trades: "312",
    description: "This market resolves YES if Dangote Cement PLC (DANGCEM) closes at or above ₦800 per share on the NSE on any trading day before August 31, 2026.",
    resolveYes: "DANGCEM closes at or above ₦800 on any day before Aug 31, 2026.",
    resolveNo: "DANGCEM does not reach ₦800 before Aug 31, 2026.",
    related: [{ id: "8", question: "Will MTN Nigeria (MTNN) pay a dividend above ₦10 in 2026?", chance: 73 }],
  },
  {
    id: "8",
    question: "Will MTN Nigeria (MTNN) pay a dividend above ₦10 in 2026?",
    category: "Stocks",
    yesPrice: 0.73,
    noPrice: 0.27,
    volume: "28,900",
    traders: 203,
    closes: "Dec 31, 2026",
    opened: "Jan 1, 2026",
    chance: 73,
    change: 2,
    trades: "289",
    description: "This market resolves YES if MTN Nigeria Communications PLC declares and pays a total dividend exceeding ₦10 per share in the 2026 financial year.",
    resolveYes: "MTN Nigeria pays total dividend above ₦10/share in 2026.",
    resolveNo: "Total dividend is ₦10 or below in 2026.",
    related: [{ id: "7", question: "Will Dangote Cement (DANGCEM) close above ₦800 by Aug 2026?", chance: 58 }],
  },
  {
    id: "9",
    question: "Will Airtel Africa stock rise 20%+ on LSE before year end?",
    category: "Stocks",
    yesPrice: 0.39,
    noPrice: 0.61,
    volume: "19,400",
    traders: 88,
    closes: "Dec 31, 2026",
    opened: "Jan 1, 2026",
    chance: 39,
    change: -3,
    trades: "194",
    description: "This market resolves YES if Airtel Africa PLC shares on the London Stock Exchange rise 20% or more from the January 1, 2026 opening price before December 31, 2026.",
    resolveYes: "Airtel Africa LSE price rises 20%+ from Jan 1, 2026 open.",
    resolveNo: "Price does not reach 20% gain before Dec 31, 2026.",
    related: [{ id: "7", question: "Will Dangote Cement (DANGCEM) close above ₦800 by Aug 2026?", chance: 58 }],
  },
];

const CHART_POINTS = [42, 45, 38, 50, 48, 55, 52, 49, 53, 58, 54, 51, 48, 44, 40, 38, 35, 37, 34];

function MiniChart({ accent }: { accent: string }) {
  const points = CHART_POINTS.map((p, i) => {
    const x = (i / (CHART_POINTS.length - 1)) * 600;
    const y = 120 - (p / 100) * 120;
    return `${x},${y}`;
  }).join(" ");
  const areaPoints = `0,120 ${points} 600,120`;
  const color = accent.includes("yellow") ? "#eab308" : "#3b82f6";

  return (
    <svg viewBox="0 0 600 120" className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#cg)" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <circle cx={(18 / 18) * 600} cy={120 - (34 / 100) * 120} r="4" fill={color} />
    </svg>
  );
}

const SAMPLE_COMMENTS = [
  { user: "Adaeze_K", time: "2m ago", text: "Nigeria needs serious monetary reforms for this to resolve YES. CBN has been printing money nonstop.", likes: 4 },
  { user: "Emeka_trades", time: "15m ago", text: "The trend is going the wrong way. I'm holding NO on this one.", likes: 2 },
  { user: "FatimahB", time: "1h ago", text: "Anyone else watching the NBS report next week? Could be the catalyst.", likes: 7 },
];

const TOP_HOLDERS = [
  { user: "Chidi_V", side: "YES", contracts: 420, value: "e142.80" },
  { user: "Ngozi_M", side: "NO", contracts: 380, value: "e250.80" },
  { user: "Adaeze_K", side: "YES", contracts: 210, value: "e71.40" },
  { user: "Kunle_F", side: "NO", contracts: 180, value: "e118.80" },
];

export default function MarketPage() {
  const { theme, toggleTheme, t, login, signup, authError, authLoading, isLoggedIn, getValidToken, refreshPortfolio } = useTheme();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const market = MARKETS.find((m) => m.id === id) || MARKETS[0];

  const [side, setSide] = useState<"YES" | "NO">("YES");
  const searchParams = useSearchParams();
  useEffect(() => {
    const requestedSide = searchParams.get("side");
    if (requestedSide !== "YES" && requestedSide !== "NO") return;
    const id = requestAnimationFrame(() => setSide(requestedSide));
    return () => cancelAnimationFrame(id);
  }, [searchParams]);
  const [amount, setAmount] = useState(5);
  const [period, setPeriod] = useState("1W");
  const [orderBookOpen, setOrderBookOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [editing, setEditing] = useState(false);
  const [customAmounts, setCustomAmounts] = useState([1000, 5000, 7000]);
  const [activeTab, setActiveTab] = useState("Comments");
  const [comment, setComment] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authView, setAuthView] = useState<"choice" | "login" | "signup">("choice");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authUsername, setAuthUsername] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [signupMessage, setSignupMessage] = useState<string | null>(null);

  // --- REAL BACKEND MARKETS (e.g. football matches) ---
  // The static MARKETS array above is mock data for the original design
  // pass. Any id that ISN'T in that array is treated as a real market
  // fetched from the backend, with a real chart and real trade execution --
  // this branch renders entirely separately below, so the existing static
  // page (already working, already approved) isn't touched or put at risk.
  const isRealMarket = !MARKETS.some((m) => m.id === id);

  type RealMarket = {
    id: string;
    question: string;
    status: string;
    winner: string | null;
    price_yes: number;
    price_no: number;
    prices?: Record<string, number>;  // present for multi-outcome markets instead of price_yes/price_no
    market_type: string;
    close_at: string | null;
  };

  const [realMarket, setRealMarket] = useState<RealMarket | null>(null);
  const [realIsClosed, setRealIsClosed] = useState(false);
  const [chartTradeCount, setChartTradeCount] = useState(0);
  const [orderBookLiquidity] = useState(() => ({
    yes: [0.33, 0.32, 0.31, 0.30].map((p) => ({ p, qty: Math.floor(Math.random() * 500 + 100) })),
    no: [0.67, 0.68, 0.69, 0.70].map((p) => ({ p, qty: Math.floor(Math.random() * 500 + 100) })),
  }));
  const [realTradeStatus, setRealTradeStatus] = useState<{ loading: boolean; error: string | null; success: string | null }>({ loading: false, error: null, success: null });
  const [selectedRealOutcome, setSelectedRealOutcome] = useState<string | null>(null);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);          // binary markets: one line
  const multiSeriesRef = useRef<Map<string, ISeriesApi<"Line">>>(new Map()); // multi-outcome: one line per outcome
  const multiLabelRefs = useRef<Map<string, HTMLDivElement>>(new Map());     // floating name+% labels, one per outcome
  // Two invisible series with a single point each, always kept at 20 and
  // 80. Auto-scale considers every series' data when computing bounds, so
  // these force the visible range to never be narrower than 20-80% --
  // matching how Polymarket's own charts never show a razor-thin band
  // around 50% -- while still letting the range grow further if real
  // trading genuinely pushes prices outside 20-80.
  const anchorTopRef = useRef<ISeriesApi<"Line"> | null>(null);
  const anchorBottomRef = useRef<ISeriesApi<"Line"> | null>(null);
  const [chartReady, setChartReady] = useState(false);
  const [multiSeriesCreated, setMultiSeriesCreated] = useState(false);
  const POLL_MS = 5000;
  // Smooth glide, same technique as the BTC page: each real poll sets a
  // new "last" target and shifts the old "last" into "prev". A separate,
  // much faster loop below interpolates between them continuously instead
  // of the line jumping the instant new data arrives every 5 seconds.
  const prevBinaryRef = useRef<{ value: number; time: number } | null>(null);
  const lastBinaryRef = useRef<{ value: number; time: number } | null>(null);
  const prevMultiRef = useRef<{ prices: Record<string, number>; time: number } | null>(null);
  const lastMultiRef = useRef<{ prices: Record<string, number>; time: number } | null>(null);

  // Same hash-based color system used on the homepage cards, so a team's
  // line color here matches its color on the card you clicked in from.
  const MUTED_COLORS = ["#C2410C", "#991B1B", "#1E40AF", "#047857", "#6B21A8", "#9F1239", "#155E75", "#B45309", "#115E59", "#3730A3", "#3F6212", "#A21CAF"];
  const hashIndex = (str: string, mod: number) => {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h % mod;
  };
  const colorForOutcome = (name: string, index: number, startName: string) => {
    if (name.toLowerCase() === "draw") return theme === "dark" ? "#71717A" : "#94A3B8";
    const startIdx = hashIndex(startName, MUTED_COLORS.length);
    return MUTED_COLORS[(startIdx + index) % MUTED_COLORS.length];
  };
  // Same system for binary YES/NO markets, matching the homepage cards --
  // hashed off the market's own id (not the literal "YES"/"NO" strings,
  // which never change and would give every binary market the identical
  // pair). Only the BTC page keeps fixed green/red.
  const binYesColor = (marketId: string) => MUTED_COLORS[hashIndex(marketId, MUTED_COLORS.length)];
  const binNoColor = (marketId: string) => MUTED_COLORS[(hashIndex(marketId, MUTED_COLORS.length) + 1) % MUTED_COLORS.length];

  // Create the chart once, only when this is actually a real market.
  useEffect(() => {
    if (!isRealMarket || !chartContainerRef.current) return;
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 260,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: theme === "dark" ? "#666666" : "#94A3B8",
        fontSize: 10,
        attributionLogo: false,
      },
      grid: {
        horzLines: { color: theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" },
        vertLines: { visible: false },
      },
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.08, bottom: 0.08 } },
      timeScale: { borderVisible: false, timeVisible: true },
      crosshair: { horzLine: { visible: false }, vertLine: { visible: false } },
      handleScroll: false,
      handleScale: false,
    });
    // NOTE: an earlier attempt to hard-lock this to a 0-100 range via
    // autoScale:false + setVisibleRange() actually broke the axis (it
    // rendered 0-120 instead of a clean 0-100, and made the grid lines
    // render bright instead of faint). Reverted to the standard, safe
    // approach: real autoScale, with generous top/bottom margins so a
    // fresh 50/50 market still shows with real headroom instead of a
    // razor-thin auto-zoomed sliver.
    const series = chart.addSeries(LineSeries, {
      color: "#CCFF00",
      lineWidth: 2,
      priceLineVisible: true,
      priceLineColor: "#CCFF00",
      lastValueVisible: true,
      crosshairMarkerVisible: false,
    });
    chartApiRef.current = chart;
    seriesRef.current = series;
    const multiSeriesMap = multiSeriesRef.current;

    const now0 = Math.floor(Date.now() / 1000) as UTCTimestamp;
    const anchorTop = chart.addSeries(LineSeries, { color: "transparent", lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
    const anchorBottom = chart.addSeries(LineSeries, { color: "transparent", lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
    anchorTop.setData([{ time: now0, value: 80 }]);
    anchorBottom.setData([{ time: now0, value: 20 }]);
    anchorTopRef.current = anchorTop;
    anchorBottomRef.current = anchorBottom;

    setChartReady(true);

    const handleResize = () => {
      if (chartContainerRef.current) chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartApiRef.current = null;
      seriesRef.current = null;
      anchorTopRef.current = null;
      anchorBottomRef.current = null;
      multiSeriesMap.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRealMarket]);

  // Multi-outcome markets: once we know the real outcome names (from the
  // first poll), create one line series per outcome, each colored to
  // match its card color. Built-in price-line labels are OFF here --
  // that style is a small colored badge, not the reference's floating
  // "Name / big bold %" label. That's built as a custom HTML overlay
  // below, positioned via the chart's own coordinate conversion (same
  // technique as the BTC page's radar-blip marker).
  useEffect(() => {
    if (!chartReady || !chartApiRef.current || !realMarket?.prices) return;
    if (multiSeriesRef.current.size > 0) return; // already created
    const names = Object.keys(realMarket.prices);
    names.forEach((name, i) => {
      const color = colorForOutcome(name, i, names[0]);
      const s = chartApiRef.current!.addSeries(LineSeries, {
        color,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      multiSeriesRef.current.set(name, s);
    });
    setMultiSeriesCreated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartReady, realMarket?.prices]);

  // Load the market's real trade history into the chart once it's ready --
  // this is the "graphs and all that thing" showing how the odds actually
  // moved as real people traded, using GET /markets/{id}/chart. Runs
  // exactly ONCE per market (the hasLoadedHistoryRef guard), not on every
  // 5-second poll -- it used to re-trigger on every poll because
  // realMarket?.prices is a brand new object reference each time, which
  // was re-fetching and re-calling setData() repeatedly, visibly
  // "rebuilding" the chart instead of drawing history in once.
  const hasLoadedHistoryRef = useRef(false);
  useEffect(() => {
    if (!isRealMarket || !chartReady) return;
    if (!realMarket) return; // wait until we actually know the market type
    if (realMarket.prices && !multiSeriesCreated) return; // multi-outcome: also wait for series to exist
    if (hasLoadedHistoryRef.current) return;
    hasLoadedHistoryRef.current = true;
    (async () => {
      try {
        const res = await fetch(`https://sireai.uk/pm-api/markets/${id}/chart`, { cache: "no-store" });
        if (!res.ok) return;
        const rows: { created_at: string; price_yes_after?: number; outcome_prices_after?: Record<string, number> }[] = await res.json();
        setChartTradeCount(rows.length);

        if (rows.length > 0 && rows[0].outcome_prices_after) {
          const pointsByOutcome = new Map<string, { time: UTCTimestamp; value: number }[]>();
          for (const r of rows) {
            if (!r.outcome_prices_after) continue;
            const t2 = Math.floor(new Date(r.created_at).getTime() / 1000) as UTCTimestamp;
            for (const [name, price] of Object.entries(r.outcome_prices_after)) {
              const arr = pointsByOutcome.get(name) ?? [];
              if (arr.length && arr[arr.length - 1].time === t2) {
                arr[arr.length - 1] = { time: t2, value: price };
              } else {
                arr.push({ time: t2, value: price });
              }
              pointsByOutcome.set(name, arr);
            }
          }
          for (const [name, points] of pointsByOutcome) {
            if (points.length > 0) multiSeriesRef.current.get(name)?.setData(points);
          }
          return;
        }

        if (!seriesRef.current) return;
        const points: { time: UTCTimestamp; value: number }[] = [];
        for (const r of rows) {
          if (r.price_yes_after == null) continue;
          const t2 = Math.floor(new Date(r.created_at).getTime() / 1000) as UTCTimestamp;
          // lightweight-charts requires strictly increasing time -- if two
          // trades landed in the same second, keep the later one's price.
          if (points.length && points[points.length - 1].time === t2) {
            points[points.length - 1] = { time: t2, value: r.price_yes_after };
          } else {
            points.push({ time: t2, value: r.price_yes_after });
          }
        }
        if (points.length > 0) seriesRef.current?.setData(points);
      } catch {
        // chart just stays empty on a failed fetch -- not critical
        hasLoadedHistoryRef.current = false; // allow retry on next relevant re-render
      }
    })();
  }, [isRealMarket, chartReady, id, realMarket, multiSeriesCreated]);

  // Poll the live market state -- records the new target for the glide
  // loop below to interpolate toward, rather than updating the chart
  // directly (which is what caused it to jump instead of glide).
  useEffect(() => {
    if (!isRealMarket) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`https://sireai.uk/pm-api/markets/${id}`, { cache: "no-store" });
        if (!res.ok) return;
        const data: RealMarket = await res.json();
        if (cancelled) return;
        setRealMarket(data);
        setRealIsClosed(data.status !== "OPEN" || (!!data.close_at && new Date(data.close_at).getTime() <= Date.now()));
        const nowMs = Date.now();
        if (data.prices) {
          prevMultiRef.current = lastMultiRef.current ?? { prices: data.prices, time: nowMs };
          lastMultiRef.current = { prices: data.prices, time: nowMs };
        } else {
          prevBinaryRef.current = lastBinaryRef.current ?? { value: data.price_yes, time: nowMs };
          lastBinaryRef.current = { value: data.price_yes, time: nowMs };
        }
      } catch {
        // keep showing the last known state on a blip
      }
    };
    poll();
    const intervalId = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [isRealMarket, id]);

  // The actual glide -- runs far more often than the poll, so the line
  // (and its label) moves continuously toward each new real price instead
  // of jumping the instant a new poll lands. Anchors also get refreshed
  // here so their timestamp always keeps up with the moving time axis.
  useEffect(() => {
    if (!isRealMarket) return;
    const id = setInterval(() => {
      if (!chartApiRef.current) return;
      const now = (Date.now() / 1000) as UTCTimestamp;
      anchorTopRef.current?.update({ time: now, value: 80 });
      anchorBottomRef.current?.update({ time: now, value: 20 });

      if (lastMultiRef.current) {
        const prev = prevMultiRef.current ?? lastMultiRef.current;
        const last = lastMultiRef.current;
        const frac = Math.min(1, Math.max(0, (Date.now() - last.time) / POLL_MS));
        const realPrices: Record<string, number> = {};
        for (const name of Object.keys(last.prices)) {
          const p = prev.prices[name] ?? last.prices[name];
          realPrices[name] = p + (last.prices[name] - p) * frac;
        }

        // Same minimum-visual-separation logic as before, just now
        // computed every glide tick against the interpolated values
        // instead of once per discrete poll.
        const MIN_VALUE_GAP = 20;
        const sorted = Object.entries(realPrices).sort((a, b) => a[1] - b[1]);
        const displayValue = new Map<string, number>();
        sorted.forEach(([name, price]) => displayValue.set(name, price));
        const values = sorted.map(([, p]) => p);
        const requiredSpan = MIN_VALUE_GAP * (sorted.length - 1);
        const actualSpan = values[values.length - 1] - values[0];
        if (actualSpan < requiredSpan) {
          const avg = values.reduce((a, b) => a + b, 0) / values.length;
          const startValue = avg - requiredSpan / 2;
          sorted.forEach(([name], i) => displayValue.set(name, startValue + i * MIN_VALUE_GAP));
        }

        const positions: { name: string; x: number; y: number }[] = [];
        for (const [name, realPrice] of Object.entries(realPrices)) {
          const s = multiSeriesRef.current.get(name);
          s?.update({ time: now, value: displayValue.get(name) ?? realPrice });
          const labelEl = multiLabelRefs.current.get(name);
          if (labelEl) {
            const pctEl = labelEl.querySelector<HTMLElement>("[data-pct]");
            // The real, last-polled value -- not the interpolated one --
            // so the number only changes once per real poll (~5s) instead
            // of flickering on every glide tick. The line and the label's
            // position still move smoothly; only this text is throttled.
            if (pctEl) pctEl.textContent = `${Math.floor(last.prices[name])}%`;
          }
          if (s && labelEl) {
            const x = chartApiRef.current.timeScale().timeToCoordinate(now);
            const y = s.priceToCoordinate(displayValue.get(name) ?? realPrice);
            if (x != null && y != null) {
              positions.push({ name, x, y });
            } else {
              labelEl.style.visibility = "hidden";
            }
          }
        }
        const MIN_LABEL_GAP = 34;
        positions.sort((a, b) => a.y - b.y);
        for (let i = 1; i < positions.length; i++) {
          const gap = positions[i].y - positions[i - 1].y;
          if (gap < MIN_LABEL_GAP) positions[i].y = positions[i - 1].y + MIN_LABEL_GAP;
        }
        for (const { name, x, y } of positions) {
          const labelEl = multiLabelRefs.current.get(name);
          if (!labelEl) continue;
          labelEl.style.left = `${x + 8}px`;
          labelEl.style.top = `${y}px`;
          labelEl.style.visibility = "visible";
        }
      } else if (lastBinaryRef.current && seriesRef.current) {
        const prev = prevBinaryRef.current ?? lastBinaryRef.current;
        const last = lastBinaryRef.current;
        const frac = Math.min(1, Math.max(0, (Date.now() - last.time) / POLL_MS));
        const interpolated = prev.value + (last.value - prev.value) * frac;
        seriesRef.current.update({ time: now, value: interpolated });
      }
    }, 65);
    return () => clearInterval(id);
  }, [isRealMarket]);

  useEffect(() => {
    if (!realMarket?.prices || selectedRealOutcome) return;
    const firstOutcome = Object.keys(realMarket.prices)[0];
    const id = requestAnimationFrame(() => setSelectedRealOutcome(firstOutcome));
    return () => cancelAnimationFrame(id);
  }, [realMarket?.prices, selectedRealOutcome]);

  const handleRealMultiBuy = async () => {
    if (!realMarket || !selectedRealOutcome || !realMarket.prices) return;
    if (!isLoggedIn) { setShowAuthModal(true); return; }
    const priceFraction = (realMarket.prices[selectedRealOutcome] ?? 100 / Object.keys(realMarket.prices).length) / 100;
    const estContracts = Math.max(1, Math.round(amount / priceFraction));
    setRealTradeStatus({ loading: true, error: null, success: null });
    try {
      const token = await getValidToken();
      if (!token) {
        setShowAuthModal(true);
        setRealTradeStatus({ loading: false, error: null, success: null });
        return;
      }
      const res = await fetch("https://sireai.uk/pm-api/trade/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ market_id: realMarket.id, outcome: selectedRealOutcome, contracts: estContracts }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRealTradeStatus({ loading: false, error: data.detail || "Trade failed", success: null });
        return;
      }
      setRealTradeStatus({ loading: false, error: null, success: `Bought ${estContracts} ${selectedRealOutcome} for ₦${data.paid_naira.toFixed(2)}` });
      await refreshPortfolio();
      setRealMarket((prev) => prev && ({ ...prev, prices: data.prices }));
      setTimeout(() => setRealTradeStatus({ loading: false, error: null, success: null }), 4000);
    } catch {
      setRealTradeStatus({ loading: false, error: "Network error — try again", success: null });
    }
  };

  const handleRealBuy = async () => {
    if (!realMarket) return;
    if (!isLoggedIn) { setShowAuthModal(true); return; }
    const priceFraction = (side === "YES" ? realMarket.price_yes : realMarket.price_no) / 100;
    const estContracts = Math.max(1, Math.round(amount / priceFraction));
    setRealTradeStatus({ loading: true, error: null, success: null });
    try {
      const token = await getValidToken();
      if (!token) {
        setShowAuthModal(true);
        setRealTradeStatus({ loading: false, error: null, success: null });
        return;
      }
      const res = await fetch("https://sireai.uk/pm-api/trade/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ market_id: realMarket.id, outcome: side, contracts: estContracts }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRealTradeStatus({ loading: false, error: data.detail || "Trade failed", success: null });
        return;
      }
      setRealTradeStatus({ loading: false, error: null, success: `Bought ${estContracts} ${side} for ₦${data.paid_naira.toFixed(2)}` });
      await refreshPortfolio();
      setRealMarket((prev) => prev && ({ ...prev, price_yes: data.price_yes, price_no: data.price_no }));
      setTimeout(() => setRealTradeStatus({ loading: false, error: null, success: null }), 4000);
    } catch {
      setRealTradeStatus({ loading: false, error: "Network error — try again", success: null });
    }
  };

  const price = realMarket?.prices
    ? (realMarket.prices[selectedRealOutcome ?? Object.keys(realMarket.prices)[0]] ?? 100 / Object.keys(realMarket.prices).length) / 100
    : isRealMarket && realMarket ? (side === "YES" ? realMarket.price_yes : realMarket.price_no) / 100 : (side === "YES" ? market.yesPrice : market.noPrice);
  const payout = (amount / price).toFixed(2);
  const fee = (amount * 0.02).toFixed(2);

  const categoryColor = (cat: string) => {
    if (theme === "dark") {
      if (cat === "Economy") return "bg-amber-900/40 text-amber-400";
      if (cat === "Politics") return "bg-purple-900/40 text-purple-400";
      if (cat === "Sports") return "bg-[#CCFF00]/10 text-[#CCFF00]";
      return "bg-emerald-900/40 text-emerald-400";
    }
    if (cat === "Economy") return "bg-amber-100 text-amber-800";
    if (cat === "Politics") return "bg-purple-100 text-purple-800";
    if (cat === "Sports") return "bg-blue-100 text-blue-700";
    return "bg-emerald-100 text-emerald-700";
  };

  if (isRealMarket) {
    const price = realMarket?.prices
      ? (realMarket.prices[selectedRealOutcome ?? Object.keys(realMarket.prices)[0]] ?? 100 / Object.keys(realMarket.prices).length) / 100
      : realMarket ? (side === "YES" ? realMarket.price_yes : realMarket.price_no) / 100 : 0.5;
    const payout = price > 0 ? (amount / price).toFixed(2) : "0.00";
    const fee = (amount * 0.02).toFixed(2);
    const kickoffEstimate = realMarket?.close_at ? new Date(new Date(realMarket.close_at).getTime() - 10 * 60 * 1000) : null;

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
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${theme === "dark" ? "bg-[#CCFF00]/10 text-[#CCFF00]" : "bg-blue-100 text-blue-700"}`}>Football</span>
            <h1 className={`text-xl font-bold ${t.textPrimary} mt-2 leading-snug`}>{realMarket ? realMarket.question : "Loading match…"}</h1>
          </div>

          {/* CHANCE */}
          <div className="flex items-center gap-3 mb-4">
            <div>
              {realMarket?.prices ? (() => {
                const entries = Object.entries(realMarket.prices!);
                const leading = entries.reduce((a, b) => (b[1] > a[1] ? b : a), entries[0]);
                return (
                  <div className="flex items-baseline gap-2">
                    <RollingNumber text={`${leading[1].toFixed(0)}%`} color={theme === "dark" ? "#FFFFFF" : "#000000"} className="text-3xl font-bold" />
                    <span className={`text-sm ${t.textMuted}`}>{leading[0]}</span>
                  </div>
                );
              })() : realMarket ? (
                <RollingNumber text={`${realMarket.price_yes.toFixed(0)}%`} color={theme === "dark" ? "#FFFFFF" : "#000000"} className="text-3xl font-bold" />
              ) : (
                <div className={`text-3xl font-bold ${t.textPrimary}`}>—</div>
              )}
              <div className={`text-xs ${t.textMuted} uppercase tracking-wide`}>Chance</div>
            </div>
            {realIsClosed && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${t.inputBg} ${t.textMuted}`}>
                {realMarket?.status === "RESOLVED" ? `Resolved: ${realMarket.winner}` : "Trading closed"}
              </span>
            )}
          </div>

          {/* YES/NO PILL (binary) or OUTCOME PILL (multi-outcome) */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {realMarket?.prices ? (
              Object.keys(realMarket.prices).map((name, i) => {
                const outcomeNames = Object.keys(realMarket.prices!);
                const color = colorForOutcome(name, i, outcomeNames[0]);
                const isSelected = selectedRealOutcome === name;
                return (
                  <button
                    key={name}
                    onClick={() => setSelectedRealOutcome(name)}
                    style={isSelected ? { backgroundColor: color } : undefined}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium border cursor-pointer transition-colors ${
                      isSelected ? "border-transparent text-white" : `${t.navBg} ${t.border} ${t.textMuted}`
                    }`}
                  >
                    {name}
                  </button>
                );
              })
            ) : (
              ["Yes", "No"].map((s) => (
                <button key={s} onClick={() => setSide(s.toUpperCase() as "YES" | "NO")}
                  style={side === s.toUpperCase() && realMarket ? { backgroundColor: s === "Yes" ? binYesColor(realMarket.id) : binNoColor(realMarket.id) } : undefined}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border cursor-pointer transition-colors ${
                    side === s.toUpperCase() ? "border-transparent text-white" : `${t.navBg} ${t.border} ${t.textMuted}`
                  }`}
                >{s}</button>
              ))
            )}
          </div>

          {/* CHART */}
          <div className={`${t.cardBg} border ${t.border} rounded-xl p-4 mb-4 shadow-sm`}>
            <div style={{ height: 280, position: "relative" }} className="mb-3">
              {!chartReady && (
                <div className={`h-full flex items-center justify-center text-sm ${t.textMuted}`}>Loading chart…</div>
              )}
              <div ref={chartContainerRef} style={{ width: "100%", height: "100%" }} />
              {realMarket?.prices && Object.keys(realMarket.prices).map((name, i) => {
                const outcomeNames = Object.keys(realMarket.prices!);
                const color = colorForOutcome(name, i, outcomeNames[0]);
                return (
                  <div
                    key={name}
                    // eslint-disable-next-line react-hooks/refs -- storing a DOM ref for later use in the polling effect, not reading render-time state
                    ref={(el) => { if (el) multiLabelRefs.current.set(name, el); else multiLabelRefs.current.delete(name); }}
                    style={{ position: "absolute", visibility: "hidden", transform: "translateY(-50%)", pointerEvents: "none", zIndex: 10 }}
                  >
                    <div className="text-xs" style={{ color }}>{name}</div>
                    <div data-pct className="text-lg font-bold leading-tight" style={{ color }}>{Math.floor(realMarket.prices![name])}%</div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-3 text-xs ${t.textMuted}`}>
                <span>{chartTradeCount} Trades</span>
                <span className={`w-px h-3 ${theme === "dark" ? "bg-zinc-700" : "bg-slate-200"}`} />
                <span>{realMarket?.close_at ? new Date(realMarket.close_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—"}</span>
              </div>
              <div className="flex gap-1">
                {["1Y", "1M", "1W", "1D", "12H"].map((p) => (
                  <button key={p} onClick={() => setPeriod(p)}
                    className={`text-xs px-2 py-1 rounded cursor-pointer border-none transition-colors ${
                      period === p ? `${t.accent} text-white font-medium` : `bg-transparent ${t.textMuted}`
                    }`}
                  >{p}</button>
                ))}
              </div>
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
                    <p className="text-xs font-medium text-emerald-500 mb-2">YES Bids</p>
                    {orderBookLiquidity.yes.map((row) => (
                      <div key={row.p} className={`flex justify-between text-xs ${t.textMuted} py-1 border-b ${t.borderLight}`}>
                        <span className="text-emerald-500 font-medium">₦{row.p.toFixed(2)}</span>
                        <span>{row.qty}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#6B0D0D] mb-2">NO Bids</p>
                    {orderBookLiquidity.no.map((row) => (
                      <div key={row.p} className={`flex justify-between text-xs ${t.textMuted} py-1 border-b ${t.borderLight}`}>
                        <span className="text-[#6B0D0D] font-medium">₦{row.p.toFixed(2)}</span>
                        <span>{row.qty}</span>
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
              This market resolves based on the real result of this football match. Trading closes automatically shortly after kickoff, and the result is confirmed and finalized manually by an admin once the match has ended.
            </p>
            <p className={`text-sm ${t.textMuted} mb-1`}>
              This market will resolve as <span className={`${t.accentText} font-medium`}>Yes</span> if the home team wins.
            </p>
            <p className={`text-sm ${t.textMuted} mb-3`}>
              It will resolve as <span className="text-[#6B0D0D] font-medium">No</span> if the away team wins, or the match is a draw.
            </p>
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
                  { label: "Kickoff", date: kickoffEstimate ? kickoffEstimate.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—", done: true },
                  { label: "Trading Closes", date: realMarket?.close_at ? new Date(realMarket.close_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—", done: !!realIsClosed },
                  { label: "Payout", date: "Shortly after the match ends and an admin confirms the result", done: realMarket?.status === "RESOLVED" },
                ].map((step, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="flex flex-col items-center">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${step.done ? "border-emerald-500 bg-emerald-500" : `${t.border} ${t.navBg}`}`}>
                        {step.done && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      {i < 2 && <div className={`w-px h-6 ${theme === "dark" ? "bg-zinc-700" : "bg-slate-200"} mt-1`} />}
                    </div>
                    <div className="pb-4">
                      <p className={`text-sm font-medium ${step.done ? "text-emerald-500" : t.textPrimary}`}>{step.label}</p>
                      <p className={`text-xs ${t.textMuted}`}>{step.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* FIXED BOTTOM */}
        <div className="fixed bottom-0 left-0 right-0 z-20">
          <div className={`${t.navBg} border-t ${t.border} shadow-lg`}>
            <div className="max-w-2xl mx-auto px-4 pt-3 pb-2">
              {realTradeStatus.error && <p className="text-xs text-red-500 mb-1 text-center">{realTradeStatus.error}</p>}
              {realTradeStatus.success && <p className="text-xs text-green-500 mb-1 text-center">{realTradeStatus.success}</p>}

              {realMarket?.prices ? (
                <div className="flex gap-2 mb-2 flex-wrap">
                  {Object.entries(realMarket.prices).map(([name, p], i) => {
                    const outcomeNames = Object.keys(realMarket.prices!);
                    const color = colorForOutcome(name, i, outcomeNames[0]);
                    const isSelected = selectedRealOutcome === name;
                    return (
                      <button
                        key={name}
                        onClick={() => setSelectedRealOutcome(name)}
                        style={isSelected ? { backgroundColor: color } : undefined}
                        className={`flex-1 h-12 rounded-xl text-sm font-bold border-none cursor-pointer transition-colors whitespace-nowrap px-2 ${
                          isSelected ? "text-white" : `${t.inputBg} ${t.textMuted}`
                        }`}
                      >
                        <RollingNumber text={`${name} ₦${(p / 100).toFixed(2)}`} color={isSelected ? "#FFFFFF" : (theme === "dark" ? "#A1A1AA" : "#64748B")} />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex gap-2 mb-2">
                  <button onClick={() => setSide("YES")}
                    style={side === "YES" && realMarket ? { backgroundColor: binYesColor(realMarket.id) } : undefined}
                    className={`flex-1 h-12 rounded-xl text-sm font-bold border-none cursor-pointer transition-colors ${
                      side === "YES" ? "text-white" : `${t.inputBg} ${t.textMuted}`
                    }`}
                  >
                    <RollingNumber text={`${realMarket?.market_type === "BTC_5MIN" ? "Up" : "Yes"} ₦${realMarket ? (realMarket.price_yes / 100).toFixed(2) : "0.50"}`} color={side === "YES" ? "#FFFFFF" : (theme === "dark" ? "#A1A1AA" : "#64748B")} />
                  </button>
                  <button onClick={() => setSide("NO")}
                    style={side === "NO" && realMarket ? { backgroundColor: binNoColor(realMarket.id) } : undefined}
                    className={`flex-1 h-12 rounded-xl text-sm font-bold border-none cursor-pointer transition-colors ${
                      side === "NO" ? "text-white" : `${t.inputBg} ${t.textMuted}`
                    }`}
                  >
                    <RollingNumber text={`${realMarket?.market_type === "BTC_5MIN" ? "Down" : "No"} ₦${realMarket ? (realMarket.price_no / 100).toFixed(2) : "0.50"}`} color={side === "NO" ? "#FFFFFF" : (theme === "dark" ? "#A1A1AA" : "#64748B")} />
                  </button>
                </div>
              )}

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
                  {customAmounts.map((a) => {
                    const isActive = amount === a;
                    const dynamicColor = realMarket?.prices && selectedRealOutcome
                      ? colorForOutcome(selectedRealOutcome, Object.keys(realMarket.prices).indexOf(selectedRealOutcome), Object.keys(realMarket.prices)[0])
                      : realMarket ? (side === "YES" ? binYesColor(realMarket.id) : binNoColor(realMarket.id)) : null;
                    return (
                      <button key={a} onClick={() => setAmount(a)}
                        style={isActive && dynamicColor ? { backgroundColor: dynamicColor } : undefined}
                        className={`flex-1 rounded-xl py-3 cursor-pointer border-none transition-colors flex flex-col items-center gap-0.5 ${
                          isActive
                            ? dynamicColor
                              ? "text-white"
                              : `${t.amountActive} ${t.amountActiveText}`
                            : `${t.inputBg} ${t.textPrimary}`
                        }`}
                      >
                        <span className="text-sm font-bold">₦{a}</span>
                        <span className={`text-xs ${isActive ? (dynamicColor ? "text-white/80" : t.amountActiveSub) : "text-emerald-500"}`}>
                          win ₦{price > 0 ? (a / price).toFixed(0) : "0"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="text-center py-1 mb-1">
                <span className={`text-xs ${t.textMuted}`}>Potential win if {realMarket?.prices ? selectedRealOutcome : side}: </span>
                <span className={`text-sm font-bold ${t.accentText}`}>₦{payout}</span>
                <span className={`text-xs ${t.textMuted}`}> · Fee: ₦{fee}</span>
              </div>

              {!realIsClosed && (
                <button
                  onClick={() => {
                    if (!isLoggedIn) { setShowAuthModal(true); return; }
                    if (realMarket?.prices) handleRealMultiBuy(); else handleRealBuy();
                  }}
                  disabled={realTradeStatus.loading}
                  style={
                    realMarket?.prices && selectedRealOutcome
                      ? { backgroundColor: colorForOutcome(selectedRealOutcome, Object.keys(realMarket.prices).indexOf(selectedRealOutcome), Object.keys(realMarket.prices)[0]) }
                      : realMarket
                        ? { backgroundColor: side === "YES" ? binYesColor(realMarket.id) : binNoColor(realMarket.id) }
                        : undefined
                  }
                  className={`w-full h-11 rounded-xl text-sm font-bold border-none cursor-pointer disabled:opacity-50 ${
                    realMarket ? "text-white" : `${t.accent} text-white`
                  }`}
                >
                  {!isLoggedIn ? "Sign in to trade" : realTradeStatus.loading ? "…" : `Confirm buy ${realMarket?.prices ? selectedRealOutcome : side}`}
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
              <button key={item.label} onClick={() => { if (item.icon === "home") router.push("/"); if (item.icon === "breaking") router.push("/breaking"); if (item.icon === "search") router.push("/?search=1"); }}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowAuthModal(false)}>
            <div className={`${t.cardBg} border ${t.border} rounded-2xl p-6 w-80 shadow-2xl`} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2 mb-5 justify-center">
                <span className="w-7 h-7 rounded-md bg-[#CCFF00] flex items-center justify-center text-black text-sm font-black italic">E</span>
                <span className={`text-base font-bold ${t.textPrimary}`}>Eris</span>
              </div>
              {authView === "choice" && (
                <>
                  <h2 className={`text-lg font-bold ${t.textPrimary} text-center mb-4`}>Sign in to trade</h2>
                  <button onClick={() => setAuthView("login")} className={`w-full py-2.5 rounded-xl font-semibold text-sm mb-2 border-none cursor-pointer ${theme === "dark" ? "bg-white text-black" : "bg-black text-white"}`}>Log in</button>
                  <button onClick={() => setAuthView("signup")} className={`w-full py-2.5 rounded-xl font-semibold text-sm border ${t.border} ${t.textPrimary} cursor-pointer bg-transparent`}>Create account</button>
                </>
              )}
              {authView === "login" && (
                <>
                  {authError && <p className="text-xs text-red-500 text-center mb-2">{authError}</p>}
                  <input type="email" placeholder="Email" value={authUsername} onChange={(e) => setAuthUsername(e.target.value)} className={`w-full px-3 py-2.5 rounded-xl text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none mb-2`} />
                  <input type="password" placeholder="Password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className={`w-full px-3 py-2.5 rounded-xl text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none mb-3`} />
                  <button
                    onClick={async () => { const ok = await login(authUsername, authPassword); if (ok) { setShowAuthModal(false); setAuthView("choice"); setAuthUsername(""); setAuthPassword(""); } }}
                    disabled={authLoading}
                    className={`w-full py-2.5 rounded-xl font-semibold text-sm border-none cursor-pointer disabled:opacity-50 ${theme === "dark" ? "bg-white text-black" : "bg-black text-white"}`}
                  >
                    {authLoading ? "…" : "Log in"}
                  </button>
                </>
              )}
              {authView === "signup" && (
                <>
                  {signupMessage && <p className="text-xs text-green-500 text-center mb-2">{signupMessage}</p>}
                  {authError && <p className="text-xs text-red-500 text-center mb-2">{authError}</p>}
                  <input type="email" placeholder="Email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className={`w-full px-3 py-2.5 rounded-xl text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none mb-2`} />
                  <input type="password" placeholder="Password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className={`w-full px-3 py-2.5 rounded-xl text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none mb-3`} />
                  <button
                    onClick={async () => { const res = await signup(authEmail, authPassword); if (res.ok) { setSignupMessage("Check your email to confirm your account, then log in."); setAuthView("login"); setAuthEmail(""); setAuthPassword(""); } }}
                    disabled={authLoading}
                    className={`w-full py-2.5 rounded-xl font-semibold text-sm border-none cursor-pointer disabled:opacity-50 ${theme === "dark" ? "bg-white text-black" : "bg-black text-white"}`}
                  >
                    {authLoading ? "…" : "Create account"}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }


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
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColor(market.category)}`}>{market.category}</span>
          <h1 className={`text-xl font-bold ${t.textPrimary} mt-2 leading-snug`}>{market.question}</h1>
        </div>

        {/* CHANCE */}
        <div className="flex items-center gap-3 mb-4">
          <div>
            <div className={`text-3xl font-bold ${t.textPrimary}`}>{market.chance}%</div>
            <div className={`text-xs ${t.textMuted} uppercase tracking-wide`}>Chance</div>
          </div>
          <div className={`flex items-center gap-1 text-sm font-medium ${market.change >= 0 ? "text-emerald-500" : "text-[#6B0D0D]"}`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={market.change >= 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
            </svg>
            {Math.abs(market.change)}% today
          </div>
        </div>

        {/* YES/NO PILL */}
        <div className="flex gap-2 mb-4">
          {["Yes", "No"].map((s) => (
            <button key={s} onClick={() => setSide(s.toUpperCase() as "YES" | "NO")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border cursor-pointer transition-colors ${
                side === s.toUpperCase()
                  ? s === "Yes"
                    ? theme === "dark" ? "bg-green-500 border-transparent text-black" : `${t.accent} border-transparent text-white`
                    : theme === "dark" ? "bg-red-500 border-transparent text-white" : "bg-[#6B0D0D] border-transparent text-white"
                  : `${t.navBg} ${t.border} ${t.textMuted}`
              }`}
            >{s}</button>
          ))}
        </div>

        {/* CHART */}
        <div className={`${t.cardBg} border ${t.border} rounded-xl p-4 mb-4 shadow-sm`}>
          <div className="h-40 mb-3"><MiniChart accent={t.accent} /></div>
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 text-xs ${t.textMuted}`}>
              <span>{market.trades} Trades</span>
              <span className={`w-px h-3 ${theme === "dark" ? "bg-zinc-700" : "bg-slate-200"}`} />
              <span>{market.closes}</span>
            </div>
            <div className="flex gap-1">
              {["1Y", "1M", "1W", "1D", "12H"].map((p) => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`text-xs px-2 py-1 rounded cursor-pointer border-none transition-colors ${
                    period === p ? `${t.accent} text-white font-medium` : `bg-transparent ${t.textMuted}`
                  }`}
                >{p}</button>
              ))}
            </div>
          </div>
        </div>

        {/* ORDER BOOK */}
        <div className={`${t.cardBg} border ${t.border} rounded-xl mb-4 shadow-sm overflow-hidden`}>
          <button onClick={() => setOrderBookOpen(!orderBookOpen)} className={`w-full flex items-center justify-between px-4 py-3 cursor-pointer border-none bg-transparent text-left`}>
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
                  <p className="text-xs font-medium text-emerald-500 mb-2">YES Bids</p>
                  {[0.33, 0.32, 0.31, 0.30].map((p) => (
                    <div key={p} className={`flex justify-between text-xs ${t.textMuted} py-1 border-b ${t.borderLight}`}>
                      <span className="text-emerald-500 font-medium">₦{p.toFixed(2)}</span>
                      <span>{Math.floor(Math.random() * 500 + 100)}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-medium text-[#6B0D0D] mb-2">NO Bids</p>
                  {[0.67, 0.68, 0.69, 0.70].map((p) => (
                    <div key={p} className={`flex justify-between text-xs ${t.textMuted} py-1 border-b ${t.borderLight}`}>
                      <span className="text-[#6B0D0D] font-medium">₦{p.toFixed(2)}</span>
                      <span>{Math.floor(Math.random() * 500 + 100)}</span>
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
          <p className={`text-sm ${t.textMuted} mb-3 leading-relaxed`}>{market.description}</p>
          <p className={`text-sm ${t.textMuted} mb-1`}>
            This market will resolve as <span className={`${t.accentText} font-medium`}>Yes</span> if {market.resolveYes}
          </p>
          <p className={`text-sm ${t.textMuted} mb-3`}>
            It will resolve as <span className="text-[#6B0D0D] font-medium">No</span> if {market.resolveNo}
          </p>
          <button className={`text-xs px-3 py-1.5 rounded-full border ${t.border} ${t.textMuted} cursor-pointer bg-transparent transition-colors`}>Show full details</button>
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
                { label: "Market Open", date: market.opened, done: true },
                { label: "Market Close", date: market.closes, done: false },
                { label: "Payout", date: "4-12 Hours After Close", done: false },
              ].map((step, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="flex flex-col items-center">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${step.done ? "border-emerald-500 bg-emerald-500" : `${t.border} ${t.navBg}`}`}>
                      {step.done && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    {i < 2 && <div className={`w-px h-6 ${theme === "dark" ? "bg-zinc-700" : "bg-slate-200"} mt-1`} />}
                  </div>
                  <div className="pb-4">
                    <p className={`text-sm font-medium ${step.done ? "text-emerald-500" : t.textPrimary}`}>{step.label}</p>
                    <p className={`text-xs ${t.textMuted}`}>{step.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RELATED MARKETS */}
        {market.related.length > 0 && (
          <div className="mb-4">
            <h3 className={`text-sm font-semibold ${t.textPrimary} mb-3`}>Related Markets</h3>
            <div className="flex flex-col gap-3">
              {market.related.map((r) => (
                <div key={r.id} onClick={() => router.push(`/market/${r.id}`)}
                  className={`${t.cardBg} border ${t.border} rounded-xl p-3 cursor-pointer hover:shadow-md transition-all flex items-center gap-3`}
                >
                  <div className={`w-8 h-8 rounded-full ${t.accentBg} flex items-center justify-center shrink-0`}>
                    <span className={`text-xs font-bold ${t.accentText}`}>E</span>
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${t.textPrimary} leading-snug`}>{r.question}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${t.accentBg} ${t.accentText} font-medium`}>{r.chance}% Chance</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COMMENTS / TOP HOLDERS / POSITIONS / ACTIVITY TABS */}
        <div className={`${t.cardBg} border ${t.border} rounded-xl mb-4 shadow-sm overflow-hidden`}>
          {/* TABS */}
          <div className={`flex border-b ${t.border}`}>
            {["Comments", "Top Holders", "Positions", "Activity"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 text-xs py-3 font-medium cursor-pointer border-none bg-transparent transition-colors ${
                  activeTab === tab
                    ? `${t.accentText} border-b-2 ${theme === "dark" ? "border-[#CCFF00]" : "border-blue-600"}`
                    : t.textMuted
                }`}
              >{tab}</button>
            ))}
          </div>

          {/* COMMENTS TAB */}
          {activeTab === "Comments" && (
            <div className="p-4">
              {/* INPUT */}
              <div className={`flex items-center gap-2 ${t.inputBg} rounded-xl px-3 py-2 mb-3`}>
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className={`bg-transparent text-sm ${t.textPrimary} outline-none flex-1 placeholder:${t.textMuted}`}
                />
                <button className={`text-xs px-3 py-1.5 rounded-lg ${t.accent} text-white font-medium border-none cursor-pointer`}>Post</button>
              </div>
              {/* WARNING */}
              <div className={`flex items-center gap-2 ${t.inputBg} rounded-lg px-3 py-2 mb-4`}>
                <svg className={`w-3.5 h-3.5 ${t.textMuted} shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className={`text-xs ${t.textMuted}`}>Beware of external links.</span>
              </div>
              {/* FILTER ROW */}
              <div className="flex items-center gap-3 mb-3">
                <button className={`text-xs flex items-center gap-1 ${t.textMuted} cursor-pointer border-none bg-transparent`}>
                  Newest <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                <label className={`flex items-center gap-1.5 text-xs ${t.textMuted} cursor-pointer`}>
                  <input type="checkbox" className="w-3 h-3" />
                  Holders
                </label>
              </div>
              {/* COMMENTS */}
              <div className="flex flex-col gap-4">
                {SAMPLE_COMMENTS.map((c, i) => (
                  <div key={i} className="flex gap-3">
                    <div className={`w-7 h-7 rounded-full ${t.accentBg} flex items-center justify-center shrink-0 text-xs font-bold ${t.accentText}`}>
                      {c.user[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold ${t.textPrimary}`}>{c.user}</span>
                        <span className={`text-xs ${t.textMuted}`}>{c.time}</span>
                        <button className={`ml-auto text-xs ${t.textMuted} cursor-pointer border-none bg-transparent`}>···</button>
                      </div>
                      <p className={`text-sm ${t.textSecondary} leading-snug`}>{c.text}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <button className={`flex items-center gap-1 text-xs ${t.textMuted} cursor-pointer border-none bg-transparent`}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                          {c.likes}
                        </button>
                        <button className={`flex items-center gap-1 text-xs ${t.textMuted} cursor-pointer border-none bg-transparent`}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TOP HOLDERS TAB */}
          {activeTab === "Top Holders" && (
            <div className="p-4">
              <div className="flex flex-col gap-3">
                {TOP_HOLDERS.map((h, i) => (
                  <div key={i} className={`flex items-center justify-between py-2 border-b ${t.borderLight} last:border-0`}>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold ${t.textMuted} w-4`}>{i + 1}</span>
                      <div className={`w-7 h-7 rounded-full ${t.accentBg} flex items-center justify-center text-xs font-bold ${t.accentText}`}>{h.user[0]}</div>
                      <span className={`text-sm font-medium ${t.textPrimary}`}>{h.user}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${h.side === "YES" ? `${t.accentBg} ${t.accentText}` : "bg-[#6B0D0D]/10 text-[#6B0D0D]"}`}>{h.side} · {h.contracts}</span>
                      <p className={`text-xs ${t.textMuted} mt-0.5`}>{h.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* POSITIONS TAB */}
          {activeTab === "Positions" && (
            <div className="p-4">
              <div className="flex flex-col gap-3">
                {[
                  { label: "Your YES position", contracts: 14, value: "e4.76", pnl: "+e0.84", up: true },
                  { label: "Your NO position", contracts: 0, value: "e0.00", pnl: "e0.00", up: true },
                ].map((pos, i) => (
                  <div key={i} className={`flex items-center justify-between py-2 border-b ${t.borderLight} last:border-0`}>
                    <div>
                      <p className={`text-sm font-medium ${t.textPrimary}`}>{pos.label}</p>
                      <p className={`text-xs ${t.textMuted}`}>{pos.contracts} contracts · {pos.value}</p>
                    </div>
                    <span className={`text-sm font-bold ${pos.up ? "text-emerald-500" : "text-[#6B0D0D]"}`}>{pos.pnl}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACTIVITY TAB */}
          {activeTab === "Activity" && (
            <div className="p-4">
              <div className="flex flex-col gap-3">
                {[
                  { user: "Emeka_trades", action: "Bought YES", amount: "e5.00", time: "2m ago" },
                  { user: "Ngozi_M", action: "Bought NO", amount: "e12.00", time: "8m ago" },
                  { user: "Adaeze_K", action: "Sold YES", amount: "e3.00", time: "15m ago" },
                  { user: "Kunle_F", action: "Bought NO", amount: "e8.00", time: "22m ago" },
                ].map((act, i) => (
                  <div key={i} className={`flex items-center justify-between py-2 border-b ${t.borderLight} last:border-0`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full ${t.accentBg} flex items-center justify-center text-xs font-bold ${t.accentText}`}>{act.user[0]}</div>
                      <div>
                        <p className={`text-sm font-medium ${t.textPrimary}`}>{act.user}</p>
                        <p className={`text-xs ${act.action.includes("YES") ? t.accentText : "text-[#6B0D0D]"}`}>{act.action} · {act.amount}</p>
                      </div>
                    </div>
                    <span className={`text-xs ${t.textMuted}`}>{act.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* BACK TO TOP */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className={`w-full py-2 rounded-xl text-xs ${t.textMuted} border ${t.border} ${t.cardBg} cursor-pointer mb-4 flex items-center justify-center gap-1`}
        >
          Back to top
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      </div>

      {/* FIXED BOTTOM */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        <div className={`${t.navBg} border-t ${t.border} shadow-lg`}>
          <div className="max-w-2xl mx-auto px-4 pt-3 pb-2">

            {/* YES / NO */}
            <div className="flex gap-2 mb-2">
              <button onClick={() => setSide("YES")}
                className={`flex-1 h-12 rounded-xl text-sm font-bold border-none cursor-pointer transition-colors ${
                  side === "YES"
                  ? theme === "dark" ? "bg-green-500 text-black" : `${t.accent} text-white`
                  : `${t.inputBg} ${t.textMuted}`
                }`}
              >
                Up ₦{market.yesPrice.toFixed(2)}
              </button>
              <button onClick={() => setSide("NO")}
                className={`flex-1 h-12 rounded-xl text-sm font-bold border-none cursor-pointer transition-colors ${
                  side === "NO"
                  ? theme === "dark" ? "bg-red-500 text-white" : "bg-[#6B0D0D] text-white"
                  : `${t.inputBg} ${t.textMuted}`
                }`}
              >
                Down ₦{market.noPrice.toFixed(2)}
              </button>
            </div>

            {/* CASH + EDIT */}
            <div className="flex justify-between items-center mb-2">
              <span className={`text-xs ${t.textMuted}`}>₦{amount}.00 cash</span>
              <button onClick={() => setEditing(!editing)} className={`text-xs ${t.accentText} font-medium cursor-pointer border-none bg-transparent`}>
                {editing ? "Done" : "Edit"}
              </button>
            </div>

            {/* EDIT MODE */}
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

            {/* QUICK AMOUNTS — 3 only */}
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
                    <span className={`text-sm font-bold`}>₦{a}</span>
                    <span className={`text-xs ${amount === a ? t.amountActiveSub : "text-emerald-500"}`}>
                      win ₦{(a / price).toFixed(0)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* POTENTIAL WIN */}
            <div className="text-center py-1">
              <span className={`text-xs ${t.textMuted}`}>Potential win if {side}: </span>
              <span className={`text-sm font-bold ${t.accentText}`}>₦{payout}</span>
              <span className={`text-xs ${t.textMuted}`}> · Fee: ₦{fee}</span>
            </div>
          </div>
        </div>

        {/* BOTTOM NAV */}
        <nav className={`${t.bottomNav} border-t ${t.bottomNavBorder} flex items-center justify-around px-4 py-2`}>
          {[
            { label: "Home", icon: "home" },
            { label: "Search", icon: "search" },
            { label: "Breaking", icon: "breaking" },
            { label: `E${(amount / price).toFixed(0)}`, icon: "portfolio" },
          ].map((item) => (
            <button key={item.label} onClick={() => { if (item.icon === "home") router.push("/"); if (item.icon === "breaking") router.push("/breaking"); if (item.icon === "search") router.push("/?search=1"); if (item.icon === "more") router.push("/more"); }}
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
          onClick={() => { setShowAuthModal(false); setAuthView("choice"); }}
        >
          <div
            className={`${t.cardBg} border ${t.border} rounded-2xl p-6 w-80 shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-5 justify-center">
              <span className="w-7 h-7 rounded-md bg-[#CCFF00] flex items-center justify-center text-black text-sm font-black italic">E</span>
              <span className={`text-base font-bold ${t.textPrimary}`}>Eris</span>
            </div>

            {authView === "choice" && (
              <>
                <h2 className={`text-lg font-bold ${t.textPrimary} text-center mb-1`}>Sign in to trade</h2>
                <p className={`text-xs ${t.textMuted} text-center mb-6`}>You need an account to place trades. Browsing is always free.</p>
                <button onClick={() => alert("Google sign-in isn't set up yet — use email + password below.")}
                  className={`w-full py-2.5 rounded-xl border ${t.border} ${t.cardBg} ${t.textPrimary} font-semibold text-sm mb-3 cursor-pointer flex items-center justify-center gap-2 hover:opacity-80`}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`flex-1 h-px ${theme === "dark" ? "bg-white/10" : "bg-slate-200"}`} />
                  <span className={`text-xs ${t.textMuted}`}>or</span>
                  <div className={`flex-1 h-px ${theme === "dark" ? "bg-white/10" : "bg-slate-200"}`} />
                </div>
                <button onClick={() => setAuthView("login")} className={`w-full py-2.5 rounded-xl font-semibold text-sm mb-3 border-none cursor-pointer transition-colors ${theme === "dark" ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-zinc-800"}`}>Log in</button>
                <button onClick={() => setAuthView("signup")} className={`w-full py-2.5 rounded-xl font-semibold text-sm mb-4 border cursor-pointer transition-colors ${theme === "dark" ? "bg-black text-white border-white/20 hover:bg-white/10" : "bg-white text-black border-black/20 hover:bg-slate-50"}`}>Sign up</button>
                <p className={`text-xs ${t.textMuted} text-center`}>By continuing you agree to our <span className="text-[#CCFF00] cursor-pointer">Terms of Service</span></p>
                <button onClick={() => { setShowAuthModal(false); setAuthView("choice"); }} className={`mt-4 w-full text-xs ${t.textMuted} bg-transparent border-none cursor-pointer`}>Continue browsing</button>
              </>
            )}

            {authView === "login" && (
              <>
                <button onClick={() => setAuthView("choice")} className={`flex items-center gap-1 text-xs ${t.textMuted} bg-transparent border-none cursor-pointer mb-4`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>Back
                </button>
                <h2 className={`text-lg font-bold ${t.textPrimary} text-center mb-5`}>Welcome back</h2>
                <button onClick={() => alert("Google sign-in isn't set up yet — use email + password below.")}
                  className={`w-full py-2.5 rounded-xl border ${t.border} ${t.cardBg} ${t.textPrimary} font-semibold text-sm mb-3 cursor-pointer flex items-center justify-center gap-2 hover:opacity-80`}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`flex-1 h-px ${theme === "dark" ? "bg-white/10" : "bg-slate-200"}`} />
                  <span className={`text-xs ${t.textMuted}`}>or</span>
                  <div className={`flex-1 h-px ${theme === "dark" ? "bg-white/10" : "bg-slate-200"}`} />
                </div>
                <div className="flex flex-col gap-2 mb-3">
                  {authError && <p className="text-xs text-red-500 text-center">{authError}</p>}
                  <input type="email" placeholder="Email" value={authUsername} onChange={(e) => setAuthUsername(e.target.value)} className={`w-full px-3 py-2.5 rounded-xl text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none`} />
                  <input type="password" placeholder="Password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className={`w-full px-3 py-2.5 rounded-xl text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none`} />
                </div>
                <button className={`text-xs ${t.textMuted} bg-transparent border-none cursor-pointer mb-4 w-full text-right`}>Forgot password?</button>
                <button onClick={async () => { const ok = await login(authUsername, authPassword); if (ok) { setShowAuthModal(false); setAuthView("choice"); setAuthUsername(""); setAuthPassword(""); } }} disabled={authLoading} className={`w-full py-2.5 rounded-xl font-semibold text-sm border-none cursor-pointer transition-colors disabled:opacity-50 ${theme === "dark" ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-zinc-800"}`}>{authLoading ? "…" : "Log in"}</button>
                <p className={`text-xs ${t.textMuted} text-center mt-4`}>No account? <span onClick={() => setAuthView("signup")} className="text-[#CCFF00] cursor-pointer">Sign up</span></p>
              </>
            )}

            {authView === "signup" && (
              <>
                <button onClick={() => setAuthView("choice")} className={`flex items-center gap-1 text-xs ${t.textMuted} bg-transparent border-none cursor-pointer mb-4`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>Back
                </button>
                <h2 className={`text-lg font-bold ${t.textPrimary} text-center mb-5`}>Create account</h2>
                <button onClick={() => alert("Google sign-in isn't set up yet — use email + password below.")}
                  className={`w-full py-2.5 rounded-xl border ${t.border} ${t.cardBg} ${t.textPrimary} font-semibold text-sm mb-3 cursor-pointer flex items-center justify-center gap-2 hover:opacity-80`}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`flex-1 h-px ${theme === "dark" ? "bg-white/10" : "bg-slate-200"}`} />
                  <span className={`text-xs ${t.textMuted}`}>or</span>
                  <div className={`flex-1 h-px ${theme === "dark" ? "bg-white/10" : "bg-slate-200"}`} />
                </div>
                <div className="flex flex-col gap-2 mb-4">
                  {signupMessage && <p className="text-xs text-green-500 text-center">{signupMessage}</p>}
                  {authError && <p className="text-xs text-red-500 text-center">{authError}</p>}
                  <input type="email" placeholder="Email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className={`w-full px-3 py-2.5 rounded-xl text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none`} />
                  <input type="tel" placeholder="Phone number" value={authPhone} onChange={(e) => setAuthPhone(e.target.value)} className={`w-full px-3 py-2.5 rounded-xl text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none`} />
                  <input type="password" placeholder="Password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className={`w-full px-3 py-2.5 rounded-xl text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none`} />
                </div>
                <button onClick={async () => { const res = await signup(authEmail, authPassword); if (res.ok) { setSignupMessage("Check your email to confirm your account, then log in."); setAuthView("login"); setAuthEmail(""); setAuthPassword(""); setAuthPhone(""); } }} disabled={authLoading} className={`w-full py-2.5 rounded-xl font-semibold text-sm border-none cursor-pointer transition-colors disabled:opacity-50 ${theme === "dark" ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-zinc-800"}`}>{authLoading ? "…" : "Create account"}</button>
                <p className={`text-xs ${t.textMuted} text-center mt-4`}>Already have an account? <span onClick={() => setAuthView("login")} className="text-[#CCFF00] cursor-pointer">Log in</span></p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}