"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "../context/theme";

const API_BASE = "https://sireai.uk/pm-api";

type AdminMarket = {
  id: string;
  question: string;
  status: string;
  winner: string | null;
  price_yes: number;
  price_no: number;
  market_type: string;
  close_at: string | null;
  volume_naira: number;
  trader_count: number;
};

type CreateResult = {
  market_id: string;
  category: string;
  b: number;
  house_funding_naira: number;
  max_loss_naira: number;
  close_at: string;
};

type CategoryEntry = { name: string; parent: string | null };

export default function AdminPage() {
  const { t, theme, isLoggedIn, login, authError, authLoading, getValidToken } = useTheme();
  const router = useRouter();

  // --- password gate (separate from, and weaker than, the real
  // security -- see the backend endpoint's docstring). Just keeps this
  // page from being casually stumbled into. ---
  const [pageUnlocked, setPageUnlocked] = useState(false);
  const [pagePassword, setPagePassword] = useState("");
  const [pagePasswordError, setPagePasswordError] = useState<string | null>(null);
  const [checkingPassword, setCheckingPassword] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("eris_admin_unlocked") === "1") {
      const id = requestAnimationFrame(() => setPageUnlocked(true));
      return () => cancelAnimationFrame(id);
    }
  }, []);

  const handleUnlock = async () => {
    setCheckingPassword(true);
    setPagePasswordError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/verify-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pagePassword }),
      });
      if (!res.ok) {
        setPagePasswordError("Wrong password.");
        setCheckingPassword(false);
        return;
      }
      sessionStorage.setItem("eris_admin_unlocked", "1");
      setPageUnlocked(true);
    } catch {
      setPagePasswordError("Network error — try again.");
    } finally {
      setCheckingPassword(false);
    }
  };

  // --- inline admin login (separate from whatever account you're
  // currently signed in as elsewhere on the site) ---
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  // --- categories (fetched, not hardcoded) ---
  const [categories, setCategories] = useState<CategoryEntry[]>([]);
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingSubcategory, setAddingSubcategory] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const topLevelCategories = categories.filter((c) => !c.parent).map((c) => c.name);
  const subcategoriesForSelected = categories.filter((c) => c.parent === category).map((c) => c.name);

  const fetchCategories = useCallback(async () => {
    const token = await getValidToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/admin/categories`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data: CategoryEntry[] = await res.json();
      setCategories(data);
      const tops = data.filter((c) => !c.parent).map((c) => c.name);
      if (tops.length > 0 && !category) setCategory(tops[0]);
    } catch {
      // leave whatever categories we already had
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    const kick = requestAnimationFrame(() => fetchCategories());
    return () => cancelAnimationFrame(kick);
  }, [isLoggedIn, fetchCategories]);

  // Reset subcategory whenever the top-level category changes -- an old
  // subcategory selection from a different category shouldn't carry over.
  useEffect(() => {
    const id = requestAnimationFrame(() => setSubcategory(""));
    return () => cancelAnimationFrame(id);
  }, [category]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setCategoryError(null);
    try {
      const token = await getValidToken();
      if (!token) return;
      const res = await fetch(`${API_BASE}/admin/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCategoryError(data.detail || "Couldn't create category.");
        return;
      }
      setNewCategoryName("");
      setAddingCategory(false);
      await fetchCategories();
      setCategory(data.name);
    } catch {
      setCategoryError("Network error — try again.");
    }
  };

  const handleAddSubcategory = async () => {
    if (!newSubcategoryName.trim() || !category) return;
    setCategoryError(null);
    try {
      const token = await getValidToken();
      if (!token) return;
      const res = await fetch(`${API_BASE}/admin/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newSubcategoryName.trim(), parent: category }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCategoryError(data.detail || "Couldn't create sub-category.");
        return;
      }
      setNewSubcategoryName("");
      setAddingSubcategory(false);
      await fetchCategories();
      setSubcategory(data.name);
    } catch {
      setCategoryError("Network error — try again.");
    }
  };

  // --- create form state ---
  const [entries, setEntries] = useState<{ question: string; closeAt: string }[]>([{ question: "", closeAt: "" }]);
  const [totalBudget, setTotalBudget] = useState(100000);
  const [maxConcurrent, setMaxConcurrent] = useState(10);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createResults, setCreateResults] = useState<CreateResult[]>([]);

  const updateEntry = (i: number, field: "question" | "closeAt", value: string) => {
    setEntries((prev) => prev.map((e, idx) => (idx === i ? { ...e, [field]: value } : e)));
  };
  const addEntry = () => setEntries((prev) => [...prev, { question: "", closeAt: "" }]);
  const removeEntry = (i: number) => setEntries((prev) => prev.filter((_, idx) => idx !== i));

  // --- markets list state ---
  const [markets, setMarkets] = useState<AdminMarket[]>([]);
  const [marketsLoading, setMarketsLoading] = useState(true);
  const [marketsError, setMarketsError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<Record<string, { loading: boolean; error: string | null }>>({});

  const fetchMarkets = useCallback(async () => {
    const token = await getValidToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/admin/markets/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setMarketsError(data.detail || "Couldn't load markets — are you actually an admin?");
        return;
      }
      setMarkets(data);
      setMarketsError(null);
    } catch {
      setMarketsError("Network error loading markets.");
    } finally {
      setMarketsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    const kickoff = requestAnimationFrame(() => fetchMarkets());
    const id = setInterval(fetchMarkets, 8000);
    return () => {
      cancelAnimationFrame(kickoff);
      clearInterval(id);
    };
  }, [isLoggedIn, fetchMarkets]);

  const handleCreate = async () => {
    const validEntries = entries.filter((e) => e.question.trim() && e.closeAt);
    if (validEntries.length === 0) {
      setCreateError("Enter at least one question and close time.");
      return;
    }
    const effectiveCategory = subcategory ? `${category}_${subcategory}` : category;
    setCreating(true);
    setCreateError(null);
    setCreateResults([]);

    const token = await getValidToken();
    if (!token) {
      setCreateError("Not signed in.");
      setCreating(false);
      return;
    }

    // Sequential, not parallel -- each call re-checks the category's
    // committed budget against everything created so far, including
    // markets created earlier in THIS batch. Firing these in parallel
    // would let two calls both check the same stale budget snapshot and
    // both get approved when only one should have.
    const results: CreateResult[] = [];
    let firstError: string | null = null;
    for (const entry of validEntries) {
      try {
        const res = await fetch(`${API_BASE}/admin/markets/smart-create`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            category: effectiveCategory,
            question: entry.question.trim(),
            close_at: new Date(entry.closeAt).toISOString(),
            total_budget_naira: totalBudget,
            max_concurrent: maxConcurrent,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          firstError = `"${entry.question.trim()}": ${data.detail || "failed"}`;
          break; // stop the batch -- budget was likely exhausted partway through
        }
        results.push(data);
      } catch {
        firstError = `"${entry.question.trim()}": network error`;
        break;
      }
    }

    setCreateResults(results);
    if (firstError) {
      setCreateError(
        `${firstError}${results.length > 0 ? ` (${results.length} market(s) before this one were created successfully)` : ""}`
      );
    } else {
      setEntries([{ question: "", closeAt: "" }]);
    }
    fetchMarkets();
    setCreating(false);
  };

  const handlePropose = async (marketId: string, winner: "YES" | "NO") => {
    setActionStatus((s) => ({ ...s, [marketId]: { loading: true, error: null } }));
    try {
      const token = await getValidToken();
      if (!token) return;
      const res = await fetch(`${API_BASE}/admin/markets/${marketId}/propose`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ winner }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionStatus((s) => ({ ...s, [marketId]: { loading: false, error: data.detail || "Propose failed" } }));
        return;
      }
      setActionStatus((s) => ({ ...s, [marketId]: { loading: false, error: null } }));
      fetchMarkets();
    } catch {
      setActionStatus((s) => ({ ...s, [marketId]: { loading: false, error: "Network error" } }));
    }
  };

  const handleFinalize = async (marketId: string) => {
    if (!window.confirm("This pays out real money and cannot be undone. Finalize?")) return;
    setActionStatus((s) => ({ ...s, [marketId]: { loading: true, error: null } }));
    try {
      const token = await getValidToken();
      if (!token) return;
      const res = await fetch(`${API_BASE}/admin/markets/${marketId}/finalize`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setActionStatus((s) => ({ ...s, [marketId]: { loading: false, error: data.detail || "Finalize failed" } }));
        return;
      }
      setActionStatus((s) => ({ ...s, [marketId]: { loading: false, error: null } }));
      fetchMarkets();
    } catch {
      setActionStatus((s) => ({ ...s, [marketId]: { loading: false, error: "Network error" } }));
    }
  };

  // Gate 1: the page password (weak, just keeps this from being stumbled into)
  if (!pageUnlocked) {
    return (
      <div className={`min-h-screen ${t.pageBg} ${t.textPrimary} font-sans flex items-center justify-center px-4`}>
        <div className={`${t.cardBg} border ${t.border} rounded-xl p-6 w-full max-w-xs shadow-sm`}>
          <p className={`text-sm font-medium ${t.textPrimary} mb-3`}>Admin page password</p>
          <input
            type="password"
            value={pagePassword}
            onChange={(e) => setPagePassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleUnlock(); }}
            className={`w-full px-3 py-2.5 rounded-lg text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none mb-3`}
          />
          {pagePasswordError && <p className="text-xs text-red-500 mb-3">{pagePasswordError}</p>}
          <button
            onClick={handleUnlock}
            disabled={checkingPassword}
            className={`w-full py-2.5 rounded-lg text-sm font-semibold border-none cursor-pointer disabled:opacity-50 ${t.accent} text-white`}
          >
            {checkingPassword ? "…" : "Unlock"}
          </button>
        </div>
      </div>
    );
  }

  // Gate 2: an actual admin account -- signed in right here, regardless
  // of whatever account (if any) is currently active elsewhere on the
  // site. This is the REAL check -- every action still goes through
  // require_admin() on the backend regardless of what happens here.
  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen ${t.pageBg} ${t.textPrimary} font-sans flex items-center justify-center px-4`}>
        <div className={`${t.cardBg} border ${t.border} rounded-xl p-6 w-full max-w-xs shadow-sm`}>
          <p className={`text-sm font-medium ${t.textPrimary} mb-3`}>Sign in with your admin account</p>
          {authError && <p className="text-xs text-red-500 mb-2">{authError}</p>}
          <input
            type="email"
            placeholder="Email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            className={`w-full px-3 py-2.5 rounded-lg text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none mb-2`}
          />
          <input
            type="password"
            placeholder="Password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") login(adminEmail, adminPassword); }}
            className={`w-full px-3 py-2.5 rounded-lg text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none mb-3`}
          />
          <button
            onClick={() => login(adminEmail, adminPassword)}
            disabled={authLoading}
            className={`w-full py-2.5 rounded-lg text-sm font-semibold border-none cursor-pointer disabled:opacity-50 mb-2 ${theme === "dark" ? "bg-white text-black" : "bg-black text-white"}`}
          >
            {authLoading ? "…" : "Log in"}
          </button>
          <button onClick={() => router.push("/")} className={`w-full text-xs ${t.textMuted} cursor-pointer border-none bg-transparent py-1`}>
            Back to Eris
          </button>
        </div>
      </div>
    );
  }

  const effectiveCategory = subcategory ? `${category}_${subcategory}` : category;

  return (
    <div className={`min-h-screen ${t.pageBg} ${t.textPrimary} font-sans pb-16`}>
      <nav className={`sticky top-0 z-10 ${t.navBg} border-b ${t.border} px-4 h-12 flex items-center justify-between`}>
        <button onClick={() => router.push("/")} className={`text-sm ${t.textMuted} cursor-pointer border-none bg-transparent`}>
          ← Back to Eris
        </button>
        <span className={`text-sm font-bold ${t.textPrimary}`}>Admin</span>
        <span className="w-16" />
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* CREATE MARKET */}
        <div className={`${t.cardBg} border ${t.border} rounded-xl p-5 mb-6 shadow-sm`}>
          <h2 className={`text-base font-bold ${t.textPrimary} mb-4`}>Create a market</h2>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className={`text-xs ${t.textMuted} block mb-1`}>Category</label>
              {!addingCategory ? (
                <div className="flex gap-2">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none`}
                  >
                    {topLevelCategories.length === 0 && <option value="">No categories yet</option>}
                    {topLevelCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setAddingCategory(true)}
                    title="Add a new category"
                    className={`shrink-0 w-9 h-9 rounded-lg border ${t.border} ${t.textPrimary} cursor-pointer bg-transparent font-bold`}
                  >
                    +
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. TECH"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddCategory(); }}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none`}
                  />
                  <button onClick={handleAddCategory} className={`shrink-0 px-3 rounded-lg text-sm font-medium border-none cursor-pointer ${t.accent} text-white`}>Add</button>
                  <button
                    onClick={() => { setAddingCategory(false); setNewCategoryName(""); setCategoryError(null); }}
                    className={`shrink-0 w-9 h-9 rounded-lg border ${t.border} ${t.textMuted} cursor-pointer bg-transparent`}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className={`text-xs ${t.textMuted} block mb-1`}>Sub-category (optional)</label>
              {!addingSubcategory ? (
                <div className="flex gap-2">
                  <select
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    disabled={!category}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none disabled:opacity-50`}
                  >
                    <option value="">(none)</option>
                    {subcategoriesForSelected.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setAddingSubcategory(true)}
                    disabled={!category}
                    title="Add a new sub-category under this category"
                    className={`shrink-0 w-9 h-9 rounded-lg border ${t.border} ${t.textPrimary} cursor-pointer bg-transparent font-bold disabled:opacity-50`}
                  >
                    +
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`e.g. FOOTBALL (under ${category})`}
                    value={newSubcategoryName}
                    onChange={(e) => setNewSubcategoryName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddSubcategory(); }}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none`}
                  />
                  <button onClick={handleAddSubcategory} className={`shrink-0 px-3 rounded-lg text-sm font-medium border-none cursor-pointer ${t.accent} text-white`}>Add</button
                  ><button
                    onClick={() => { setAddingSubcategory(false); setNewSubcategoryName(""); setCategoryError(null); }}
                    className={`shrink-0 w-9 h-9 rounded-lg border ${t.border} ${t.textMuted} cursor-pointer bg-transparent`}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          {categoryError && <p className="text-xs text-red-500 mb-3">{categoryError}</p>}

          <label className={`text-xs ${t.textMuted} block mb-1`}>Markets to create</label>
          <div className="flex flex-col gap-2 mb-2">
            {entries.map((entry, i) => (
              <div key={i} className="flex gap-2 items-start">
                <input
                  type="text"
                  placeholder="Will Barcelona beat Real Madrid on Aug 20, 2026?"
                  value={entry.question}
                  onChange={(e) => updateEntry(i, "question", e.target.value)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none`}
                />
                <input
                  type="datetime-local"
                  value={entry.closeAt}
                  onChange={(e) => updateEntry(i, "closeAt", e.target.value)}
                  className={`w-44 px-3 py-2 rounded-lg text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none`}
                />
                {entries.length > 1 && (
                  <button
                    onClick={() => removeEntry(i)}
                    className={`shrink-0 w-9 h-9 rounded-lg border ${t.border} ${t.textMuted} cursor-pointer bg-transparent`}
                    title="Remove this market"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addEntry}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg border ${t.border} ${t.textMuted} cursor-pointer bg-transparent mb-4`}
          >
            + Add another market
          </button>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className={`text-xs ${t.textMuted} block mb-1`}>Total budget for {effectiveCategory} (₦)</label>
              <input
                type="number"
                value={totalBudget}
                onChange={(e) => setTotalBudget(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-lg text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none`}
              />
            </div>
            <div>
              <label className={`text-xs ${t.textMuted} block mb-1`}>Max concurrent {effectiveCategory} markets</label>
              <input
                type="number"
                value={maxConcurrent}
                onChange={(e) => setMaxConcurrent(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-lg text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none`}
              />
            </div>
          </div>

          <p className={`text-[11px] ${t.textMuted} mb-3`}>
            b (liquidity) and house funding are computed automatically per market from your shared budget — same
            safe math as before. Markets are created one at a time, in order, and the batch stops the moment one
            would push {effectiveCategory} past its budget — any markets already created before that point stay
            created.
          </p>

          {createError && <p className="text-xs text-red-500 mb-3">{createError}</p>}
          {createResults.length > 0 && (
            <div className={`text-xs ${t.textMuted} mb-3 p-3 rounded-lg ${t.inputBg} flex flex-col gap-1.5`}>
              {createResults.map((r) => (
                <p key={r.market_id}>
                  <span className={`${t.textPrimary} font-medium`}>{r.market_id}</span> — b = {r.b} · house funding = ₦{r.house_funding_naira.toLocaleString()} · max loss = ₦{r.max_loss_naira.toLocaleString()}
                </p>
              ))}
            </div>
          )}

          {(addingCategory || addingSubcategory) && (
            <p className="text-xs text-amber-500 mb-2">
              Finish adding the new {addingCategory ? "category" : "sub-category"} first — click &quot;Add&quot; or &quot;×&quot; above before creating a market.
            </p>
          )}

          <button
            onClick={handleCreate}
            disabled={creating || addingCategory || addingSubcategory}
            className={`w-full py-2.5 rounded-lg text-sm font-semibold border-none cursor-pointer disabled:opacity-50 ${t.accent} text-white`}
          >
            {creating ? "…" : entries.filter((e) => e.question.trim() && e.closeAt).length > 1 ? `Create ${entries.filter((e) => e.question.trim() && e.closeAt).length} markets` : "Create market"}
          </button>
        </div>

        {/* MANAGE MARKETS */}
        <div className={`${t.cardBg} border ${t.border} rounded-xl p-5 shadow-sm`}>
          <h2 className={`text-base font-bold ${t.textPrimary} mb-4`}>All markets</h2>

          {marketsLoading && <p className={`text-sm ${t.textMuted}`}>Loading…</p>}
          {marketsError && <p className="text-sm text-red-500">{marketsError}</p>}

          <div className="flex flex-col gap-3">
            {markets.map((m) => {
              const status = actionStatus[m.id];
              return (
                <div key={m.id} className={`border ${t.border} rounded-lg p-3`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className={`text-sm font-medium ${t.textPrimary} flex-1`}>{m.question}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${t.inputBg} ${t.textMuted}`}>
                      {m.market_type}
                    </span>
                  </div>
                  <p className={`text-xs ${t.textMuted} mb-2`}>
                    {m.id} · {m.status}{m.winner ? ` · winner: ${m.winner}` : ""} · YES {m.price_yes.toFixed(1)}% / NO {m.price_no.toFixed(1)}%
                    {m.close_at ? ` · closes ${new Date(m.close_at).toLocaleString()}` : ""}
                  </p>

                  {status?.error && <p className="text-xs text-red-500 mb-2">{status.error}</p>}

                  {m.status === "OPEN" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePropose(m.id, "YES")}
                        disabled={status?.loading}
                        className="text-xs px-3 py-1.5 rounded-md bg-green-500 hover:bg-green-400 text-black font-medium cursor-pointer border-none disabled:opacity-50"
                      >
                        Propose YES
                      </button>
                      <button
                        onClick={() => handlePropose(m.id, "NO")}
                        disabled={status?.loading}
                        className="text-xs px-3 py-1.5 rounded-md bg-red-500 hover:bg-red-400 text-white font-medium cursor-pointer border-none disabled:opacity-50"
                      >
                        Propose NO
                      </button>
                    </div>
                  )}

                  {m.status === "PROPOSED" && (
                    <button
                      onClick={() => handleFinalize(m.id)}
                      disabled={status?.loading}
                      className={`text-xs px-3 py-1.5 rounded-md ${t.accent} text-white font-medium cursor-pointer border-none disabled:opacity-50`}
                    >
                      {status?.loading ? "…" : `Finalize (pays out real money)`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}