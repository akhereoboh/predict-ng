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
  price_yes: number | null;
  price_no: number | null;
  outcomes: Record<string, number> | null;
  market_type: string;
  close_at: string | null;
  volume_naira: number;
  trader_count: number;
};

type CreateResult = {
  market_id: string;
  category: string;
  outcomes?: string[];
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
  const [tradingModel, setTradingModel] = useState<"AMM" | "ORDER_BOOK">("ORDER_BOOK");
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

  // "FOOTBALL" is a legacy standalone top-level category that predates
  // "SPORTS". Picking it here instead of "Sports" (with Football as the
  // subcategory) creates a market that's permanently invisible under the
  // Sports tab on the homepage, with no warning. Hidden from selection
  // here going forward -- the DB row itself is untouched, since existing
  // markets still reference it and the homepage filter now treats it as
  // equivalent to Sports for backward compatibility.
  const topLevelCategories = categories.filter((c) => !c.parent && c.name !== "FOOTBALL").map((c) => c.name);
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

  // --- team logos ---
  const [teamLogos, setTeamLogos] = useState<Record<string, string>>({});
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamLogoFile, setNewTeamLogoFile] = useState<File | null>(null);
  const [teamLogoError, setTeamLogoError] = useState<string | null>(null);
  const [savingTeamLogo, setSavingTeamLogo] = useState(false);

  const fetchTeamLogos = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/team-logos`);
      if (!res.ok) return;
      setTeamLogos(await res.json());
    } catch {
      // leave whatever we already had
    }
  }, []);

  const handleSaveTeamLogo = async () => {
    if (!newTeamName.trim() || !newTeamLogoFile) {
      setTeamLogoError("Enter a team name and choose an image file.");
      return;
    }
    setSavingTeamLogo(true);
    setTeamLogoError(null);
    try {
      const token = await getValidToken();
      if (!token) { setTeamLogoError("Not signed in."); setSavingTeamLogo(false); return; }
      const formData = new FormData();
      formData.append("name", newTeamName.trim());
      formData.append("file", newTeamLogoFile);
      // no Content-Type header here on purpose -- the browser sets the
      // correct multipart boundary itself when given a FormData body
      const res = await fetch(`${API_BASE}/admin/team-logos/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) { setTeamLogoError(data.detail || "Couldn't upload."); setSavingTeamLogo(false); return; }
      setNewTeamName("");
      setNewTeamLogoFile(null);
      await fetchTeamLogos();
    } catch {
      setTeamLogoError("Network error — try again.");
    } finally {
      setSavingTeamLogo(false);
    }
  };

  const handleDeleteTeamLogo = async (name: string) => {
    try {
      const token = await getValidToken();
      if (!token) return;
      await fetch(`${API_BASE}/admin/team-logos/${encodeURIComponent(name)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchTeamLogos();
    } catch {
      // leave the list as-is, they can retry
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    const kick = requestAnimationFrame(() => { fetchCategories(); fetchTeamLogos(); });
    return () => cancelAnimationFrame(kick);
  }, [isLoggedIn, fetchCategories, fetchTeamLogos]);

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

  // --- multi-outcome market creation (separate, single-market mode --
  // batch-creating several multi-outcome markets at once, each with its
  // own outcome list, adds a lot of UI complexity for a rare workflow;
  // this keeps the common binary batch-create flow above untouched) ---
  const [multiOutcomeMode, setMultiOutcomeMode] = useState(false);
  const [multiQuestion, setMultiQuestion] = useState("");
  const [multiCloseAt, setMultiCloseAt] = useState("");
  const [outcomeNames, setOutcomeNames] = useState<string[]>(["", ""]);
  const [creatingMulti, setCreatingMulti] = useState(false);
  const [multiCreateError, setMultiCreateError] = useState<string | null>(null);
  const [multiCreateResult, setMultiCreateResult] = useState<CreateResult | null>(null);
  const [totalBudget, setTotalBudget] = useState(100000);
  const [league, setLeague] = useState("");
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
            league: league.trim() || null,
            trading_model: tradingModel,
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

  const handleCreateMulti = async () => {
    const validOutcomes = outcomeNames.map((o) => o.trim()).filter(Boolean);
    if (!multiQuestion.trim()) {
      setMultiCreateError("Enter a question first.");
      return;
    }
    if (!multiCloseAt) {
      setMultiCreateError("Pick a close time first.");
      return;
    }
    if (validOutcomes.length < 2) {
      setMultiCreateError("Enter at least 2 outcome names.");
      return;
    }
    if (new Set(validOutcomes).size !== validOutcomes.length) {
      setMultiCreateError("Outcome names must be unique.");
      return;
    }
    const effectiveCategory = subcategory ? `${category}_${subcategory}` : category;
    setCreatingMulti(true);
    setMultiCreateError(null);
    setMultiCreateResult(null);

    const token = await getValidToken();
    if (!token) {
      setMultiCreateError("Not signed in.");
      setCreatingMulti(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/admin/markets/smart-create-multi`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          category: effectiveCategory,
          question: multiQuestion.trim(),
          outcomes: validOutcomes,
          close_at: new Date(multiCloseAt).toISOString(),
          total_budget_naira: totalBudget,
          max_concurrent: maxConcurrent,
          league: league.trim() || null,
          trading_model: tradingModel,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMultiCreateError(data.detail || "Couldn't create the market.");
        setCreatingMulti(false);
        return;
      }
      setMultiCreateResult(data);
      setMultiQuestion("");
      setMultiCloseAt("");
      setOutcomeNames(["", ""]);
      fetchMarkets();
    } catch {
      setMultiCreateError("Network error — try again.");
    } finally {
      setCreatingMulti(false);
    }
  };

  const updateOutcomeName = (index: number, value: string) => {
    setOutcomeNames((prev) => prev.map((o, i) => (i === index ? value : o)));
  };

  const addOutcomeField = () => setOutcomeNames((prev) => [...prev, ""]);

  const removeOutcomeField = (index: number) => {
    setOutcomeNames((prev) => (prev.length > 2 ? prev.filter((_, i) => i !== index) : prev));
  };

  const handlePropose = async (marketId: string, winner: string) => {
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

          <div className={`flex rounded-lg overflow-hidden border ${t.border} mb-4`}>
            <button
              onClick={() => setMultiOutcomeMode(false)}
              className={`flex-1 text-sm font-medium py-2 border-none cursor-pointer transition-colors ${
                !multiOutcomeMode ? `${t.accent} text-white` : `${t.inputBg} ${t.textMuted}`
              }`}
            >
              Yes / No
            </button>
            <button
              onClick={() => setMultiOutcomeMode(true)}
              className={`flex-1 text-sm font-medium py-2 border-none cursor-pointer transition-colors ${
                multiOutcomeMode ? `${t.accent} text-white` : `${t.inputBg} ${t.textMuted}`
              }`}
            >
              Named outcomes (2 or more)
            </button>
          </div>
          <div className={`flex rounded-lg overflow-hidden border ${t.border} mb-4`}>
            <button
              onClick={() => setTradingModel("ORDER_BOOK")}
              className={`flex-1 text-sm font-medium py-2 border-none cursor-pointer transition-colors ${
                tradingModel === "ORDER_BOOK" ? `${t.accent} text-white` : `${t.inputBg} ${t.textMuted}`
              }`}
            >
              Order Book
            </button>
            <button
              onClick={() => setTradingModel("AMM")}
              className={`flex-1 text-sm font-medium py-2 border-none cursor-pointer transition-colors ${
                tradingModel === "AMM" ? `${t.accent} text-white` : `${t.inputBg} ${t.textMuted}`
              }`}
            >
              AMM (guaranteed liquidity, house-funded)
            </button>
          </div>

          <label className={`text-xs ${t.textMuted} block mb-1`}>
            League (optional — e.g. LALIGA, ATP, ERE)
          </label>
          <input
            type="text"
            placeholder="Leave blank if this market isn't part of a league"
            value={league}
            onChange={(e) => setLeague(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className={`w-full px-3 py-2 rounded-lg text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none mb-3`}
          />

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

          {!multiOutcomeMode ? (
            <>
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
            </>
          ) : (
            <>
              <label className={`text-xs ${t.textMuted} block mb-1`}>Question</label>
              <input
                type="text"
                placeholder="Who wins Barcelona vs Real Madrid on Aug 20, 2026?"
                value={multiQuestion}
                onChange={(e) => setMultiQuestion(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none mb-3`}
              />

              <label className={`text-xs ${t.textMuted} block mb-1`}>Trading closes at</label>
              <input
                type="datetime-local"
                value={multiCloseAt}
                onChange={(e) => setMultiCloseAt(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none mb-3`}
              />

              <label className={`text-xs ${t.textMuted} block mb-1`}>Outcomes (2 or more — not limited to 2 or 3)</label>
              <div className="flex flex-col gap-2 mb-2">
                {outcomeNames.map((name, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder={`Outcome ${i + 1} (e.g. Barcelona)`}
                      value={name}
                      onChange={(e) => updateOutcomeName(i, e.target.value)}
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none`}
                    />
                    {outcomeNames.length > 2 && (
                      <button
                        onClick={() => removeOutcomeField(i)}
                        className={`shrink-0 w-9 h-9 rounded-lg border ${t.border} ${t.textMuted} cursor-pointer bg-transparent`}
                        title="Remove this outcome"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={addOutcomeField}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg border ${t.border} ${t.textMuted} cursor-pointer bg-transparent mb-4`}
              >
                + Add another outcome
              </button>
            </>
          )}

          {tradingModel === "AMM" && (
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
          )}

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

          {multiCreateError && <p className="text-xs text-red-500 mb-3">{multiCreateError}</p>}
          {multiCreateResult && (
            <div className={`text-xs ${t.textMuted} mb-3 p-3 rounded-lg ${t.inputBg}`}>
              <p className={`${t.textPrimary} font-medium mb-1`}>
                {multiCreateResult.market_id} — outcomes: {multiCreateResult.outcomes?.join(", ")}
              </p>
              <p>b = {multiCreateResult.b} · house funding = ₦{multiCreateResult.house_funding_naira.toLocaleString()} · max loss = ₦{multiCreateResult.max_loss_naira.toLocaleString()}</p>
            </div>
          )}

          {(addingCategory || addingSubcategory) && (
            <p className="text-xs text-amber-500 mb-2">
              Finish adding the new {addingCategory ? "category" : "sub-category"} first — click &quot;Add&quot; or &quot;×&quot; above before creating a market.
            </p>
          )}

          {!multiOutcomeMode ? (
            <button
              onClick={handleCreate}
              disabled={creating || addingCategory || addingSubcategory}
              className={`w-full py-2.5 rounded-lg text-sm font-semibold border-none cursor-pointer disabled:opacity-50 ${t.accent} text-white`}
            >
              {creating ? "…" : entries.filter((e) => e.question.trim() && e.closeAt).length > 1 ? `Create ${entries.filter((e) => e.question.trim() && e.closeAt).length} markets` : "Create market"}
            </button>
          ) : (
            <button
              onClick={handleCreateMulti}
              disabled={creatingMulti || addingCategory || addingSubcategory}
              className={`w-full py-2.5 rounded-lg text-sm font-semibold border-none cursor-pointer disabled:opacity-50 ${t.accent} text-white`}
            >
              {creatingMulti ? "…" : "Create market"}
            </button>
          )}
        </div>

        {/* TEAM LOGOS */}
        <div className={`${t.cardBg} border ${t.border} rounded-xl p-5 mb-6 shadow-sm`}>
          <h2 className={`text-base font-bold ${t.textPrimary} mb-1`}>Team logos</h2>
          <p className={`text-xs ${t.textMuted} mb-4`}>
            Upload a logo once per team name (e.g. exactly &quot;Barcelona&quot;) — any market whose outcome matches that name shows this logo automatically, no need to re-upload it per market. Files are hosted on your own project, so they won&apos;t break if some external page changes.
          </p>

          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Team name (e.g. Barcelona)"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className={`flex-1 px-3 py-2 rounded-lg text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none`}
            />
            <label className={`flex-1 px-3 py-2 rounded-lg text-sm border ${t.border} ${t.inputBg} ${newTeamLogoFile ? t.textPrimary : t.textMuted} cursor-pointer truncate`}>
              {newTeamLogoFile ? newTeamLogoFile.name : "Choose image file…"}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNewTeamLogoFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
            <button
              onClick={handleSaveTeamLogo}
              disabled={savingTeamLogo}
              className={`shrink-0 px-4 rounded-lg text-sm font-medium border-none cursor-pointer disabled:opacity-50 ${t.accent} text-white`}
            >
              {savingTeamLogo ? "…" : "Upload"}
            </button>
          </div>
          {teamLogoError && <p className="text-xs text-red-500 mb-2">{teamLogoError}</p>}

          {Object.keys(teamLogos).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {Object.entries(teamLogos).map(([name, url]) => (
                <div key={name} className={`flex items-center gap-2 pl-2 pr-1 py-1 rounded-full border ${t.border} ${t.inputBg}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={name} className="w-5 h-5 rounded-full object-cover" />
                  <span className={`text-xs ${t.textPrimary}`}>{name}</span>
                  <button
                    onClick={() => handleDeleteTeamLogo(name)}
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${t.textMuted} cursor-pointer bg-transparent border-none`}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
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
                    {m.id} · {m.status}{m.winner ? ` · winner: ${m.winner}` : ""} ·{" "}
                    {m.outcomes
                      ? Object.entries(m.outcomes).map(([name, price]) => `${name} ${price.toFixed(1)}%`).join(" / ")
                      : `YES ${(m.price_yes ?? 0).toFixed(1)}% / NO ${(m.price_no ?? 0).toFixed(1)}%`}
                    {m.close_at ? ` · closes ${new Date(m.close_at).toLocaleString()}` : ""}
                  </p>

                  {status?.error && <p className="text-xs text-red-500 mb-2">{status.error}</p>}

                  {m.status === "OPEN" && (
                    <div className="flex gap-2 flex-wrap">
                      {m.outcomes ? (
                        Object.keys(m.outcomes).map((name) => (
                          <button
                            key={name}
                            onClick={() => handlePropose(m.id, name)}
                            disabled={status?.loading}
                            className={`text-xs px-3 py-1.5 rounded-md ${t.accent} text-white font-medium cursor-pointer border-none disabled:opacity-50`}
                          >
                            Propose {name}
                          </button>
                        ))
                      ) : (
                        <>
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
                        </>
                      )}
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