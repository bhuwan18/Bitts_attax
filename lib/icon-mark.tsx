export const ICON_BG = "#211c14";
export const ICON_GOLD = "#dba53c";

/**
 * The two-card brand mark, rendered with plain positioned divs so it can run
 * through Satori (next/og's ImageResponse) for favicons/app icons — no CSS
 * custom properties or Tailwind there, so colors are hardcoded hex.
 */
export function IconMark({
  size,
  safe = 1,
}: {
  size: number;
  /** Shrink factor for maskable icons, keeping content inside the OS safe zone. */
  safe?: number;
}) {
  const inset = (size * (1 - safe)) / 2;
  const cardW = size * 0.34 * safe;
  const cardH = size * 0.46 * safe;
  const radius = size * 0.09 * safe;

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        position: "relative",
        background: ICON_BG,
      }}
    >
      <div
        style={{
          position: "absolute",
          display: "flex",
          left: size * 0.24 * safe + inset,
          top: size * 0.32 * safe + inset,
          width: cardW,
          height: cardH,
          borderRadius: radius,
          background: ICON_GOLD,
          opacity: 0.4,
          transform: "rotate(-12deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          display: "flex",
          left: size * 0.4 * safe + inset,
          top: size * 0.16 * safe + inset,
          width: cardW,
          height: cardH,
          borderRadius: radius,
          background: ICON_GOLD,
          transform: "rotate(8deg)",
        }}
      />
    </div>
  );
}
