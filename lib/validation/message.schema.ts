import { z } from "zod";

export const SendMessageSchema = z.object({
  tradeId: z.uuid(),
  body: z.string().trim().min(1).max(2000),
});

export type SendMessageInput = z.infer<typeof SendMessageSchema>;
