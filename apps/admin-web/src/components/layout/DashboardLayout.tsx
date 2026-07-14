import { type ReactNode } from "react";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500 p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
