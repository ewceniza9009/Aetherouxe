import { useState, type ReactNode, useMemo } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Building2,
  Hammer,
  DollarSign,
  FileText,
  PieChart,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@elite-realty/shared-ui/components/ui';
import { useAuth } from '@elite-realty/shared-ui/hooks';

interface NavItem {
  label: string;
  icon: ReactNode;
  path: string;
  developerOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
  { label: 'Properties', icon: <Building2 size={20} />, path: '/properties' },
  { label: 'Projects', icon: <Hammer size={20} />, path: '/projects', developerOnly: true },
  { label: 'Financials', icon: <DollarSign size={20} />, path: '/financials' },
  { label: 'P&L', icon: <PieChart size={20} />, path: '/pnl' },
  { label: 'Documents', icon: <FileText size={20} />, path: '/documents' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { pathname } = useLocation();
  const { logout, user } = useAuth();
  const isDeveloper = user?.isDeveloper ?? false;

  const visibleNavItems = useMemo(() => {
    const filtered = navItems.filter((item) => !item.developerOnly || isDeveloper);
    if (!searchQuery.trim()) return filtered;
    const q = searchQuery.toLowerCase();
    return filtered.filter((item) => item.label.toLowerCase().includes(q));
  }, [searchQuery, isDeveloper]);

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      <div className="flex h-14 items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && <span className="font-bold text-lg">Owner Portal</span>}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      {!collapsed && (
        <div className="relative px-3 pt-3 pb-1">
          <Search className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sidebar-foreground/40" />
          <input
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 rounded-md border border-sidebar-border bg-sidebar-accent/30 pl-8 pr-3 text-xs text-sidebar-foreground placeholder:text-sidebar-foreground/30 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
          />
        </div>
      )}

      <nav className="flex-1 py-2 space-y-1 px-2">
        {visibleNavItems.map((item) => {
          const isActive = pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-sidebar-border">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
