import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { CardSearch } from "@/components/cards/CardSearch";
import { createClient } from "@/lib/supabase/server";
import {
  cardsInfiniteQueryKey,
  cardsDistinctTeamsQueryKey,
  cardsDistinctSetNamesQueryKey,
  fetchCardsPage,
  fetchDistinctTeams,
  fetchDistinctSetNames,
  getNextCardsPageParam,
} from "@/lib/queries/cardsShared";

export const metadata = {
  title: "Card Database — Bitts Attax",
};

export default async function CardsPage() {
  const supabase = await createClient();
  // retry: false — an awaited prefetch that retries with backoff on a
  // transient error would stall the SSR response; a failed prefetch just
  // means the client fetches normally on mount instead. This also matters
  // for the distinct-teams/set-names RPCs below, which 404 until migration
  // 0006 is applied — without retry:false that'd add retry/backoff latency
  // to every /cards render in the meantime.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  await Promise.all([
    queryClient.prefetchInfiniteQuery({
      queryKey: cardsInfiniteQueryKey({}),
      queryFn: ({ pageParam }) => fetchCardsPage(supabase, {}, pageParam),
      initialPageParam: 0,
      getNextPageParam: getNextCardsPageParam,
    }),
    queryClient.prefetchQuery({
      queryKey: cardsDistinctTeamsQueryKey,
      queryFn: () => fetchDistinctTeams(supabase),
    }),
    queryClient.prefetchQuery({
      queryKey: cardsDistinctSetNamesQueryKey,
      queryFn: () => fetchDistinctSetNames(supabase),
    }),
  ]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 p-4 sm:p-6">
      <div>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight">Card Database</h1>
        <p className="text-sm text-muted-foreground">Browse every card in the set.</p>
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <CardSearch />
      </HydrationBoundary>
    </div>
  );
}
