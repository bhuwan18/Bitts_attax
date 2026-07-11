import { DesktopHeader } from "@/components/nav/DesktopHeader";
import { MobileNav } from "@/components/nav/MobileNav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <DesktopHeader />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <MobileNav />
    </div>
  );
}
