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
  common: "bg-muted text-muted-foreground",
  uncommon: "bg-secondary text-secondary-foreground",
  rare: "bg-primary/15 text-primary",
  super_rare: "bg-success/15 text-success",
  legend: "bg-primary text-primary-foreground",
  limited: "bg-destructive/15 text-destructive",
  other: "bg-muted text-muted-foreground",
};

export const FOIL_RARITIES = new Set(["legend", "limited"]);
