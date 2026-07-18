import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

interface GridToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  /** Filter dropdowns / tabs rendered on the right side of the bar. */
  filters?: ReactNode;
  /** Optional primary action (e.g. "New X"). */
  action?: { label: string; onClick: () => void };
}

/**
 * Uniform top bar for every grid: a debounced-search input on the left, filter
 * controls in the middle, and an optional primary action on the right.
 */
export function GridToolbar({
  search,
  onSearchChange,
  placeholder = "Search…",
  filters,
  action,
}: GridToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          className="pl-9 bg-transparent"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      {filters}
      {action && (
        <Button onClick={action.onClick}>
          <Plus className="mr-2 h-4 w-4" /> {action.label}
        </Button>
      )}
    </div>
  );
}

interface GridStateProps {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  onRetry: () => void;
  loadingRows?: number;
  emptyState?: ReactNode;
  children: ReactNode;
}

/**
 * Wraps the table body area and renders the uniform loading / error / empty
 * states so every grid handles them identically.
 */
export function GridState({
  isLoading,
  isError,
  isEmpty,
  onRetry,
  loadingRows = 6,
  emptyState,
  children,
}: GridStateProps) {
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <p className="text-sm text-destructive">Failed to load data.</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading…</span>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <>
        {emptyState ?? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <p className="text-sm text-muted-foreground">No results found.</p>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}
