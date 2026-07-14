import { type ReactNode } from "react";
import Sidebar from "./Sidebar";
import NotificationBell from "@/components/NotificationBell";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6">
          <div className="font-serif text-lg font-bold gold-text">Aether Private Wealth</div>
          <div className="flex items-center gap-3">
            <NotificationBell role="owner" />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
