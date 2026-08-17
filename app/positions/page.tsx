"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "../context/theme";
import { useEffect, useState } from "react";
import RollingNumber from "../components/RollingNumber";

type Holding = {
  market_id: string;
  question: string;
  status: string | null;
  outcome: string;
  contracts: number;
  current_value_naira: number;
  cost_naira: number;
  pnl_naira: number;
  pnl_pct: number;
};

type Portfolio = {
  cash_naira: number;
  holdings: Holding[];
  positions_value_naira: number;
  total_value_naira: number;
};

// Same dynamic, muted color system used everywhere else in the app --
// hashed off the market's own id, so a position's outcome shows the same
// color it has on the market card and detail page.
const MUTED_HEX = ["#C2410C", "#991B1B", "#1E40AF", "#047857", "#6B21A8", "#9F1239", "#155E75", "#B45309", "#0F766E", "#3730A3", "#4D7C0F", "#A21CAF"];
const hashIdx = (str: string, mod: number) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % mod;
};
const colorFor = (marketId: string, outcome: string) => {
  if (outcome.toLowerCase() === "draw") return "#71717A";
  const offset = outcome.toUpperCase() === "NO" ? 1 : 0; // binary NO sits one slot after YES, matching the card
  return MUTED_HEX[(hashIdx(marketId, MUTED_HEX.length) + offset) % MUTED_HEX.length];
};

export default function Positions() {
  const { theme, t, isLoggedIn, getValidToken } = useTheme();
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      const id = requestAnimationFrame(() => setLoading(false));
      return () => cancelAnimationFrame(id);
    }
    (async () => {
      try {
        const token = await getValidToken();
        if (!token) { setError("Sign in to see your positions."); setLoading(false); return; }
        const res = await fetch("https://sireai.uk/pm-api/me/portfolio", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok) { setError("Couldn't load your positions."); setLoading(false); return; }
        setPortfolio(await res.json());
      } catch {
        setError("Network error — try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoggedIn, getValidToken]);

  const open = portfolio?.holdings.filter((h) => h.status === "OPEN") ?? [];
  const settled = portfolio?.holdings.filter((h) => h.status !== "OPEN") ?? [];

  return (
    <div className={`min-h-screen ${t.pageBg} ${t.textPrimary} font-sans pb-20`}>
      <nav className={`sticky top-0 z-10 ${t.navBg} border-b ${t.border} shadow-sm`}>
        <div className="flex items-center gap-3 px-3 md:px-6 h-12">
          <button onClick={() => router.back()} className={`cursor-pointer bg-transparent border-none ${t.textMuted}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-bold">Positions</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {!isLoggedIn && (
          <div className={`${t.cardBg} border ${t.border} rounded-xl p-6 text-center`}>
            <p className={`text-sm ${t.textMuted} mb-3`}>Sign in to see what you&apos;re holding.</p>
          </div>
        )}

        {isLoggedIn && loading && <p className={`text-sm ${t.textMuted}`}>Loading…</p>}
        {isLoggedIn && error && <p className="text-sm text-red-500">{error}</p>}

        {isLoggedIn && portfolio && (
          <>
            {/* SUMMARY */}
            <div className={`${t.cardBg} border ${t.border} rounded-xl p-4 mb-5 flex items-center justify-between`}>
              <div>
                <p className={`text-xs ${t.textMuted} mb-1`}>Positions value</p>
                <RollingNumber text={`₦${portfolio.positions_value_naira.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} color={theme === "dark" ? "#00E676" : "#000000"} className="text-2xl font-bold" />
              </div>
              <div className="text-right">
                <p className={`text-xs ${t.textMuted} mb-1`}>Cash</p>
                <p className={`text-lg font-semibold ${t.textPrimary}`}>₦{portfolio.cash_naira.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              </div>
            </div>

            {portfolio.holdings.length === 0 && (
              <div className={`${t.cardBg} border ${t.border} rounded-xl p-8 text-center`}>
                <p className={`text-sm font-medium ${t.textPrimary} mb-1`}>No positions yet</p>
                <p className={`text-xs ${t.textMuted} mb-4`}>Trades you place will show up here.</p>
                <button
                  onClick={() => router.push("/")}
                  className={`text-sm px-4 py-2 rounded-lg font-medium border-none cursor-pointer ${theme === "dark" ? "bg-[#CCFF00] text-black" : "bg-black text-white"}`}
                >
                  Browse markets
                </button>
              </div>
            )}

            {open.length > 0 && (
              <div className="mb-6">
                <h2 className={`text-xs font-semibold tracking-wide ${t.textMuted} mb-2 px-1`}>OPEN</h2>
                <div className="flex flex-col gap-2">
                  {open.map((h) => <PositionRow key={`${h.market_id}-${h.outcome}`} h={h} t={t} router={router} />)}
                </div>
              </div>
            )}

            {settled.length > 0 && (
              <div>
                <h2 className={`text-xs font-semibold tracking-wide ${t.textMuted} mb-2 px-1`}>SETTLED</h2>
                <div className="flex flex-col gap-2">
                  {settled.map((h) => <PositionRow key={`${h.market_id}-${h.outcome}`} h={h} t={t} router={router} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

type ThemeTokens = ReturnType<typeof useTheme>["t"];

function PositionRow({ h, t, router }: { h: Holding; t: ThemeTokens; router: ReturnType<typeof useRouter> }) {
  const color = colorFor(h.market_id, h.outcome);
  const up = h.pnl_naira >= 0;
  return (
    <div
      onClick={() => router.push(`/market/${h.market_id}`)}
      className={`${t.cardBg} border ${t.border} rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className={`text-sm font-medium ${t.textPrimary} flex-1 line-clamp-2`}>{h.question}</p>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: color }}>
          {h.outcome}
        </span>
        <span className={`text-xs ${t.textMuted}`}>{h.contracts} contract{h.contracts === 1 ? "" : "s"}</span>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xs ${t.textMuted}`}>Cost ₦{h.cost_naira.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          <p className={`text-sm font-semibold ${t.textPrimary}`}>₦{h.current_value_naira.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
        </div>
        <div className={`text-right text-sm font-semibold ${up ? "text-emerald-500" : "text-red-500"}`}>
          {up ? "+" : ""}₦{h.pnl_naira.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          <div className="text-xs font-normal">{up ? "+" : ""}{h.pnl_pct.toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );
}