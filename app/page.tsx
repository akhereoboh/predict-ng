"use client";


import { useRouter, useSearchParams } from "next/navigation";
import RollingNumber from "./components/RollingNumber";
import { useTheme } from "./context/theme";
import { useState, useRef, useEffect, Suspense } from "react";
import { OUTCOME_COLORS, hashIndex } from "./lib/colors";
import QuickBuyOrderBook from "./components/QuickBuyOrderBook";



const [quickBuyOrderBook, setQuickBuyOrderBook] = useState<{ marketId: string; question: string; outcomes: string[]; initialOutcome: string } | null>(null);
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
  },
  {
    id: "2",
    question: "Will Peter Obi contest the 2027 presidential election?",
    category: "Politics",
    yesPrice: 0.71,
    noPrice: 0.29,
    volume: "110,200",
    traders: 412,
    closes: "Open",
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
  },
  {
    id: "10",
    question: "Who will be Nigeria's top scorer at AFCON 2026?",
    category: "Sports",
    yesPrice: 0,
    noPrice: 0,
    volume: "52,000",
    traders: 410,
    closes: "Feb 1, 2027",
    multiOption: true,
    options: [
      { name: "Victor Osimhen", yesPrice: 0.45, noPrice: 0.55 },
      { name: "Kelechi Iheanacho", yesPrice: 0.22, noPrice: 0.78 },
      { name: "Taiwo Awoniyi", yesPrice: 0.18, noPrice: 0.82 },
      { name: "Samuel Chukwueze", yesPrice: 0.15, noPrice: 0.85 },
    ],
  },
  {
    id: "11",
    question: "Who will win the 2027 Nigerian Presidential Election?",
    category: "Politics",
    yesPrice: 0,
    noPrice: 0,
    volume: "134,000",
    traders: 892,
    closes: "Feb 28, 2027",
    multiOption: true,
    options: [
      { name: "Peter Obi", yesPrice: 0.71, noPrice: 0.29 },
      { name: "Bola Tinubu", yesPrice: 0.48, noPrice: 0.52 },
      { name: "Atiku Abubakar", yesPrice: 0.31, noPrice: 0.69 },
      { name: "Rabiu Kwankwaso", yesPrice: 0.12, noPrice: 0.88 },
    ],
  },
];

// The old flat FILTERS list is gone -- categories are now fetched from the
// real backend registry (see the useEffect below), so new categories and
// sub-categories created from the admin page show up here automatically.
type CategoryEntry = { name: string; parent: string | null };

