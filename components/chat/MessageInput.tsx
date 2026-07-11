"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useSendMessage } from "@/lib/queries/messages";

export function MessageInput({ tradeId }: { tradeId: string }) {
  const [body, setBody] = useState("");
  const sendMutation = useSendMessage(tradeId);

  function handleSend() {
    const trimmed = body.trim();
    if (!trimmed) return;

    sendMutation.mutate(trimmed, {
      onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to send."),
    });
    setBody("");
  }

  return (
    <div className="flex items-end gap-2 border-t p-3">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Message about this trade…"
        rows={1}
        maxLength={2000}
        className="min-h-9 resize-none"
      />
      <Button size="icon" onClick={handleSend} disabled={sendMutation.isPending || !body.trim()}>
        <Send className="size-4" />
      </Button>
    </div>
  );
}
