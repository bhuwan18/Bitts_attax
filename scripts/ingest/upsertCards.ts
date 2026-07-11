import { createClient } from "@supabase/supabase-js";
import type { NormalizedCard } from "../../lib/validation/card.schema";

const BATCH_SIZE = 500;

export interface UpsertSummary {
  attempted: number;
  upserted: number;
  batches: number;
}

// Uses the service-role key so RLS (which blocks client writes to `cards`)
// is bypassed for this trusted, server-only seeding path. Never import this
// module from the Next.js app.
export async function upsertCards(cards: NormalizedCard[]): Promise<UpsertSummary> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see .env.example)"
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let upserted = 0;
  let batches = 0;

  for (let i = 0; i < cards.length; i += BATCH_SIZE) {
    const batch = cards.slice(i, i + BATCH_SIZE);
    batches += 1;

    // Manual-source records (no external_ref) always insert distinct rows;
    // sourced records upsert on (source, external_ref) so re-running the
    // seeder is idempotent.
    const { error, count } = await supabase
      .from("cards")
      .upsert(batch, {
        onConflict: "source,external_ref",
        ignoreDuplicates: false,
        count: "exact",
      });

    if (error) {
      throw new Error(`Batch ${batches} upsert failed: ${error.message}`);
    }

    upserted += count ?? batch.length;
  }

  return { attempted: cards.length, upserted, batches };
}
