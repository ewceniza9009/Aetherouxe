import { type ReactNode, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  KeyRound,
  Hammer,
  UserCheck,
  BadgeDollarSign,
  Percent,
  DollarSign,
  Settings,
  Droplet,
  ChevronLeft,
  ChevronRight,
  LogOut,
  BellRing,
  Inbox,
  Megaphone,
  Wrench,
  PieChart,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

interface NavItem {
  label: string;
  icon: ReactNode;
  path: string;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    icon: <LayoutDashboard size={20} />,
    path: "/dashboard",
  },
  { label: "Properties", icon: <Building2 size={20} />, path: "/properties" },
  { label: "Tenants", icon: <Users size={20} />, path: "/tenants" },
  { label: "Leases", icon: <FileText size={20} />, path: "/leases" },
  { label: "Rent-to-Own", icon: <KeyRound size={20} />, path: "/rto" },
  { label: "Projects", icon: <Hammer size={20} />, path: "/projects" },
  { label: "Agents", icon: <UserCheck size={20} />, path: "/agents" },
  {
    label: "Commissions",
    icon: <BadgeDollarSign size={20} />,
    path: "/commissions",
  },
  { label: "Collections", icon: <BellRing size={20} />, path: "/collections" },
  { label: "Statements", icon: <Inbox size={20} />, path: "/statements" },
  { label: "Finance", icon: <DollarSign size={20} />, path: "/finance" },
  { label: "Meters & Billing", icon: <Droplet size={20} />, path: "/meters" },
  {
    label: "Community",
    icon: <Megaphone size={20} />,
    path: "/community-posts",
  },
  {
    label: "Service Requests",
    icon: <Wrench size={20} />,
    path: "/service-requests",
  },
  { label: "Documents", icon: <FileText size={20} />, path: "/documents" },
  { label: "Owner P&L", icon: <PieChart size={20} />, path: "/owner-pnl" },
  { label: "Analytics", icon: <BarChart3 size={20} />, path: "/analytics" },
  { label: "Settings", icon: <Settings size={20} />, path: "/settings" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();
  const { logout } = useAuth();

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-14 items-center justify-between px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <img src="/favicon.png" alt="Logo" className="h-8 w-8 rounded-lg object-cover" />
          {!collapsed && (
            <div className="leading-tight">
              <span className="font-serif text-lg font-bold gold-text">
                Aetherouxe
              </span>
              <span className="block text-[10px] uppercase tracking-widest text-sidebar-foreground/60">
                Estates
              </span>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
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
