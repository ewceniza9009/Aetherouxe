import { type ReactNode, useEffect, useState } from "react";
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
  Home,
  Briefcase,
  Wallet,
  Activity,
  ShieldCheck,
  MapPin,
  Coffee,
  Coins,
  Landmark,
  Gauge,
  Scale,
  CalendarClock,
  Hourglass,
  Folders,
  AlarmClock,
  Zap,
  LineChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

interface NavItem {
  label: string;
  icon: ReactNode;
  path: string;
  /** "setup" = master/configuration data (roots); "txn" = operational records (leaves) */
  kind: "setup" | "txn";
}

interface NavGroup {
  label: string;
  icon: ReactNode;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    icon: <Home size={16} />,
    items: [
      { label: "Dashboard", icon: <LayoutDashboard size={18} />, path: "/dashboard", kind: "setup" },
    ],
  },
  {
    label: "Property",
    icon: <Building2 size={16} />,
    items: [
      { label: "Projects", icon: <Hammer size={18} />, path: "/projects", kind: "setup" },
      { label: "Buildings", icon: <Building2 size={18} />, path: "/buildings", kind: "setup" },
      { label: "Properties", icon: <MapPin size={18} />, path: "/properties", kind: "setup" },
      { label: "Amenities", icon: <Coffee size={18} />, path: "/amenities", kind: "setup" },
      { label: "Tenants", icon: <Users size={18} />, path: "/tenants", kind: "txn" },
      { label: "Leases", icon: <FileText size={18} />, path: "/leases", kind: "txn" },
      { label: "Rent-to-Own", icon: <KeyRound size={18} />, path: "/rto", kind: "txn" },
      { label: "Title Transfers", icon: <ScrollText size={18} />, path: "/title-transfers", kind: "txn" },
    ],
  },
  {
    label: "Sales",
    icon: <Briefcase size={16} />,
    items: [
      { label: "Agents", icon: <UserCheck size={18} />, path: "/agents", kind: "setup" },
      { label: "Schemes", icon: <ClipboardList size={18} />, path: "/schemes", kind: "setup" },
      { label: "Sales & Schemes", icon: <BadgeDollarSign size={18} />, path: "/sales", kind: "txn" },
      { label: "Commissions", icon: <Coins size={18} />, path: "/commissions", kind: "txn" },
    ],
  },
  {
    label: "Finance",
    icon: <Wallet size={16} />,
    items: [
      { label: "Finance", icon: <Landmark size={18} />, path: "/finance", kind: "setup" },
      { label: "Meters & Billing", icon: <Gauge size={18} />, path: "/meters", kind: "setup" },
      { label: "Collections", icon: <BellRing size={18} />, path: "/collections", kind: "txn" },
      { label: "Collection Cases", icon: <Scale size={18} />, path: "/collections/cases", kind: "txn" },
      { label: "AR Aging", icon: <CalendarClock size={18} />, path: "/collections/ar-aging", kind: "txn" },
      { label: "Commission Aging", icon: <Hourglass size={18} />, path: "/finance/commission-aging", kind: "txn" },
      { label: "Statements", icon: <Inbox size={18} />, path: "/statements", kind: "txn" },
      { label: "Owner P&L", icon: <PieChart size={18} />, path: "/owner-pnl", kind: "txn" },
    ],
  },
  {
    label: "Operations",
    icon: <Activity size={16} />,
    items: [
      { label: "Documents", icon: <Folders size={18} />, path: "/documents", kind: "setup" },
      { label: "Community", icon: <Megaphone size={18} />, path: "/community-posts", kind: "txn" },
      { label: "Service Requests", icon: <Wrench size={18} />, path: "/service-requests", kind: "txn" },
      { label: "Payment Reminders", icon: <AlarmClock size={18} />, path: "/payment-reminders", kind: "txn" },
      { label: "Readings", icon: <Zap size={18} />, path: "/readings", kind: "txn" },
    ],
  },
  {
    label: "Reports",
    icon: <BarChart3 size={16} />,
    items: [
      { label: "Analytics", icon: <LineChart size={18} />, path: "/analytics", kind: "txn" },
    ],
  },
  {
    label: "Admin",
    icon: <ShieldCheck size={16} />,
    items: [
      { label: "Users", icon: <UserCog size={18} />, path: "/users", kind: "setup" },
      { label: "Settings", icon: <Settings size={18} />, path: "/settings", kind: "setup" },
      { label: "Profile", icon: <IdCard size={18} />, path: "/profile", kind: "txn" },
    ],
  },
];

const STORAGE_KEY = "sidebar:openGroups";

function loadOpenState(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    /* ignore */
  }
  return {};
}

const kindDot: Record<NavItem["kind"], string> = {
  setup: "bg-amber-400/80 shadow-[0_0_6px_rgba(251,191,36,0.5)]",
  txn: "bg-cyan-400/70 shadow-[0_0_6px_rgba(34,211,238,0.45)]",
};

