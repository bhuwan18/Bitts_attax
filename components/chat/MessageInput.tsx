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
    <div className="flex items-end gap-2 border-t border-border bg-card p-3">
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
        className="min-h-10 resize-none rounded-2xl"
      />
      <Button
        size="icon"
        className="rounded-full"
        onClick={handleSend}
        disabled={sendMutation.isPending || !body.trim()}
        aria-label="Send message"
      >
        <Send className="size-4" />
      </Button>
    </div>
  );
}
