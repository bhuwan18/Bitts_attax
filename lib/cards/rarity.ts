export const RARITY_LABEL: Record<string, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  super_rare: "Super Rare",
  legend: "Legend",
  limited: "Limited",
  other: "Other",
};

export const RARITY_STYLE: Record<string, string> = {
  common: "bg-rarity-common/15 text-rarity-common",
  uncommon: "bg-rarity-uncommon/15 text-rarity-uncommon",
  rare: "bg-rarity-rare/15 text-rarity-rare",
  super_rare: "bg-rarity-super-rare/15 text-rarity-super-rare",
  legend: "bg-rarity-legend/15 text-rarity-legend",
  limited: "bg-rarity-limited/15 text-rarity-limited",
  other: "bg-rarity-common/15 text-rarity-common",
};

// Border + glow pair for the card-tile treatment — border color always
// matches the glow's tier so the two read as one continuous effect.
export const RARITY_BORDER_CLASS: Record<string, string> = {
  common: "border-rarity-common",
  uncommon: "border-rarity-uncommon",
  rare: "border-rarity-rare",
  super_rare: "border-rarity-super-rare",
  legend: "border-rarity-legend",
  limited: "border-rarity-limited",
  other: "border-rarity-common",
};

export const RARITY_GLOW_CLASS: Record<string, string> = {
  common: "rarity-glow-common",
  uncommon: "rarity-glow-uncommon",
  rare: "rarity-glow-rare",
  super_rare: "rarity-glow-super-rare",
  legend: "rarity-glow-legend",
  limited: "rarity-glow-limited",
  other: "rarity-glow-common",
};

export const FOIL_RARITIES = new Set(["legend", "limited"]);
