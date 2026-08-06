"use client";


import { useRouter } from "next/navigation";
import { useTheme } from "./context/theme";
import { useState, useRef, useEffect } from "react";


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

const FILTERS = ["All", "Politics", "Economy", "Sports", "Stocks"];

export default function Home() {
  const { theme, toggleTheme, t, isLoggedIn, setIsLoggedIn } = useTheme();
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedMarket, setSelectedMarket] = useState(MARKETS[0]);
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [amount, setAmount] = useState(10);
  const [bookmarks, setBookmarks] = useState<string[]>(["1", "3"]);
  const [panelKey, setPanelKey] = useState(0);
  const [panelVisible, setPanelVisible] = useState(true);
  const [hoverSide, setHoverSide] = useState<"YES" | "NO" | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authView, setAuthView] = useState<"choice" | "login" | "signup">("choice");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authUsername, setAuthUsername] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [bubbles, setBubbles] = useState<{ id: number; marketId: string; side: "YES" | "NO"; amount: number; x: number }[]>([]);
  const router = useRouter();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const cardRefs = useRef<Map<string, typeof MARKETS[0]>>(new Map());
  const cardEls = useRef<HTMLDivElement[]>([]);



  useEffect(() => {
    if (theme !== "dark") return;
    const interval = setInterval(() => {
      const market = MARKETS[Math.floor(Math.random() * MARKETS.length)];
      const side = Math.random() > 0.5 ? "YES" : "NO";
      const amount = [1, 2, 3, 5, 8, 10][Math.floor(Math.random() * 6)];
      const x = 20 + Math.random() * 60;
      const id = Date.now() + Math.random();
      setBubbles((prev) => [...prev, { id, marketId: market.id, side, amount, x }]);
      setTimeout(() => setBubbles((prev) => prev.filter((b) => b.id !== id)), 1900);
    }, 900);
    return () => clearInterval(interval);
  }, [theme]);
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

  const filtered =
    activeFilter === "All"
      ? MARKETS
      : MARKETS.filter((m) => m.category === activeFilter);

  const activeSide = hoverSide ?? side;
