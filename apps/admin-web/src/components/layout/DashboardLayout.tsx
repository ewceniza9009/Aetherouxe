import { type ReactNode } from "react";
import Sidebar from "./Sidebar";
import NotificationBell from "@/components/NotificationBell";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useCompanyMeta } from "@/lib/settings-store";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const companyMeta = useCompanyMeta();
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col min-h-0">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/70 px-6 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-primary/20 bg-white shadow-sm">
              <img src={companyMeta.logoUrl || "/favicon.png"} alt="Logo" className="h-full w-full object-contain p-[3px]" />
            </div>
            <span className="font-serif text-lg font-bold gold-text ml-1">{companyMeta.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell role="admin" />
            
            {user && (
              <div className="flex items-center gap-4 border-l border-border pl-4 ml-2">
                <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <span className="text-sm font-medium hidden sm:block">
                    {[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email}
                  </span>
                  <Avatar className="h-8 w-8">
                    {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                    <AvatarFallback className="text-xs">
                      {([user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "—").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <button 
                  onClick={logout}
                  className="text-muted-foreground hover:text-red-500 transition-colors p-2 rounded-md hover:bg-red-500/10"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}
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
