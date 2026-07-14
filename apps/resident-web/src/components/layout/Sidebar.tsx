import { useState, type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
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
  { label: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard" },
  { label: "Payments", icon: <CreditCard size={20} />, path: "/payments" },
  { label: "Lease", icon: <FileText size={20} />, path: "/lease" },
  { label: "Rent-to-Own", icon: <KeyRound size={20} />, path: "/rto" },
  { label: "Amenities", icon: <Dumbbell size={20} />, path: "/amenities" },
  { label: "Service Requests", icon: <Wrench size={20} />, path: "/service-requests" },
  { label: "Community", icon: <Users size={20} />, path: "/community" },
  { label: "Documents", icon: <FolderOpen size={20} />, path: "/documents" },
  { label: "Statements", icon: <Inbox size={20} />, path: "/statements" },
  { label: "Reminders", icon: <BellRing size={20} />, path: "/reminders" },
  { label: "Utilities", icon: <Droplets size={20} />, path: "/utility-bills" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();
  const { logout } = useAuth();

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-16" : "w-64"
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
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
