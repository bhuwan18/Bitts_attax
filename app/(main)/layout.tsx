import { Sidebar } from "@/components/nav/Sidebar";
import { MobileTopBar } from "@/components/nav/MobileTopBar";
import { MobileNav } from "@/components/nav/MobileNav";
import { NotificationsListener } from "@/components/notifications/NotificationsListener";
import { ActivityRecorder } from "@/components/gamification/ActivityRecorder";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <NotificationsListener />
      <ActivityRecorder />
      <Sidebar />
      <MobileTopBar />
      <main className="flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
