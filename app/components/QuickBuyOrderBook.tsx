"use client";

import { useState, useEffect } from "react";
import { useTheme } from "../context/theme";
import { OUTCOME_COLORS, hashIndex, neutralHex } from "../lib/colors";

const API_BASE = "https://sireai.uk/pm-api";

type Props = {
  marketId: string;
  question: string;
  outcomes: string[]; // ["Yes", "No"] for binary, or named outcomes for multi
  initialOutcome: string;
  onClose: () => void;
};

export default function QuickBuyOrderBook({ marketId, question, outcomes, initialOutcome, onClose }: Props) {
  const { theme, t, isLoggedIn, getValidToken, refreshPortfolio } = useTheme();

  const [outcome, setOutcome] = useState(initialOutcome);
  const [amount, setAmount] = useState(0);
  const [bestAsk, setBestAsk] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(true);
  const [status, setStatus] = useState<{ loading: boolean; error: string | null; success: string | null }>({ loading: false, error: null, success: null });

  // Same hash math the market cards use: for binary Yes/No, color is
  // seeded from the marketId itself (position 0 = first color, position
  // 1 = next); for multi-outcome, seeded from the first outcome's name.
  // Computed here from the same shared OUTCOME_COLORS array the cards
  // read from -- so this sheet's colors can never drift out of sync with
  // whatever card the user actually clicked.
  const isBinary = outcomes.length === 2 && outcomes.every((o) => o.toLowerCase() === "yes" || o.toLowerCase() === "no");
  const colorFor = (name: string): string => {
    if (name.toLowerCase() === "draw") return neutralHex(theme === "dark");
    const idx = outcomes.findIndex((o) => o === name);
    const startIdx = hashIndex(isBinary ? marketId : outcomes[0], OUTCOME_COLORS.length);
    return OUTCOME_COLORS[(startIdx + Math.max(idx, 0)) % OUTCOME_COLORS.length].hex;
  };
  const activeColor = colorFor(outcome);

  useEffect(() => {
    setPriceLoading(true);
    fetch(`${API_BASE}/markets/${marketId}/orderbook?outcome=${encodeURIComponent(outcome)}`)
      .then((r) => r.json())
      .then((depth) => setBestAsk(depth.asks?.[0]?.price ?? 50))
      .catch(() => setBestAsk(50))
      .finally(() => setPriceLoading(false));
  }, [marketId, outcome]);

  const price = bestAsk ?? 50;
  const estContracts = amount > 0 ? amount / price : 0;
  const toWin = estContracts * 100;

  const handleBuy = async () => {
    if (!isLoggedIn) {
      setStatus({ loading: false, error: "Sign in to trade.", success: null });
      return;
    }
    if (amount <= 0) {
      setStatus({ loading: false, error: "Enter an amount first.", success: null });
      return;
    }
    setStatus({ loading: true, error: null, success: null });
    try {
      const token = await getValidToken();
      if (!token) return;
      const res = await fetch(`${API_BASE}/trade/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          market_id: marketId,
          outcome,
          side: "buy",
          price_naira: price,
          contracts: estContracts,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ loading: false, error: data.detail || "Order failed", success: null });
        return;
      }
      const filledNow = data.fills > 0;
      setStatus({
        loading: false,
        error: null,
        success: filledNow ? `Bought — matched instantly at ₦${price}` : `Order placed at ₦${price} — resting until matched`,
      });
      await refreshPortfolio();
      setTimeout(onClose, filledNow ? 1200 : 2200);
    } catch {
      setStatus({ loading: false, error: "Network error — try again", success: null });
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`absolute bottom-0 left-0 right-0 md:left-1/2 md:right-auto md:-translate-x-1/2 md:bottom-8 md:w-full md:max-w-md ${t.cardBg} rounded-t-2xl md:rounded-2xl pb-8 px-6 pt-4 shadow-2xl`}>
        <div className={`w-10 h-1 rounded-full mx-auto mb-3 ${theme === "dark" ? "bg-zinc-700" : "bg-slate-200"}`} />

        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${t.inputBg} ${t.textMuted}`}>Buy</span>
          <button onClick={onClose} className={`w-7 h-7 rounded-full flex items-center justify-center ${t.inputBg} ${t.textMuted} border-none cursor-pointer`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className={`text-sm font-medium ${t.textPrimary} mb-3`}>{question}</p>

        {outcomes.length > 1 && (
          <div className="flex gap-2 mb-4 flex-wrap">
            {outcomes.map((o) => {
              const c = colorFor(o);
              const isSelected = outcome === o;
              return (
                <button
                  key={o}
                  onClick={() => setOutcome(o)}
                  style={isSelected ? { backgroundColor: c, borderColor: c } : undefined}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
                    isSelected ? "text-white" : `${t.inputBg} ${t.border} ${t.textMuted}`
                  }`}
                >
                  {o}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-center gap-1 mb-1">
          <span className={`text-5xl font-bold ${t.textMuted}`}>₦</span>
          <input
            type="number"
            value={amount || ""}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="0"
            className={`text-5xl font-bold bg-transparent outline-none text-center w-40 ${t.textPrimary}`}
            autoFocus
          />
        </div>

        <p className={`text-center text-xs ${t.textMuted} mb-4`}>
          {priceLoading ? "loading price…" : `market price ₦${price}`}
        </p>

        {amount > 0 && !priceLoading && (
          <p className="text-center text-sm mb-4 flex items-center justify-center gap-1">
            <span className={t.textMuted}>To win</span>
            <span className="font-bold text-emerald-500">₦{toWin.toFixed(2)}</span>
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

        {status.error && <p className="text-xs text-red-500 mb-3 text-center">{status.error}</p>}
        {status.success && <p className="text-xs text-emerald-500 mb-3 text-center">{status.success}</p>}

        <button
          onClick={handleBuy}
          disabled={status.loading || priceLoading}
          style={{ backgroundColor: activeColor }}
          className="w-full py-3.5 rounded-xl font-bold text-white text-base border-none cursor-pointer disabled:opacity-50"
        >
          {status.loading ? "…" : `Buy ${outcome}`}
        </button>
      </div>
    </div>
  );
}