const price = side === "YES" ? selectedMarket.yesPrice : selectedMarket.noPrice;
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
    setTimeout(() => setShowSearchModal(false), 300);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("search") === "1") {
      window.history.replaceState({}, "", "/");
      const id = requestAnimationFrame(() => openSearchModal());
      return () => cancelAnimationFrame(id);
    }
  }, []);

  return (
    <div className={`min-h-screen ${t.pageBg} ${t.textPrimary} font-sans`}>
      {/* NAV */}
      <nav className={`sticky top-0 z-10 ${t.navBg} border-b ${t.border} shadow-sm`}>

        {/* ROW 1 */}
        <div className="flex items-center justify-between px-3 md:px-6 h-12">
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-md bg-[#CCFF00] flex items-center justify-center text-black text-xs font-black italic">E</span>
            <span className={`text-sm font-bold ${t.textPrimary}`}>Eris</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex flex-col items-end">
                <span className={`${t.textMuted} leading-none mb-0.5`}>Portfolio</span>
                <span className="font-bold text-emerald-500 text-sm">$83.20</span>
              </div>
              <div className="flex flex-col items-end">
                <span className={`${t.textMuted} leading-none mb-0.5`}>Cash</span>
                <span className="font-bold text-emerald-500 text-sm">$12.45</span>
              </div>
            </div>
            <button
              onClick={() => { if (!isLoggedIn) setShowAuthModal(true); }}
              className="text-sm px-4 py-1.5 rounded-md bg-blue-500 hover:bg-blue-400 text-white font-semibold transition-colors cursor-pointer border-none">
              {isLoggedIn ? "Deposit" : "Sign in"}
            </button>
            {/* THEME TOGGLE */}
            <button
              onClick={toggleTheme}
              className={`w-8 h-8 rounded-full border ${t.border} flex items-center justify-center cursor-pointer ${t.navBg} transition-colors`}
              title={theme === "light" ? "Switch to dark" : "Switch to light"}
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
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`text-xs px-3 py-1 rounded-full border cursor-pointer transition-colors shrink-0 ${
                activeFilter === f
                  ? `${t.filterActive} ${t.filterActiveBorder} ${t.filterActiveText} font-medium`
                  : `bg-transparent border-transparent ${t.textMuted} hover:${t.textPrimary}`
              }`}
            >
              {f}
            </button>
          ))}
        </div>

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
      <div className="max-w-5xl mx-auto px-3 md:px-6 py-5 grid grid-cols-1 md:grid-cols-[1fr_300px] gap-5 pb-20">
        {/* LEFT */}
        <div className="flex flex-col gap-3 w-full">
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
                    color: b.side === "YES" ? "#4ade80" : "#ef4444",
                  }}
                >
                  {b.side} +e{b.amount}
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
                          onClick={(e) => { e.stopPropagation(); setSelectedMarket(market); setSide("YES"); setPanelKey(k => k + 1); }}
                          onMouseEnter={() => setHoverSide("YES")}
                          onMouseLeave={() => setHoverSide(null)}
                          className={`text-xs px-3 py-1 rounded-lg border font-medium cursor-pointer transition-colors ${
                            theme === "dark"
                              ? "border-white/40 bg-black text-green-400 hover:bg-green-500 hover:text-black hover:border-green-500"
                              : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                          }`}
                        >
                          Yes {(opt.yesPrice * 100).toFixed(0)}¢
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedMarket(market); setSide("NO"); setPanelKey(k => k + 1); }}
                          onMouseEnter={() => setHoverSide("NO")}
                          onMouseLeave={() => setHoverSide(null)}
                          className={`text-xs px-3 py-1 rounded-lg border font-medium cursor-pointer transition-colors ${
                            theme === "dark"
                              ? "border-white/40 bg-black text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500"
                              : "bg-[#FDF4F4] text-[#7A1010] border-[#A52020] hover:bg-[#6B0D0D] hover:text-white hover:border-[#6B0D0D]"
                          }`}
                        >
                          No {(opt.noPrice * 100).toFixed(0)}¢
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
                        <span className={`text-base font-bold ${theme === "dark" ? "text-green-400" : t.accentText}`}>{Math.round(market.yesPrice * 100)}¢</span>
                        <span className={`text-xs ${t.textMuted}`}>YES</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className={`text-base font-bold ${theme === "dark" ? "text-red-500" : "text-[#6B0D0D]"}`}>{Math.round(market.noPrice * 100)}¢</span>
                        <span className={`text-xs ${t.textMuted}`}>NO</span>
                      </div>
                    </div>
                    <div className={`flex-1 h-0.5 rounded-full overflow-hidden ${theme === "dark" ? "bg-red-500" : "bg-[#A52020]"}`}>
                      <div className={`h-full rounded-full ${theme === "dark" ? "bg-green-400" : t.accent}`} style={{ width: `${market.yesPrice * 100}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedMarket(market); setSide("YES"); setPanelKey(k => k + 1); }}
                      onMouseEnter={() => setHoverSide("YES")}
                      onMouseLeave={() => setHoverSide(null)}
                      className={`flex-1 text-xs py-1.5 rounded-lg border cursor-pointer font-medium transition-colors ${
                        theme === "dark"
                          ? "border-white/40 bg-black text-white hover:bg-green-500 hover:text-black hover:border-green-500"
                          : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                      }`}
                    >
                      Buy YES · {Math.round(market.yesPrice * 100)}¢
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedMarket(market); setSide("NO"); setPanelKey(k => k + 1); }}
                      onMouseEnter={() => setHoverSide("NO")}
                      onMouseLeave={() => setHoverSide(null)}
                      className={`flex-1 text-xs py-1.5 rounded-lg border cursor-pointer font-medium transition-colors ${
                        theme === "dark"
                          ? "border-white/40 bg-black text-white hover:bg-red-500 hover:text-white hover:border-red-500"
                          : "bg-[#FDF4F4] text-[#7A1010] border-[#A52020] hover:bg-[#6B0D0D] hover:text-white hover:border-[#6B0D0D]"
                      }`}
                    >
                      Buy NO · {Math.round(market.noPrice * 100)}¢
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* RIGHT — TRADE PANEL */}
        <div className="hidden md:flex flex-col gap-4 sticky top-32 self-start">
          <div key={panelKey} className={`pop-in ${t.cardBg} rounded-xl p-4 shadow-sm transition-all duration-200 border ${
              theme === "dark"
                ? activeSide === "YES" ? "border-green-500/60" : activeSide === "NO" ? "border-red-500/60" : t.border
                : t.border
            } ${panelVisible ? "opacity-100" : "opacity-0"}`}>
            <p className={`text-xs ${theme === "dark" ? "text-white/90" : t.textMuted} mb-1 leading-snug line-clamp-2 font-medium`}>{selectedMarket.question}</p>
            <p className={`text-xs ${theme === "dark" ? "text-white/60" : t.textMuted} mb-3`}>{selectedMarket.closes}</p>

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
              <span className="text-sm font-bold text-green-400 shrink-0">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className={`bg-transparent text-sm ${t.textPrimary} outline-none flex-1 text-right`}
              />
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
                  ${a}
                </button>
              ))}
            </div>

            <div className={`${t.summaryBg} border ${t.borderLight} rounded-lg p-3 mb-4 flex flex-col gap-2`}>
              <div className={`flex justify-between text-xs ${theme === "dark" ? "text-white/70" : t.textMuted}`}>
                <span>{side} price</span><span>${price.toFixed(2)} per contract</span>
              </div>
              <div className={`flex justify-between text-xs ${theme === "dark" ? "text-white/70" : t.textMuted}`}>
                <span>Contracts</span><span>{contracts}</span>
              </div>
              <div className={`flex justify-between text-xs ${theme === "dark" ? "text-white/70" : t.textMuted}`}>
                <span>Fee (2%)</span><span>${fee}</span>
              </div>
              <div className={`h-px ${theme === "dark" ? "bg-zinc-700" : "bg-slate-200"}`} />
              <div className={`flex justify-between text-sm font-semibold ${t.textPrimary}`}>
                <span>Payout if {side}</span>
                <span className={theme === "dark" && activeSide === "YES" ? "text-green-400" : theme === "dark" && activeSide === "NO" ? "text-red-400" : t.payoutText}>${payout.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => { if (!isLoggedIn) setShowAuthModal(true); }}
              className={`w-full py-2.5 rounded-lg text-sm font-medium border-none cursor-pointer transition-colors ${
                theme === "dark"
                  ? activeSide === "YES"
                    ? "bg-green-500 hover:bg-green-400 text-black"
                    : activeSide === "NO"
                    ? "bg-red-500 hover:bg-red-400 text-white"
                    : side === "YES" ? "bg-green-500 text-black" : "bg-red-500 text-white"
                  : side === "YES" ? `${t.accent} ${t.accentHover} text-white` : "bg-[#6B0D0D] text-white"
              }`}>
              {isLoggedIn ? `Confirm buy ${side}` : `Sign in to trade`}
            </button>
          </div>

          {/* PORTFOLIO */}
          <div className={`${t.cardBg} border ${t.border} rounded-xl p-4 shadow-sm`}>
            <p className={`text-xs font-medium ${theme === "dark" ? "text-white/80" : t.textMuted} uppercase tracking-widest mb-3`}>Your positions</p>
            <div className="flex flex-col gap-2">
              {[
                { label: "Peter Obi 2027", side: "YES", contracts: 14, pnl: "+84¢", up: true },
                { label: "AFCON Nigeria", side: "NO", contracts: 8, pnl: "+32¢", up: true },
                { label: "Inflation below 20%", side: "YES", contracts: 20, pnl: "−120¢", up: false },
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
            onClick={() => { if (item.icon === "breaking") router.push("/breaking"); if (item.icon === "search") openSearchModal(); }}
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
                className={`bg-transparent text-base ${t.textPrimary} outline-none flex-1 placeholder:${t.textMuted}`}
                placeholder="Search Eris markets..."
              />
            </div>

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
                  onClick={() => { setIsLoggedIn(true); setShowAuthModal(false); setAuthView("choice"); }}
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
                  onClick={() => { setIsLoggedIn(true); setShowAuthModal(false); setAuthView("choice"); }}
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
                  <input
                    type="text"
                    placeholder="Username or email"
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
                  onClick={() => { setIsLoggedIn(true); setShowAuthModal(false); setAuthView("choice"); }}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm border-none cursor-pointer transition-colors ${
                    theme === "dark" ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-zinc-800"
                  }`}
                >
                  Log in
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
                  onClick={() => { setIsLoggedIn(true); setShowAuthModal(false); setAuthView("choice"); }}
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
                  <input
                    type="email"
                    placeholder="Email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none placeholder:${t.textMuted}`}
                  />
                  <input
                    type="tel"
                    placeholder="Phone number"
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
                  onClick={() => { setIsLoggedIn(true); setShowAuthModal(false); setAuthView("choice"); }}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm border-none cursor-pointer transition-colors ${
                    theme === "dark" ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-zinc-800"
                  }`}
                >
                  Create account
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