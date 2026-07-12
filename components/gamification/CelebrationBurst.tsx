"use client";

import { useEffect, useState } from "react";

const PARTICLE_COUNT = 12;
const PARTICLE_COLORS = [
  "var(--rarity-legend)",
  "var(--rarity-rare)",
  "var(--rarity-super-rare)",
  "var(--rarity-limited)",
];

// A dozen particles flung outward from center and faded — not a canvas
// confetti library, just CSS. Callers must pass `key={trigger}` alongside
// `trigger` — the key change is what remounts <Burst> (and its `visible`
// state) each time a new achievement unlocks, so this component never needs
// to setState synchronously in response to a changing prop.
export function CelebrationBurst({ trigger }: { trigger: number }) {
  return trigger ? <Burst /> : null;
}

function Burst() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setVisible(false), 800);
    return () => clearTimeout(timeout);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center"
      aria-hidden="true"
    >
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <span
          key={i}
          className="celebration-particle absolute size-2.5 rounded-full"
          style={
            {
              "--angle": `${(360 / PARTICLE_COUNT) * i}deg`,
              backgroundColor: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
              animationDelay: `${(i % 4) * 25}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
