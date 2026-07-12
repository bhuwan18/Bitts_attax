import { TopBar } from "@/components/nav/TopBar";
import { BottomNav } from "@/components/nav/BottomNav";
import { NotificationsListener } from "@/components/notifications/NotificationsListener";
import { ActivityRecorder } from "@/components/gamification/ActivityRecorder";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <NotificationsListener />
      <ActivityRecorder />
      <TopBar />
      <main className="flex-1 pb-[calc(8rem+env(safe-area-inset-bottom))]">{children}</main>
      <BottomNav />
    </div>
  );
}
