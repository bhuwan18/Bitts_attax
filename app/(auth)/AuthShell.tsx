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
      <Link href="/" className="flex items-center gap-2 font-heading text-xl font-bold tracking-tight">
        <Logo className="size-6 text-brand" />
        Bitts Attax
      </Link>

      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col gap-1.5 text-center">
          <h1 className="font-heading text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {children}
        {footer}
      </div>
    </div>
  );
}
