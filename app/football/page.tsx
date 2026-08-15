"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "../context/theme";
import { useEffect, useState } from "react";
import RollingNumber from "../components/RollingNumber";

const API_BASE = "https://sireai.uk/pm-api";

type Market = {
  id: string;
  question: string;
  status: string;
  winner: string | null;
  price_yes: number;
  price_no: number;
  market_type: string;
  close_at: string | null;
  closed: boolean;
};

type TradeState = { loading: boolean; error: string | null; success: string | null };

export default function Football() {
  const {
    theme, toggleTheme, t, isLoggedIn, cashNaira,
    login, signup, logout, getValidToken, refreshPortfolio,
    authError, authLoading,
  } = useTheme();
  const router = useRouter();

  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupMessage, setSignupMessage] = useState<string | null>(null);

  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [tradeStatus, setTradeStatus] = useState<Record<string, TradeState>>({});

  const fetchMarkets = async () => {
    try {
      const res = await fetch(`${API_BASE}/markets`, { cache: "no-store" });
      if (!res.ok) return;
      const data: Omit<Market, "closed">[] = await res.json();
      const now = Date.now();
      const withClosed: Market[] = data
        .filter((m) => m.market_type === "FOOTBALL")
        .map((m) => ({
          ...m,
          closed: m.status !== "OPEN" || (!!m.close_at && new Date(m.close_at).getTime() <= now),
        }));
      setMarkets(withClosed);
    } catch {
      // keep showing the last known list rather than clearing it on a blip
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => fetchMarkets());
    const id = setInterval(fetchMarkets, 5000);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(id);
    };
  }, []);

  const handleTrade = async (market: Market, outcome: "YES" | "NO") => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }
    const amount = amounts[market.id] ?? 100;
    const priceFraction = (outcome === "YES" ? market.price_yes : market.price_no) / 100;
    // The API takes a whole number of contracts, not a naira amount -- this
    // is a rough estimate from the CURRENT price; the backend charges the
    // real, precise cost (which can differ slightly due to price impact),
    // and we show that real number back once the trade succeeds.
    const estContracts = Math.max(1, Math.round(amount / priceFraction));

    setTradeStatus((s) => ({ ...s, [market.id]: { loading: true, error: null, success: null } }));
    try {
      const token = await getValidToken();
      if (!token) {
        setShowAuthModal(true);
        setTradeStatus((s) => ({ ...s, [market.id]: { loading: false, error: null, success: null } }));
        return;
      }
      const res = await fetch(`${API_BASE}/trade/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ market_id: market.id, outcome, contracts: estContracts }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTradeStatus((s) => ({ ...s, [market.id]: { loading: false, error: data.detail || "Trade failed", success: null } }));
        return;
      }
      setTradeStatus((s) => ({
        ...s,
        [market.id]: { loading: false, error: null, success: `Bought ${estContracts} ${outcome} for ₦${data.paid_naira.toFixed(2)}` },
      }));
      await refreshPortfolio();
      await fetchMarkets(); // this trade just moved the price -- pull the fresh one
      setTimeout(() => {
        setTradeStatus((s) => ({ ...s, [market.id]: { loading: false, error: null, success: null } }));
      }, 4000);
    } catch {
      setTradeStatus((s) => ({ ...s, [market.id]: { loading: false, error: "Network error -- try again", success: null } }));
    }
  };

  const handleAuthSubmit = async () => {
    if (authMode === "login") {
      const ok = await login(email, password);
      if (ok) {
        setShowAuthModal(false);
        setEmail("");
        setPassword("");
      }
    } else {
      const res = await signup(email, password);
      if (res.ok) {
        setSignupMessage("Check your email to confirm your account, then log in.");
        setAuthMode("login");
      }
    }
  };

  return (
    <div className={`min-h-screen ${t.pageBg} ${t.textPrimary} font-sans pb-20`}>
      {/* NAV */}
      <nav className={`sticky top-0 z-10 ${t.navBg} border-b ${t.border} shadow-sm`}>
        <div className="flex items-center justify-between px-3 md:px-6 h-12">
          <div onClick={() => router.push("/")} className="flex items-center gap-1.5 cursor-pointer">
            <span className={`w-6 h-6 rounded-md ${t.accent} flex items-center justify-center text-black text-xs font-black italic`}>E</span>
            <span className={`text-sm font-bold ${t.textPrimary}`}>Eris</span>
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <div className="flex flex-col items-end text-xs">
                  <span className={t.textMuted}>Cash</span>
                  <span className="font-bold text-emerald-500 text-sm">
                    {cashNaira != null ? `₦${cashNaira.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "…"}
                  </span>
                </div>
                <button onClick={logout} className={`text-xs px-3 py-1.5 rounded-md border ${t.border} ${t.textMuted} cursor-pointer bg-transparent`}>
                  Log out
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="text-sm px-4 py-1.5 rounded-md bg-blue-500 hover:bg-blue-400 text-white font-semibold transition-colors cursor-pointer border-none"
              >
                Sign in
              </button>
            )}
            <button onClick={toggleTheme} className={`w-8 h-8 rounded-full border ${t.border} flex items-center justify-center cursor-pointer ${t.navBg}`}>
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

      <div className="max-w-2xl mx-auto px-3 md:px-6 py-5">
        <h1 className={`text-xl font-bold ${t.textPrimary} mb-1`}>Football Markets</h1>
        <p className={`text-sm ${t.textMuted} mb-5`}>Real markets, real trades. Pick a match and bet on the outcome.</p>

        {loading && <p className={`text-sm ${t.textMuted}`}>Loading markets…</p>}
        {!loading && markets.length === 0 && (
          <p className={`text-sm ${t.textMuted}`}>No football markets open right now. Check back soon.</p>
        )}

        <div className="flex flex-col gap-3">
          {markets.map((m) => {
            const closed = m.closed;
            const status = tradeStatus[m.id];
            return (
              <div key={m.id} className={`${t.cardBg} border ${t.border} rounded-xl p-4 shadow-sm`}>
                <div className="flex items-start justify-between mb-3 gap-2">
                  <p className={`text-sm font-medium ${t.textPrimary} flex-1`}>{m.question}</p>
                  {closed && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${t.inputBg} ${t.textMuted} shrink-0`}>
                      {m.status === "RESOLVED" ? `Resolved: ${m.winner}` : "Closed"}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <RollingNumber text={`${m.price_yes.toFixed(1)}%`} color="#22C55E" className="text-base font-bold" />
                      <span className={`text-xs ${t.textMuted}`}>YES</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <RollingNumber text={`${m.price_no.toFixed(1)}%`} color="#EF4444" className="text-base font-bold" />
                      <span className={`text-xs ${t.textMuted}`}>NO</span>
                    </div>
                  </div>
                  <div className={`flex-1 h-0.5 rounded-full overflow-hidden ${theme === "dark" ? "bg-red-500" : "bg-red-200"}`}>
                    <div className="h-full bg-green-500" style={{ width: `${m.price_yes}%` }} />
                  </div>
                </div>

                {!closed && (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs ${t.textMuted}`}>Amount:</span>
                      <span className={`text-xs ${t.textMuted}`}>₦</span>
                      <input
                        type="number"
                        min={10}
                        value={amounts[m.id] ?? 100}
                        onChange={(e) => setAmounts((a) => ({ ...a, [m.id]: Number(e.target.value) }))}
                        className={`w-20 text-sm px-2 py-1 rounded-lg border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none`}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTrade(m, "YES")}
                        disabled={status?.loading}
                        className="flex-1 text-sm py-2 rounded-lg border-none cursor-pointer font-semibold bg-green-500 hover:bg-green-400 text-black transition-colors disabled:opacity-50"
                      >
                        {status?.loading ? "…" : "Buy YES"}
                      </button>
                      <button
                        onClick={() => handleTrade(m, "NO")}
                        disabled={status?.loading}
                        className="flex-1 text-sm py-2 rounded-lg border-none cursor-pointer font-semibold bg-red-500 hover:bg-red-400 text-white transition-colors disabled:opacity-50"
                      >
                        {status?.loading ? "…" : "Buy NO"}
                      </button>
                    </div>
                    {status?.error && <p className="text-xs text-red-500 mt-2">{status.error}</p>}
                    {status?.success && <p className="text-xs text-green-500 mt-2">{status.success}</p>}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AUTH MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowAuthModal(false)}>
          <div className={`${t.cardBg} border ${t.border} rounded-2xl p-6 w-80 shadow-2xl`} onClick={(e) => e.stopPropagation()}>
            <h2 className={`text-lg font-bold ${t.textPrimary} text-center mb-4`}>
              {authMode === "login" ? "Log in" : "Create account"}
            </h2>

            {signupMessage && <p className="text-xs text-green-500 mb-3 text-center">{signupMessage}</p>}
            {authError && <p className="text-xs text-red-500 mb-3 text-center">{authError}</p>}

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none mb-2`}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none mb-4`}
            />
            <button
              onClick={handleAuthSubmit}
              disabled={authLoading}
              className={`w-full py-2.5 rounded-xl font-semibold text-sm mb-3 border-none cursor-pointer transition-colors ${
                theme === "dark" ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-zinc-800"
              } disabled:opacity-50`}
            >
              {authLoading ? "…" : authMode === "login" ? "Log in" : "Create account"}
            </button>
            <p className={`text-xs ${t.textMuted} text-center`}>
              {authMode === "login" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <span onClick={() => setAuthMode("signup")} className={`${t.accentText} cursor-pointer`}>Sign up</span>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <span onClick={() => setAuthMode("login")} className={`${t.accentText} cursor-pointer`}>Log in</span>
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}