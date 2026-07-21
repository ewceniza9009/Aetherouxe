import { useState, type ReactNode, useMemo } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import {
  LayoutDashboard,
  CreditCard,
  FileText,
  KeyRound,
  Dumbbell,
  Wrench,
  Users,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Inbox,
  BellRing,
  Droplets,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@elite-realty/shared-ui/components/ui';
import { useAuth } from '@elite-realty/shared-ui/hooks';

interface NavItem {
  label: string;
  icon: ReactNode;
  path: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
  { label: 'Payments', icon: <CreditCard size={20} />, path: '/payments' },
  { label: 'Lease', icon: <FileText size={20} />, path: '/lease' },
  { label: 'Rent-to-Own', icon: <KeyRound size={20} />, path: '/rto' },
  { label: 'Amenities', icon: <Dumbbell size={20} />, path: '/amenities' },
  { label: 'Service Requests', icon: <Wrench size={20} />, path: '/service-requests' },
  { label: 'Community', icon: <Users size={20} />, path: '/community' },
  { label: 'Documents', icon: <FolderOpen size={20} />, path: '/documents' },
  { label: 'Statements', icon: <Inbox size={20} />, path: '/statements' },
  { label: 'Reminders', icon: <BellRing size={20} />, path: '/reminders' },
  { label: 'Utilities', icon: <Droplets size={20} />, path: '/utility-bills' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { pathname } = useLocation();
  const { logout } = useAuth();

  const filteredNavItems = useMemo(() => {
    if (!searchQuery.trim()) return navItems;
    const q = searchQuery.toLowerCase();
    return navItems.filter((item) => item.label.toLowerCase().includes(q));
  }, [searchQuery]);

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      <div className="flex h-14 items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && <span className="font-bold text-lg">Resident Portal</span>}
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
        {filteredNavItems.map((item) => {
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
