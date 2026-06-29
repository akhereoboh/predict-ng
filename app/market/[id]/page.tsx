"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTheme } from "../../context/theme";

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
  const { theme, toggleTheme, t } = useTheme();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const market = MARKETS.find((m) => m.id === id) || MARKETS[0];

  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [amount, setAmount] = useState(5);
  const [period, setPeriod] = useState("1W");
  const [orderBookOpen, setOrderBookOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [editing, setEditing] = useState(false);
  const [customAmounts, setCustomAmounts] = useState([1, 5, 7]);
  const [activeTab, setActiveTab] = useState("Comments");
  const [comment, setComment] = useState("");

  const price = side === "YES" ? market.yesPrice : market.noPrice;
  const payout = (amount / price).toFixed(2);
  const fee = (amount * 0.02).toFixed(2);

  const categoryColor = (cat: string) => {
    if (theme === "dark") {
      if (cat === "Economy") return "bg-amber-900/40 text-amber-400";
      if (cat === "Politics") return "bg-purple-900/40 text-purple-400";
      if (cat === "Sports") return "bg-yellow-900/40 text-yellow-400";
      return "bg-emerald-900/40 text-emerald-400";
    }
    if (cat === "Economy") return "bg-amber-100 text-amber-800";
    if (cat === "Politics") return "bg-purple-100 text-purple-800";
    if (cat === "Sports") return "bg-blue-100 text-blue-700";
    return "bg-emerald-100 text-emerald-700";
  };

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
            <div className={`text-3xl font-bold ${t.accentText}`}>{market.chance}%</div>
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
                  ? s === "Yes" ? `${t.accent} border-transparent text-white` : "bg-[#6B0D0D] border-transparent text-white"
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
                      <span className="text-emerald-500 font-medium">{p.toFixed(2)}e</span>
                      <span>{Math.floor(Math.random() * 500 + 100)}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-medium text-[#6B0D0D] mb-2">NO Bids</p>
                  {[0.67, 0.68, 0.69, 0.70].map((p) => (
                    <div key={p} className={`flex justify-between text-xs ${t.textMuted} py-1 border-b ${t.borderLight}`}>
                      <span className="text-[#6B0D0D] font-medium">{p.toFixed(2)}e</span>
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
                    ? `${t.accentText} border-b-2 ${theme === "dark" ? "border-yellow-500" : "border-blue-600"}`
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
                  side === "YES" ? `${t.accent} text-white` : `${t.inputBg} ${t.textMuted}`
                }`}
              >
                Up {market.yesPrice.toFixed(2)}e
              </button>
              <button onClick={() => setSide("NO")}
                className={`flex-1 h-12 rounded-xl text-sm font-bold border-none cursor-pointer transition-colors ${
                  side === "NO" ? "bg-[#6B0D0D] text-white" : `${t.inputBg} ${t.textMuted}`
                }`}
              >
                Down {market.noPrice.toFixed(2)}e
              </button>
            </div>

            {/* CASH + EDIT */}
            <div className="flex justify-between items-center mb-2">
              <span className={`text-xs ${t.textMuted}`}>E{amount}.00 cash</span>
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
                        ? `${t.amountActive} ${t.amountActiveText}`
                        : `${t.inputBg} ${t.textPrimary}`
                    }`}
                  >
                    <span className="text-sm font-bold">E{a}</span>
                    <span className={`text-xs ${amount === a ? t.amountActiveSub : "text-emerald-500"}`}>
                      win E{(a / price).toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* POTENTIAL WIN */}
            <div className="text-center py-1">
              <span className={`text-xs ${t.textMuted}`}>Potential win if {side}: </span>
              <span className={`text-sm font-bold ${t.accentText}`}>E{payout}</span>
              <span className={`text-xs ${t.textMuted}`}> · Fee: E{fee}</span>
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
            <button key={item.label} onClick={() => item.icon === "home" && router.push("/")}
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
    </div>
  );
}
