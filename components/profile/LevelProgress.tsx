import { computeLevel, computeXpPercent } from "@/lib/gamification/level";

export function LevelProgress({ uniqueCardsOwned }: { uniqueCardsOwned: number }) {
  const level = computeLevel(uniqueCardsOwned);
  const xpPercent = computeXpPercent(uniqueCardsOwned);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-heading font-bold">Level {level}</span>
        <span className="text-muted-foreground">Collector</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-brand"
          style={{ width: `${xpPercent}%` }}
        />
      </div>
    </div>
  );
}
