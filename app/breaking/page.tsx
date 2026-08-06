"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "../context/theme";
import { useState } from "react";

const BREAKING_MARKETS = [
  {
    id: "11",
    question: "Who will win the 2027 Nigerian Presidential Election?",
    category: "Politics",
    chance: 71,
    change: 8,
    trend: "up" as const,
    initial: "P",
  },
  {
    id: "2",
    question: "Will Peter Obi contest the 2027 presidential election?",
    category: "Politics",
    chance: 71,
    change: 12,
    trend: "up" as const,
    initial: "O",
  },
  {
    id: "8",
    question: "Will MTN Nigeria (MTNN) pay a dividend above ₦10 in 2026?",
    category: "Stocks",
    chance: 73,
    change: 9,
    trend: "up" as const,
    initial: "M",
  },
  {
    id: "9",
    question: "Will Airtel Africa stock rise 20%+ on LSE before year end?",
    category: "Stocks",
    chance: 39,
    change: 17,
    trend: "down" as const,
    initial: "A",
  },
  {
    id: "10",
    question: "Who will be Nigeria's top scorer at AFCON 2026?",
    category: "Sports",
    chance: 45,
    change: 6,
    trend: "up" as const,
    initial: "N",
  },
  {
    id: "6",
    question: "Will Nigeria's GDP growth exceed 4% in 2026?",
    category: "Economy",
    chance: 61,
    change: 4,
    trend: "up" as const,
    initial: "G",
  },
  {
    id: "4",
    question: "Will the naira trade below ₦1,400/$ before July 2026?",
    category: "Economy",
    chance: 22,
    change: 11,
    trend: "down" as const,
    initial: "N",
  },
];

const CATEGORIES = ["All", "Politics", "World", "Sports", "Crypto", "Finance", "Tech", "Culture"];

const SPARK_UP = "M2 22 L10 18 L18 19 L26 12 L34 14 L42 6 L50 2";
const SPARK_DOWN = "M2 2 L10 6 L18 5 L26 12 L34 10 L42 18 L50 22";

export default function Breaking() {
  const { theme, toggleTheme, t, isLoggedIn, setIsLoggedIn } = useTheme();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("All");

  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const filtered =
    activeCategory === "All"
      ? BREAKING_MARKETS
      : BREAKING_MARKETS.filter((m) => m.category === activeCategory);

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

  return (
    <div className={`min-h-screen ${t.pageBg} ${t.textPrimary} font-sans pb-20`}>
      {/* NAV */}
      <nav className={`sticky top-0 z-10 ${t.navBg} border-b ${t.border} shadow-sm`}>
        <div className="flex items-center justify-between px-3 md:px-6 h-12">
          <div
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 cursor-pointer"
          >
            <span className="w-6 h-6 rounded-md bg-yellow-500 flex items-center justify-center text-black text-xs font-black italic">E</span>
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
              onClick={() => { if (!isLoggedIn) setIsLoggedIn(false); }}
              className="text-sm px-4 py-1.5 rounded-md bg-blue-500 hover:bg-blue-400 text-white font-semibold transition-colors cursor-pointer border-none"
            >
              {isLoggedIn ? "Deposit" : "Sign in"}
            </button>
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
      </nav>

      <div className="max-w-3xl mx-auto px-3 md:px-6 py-5">
        {/* BANNER */}
        <div
          className={`relative overflow-hidden rounded-2xl mb-4 p-6 flex items-center gap-5 border ${t.border} ${
            theme === "dark" ? "bg-[#111111]" : "bg-white"
          }`}
        >
          {/* ARROWS GRAPHIC — LEFT */}
          <div className="relative shrink-0 w-24 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/25 to-blue-400/5" />
            <div className="relative flex items-center -space-x-3">
              <div className="w-11 h-11 rounded-full bg-blue-500 flex items-center justify-center shadow-lg z-10">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
              <div className="w-[52px] h-[52px] rounded-full bg-blue-400 flex items-center justify-center shadow-lg -translate-y-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </div>
            </div>
          </div>

          {/* TEXT — RIGHT OF ARROWS */}
          <div>
            <div className={`text-xs ${t.textMuted} mb-1`}>{today}</div>
            <h1 className={`text-xl font-bold ${t.textPrimary} mb-1`}>Breaking News</h1>
            <p className={`text-sm ${t.textMuted}`}>See the Eris markets that moved the most in the last 24 hours</p>
          </div>
        </div>

        {/* CATEGORY PILLS */}
        <div className="flex items-center gap-2 overflow-x-auto mb-2 pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`text-xs px-3 py-1.5 rounded-full cursor-pointer transition-colors shrink-0 font-medium border-none ${
                activeCategory === c
                  ? `${t.filterActive} ${t.filterActiveText}`
                  : `${t.inputBg} ${t.textMuted} hover:${t.textPrimary}`
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* LIST */}
        <div className={`rounded-xl border ${t.border} divide-y ${theme === "dark" ? "divide-[#1A1A1A]" : "divide-slate-100"} overflow-hidden`}>
          {filtered.map((m, i) => (
            <div
              key={m.id}
              onClick={() => router.push(`/market/${m.id}`)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${t.cardBg} hover:${theme === "dark" ? "bg-[#161616]" : "bg-slate-50"}`}
            >
              <span className={`text-xs w-4 shrink-0 ${t.textMuted}`}>{i + 1}</span>

              <span className={`w-8 h-8 rounded-md shrink-0 flex items-center justify-center text-xs font-bold ${categoryColor(m.category)}`}>
                {m.initial}
              </span>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${t.textPrimary} leading-snug line-clamp-2`}>{m.question}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-sm font-bold ${t.textPrimary}`}>{m.chance}%</span>
                  <span className={`flex items-center gap-0.5 text-xs font-medium ${m.trend === "up" ? "text-emerald-500" : "text-[#E5484D]"}`}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={m.trend === "up" ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
                    </svg>
                    {m.change}%
                  </span>
                </div>
              </div>

              <svg className="w-16 h-6 shrink-0" viewBox="0 0 52 24" fill="none">
                <path
                  d={m.trend === "up" ? SPARK_UP : SPARK_DOWN}
                  stroke={m.trend === "up" ? "#10B981" : "#E5484D"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <svg className={`w-4 h-4 shrink-0 ${t.textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))}
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
            onClick={() => item.icon === "home" && router.push("/")}
            className={`flex flex-col items-center gap-1 ${item.label === "Breaking" ? t.textPrimary : t.textMuted} hover:${t.accentText} transition-colors cursor-pointer border-none bg-transparent py-1 px-3`}
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
    </div>
  );
}