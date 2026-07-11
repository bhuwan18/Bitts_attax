import type { ReactNode, CSSProperties } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
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
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Phone + portrait-tablet hero — a real banner, not just a logo. */}
      <div className="relative overflow-hidden bg-primary px-6 py-8 text-primary-foreground sm:px-10 sm:py-10 lg:hidden">
        <div className="pattern-diagonal absolute inset-0 opacity-60" />
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 15%, color-mix(in oklch, var(--primary-foreground) 18%, transparent), transparent 55%)",
          }}
        />
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div className="flex flex-col gap-3">
            <Link
              href="/cards"
              className="flex items-center gap-2 font-heading text-lg font-extrabold tracking-tight uppercase"
            >
              <Logo className="size-5" />
              Bitts Attax
            </Link>
            <p className="font-heading text-3xl leading-[0.95] font-extrabold tracking-tight uppercase sm:text-4xl">
              Collect. Trade.
              <br />
              Win&nbsp;the&nbsp;swap.
            </p>
            <TrustSeal />
          </div>
          <CardFan compact />
        </div>
      </div>

      {/* Landscape-tablet + desktop side panel. */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary px-10 py-12 text-primary-foreground lg:flex xl:px-14">
        <div className="pattern-diagonal absolute inset-0 opacity-60" />
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 10%, color-mix(in oklch, var(--primary-foreground) 20%, transparent), transparent 55%)",
          }}
        />

        <Link
          href="/cards"
          className="relative z-10 flex items-center gap-2 font-heading text-xl font-extrabold tracking-tight uppercase"
        >
          <Logo className="size-6" />
          Bitts Attax
        </Link>

        <div className="relative z-10 flex flex-col gap-10">
          <CardFan />
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-primary-foreground/70 uppercase">
              Join the trade floor
            </p>
            <p className="mt-2 font-heading text-5xl leading-[0.94] font-extrabold tracking-tight uppercase xl:text-6xl">
              Collect.
              <br />
              Trade.
              <br />
              Win&nbsp;the&nbsp;swap.
            </p>
            <p className="mt-4 max-w-xs text-sm text-primary-foreground/80">
              Track your Match Attax collection, list cards for trade, and settle every deal with
              a fairness score both sides can trust.
            </p>
          </div>
        </div>

        <TrustSeal className="relative z-10 w-fit" />
      </div>

      {/* Form panel. */}
      <div className="relative flex flex-col justify-center overflow-hidden px-6 py-10 sm:px-10 lg:py-12">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-8 -bottom-20 hidden font-heading text-[18rem] leading-none font-extrabold text-foreground/[0.035] select-none sm:block"
        >
          BA
        </span>
        <div className="relative mx-auto flex w-full max-w-sm flex-col gap-8">
          <div className="flex flex-col gap-1.5">
            <h1 className="font-heading text-3xl font-extrabold tracking-tight">{title}</h1>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          {children}
          {footer}
        </div>
      </div>
    </div>
  );
}

const FAN_CARDS = [
  { tilt: -12, x: 0, y: 14, tone: "bg-muted/80 text-foreground/70", label: "Common", value: "6.1" },
  { tilt: 7, x: 34, y: 4, tone: "bg-secondary text-secondary-foreground", label: "Rare", value: "7.8" },
  { tilt: -4, x: 68, y: 10, tone: "bg-success text-success-foreground", label: "Super Rare", value: "8.6" },
  { tilt: 6, x: 100, y: -2, tone: "bg-primary-foreground text-primary", label: "Legend", value: "9.4" },
];

function CardFan({ compact = false }: { compact?: boolean }) {
  const cardSize = compact ? "h-24 w-[4.6rem] p-1.5" : "h-40 w-28 p-2.5";
  const valueSize = compact ? "text-lg" : "text-3xl";
  const labelSize = compact ? "text-[6.5px]" : "text-[10px]";

  return (
    <div className={cn("relative shrink-0", compact ? "h-28 w-44" : "h-44 w-56")}>
      {FAN_CARDS.map((card, i) => (
        <div
          key={card.label}
          className={cn(
            "clip-corner animate-card-float absolute top-0 flex flex-col justify-between shadow-lg ring-1 ring-black/10",
            cardSize,
            card.tone
          )}
          style={
            {
              left: `${card.x}%`,
              top: `${card.y}%`,
              "--tilt": `${card.tilt}deg`,
              animationDelay: `${i * 0.35}s`,
              zIndex: i,
            } as CSSProperties
          }
        >
          <span className={cn("font-heading leading-none font-extrabold", valueSize)}>
            {card.value}
          </span>
          <span className={cn("font-heading font-bold tracking-widest uppercase opacity-70", labelSize)}>
            {card.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function TrustSeal({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex w-fit items-center gap-2 rounded-full bg-primary-foreground/10 py-1 pr-3 pl-1 ring-1 ring-primary-foreground/20 backdrop-blur-sm",
        className
      )}
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-foreground text-primary">
        <ShieldCheck className="size-3.5" />
      </span>
      <span className="text-xs font-medium text-primary-foreground/90">
        Every trade fairness-checked
      </span>
    </div>
  );
}
