import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import {
  Bell,
  CheckCheck,
  CreditCard,
  FileText,
  Wrench,
  KeyRound,
  Megaphone,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import {
  useNotifications,
  type AppNotification,
  type NotificationRole,
} from "@/hooks/use-notifications";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function typeIcon(type: string): LucideIcon {
  switch (type) {
    case "payment":
      return CreditCard;
    case "lease":
    case "document":
      return FileText;
    case "maintenance":
      return Wrench;
    case "rto":
      return KeyRound;
    case "community":
      return Megaphone;
    case "alert":
      return AlertTriangle;
    default:
      return Bell;
  }
}

function relativeTime(iso: string): string {
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return "";
  const diff = Date.now() - d;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationBell({ role }: { role: NotificationRole }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const id = user?.id;

  const { notifications, unreadCount, isLoading, sync, markRead, markAllRead } =
    useNotifications(role, {
      ownerId: role === "owner" ? id : undefined,
      tenantId: role === "resident" ? id : undefined,
    });

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(
    null,
  );

  const syncRef = useRef(sync);
  syncRef.current = sync;

  useEffect(() => {
    syncRef.current().catch(() => {});
    const interval = setInterval(() => syncRef.current().catch(() => {}), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setCoords({ top: r.bottom + 8, right: window.innerWidth - r.right });
    } else {
      setCoords(null);
    }
  }, [open]);

  const handleRow = async (n: AppNotification) => {
    if (!n.isRead) {
      try {
        await markRead(n.id);
      } catch {
        /* noop */
      }
    }
    if (n.link) {
      try {
        navigate({ to: n.link as never });
      } catch {
        /* noop */
      }
    }
    setOpen(false);
  };

  const handleMarkAll = async () => {
    try {
      await markAllRead();
    } catch {
      /* noop */
    }
  };

  const panel = open && coords && createPortal(
    <div
      style={{ position: "fixed", top: coords.top, right: coords.right, zIndex: 1000 }}
      className="w-80 overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-elevate"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="font-serif text-sm font-semibold">Notifications</span>
        {unreadCount > 0 && (
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
            {unreadCount} new
          </span>
        )}
      </div>

      <div className="notifications-scroll max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium">You're all caught up</p>
            <p className="text-xs text-muted-foreground">
              No new notifications.
            </p>
          </div>
        ) : (
          notifications.map((n) => {
            const Icon = typeIcon(n.type);
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => handleRow(n)}
                className={cn(
                  "flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-primary/5",
                  !n.isRead && "bg-primary/5",
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    n.isRead
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary/15 text-primary",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{n.title}</p>
                    {!n.isRead && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-destructive" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {n.message}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground/70">
                    {relativeTime(n.createdAt)}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {notifications.length > 0 && (
        <div className="border-t border-border p-2">
          <Button
            variant="ghost"
            className="w-full justify-center text-xs"
            onClick={handleMarkAll}
          >
            <CheckCheck className="mr-2 h-4 w-4" /> Mark all as read
          </Button>
        </div>
      )}
    </div>,
    document.body,
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-foreground/70 transition-colors hover:bg-primary/10 hover:text-primary"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
      {panel}
    </div>
  );
}
