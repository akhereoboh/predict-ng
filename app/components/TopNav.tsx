"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "../context/theme";

type Props = {
  /** "full": logo, Portfolio + Cash stats, portfolio icon, Deposit/Sign-in
   *  -- used on Home, More, Football, Breaking, and any future
   *  category/section page.
   *  "back": back button + logo only, no stats -- used on the market
   *  detail page, BTC page, public profile page. */
  variant?: "full" | "back";
  onBack?: () => void;
};

export default function TopNav({ variant = "full", onBack }: Props) {
  const router = useRouter();
  const { theme, t, isLoggedIn, cashNaira, totalValueNaira, setShowDepositModal, setShowAuthModal } = useTheme() as any;
  // NOTE: setShowDepositModal / setShowAuthModal are only used on pages
  // that actually own a deposit/auth modal (Home). Pages using variant
  // "full" without those modals available should pass nothing for those
  // handlers and this component falls back to router.push("/deposit-withdraw")
  // and router.push("/?auth=1") respectively -- see below.

  if (variant === "back") {
    return (
      <nav className={`sticky top-0 z-10 ${t.navBg} border-b ${t.border} shadow-sm px-4 h-12 flex items-center justify-between`}>
        <button onClick={onBack ?? (() => router.back())} className={`flex items-center gap-1.5 ${t.textMuted} cursor-pointer border-none bg-transparent text-sm`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div onClick={() => router.push("/")} className="flex items-center gap-1.5 cursor-pointer">
          <span className="w-5 h-5 rounded-md bg-[#CCFF00] flex items-center justify-center text-black text-xs font-black italic">E</span>
          <span className={`text-sm font-bold ${t.textPrimary}`}>Eris</span>
        </div>
        <span className="w-12" />
      </nav>
    );
  }

  return (
    <nav className={`sticky top-0 z-10 ${t.navBg} border-b ${t.border} shadow-sm`}>
      <div className="flex items-center justify-between px-3 md:px-6 h-12">
        <div onClick={() => router.push("/")} className="flex items-center gap-1.5 cursor-pointer">
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

          {isLoggedIn && (
            <button
              onClick={() => router.push("/portfolio")}
              title="Portfolio"
              className={`w-8 h-8 rounded-full border ${t.border} flex items-center justify-center cursor-pointer ${t.navBg} transition-colors`}
            >
              <svg className={`w-4 h-4 ${t.textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          )}

          {isLoggedIn ? (
            <button
              onClick={() => (setShowDepositModal ? setShowDepositModal(true) : router.push("/deposit-withdraw"))}
              className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer border-none ${theme === "dark" ? "bg-blue-500 hover:bg-blue-400" : "bg-black hover:bg-zinc-800"} text-white`}
            >
              Deposit
            </button>
          ) : (
            <button
              onClick={() => (setShowAuthModal ? setShowAuthModal(true) : router.push("/?auth=1"))}
              className={`text-sm px-4 py-1.5 rounded-md font-semibold transition-colors cursor-pointer border-none ${theme === "dark" ? "bg-blue-500 hover:bg-blue-400" : "bg-black hover:bg-zinc-800"} text-white`}
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}