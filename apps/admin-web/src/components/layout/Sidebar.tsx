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
  DollarSign,
  Settings,
  Droplet,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  BellRing,
  Inbox,
  Megaphone,
  Wrench,
  PieChart,
  BarChart3,
  UserCog,
  IdCard,
  ClipboardList,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

interface NavItem {
  label: string;
  icon: ReactNode;
  path: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", icon: <LayoutDashboard size={18} />, path: "/dashboard" },
    ],
  },
  {
    label: "Property",
    items: [
      { label: "Properties", icon: <Building2 size={18} />, path: "/properties" },
      { label: "Buildings", icon: <Building2 size={18} />, path: "/buildings" },
      { label: "Tenants", icon: <Users size={18} />, path: "/tenants" },
      { label: "Leases", icon: <FileText size={18} />, path: "/leases" },
      { label: "Rent-to-Own", icon: <KeyRound size={18} />, path: "/rto" },
      { label: "Title Transfers", icon: <ScrollText size={18} />, path: "/title-transfers" },
      { label: "Projects", icon: <Hammer size={18} />, path: "/projects" },
      { label: "Amenities", icon: <Droplet size={18} />, path: "/amenities" },
    ],
  },
  {
    label: "Sales",
    items: [
      { label: "Sales & Schemes", icon: <BadgeDollarSign size={18} />, path: "/sales" },
      { label: "Schemes", icon: <ClipboardList size={18} />, path: "/schemes" },
      { label: "Agents", icon: <UserCheck size={18} />, path: "/agents" },
      { label: "Commissions", icon: <DollarSign size={18} />, path: "/commissions" },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Finance", icon: <DollarSign size={18} />, path: "/finance" },
      { label: "Collections", icon: <BellRing size={18} />, path: "/collections" },
      { label: "Collection Cases", icon: <ClipboardList size={18} />, path: "/collections/cases" },
      { label: "AR Aging", icon: <BarChart3 size={18} />, path: "/collections/ar-aging" },
      { label: "Commission Aging", icon: <BarChart3 size={18} />, path: "/finance/commission-aging" },
      { label: "Statements", icon: <Inbox size={18} />, path: "/statements" },
      { label: "Meters & Billing", icon: <Droplet size={18} />, path: "/meters" },
      { label: "Owner P&L", icon: <PieChart size={18} />, path: "/owner-pnl" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Community", icon: <Megaphone size={18} />, path: "/community-posts" },
      { label: "Service Requests", icon: <Wrench size={18} />, path: "/service-requests" },
      { label: "Documents", icon: <FileText size={18} />, path: "/documents" },
      { label: "Payment Reminders", icon: <BellRing size={18} />, path: "/payment-reminders" },
      { label: "Readings", icon: <Droplet size={18} />, path: "/readings" },
    ],
  },
  {
    label: "Reports",
    items: [
      { label: "Analytics", icon: <BarChart3 size={18} />, path: "/analytics" },
    ],
  },
  {
    label: "Admin",
    items: [
      { label: "Users", icon: <UserCog size={18} />, path: "/users" },
      { label: "Profile", icon: <IdCard size={18} />, path: "/profile" },
      { label: "Settings", icon: <Settings size={18} />, path: "/settings" },
    ],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const { pathname } = useLocation();
  const { logout } = useAuth();

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isGroupActive = (items: NavItem[]) =>
    items.some((item) => pathname.startsWith(item.path));

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    navGroups.forEach((g) => (next[g.label] = true));
    setOpenGroups(next);
  };

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo */}
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
          onClick={() => {
            if (collapsed) {
              setCollapsed(false);
              expandAll();
            } else {
              setCollapsed(true);
            }
          }}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navGroups.map((group) => {
          const isOpen = collapsed ? false : (openGroups[group.label] ?? isGroupActive(group.items));
          const active = isGroupActive(group.items);

          if (collapsed) {
            return group.items.map((item) => {
              const isActive = pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center justify-center px-2 py-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent",
                  )}
                  title={item.label}
                >
                  {item.icon}
                </Link>
              );
            });
          }

          return (
            <div key={group.label}>
              <button
                onClick={() => toggleGroup(group.label)}
                className={cn(
                  "flex items-center justify-between w-full px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-colors",
                  active
                    ? "text-primary"
                    : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80",
                )}
              >
                <span>{group.label}</span>
                <ChevronDown
                  size={12}
                  className={cn(
                    "transition-transform duration-200",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
              {isOpen && (
                <div className="mt-0.5 space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = pathname.startsWith(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 ml-1 rounded-lg text-sm font-medium transition-colors",
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        )}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-sidebar-border">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
