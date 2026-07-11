"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ChatInterface } from "@/components/chat/ChatInterface";

export default function TradeChatPage({ params }: { params: Promise<{ tradeId: string }> }) {
  const { tradeId } = use(params);

  return (
    <div className="mx-auto flex max-w-lg flex-col">
      <div className="flex items-center gap-2 border-b p-3">
        <Link href={`/trades/${tradeId}`} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="text-sm font-semibold">Trade chat</h1>
      </div>
      <ChatInterface tradeId={tradeId} />
    </div>
  );
}
