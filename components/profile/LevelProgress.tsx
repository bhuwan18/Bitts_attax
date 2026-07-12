import { computeLevel, computeXpPercent } from "@/lib/gamification/level";

export function LevelProgress({ uniqueCardsOwned }: { uniqueCardsOwned: number }) {
  const level = computeLevel(uniqueCardsOwned);
  const xpPercent = computeXpPercent(uniqueCardsOwned);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-extrabold tracking-wide text-muted-foreground uppercase">
            Level
          </span>
          <span className="font-heading text-4xl leading-none text-primary">{level}</span>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">{xpPercent}% to next level</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full w-full origin-left rounded-full bg-gradient-to-r from-primary to-brand transition-transform duration-700 ease-[var(--ease-out-quint)]"
          style={{ transform: `scaleX(${xpPercent / 100})` }}
        />
      </div>
    </div>
  );
}
