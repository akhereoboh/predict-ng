"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTheme } from "../../context/theme";
import RollingNumber from "../../components/RollingNumber";
import { OUTCOME_COLORS, hashIndex, neutralHex } from "../../lib/colors";

const API_BASE = "https://sireai.uk/pm-api";

type PublicPosition = {
  market_id: string;
  question: string;
  outcome: string;
  contracts: number;
  current_value_naira: number;
};

type PublicProfile = {
  user_id: string;
  display_name: string;
  positions: PublicPosition[];
};



export default function PublicProfilePage() {
  const { theme, t } = useTheme();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/users/${userId}/profile`);
        if (!res.ok) {
          setError("This user couldn't be found.");
          return;
        }
        setProfile(await res.json());
      } catch {
        setError("Network error — try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const avatarColor = OUTCOME_COLORS[hashIndex(userId, OUTCOME_COLORS.length)].hex;

  return (
    <div className={`min-h-screen ${t.pageBg} ${t.textPrimary} font-sans pb-20`}>
      <nav className={`sticky top-0 z-10 ${t.navBg} border-b ${t.border} shadow-sm px-4 h-12 flex items-center justify-between`}>
        <button onClick={() => router.back()} className={`flex items-center gap-1.5 ${t.textMuted} cursor-pointer border-none bg-transparent text-sm`}>
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

      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading && <p className={`text-sm ${t.textMuted}`}>Loading…</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}

        {profile && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0"
                style={{ backgroundColor: avatarColor }}
              >
                {profile.display_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className={`text-lg font-bold ${t.textPrimary}`}>{profile.display_name}</p>
                <p className={`text-xs ${t.textMuted}`}>{profile.positions.length} open position{profile.positions.length === 1 ? "" : "s"}</p>
              </div>
            </div>

            <p className={`text-xs font-semibold ${t.textMuted} uppercase tracking-wide mb-3`}>Open positions</p>
            {profile.positions.length === 0 && <p className={`text-sm ${t.textMuted}`}>No open positions right now.</p>}
            <div className="flex flex-col gap-2">
              {profile.positions.map((pos) => {
                const color = pos.outcome.toLowerCase() === "draw"
                  ? neutralHex(theme === "dark")
                  : OUTCOME_COLORS[hashIndex(`${pos.market_id}-${pos.outcome}`, OUTCOME_COLORS.length)].hex;
                return (
                  <div
                    key={`${pos.market_id}-${pos.outcome}`}
                    onClick={() => router.push(`/market/${pos.market_id}`)}
                    className={`${t.cardBg} border ${t.border} rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow flex items-center justify-between gap-3`}
                  >
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${t.textPrimary} leading-snug`}>{pos.question}</p>
                      <span className="text-xs font-medium" style={{ color }}>{pos.outcome} · {pos.contracts.toFixed(2)} contracts</span>
                    </div>
                    <RollingNumber text={`₦${pos.current_value_naira.toFixed(2)}`} color={theme === "dark" ? "#FFFFFF" : "#000000"} className="text-sm font-bold shrink-0" />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}