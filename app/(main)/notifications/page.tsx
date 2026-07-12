import { NotificationList } from "@/components/notifications/NotificationList";

export const metadata = {
  title: "Notifications — Bitts Attax",
};

export default function NotificationsPage() {
  // Stays a single column on purpose — an inbox reads top-to-bottom — but wide
  // enough not to be a thin strip on a tablet.
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 p-4 sm:p-6">
      <h1 className="font-heading text-3xl tracking-tight">Notifications</h1>
      <NotificationList />
    </div>
  );
}
