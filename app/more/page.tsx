"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "../context/theme";

type Row = {
  label: string;
  sub?: string;
  d: string; // icon path
  action?: "toggleTheme" | "logout" | "signin";
  route?: string;
};

const ACCOUNT: Row[] = [
  { label: "Profile", d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", route: "/more/profile" },
  { label: "Positions", d: "M9 17V9m4 8V5m4 12v-6M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z", route: "/positions" },
  { label: "Watchlist", d: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" },
  { label: "Transaction History", d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", route: "/history" },
  { label: "Deposit & Withdraw", d: "M12 4v16m0 0l-4-4m4 4l4-4M4 4h16", route: "/deposit-withdraw" },
];

const DISCOVERY: Row[] = [
  { label: "Leaderboard", d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6h6zm0 0h6m-6 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0h6v-4a2 2 0 00-2-2h-2a2 2 0 00-2 2v4z" },
  { label: "Rewards", d: "M12 15a4 4 0 100-8 4 4 0 000 8zm0 0v6m-4-2.5l-2 2M16 18.5l2 2" },
];

const SETTINGS: Row[] = [
  { label: "Appearance", d: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z", action: "toggleTheme" },
  { label: "Notifications", d: "M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.7V5a2 2 0 10-4 0v.3A6 6 0 006 11v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
  { label: "Security", d: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v2" },
];

const SUPPORT: Row[] = [
  { label: "Help Center", d: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Terms of Service", d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { label: "Privacy Policy", d: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
  { label: "Contact / Report an Issue", d: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" },
];

type ThemeTokens = ReturnType<typeof useTheme>["t"];

function Section({
  title,
  rows,
  theme,
  t,
  toggleTheme,
  onNavigate,
}: {
  title: string;
  rows: Row[];
  theme: "light" | "dark";
  t: ThemeTokens;
  toggleTheme: () => void;
  onNavigate: (route: string) => void;
}) {
  return (
    <div className="mb-6">
      <div className={`text-xs font-semibold tracking-wide ${t.textMuted} mb-2 px-1`}>{title}</div>
      <div className={`rounded-xl border ${t.border} divide-y ${theme === "dark" ? "divide-[#1A1A1A]" : "divide-slate-100"} overflow-hidden`}>
        {rows.map((row) => (
          <button
            key={row.label}
            onClick={() => { if (row.action === "toggleTheme") toggleTheme(); else if (row.route) onNavigate(row.route); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors ${t.cardBg} hover:${theme === "dark" ? "bg-[#161616]" : "bg-slate-50"} border-none text-left`}
          >
            <svg className={`w-5 h-5 shrink-0 ${t.textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={row.d} />
            </svg>
            <span className={`flex-1 text-sm font-medium ${t.textPrimary}`}>{row.label}</span>
            {row.action === "toggleTheme" ? (
              <span className={`text-xs px-2.5 py-1 rounded-full ${t.inputBg} ${t.textMuted}`}>
                {theme === "dark" ? "Dark" : "Light"}
              </span>
            ) : (
              <svg className={`w-4 h-4 shrink-0 ${t.textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function More() {
  const { theme, toggleTheme, t, isLoggedIn, setIsLoggedIn, cashNaira, totalValueNaira } = useTheme();
  const router = useRouter();

  return (
    <div className={`min-h-screen ${t.pageBg} ${t.textPrimary} font-sans pb-20`}>
      {/* NAV */}
      <nav className={`sticky top-0 z-10 ${t.navBg} border-b ${t.border} shadow-sm`}>
        <div className="flex items-center justify-between px-3 md:px-6 h-12">
          <div onClick={() => router.push("/portfolio")} className="flex items-center gap-1.5 cursor-pointer">
            <span className="w-6 h-6 rounded-md bg-[#CCFF00] flex items-center justify-center text-black text-xs font-black italic">E</span>
            <span className={`text-sm font-bold ${t.textPrimary}`}>Eris</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex flex-col items-center">
                <span className={`${t.textMuted} leading-none mb-0.5`}>Portfolio</span>
                <span className="font-bold text-emerald-500 text-xs">
                  {isLoggedIn ? (totalValueNaira != null ? `₦${totalValueNaira.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "…") : "₦0"}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className={`${t.textMuted} leading-none mb-0.5`}>Cash</span>
                <span className="font-bold text-emerald-500 text-xs">
                  {isLoggedIn ? (cashNaira != null ? `₦${cashNaira.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "…") : "₦0"}
                </span>
              </div>
            </div>
            <button
              onClick={() => { if (!isLoggedIn) router.push("/?auth=1"); }}
              className="text-sm px-4 py-1.5 rounded-md bg-blue-500 hover:bg-blue-400 text-white font-semibold transition-colors cursor-pointer border-none"
            >
              {isLoggedIn ? "Deposit" : "Sign in"}
            </button>
            <button
              onClick={toggleTheme}
              className={`w-8 h-8 rounded-full border ${t.border} flex items-center justify-center cursor-pointer ${t.navBg} transition-colors`}
              title={theme === "light" ? "Switch to dark" : "Switch to light"}
            >
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
        <h1 className={`text-xl font-bold ${t.textPrimary} mb-5`}>More</h1>

        <Section title="ACCOUNT" rows={ACCOUNT} theme={theme} t={t} toggleTheme={toggleTheme} onNavigate={(route) => router.push(route)} />
        <Section title="DISCOVERY" rows={DISCOVERY} theme={theme} t={t} toggleTheme={toggleTheme} onNavigate={(route) => router.push(route)} />
        <Section title="SETTINGS" rows={SETTINGS} theme={theme} t={t} toggleTheme={toggleTheme} onNavigate={(route) => router.push(route)} />
        <Section title="SUPPORT & LEGAL" rows={SUPPORT} theme={theme} t={t} toggleTheme={toggleTheme} onNavigate={(route) => router.push(route)} />

        <div className="mb-6">
          <div className={`text-xs font-semibold tracking-wide ${t.textMuted} mb-2 px-1`}>ACCOUNT ACTIONS</div>
          <div className={`rounded-xl border ${t.border} divide-y ${theme === "dark" ? "divide-[#1A1A1A]" : "divide-slate-100"} overflow-hidden`}>
            <button className={`w-full flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors ${t.cardBg} hover:${theme === "dark" ? "bg-[#161616]" : "bg-slate-50"} border-none text-left`}>
              <svg className={`w-5 h-5 shrink-0 ${t.textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8a3 3 0 10-2.83-4H15a3 3 0 000 6h.17A3 3 0 0018 8zM6 12a3 3 0 100 6 3 3 0 000-6zm0 0a3 3 0 013-3m9 9a3 3 0 10-2.83-4H15a3 3 0 000 6h.17A3 3 0 0018 18zM8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49" />
              </svg>
              <span className={`flex-1 text-sm font-medium ${t.textPrimary}`}>Refer a Friend</span>
              <svg className={`w-4 h-4 shrink-0 ${t.textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => { if (isLoggedIn) setIsLoggedIn(false); else router.push("/?auth=1"); }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors ${t.cardBg} hover:${theme === "dark" ? "bg-[#161616]" : "bg-slate-50"} border-none text-left`}
            >
              <svg className="w-5 h-5 shrink-0 text-[#E5484D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="flex-1 text-sm font-medium text-[#E5484D]">
                {isLoggedIn ? "Log Out" : "Sign In"}
              </span>
            </button>
          </div>
        </div>
      </div>

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
            }}
            className={`flex flex-col items-center gap-1 ${item.label === "More" ? t.textPrimary : t.textMuted} hover:${t.accentText} transition-colors cursor-pointer border-none bg-transparent py-1 px-3`}
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