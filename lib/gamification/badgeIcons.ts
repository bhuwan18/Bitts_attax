import { Handshake, Gem, Flame, Repeat, type LucideIcon } from "lucide-react";

// Icon choice is a presentation concern, resolved here rather than persisted
// as data on the achievements table (which would just have to stay in sync
// with this file anyway). Shared between AchievementBadgeGrid (Profile) and
// AchievementsPreview (Home).
export const ACHIEVEMENT_ICON: Record<string, LucideIcon> = {
  first_trade: Handshake,
  rare_hunter: Gem,
  streak_5: Flame,
  trader_x3: Repeat,
};

export const DEFAULT_ACHIEVEMENT_ICON = Gem;
