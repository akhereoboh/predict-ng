// Centralized outcome-color system -- used anywhere a market outcome,
// team, or selection needs a distinct, consistent color (market cards,
// order book, portfolio, profile pages). Previously this exact palette
// and hash function were copy-pasted into 6+ files independently; now
// there's one source of truth, so expanding the palette only means
// editing this one file.
//
// Expanded from 12 to 24 hues -- closer to the range Polymarket's own
// sports odds boards actually use (distinct golds, olives, navys,
// maroons per selection, not a small set of primaries repeating).

export type ColorEntry = {
  hex: string;
  pill: string; // Tailwind classes for a solid button/pill
  bar: string;  // Tailwind class for a probability-bar segment
};

export const OUTCOME_COLORS: ColorEntry[] = [
  { hex: "#C2410C", pill: "bg-orange-700 hover:bg-orange-600 text-white", bar: "bg-orange-700" },
  { hex: "#991B1B", pill: "bg-red-800 hover:bg-red-700 text-white", bar: "bg-red-800" },
  { hex: "#1E40AF", pill: "bg-blue-800 hover:bg-blue-700 text-white", bar: "bg-blue-800" },
  { hex: "#047857", pill: "bg-emerald-700 hover:bg-emerald-600 text-white", bar: "bg-emerald-700" },
  { hex: "#6B21A8", pill: "bg-purple-800 hover:bg-purple-700 text-white", bar: "bg-purple-800" },
  { hex: "#9F1239", pill: "bg-rose-800 hover:bg-rose-700 text-white", bar: "bg-rose-800" },
  { hex: "#155E75", pill: "bg-cyan-800 hover:bg-cyan-700 text-white", bar: "bg-cyan-800" },
  { hex: "#B45309", pill: "bg-amber-700 hover:bg-amber-600 text-white", bar: "bg-amber-700" },
  { hex: "#0F766E", pill: "bg-teal-800 hover:bg-teal-700 text-white", bar: "bg-teal-800" },
  { hex: "#3730A3", pill: "bg-indigo-800 hover:bg-indigo-700 text-white", bar: "bg-indigo-800" },
  { hex: "#4D7C0F", pill: "bg-lime-800 hover:bg-lime-700 text-white", bar: "bg-lime-800" },
  { hex: "#A21CAF", pill: "bg-fuchsia-800 hover:bg-fuchsia-700 text-white", bar: "bg-fuchsia-800" },
  // ---- new additions: mustard/gold, olive, navy, maroon, slate, forest,
  // burnt orange, wine -- the wider range visible on Polymarket's own
  // sports board, where 15-20+ visually distinct selections sit on one
  // page at once and still read as different at a glance ----
  { hex: "#A16207", pill: "bg-yellow-700 hover:bg-yellow-600 text-white", bar: "bg-yellow-700" },
  { hex: "#3F6212", pill: "bg-lime-900 hover:bg-lime-800 text-white", bar: "bg-lime-900" },
  { hex: "#1E3A8A", pill: "bg-blue-900 hover:bg-blue-800 text-white", bar: "bg-blue-900" },
  { hex: "#7F1D1D", pill: "bg-red-900 hover:bg-red-800 text-white", bar: "bg-red-900" },
  { hex: "#334155", pill: "bg-slate-700 hover:bg-slate-600 text-white", bar: "bg-slate-700" },
  { hex: "#14532D", pill: "bg-green-900 hover:bg-green-800 text-white", bar: "bg-green-900" },
  { hex: "#7C2D12", pill: "bg-orange-900 hover:bg-orange-800 text-white", bar: "bg-orange-900" },
  { hex: "#701A75", pill: "bg-fuchsia-900 hover:bg-fuchsia-800 text-white", bar: "bg-fuchsia-900" },
  { hex: "#0E7490", pill: "bg-cyan-700 hover:bg-cyan-600 text-white", bar: "bg-cyan-700" },
  { hex: "#78350F", pill: "bg-amber-900 hover:bg-amber-800 text-white", bar: "bg-amber-900" },
  { hex: "#831843", pill: "bg-pink-900 hover:bg-pink-800 text-white", bar: "bg-pink-900" },
  { hex: "#365314", pill: "bg-lime-950 hover:bg-lime-900 text-white", bar: "bg-lime-950" },
];

/** Same deterministic hash used everywhere -- identical string always
 * lands on the identical color, so "Barcelona" is the same color on
 * every card it appears on, without any manual per-team mapping. */
export function hashIndex(str: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % mod;
}

/** The color entry for a given key (an outcome name, a market id +
 * outcome combo, whatever the caller uses as its distinguishing key). */
export function colorForKey(key: string): ColorEntry {
  return OUTCOME_COLORS[hashIndex(key, OUTCOME_COLORS.length)];
}

/** Neutral gray, used for "Draw" -- the one outcome that should never
 * look like a directional pick, regardless of hash position. */
export function neutralHex(isDark: boolean): string {
  return isDark ? "#A1A1AA" : "#64748B";
}
export function neutralPillClass(inputBgClass: string, textMutedClass: string): string {
  return `${inputBgClass} ${textMutedClass} hover:opacity-80`;
}
export function neutralBarClass(isDark: boolean): string {
  return isDark ? "bg-zinc-600" : "bg-slate-300";
}