function renderItem(
  item: NavItem,
  collapsed: boolean,
  isActivePath: (path: string) => boolean,
) {
  const active = isActivePath(item.path);
  return (
    <Link
      key={item.path}
      to={item.path}
      title={collapsed ? item.label : undefined}
      className={cn(
        "group relative flex items-center rounded-lg text-sm font-medium transition-all duration-200",
        collapsed ? "justify-center p-2.5 mx-1 mb-1 hover:bg-sidebar-accent/50" : "gap-3 px-3 py-2",
        active && collapsed ? "bg-sidebar-primary/20 text-sidebar-primary shadow-sm" : "",
        active && !collapsed ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" : "",
        !active && "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      {active && !collapsed && (
        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
      )}
      <span
        className={cn(
          "relative flex",
          active && !collapsed ? "text-sidebar-primary-foreground" : "",
          active && collapsed ? "text-sidebar-primary drop-shadow-md" : "",
        )}
      >
        {item.icon}
        <span
          className={cn(
            "absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full",
            active && !collapsed ? "bg-sidebar-primary-foreground/70 shadow-none" : kindDot[item.kind],
          )}
        />
      </span>
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();
  const { logout } = useAuth();

  const isActivePath = (path: string) => pathname.startsWith(path);

  const groupHasActive = (group: NavGroup) =>
    group.items.some((i) => isActivePath(i.path));

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const stored = loadOpenState();
    // Default: open all groups the first time; otherwise honor stored state.
    if (Object.keys(stored).length === 0) {
      return Object.fromEntries(navGroups.map((g) => [g.label, true]));
    }
    return stored;
  });

  // Always keep the group containing the current route expanded.
  useEffect(() => {
    const active = navGroups.find((g) => groupHasActive(g));
    if (active && !openGroups[active.label]) {
      setOpenGroups((prev) => ({ ...prev, [active.label]: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [label]: !prev[label] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo + brand */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-sidebar-border",
          collapsed ? "justify-center px-2" : "justify-between px-4",
        )}
      >
        {!collapsed && (
          <div className="flex min-w-0 items-center gap-3">
            <img
              src="/favicon.png"
              alt="Logo"
              className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-primary/40"
            />
            <div className="leading-tight">
              <span className="block truncate font-serif text-base font-bold gold-text">
                Aetherouxe
              </span>
              <span className="block truncate text-[10px] uppercase tracking-widest text-sidebar-foreground/60">
                Estates
              </span>
            </div>
          </div>
        )}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="group relative flex items-center justify-center rounded-lg transition-all"
          >
            <img
              src="/favicon.png"
              alt="Logo"
              className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-primary/40 transition-all group-hover:ring-primary group-hover:shadow-[0_0_10px_rgba(251,191,36,0.3)] group-hover:brightness-110"
            />
            <div className="absolute left-full ml-4 w-max origin-left scale-95 rounded-md border border-sidebar-border bg-sidebar px-3 py-2 text-xs font-medium text-sidebar-foreground opacity-0 shadow-xl transition-all duration-200 group-hover:scale-100 group-hover:opacity-100 pointer-events-none z-50">
              Expand Menu
            </div>
          </button>
        )}
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed((c) => !c)}
            className="shrink-0 text-sidebar-foreground hover:bg-sidebar-accent"
            title="Collapse sidebar"
          >
            <ChevronLeft size={18} />
          </Button>
        )}
      </div>

      {/* Navigation */}
      {!collapsed && (
        <div className="flex items-center justify-between px-5 pb-2 pt-5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
            Menu
          </span>
          <button
            onClick={() => setOpenGroups({})}
            className="text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/40 transition-colors hover:text-sidebar-foreground"
          >
            Collapse All
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav
        className={cn(
          "flex-1 overflow-y-auto px-2",
          collapsed ? "py-4 space-y-2" : "pb-4 space-y-1.5",
        )}
      >
        {navGroups.map((group) => {
          const open = collapsed || openGroups[group.label];
          const hasActive = groupHasActive(group);

          return (
            <div key={group.label} className="space-y-1">
              {!collapsed ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  title={collapsed ? group.label : undefined}
                  className={cn(
                    "group/head flex w-full items-center justify-between rounded-lg px-3 py-2 text-[10px] font-semibold uppercase tracking-widest transition-colors",
                    hasActive
                      ? "text-primary"
                      : "text-sidebar-foreground/40 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground/70",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        hasActive
                          ? "text-primary drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                          : "text-sidebar-foreground/40 group-hover/head:text-sidebar-foreground/70",
                      )}
                    >
                      {group.icon}
                    </span>
                    {group.label}
                  </span>
                  <ChevronDown
                    size={14}
                    className={cn(
                      "transition-transform duration-200",
                      open ? "rotate-0" : "-rotate-90",
                    )}
                  />
                </button>
              ) : (
                group.label !== navGroups[0].label && (
                  <div className="mx-3 my-3 border-t border-sidebar-border/40" />
                )
              )}

              <div
                className={cn(
                  "grid transition-all duration-300 ease-in-out",
                  open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                )}
              >
                  <div className="overflow-hidden">
                   <div className={cn("space-y-0.5", !collapsed && "pl-1")}>
                     {group.items
                       .filter((i) => i.kind === "setup" || collapsed)
                       .map((item) => renderItem(item, collapsed, isActivePath))}
                     {!collapsed &&
                       group.items.some((i) => i.kind === "txn") && (
                         <>
                           {group.items.some((i) => i.kind === "setup") && (
                             <div className="px-3 pt-3 pb-1 text-[9px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
                               Transactions
                             </div>
                           )}
                           {group.items
                             .filter((i) => i.kind === "txn")
                             .map((item) => renderItem(item, collapsed, isActivePath))}
                         </>
                       )}
                   </div>
                 </div>
              </div>
            </div>
          );
        })}
      </nav>


    </aside>
  );
}
