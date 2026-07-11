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

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col bg-background md:h-[calc(100vh-4rem)]">
      <div className="flex-1 overflow-y-auto p-3">
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
          <div ref={bottomRef} />
        </div>
      </div>
      <MessageInput tradeId={tradeId} />
    </div>
  );
}
