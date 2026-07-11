import { cn } from "@/lib/utils";
import type { MessageWithSender } from "@/lib/queries/messages";

export function MessageBubble({
  message,
  isOwn,
}: {
  message: MessageWithSender;
  isOwn: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", isOwn ? "items-end" : "items-start")}>
      {!isOwn && (
        <span className="px-1 text-xs text-muted-foreground">
          {message.sender?.display_name ?? message.sender?.username ?? "Unknown"}
        </span>
      )}
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3 py-2 text-sm break-words",
          isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        {message.body}
      </div>
    </div>
  );
}
