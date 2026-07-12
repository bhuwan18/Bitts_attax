const MS_PER_DAY = 86_400_000;

function daysBetween(laterDate: string, earlierDate: string): number {
  const later = new Date(`${laterDate}T00:00:00Z`).getTime();
  const earlier = new Date(`${earlierDate}T00:00:00Z`).getTime();
  return Math.round((later - earlier) / MS_PER_DAY);
}

// activityDatesDesc: distinct "YYYY-MM-DD" activity_log dates for one user,
// newest first (as returned by an `order("activity_date", { ascending: false })`
// query). today is passed in rather than read from `new Date()` internally so
// this stays a pure, deterministically-testable function — the caller (a
// client hook) supplies the browser's own local calendar date, matching how
// recordDailyActivity records activity in local time (see gamification
// actions for why).
export function computeCurrentStreak(activityDatesDesc: string[], today: string): number {
  if (activityDatesDesc.length === 0) return 0;

  // More than a full day has elapsed since the last recorded activity — the
  // streak is broken. (0 = active today already, 1 = active yesterday, streak
  // still alive pending today's visit.)
  if (daysBetween(today, activityDatesDesc[0]) > 1) return 0;

  let streak = 1;
  for (let i = 1; i < activityDatesDesc.length; i++) {
    const gap = daysBetween(activityDatesDesc[i - 1], activityDatesDesc[i]);
    if (gap === 0) continue; // defensive: duplicate date, shouldn't happen given the DB unique constraint
    if (gap === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
