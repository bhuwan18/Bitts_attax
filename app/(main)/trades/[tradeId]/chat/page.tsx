"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ChatInterface } from "@/components/chat/ChatInterface";

export default function TradeChatPage({ params }: { params: Promise<{ tradeId: string }> }) {
  const { tradeId } = use(params);

  return (
    <div className="mx-auto flex h-full max-w-lg flex-col">
      <div className="flex items-center gap-3 border-b border-border bg-card px-3 py-3">
        <Link
          href={`/trades/${tradeId}`}
          className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Back to trade"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="font-sans text-sm font-extrabold tracking-wide uppercase">Trade chat</h1>
      </div>
      <ChatInterface tradeId={tradeId} />
    </div>
  );
}
