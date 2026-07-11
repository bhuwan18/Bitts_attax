"use server";

import { createClient } from "@/lib/supabase/server";
import { SendMessageSchema } from "@/lib/validation/message.schema";

export async function sendMessage(tradeId: string, body: string) {
  const parsed = SendMessageSchema.parse({ tradeId, body });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in.");

  const { error } = await supabase.from("messages").insert({
    trade_id: parsed.tradeId,
    sender_id: user.id,
    body: parsed.body,
  });

  if (error) throw new Error(error.message);
}
