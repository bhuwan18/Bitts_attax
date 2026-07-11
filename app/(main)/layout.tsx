import { DesktopHeader } from "@/components/nav/DesktopHeader";
import { MobileNav } from "@/components/nav/MobileNav";
import { NotificationsListener } from "@/components/notifications/NotificationsListener";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <NotificationsListener />
      <DesktopHeader />
      <main className="flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
