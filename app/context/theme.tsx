"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from "react";

const API_BASE = "https://sireai.uk/pm-api";
const AUTH_STORAGE_KEY = "eris_auth_v1";

type Theme = "light" | "dark";

type StoredSession = {
  accessToken: string;
  refreshToken: string;
  userId: string;
  expiresAt: number; // ms epoch
};

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (v: boolean) => void; // kept for any old call sites; real auth supersedes this
  // --- real auth ---
  userId: string | null;
  cashNaira: number | null;
  totalValueNaira: number | null;
  authError: string | null;
  authLoading: boolean;
  signup: (email: string, password: string, displayName?: string) => Promise<{ ok: boolean; needsEmailConfirm?: boolean }>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  getValidToken: () => Promise<string | null>;
  refreshPortfolio: () => Promise<void>;
  t: {
    // backgrounds
    pageBg: string;
    navBg: string;
    cardBg: string;
    inputBg: string;
    summaryBg: string;
    // borders
    border: string;
    borderLight: string;
    // text
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    // accent
    accent: string;
    accentHover: string;
    accentText: string;
    accentBg: string;
    // nav active
    navActive: string;
    // filter active
    filterActive: string;
    filterActiveBorder: string;
    filterActiveText: string;
    // quick amount active
    amountActive: string;
    amountActiveBorder: string;
    amountActiveText: string;
    amountActiveSub: string;
    // bottom nav
    bottomNav: string;
    bottomNavBorder: string;
    // category badges dark override
    categoryEconomy: string;
    categoryPolitics: string;
    categorySports: string;
    categoryStocks: string;
    // payout text
    payoutText: string;
  };
}

const LIGHT = {
  pageBg: "bg-[#F5F4EF]",
  navBg: "bg-white",
  cardBg: "bg-[#FDFCF9]",
  inputBg: "bg-slate-100",
  summaryBg: "bg-slate-50",
  border: "border-slate-200",
  borderLight: "border-slate-100",
  textPrimary: "text-slate-800",
  textSecondary: "text-slate-600",
  textMuted: "text-slate-400",
  accent: "bg-blue-600",
  accentHover: "hover:bg-blue-700",
  accentText: "text-blue-600",
  accentBg: "bg-blue-50",
  navActive: "bg-blue-600 text-white",
  filterActive: "bg-blue-600",
  filterActiveBorder: "border-blue-600",
  filterActiveText: "text-white",
  amountActive: "bg-blue-600",
  amountActiveBorder: "border-blue-600",
  amountActiveText: "text-white",
  amountActiveSub: "text-blue-200",
  bottomNav: "bg-white",
  bottomNavBorder: "border-slate-200",
  categoryEconomy: "bg-amber-100 text-amber-800",
  categoryPolitics: "bg-purple-100 text-purple-800",
  categorySports: "bg-blue-100 text-blue-700",
  categoryStocks: "bg-emerald-100 text-emerald-700",
  payoutText: "text-blue-600",
};

const DARK = {
  pageBg: "bg-black",
  navBg: "bg-[#0D0D0D]",
  cardBg: "bg-[#111111]",
  inputBg: "bg-[#1A1A1A]",
  summaryBg: "bg-[#1A1A1A]",
  border: "border-[#2A2A2A]",
  borderLight: "border-[#1A1A1A]",
  textPrimary: "text-white",
  textSecondary: "text-[#E5E5E5]",
  textMuted: "text-[#888888]",
  accent: "bg-[#CCFF00]",
  accentHover: "hover:bg-[#B8E600]",
  accentText: "text-[#CCFF00]",
  accentBg: "bg-[#CCFF00]/10",
  navActive: "bg-[#CCFF00] text-black",
  filterActive: "bg-[#CCFF00]",
  filterActiveBorder: "border-[#CCFF00]",
  filterActiveText: "text-black",
  amountActive: "bg-[#CCFF00]",
  amountActiveBorder: "border-[#CCFF00]",
  amountActiveText: "text-black",
  amountActiveSub: "text-black/70",
  bottomNav: "bg-[#0D0D0D]",
  bottomNavBorder: "border-[#2A2A2A]",
  categoryEconomy: "bg-amber-500/15 text-amber-400",
  categoryPolitics: "bg-purple-500/15 text-purple-400",
  categorySports: "bg-[#CCFF00]/15 text-[#CCFF00]",
  categoryStocks: "bg-emerald-500/15 text-emerald-400",
  payoutText: "text-[#CCFF00]",
};

