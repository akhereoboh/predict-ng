"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

const CATEGORY_COLORS: Record<string, string> = {
  Economy: "bg-amber-100 text-amber-800",
  Politics: "bg-purple-100 text-purple-800",
  Sports: "bg-blue-100 text-blue-700",
  Stocks: "bg-emerald-100 text-emerald-700",
};

const FILTERS = ["All", "Politics", "Economy", "Sports", "Stocks"];

export default function Home() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedMarket, setSelectedMarket] = useState(MARKETS[0]);
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [amount, setAmount] = useState(10);
  const [bookmarks, setBookmarks] = useState<string[]>(["1", "3"]);
  const [panelKey, setPanelKey] = useState(0);
  const router = useRouter();

  const filtered =
    activeFilter === "All"
      ? MARKETS
      : MARKETS.filter((m) => m.category === activeFilter);

  const price = side === "YES" ? selectedMarket.yesPrice : selectedMarket.noPrice;
  const contracts = (amount / price).toFixed(1);
  const fee = (amount * 0.02).toFixed(2);
  const payout = amount / price;

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarks((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  return (    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* NAV — 3 rows like Polymarket */}
      <nav className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">

        {/* ROW 1: logo + portfolio + cash + deposit */}
        <div className="flex items-center justify-between px-6 h-12">
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white text-xs font-black italic">E</span>
            <span className="text-sm font-bold text-slate-800">Eris</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex flex-col items-end">
                <span className="text-slate-400 leading-none mb-0.5">Portfolio</span>
                <span className="font-bold text-emerald-600 text-sm">e83.20</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-slate-400 leading-none mb-0.5">Cash</span>
                <span className="font-bold text-emerald-600 text-sm">e12.45</span>
              </div>
            </div>
            <button className="text-sm px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors cursor-pointer border-none">
              Deposit
            </button>
          </div>
        </div>

        {/* ROW 2: trending icon + filter tabs */}
        <div className="flex items-center gap-1 px-6 py-1.5 border-t border-slate-100 overflow-x-auto">
          <div className="flex items-center gap-1 text-xs text-slate-500 mr-2 shrink-0">
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
                  ? "bg-blue-600 border-blue-600 text-white font-medium"
                  : "bg-transparent border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* ROW 3: search full width */}
        <div className="px-6 py-2 border-t border-slate-100 flex items-center gap-2">
          <button className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer border-none bg-transparent shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 h-9 flex-1">
            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="bg-transparent text-sm text-slate-800 outline-none flex-1 placeholder-slate-400"
              placeholder="Search"
            />
          </div>
          <button className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer border-none bg-transparent shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 8h10M11 12h4" />
            </svg>
          </button>
        </div>
      </nav>

      {/* BODY */}
      <div className="max-w-5xl mx-auto px-6 py-5 grid grid-cols-[1fr_300px] gap-5">
        {/* LEFT */}
        <div className="flex flex-col gap-3">
          {filtered.map((market, i) => (
            <div
              key={`${activeFilter}-${market.id}`}
              onClick={() => router.push(`/market/${market.id}`)}
              style={{ animationDelay: `${i * 0.06}s` }}
              className={`ghost-in bg-white rounded-xl p-4 cursor-pointer transition-all border shadow-sm ${
                selectedMarket.id === market.id
                  ? "border-blue-500 shadow-blue-100 shadow-md"
                  : "border-slate-200 hover:border-slate-300 hover:shadow-md"
              }`}
            >
              <div className="flex justify-between items-start gap-3 mb-3">
                <div className="flex-1">
                  <p className="text-sm font-medium leading-snug text-slate-800">
                    {market.question}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    e{market.volume} vol · {market.traders} traders · {market.closes}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[market.category]}`}>
                    {market.category}
                  </span>
                  <button
                    onClick={(e) => toggleBookmark(market.id, e)}
                    className={`p-1 rounded transition-colors cursor-pointer border-none bg-transparent ${
                      bookmarks.includes(market.id) ? "text-blue-500" : "text-slate-300 hover:text-blue-400"
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
                    <span className="text-base font-bold text-blue-600">{market.yesPrice.toFixed(2)}e</span>
                    <span className="text-xs text-slate-400">YES</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-base font-bold text-red-600">{market.noPrice.toFixed(2)}e</span>
                    <span className="text-xs text-slate-400">NO</span>
                  </div>
                </div>
                <div className="flex-1 h-1.5 rounded-full bg-red-300 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 shadow-sm"
                    style={{ width: `${market.yesPrice * 100}%` }}
                  />
                </div>
              </div>

              {/* BUY BUTTONS */}
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedMarket(market); setSide("YES"); }}
                  className="flex-1 text-xs py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer font-medium"
                >
                  Buy YES · {market.yesPrice.toFixed(2)}e
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedMarket(market); setSide("NO"); }}
                  className="flex-1 text-xs py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer font-medium"
                >
                  Buy NO · {market.noPrice.toFixed(2)}e
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT — TRADE PANEL */}
        <div className="flex flex-col gap-4 sticky top-32 self-start">
          <div key={panelKey} className="pop-in bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-slate-500 mb-1 leading-snug line-clamp-2 font-medium">
              {selectedMarket.question}
            </p>
            <p className="text-xs text-slate-400 mb-3">{selectedMarket.closes}</p>

            {/* YES / NO TABS */}
            <div className="flex rounded-lg overflow-hidden border border-slate-200 mb-4">
              <button
                onClick={() => setSide("YES")}
                className={`flex-1 text-sm font-medium py-2 border-none cursor-pointer transition-colors ${
                  side === "YES"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-50 text-slate-500 hover:text-slate-700"
                }`}
              >
                Buy YES
              </button>
              <button
                onClick={() => setSide("NO")}
                className={`flex-1 text-sm font-medium py-2 border-none cursor-pointer transition-colors ${
                  side === "NO"
                    ? "bg-red-500 text-white"
                    : "bg-slate-50 text-slate-500 hover:text-slate-700"
                }`}
              >
                Buy NO
              </button>
            </div>

            {/* AMOUNT INPUT */}
            <p className="text-xs text-slate-500 mb-1.5">Amount</p>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 h-10 mb-2">
              <span className="text-sm font-bold text-blue-600 shrink-0">e</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="bg-transparent text-sm text-slate-800 outline-none flex-1 text-right"
              />
            </div>

            {/* QUICK AMOUNTS */}
            <div className="grid grid-cols-4 gap-1.5 mb-4">
              {[5, 10, 25, 50].map((a) => (
                <button
                  key={a}
                  onClick={() => setAmount(a)}
                  className={`text-xs py-1.5 rounded-lg border cursor-pointer transition-colors ${
                    amount === a
                      ? "border-blue-500 bg-blue-50 text-blue-600 font-medium"
                      : "border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  }`}
                >
                  e{a}
                </button>
              ))}
            </div>

            {/* SUMMARY */}
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 mb-4 flex flex-col gap-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>{side} price</span>
                <span>{price.toFixed(2)}e per contract</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Contracts</span>
                <span>{contracts}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Fee (2%)</span>
                <span>e{fee}</span>
              </div>
              <div className="h-px bg-slate-200" />
              <div className="flex justify-between text-sm font-semibold text-slate-800">
                <span>Payout if {side}</span>
                <span className="text-blue-600">e{payout.toFixed(2)}</span>
              </div>
            </div>

            {/* CTA */}
            <button
              className={`w-full py-2.5 rounded-lg text-sm font-medium text-white border-none cursor-pointer transition-colors ${
                side === "YES"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-red-500 hover:bg-red-600"
              }`}
            >
              Confirm buy {side}
            </button>
          </div>

          {/* PORTFOLIO SNAPSHOT */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-3">
              Your positions
            </p>
            <div className="flex flex-col gap-2">
              {[
                { label: "Peter Obi 2027", side: "YES", contracts: 14, pnl: "+e0.84", up: true },
                { label: "AFCON Nigeria", side: "NO", contracts: 8, pnl: "+e0.32", up: true },
                { label: "Inflation below 20%", side: "YES", contracts: 20, pnl: "−e1.20", up: false },
              ].map((pos) => (
                <div key={pos.label} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-xs font-medium text-slate-700 leading-snug">{pos.label}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      pos.side === "YES" ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"
                    }`}>
                      {pos.side} · {pos.contracts}
                    </span>
                  </div>
                  <span className={`text-xs font-semibold ${pos.up ? "text-emerald-600" : "text-red-500"}`}>
                    {pos.pnl}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
  </div>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex items-center justify-around px-4 py-2 z-20">
        {[
          { label: "Home", icon: "home" },
          { label: "Breaking", icon: "breaking" },
          { label: "Search", icon: "search" },
          { label: "More", icon: "more" },
        ].map((item) => (
          <button key={item.label} className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer border-none bg-transparent py-1 px-3">
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