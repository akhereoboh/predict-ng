// Casino/odometer-style rolling digits -- each numeral is a tiny vertical
// "reel" of 0-9 that slides to the new digit's position via a CSS
// transition, instead of the text just snapping to a new value. Non-digit
// characters ($, commas, the naira sign, periods) render statically
// alongside the reels. Used anywhere a live number updates -- prices,
// potential payouts, anything that should feel alive rather than static.

function RollingDigit({ digit, color }: { digit: string; color: string }) {
  if (!/[0-9]/.test(digit)) {
    return (
      <span style={{ color, display: "inline-block" }}>{digit}</span>
    );
  }
  const n = parseInt(digit, 10);
  return (
    <span
      style={{
        display: "inline-block",
        overflow: "hidden",
        height: "1em",
        width: "0.62em",
        verticalAlign: "top",
      }}
    >
      <span
        style={{
          display: "block",
          transform: `translateY(-${n}em)`,
          transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          color,
        }}
      >
        {Array.from({ length: 10 }, (_, d) => (
          <span key={d} style={{ display: "block", height: "1em", lineHeight: "1em" }}>
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

export default function RollingNumber({ text, color, className }: { text: string; color: string; className?: string }) {
  return (
    <span className={className} style={{ display: "inline-flex", fontVariantNumeric: "tabular-nums" }}>
      {text.split("").map((ch, i) => (
        <RollingDigit key={i} digit={ch} color={color} />
      ))}
    </span>
  );
}