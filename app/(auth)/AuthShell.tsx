import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-10">
      <Link
        href="/"
        className="animate-in fade-in-0 zoom-in-95 animation-duration-500 flex items-center gap-2 font-heading text-xl tracking-tight"
      >
        <Logo className="size-6 text-brand" />
        Bitts Attax
      </Link>

      <div
        style={{ animationDelay: "80ms" }}
        className="animate-in fade-in-0 slide-in-from-bottom-4 fill-mode-both animation-duration-500 flex w-full max-w-sm flex-col gap-8"
      >
        <div className="flex flex-col gap-1.5 text-center">
          <h1 className="font-heading text-2xl tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {children}
        {footer}
      </div>
    </div>
  );
}
