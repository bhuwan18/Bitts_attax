// Mirrors the check constraint on trades.status in
// supabase/migrations/0001_init_schema.sql — keep in sync if that changes.
export const TRADE_STATUS_STYLE: Record<string, string> = {
  proposed: "bg-warning text-warning-foreground",
  accepted: "bg-success/15 text-success",
  completed: "bg-success text-success-foreground",
  rejected: "bg-destructive/15 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};