const ThemeContext = createContext<ThemeContextType | null>(null);

function loadSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

function saveSession(session: StoredSession | null) {
  if (typeof window === "undefined") return;
  if (session) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [cashNaira, setCashNaira] = useState<number | null>(null);
  const [totalValueNaira, setTotalValueNaira] = useState<number | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const sessionRef = useRef<StoredSession | null>(null);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  const t = theme === "light" ? LIGHT : DARK;

  const applySession = useCallback((session: StoredSession | null) => {
    sessionRef.current = session;
    saveSession(session);
    setUserId(session?.userId ?? null);
    setIsLoggedIn(!!session);
    if (!session) setCashNaira(null);
  }, []);

  const refreshPortfolio = useCallback(async () => {
    const token = sessionRef.current?.accessToken;
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/me/portfolio`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setCashNaira(data.cash_naira);
      setTotalValueNaira(data.total_value_naira);
    } catch {
      // silent -- portfolio just won't update this tick, next call will retry
    }
  }, []);

  // On first load, restore a saved session if we have one, refreshing the
  // token first if it's already expired (browser could've been closed for
  // hours -- access tokens only last 1 hour, refresh tokens last much longer).
  useEffect(() => {
    const saved = loadSession();
    if (!saved) return;
    if (saved.expiresAt > Date.now() + 30_000) {
      const id = requestAnimationFrame(() => {
        applySession(saved);
        refreshPortfolio();
      });
      return () => cancelAnimationFrame(id);
    }
    // expired -- try to refresh silently before giving up
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh?refresh_token=${encodeURIComponent(saved.refreshToken)}`, {
          method: "POST",
        });
        if (!res.ok) {
          applySession(null);
          return;
        }
        const data = await res.json();
        const next: StoredSession = {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          userId: saved.userId,
          expiresAt: Date.now() + data.expires_in * 1000,
        };
        applySession(next);
        refreshPortfolio();
      } catch {
        applySession(null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Returns a definitely-valid access token, refreshing first if it's
  // close to expiring. Every real API call that needs auth should go
  // through this instead of reading the token directly, so nothing ever
  // silently fails mid-session just because an hour passed.
  const getValidToken = useCallback(async (): Promise<string | null> => {
    const session = sessionRef.current;
    if (!session) return null;
    if (session.expiresAt > Date.now() + 30_000) {
      return session.accessToken;
    }
    try {
      const res = await fetch(`${API_BASE}/auth/refresh?refresh_token=${encodeURIComponent(session.refreshToken)}`, {
        method: "POST",
      });
      if (!res.ok) {
        applySession(null);
        return null;
      }
      const data = await res.json();
      const next: StoredSession = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        userId: session.userId,
        expiresAt: Date.now() + data.expires_in * 1000,
      };
      applySession(next);
      return next.accessToken;
    } catch {
      return null;
    }
  }, [applySession]);

  const signup = useCallback(async (email: string, password: string, displayName = "") => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, display_name: displayName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.detail || "Signup failed");
        return { ok: false };
      }
      // Signup does not log the user in -- Supabase requires email
      // confirmation first in production. Caller should show a
      // "check your email" message.
      return { ok: true, needsEmailConfirm: true };
    } catch {
      setAuthError("Could not reach the server. Try again.");
      return { ok: false };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.detail || "Login failed");
        return false;
      }
      const session: StoredSession = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        userId: data.user_id,
        expiresAt: Date.now() + data.expires_in * 1000,
      };
      applySession(session);
      await refreshPortfolio();
      return true;
    } catch {
      setAuthError("Could not reach the server. Try again.");
      return false;
    } finally {
      setAuthLoading(false);
    }
  }, [applySession, refreshPortfolio]);

  const logout = useCallback(() => {
    applySession(null);
  }, [applySession]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        isLoggedIn,
        setIsLoggedIn,
        userId,
        cashNaira,
        totalValueNaira,
        authError,
        authLoading,
        signup,
        login,
        logout,
        getValidToken,
        refreshPortfolio,
        t,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}