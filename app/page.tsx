"use client";


import { useRouter } from "next/navigation";
import { useTheme } from "./context/theme";
import { useState, useRef } from "react";


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
];

const FILTERS = ["All", "Politics", "Economy", "Sports", "Stocks"];

export default function Home() {
  const { theme, toggleTheme, t } = useTheme();
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedMarket, setSelectedMarket] = useState(MARKETS[0]);
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [amount, setAmount] = useState(10);
  const [bookmarks, setBookmarks] = useState<string[]>(["1", "3"]);
  const [panelKey, setPanelKey] = useState(0);
  const [panelVisible, setPanelVisible] = useState(true);
  const router = useRouter();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const cardRefs = useRef<Map<string, typeof MARKETS[0]>>(new Map());
  const cardEls = useRef<HTMLDivElement[]>([]);

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

  return (
    <div className={`min-h-screen ${t.pageBg} ${t.textPrimary} font-sans`}>
      {/* NAV */}
      <nav className={`sticky top-0 z-10 ${t.navBg} border-b ${t.border} shadow-sm`}>

        {/* ROW 1 */}
        <div className="flex items-center justify-between px-6 h-12">
          <div className="flex items-center gap-1.5">
            <span className={`w-6 h-6 rounded-md ${t.accent} flex items-center justify-center text-white text-xs font-black italic`}>E</span>
            <span className={`text-sm font-bold ${t.textPrimary}`}>Eris</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex flex-col items-end">
                <span className={`${t.textMuted} leading-none mb-0.5`}>Portfolio</span>
                <span className="font-bold text-emerald-500 text-sm">e83.20</span>
              </div>
              <div className="flex flex-col items-end">
                <span className={`${t.textMuted} leading-none mb-0.5`}>Cash</span>
                <span className="font-bold text-emerald-500 text-sm">e12.45</span>
              </div>
            </div>
            <button className={`text-sm px-4 py-1.5 rounded-md ${t.accent} ${t.accentHover} text-white font-semibold transition-colors cursor-pointer border-none`}>
              Deposit
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
        <div className={`flex items-center gap-1 px-6 py-1.5 border-t ${t.borderLight} overflow-x-auto`}>
          <div className={`flex items-center gap-1 text-xs ${t.textMuted} mr-2 shrink-0`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="font-medium">Trending</span>
          </div>
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
        <div className={`px-6 py-2 border-t ${t.borderLight} flex items-center gap-2`}>
          <button className={`p-1.5 rounded-md ${t.textMuted} transition-colors cursor-pointer border-none bg-transparent shrink-0`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          <div className={`flex items-center gap-2 ${t.inputBg} rounded-lg px-3 h-9 flex-1`}>
            <svg className={`w-3.5 h-3.5 ${t.textMuted} shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input className={`bg-transparent text-sm ${t.textPrimary} outline-none flex-1 placeholder:${t.textMuted}`} placeholder="Search" />
          </div>
          <button className={`p-1.5 rounded-md ${t.textMuted} transition-colors cursor-pointer border-none bg-transparent shrink-0`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 8h10M11 12h4" />
            </svg>
          </button>
        </div>
      </nav>

      {/* BODY */}
      <div className="max-w-5xl mx-auto px-6 py-5 grid grid-cols-[1fr_300px] gap-5 pb-20">
        {/* LEFT */}
        <div className="flex flex-col gap-3">
          {filtered.map((market, i) => (
            <div
              key={`${activeFilter}-${market.id}`}
              ref={(el) => cardRef(el, market)}
              data-market-id={market.id}
              onClick={() => router.push(`/market/${market.id}`)}
              style={{ animationDelay: `${i * 0.06}s` }}
              className={`ghost-in ${t.cardBg} rounded-xl p-4 cursor-pointer transition-all border shadow-sm ${
                selectedMarket.id === market.id
                  ? `${theme === "dark" ? "border-yellow-500 shadow-yellow-900/20" : "border-blue-500 shadow-blue-100"} shadow-md`
                  : `${t.border} hover:shadow-md`
              }`}
            >
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

              {/* PROBABILITY BAR */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className={`text-base font-bold ${t.accentText}`}>{market.yesPrice.toFixed(2)}e</span>
                    <span className={`text-xs ${t.textMuted}`}>YES</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-base font-bold text-[#6B0D0D]">{market.noPrice.toFixed(2)}e</span>
                    <span className={`text-xs ${t.textMuted}`}>NO</span>
                  </div>
                </div>
                <div className="flex-1 h-1.5 rounded-full bg-[#A52020] overflow-hidden">
                  <div className={`h-full rounded-full ${t.accent}`} style={{ width: `${market.yesPrice * 100}%` }} />
                </div>
              </div>

              {/* BUY BUTTONS */}
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedMarket(market); setSide("YES"); setPanelKey(k => k + 1); }}
                  className={`flex-1 text-xs py-1.5 rounded-lg border cursor-pointer font-medium transition-colors hover:bg-yellow-500 hover:border-yellow-500 hover:text-zinc-900 ${
                    theme === "dark"
                      ? "border-yellow-700 bg-yellow-500/10 text-yellow-400"
                      : "border-blue-200 bg-blue-50 text-blue-700"
                  }`}
                >
                  Buy YES · {market.yesPrice.toFixed(2)}e
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedMarket(market); setSide("NO"); setPanelKey(k => k + 1); }}
                  className="flex-1 text-xs py-1.5 rounded-lg border border-[#A52020] bg-[#F9E8E8] text-[#7A1010] hover:bg-[#6B0D0D] hover:text-white hover:border-[#6B0D0D] transition-colors cursor-pointer font-medium"
                >
                  Buy NO · {market.noPrice.toFixed(2)}e
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT — TRADE PANEL */}
        <div className="flex flex-col gap-4 sticky top-32 self-start">
          <div key={panelKey} className={`pop-in ${t.cardBg} border ${t.border} rounded-xl p-4 shadow-sm transition-opacity duration-200 ${panelVisible ? "opacity-100" : "opacity-0"}`}>
            <p className={`text-xs ${t.textMuted} mb-1 leading-snug line-clamp-2 font-medium`}>{selectedMarket.question}</p>
            <p className={`text-xs ${t.textMuted} mb-3`}>{selectedMarket.closes}</p>

            <div className={`flex rounded-lg overflow-hidden border ${t.border} mb-4`}>
              <button
                onClick={() => setSide("YES")}
                className={`flex-1 text-sm font-medium py-2 border-none cursor-pointer transition-colors ${
                  side === "YES" ? `${t.accent} text-white` : `${t.inputBg} ${t.textMuted}`
                }`}
              >
                Buy YES
              </button>
              <button
                onClick={() => setSide("NO")}
                className={`flex-1 text-sm font-medium py-2 border-none cursor-pointer transition-colors ${
                  side === "NO" ? "bg-[#6B0D0D] text-white" : `${t.inputBg} ${t.textMuted}`
                }`}
              >
                Buy NO
              </button>
            </div>

            <p className={`text-xs ${t.textMuted} mb-1.5`}>Amount</p>
            <div className={`flex items-center gap-2 ${t.inputBg} border ${t.border} rounded-lg px-3 h-10 mb-2`}>
              <span className={`text-sm font-bold ${t.accentText} shrink-0`}>e</span>
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
                      ? `${t.amountActive} ${t.amountActiveBorder} ${t.amountActiveText} font-medium`
                      : `${t.border} ${t.inputBg} ${t.textMuted}`
                  }`}
                >
                  e{a}
                </button>
              ))}
            </div>

            <div className={`${t.summaryBg} border ${t.borderLight} rounded-lg p-3 mb-4 flex flex-col gap-2`}>
              <div className={`flex justify-between text-xs ${t.textMuted}`}>
                <span>{side} price</span><span>{price.toFixed(2)}e per contract</span>
              </div>
              <div className={`flex justify-between text-xs ${t.textMuted}`}>
                <span>Contracts</span><span>{contracts}</span>
              </div>
              <div className={`flex justify-between text-xs ${t.textMuted}`}>
                <span>Fee (2%)</span><span>e{fee}</span>
              </div>
              <div className={`h-px ${theme === "dark" ? "bg-zinc-700" : "bg-slate-200"}`} />
              <div className={`flex justify-between text-sm font-semibold ${t.textPrimary}`}>
                <span>Payout if {side}</span>
                <span className={t.payoutText}>e{payout.toFixed(2)}</span>
              </div>
            </div>

            <button className={`w-full py-2.5 rounded-lg text-sm font-medium text-white border-none cursor-pointer transition-colors ${
              side === "YES" ? `${t.accent} ${t.accentHover}` : "bg-[#6B0D0D] hover:bg-[#6B0D0D]"
            }`}>
              Confirm buy {side}
            </button>
          </div>

          {/* PORTFOLIO */}
          <div className={`${t.cardBg} border ${t.border} rounded-xl p-4 shadow-sm`}>
            <p className={`text-xs font-medium ${t.textMuted} uppercase tracking-widest mb-3`}>Your positions</p>
            <div className="flex flex-col gap-2">
              {[
                { label: "Peter Obi 2027", side: "YES", contracts: 14, pnl: "+e0.84", up: true },
                { label: "AFCON Nigeria", side: "NO", contracts: 8, pnl: "+e0.32", up: true },
                { label: "Inflation below 20%", side: "YES", contracts: 20, pnl: "−e1.20", up: false },
              ].map((pos) => (
                <div key={pos.label} className={`flex items-center justify-between py-1.5 border-b ${t.borderLight} last:border-0`}>
                  <div>
                    <p className={`text-xs font-medium ${t.textPrimary} leading-snug`}>{pos.label}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      pos.side === "YES"
                        ? theme === "dark" ? "bg-yellow-500/10 text-yellow-400" : "bg-blue-50 text-blue-600"
                        : "bg-[#F9E8E8] text-[#7A1010]"
                    }`}>
                      {pos.side} · {pos.contracts}
                    </span>
                  </div>
                  <span className={`text-xs font-semibold ${pos.up ? "text-emerald-500" : "text-[#6B0D0D]"}`}>{pos.pnl}</span>
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
          <button key={item.label} className={`flex flex-col items-center gap-1 ${t.textMuted} hover:${t.accentText} transition-colors cursor-pointer border-none bg-transparent py-1 px-3`}>
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
    </div>
  );
}
