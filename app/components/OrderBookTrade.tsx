"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "../context/theme";

type DepthLevel = { price: number; contracts: number };
type Depth = { bids: DepthLevel[]; asks: DepthLevel[] };
type MyOrder = {
  id: string;
  outcome: string;
  side: "buy" | "sell";
  price_naira: number;
  contracts: number;
  filled_contracts: number;
  status: string;
  created_at: string;
};

export default function OrderBookTrade({ marketId, outcome = "YES" }: { marketId: string; outcome?: string }) {
  const { theme, t, isLoggedIn, getValidToken } = useTheme();

  const [depth, setDepth] = useState<Depth>({ bids: [], asks: [] });
  const [myOrders, setMyOrders] = useState<MyOrder[]>([]);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [price, setPrice] = useState(50);
  const [contracts, setContracts] = useState(0);
  const [status, setStatus] = useState<{ loading: boolean; error: string | null; success: string | null }>({ loading: false, error: null, success: null });

  const esRef = useRef<EventSource | null>(null);

  // live depth, pushed via SSE -- reconnects automatically on drop, same
  // as the existing BTC live stream
  useEffect(() => {
    const es = new EventSource(`https://sireai.uk/pm-api/markets/${marketId}/orderbook/stream?outcome=${outcome}`);
    es.onmessage = (event) => {
      try {
        setDepth(JSON.parse(event.data));
      } catch {
        // malformed tick -- ignore, next one corrects it
      }
    };
    esRef.current = es;
    return () => es.close();
  }, [marketId, outcome]);

  const fetchMyOrders = async () => {
    try {
      const token = await getValidToken();
      if (!token) return;
      const res = await fetch(`https://sireai.uk/pm-api/me/orders?market_id=${marketId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setMyOrders(await res.json());
    } catch {
      // list just won't refresh this tick
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchMyOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, marketId]);

  const bestBid = depth.bids[0]?.price;
  const bestAsk = depth.asks[0]?.price;

  const handlePlaceOrder = async () => {
    if (!isLoggedIn) {
      setStatus({ loading: false, error: "Sign in to trade.", success: null });
      return;
    }
    if (contracts <= 0 || price <= 0 || price >= 100) {
      setStatus({ loading: false, error: "Enter a valid price (1-99) and size.", success: null });
      return;
    }
    setStatus({ loading: true, error: null, success: null });
    try {
      const token = await getValidToken();
      if (!token) return;
      const res = await fetch("https://sireai.uk/pm-api/trade/order", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ market_id: marketId, outcome, side, price_naira: price, contracts }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ loading: false, error: data.detail || "Order failed", success: null });
        return;
      }
      const filledMsg = data.fills > 0 ? ` — ${data.fills} fill${data.fills > 1 ? "s" : ""} matched instantly` : " — resting in the book";
      setStatus({ loading: false, error: null, success: `Order placed${filledMsg}` });
      setContracts(0);
      await fetchMyOrders();
      setTimeout(() => setStatus({ loading: false, error: null, success: null }), 4000);
    } catch {
      setStatus({ loading: false, error: "Network error — try again", success: null });
    }
  };

  const handleCancel = async (orderId: string) => {
    try {
      const token = await getValidToken();
      if (!token) return;
      await fetch(`https://sireai.uk/pm-api/trade/order/${orderId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchMyOrders();
    } catch {
      // fine to leave it listed if this fails -- user can retry
    }
  };

  const openOrders = myOrders.filter((o) => o.status === "open" || o.status === "partially_filled");

  return (
    <div className="flex flex-col gap-4">
      {/* DEPTH */}
      <div className={`${t.cardBg} border ${t.border} rounded-xl p-4`}>
        <p className={`text-xs font-semibold ${t.textMuted} uppercase tracking-wide mb-3`}>{outcome} order book</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-emerald-500 font-medium mb-1.5">Bids (buy)</p>
            <div className="flex flex-col gap-1">
              {depth.bids.length === 0 && <p className={`text-xs ${t.textMuted}`}>No resting bids</p>}
              {depth.bids.slice(0, 8).map((b, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-emerald-500 font-medium">₦{b.price}</span>
                  <span className={t.textMuted}>{b.contracts.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-red-500 font-medium mb-1.5">Asks (sell)</p>
            <div className="flex flex-col gap-1">
              {depth.asks.length === 0 && <p className={`text-xs ${t.textMuted}`}>No resting asks</p>}
              {depth.asks.slice(0, 8).map((a, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-red-500 font-medium">₦{a.price}</span>
                  <span className={t.textMuted}>{a.contracts.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {(bestBid || bestAsk) && (
          <p className={`text-xs ${t.textMuted} mt-3 pt-3 border-t ${t.borderLight}`}>
            Best bid ₦{bestBid ?? "—"} · Best ask ₦{bestAsk ?? "—"}
          </p>
        )}
      </div>

      {/* ORDER ENTRY */}
      <div className={`${t.cardBg} border ${t.border} rounded-xl p-4`}>
        <div className={`flex rounded-lg overflow-hidden border ${t.border} mb-3`}>
          <button
            onClick={() => setSide("buy")}
            className={`flex-1 text-sm font-medium py-2 border-none cursor-pointer transition-colors ${
              side === "buy" ? "bg-emerald-500 text-white" : `${t.inputBg} ${t.textMuted}`
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => setSide("sell")}
            className={`flex-1 text-sm font-medium py-2 border-none cursor-pointer transition-colors ${
              side === "sell" ? "bg-red-500 text-white" : `${t.inputBg} ${t.textMuted}`
            }`}
          >
            Sell
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <p className={`text-xs ${t.textMuted} mb-1`}>Price (₦)</p>
            <input
              type="number"
              min={1}
              max={99}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className={`w-full px-3 py-2 rounded-lg text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none`}
            />
          </div>
          <div>
            <p className={`text-xs ${t.textMuted} mb-1`}>Contracts</p>
            <input
              type="number"
              min={0}
              value={contracts || ""}
              onChange={(e) => setContracts(Number(e.target.value))}
              placeholder="0"
              className={`w-full px-3 py-2 rounded-lg text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none`}
            />
          </div>
        </div>

        {side === "sell" && (
          <p className={`text-[10px] ${t.textMuted} mb-2`}>
            You can only sell contracts you actually hold — this closes out an existing position, it isn't a short sale.
          </p>
        )}

        {status.error && <p className="text-xs text-red-500 mb-2 text-center">{status.error}</p>}
        {status.success && <p className="text-xs text-emerald-500 mb-2 text-center">{status.success}</p>}

        <button
          onClick={handlePlaceOrder}
          disabled={status.loading}
          className={`w-full py-2.5 rounded-lg text-sm font-semibold border-none cursor-pointer disabled:opacity-50 ${
            side === "buy" ? "bg-emerald-500 hover:bg-emerald-400" : "bg-red-500 hover:bg-red-400"
          } text-white`}
        >
          {status.loading ? "…" : `Place ${side} order`}
        </button>
      </div>

      {/* MY OPEN ORDERS */}
      {openOrders.length > 0 && (
        <div className={`${t.cardBg} border ${t.border} rounded-xl p-4`}>
          <p className={`text-xs font-semibold ${t.textMuted} uppercase tracking-wide mb-3`}>Your open orders</p>
          <div className="flex flex-col gap-2">
            {openOrders.map((o) => (
              <div key={o.id} className={`flex items-center justify-between py-1.5 border-b ${t.borderLight} last:border-0`}>
                <div className="text-xs">
                  <span className={o.side === "buy" ? "text-emerald-500 font-medium" : "text-red-500 font-medium"}>
                    {o.side === "buy" ? "Buy" : "Sell"} {o.outcome}
                  </span>
                  <span className={t.textMuted}> · ₦{o.price_naira} · {(o.contracts - o.filled_contracts).toFixed(2)} left</span>
                </div>
                <button
                  onClick={() => handleCancel(o.id)}
                  className="text-xs text-red-500 bg-transparent border-none cursor-pointer font-medium"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}