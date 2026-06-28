"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

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
    description: "This market resolves YES if Nigeria's official inflation rate as published by the National Bureau of Statistics (NBS) falls below 20% before December 31, 2026. It resolves NO if any other outcome occurs.",
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
    related: [
      { id: "1", question: "Will Nigeria's inflation drop below 20% by December 2026?", chance: 34 },
    ],
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
    related: [
      { id: "1", question: "Will Nigeria's inflation drop below 20% by December 2026?", chance: 34 },
    ],
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
    related: [
      { id: "6", question: "Will Nigeria's GDP growth exceed 4% in 2026?", chance: 61 },
    ],
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
    description: "This market resolves YES if Dangote Cement PLC (DANGCEM) closes at or above ₦800 per share on the Nigerian Stock Exchange on any trading day before August 31, 2026.",
    resolveYes: "DANGCEM closes at or above ₦800 on any day before Aug 31, 2026.",
    resolveNo: "DANGCEM does not reach ₦800 before Aug 31, 2026.",
    related: [
      { id: "8", question: "Will MTN Nigeria (MTNN) pay a dividend above ₦10 in 2026?", chance: 73 },
    ],
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
    related: [
      { id: "7", question: "Will Dangote Cement (DANGCEM) close above ₦800 by Aug 2026?", chance: 58 },
    ],
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
    related: [
      { id: "7", question: "Will Dangote Cement (DANGCEM) close above ₦800 by Aug 2026?", chance: 58 },
    ],
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  Economy: "bg-amber-100 text-amber-800",
  Politics: "bg-purple-100 text-purple-800",
  Sports: "bg-blue-100 text-blue-700",
  Stocks: "bg-emerald-100 text-emerald-700",
};

const CHART_POINTS = [42, 45, 38, 50, 48, 55, 52, 49, 53, 58, 54, 51, 48, 44, 40, 38, 35, 37, 34];

function MiniChart({ chance }: { chance: number }) {
  const points = CHART_POINTS.map((p, i) => {
    const x = (i / (CHART_POINTS.length - 1)) * 600;
    const y = 120 - (p / 100) * 120;
    return `${x},${y}`;
  }).join(" ");

  const areaPoints = `0,120 ${points} 600,120`;

  return (
    <svg viewBox="0 0 600 120" className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#chartGrad)" />
      <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />
      <circle
        cx={(18 / (CHART_POINTS.length - 1)) * 600}
        cy={120 - (CHART_POINTS[18] / 100) * 120}
        r="4"
        fill="#3b82f6"
      />
    </svg>
  );
}

