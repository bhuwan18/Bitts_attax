import { z } from "zod";

export const CreateListingSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  haves: z
    .array(z.object({ cardId: z.uuid(), quantity: z.number().int().min(1).default(1) }))
    .min(1, "Add at least one card you have"),
  wants: z
    .array(z.object({ cardId: z.uuid(), quantity: z.number().int().min(1).default(1) }))
    .min(1, "Add at least one card you want"),
});

export type CreateListingInput = z.infer<typeof CreateListingSchema>;

export const ProposeTradeSchema = z
  .object({
    listingId: z.uuid().nullable().default(null),
    counterpartyId: z.uuid(),
    myItems: z.array(z.object({ cardId: z.uuid(), quantity: z.number().int().min(1).default(1) })),
    theirItems: z.array(
      z.object({ cardId: z.uuid(), quantity: z.number().int().min(1).default(1) })
    ),
  })
  // A one-sided trade is legitimate (a gift, or asking for a freebie), but an
  // empty one isn't — and it would still fire a "trade_proposed" notification
  // off the trades insert trigger.
  .refine((trade) => trade.myItems.length + trade.theirItems.length > 0, {
    message: "Add at least one card to offer or request.",
    path: ["myItems"],
  });

export type ProposeTradeInput = z.infer<typeof ProposeTradeSchema>;
