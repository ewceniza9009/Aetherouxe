import { type ReactNode } from 'react';
import Sidebar from './Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { useAuth } from '@elite-realty/shared-ui/hooks';
import { ShieldCheck, Sparkles, User, LogOut } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans antialiased">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden min-h-0">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/80 bg-card/80 px-6 backdrop-blur-xl z-20 transition-all">
          <div className="flex items-center gap-3">
            <div className="font-serif text-lg font-bold gold-text tracking-wide flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Aetherouxe Resident Concierge</span>
            </div>
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              VIP Member
            </span>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell role="resident" />

            {user && (
              <div className="flex items-center gap-3 border-l border-border/80 pl-4">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-bold text-foreground">
                    {[user.firstName, user.lastName].filter(Boolean).join(' ') || user.email}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Unit Penthouse 1204
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center text-xs font-black shadow-md shadow-emerald-500/20 border border-white/20">
                  {([user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'R')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <button
                  onClick={logout}
                  className="text-muted-foreground hover:text-rose-500 transition-colors p-1.5 rounded-lg hover:bg-rose-500/10"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-background/50">
          <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in-0 duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
