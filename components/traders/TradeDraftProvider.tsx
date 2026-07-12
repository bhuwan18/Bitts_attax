"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { CardOption, PickedItem } from "@/components/trades/HaveWantPicker";

// The trade being assembled on a trader's profile. It lives here rather than
// inside ProposeTradeForm because two surfaces write to it: the form's pickers,
// and the Haves grid, where tapping a card requests it. Scoped to one
// counterparty — the profile page is the only thing that mounts this.
interface TradeDraft {
  counterpartyId: string;
  /** Cards you're offering. */
  myItems: PickedItem[];
  /** Cards you're asking them for. */
  theirItems: PickedItem[];
  setMyItems: (items: PickedItem[]) => void;
  setTheirItems: (items: PickedItem[]) => void;
  requestCard: (option: CardOption, quantity?: number) => void;
  removeRequest: (cardId: string) => void;
  isRequested: (cardId: string) => boolean;
}

const TradeDraftContext = createContext<TradeDraft | null>(null);

export function useTradeDraft() {
  const draft = useContext(TradeDraftContext);
  if (!draft) throw new Error("useTradeDraft must be used within a TradeDraftProvider.");
  return draft;
}

export function TradeDraftProvider({
  counterpartyId,
  children,
}: {
  counterpartyId: string;
  children: React.ReactNode;
}) {
  const [myItems, setMyItems] = useState<PickedItem[]>([]);
  const [theirItems, setTheirItems] = useState<PickedItem[]>([]);

  // Idempotent, matching HaveWantPicker.addCard — a second tap on a card that's
  // already in the draft must not duplicate it or reset its quantity.
  const requestCard = useCallback((option: CardOption, quantity = 1) => {
    setTheirItems((items) =>
      items.some((i) => i.cardId === option.cardId)
        ? items
        : [...items, { ...option, quantity }]
    );
  }, []);

  const removeRequest = useCallback((cardId: string) => {
    setTheirItems((items) => items.filter((i) => i.cardId !== cardId));
  }, []);

  const value = useMemo<TradeDraft>(
    () => ({
      counterpartyId,
      myItems,
      theirItems,
      setMyItems,
      setTheirItems,
      requestCard,
      removeRequest,
      isRequested: (cardId) => theirItems.some((i) => i.cardId === cardId),
    }),
    [counterpartyId, myItems, theirItems, requestCard, removeRequest]
  );

  return <TradeDraftContext value={value}>{children}</TradeDraftContext>;
}
