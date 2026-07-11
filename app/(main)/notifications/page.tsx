import { NotificationList } from "@/components/notifications/NotificationList";

export const metadata = {
  title: "Notifications — Bitts Attax",
};

export default function NotificationsPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5 p-4 sm:p-6">
      <h1 className="font-heading text-3xl font-extrabold tracking-tight">Notifications</h1>
      <NotificationList />
    </div>
  );
}
