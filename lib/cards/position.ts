export const POSITION_OPTIONS: { value: string; label: string }[] = [
  { value: "GK", label: "Goalkeeper" },
  { value: "DEF", label: "Defender" },
  { value: "MID", label: "Midfielder" },
  { value: "FWD", label: "Forward" },
];

export const POSITION_LABEL: Record<string, string> = Object.fromEntries(
  POSITION_OPTIONS.map((o) => [o.value, o.label])
);