export default function MarketPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const market = MARKETS.find((m) => m.id === id) || MARKETS[0];

  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [amount, setAmount] = useState(10);
  const [period, setPeriod] = useState("1W");
  const [orderBookOpen, setOrderBookOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [editing, setEditing] = useState(false);
  const [customAmounts, setCustomAmounts] = useState([1, 5, 7, 10, 20]);

  const price = side === "YES" ? market.yesPrice : market.noPrice;
  const contracts = (amount / price).toFixed(1);
  const fee = (amount * 0.02).toFixed(2);
  const payout = (amount / price).toFixed(2);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-56">
      {/* NAV */}
      <nav className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm px-4 h-12 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer border-none bg-transparent text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center text-white text-xs font-black italic">E</span>
          <span className="text-sm font-bold text-slate-800">Eris</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBookmarked(!bookmarked)}
            className={`p-1.5 rounded-md transition-colors cursor-pointer border-none bg-transparent ${bookmarked ? "text-blue-600" : "text-slate-400 hover:text-blue-500"}`}
          >
            <svg className="w-4 h-4" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          <button className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 transition-colors cursor-pointer border-none bg-transparent">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {/* HEADER */}
        <div className="mb-4">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[market.category]}`}>
            {market.category}
          </span>
          <h1 className="text-xl font-bold text-slate-800 mt-2 leading-snug">
            {market.question}
          </h1>
        </div>

        {/* CHANCE */}
        <div className="flex items-center gap-3 mb-5">
          <div>
            <div className="text-3xl font-bold text-blue-600">{market.chance}%</div>
            <div className="text-xs text-slate-400 uppercase tracking-wide">Chance</div>
          </div>
          <div className={`flex items-center gap-1 text-sm font-medium ${market.change >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={market.change >= 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
            </svg>
            {Math.abs(market.change)}% today
          </div>
        </div>

        {/* YES/NO TOGGLE */}
        <div className="flex gap-2 mb-4">
          {["Yes", "No"].map((s) => (
            <button
              key={s}
              onClick={() => setSide(s.toUpperCase() as "YES" | "NO")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border cursor-pointer transition-colors ${
                side === s.toUpperCase()
                  ? s === "Yes" ? "bg-blue-600 border-blue-600 text-white" : "bg-red-500 border-red-500 text-white"
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* CHART */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm">
          <div className="h-40 mb-3">
            <MiniChart chance={market.chance} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {market.trades} Trades
              </span>
              <span className="w-px h-3 bg-slate-200" />
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {market.closes}
              </span>
            </div>
            <div className="flex gap-1">
              {["1Y", "1M", "1W", "1D", "12H"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`text-xs px-2 py-1 rounded cursor-pointer border-none transition-colors ${
                    period === p
                      ? "bg-blue-600 text-white font-medium"
                      : "bg-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ORDER BOOK */}
        <div className="bg-white border border-slate-200 rounded-xl mb-4 shadow-sm overflow-hidden">
          <button
            onClick={() => setOrderBookOpen(!orderBookOpen)}
            className="w-full flex items-center justify-between px-4 py-3 cursor-pointer border-none bg-transparent text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800">Order Book</span>
              <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-bold">?</span>
            </div>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${orderBookOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {orderBookOpen && (
            <div className="px-4 pb-4">
              <p className="text-xs text-slate-400 mb-3">View real-time buy & sell liquidity at different price offers</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium text-emerald-600 mb-2">YES Bids</p>
                  {[0.33, 0.32, 0.31, 0.30].map((p) => (
                    <div key={p} className="flex justify-between text-xs text-slate-500 py-1 border-b border-slate-50">
                      <span className="text-emerald-600 font-medium">{p.toFixed(2)}e</span>
                      <span>{Math.floor(Math.random() * 500 + 100)}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-medium text-red-500 mb-2">NO Bids</p>
                  {[0.67, 0.68, 0.69, 0.70].map((p) => (
                    <div key={p} className="flex justify-between text-xs text-slate-500 py-1 border-b border-slate-50">
                      <span className="text-red-500 font-medium">{p.toFixed(2)}e</span>
                      <span>{Math.floor(Math.random() * 500 + 100)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MARKET RULES */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Market Rules & Timelines</h3>
          <p className="text-sm text-slate-500 mb-3 leading-relaxed">{market.description}</p>
          <p className="text-sm text-slate-500 mb-1">
            This market will resolve as <span className="text-blue-600 font-medium">Yes</span> if {market.resolveYes}
          </p>
          <p className="text-sm text-slate-500 mb-3">
            It will resolve as <span className="text-red-500 font-medium">No</span> if {market.resolveNo}
          </p>
          <button className="text-xs px-3 py-1.5 rounded-full border border-slate-200 text-slate-500 hover:border-slate-300 cursor-pointer bg-transparent transition-colors">
            Show full details
          </button>
        </div>

        {/* TIMELINE */}
        <div className="bg-white border border-slate-200 rounded-xl mb-4 shadow-sm overflow-hidden">
          <button
            onClick={() => setTimelineOpen(!timelineOpen)}
            className="w-full flex items-center justify-between px-4 py-3 cursor-pointer border-none bg-transparent text-left"
          >
            <span className="text-sm font-semibold text-slate-800">Timeline & Payout</span>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${timelineOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {timelineOpen && (
            <div className="px-4 pb-4">
              <div className="flex flex-col gap-0">
                {[
                  { label: "Market Open", date: market.opened, done: true },
                  { label: "Market Close", date: market.closes, done: false },
                  { label: "Payout", date: "4-12 Hours After Close", done: false },
                ].map((step, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="flex flex-col items-center">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${step.done ? "border-emerald-500 bg-emerald-500" : "border-slate-300 bg-white"}`}>
                        {step.done && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      {i < 2 && <div className="w-px h-6 bg-slate-200 mt-1" />}
                    </div>
                    <div className="pb-4">
                      <p className={`text-sm font-medium ${step.done ? "text-emerald-600" : "text-slate-700"}`}>{step.label}</p>
                      <p className="text-xs text-slate-400">{step.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RELATED MARKETS */}
        {market.related.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-4 mb-3">
              <button className="text-sm font-semibold text-slate-800 border-b-2 border-blue-600 pb-1 cursor-pointer bg-transparent border-t-0 border-l-0 border-r-0">
                Related Markets
              </button>
              <button className="text-sm text-slate-400 pb-1 cursor-pointer bg-transparent border-none hover:text-slate-600">
                Activities
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {market.related.map((r) => (
                <div
                  key={r.id}
                  onClick={() => router.push(`/market/${r.id}`)}
                  className="bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all shadow-sm flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-blue-600">E</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800 leading-snug">{r.question}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">{r.chance}% Chance</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FIXED BOTTOM */}
      <div className="fixed bottom-0 left-0 right-0 z-20">

        {/* BUY PANEL */}
        <div className="bg-white border-t border-slate-200 shadow-lg">
          <div className="max-w-2xl mx-auto px-4 pt-3 pb-2">

            {/* YES / NO BUTTONS */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setSide("YES")}
                className={`flex-1 h-12 rounded-xl text-sm font-bold border-none cursor-pointer transition-colors ${
                  side === "YES" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                Up {market.yesPrice.toFixed(2)}e
              </button>
              <button
                onClick={() => setSide("NO")}
                className={`flex-1 h-12 rounded-xl text-sm font-bold border-none cursor-pointer transition-colors ${
                  side === "NO" ? "bg-red-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                Down {market.noPrice.toFixed(2)}e
              </button>
            </div>

            {/* CASH + EDIT ROW */}
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-400">E{amount}.00 cash</span>
              <button
                onClick={() => setEditing(!editing)}
                className="text-xs text-blue-600 font-medium cursor-pointer border-none bg-transparent"
              >
                {editing ? "Done" : "Edit"}
              </button>
            </div>

            {/* EDIT MODE — custom amounts */}
            {editing && (
              <div className="flex gap-2 mb-2 items-center">
                {customAmounts.map((a, i) => (
                  <input
                    key={i}
                    type="number"
                    value={a}
                    onChange={(e) => {
                      const updated = [...customAmounts];
                      updated[i] = Number(e.target.value);
                      setCustomAmounts(updated);
                    }}
                    className="flex-1 text-center text-sm font-bold bg-slate-100 border border-blue-300 rounded-xl py-2.5 outline-none text-slate-700 w-0"
                  />
                ))}
              </div>
            )}

            {/* QUICK AMOUNTS */}
            {!editing && (
            <div className="flex gap-2 mb-2">
              {customAmounts.map((a) => (
                <button
                  key={a}
                  onClick={() => setAmount(a)}
                  className={`flex-1 rounded-xl py-3 cursor-pointer border-none transition-colors flex flex-col items-center gap-0.5 ${
                    amount === a
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <span className="text-sm font-bold">E{a}</span>
                  <span className={`text-xs ${amount === a ? "text-blue-200" : "text-emerald-600"}`}>
                    win E{(a / price).toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
            )}
            

            {/* POTENTIAL WIN — fluctuates */}
            <div className="text-center py-1">
              <span className="text-xs text-slate-400">Potential win if {side}: </span>
              <span className="text-sm font-bold text-emerald-600">E{(amount / price).toFixed(2)}</span>
              <span className="text-xs text-slate-400"> · Fee: E{(amount * 0.02).toFixed(2)}</span>
            </div>

          </div>
        </div>

        {/* BOTTOM NAV */}
        <nav className="bg-white border-t border-slate-100 flex items-center justify-around px-4 py-2">
          {[
            { label: "Home", icon: "home" },
            { label: "Search", icon: "search" },
            { label: "Breaking", icon: "breaking" },
            { label: `E${(amount / price).toFixed(0)}`, icon: "portfolio" },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => item.icon === "home" && router.push("/")}
              className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer border-none bg-transparent py-1 px-3"
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
    </div>
  );
}
