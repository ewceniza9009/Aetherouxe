import { type ReactNode, useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import Sidebar from "./Sidebar";
import { CommandMenu } from "@/components/CommandMenu";
import NotificationBell from "@/components/NotificationBell";
import { useAuth } from "@elite-realty/shared-ui/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "@tanstack/react-router";
import { LogOut, Search } from "lucide-react";
import { useCompanyMeta, reloadSettings } from "@/lib/settings-store";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const companyMeta = useCompanyMeta();
  const [commandOpen, setCommandOpen] = useState(false);
  
  useEffect(() => {
    reloadSettings();
  }, []);
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col min-h-0">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/70 px-6 backdrop-blur-sm">
          <div className="flex items-center flex-1">
            <div className="relative w-full max-w-md hidden md:flex items-center">
              <Search className="absolute left-3 text-muted-foreground h-4 w-4" />
              <button
                onClick={() => setCommandOpen(true)}
                className="w-full bg-background/50 border border-border rounded-full pl-10 pr-4 py-2 text-sm text-left text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all hover:bg-background/80 flex items-center justify-between"
              >
                <span>Search everywhere...</span>
                <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
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
        <main className="flex-1 bg-background flex flex-col min-h-0">
          <div className="app-content animate-in fade-in-0 slide-in-from-bottom-2 duration-500 flex min-h-full flex-col p-6 flex-1 min-h-0 overflow-auto">
            {children}
          </div>
        </main>
      </div>
      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}

