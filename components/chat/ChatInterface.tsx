"use client";

import { useEffect, useRef } from "react";
import { MessageSquare } from "lucide-react";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { MessageInput } from "@/components/chat/MessageInput";
import { useMessages } from "@/lib/queries/messages";
import { useTradeChannel } from "@/lib/realtime/useTradeChannel";
import { useCurrentUser } from "@/lib/queries/auth";

export function ChatInterface({ tradeId }: { tradeId: string }) {
  const { data: messages, isLoading } = useMessages(tradeId);
  const { data: currentUser } = useCurrentUser();
  useTradeChannel(tradeId);

  const scrollRef = useRef<HTMLDivElement>(null);
  const hasRenderedRef = useRef(false);

  // Scroll the message list itself rather than scrollIntoView-ing a bottom
  // anchor: this sits inline on the trade page, and scrollIntoView would drag
  // the whole page down past the trade terms. Jump on first paint, animate after.
  useEffect(() => {
    const list = scrollRef.current;
    if (!list) return;
    list.scrollTo({
      top: list.scrollHeight,
      behavior: hasRenderedRef.current ? "smooth" : "instant",
    });
    hasRenderedRef.current = true;
  }, [messages?.length]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="flex flex-col gap-3">
          {isLoading && <p className="text-sm text-muted-foreground">Loading messages…</p>}
          {!isLoading && messages?.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-14 text-center">
              <MessageSquare className="size-7 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">
                No messages yet. Say hello to get the trade moving.
              </p>
            </div>
          )}
          {messages?.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.sender_id === currentUser?.id}
            />
          ))}
        </div>
      </div>
      <MessageInput tradeId={tradeId} />
    </div>
  );
}
