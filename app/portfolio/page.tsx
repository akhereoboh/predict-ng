"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "../context/theme";
import RollingNumber from "../components/RollingNumber";
import { OUTCOME_COLORS, hashIndex, neutralHex } from "../lib/colors";

const API_BASE = "https://sireai.uk/pm-api";

type Holding = {
  market_id: string;
  question: string;
  status: string | null;
  trading_model: "AMM" | "ORDER_BOOK";
  outcome: string;
  contracts: number;
  reserved_contracts: number;
  available_contracts: number;
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

type OrderRow = {
  id: string;
  market_id: string;
  outcome: string;
  side: "buy" | "sell";
  price_naira: number;
  contracts: number;
  filled_contracts: number;
  status: string;
  created_at: string;
};

type TxRow = {
  created_at: string;
  action: string;
  market_id: string | null;
  question: string | null;
  outcome: string | null;
  contracts: number | null;
  amount_naira: number | null;
};


export default function PortfolioPage() {
  const { theme, toggleTheme, t, isLoggedIn, getValidToken, refreshPortfolio } = useTheme();
  const router = useRouter();

  const [tab, setTab] = useState<"positions" | "open" | "history">("positions");
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [history, setHistory] = useState<TxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"value" | "pnl">("value");

  const [sellTarget, setSellTarget] = useState<Holding | null>(null);
  const [sellContracts, setSellContracts] = useState(0);
  const [sellPrice, setSellPrice] = useState(50); // only used for ORDER_BOOK sells
  const [sellStatus, setSellStatus] = useState<{ loading: boolean; error: string | null; success: string | null }>({ loading: false, error: null, success: null });

  const fetchAll = async () => {
    const token = await getValidToken();
    if (!token) { setLoading(false); return; }
    try {
      const [pRes, oRes, hRes] = await Promise.all([
        fetch(`${API_BASE}/me/portfolio`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/me/orders`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/me/transactions`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (pRes.ok) setPortfolio(await pRes.json());
      if (oRes.ok) setOrders(await oRes.json());
      if (hRes.ok) setHistory(await hRes.json());
    } catch {
      // whatever loaded stays shown -- a blip just means stale data, not a crash
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // Real aggregate P&L, summed from actual per-position gain/loss you
  // already track -- NOT a historical chart. A true time-series "P&L over
  // the past day/week" like Polymarket's would need a new backend piece
  // (periodic net-worth snapshots aren't recorded anywhere yet) -- this
  // is the honest version of that panel until that's built.
  const totalPnl = useMemo(() => {
    if (!portfolio) return 0;
    return portfolio.holdings.reduce((sum, h) => sum + h.pnl_naira, 0);
  }, [portfolio]);
  const totalCost = useMemo(() => {
    if (!portfolio) return 0;
    return portfolio.holdings.reduce((sum, h) => sum + h.cost_naira, 0);
  }, [portfolio]);
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  const filteredHoldings = useMemo(() => {
    if (!portfolio) return [];
    let list = portfolio.holdings.filter((h) =>
      h.question.toLowerCase().includes(search.toLowerCase())
    );
    list = [...list].sort((a, b) =>
      sortBy === "value" ? b.current_value_naira - a.current_value_naira : b.pnl_naira - a.pnl_naira
    );
    return list;
  }, [portfolio, search, sortBy]);

  const openOrders = orders.filter((o) => o.status === "open" || o.status === "partially_filled");

  const openSell = (h: Holding) => {
    setSellTarget(h);
    setSellContracts(h.available_contracts);
    setSellPrice(50);
    setSellStatus({ loading: false, error: null, success: null });
  };

  const handleSell = async () => {
    if (!sellTarget) return;
    if (sellContracts <= 0 || sellContracts > sellTarget.available_contracts) {
      setSellStatus({ loading: false, error: "Enter a valid amount to sell.", success: null });
      return;
    }
    setSellStatus({ loading: true, error: null, success: null });
    try {
      const token = await getValidToken();
      if (!token) return;

      if (sellTarget.trading_model === "ORDER_BOOK") {
        if (sellPrice <= 0 || sellPrice >= 100) {
          setSellStatus({ loading: false, error: "Enter a valid price (1-99).", success: null });
          return;
        }
        const res = await fetch(`${API_BASE}/trade/order`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            market_id: sellTarget.market_id, outcome: sellTarget.outcome,
            side: "sell", price_naira: sellPrice, contracts: sellContracts,
          }),
        });
        const data = await res.json();
        if (!res.ok) { setSellStatus({ loading: false, error: data.detail || "Sell failed", success: null }); return; }
        setSellStatus({ loading: false, error: null, success: data.fills > 0 ? `Sold — ${data.fills} fill(s) matched instantly` : "Sell order resting in the book" });
      } else {
        const res = await fetch(`${API_BASE}/trade/sell`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ market_id: sellTarget.market_id, outcome: sellTarget.outcome, contracts: sellContracts }),
        });
        const data = await res.json();
        if (!res.ok) { setSellStatus({ loading: false, error: data.detail || "Sell failed", success: null }); return; }
        setSellStatus({ loading: false, error: null, success: `Sold for ₦${data.received_naira.toFixed(2)}` });
      }
      await refreshPortfolio();
      await fetchAll();
      setTimeout(() => setSellTarget(null), 1500);
    } catch {
      setSellStatus({ loading: false, error: "Network error — try again", success: null });
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const token = await getValidToken();
      if (!token) return;
      await fetch(`${API_BASE}/trade/order/${orderId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      await fetchAll();
    } catch {
      // leave it listed, they can retry
    }
  };

  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen ${t.pageBg} ${t.textPrimary} flex items-center justify-center px-6`}>
        <div className="text-center">
          <p className={`text-sm ${t.textMuted} mb-4`}>Sign in to view your portfolio.</p>
          <button onClick={() => router.push("/?auth=1")} className="text-sm px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold border-none cursor-pointer">
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${t.pageBg} ${t.textPrimary} font-sans pb-20`}>
      <nav className={`sticky top-0 z-10 ${t.navBg} border-b ${t.border} shadow-sm`}>
        <div className="flex items-center justify-between px-3 md:px-6 h-12">
          <div onClick={() => router.push("/")} className="flex items-center gap-1.5 cursor-pointer">
            <span className="w-6 h-6 rounded-md bg-[#CCFF00] flex items-center justify-center text-black text-xs font-black italic">E</span>
            <span className={`text-sm font-bold ${t.textPrimary}`}>Eris</span>
          </div>
          <button onClick={toggleTheme} className={`w-8 h-8 rounded-full border ${t.border} flex items-center justify-center cursor-pointer ${t.navBg} transition-colors`}>
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
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-5">
        {/* HEADER: value + available to trade + deposit/withdraw */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className={`${t.cardBg} border ${t.border} rounded-xl p-4 shadow-sm`}>
            <p className={`text-xs ${t.textMuted} mb-1`}>Portfolio</p>
            <RollingNumber
              text={`₦${(portfolio?.total_value_naira ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
              color={theme === "dark" ? "#FFFFFF" : "#000000"}
              className="text-2xl font-bold"
            />
            {portfolio && portfolio.holdings.length > 0 && (
              <p className={`text-xs mt-1 ${totalPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {totalPnl >= 0 ? "+" : ""}₦{totalPnl.toFixed(2)} ({totalPnlPct >= 0 ? "+" : ""}{totalPnlPct.toFixed(1)}%)
              </p>
            )}
          </div>
          <div className={`${t.cardBg} border ${t.border} rounded-xl p-4 shadow-sm`}>
            <p className={`text-xs ${t.textMuted} mb-1`}>Available to trade</p>
            <RollingNumber
              text={`₦${(portfolio?.cash_naira ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
              color={theme === "dark" ? "#FFFFFF" : "#000000"}
              className="text-2xl font-bold"
            />
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => router.push("/deposit-withdraw")}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-none cursor-pointer bg-blue-500 hover:bg-blue-400 text-white flex items-center justify-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0 0l-4-4m4 4l4-4M4 4h16" /></svg>
            Deposit
          </button>
          <button
            onClick={() => router.push("/deposit-withdraw")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border ${t.border} ${t.textPrimary} cursor-pointer bg-transparent flex items-center justify-center gap-1.5`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20V4m0 0l-4 4m4-4l4 4" /></svg>
            Withdraw
          </button>
        </div>

        {/* TABS */}
        <div className={`flex rounded-lg overflow-hidden border ${t.border} mb-4`}>
          {(["positions", "open", "history"] as const).map((tb) => (
            <button
              key={tb}
              onClick={() => setTab(tb)}
              className={`flex-1 text-sm font-medium py-2.5 border-none cursor-pointer transition-colors capitalize ${
                tab === tb ? `${t.accent} text-white` : `${t.inputBg} ${t.textMuted}`
              }`}
            >
              {tb}
            </button>
          ))}
        </div>

        {tab === "positions" && (
          <>
            <div className="flex gap-2 mb-4">
              <div className={`flex items-center gap-2 ${t.inputBg} rounded-lg px-3 h-9 flex-1`}>
                <svg className={`w-3.5 h-3.5 ${t.textMuted} shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search your positions"
                  className={`bg-transparent text-sm ${t.textPrimary} outline-none flex-1 placeholder:${t.textMuted}`}
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "value" | "pnl")}
                className={`px-3 rounded-lg text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none`}
              >
                <option value="value">Current value</option>
                <option value="pnl">P&amp;L</option>
              </select>
            </div>

            {loading && <p className={`text-sm ${t.textMuted}`}>Loading…</p>}
            {!loading && filteredHoldings.length === 0 && <p className={`text-sm ${t.textMuted}`}>No positions found.</p>}

            <div className="flex flex-col gap-2">
              {filteredHoldings.map((h) => {
                const color = h.outcome.toLowerCase() === "draw"
                  ? neutralHex(theme === "dark")
                  : OUTCOME_COLORS[hashIndex(`${h.market_id}-${h.outcome}`, OUTCOME_COLORS.length)].hex;
                return (
                  <div key={`${h.market_id}-${h.outcome}`} className={`${t.cardBg} border ${t.border} rounded-xl p-4 shadow-sm`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${t.textPrimary} leading-snug`}>{h.question}</p>
                        <span className="text-xs font-medium" style={{ color }}>{h.outcome} · {h.contracts.toFixed(2)} contracts</span>
                      </div>
                      <div className="text-right shrink-0">
                        <RollingNumber text={`₦${h.current_value_naira.toFixed(2)}`} color={theme === "dark" ? "#FFFFFF" : "#000000"} className="text-sm font-bold" />
                        <p className={`text-xs ${h.pnl_naira >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                          {h.pnl_naira >= 0 ? "+" : ""}₦{h.pnl_naira.toFixed(2)} ({h.pnl_pct >= 0 ? "+" : ""}{h.pnl_pct.toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                    {h.status === "OPEN" && (
                      <button
                        onClick={() => openSell(h)}
                        className={`w-full py-2 rounded-lg text-xs font-semibold border ${t.border} ${t.textPrimary} cursor-pointer bg-transparent`}
                      >
                        Sell
                      </button>
                    )}
                    {h.status !== "OPEN" && (
                      <p className={`text-xs ${t.textMuted} text-center`}>
                        {h.status === "RESOLVED" ? "Market resolved" : "Trading closed — awaiting resolution"}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === "open" && (
          <div className="flex flex-col gap-2">
            {openOrders.length === 0 && <p className={`text-sm ${t.textMuted}`}>No open orders.</p>}
            {openOrders.map((o) => (
              <div key={o.id} className={`${t.cardBg} border ${t.border} rounded-xl p-4 shadow-sm flex items-center justify-between`}>
                <div className="text-sm">
                  <span className={o.side === "buy" ? "text-emerald-500 font-medium" : "text-red-500 font-medium"}>
                    {o.side === "buy" ? "Buy" : "Sell"} {o.outcome}
                  </span>
                  <span className={t.textMuted}> · ₦{o.price_naira} · {(o.contracts - o.filled_contracts).toFixed(2)} left</span>
                </div>
                <button onClick={() => handleCancelOrder(o.id)} className="text-xs text-red-500 bg-transparent border-none cursor-pointer font-medium">
                  Cancel
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === "history" && (
          <div className="flex flex-col gap-2">
            {history.length === 0 && <p className={`text-sm ${t.textMuted}`}>No history yet.</p>}
            {history.map((tx, i) => (
              <div key={i} className={`${t.cardBg} border ${t.border} rounded-xl p-3 shadow-sm flex items-center justify-between`}>
                <div className="text-sm">
                  <span className={`font-medium ${t.textPrimary}`}>{tx.action}</span>
                  {tx.question && <span className={t.textMuted}> · {tx.question}</span>}
                  {tx.outcome && <span className={t.textMuted}> · {tx.outcome}</span>}
                </div>
                <div className="text-right">
                  {tx.amount_naira != null && <p className={`text-sm font-medium ${t.textPrimary}`}>₦{tx.amount_naira.toFixed(2)}</p>}
                  <p className={`text-xs ${t.textMuted}`}>{new Date(tx.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SELL MODAL */}
      {sellTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setSellTarget(null)}>
          <div className={`${t.cardBg} border ${t.border} rounded-2xl p-6 w-80 shadow-2xl`} onClick={(e) => e.stopPropagation()}>
            <p className={`text-sm font-semibold ${t.textPrimary} mb-1`}>Sell {sellTarget.outcome}</p>
            <p className={`text-xs ${t.textMuted} mb-4 line-clamp-2`}>{sellTarget.question}</p>

            <p className={`text-xs ${t.textMuted} mb-1`}>
              Contracts ({sellTarget.available_contracts.toFixed(2)} available to sell
              {sellTarget.reserved_contracts > 0 ? ` · ${sellTarget.reserved_contracts.toFixed(2)} already reserved in another order` : ""})
            </p>
            <input
              type="number"
              min={0}
              max={sellTarget.available_contracts}
              value={sellContracts || ""}
              onChange={(e) => setSellContracts(Number(e.target.value))}
              className={`w-full px-3 py-2.5 rounded-xl text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none mb-3`}
            />

            {sellTarget.trading_model === "ORDER_BOOK" && (
              <>
                <p className={`text-xs ${t.textMuted} mb-1`}>Sell price (₦, 1-99)</p>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={sellPrice}
                  onChange={(e) => setSellPrice(Number(e.target.value))}
                  className={`w-full px-3 py-2.5 rounded-xl text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none mb-3`}
                />
              </>
            )}

            {sellStatus.error && <p className="text-xs text-red-500 mb-2 text-center">{sellStatus.error}</p>}
            {sellStatus.success && <p className="text-xs text-emerald-500 mb-2 text-center">{sellStatus.success}</p>}

            <button
              onClick={handleSell}
              disabled={sellStatus.loading}
              className="w-full py-2.5 rounded-xl font-semibold text-sm border-none cursor-pointer disabled:opacity-50 bg-red-500 hover:bg-red-400 text-white mb-2"
            >
              {sellStatus.loading ? "…" : "Confirm sell"}
            </button>
            <button onClick={() => setSellTarget(null)} className={`w-full text-xs ${t.textMuted} bg-transparent border-none cursor-pointer py-1`}>
              Cancel
            </button>
          </div>
        </div>
      )}

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
            onClick={() => {
              if (item.icon === "home") router.push("/");
              if (item.icon === "breaking") router.push("/breaking");
              if (item.icon === "search") router.push("/?search=1");
              if (item.icon === "more") router.push("/more");
            }}
            className={`flex flex-col items-center gap-1 ${t.textMuted} hover:${t.accentText} transition-colors cursor-pointer border-none bg-transparent py-1 px-3`}
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