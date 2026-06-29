"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
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
  pageBg: "bg-zinc-950",
  navBg: "bg-zinc-900",
  cardBg: "bg-zinc-900",
  inputBg: "bg-zinc-800",
  summaryBg: "bg-zinc-800",
  border: "border-zinc-700",
  borderLight: "border-zinc-800",
  textPrimary: "text-zinc-100",
  textSecondary: "text-zinc-300",
  textMuted: "text-zinc-500",
  accent: "bg-yellow-500",
  accentHover: "hover:bg-yellow-400",
  accentText: "text-yellow-400",
  accentBg: "bg-yellow-500/10",
  navActive: "bg-yellow-500 text-zinc-900",
  filterActive: "bg-yellow-500",
  filterActiveBorder: "border-yellow-500",
  filterActiveText: "text-zinc-900",
  amountActive: "bg-yellow-500",
  amountActiveBorder: "border-yellow-500",
  amountActiveText: "text-zinc-900",
  amountActiveSub: "text-zinc-900/70",
  bottomNav: "bg-zinc-900",
  bottomNavBorder: "border-zinc-700",
  categoryEconomy: "bg-amber-900/40 text-amber-400",
  categoryPolitics: "bg-purple-900/40 text-purple-400",
  categorySports: "bg-yellow-900/40 text-yellow-400",
  categoryStocks: "bg-emerald-900/40 text-emerald-400",
  payoutText: "text-yellow-400",
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  const t = theme === "light" ? LIGHT : DARK;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, t }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