function HomeContent() {
  const { theme, toggleTheme, t, isLoggedIn, login, signup, authError, authLoading, cashNaira, totalValueNaira, getValidToken, refreshPortfolio } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<CategoryEntry[]>([]);
  // Persisted in the URL (?filter=SPORTS) rather than plain local state --
  // local state resets to "All" every time this page remounts, which is
  // exactly what happens when you click into a market and then hit Back.
  // Reading the filter from the URL on mount, and keeping the URL in sync
  // whenever it changes, means router.back() actually lands you back on
  // the section you were browsing, not always the All page.
  const [activeFilter, setActiveFilterState] = useState(() => searchParams.get("filter") || "All");
  const [activeSubcategory, setActiveSubcategoryState] = useState<string | null>(() => searchParams.get("sub") || null);

  const setActiveFilter = (filter: string) => {
    setActiveFilterState(filter);
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (filter === "All") params.delete("filter"); else params.set("filter", filter);
    params.delete("sub");
    router.replace(params.toString() ? `/?${params.toString()}` : "/", { scroll: false });
  };
  const setActiveSubcategory = (sub: string | null) => {
    setActiveSubcategoryState(sub);
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (sub) params.set("sub", sub); else params.delete("sub");
    router.replace(params.toString() ? `/?${params.toString()}` : "/", { scroll: false });
  };

  useEffect(() => {
    fetch("https://sireai.uk/pm-api/categories")
      .then((r) => r.json())
      .then((data: CategoryEntry[]) => setCategories(data))
      .catch(() => {
        // categories row just won't show sub-pills; the top-level "All"
        // browsing experience still works fine without this
      });
  }, []);

  const [teamLogos, setTeamLogos] = useState<Record<string, string>>({});
  useEffect(() => {
    fetch("https://sireai.uk/pm-api/team-logos")
      .then((r) => r.json())
      .then((data: Record<string, string>) => setTeamLogos(data))
      .catch(() => {
        // cards just show without a logo -- non-breaking either way
      });
  }, []);
  // Case-insensitive lookup, since "Barcelona" and "barcelona" should
  // both find the same saved logo.
  const logoFor = (outcomeName: string): string | undefined => {
    const match = Object.keys(teamLogos).find((k) => k.toLowerCase() === outcomeName.toLowerCase());
    return match ? teamLogos[match] : undefined;
  };

  const topLevelCategories = categories.filter((c) => !c.parent).map((c) => c.name);
  const subcategoriesForActive = categories.filter((c) => c.parent?.toUpperCase() === activeFilter.toUpperCase()).map((c) => c.name);

  const [selectedMarket, setSelectedMarket] = useState(MARKETS[0]);
  const [selectedFootballMarket, setSelectedFootballMarket] = useState<FootballMarket | null>(null);
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [amount, setAmount] = useState(10);
  const [bookmarks, setBookmarks] = useState<string[]>(["1", "3"]);
  const [panelKey, setPanelKey] = useState(0);
  const [panelVisible, setPanelVisible] = useState(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  // --- multi-outcome markets (3+ named outcomes) -- separate state from
  // the binary sheet above. A binary market always has exactly two sides
  // to toggle between; a multi-outcome market doesn't have a natural
  // "other side" the same way, so each outcome gets its own buy button
  // that opens this sheet already locked to that outcome, with a small
  // switcher inside if they change their mind. ---
  const [multiSheetOpen, setMultiSheetOpen] = useState(false);
  const [selectedMultiMarket, setSelectedMultiMarket] = useState<FootballMarket | null>(null);
  const [selectedMultiOutcome, setSelectedMultiOutcome] = useState<string | null>(null);
  const [multiAmount, setMultiAmount] = useState(0);
  const [multiTradeStatus, setMultiTradeStatus] = useState<{ loading: boolean; error: string | null; success: string | null }>({ loading: false, error: null, success: null });
  const [expandedLeagues, setExpandedLeagues] = useState<Set<string>>(new Set());
  const [hoverSide, setHoverSide] = useState<"YES" | "NO" | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState(1000);
  const [depositStatus, setDepositStatus] = useState<{ loading: boolean; message: string | null }>({ loading: false, message: null });
  const [authView, setAuthView] = useState<"choice" | "login" | "signup">("choice");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authUsername, setAuthUsername] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [signupMessage, setSignupMessage] = useState<string | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    markets: { id: string; question: string; market_type: string }[];
    users: { id: string; display_name: string }[];
  }>({ markets: [], users: [] });
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults({ markets: [], users: [] });
      return;
    }
    setSearchLoading(true);
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`https://sireai.uk/pm-api/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) setSearchResults(await res.json());
      } catch {
        // stale results just stay on screen -- not critical
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [searchQuery]);

  const [bubbles, setBubbles] = useState<{ id: number; marketId: string; outcome: string; amount: number; x: number }[]>([]);
  // Real trades across every market, polled independently of the price
  // list -- this is what tells us "someone just bought X on market Y",
  // which is what spawns a real floating indicator instead of a fake one.
  const lastTradeSeenRef = useRef<string | null>(null);
  const marketLastRealTradeRef = useRef<Map<string, number>>(new Map()); // marketId -> ms timestamp of its last REAL trade seen
  const [btcLive, setBtcLive] = useState<{
    market_id: string | null;
    price_yes: number | null;
    price_no: number | null;
    cycle_ends_at: string | null;
    volume_naira: number | null;
    trader_count: number | null;
    open_price_usd: number | null;
    current_price_usd: number | null;
  } | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const cardRefs = useRef<Map<string, typeof MARKETS[0]>>(new Map());
  const cardEls = useRef<HTMLDivElement[]>([]);



  // Real trades first: poll for anything new since the last thing we saw,
  // and spawn a real floating indicator for each one, positioned on
  // whichever visible market card it belongs to.
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const url = new URL("https://sireai.uk/pm-api/markets/recent-trades");
        if (lastTradeSeenRef.current) url.searchParams.set("since", lastTradeSeenRef.current);
        const res = await fetch(url.toString(), { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const trades: { created_at: string; market_id: string; outcome: string; amount_naira: number }[] = await res.json();
        if (trades.length === 0) return;
        lastTradeSeenRef.current = trades[0].created_at; // most recent first
        const now = Date.now();
        for (const trade of trades) {
          marketLastRealTradeRef.current.set(trade.market_id, now);
          const id = now + Math.random();
          const x = 20 + Math.random() * 60;
          setBubbles((prev) => [...prev, { id, marketId: trade.market_id, outcome: trade.outcome, amount: Math.round(trade.amount_naira), x }]);
          setTimeout(() => setBubbles((prev) => prev.filter((b) => b.id !== id)), 1900);
        }
      } catch {
        // a missed poll just means a couple of trades don't get a bubble -- not critical
      }
    };
    poll();
    const intervalId = setInterval(poll, 3000);
    return () => { cancelled = true; clearInterval(intervalId); };
  }, []);

  const cardRef = (el: HTMLDivElement | null, market: typeof MARKETS[0]) => {
    if (!el) return;
    cardRefs.current.set(market.id, market);

    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const id = (entry.target as HTMLDivElement).dataset.marketId;
              const m = id ? cardRefs.current.get(id) : null;
              if (m) {
                setPanelVisible(false);
                setTimeout(() => {
                  setSelectedMarket(m);
                  setPanelKey((k) => k + 1);
                  setPanelVisible(true);
                }, 100);
              }
            }
          });
        },
        { threshold: 0.3, rootMargin: "0px 0px -10% 0px" }
      );
    }
    observerRef.current.observe(el);
  };

  // The static MARKETS array is retired from display -- every category,
  // including All, now shows real markets from the backend (below).
  // MARKETS itself is left in the file since other pages (market/[id])
  // still reference it for their own static-market fallback behavior.
  const filtered: typeof MARKETS = [];

  const activeSide = hoverSide ?? side;
const price = selectedFootballMarket
    ? (side === "YES" ? (selectedFootballMarket.price_yes ?? 50) : (selectedFootballMarket.price_no ?? 50))
    : side === "YES" ? selectedMarket.yesPrice * 100 : selectedMarket.noPrice * 100;
  const contracts = (amount / price).toFixed(1);
  const fee = (amount * 0.02).toFixed(2);
  const payout = amount / price;

  const categoryColor = (cat: string) => {
    if (theme === "dark") {
      if (cat === "Economy") return t.categoryEconomy;
      if (cat === "Politics") return t.categoryPolitics;
      if (cat === "Sports") return t.categorySports;
      return t.categoryStocks;
    }
    if (cat === "Economy") return "bg-amber-100 text-amber-800";
    if (cat === "Politics") return "bg-purple-100 text-purple-800";
    if (cat === "Sports") return "bg-blue-100 text-blue-700";
    return "bg-emerald-100 text-emerald-700";
  };

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarks((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const openSearchModal = () => {
    setShowSearchModal(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setSearchModalOpen(true)));
  };

  const closeSearchModal = () => {
    setSearchModalOpen(false);
    setSearchQuery("");
    setTimeout(() => setShowSearchModal(false), 300);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("search") === "1") {
      window.history.replaceState({}, "", "/");
      const id = requestAnimationFrame(() => openSearchModal());
      return () => cancelAnimationFrame(id);
    }
    if (params.get("auth") === "1") {
      window.history.replaceState({}, "", "/");
      const id = requestAnimationFrame(() => setShowAuthModal(true));
      return () => cancelAnimationFrame(id);
    }
  }, []);

  useEffect(() => {
    const es = new EventSource("https://sireai.uk/pm-api/markets/btc/stream");
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setBtcLive({
          market_id: data.market_id,
          price_yes: data.price_yes,
          price_no: data.price_no,
          cycle_ends_at: data.cycle_ends_at,
          volume_naira: data.volume_naira,
          trader_count: data.trader_count,
          open_price_usd: data.open_price_usd,
          current_price_usd: data.current_price_usd,
        });
      } catch {
        // malformed message on one tick -- ignore, the next one will be fine
      }
    };
    // EventSource reconnects automatically on a dropped connection -- no
    // manual retry loop needed, unlike the old REST-polling approach.
    return () => es.close();
  }, []);

  const [btcSecondsLeft, setBtcSecondsLeft] = useState<number | null>(null);

  // After Bachs' hosted checkout, the user lands back here at
  // /?deposit=success (or ?deposit=cancelled). The webhook is what
  // actually credited the balance -- this just refreshes what we show
  // and tidies the URL, it never credits anything itself.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("deposit");
    if (status === "success") {
      refreshPortfolio();
      const id = requestAnimationFrame(() => setDepositStatus({ loading: false, message: null }));
      if (status) window.history.replaceState({}, "", window.location.pathname);
      return () => cancelAnimationFrame(id);
    }
    if (status) {
      window.history.replaceState({}, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!btcLive?.cycle_ends_at) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(btcLive.cycle_ends_at as string).getTime() - Date.now()) / 1000));
      setBtcSecondsLeft(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [btcLive?.cycle_ends_at]);

  // Real football markets -- fetched live from the backend, only while the
  // Sports filter is actually selected (no point polling in the background
  // when nobody's looking at it).
  type FootballMarket = {
    id: string;
    question: string;
    status: string;
    winner: string | null;
    price_yes: number | null;
    price_no: number | null;
    outcomes: Record<string, number> | null;
    market_type: string;
    league: string | null;
    close_at: string | null;
    volume_naira: number;
    trader_count: number;
    closed: boolean;
    trading_model: string; // "AMM" or "ORDER_BOOK"
  };
  type FootballTradeState = { loading: boolean; error: string | null; success: string | null };

  // NOTE ON NAMING: these were built football-first and the names stuck --
  // "footballMarkets" now actually holds whatever category is currently
  // selected (Stocks, Politics, any category created from the admin
  // page), not just football. Renaming everywhere would touch a lot of
  // the panel logic below for no functional benefit, so the behavior was
  // generalized in place instead.
  const [footballMarkets, setFootballMarkets] = useState<FootballMarket[]>([]);
  const [footballLoading, setFootballLoading] = useState(true);
  const [footballTradeStatus, setFootballTradeStatus] = useState<FootballTradeState>({ loading: false, error: null, success: null });

  // Simulated fallback, only for markets that are actually visible right
  // now and haven't had a real trade in a while -- keeps quiet markets
  // feeling alive without pretending activity exists on ones you can't
  // even see, and never fires at all once real trades are coming in.
  useEffect(() => {
    const QUIET_THRESHOLD_MS = 8000;
    const interval = setInterval(() => {
      const visible = footballMarkets.filter((m) => !m.closed);
      if (visible.length === 0) return;
      const market = visible[Math.floor(Math.random() * visible.length)];
      const lastReal = marketLastRealTradeRef.current.get(market.id) ?? 0;
      if (Date.now() - lastReal < QUIET_THRESHOLD_MS) return; // real activity is already covering this one
      const outcome = market.outcomes
        ? Object.keys(market.outcomes)[Math.floor(Math.random() * Object.keys(market.outcomes).length)]
        : (Math.random() > 0.5 ? "YES" : "NO");
      const amount = [500, 1000, 2000, 3000, 5000, 8000][Math.floor(Math.random() * 6)];
      const x = 20 + Math.random() * 60;
      const id = Date.now() + Math.random();
      setBubbles((prev) => [...prev, { id, marketId: market.id, outcome, amount, x }]);
      setTimeout(() => setBubbles((prev) => prev.filter((b) => b.id !== id)), 1900);
    }, 2500);
    return () => clearInterval(interval);
  }, [footballMarkets]);

  // Auto-close the mobile trade sheet a moment after a successful trade --
  // long enough for the "Bought X for ₦Y" confirmation to actually be seen.
  useEffect(() => {
    if (!mobileSheetOpen || !footballTradeStatus.success) return;
    const id = setTimeout(() => setMobileSheetOpen(false), 1800);
    return () => clearTimeout(id);
  }, [mobileSheetOpen, footballTradeStatus.success]);

  useEffect(() => {
    if (!multiSheetOpen || !multiTradeStatus.success) return;
    const id = setTimeout(() => setMultiSheetOpen(false), 1800);
    return () => clearTimeout(id);
  }, [multiSheetOpen, multiTradeStatus.success]);

  useEffect(() => {
    let cancelled = false;
    const fetchFootballMarkets = async () => {
      try {
        const res = await fetch("https://sireai.uk/pm-api/markets", { cache: "no-store" });
        if (!res.ok) return;
        const data: Omit<FootballMarket, "closed">[] = await res.json();
        const now = Date.now();
        const cat = activeFilter.toUpperCase();
        const sub = activeSubcategory?.toUpperCase();
        const matches = (marketType: string) => {
          if (marketType === "BTC_5MIN") return false; // already shown via its own dedicated live card
          if (activeFilter === "All") return true; // every other real market, unfiltered by category
          // "FOOTBALL" is a legacy standalone top-level category, separate
          // from "SPORTS" -- a market created under it (instead of the
          // intended "Sports > Football" subcategory) would otherwise be
          // permanently invisible under the Sports tab. Treated as
          // equivalent here so those markets still show up correctly.
          if (activeFilter === "SPORTS" && marketType === "FOOTBALL") return true;
          return sub ? marketType === `${cat}_${sub}` : marketType === cat || marketType.startsWith(`${cat}_`);
        };
        const withClosed: FootballMarket[] = data
          .filter((m) => matches(m.market_type))
          .map((m) => ({
            ...m,
            closed: m.status !== "OPEN" || (!!m.close_at && new Date(m.close_at).getTime() <= now),
          }));
        if (!cancelled) {
          setFootballMarkets(withClosed);
          // keep the selected panel market's price fresh if it's still open
          setSelectedFootballMarket((prev) => {
            if (!prev) return prev;
            const fresh = withClosed.find((m) => m.id === prev.id);
            return fresh && !fresh.closed ? fresh : prev;
          });
        }
      } catch {
        // keep showing the last known list rather than clearing it on a blip
      } finally {
        if (!cancelled) setFootballLoading(false);
      }
    };
    fetchFootballMarkets();
    const id = setInterval(fetchFootballMarkets, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [activeFilter, activeSubcategory]);

  // Asks the backend to start a real Bachs checkout session, then sends
  // the browser to Bachs' hosted payment page. Money is NEVER credited
  // from anything that happens in this function -- it only starts the
  // payment. The actual crediting happens server-side, only after Bachs'
  // webhook confirms the payment with a verified signature (see
  // bachs_payments.py). Never trust the frontend to say a payment
  // succeeded.
  const handleDeposit = async () => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }
    if (!depositAmount || depositAmount <= 0) {
      setDepositStatus({ loading: false, message: "Enter an amount first." });
      return;
    }
    setDepositStatus({ loading: true, message: null });
    try {
      const token = await getValidToken();
      if (!token) {
        setShowAuthModal(true);
        setDepositStatus({ loading: false, message: null });
        return;
      }
      const res = await fetch("https://sireai.uk/pm-api/me/deposit/init", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ naira: depositAmount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDepositStatus({ loading: false, message: data.detail || "Couldn't start the deposit — try again." });
        return;
      }
      // Full redirect to Bachs' hosted checkout page. It sends the user
      // back to success_url/cancel_url (configured server-side) once
      // they're done.
      window.location.href = data.checkout_url;
    } catch {
      setDepositStatus({ loading: false, message: "Network error — try again." });
    }
  };

  const handleFootballBuy = async () => {
    if (!selectedFootballMarket) return;
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }
    const market = selectedFootballMarket;
    const contractPrice = side === "YES" ? (market.price_yes ?? 50) : (market.price_no ?? 50);
    const estContracts = Math.max(1, Math.round(amount / contractPrice));

    setFootballTradeStatus({ loading: true, error: null, success: null });
    try {
      const token = await getValidToken();
      if (!token) {
        setShowAuthModal(true);
        setFootballTradeStatus({ loading: false, error: null, success: null });
        return;
      }
      const res = await fetch("https://sireai.uk/pm-api/trade/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ market_id: market.id, outcome: side, contracts: estContracts }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFootballTradeStatus({ loading: false, error: data.detail || "Trade failed", success: null });
        return;
      }
      setFootballTradeStatus({
        loading: false, error: null,
        success: `Bought ${estContracts} ${side} for ₦${data.paid_naira.toFixed(2)}`,
      });
      await refreshPortfolio();
      setSelectedFootballMarket((prev) => prev && ({ ...prev, price_yes: data.price_yes, price_no: data.price_no }));
      setFootballMarkets((prev) =>
        prev.map((m) => (m.id === market.id ? { ...m, price_yes: data.price_yes, price_no: data.price_no } : m))
      );
      setTimeout(() => setFootballTradeStatus({ loading: false, error: null, success: null }), 4000);
    } catch {
      setFootballTradeStatus({ loading: false, error: "Network error — try again", success: null });
    }
  };

  const handleMultiOutcomeBuy = async () => {
    if (!selectedMultiMarket || !selectedMultiOutcome || !selectedMultiMarket.outcomes) return;
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }
    const market = selectedMultiMarket;
    const outcome = selectedMultiOutcome;
    const price = market.outcomes![outcome] ?? 100 / Object.keys(market.outcomes!).length;
    const estContracts = Math.max(1, Math.round(multiAmount / price));

    setMultiTradeStatus({ loading: true, error: null, success: null });
    try {
      const token = await getValidToken();
      if (!token) {
        setShowAuthModal(true);
        setMultiTradeStatus({ loading: false, error: null, success: null });
        return;
      }
      const res = await fetch("https://sireai.uk/pm-api/trade/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ market_id: market.id, outcome, contracts: estContracts }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMultiTradeStatus({ loading: false, error: data.detail || "Trade failed", success: null });
        return;
      }
      setMultiTradeStatus({
        loading: false, error: null,
        success: `Bought ${estContracts} ${outcome} for ₦${data.paid_naira.toFixed(2)}`,
      });
      await refreshPortfolio();
      // data.prices is the full {outcome_name: price} map, freshly returned
      setSelectedMultiMarket((prev) => prev && ({ ...prev, outcomes: data.prices }));
      setFootballMarkets((prev) =>
        prev.map((m) => (m.id === market.id ? { ...m, outcomes: data.prices } : m))
      );
      setTimeout(() => setMultiTradeStatus({ loading: false, error: null, success: null }), 4000);
    } catch {
      setMultiTradeStatus({ loading: false, error: "Network error — try again", success: null });
    }
  };

  const renderMarketCard = (m: FootballMarket) => {
    if (m.outcomes) {
            const selectOutcome = (outcomeName: string) => {
        if (m.trading_model === "ORDER_BOOK") {
          setQuickBuyOrderBook({ marketId: m.id, question: m.question, outcomes: Object.keys(m.outcomes!), initialOutcome: outcomeName });
          return;
        }
        setSelectedMultiMarket(m);
        setSelectedMultiOutcome(outcomeName);
        setMultiAmount(0);
        setMultiTradeStatus({ loading: false, error: null, success: null });
        setMultiSheetOpen(true);
      };
      const outcomeEntries = Object.entries(m.outcomes);
      // Uses the app's OWN established colors, not arbitrary
      // ones: red for the first outcome (matches the "NO" red
      // used everywhere else), then our real accent color for
      // the second (true neon green #00E676 in dark mode, blue in
      // light mode -- same accent that highlights the active
      // nav pill), then a neutral gray for a third ("Draw",
      // typically) and beyond.
      // Exactly-2-outcome markets (like Barca vs Real Madrid)
      // keep the fixed red/accent-green treatment already
      // approved -- unchanged. 3+ outcome markets (typically a
      // team/Draw/team football market) get a richer, more
      // varied palette instead, since two colors read as flat
      // once there's a third option -- matching the visual
      // variety in the Polymarket sports reference. Any
      // outcome literally named "Draw" always stays neutral
      // gray regardless of position, since that's the one
      // outcome that should never look like a "pick."
      // One unified, dynamic color system used everywhere -- Sports, All,
      // any other category. Each outcome's color is picked deterministically
      // by hashing its own name, so "Barcelona" always gets the same color
      // on every card it appears on, but different team/outcome names
      // naturally land on different colors since their hashes differ --
      // no manual per-team color setup needed, and it scales to as many
      // different teams as you have, not a fixed small set. "Draw" always
      // stays neutral gray regardless of position. Muted, varied tones
      // matching Polymarket's own look, not a fixed bright pair.
      const MUTED_COLORS = [
        { pill: "bg-orange-700 hover:bg-orange-600 text-white", bar: "bg-orange-700" },
        { pill: "bg-red-800 hover:bg-red-700 text-white", bar: "bg-red-800" },
        { pill: "bg-blue-800 hover:bg-blue-700 text-white", bar: "bg-blue-800" },
        { pill: "bg-emerald-700 hover:bg-emerald-600 text-white", bar: "bg-emerald-700" },
        { pill: "bg-purple-800 hover:bg-purple-700 text-white", bar: "bg-purple-800" },
        { pill: "bg-rose-800 hover:bg-rose-700 text-white", bar: "bg-rose-800" },
        { pill: "bg-cyan-800 hover:bg-cyan-700 text-white", bar: "bg-cyan-800" },
        { pill: "bg-amber-700 hover:bg-amber-600 text-white", bar: "bg-amber-700" },
        { pill: "bg-teal-800 hover:bg-teal-700 text-white", bar: "bg-teal-800" },
        { pill: "bg-indigo-800 hover:bg-indigo-700 text-white", bar: "bg-indigo-800" },
        { pill: "bg-lime-800 hover:bg-lime-700 text-white", bar: "bg-lime-800" },
        { pill: "bg-fuchsia-800 hover:bg-fuchsia-700 text-white", bar: "bg-fuchsia-800" },
      ];
      const hashIndex = (str: string, mod: number) => {
        let h = 0;
        for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
        return h % mod;
      };
      const startIdx = hashIndex(outcomeEntries[0][0], MUTED_COLORS.length);
      const neutralPill = `${t.inputBg} ${t.textMuted} hover:opacity-80`;
      const neutralBar = theme === "dark" ? "bg-zinc-600" : "bg-slate-300";
      let colorSlot = 0; // only advances past non-Draw outcomes, so colors within one card stay distinct
      const pillColorFor = (name: string) => {
        if (name.toLowerCase() === "draw") return neutralPill;
        return MUTED_COLORS[(startIdx + colorSlot++) % MUTED_COLORS.length].pill;
      };
      let barColorSlot = 0;
      const barColorFor = (name: string) => {
        if (name.toLowerCase() === "draw") return neutralBar;
        return MUTED_COLORS[(startIdx + barColorSlot++) % MUTED_COLORS.length].bar;
      };
      const sportsPillColorFor = pillColorFor; // same system, used in the Sports branch below
      // Hex equivalents of the same palette, same hash logic, for
      // RollingNumber's color prop (which needs a literal color, not a
      // Tailwind class) -- keeps the price text matching its pill button.
      const MUTED_HEX = ["#C2410C", "#991B1B", "#1E40AF", "#047857", "#6B21A8", "#9F1239", "#155E75", "#B45309", "#0F766E", "#3730A3", "#4D7C0F", "#A21CAF"];
      let hexColorSlot = 0;
      const hexColorFor = (name: string) => {
        if (name.toLowerCase() === "draw") return theme === "dark" ? "#A1A1AA" : "#64748B";
        return MUTED_HEX[(startIdx + hexColorSlot++) % MUTED_HEX.length];
      };
      // Stateless lookup by name, for the floating buy bubbles -- unlike
      // hexColorFor above, this never advances a shared counter, so it's
      // safe to call any number of times for any outcome (bubbles arrive
      // asynchronously from real trades, not in the same fixed order as
      // the main render loop) without throwing off the price colors.
      const bubbleColorFor = (outcomeName: string) => {
        if (outcomeName.toLowerCase() === "draw") return theme === "dark" ? "#A1A1AA" : "#64748B";
        const idx = outcomeEntries.findIndex(([name]) => name === outcomeName);
        if (idx === -1) return "#FFFFFF";
        return MUTED_HEX[(startIdx + idx) % MUTED_HEX.length];
      };
      return (
        <div
          key={m.id}
          onClick={() => router.push(`/market/${m.id}`)}
          className={`relative overflow-hidden ${t.cardBg} rounded-xl p-4 cursor-pointer transition-all border shadow-sm ${t.border} hover:shadow-md`}
        >
          {bubbles.filter((b) => b.marketId === m.id).map((b) => (
            <span
              key={b.id}
              className="float-up"
              style={{ left: `${b.x}%`, bottom: "50%", color: bubbleColorFor(b.outcome) }}
            >
              {b.outcome} +₦{b.amount}
            </span>
          ))}
          {activeFilter !== "SPORTS" && (
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className={`text-sm font-medium ${t.textPrimary} flex-1`}>{m.question}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${t.inputBg} ${t.textMuted}`}>
                {m.market_type}
              </span>
            </div>
          )}

          {activeFilter === "SPORTS" && (
            <p className={`text-xs ${t.textMuted}`}>
              ₦{m.volume_naira.toLocaleString(undefined, { maximumFractionDigits: 0 })} vol · {m.trader_count} trader{m.trader_count === 1 ? "" : "s"}
            </p>
          )}

          {activeFilter === "SPORTS" ? (
            /* Matching the reference exactly: outcome names stacked on the
               left, buy buttons in a row on the right -- no probability
               bar or price row underneath, just this one block, same as
               Polymarket's own sports cards. Button size scales with
               outcome count, same as the reference: bigger for a 2-way
               match, smaller for a 3-way (team/Draw/team) match, since 3
               need to fit the same row. We don't have team logos or W-D-L
               records to show on the left the way Polymarket does, so
               it's just the names. */
            <div className="flex items-center justify-between gap-3 pt-4 pb-2 mb-2">
              <div className="flex flex-col gap-3 shrink-0">
                {outcomeEntries.map(([name]) => (
                  <div key={name} className="flex items-center gap-2">
                    {logoFor(name) && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoFor(name)} alt={name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                    )}
                    <span className={`text-sm font-medium ${t.textPrimary}`}>{name}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 flex-1 justify-end">
                {outcomeEntries.map(([name, price]) => (
                  <button
                    key={name}
                    onClick={(e) => { e.stopPropagation(); selectOutcome(name); }}
                    className={`rounded-lg font-bold border-none cursor-pointer transition-colors whitespace-nowrap ${
                      outcomeEntries.length <= 2 ? "px-7 py-2.5 text-sm min-w-[7.5rem]" : "px-5 py-2 text-xs min-w-[6rem]"
                    } ${sportsPillColorFor(name)}`}
                  >
                    <RollingNumber text={`${name.slice(0, 3).toUpperCase()} ₦${Math.floor(price)}`} color="#FFFFFF" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* name + % rows -- the first thing under the title, same info
                 as the price/bar section below, just laid out to read at a
                 glance before you even look at the bar. */}
              <div className="flex flex-col gap-0.5 mb-3">
                {outcomeEntries.map(([name, price]) => (
                  <div key={name} className="flex items-center justify-between text-sm">
                    <span className={`font-medium ${t.textPrimary}`}>{name}</span>
                    <RollingNumber text={`${Math.floor(price)}%`} color={theme === "dark" ? "#E5E7EB" : "#334155"} className="font-semibold" />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="flex gap-3">
                  {outcomeEntries.map(([name, price]) => (
                    <div key={name} className="flex flex-col items-center">
                      <RollingNumber
                        text={`₦${Math.floor(price)}`}
                        color={hexColorFor(name)}
                        className="text-base font-bold"
                      />
                      <span className={`text-xs ${t.textMuted}`}>{name}</span>
                    </div>
                  ))}
                </div>
                {/* multi-segment probability bar -- same colors as
                    the buttons, each segment's width is that
                    outcome's real, live price */}
                <div className={`relative flex-1 flex h-0.5 rounded-full overflow-visible ${theme === "dark" ? "bg-zinc-700" : "bg-slate-200"}`}>
                  {outcomeEntries.map(([name, price]) => (
                    <div
                      key={name}
                      className={`h-full transition-all duration-500 ${barColorFor(name)}`}
                      style={{ width: `${price}%` }}
                    />
                  ))}
                  <div
                    className={`absolute top-1/2 w-2.5 h-2.5 rounded-full transition-all duration-500 animate-pulse ${theme === "dark" ? "bg-[#00E676] shadow-[0_0_8px_2px_rgba(0,230,118,0.7)]" : "bg-black shadow-[0_0_8px_2px_rgba(0,0,0,0.5)]"}`}
                    style={{ left: `${outcomeEntries[0][1]}%`, transform: "translate(-50%, -50%)" }}
                  />
                </div>
              </div>

              <div className="flex gap-2 mb-2">
                {outcomeEntries.map(([name]) => (
                  <button
                    key={name}
                    onClick={(e) => { e.stopPropagation(); selectOutcome(name); }}
                    className={`flex-1 min-w-0 truncate px-2 py-2 rounded-lg text-xs font-semibold border-none cursor-pointer transition-colors ${pillColorFor(name)}`}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <p className={`text-xs ${t.textMuted}`}>₦{m.volume_naira.toLocaleString()} vol · {m.trader_count} traders</p>
            </>
          )}
        </div>
      );
    }

    const isSelected = selectedFootballMarket?.id === m.id;
    const selectFootball = (pickSide: "YES" | "NO") => {
      if (m.trading_model === "ORDER_BOOK") {
        setQuickBuyOrderBook({ marketId: m.id, question: m.question, outcomes: ["Yes", "No"], initialOutcome: pickSide === "YES" ? "Yes" : "No" });
        return;
      }
      setSelectedFootballMarket(m);
      setSide(pickSide);
      setAmount(0);
      setFootballTradeStatus({ loading: false, error: null, success: null });
      setMobileSheetOpen(true);
    };
    // Same dynamic, muted color system as multi-outcome markets -- hashed
    // off the market's own id (not the literal "YES"/"NO" strings, which
    // never change and would give every binary market the identical
    // color pair). Only the BTC card keeps the fixed green/red now.
    const binStartIdx = hashIndex(m.id, OUTCOME_COLORS.length);
    const yesColor = OUTCOME_COLORS[binStartIdx];
    const noColor = OUTCOME_COLORS[(binStartIdx + 1) % OUTCOME_COLORS.length];
    return (
      <div
                    key={m.id}
                    onClick={() => router.push(`/market/${m.id}`)}
                    className={`relative overflow-hidden ${t.cardBg} rounded-xl p-4 cursor-pointer transition-all border shadow-sm ${
                      isSelected
                        ? `${theme === "dark" ? "border-[#CCFF00] shadow-[#CCFF00]/20" : "border-blue-500 shadow-blue-100"} shadow-md`
                        : `${t.border} hover:shadow-md`
                    }`}
                  >
                    {bubbles.filter((b) => b.marketId === m.id).map((b) => (
                      <span
                        key={b.id}
                        className="float-up"
                        style={{ left: `${b.x}%`, bottom: "50%", color: b.outcome === "YES" ? yesColor.hex : noColor.hex }}
                      >
                        {b.outcome} +₦{b.amount}
                      </span>
                    ))}
                    {activeFilter !== "SPORTS" && (
                      <>
                        <p className={`text-sm font-medium ${t.textPrimary} mb-1`}>{m.question}</p>
                        <p className={`text-xs ${t.textMuted} mb-3`}>
                          ₦{m.volume_naira.toLocaleString(undefined, { maximumFractionDigits: 0 })} vol · {m.trader_count} trader{m.trader_count === 1 ? "" : "s"}
                        </p>

                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <RollingNumber text={`₦${Math.floor(m.price_yes ?? 0)}`} color={yesColor.hex} className="text-base font-bold" />
                              <span className={`text-xs ${t.textMuted}`}>YES</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <RollingNumber text={`₦${Math.floor(m.price_no ?? 0)}`} color={noColor.hex} className="text-base font-bold" />
                              <span className={`text-xs ${t.textMuted}`}>NO</span>
                            </div>
                          </div>
                          <div className={`relative flex-1 h-0.5 rounded-full overflow-visible ${theme === "dark" ? "bg-zinc-700" : "bg-slate-200"}`}>
                            <div className={`h-full rounded-full transition-all duration-500 ${noColor.bar}`} style={{ width: "100%" }} />
                            <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${yesColor.bar}`} style={{ width: `${m.price_yes ?? 50}%` }} />
                            {/* floating glow marker at the boundary between YES and NO */}
                            <div
                              className="absolute top-1/2 w-2.5 h-2.5 rounded-full transition-all duration-500 animate-pulse"
                              style={{ left: `${m.price_yes ?? 50}%`, transform: "translate(-50%, -50%)", backgroundColor: yesColor.hex, boxShadow: `0 0 8px 2px ${yesColor.hex}99` }}
                            />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); selectFootball("YES"); }}
                            onMouseEnter={() => setHoverSide("YES")}
                            onMouseLeave={() => setHoverSide(null)}
                            className={`flex-1 text-xs py-2 rounded-lg border-none cursor-pointer font-semibold transition-colors text-white ${yesColor.pill}`}
                          >
                            <RollingNumber text={`Buy YES · ₦${Math.floor(m.price_yes ?? 0)}`} color="#FFFFFF" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); selectFootball("NO"); }}
                            onMouseEnter={() => setHoverSide("NO")}
                            onMouseLeave={() => setHoverSide(null)}
                            className={`flex-1 text-xs py-2 rounded-lg border-none cursor-pointer font-semibold transition-colors text-white ${noColor.pill}`}
                          >
                            <RollingNumber text={`Buy NO · ₦${Math.floor(m.price_no ?? 0)}`} color="#FFFFFF" />
                          </button>
                        </div>
                      </>
                    )}

                    {activeFilter === "SPORTS" && (
                      <>
                        {/* Unlike a team-vs-team match, "YES"/"NO" alone
                            means nothing -- the question itself is the
                            only thing that makes the market legible, so
                            it stays even in the compact Sports layout. */}
                        <p className={`text-sm font-medium ${t.textPrimary} mb-1`}>{m.question}</p>
                        <p className={`text-xs ${t.textMuted} mb-2`}>
                          ₦{m.volume_naira.toLocaleString(undefined, { maximumFractionDigits: 0 })} vol · {m.trader_count} trader{m.trader_count === 1 ? "" : "s"}
                        </p>
                        <div className="flex items-center justify-between gap-3 pt-2 pb-2">
                          <div className="flex flex-col gap-8 shrink-0">
                            <span className={`text-sm font-medium ${t.textPrimary}`}>YES</span>
                            <span className={`text-sm font-medium ${t.textPrimary}`}>NO</span>
                          </div>
                          <div className="flex gap-2 flex-1 justify-end">
                            <button
                              onClick={(e) => { e.stopPropagation(); selectFootball("YES"); }}
                              className={`px-7 py-2.5 text-sm min-w-[7.5rem] rounded-xl font-bold border-none cursor-pointer transition-colors whitespace-nowrap text-white ${yesColor.pill}`}
                            >
                              <RollingNumber text={`YES ₦${Math.floor(m.price_yes ?? 0)}`} color="#FFFFFF" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); selectFootball("NO"); }}
                              className={`px-7 py-2.5 text-sm min-w-[7.5rem] rounded-xl font-bold border-none cursor-pointer transition-colors whitespace-nowrap text-white ${noColor.pill}`}
                            >
                              <RollingNumber text={`NO ₦${Math.floor(m.price_no ?? 0)}`} color="#FFFFFF" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
  };

  return (
    <div className={`min-h-screen ${t.pageBg} ${t.textPrimary} font-sans`}>
      {/* NAV */}
      <nav className={`sticky top-0 z-10 ${t.navBg} border-b ${t.border} shadow-sm`}>

                {/* ROW 1 */}
        <div className="flex items-center justify-between px-3 md:px-6 h-12">
          <div onClick={() => router.push("/")} className="flex items-center gap-1.5 cursor-pointer">
            <span className="w-6 h-6 rounded-md bg-[#CCFF00] flex items-center justify-center text-black text-xs font-black italic">E</span>
            <span className={`text-sm font-bold ${t.textPrimary}`}>Eris</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex flex-col items-end">
                <span className={`${t.textMuted} leading-none mb-0.5`}>Portfolio</span>
                <span className="font-bold text-emerald-500 text-sm">
                  {isLoggedIn ? (totalValueNaira != null ? `₦${totalValueNaira.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "…") : "₦0"}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className={`${t.textMuted} leading-none mb-0.5`}>Cash</span>
                <span className="font-bold text-emerald-500 text-sm">
                  {isLoggedIn ? (cashNaira != null ? `₦${cashNaira.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "…") : "₦0"}
                </span>
              </div>
            </div>
            {isLoggedIn && (
              <button
                onClick={() => router.push("/portfolio")}
                title="Portfolio"
                className={`w-8 h-8 rounded-full border ${t.border} flex items-center justify-center cursor-pointer ${t.navBg} transition-colors`}
              >
                <svg className={`w-4 h-4 ${t.textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            )}
            {isLoggedIn ? (
              <button
                onClick={() => setShowDepositModal(true)}
                className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer border-none ${theme === "dark" ? "bg-blue-500 hover:bg-blue-400" : "bg-black hover:bg-zinc-800"} text-white`}
              >
                Deposit
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className={`text-sm px-4 py-1.5 rounded-md font-semibold transition-colors cursor-pointer border-none ${theme === "dark" ? "bg-blue-500 hover:bg-blue-400" : "bg-black hover:bg-zinc-800"} text-white`}>
                Sign in
              </button>
            )}
          </div>
        </div>

        {/* ROW 2: filters */}
        <div className={`flex items-center gap-1 px-3 md:px-6 py-1.5 border-t ${t.borderLight} overflow-x-auto`}>
          <button
            onClick={() => setActiveFilter("All")}
            className={`flex items-center gap-1 text-xs mr-2 shrink-0 cursor-pointer border-none bg-transparent transition-colors ${t.textMuted}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="font-medium">Trending</span>
          </button>
          {["All", ...topLevelCategories].map((f) => (
            <button
              key={f}
              onClick={() => { setActiveFilter(f); setActiveSubcategory(null); }}
              className={`text-xs px-3 py-1 rounded-full border cursor-pointer transition-colors shrink-0 capitalize ${
                activeFilter === f
                  ? `${t.filterActive} ${t.filterActiveBorder} ${t.filterActiveText} font-medium`
                  : `bg-transparent border-transparent ${t.textMuted} hover:${t.textPrimary}`
              }`}
            >
              {f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* SUB-CATEGORY ROW -- only appears once a category with real
            sub-categories is selected, e.g. Sports -> Football, matching
            how Polymarket lets you drill into a category. */}
        {activeFilter !== "All" && subcategoriesForActive.length > 0 && (
          <div className={`px-3 md:px-6 py-2 border-t ${t.borderLight} flex items-center gap-2 overflow-x-auto`}>
            <button
              onClick={() => setActiveSubcategory(null)}
              className={`text-xs px-3 py-1 rounded-full border cursor-pointer transition-colors shrink-0 ${
                activeSubcategory === null
                  ? `${t.filterActive} ${t.filterActiveBorder} ${t.filterActiveText} font-medium`
                  : `bg-transparent border-transparent ${t.textMuted} hover:${t.textPrimary}`
              }`}
            >
              All {activeFilter.charAt(0) + activeFilter.slice(1).toLowerCase()}
            </button>
            {subcategoriesForActive.map((s) => (
              <button
                key={s}
                onClick={() => setActiveSubcategory(s)}
                className={`text-xs px-3 py-1 rounded-full border cursor-pointer transition-colors shrink-0 capitalize ${
                  activeSubcategory === s
                    ? `${t.filterActive} ${t.filterActiveBorder} ${t.filterActiveText} font-medium`
                    : `bg-transparent border-transparent ${t.textMuted} hover:${t.textPrimary}`
                }`}
              >
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        )}

        {/* ROW 3: search */}
        <div className={`px-3 md:px-3 md:px-3 md:px-3 md:px-3 md:px-3 md:px-3 md:px-6 py-2 border-t ${t.borderLight} flex items-center gap-2`}>
          <button className={`p-1.5 rounded-md ${t.textMuted} transition-colors cursor-pointer border-none bg-transparent shrink-0`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          <div onClick={openSearchModal} className={`flex items-center gap-2 ${t.inputBg} rounded-lg px-3 h-9 flex-1 cursor-pointer`}>
            <svg className={`w-3.5 h-3.5 ${t.textMuted} shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input readOnly className={`bg-transparent text-sm ${t.textPrimary} outline-none flex-1 placeholder:${t.textMuted} cursor-pointer`} placeholder="Search" />
          </div>
          <button className={`p-1.5 rounded-md ${t.textMuted} transition-colors cursor-pointer border-none bg-transparent shrink-0`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 8h10M11 12h4" />
            </svg>
          </button>
        </div>
      </nav>

      {/* BODY */}
      <div className="max-w-5xl mx-auto px-3 md:px-6 py-5 pb-20">
        {/* LEFT */}
        <div className={`grid grid-cols-1 ${activeFilter === "SPORTS" ? "max-w-3xl mx-auto" : "md:grid-cols-2"} gap-3 w-full items-start`}>
          {(activeFilter === "All" || activeFilter === "CRYPTO") && (() => {
            const yes = btcLive?.price_yes ?? 50;
            const no = btcLive?.price_no ?? 50;
            const mins = btcSecondsLeft != null ? Math.floor(btcSecondsLeft / 60) : null;
            const secs = btcSecondsLeft != null ? btcSecondsLeft % 60 : null;
            const pctElapsed = btcSecondsLeft != null ? Math.round(((300 - btcSecondsLeft) / 300) * 100) : 0;
            const pctRemaining = 100 - pctElapsed;
            const r = 15;
            const circumference = 2 * Math.PI * r;
            const offset = circumference * (1 - pctElapsed / 100);
            const vol = btcLive?.volume_naira ?? 0;
            const traders = btcLive?.trader_count ?? 0;

            return (
              <div
                onClick={() => router.push("/btc")}
                className={`relative overflow-hidden ${t.cardBg} rounded-xl p-4 cursor-pointer transition-all border shadow-sm ${t.border} hover:shadow-md`}
              >
                {btcLive?.market_id && bubbles.filter((b) => b.marketId === btcLive.market_id).map((b) => (
                  <span
                    key={b.id}
                    className="float-up"
                    style={{ left: `${b.x}%`, bottom: "50%", color: b.outcome === "YES" ? "#00E676" : "#FF3131" }}
                  >
                    {b.outcome === "YES" ? "Up" : "Down"} +₦{b.amount}
                  </span>
                ))}
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-full bg-[#F7931A] flex items-center justify-center text-white text-sm font-bold shrink-0">₿</span>
                    <div>
                      <p className={`text-sm font-medium leading-snug ${t.textPrimary}`}>BTC Up or Down 5m</p>
                      <p className={`text-xs ${t.textMuted} mt-0.5`}>
                        ₦{vol.toLocaleString(undefined, { maximumFractionDigits: 0 })} vol · {traders} trader{traders === 1 ? "" : "s"}
                      </p>
                      {btcLive?.open_price_usd != null && (
                        <p className={`text-xs ${t.textMuted} mt-0.5`}>
                          Target: ${btcLive.open_price_usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </p>
                      )}
                      <p className={`text-xs ${t.textMuted} mt-0.5 flex items-center gap-1.5`}>
                        <span className="relative flex h-1.5 w-1.5 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EF4444] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#EF4444]"></span>
                        </span>
                        <span className="text-[#EF4444] font-medium">LIVE</span>
                        {mins != null && <span>· resolves in {mins}:{String(secs).padStart(2, "0")}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="relative w-9 h-9" title={`${pctRemaining}% of this round remains`}>
                      <svg viewBox="0 0 36 36" className="w-9 h-9 -rotate-90">
                        <circle cx="18" cy="18" r={r} fill="none" stroke={theme === "dark" ? "#2A2A2A" : "#E2E8F0"} strokeWidth="3" />
                        <circle
                          cx="18" cy="18" r={r} fill="none"
                          stroke={theme === "dark" ? "#00E676" : "#000000"}
                          strokeWidth="3" strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={offset}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-[9px] font-bold ${t.textPrimary}`}>{pctRemaining}%</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className={`p-1 rounded transition-colors cursor-pointer border-none bg-transparent ${t.textMuted}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <RollingNumber text={`₦${Math.round(yes)}`} color={theme === "dark" ? "#00E676" : "#000000"} className="text-base font-bold" />
                      <span className={`text-xs ${t.textMuted}`}>UP</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <RollingNumber text={`₦${Math.round(no)}`} color={theme === "dark" ? "#EF4444" : "#6B0D0D"} className="text-base font-bold" />
                      <span className={`text-xs ${t.textMuted}`}>DOWN</span>
                    </div>
                  </div>
                  <div className={`relative flex-1 h-0.5 rounded-full overflow-visible ${theme === "dark" ? "bg-red-500" : "bg-[#A52020]"}`}>
                    <div className={`h-full rounded-full transition-all duration-500 ${theme === "dark" ? "bg-[#00E676]" : t.accent}`} style={{ width: `${yes}%` }} />
                    <div
                      className={`absolute top-1/2 w-2.5 h-2.5 rounded-full transition-all duration-500 animate-pulse ${theme === "dark" ? "bg-[#00E676] shadow-[0_0_8px_2px_rgba(0,230,118,0.7)]" : "bg-black shadow-[0_0_8px_2px_rgba(0,0,0,0.5)]"}`}
                      style={{ left: `${yes}%`, transform: "translate(-50%, -50%)" }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push("/btc"); }}
                    className={`flex-1 text-xs py-2 rounded-lg border-none cursor-pointer font-semibold transition-colors ${theme === "dark" ? "bg-[#00E676] hover:opacity-90 text-black" : "bg-black hover:bg-zinc-800 text-white"}`}
                  >
                    <RollingNumber text={`Buy Up · ₦${Math.round(yes)}`} color={theme === "dark" ? "#000000" : "#FFFFFF"} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push("/btc"); }}
                    className="flex-1 text-xs py-2 rounded-lg border-none cursor-pointer font-semibold transition-colors bg-red-500 hover:bg-red-400 text-white"
                  >
                    <RollingNumber text={`Buy Down · ₦${Math.round(no)}`} color="#FFFFFF" />
                  </button>
                </div>
              </div>
            );
          })()}

          <>
            {footballLoading && <p className={`text-sm ${t.textMuted}`}>Loading markets…</p>}
            {!footballLoading && footballMarkets.filter((m) => !m.closed).length === 0 && (
              <p className={`text-sm ${t.textMuted}`}>No markets open right now. Check back soon.</p>
            )}
            {(() => {
              const openMarkets = footballMarkets.filter((m) => !m.closed);
              const ungrouped = openMarkets.filter((m) => !m.league);
              const leagueNames = Array.from(new Set(openMarkets.filter((m) => m.league).map((m) => m.league as string)));
              const CARDS_PER_LEAGUE_PREVIEW = 5;

              const toggleLeague = (name: string) => {
                setExpandedLeagues((prev) => {
                  const next = new Set(prev);
                  if (next.has(name)) next.delete(name);
                  else next.add(name);
                  return next;
                });
              };

              return (
                <>
                  {ungrouped.map(renderMarketCard)}

                  {leagueNames.map((leagueName) => {
                    const leagueMarkets = openMarkets.filter((m) => m.league === leagueName);
                    const isExpanded = expandedLeagues.has(leagueName);
                    const visible = isExpanded ? leagueMarkets : leagueMarkets.slice(0, CARDS_PER_LEAGUE_PREVIEW);
                    return (
                      <div key={leagueName} className="col-span-full flex flex-col gap-3">
                        <h3 className={`text-sm font-bold ${t.textPrimary} mt-2`}>{leagueName}</h3>
                        <div className={`grid gap-3 ${activeFilter === "SPORTS" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
                          {visible.map(renderMarketCard)}
                        </div>
                        {leagueMarkets.length > CARDS_PER_LEAGUE_PREVIEW && (
                          <button
                            onClick={() => toggleLeague(leagueName)}
                            className={`self-end text-xs font-medium ${t.textMuted} hover:${t.textPrimary} cursor-pointer bg-transparent border-none flex items-center gap-1`}
                          >
                            {isExpanded ? "Show fewer" : `View all ${leagueName} games`} <span>→</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </>
              );
            })()}
          </>

          {filtered.map((market, i) => (
            <div
              key={`${activeFilter}-${market.id}`}
              ref={(el) => cardRef(el, market)}
              data-market-id={market.id}
              onClick={() => router.push(`/market/${market.id}`)}
              style={{ animationDelay: `${i * 0.06}s` }}
              className={`relative overflow-hidden ghost-in ${t.cardBg} rounded-xl p-4 cursor-pointer transition-all border shadow-sm ${
                selectedMarket.id === market.id
                  ? `${theme === "dark" ? "border-[#CCFF00] shadow-[#CCFF00]/20" : "border-blue-500 shadow-blue-100"} shadow-md`
                  : `${t.border} hover:shadow-md`
              }`}
            >
              {bubbles.filter((b) => b.marketId === market.id).map((b) => (
                <span
                  key={b.id}
                  className="float-up"
                  style={{
                    left: `${b.x}%`,
                    bottom: "60px",
                    color: b.outcome === "YES" ? "#4ade80" : "#ef4444",
                  }}
                >
                  {b.outcome} +₦{b.amount}
                </span>
              ))}
              <div className="flex justify-between items-start gap-3 mb-3">
                <div className="flex-1">
                  <p className={`text-sm font-medium leading-snug ${t.textPrimary}`}>{market.question}</p>
                  <p className={`text-xs ${t.textMuted} mt-1`}>e{market.volume} vol · {market.traders} traders · {market.closes}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColor(market.category)}`}>
                    {market.category}
                  </span>
                  <button
                    onClick={(e) => toggleBookmark(market.id, e)}
                    className={`p-1 rounded transition-colors cursor-pointer border-none bg-transparent ${
                      bookmarks.includes(market.id) ? t.accentText : `${t.textMuted}`
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill={bookmarks.includes(market.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* PROBABILITY BAR OR MULTI-OPTION */}
              {(market as any).multiOption ? (
                <div className="flex flex-col gap-2 mt-1">
                  {(market as any).options.map((opt: any) => (
                    <div key={opt.name} className="flex items-center justify-between gap-3">
                      <span className={`text-xs font-medium ${t.textSecondary} w-36 shrink-0`}>{opt.name}</span>
                      <div className="flex gap-2 ml-auto">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedFootballMarket(null); setSelectedMarket(market); setSide("YES"); setAmount(0); setMobileSheetOpen(true); }}
                          onMouseEnter={() => setHoverSide("YES")}
                          onMouseLeave={() => setHoverSide(null)}
                          className={`text-xs px-3 py-1 rounded-lg border font-medium cursor-pointer transition-colors ${
                            theme === "dark"
                              ? "border-white/40 bg-black text-green-400 hover:bg-green-500 hover:text-black hover:border-green-500"
                              : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                          }`}
                        >
                          Yes {(opt.yesPrice * 100).toFixed(0)}e
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedFootballMarket(null); setSelectedMarket(market); setSide("NO"); setAmount(0); setMobileSheetOpen(true); }}
                          onMouseEnter={() => setHoverSide("NO")}
                          onMouseLeave={() => setHoverSide(null)}
                          className={`text-xs px-3 py-1 rounded-lg border font-medium cursor-pointer transition-colors ${
                            theme === "dark"
                              ? "border-white/40 bg-black text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500"
                              : "bg-[#FDF4F4] text-[#7A1010] border-[#A52020] hover:bg-[#6B0D0D] hover:text-white hover:border-[#6B0D0D]"
                          }`}
                        >
                          No {(opt.noPrice * 100).toFixed(0)}e
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className={`text-base font-bold ${theme === "dark" ? "text-green-400" : t.accentText}`}>₦{Math.round(market.yesPrice * 100)}</span>
                        <span className={`text-xs ${t.textMuted}`}>YES</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className={`text-base font-bold ${theme === "dark" ? "text-red-500" : "text-[#6B0D0D]"}`}>₦{Math.round(market.noPrice * 100)}</span>
                        <span className={`text-xs ${t.textMuted}`}>NO</span>
                      </div>
                    </div>
                    <div className={`flex-1 h-0.5 rounded-full overflow-hidden ${theme === "dark" ? "bg-red-500" : "bg-[#A52020]"}`}>
                      <div className={`h-full rounded-full ${theme === "dark" ? "bg-green-400" : t.accent}`} style={{ width: `${market.yesPrice * 100}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedFootballMarket(null); setSelectedMarket(market); setSide("YES"); setAmount(0); setMobileSheetOpen(true); }}
                      onMouseEnter={() => setHoverSide("YES")}
                      onMouseLeave={() => setHoverSide(null)}
                      className={`flex-1 text-xs py-1.5 rounded-lg border cursor-pointer font-medium transition-colors ${
                        theme === "dark"
                          ? "border-white/40 bg-black text-white hover:bg-green-500 hover:text-black hover:border-green-500"
                          : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                      }`}
                    >
                      Buy YES · {Math.round(market.yesPrice * 100)}e
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedFootballMarket(null); setSelectedMarket(market); setSide("NO"); setAmount(0); setMobileSheetOpen(true); }}
                      onMouseEnter={() => setHoverSide("NO")}
                      onMouseLeave={() => setHoverSide(null)}
                      className={`flex-1 text-xs py-1.5 rounded-lg border cursor-pointer font-medium transition-colors ${
                        theme === "dark"
                          ? "border-white/40 bg-black text-white hover:bg-red-500 hover:text-white hover:border-red-500"
                          : "bg-[#FDF4F4] text-[#7A1010] border-[#A52020] hover:bg-[#6B0D0D] hover:text-white hover:border-[#6B0D0D]"
                      }`}
                    >
                      Buy NO · {Math.round(market.noPrice * 100)}e
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* RIGHT — TRADE PANEL (retired: the sheet below is now the
            universal buy interface on every screen size, matching how
            Polymarket actually does it. This block is kept, not deleted,
            since ripping out ~600 lines of interdependent JSX in one pass
            is real risk for no functional gain -- "hidden" here makes it
            permanently inert instead. */}
        <div className="hidden">
          <div key={panelKey} className={`pop-in ${t.cardBg} rounded-xl p-4 shadow-sm transition-all duration-200 border ${
              theme === "dark"
                ? activeSide === "YES" ? "border-green-500/60" : activeSide === "NO" ? "border-red-500/60" : t.border
                : t.border
            } ${panelVisible ? "opacity-100" : "opacity-0"}`}>
            <p className={`text-xs ${theme === "dark" ? "text-white/90" : t.textMuted} mb-1 leading-snug line-clamp-2 font-medium`}>
              {selectedFootballMarket ? selectedFootballMarket.question : selectedMarket.question}
            </p>
            <p className={`text-xs ${theme === "dark" ? "text-white/60" : t.textMuted} mb-3`}>
              {selectedFootballMarket ? "Football \u00b7 real match" : selectedMarket.closes}
            </p>

            <div className={`flex rounded-lg overflow-hidden border ${t.border} mb-4`}>
              <button
                onClick={() => setSide("YES")}
                className={`flex-1 text-sm font-medium py-2 border-none cursor-pointer transition-colors ${
                  activeSide === "YES" ? "bg-green-500 text-black" : "bg-[#141414] text-white border border-white/20 hover:bg-green-500 hover:text-black hover:border-green-500"
                }`}
              >
                Buy YES
              </button>
              <button
                onClick={() => setSide("NO")}
                className={`flex-1 text-sm font-medium py-2 border-none cursor-pointer transition-colors ${
                  activeSide === "NO" ? "bg-red-500 text-white" : "bg-[#141414] text-white border border-white/20 hover:bg-red-500 hover:text-white hover:border-red-500"
                }`}
              >
                Buy NO
              </button>
            </div>

            <p className={`text-xs ${theme === "dark" ? "text-white/80" : t.textMuted} mb-1.5`}>Amount</p>
            <div className={`flex items-center gap-2 ${t.inputBg} border ${t.border} rounded-lg px-3 h-10 mb-2`}>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className={`bg-transparent text-sm ${t.textPrimary} outline-none flex-1 text-right`}
              />
              <span className="text-sm font-bold text-green-400 shrink-0">e</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 mb-4">
              {[5, 10, 25, 50].map((a) => (
                <button
                  key={a}
                  onClick={() => setAmount(a)}
                  className={`text-xs py-1.5 rounded-lg border cursor-pointer transition-colors ${
                    amount === a
                      ? theme === "dark"
                        ? activeSide === "YES"
                          ? "bg-green-500 border-green-500 text-black font-medium"
                          : activeSide === "NO"
                          ? "bg-red-500 border-red-500 text-white font-medium"
                          : `${t.amountActive} ${t.amountActiveBorder} ${t.amountActiveText} font-medium`
                        : `${t.amountActive} ${t.amountActiveBorder} ${t.amountActiveText} font-medium`
                      : `border border-white/20 bg-[#080808] text-white`
                  }`}
                >
                  ₦{a}
                </button>
              ))}
            </div>

            <div className={`${t.summaryBg} border ${t.borderLight} rounded-lg p-3 mb-4 flex flex-col gap-2`}>
              <div className={`flex justify-between text-xs ${theme === "dark" ? "text-white/70" : t.textMuted}`}>
                <span>{side} price</span>
                <RollingNumber text={`₦${price.toFixed(2)} per contract`} color={theme === "dark" ? "#B0B0B0" : "#64748B"} />
              </div>
              <div className={`flex justify-between text-xs ${theme === "dark" ? "text-white/70" : t.textMuted}`}>
                <span>Contracts</span><span>{contracts}</span>
              </div>
              <div className={`flex justify-between text-xs ${theme === "dark" ? "text-white/70" : t.textMuted}`}>
                <span>Fee (2%)</span><span>₦{fee}</span>
              </div>
              <div className={`h-px ${theme === "dark" ? "bg-zinc-700" : "bg-slate-200"}`} />
              <div className={`flex justify-between text-sm font-semibold ${t.textPrimary}`}>
                <span>Payout if {side}</span>
                <RollingNumber
                  text={`₦${payout.toFixed(2)}`}
                  color={
                    theme === "dark"
                      ? activeSide === "YES" ? "#00E676" : activeSide === "NO" ? "#FF3131" : "#00E676"
                      : "#000000"
                  }
                />
              </div>
            </div>

            {selectedFootballMarket && footballTradeStatus.error && (
              <p className="text-xs text-red-500 mb-2 text-center">{footballTradeStatus.error}</p>
            )}
            {selectedFootballMarket && footballTradeStatus.success && (
              <p className="text-xs text-green-500 mb-2 text-center">{footballTradeStatus.success}</p>
            )}

            <button
              onClick={() => {
                if (!isLoggedIn) { setShowAuthModal(true); return; }
                if (selectedFootballMarket) { handleFootballBuy(); }
              }}
              disabled={!!selectedFootballMarket && footballTradeStatus.loading}
              className={`w-full py-2.5 rounded-lg text-sm font-medium border-none cursor-pointer transition-colors disabled:opacity-50 ${
                theme === "dark"
                  ? activeSide === "YES"
                    ? "bg-[#00E676] hover:opacity-90 text-black"
                    : activeSide === "NO"
                    ? "bg-red-500 hover:bg-red-400 text-white"
                    : side === "YES" ? "bg-[#00E676] text-black" : "bg-[#FF3131] text-white"
                  : side === "YES" ? `${t.accent} ${t.accentHover} text-white` : "bg-[#6B0D0D] text-white"
              }`}>
              {!isLoggedIn
                ? "Sign in to trade"
                : selectedFootballMarket && footballTradeStatus.loading
                ? "…"
                : `Confirm buy ${side}`}
            </button>
          </div>

          {/* PORTFOLIO */}
          <div className={`${t.cardBg} border ${t.border} rounded-xl p-4 shadow-sm`}>
            <p className={`text-xs font-medium ${theme === "dark" ? "text-white/80" : t.textMuted} uppercase tracking-widest mb-3`}>Your positions</p>
            <div className="flex flex-col gap-2">
              {[
                { label: "Peter Obi 2027", side: "YES", contracts: 14, pnl: "+₦84", up: true },
                { label: "AFCON Nigeria", side: "NO", contracts: 8, pnl: "+₦32", up: true },
                { label: "Inflation below 20%", side: "YES", contracts: 20, pnl: "−₦120", up: false },
              ].map((pos) => (
                <div key={pos.label} className={`flex items-center justify-between py-1.5 border-b ${t.borderLight} last:border-0`}>
                  <div>
                    <p className={`text-xs font-medium ${theme === "dark" ? "text-white" : t.textPrimary} leading-snug`}>{pos.label}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      pos.side === "YES"
                      ? theme === "dark" ? "bg-green-500/15 text-green-400" : "bg-blue-50 text-blue-600"
                      : theme === "dark" ? "bg-red-500/15 text-red-400" : "bg-[#FDF4F4] text-[#7A1010]"
                    }`}>
                      {pos.side} · {pos.contracts}
                    </span>
                  </div>
                  <span className={`text-xs font-semibold ${pos.up ? "text-emerald-500" : "text-red-500"}`}>{pos.pnl}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM NAV */}
      <nav className={`fixed bottom-0 left-0 right-0 ${t.bottomNav} border-t ${t.bottomNavBorder} flex items-center justify-around px-4 py-2 z-20`}>
        {[
          { label: "Home", icon: "home" },
          { label: "Breaking", icon: "breaking" },
          { label: "Search", icon: "search" },
          { label: "More", icon: "more" },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => { if (item.icon === "breaking") router.push("/breaking"); if (item.icon === "search") openSearchModal(); if (item.icon === "more") router.push("/more"); }}
            className={`flex flex-col items-center gap-1 ${item.label === "Home" ? t.textPrimary : t.textMuted} hover:${t.accentText} transition-colors cursor-pointer border-none bg-transparent py-1 px-3`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {item.icon === "home" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />}
              {item.icon === "breaking" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />}
              {item.icon === "search" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />}
              {item.icon === "more" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </nav>
    {/* SEARCH MODAL */}
      {showSearchModal && (
        <div
          className={`fixed inset-0 z-50 flex items-end justify-center transition-colors duration-300 ${searchModalOpen ? "bg-black/70" : "bg-black/0"}`}
          onClick={closeSearchModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-lg ${t.cardBg} rounded-t-2xl border-t ${t.border} px-4 pt-2 pb-6 h-[92vh] overflow-y-auto transition-transform duration-300 ease-out ${searchModalOpen ? "translate-y-0" : "translate-y-full"}`}
          >
            <div className="flex justify-center pt-1 pb-3">
              <div className={`w-10 h-1 rounded-full ${theme === "dark" ? "bg-white/20" : "bg-slate-300"}`} />
            </div>

            <div className={`flex items-center gap-2 ${t.inputBg} rounded-xl px-4 h-12 mb-6`}>
              <svg className={`w-5 h-5 ${t.textMuted} shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`bg-transparent text-base ${t.textPrimary} outline-none flex-1 placeholder:${t.textMuted}`}
                placeholder="Search markets or users..."
              />
            </div>

            {searchQuery.trim().length >= 2 ? (
              <>
                {searchLoading && <p className={`text-sm ${t.textMuted} mb-4`}>Searching…</p>}

                {!searchLoading && searchResults.markets.length === 0 && searchResults.users.length === 0 && (
                  <p className={`text-sm ${t.textMuted} mb-4`}>No matches for &quot;{searchQuery}&quot;.</p>
                )}

                {searchResults.markets.length > 0 && (
                  <>
                    <div className={`text-xs font-semibold tracking-wide ${t.textMuted} mb-3`}>MARKETS</div>
                    <div className="flex flex-col gap-2 mb-6">
                      {searchResults.markets.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => { closeSearchModal(); router.push(`/market/${m.id}`); }}
                          className={`flex items-center gap-3 ${t.inputBg} rounded-xl px-4 py-3 cursor-pointer border-none text-left transition-colors hover:${t.accentBg}`}
                        >
                          <svg className={`w-4 h-4 ${t.textMuted} shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V9m4 8V5m4 12v-6M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span className={`text-sm font-medium ${t.textPrimary}`}>{m.question}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {searchResults.users.length > 0 && (
                  <>
                    <div className={`text-xs font-semibold tracking-wide ${t.textMuted} mb-3`}>USERS</div>
                    <div className="flex flex-col gap-2">
                      {searchResults.users.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => { closeSearchModal(); router.push(`/profile/${u.id}`); }}
                          className={`flex items-center gap-3 ${t.inputBg} rounded-xl px-4 py-3 cursor-pointer border-none text-left transition-colors hover:${t.accentBg}`}
                        >
                          <span className={`w-8 h-8 rounded-full ${t.accentBg} flex items-center justify-center text-xs font-bold ${t.accentText} shrink-0`}>
                            {u.display_name.charAt(0).toUpperCase()}
                          </span>
                          <span className={`text-sm font-medium ${t.textPrimary}`}>{u.display_name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className={`text-xs font-semibold tracking-wide ${t.textMuted} mb-3`}>BROWSE</div>
                <div className="flex flex-wrap gap-2.5 mb-7">
                  {[
                    { label: "New", d: "M12 4v16m8-8H4" },
                    { label: "Trending", d: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
                    { label: "Popular", d: "M12 21C7 16 3 12.5 3 8.5 3 5.9 5 4 7.5 4 9 4 10.5 4.8 12 6.4 13.5 4.8 15 4 16.5 4 19 4 21 5.9 21 8.5 21 12.5 17 16 12 21z" },
                    { label: "Liquid", d: "M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z" },
                    { label: "Ending Soon", d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
                    { label: "Competitive", d: "M12 15a4 4 0 100-8 4 4 0 000 8zm0 0v6m-4-2.5l-2 2M16 18.5l2 2" },
                  ].map((b) => (
                    <button
                      key={b.label}
                      className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-full border ${t.border} ${t.textPrimary} font-medium cursor-pointer bg-transparent transition-colors hover:${t.inputBg}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={b.d} />
                      </svg>
                      {b.label}
                    </button>
                  ))}
                </div>

                <div className={`text-xs font-semibold tracking-wide ${t.textMuted} mb-3`}>TOPICS</div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Live Crypto", emoji: "📈", bg: "#3B1B1B" },
                    { label: "Politics", emoji: "🏛️", bg: "#3B2A1B" },
                    { label: "Middle East", emoji: "🌍", bg: "#1B2E3B" },
                    { label: "Crypto", emoji: "₿", bg: "#3B2E12" },
                    { label: "Sports", emoji: "🏀", bg: "#1B2E3B" },
                    { label: "Pop Culture", emoji: "🎭", bg: "#3B2A1B" },
                    { label: "Tech", emoji: "💻", bg: "#132E2B" },
                    { label: "AI", emoji: "🤖", bg: "#1B233B" },
                  ].map((topic) => (
                    <button
                      key={topic.label}
                      className={`flex items-center gap-3 ${t.inputBg} rounded-xl px-4 py-4 cursor-pointer border-none text-left transition-colors hover:${t.accentBg}`}
                    >
                      <span
                        className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0"
                        style={{ backgroundColor: theme === "dark" ? topic.bg : "#F1F5F9" }}
                      >
                        {topic.emoji}
                      </span>
                      <span className={`text-base font-medium ${t.textPrimary}`}>{topic.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    {/* MOBILE TRADE SHEET -- slides up in place instead of navigating away,
        matching the reference UX (Buy pill, big editable amount, Yes/No
        toggle, live "To win" total, quick-amount chips, one Trade button).
        Works for BOTH real markets (selectedFootballMarket set -- real
        trade execution via handleFootballBuy, same as before) and static
        markets (selectedFootballMarket null -- matches the desktop
        panel's existing behavior for these, no real backend call since
        there's nothing real to execute). Reuses the page's existing
        top-level `price`/`payout` calc, which already handles both cases
        correctly -- not a second, possibly-inconsistent calculation. */}
      {mobileSheetOpen && (() => {
        const questionText = selectedFootballMarket ? selectedFootballMarket.question : selectedMarket.question;
        return (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileSheetOpen(false)} />
            <div className={`absolute bottom-0 left-0 right-0 md:left-1/2 md:right-auto md:-translate-x-1/2 md:bottom-8 md:w-full md:max-w-md ${t.cardBg} rounded-t-2xl md:rounded-2xl pb-8 px-6 pt-4 shadow-2xl`}>
              <div className={`w-10 h-1 rounded-full mx-auto mb-3 ${theme === "dark" ? "bg-zinc-700" : "bg-slate-200"}`} />

              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${t.inputBg} ${t.textPrimary}`}>Buy</span>
                <button onClick={() => setMobileSheetOpen(false)} className={`w-7 h-7 rounded-full flex items-center justify-center ${t.inputBg} ${t.textMuted} cursor-pointer border-none`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className={`text-xs ${t.textMuted} mb-1 line-clamp-1`}>{questionText}</p>
              <p className={`text-sm font-semibold mb-4 ${side === "YES" ? (theme === "dark" ? "text-[#00E676]" : "text-black") : "text-[#FF3131]"}`}>{side}</p>

              <div className="flex items-center justify-center mb-4">
                <span className={`text-5xl font-bold ${t.textMuted}`}>₦</span>
                <input
                  type="number"
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="0"
                  className={`text-5xl font-bold bg-transparent outline-none text-center w-48 ${t.textPrimary}`}
                  autoFocus
                />
              </div>

              <div className={`flex rounded-lg overflow-hidden border ${t.border} mb-4`}>
                <button
                  onClick={() => setSide("YES")}
                  className={`flex-1 text-sm font-medium py-2 border-none cursor-pointer transition-colors ${
                    side === "YES" ? (theme === "dark" ? "bg-[#00E676] text-black" : "bg-black text-white") : `${t.inputBg} ${t.textMuted}`
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => setSide("NO")}
                  className={`flex-1 text-sm font-medium py-2 border-none cursor-pointer transition-colors ${
                    side === "NO" ? "bg-red-500 text-white" : `${t.inputBg} ${t.textMuted}`
                  }`}
                >
                  No
                </button>
              </div>

              {amount > 0 && (
                <p className="text-center text-sm mb-4 flex items-center justify-center gap-1">
                  <span className={t.textMuted}>To win</span>
                  <RollingNumber text={`₦${payout.toFixed(2)}`} color={theme === "dark" ? "#00E676" : "#000000"} className="font-bold text-sm" />
                </p>
              )}

              <div className="flex gap-2 mb-4">
                {[100, 500, 1000, 5000].map((a) => (
                  <button
                    key={a}
                    onClick={() => setAmount((prev) => prev + a)}
                    className={`flex-1 text-xs py-2 rounded-lg border ${t.border} ${t.textPrimary} cursor-pointer bg-transparent`}
                  >
                    +₦{a}
                  </button>
                ))}
              </div>

              {selectedFootballMarket && footballTradeStatus.error && <p className="text-xs text-red-500 mb-2 text-center">{footballTradeStatus.error}</p>}
              {selectedFootballMarket && footballTradeStatus.success && <p className="text-xs text-green-500 mb-2 text-center">{footballTradeStatus.success}</p>}

              <button
                onClick={async () => {
                  if (!isLoggedIn) { setShowAuthModal(true); return; }
                  if (selectedFootballMarket) { await handleFootballBuy(); }
                  // static markets have no real backend to execute against --
                  // same placeholder behavior the desktop panel already has
                }}
                disabled={(selectedFootballMarket ? footballTradeStatus.loading : false) || amount <= 0}
                className={`w-full py-4 rounded-xl text-base font-bold border-none cursor-pointer disabled:opacity-50 ${theme === "dark" ? "bg-blue-500 hover:bg-blue-400" : "bg-black hover:bg-zinc-800"} text-white`}
              >
                {!isLoggedIn ? "Sign in to trade" : selectedFootballMarket && footballTradeStatus.loading ? "…" : "Trade"}
              </button>
            </div>
          </div>
        );
      })()}

    {/* MULTI-OUTCOME TRADE SHEET -- same visual pattern as the binary
        sheet above, but instead of a Yes/No toggle, shows every outcome
        as a switchable pill row (since there's no single "other side" to
        flip to the way there is with Yes/No). Calls the same auto-
        detecting /trade/buy endpoint the binary sheet uses. */}
      {multiSheetOpen && selectedMultiMarket && selectedMultiOutcome && selectedMultiMarket.outcomes && (() => {
        const outcomes = selectedMultiMarket.outcomes!;
        const price = outcomes[selectedMultiOutcome] ?? 100 / Object.keys(outcomes).length;
        const estContracts = price > 0 && multiAmount > 0 ? Math.max(1, Math.round(multiAmount / price)) : 0;
        const toWin = estContracts * 100;
        return (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMultiSheetOpen(false)} />
            <div className={`absolute bottom-0 left-0 right-0 md:left-1/2 md:right-auto md:-translate-x-1/2 md:bottom-8 md:w-full md:max-w-md ${t.cardBg} rounded-t-2xl md:rounded-2xl pb-8 px-6 pt-4 shadow-2xl`}>
              <div className={`w-10 h-1 rounded-full mx-auto mb-3 ${theme === "dark" ? "bg-zinc-700" : "bg-slate-200"}`} />

              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${t.inputBg} ${t.textPrimary}`}>Buy</span>
                <button onClick={() => setMultiSheetOpen(false)} className={`w-7 h-7 rounded-full flex items-center justify-center ${t.inputBg} ${t.textMuted} cursor-pointer border-none`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className={`text-xs ${t.textMuted} mb-3 line-clamp-1`}>{selectedMultiMarket.question}</p>

              {/* outcome switcher -- change which one you're buying before confirming */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {(() => {
                  const MUTED_HEX = ["#C2410C", "#991B1B", "#1E40AF", "#047857", "#6B21A8", "#9F1239", "#155E75", "#B45309", "#0F766E", "#3730A3", "#4D7C0F", "#A21CAF"];
                  const hashIdx = (str: string, mod: number) => {
                    let h = 0;
                    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
                    return h % mod;
                  };
                  const outcomeNames = Object.keys(outcomes);
                  const startIdx = hashIdx(outcomeNames[0], MUTED_HEX.length);
                  return Object.entries(outcomes).map(([name, p], i) => {
                    const color = name.toLowerCase() === "draw"
                      ? (theme === "dark" ? "#71717A" : "#94A3B8")
                      : MUTED_HEX[(startIdx + i) % MUTED_HEX.length];
                    const isSelected = name === selectedMultiOutcome;
                    return (
                    <button
                      key={name}
                      onClick={() => setSelectedMultiOutcome(name)}
                      style={isSelected ? { backgroundColor: color, borderColor: color } : undefined}
                      className={`text-xs px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${
                        isSelected ? "text-white font-medium" : `${t.inputBg} ${t.border} ${t.textMuted}`
                      }`}
                    >
                      {name} · {Math.floor(p)}e
                    </button>
                    );
                  });
                })()}
              </div>

              <div className="flex items-center justify-center mb-4">
                <span className={`text-5xl font-bold ${t.textMuted}`}>₦</span>
                <input
                  type="number"
                  value={multiAmount || ""}
                  onChange={(e) => setMultiAmount(Number(e.target.value))}
                  placeholder="0"
                  className={`text-5xl font-bold bg-transparent outline-none text-center w-48 ${t.textPrimary}`}
                  autoFocus
                />
              </div>

              {multiAmount > 0 && (
                <p className="text-center text-sm mb-4 flex items-center justify-center gap-1">
                  <span className={t.textMuted}>To win</span>
                  <RollingNumber text={`₦${toWin.toLocaleString()}`} color={theme === "dark" ? "#00E676" : "#000000"} className="font-bold text-sm" />
                </p>
              )}

              <div className="flex gap-2 mb-4">
                {[100, 500, 1000, 5000].map((a) => (
                  <button
                    key={a}
                    onClick={() => setMultiAmount((prev) => prev + a)}
                    className={`flex-1 text-xs py-2 rounded-lg border ${t.border} ${t.textPrimary} cursor-pointer bg-transparent`}
                  >
                    +₦{a}
                  </button>
                ))}
              </div>

              {multiTradeStatus.error && <p className="text-xs text-red-500 mb-2 text-center">{multiTradeStatus.error}</p>}
              {multiTradeStatus.success && <p className="text-xs text-green-500 mb-2 text-center">{multiTradeStatus.success}</p>}

              <button
                onClick={handleMultiOutcomeBuy}
                disabled={multiTradeStatus.loading || multiAmount <= 0}
                className={`w-full py-4 rounded-xl text-base font-bold border-none cursor-pointer disabled:opacity-50 ${theme === "dark" ? "bg-blue-500 hover:bg-blue-400" : "bg-black hover:bg-zinc-800"} text-white`}
              >
                {!isLoggedIn ? "Sign in to trade" : multiTradeStatus.loading ? "…" : `Trade ${selectedMultiOutcome}`}
              </button>
            </div>
          </div>
        );
      })()}

    {/* DEPOSIT MODAL */}
      {showDepositModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowDepositModal(false)}
        >
          <div className={`${t.cardBg} border ${t.border} rounded-2xl p-6 w-80 shadow-2xl`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-5 justify-center">
              <span className="w-7 h-7 rounded-md bg-[#CCFF00] flex items-center justify-center text-black text-sm font-black italic">E</span>
              <span className={`text-base font-bold ${t.textPrimary}`}>Deposit</span>
            </div>

            <p className={`text-xs ${t.textMuted} mb-1.5`}>Amount (₦)</p>
            <input
              type="number"
              min={100}
              value={depositAmount}
              onChange={(e) => setDepositAmount(Number(e.target.value))}
              className={`w-full px-3 py-2.5 rounded-xl text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none mb-4`}
            />

            {depositStatus.message && <p className="text-xs text-red-500 mb-3 text-center">{depositStatus.message}</p>}

            <button
              onClick={handleDeposit}
              disabled={depositStatus.loading}
              className={`w-full py-2.5 rounded-xl font-semibold text-sm border-none cursor-pointer disabled:opacity-50 ${theme === "dark" ? "bg-white text-black" : "bg-black text-white"}`}
            >
              {depositStatus.loading ? "…" : `Pay ₦${depositAmount.toLocaleString()} with Bachs`}
            </button>
            <p className={`text-[10px] ${t.textMuted} text-center mt-3`}>
              Your balance updates automatically once payment is confirmed — no need to refresh manually.
            </p>
          </div>
        </div>
      )}
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
            {/* Logo */}
            <div className="flex items-center gap-2 mb-5 justify-center">
              <span className="w-7 h-7 rounded-md bg-[#CCFF00] flex items-center justify-center text-black text-sm font-black italic">E</span>
              <span className={`text-base font-bold ${t.textPrimary}`}>Eris</span>
            </div>

            {/* CHOICE VIEW */}
            {authView === "choice" && (
              <>
                <h2 className={`text-lg font-bold ${t.textPrimary} text-center mb-1`}>Sign in to trade</h2>
                <p className={`text-xs ${t.textMuted} text-center mb-6`}>You need an account to place trades. Browsing is always free.</p>

                {/* Google */}
                <button
                  onClick={() => alert("Google sign-in isn't set up yet — use email + password below.")}
                  className={`w-full py-2.5 rounded-xl border ${t.border} ${t.cardBg} ${t.textPrimary} font-semibold text-sm mb-3 cursor-pointer transition-colors flex items-center justify-center gap-2 hover:opacity-80`}
                >
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

                <button
                  onClick={() => setAuthView("login")}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm mb-3 border-none cursor-pointer transition-colors ${
                    theme === "dark" ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-zinc-800"
                  }`}
                >
                  Log in
                </button>
                <button
                  onClick={() => setAuthView("signup")}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm mb-4 border-none cursor-pointer transition-colors border ${
                    theme === "dark" ? "bg-black text-white border-white/20 hover:bg-white/10" : "bg-white text-black border-black/20 hover:bg-slate-50"
                  }`}
                >
                  Sign up
                </button>

                <p className={`text-xs ${t.textMuted} text-center`}>
                  By continuing you agree to our{" "}
                  <span className="text-[#CCFF00] cursor-pointer">Terms of Service</span>
                </p>
                <button onClick={() => { setShowAuthModal(false); setAuthView("choice"); }} className={`mt-4 w-full text-xs ${t.textMuted} bg-transparent border-none cursor-pointer`}>
                  Continue browsing
                </button>
              </>
            )}

            {/* LOGIN VIEW */}
            {authView === "login" && (
              <>
                <button onClick={() => setAuthView("choice")} className={`flex items-center gap-1 text-xs ${t.textMuted} bg-transparent border-none cursor-pointer mb-4`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  Back
                </button>
                <h2 className={`text-lg font-bold ${t.textPrimary} text-center mb-5`}>Welcome back</h2>

                {/* Google */}
                <button
                  onClick={() => alert("Google sign-in isn't set up yet — use email + password below.")}
                  className={`w-full py-2.5 rounded-xl border ${t.border} ${t.cardBg} ${t.textPrimary} font-semibold text-sm mb-3 cursor-pointer transition-colors flex items-center justify-center gap-2 hover:opacity-80`}
                >
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

                <div className={`flex flex-col gap-2 mb-3`}>
                  {authError && <p className="text-xs text-red-500 text-center">{authError}</p>}
                  <input
                    type="email"
                    placeholder="Email"
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none placeholder:${t.textMuted}`}
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none placeholder:${t.textMuted}`}
                  />
                </div>
                <button className={`text-xs ${t.textMuted} bg-transparent border-none cursor-pointer mb-4 w-full text-right`}>Forgot password?</button>
                <button
                  onClick={async () => { const ok = await login(authUsername, authPassword); if (ok) { setShowAuthModal(false); setAuthView("choice"); setAuthUsername(""); setAuthPassword(""); } }}
                  disabled={authLoading}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm border-none cursor-pointer transition-colors disabled:opacity-50 ${
                    theme === "dark" ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-zinc-800"
                  }`}
                >
                  {authLoading ? "…" : "Log in"}
                </button>
                <p className={`text-xs ${t.textMuted} text-center mt-4`}>
                  No account?{" "}
                  <span onClick={() => setAuthView("signup")} className="text-[#CCFF00] cursor-pointer">Sign up</span>
                </p>
              </>
            )}

            {/* SIGNUP VIEW */}
            {authView === "signup" && (
              <>
                <button onClick={() => setAuthView("choice")} className={`flex items-center gap-1 text-xs ${t.textMuted} bg-transparent border-none cursor-pointer mb-4`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  Back
                </button>
                <h2 className={`text-lg font-bold ${t.textPrimary} text-center mb-5`}>Create account</h2>

                {/* Google */}
                <button
                  onClick={() => alert("Google sign-in isn't set up yet — use email + password below.")}
                  className={`w-full py-2.5 rounded-xl border ${t.border} ${t.cardBg} ${t.textPrimary} font-semibold text-sm mb-3 cursor-pointer transition-colors flex items-center justify-center gap-2 hover:opacity-80`}
                >
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
                  <input
                    type="email"
                    placeholder="Email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none placeholder:${t.textMuted}`}
                  />
                  <input
                    type="tel"
                    placeholder="Phone number (optional for now)"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none placeholder:${t.textMuted}`}
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none placeholder:${t.textMuted}`}
                  />
                </div>
                <button
                  onClick={async () => { const res = await signup(authEmail, authPassword); if (res.ok) { setAuthView("login"); setAuthEmail(""); setAuthPassword(""); setAuthPhone(""); } }}
                  disabled={authLoading}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm border-none cursor-pointer transition-colors disabled:opacity-50 ${
                    theme === "dark" ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-zinc-800"
                  }`}
                >
                  {authLoading ? "…" : "Create account"}
                </button>
                <p className={`text-xs ${t.textMuted} text-center mt-4`}>
                  Already have an account?{" "}
                  <span onClick={() => setAuthView("login")} className="text-[#CCFF00] cursor-pointer">Log in</span>
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <HomeContent />
    </Suspense>
  );
}