"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "../context/theme";
import { useEffect, useState, useCallback } from "react";

type Transaction = {
  created_at: string;
  action: "BUY" | "SELL" | "DEPOSIT" | "WITHDRAW";
  market_id: string | null;
  question: string | null;
  outcome: string | null;
  contracts: number | null;
  amount_naira: number | null;
};

const ACTION_LABEL: Record<Transaction["action"], string> = {
  BUY: "Bought",
  SELL: "Sold",
  DEPOSIT: "Deposit",
  WITHDRAW: "Withdrawal",
};

function formatWhen(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (sameDay) return `Today · ${time}`;
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${time}`;
}

export default function History() {
  const { theme, t, isLoggedIn, getValidToken } = useTheme();
  const router = useRouter();
  const [rows, setRows] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(async (before?: string) => {
    const token = await getValidToken();
    if (!token) { setError("Sign in to see your transaction history."); return null; }
    const url = new URL("https://sireai.uk/pm-api/me/transactions");
    if (before) url.searchParams.set("before", before);
    const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (!res.ok) { setError("Couldn't load your transaction history."); return null; }
    return (await res.json()) as Transaction[];
  }, [getValidToken]);

  useEffect(() => {
    if (!isLoggedIn) {
      const id = requestAnimationFrame(() => setLoading(false));
      return () => cancelAnimationFrame(id);
    }
    (async () => {
      const data = await load();
      if (data) {
        setRows(data);
        setHasMore(data.length === 50);
      }
      setLoading(false);
    })();
  }, [isLoggedIn, load]);

  const loadMore = async () => {
    if (rows.length === 0) return;
    setLoadingMore(true);
    const data = await load(rows[rows.length - 1].created_at);
    if (data) {
      setRows((prev) => [...prev, ...data]);
      setHasMore(data.length === 50);
    }
    setLoadingMore(false);
  };

  return (
    <div className={`min-h-screen ${t.pageBg} ${t.textPrimary} font-sans pb-20`}>
      <nav className={`sticky top-0 z-10 ${t.navBg} border-b ${t.border} shadow-sm`}>
        <div className="flex items-center gap-3 px-3 md:px-6 h-12">
          <button onClick={() => router.back()} className={`cursor-pointer bg-transparent border-none ${t.textMuted}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-bold">Transaction History</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {!isLoggedIn && (
          <div className={`${t.cardBg} border ${t.border} rounded-xl p-6 text-center`}>
            <p className={`text-sm ${t.textMuted}`}>Sign in to see your transaction history.</p>
          </div>
        )}

        {isLoggedIn && loading && <p className={`text-sm ${t.textMuted}`}>Loading…</p>}
        {isLoggedIn && error && <p className="text-sm text-red-500">{error}</p>}

        {isLoggedIn && !loading && !error && rows.length === 0 && (
          <div className={`${t.cardBg} border ${t.border} rounded-xl p-8 text-center`}>
            <p className={`text-sm font-medium ${t.textPrimary} mb-1`}>Nothing here yet</p>
            <p className={`text-xs ${t.textMuted}`}>Every trade, deposit, and withdrawal will show up here.</p>
          </div>
        )}

        {isLoggedIn && rows.length > 0 && (
          <div className={`rounded-xl border ${t.border} divide-y ${theme === "dark" ? "divide-[#1A1A1A]" : "divide-slate-100"} overflow-hidden`}>
            {rows.map((r, i) => (
              <div
                key={i}
                onClick={() => r.market_id && router.push(`/market/${r.market_id}`)}
                className={`px-4 py-3.5 flex items-center justify-between gap-3 ${t.cardBg} ${r.market_id ? "cursor-pointer" : ""}`}
              >
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${t.textPrimary}`}>
                    {ACTION_LABEL[r.action]}{r.outcome ? ` · ${r.outcome}` : ""}
                  </p>
                  {r.question && <p className={`text-xs ${t.textMuted} truncate`}>{r.question}</p>}
                  <p className={`text-xs ${t.textMuted}`}>{formatWhen(r.created_at)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-semibold ${r.action === "SELL" || r.action === "DEPOSIT" ? "text-emerald-500" : t.textPrimary}`}>
                    {r.action === "SELL" || r.action === "DEPOSIT" ? "+" : r.action === "BUY" || r.action === "WITHDRAW" ? "−" : ""}
                    ₦{r.amount_naira?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? "—"}
                  </p>
                  {r.contracts != null && <p className={`text-xs ${t.textMuted}`}>{r.contracts} contract{r.contracts === 1 ? "" : "s"}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {isLoggedIn && hasMore && rows.length > 0 && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className={`w-full mt-4 py-2.5 rounded-lg text-sm font-medium border ${t.border} ${t.textMuted} cursor-pointer bg-transparent disabled:opacity-50`}
          >
            {loadingMore ? "…" : "Load more"}
          </button>
        )}
      </div>
    </div>
  );
}