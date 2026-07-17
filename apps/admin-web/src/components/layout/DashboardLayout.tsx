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
      <div className="flex flex-1 flex-col min-h-0">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/70 px-6 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <img src="/favicon.png" alt="Logo" className="h-7 w-7 rounded object-cover" />
            <span className="font-serif text-lg font-bold gold-text">Aetherouxe Estates</span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell role="admin" />
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-background">
          <div className="app-content animate-in fade-in-0 slide-in-from-bottom-2 duration-500 flex min-h-full flex-col p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
