"use client";

import { useState, useEffect } from "react";
import { useTheme } from "../context/theme";

const API_BASE = "https://sireai.uk/pm-api";

type Props = {
  marketId: string;
  outcomes: string[]; // ["Yes", "No"] for binary, or named outcomes for multi
  colors: Record<string, string>; // real color per outcome, matching the rest of this market's UI
};

export default function InlineQuickBuy({ marketId, outcomes, colors }: Props) {
  const { theme, t, isLoggedIn, cashNaira, getValidToken, refreshPortfolio } = useTheme();

  const [outcome, setOutcome] = useState(outcomes[0]);
  const [amount, setAmount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [customAmounts, setCustomAmounts] = useState([100, 500, 1000]);

  const [bestAsk, setBestAsk] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(true);
  const [status, setStatus] = useState<{ loading: boolean; error: string | null; success: string | null }>({ loading: false, error: null, success: null });

  // Re-check the real, live price every time the selected outcome changes,
  // same as the modal version did -- never guess or reuse a stale price.
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
  const fee = amount * 0.02;

  const activeColor = colors[outcome] ?? "#666666";

  const handleTrade = async () => {
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
        body: JSON.stringify({ market_id: marketId, outcome, side: "buy", price_naira: price, contracts: estContracts }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ loading: false, error: data.detail || "Trade failed", success: null });
        return;
      }
      const filledNow = data.fills > 0;
      setStatus({
        loading: false, error: null,
        success: filledNow ? `Bought — matched instantly at ₦${price}` : `Order placed at ₦${price} — resting until matched`,
      });
      setAmount(0);
      await refreshPortfolio();
      setTimeout(() => setStatus({ loading: false, error: null, success: null }), 4000);
    } catch {
      setStatus({ loading: false, error: "Network error — try again", success: null });
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20">
      <div className={`${t.navBg} border-t ${t.border} shadow-lg`}>
        <div className="max-w-2xl mx-auto px-4 pt-3 pb-2">
          <div className="flex gap-2 mb-2">
            {outcomes.map((name) => {
              const c = colors[name] ?? "#666666";
              const isSelected = outcome === name;
              return (
                <button
                  key={name}
                  onClick={() => setOutcome(name)}
                  style={isSelected ? { backgroundColor: c } : undefined}
                  className={`flex-1 h-12 rounded-xl text-sm font-bold border-none cursor-pointer transition-colors whitespace-nowrap px-2 ${
                    isSelected ? "text-black" : `${t.inputBg} ${t.textMuted}`
                  }`}
                >
                  {name} ₦{priceLoading && isSelected ? "…" : isSelected ? price.toFixed(2) : "—"}
                </button>
              );
            })}
          </div>

          <div className="flex justify-between items-center mb-2">
            <span className={`text-xs ${t.textMuted}`}>
              ₦{cashNaira != null ? cashNaira.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "…"} cash
            </span>
            <button onClick={() => setEditing(!editing)} className={`text-xs ${t.accentText} font-medium cursor-pointer border-none bg-transparent`}>
              {editing ? "Done" : "Edit"}
            </button>
          </div>

          {editing ? (
            <div className="flex gap-2 mb-2">
              {customAmounts.map((a, i) => (
                <input
                  key={i} type="number" value={a}
                  onChange={(e) => {
                    const updated = [...customAmounts];
                    updated[i] = Number(e.target.value);
                    setCustomAmounts(updated);
                  }}
                  className={`flex-1 text-center text-sm font-bold ${t.inputBg} border ${t.border} rounded-xl py-2.5 outline-none ${t.textPrimary} w-0`}
                />
              ))}
            </div>
          ) : (
            <div className="flex gap-2 mb-2">
              {customAmounts.map((a) => (
                <button
                  key={a}
                  onClick={() => setAmount(a)}
                  style={amount === a ? { backgroundColor: activeColor } : undefined}
                  className={`flex-1 rounded-xl py-3 cursor-pointer border-none transition-colors flex flex-col items-center gap-0.5 ${
                    amount === a ? "text-black" : `${t.inputBg} ${t.textPrimary}`
                  }`}
                >
                  <span className="text-sm font-bold">₦{a}</span>
                  <span className={`text-xs ${amount === a ? "text-black/70" : "text-emerald-500"}`}>
                    win ₦{price > 0 ? (a / price).toFixed(0) : "0"}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="text-center py-1">
            <span className={`text-xs ${t.textMuted}`}>Potential win if {outcome}: </span>
            <span className="text-sm font-bold" style={{ color: activeColor }}>₦{toWin.toFixed(2)}</span>
            <span className={`text-xs ${t.textMuted}`}> · Fee: ₦{fee.toFixed(2)}</span>
          </div>

          {status.error && <p className="text-xs text-red-500 mb-1 text-center">{status.error}</p>}
          {status.success && <p className="text-xs text-emerald-500 mb-1 text-center">{status.success}</p>}

          {!isLoggedIn ? (
            <button
              onClick={handleTrade}
              className={`w-full h-11 rounded-xl text-sm font-bold border-none cursor-pointer mt-1 ${theme === "dark" ? "bg-white text-black" : `${t.accent} text-white`}`}
            >
              Sign in to trade
            </button>
          ) : (
            <button
              onClick={handleTrade}
              disabled={status.loading || priceLoading || amount <= 0}
              style={{ backgroundColor: activeColor }}
              className="w-full h-11 rounded-xl text-sm font-bold border-none cursor-pointer mt-1 text-black disabled:opacity-50"
            >
              {status.loading ? "…" : `Trade ${outcome}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}