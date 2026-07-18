import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationMeta } from "@elite-realty/shared-types";

interface ListPagerProps {
  meta?: PaginationMeta;
  page: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

/**
 * Shared pager for list screens. Renders "Showing X to Y of Z" plus
 * prev/next + page-number buttons driven by the server `meta`. When the
 * list is unpaged (meta absent or totalPages === 1) it renders nothing.
 */
export function ListPager({ meta, page, onPageChange, itemLabel = "items" }: ListPagerProps) {
  if (!meta || meta.totalPages <= 1) return null;

  const from = (page - 1) * meta.limit + 1;
  const to = Math.min(page * meta.limit, meta.total);

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-muted-foreground">
        Showing {from} to {to} of {meta.total} {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {Array.from({ length: meta.totalPages }, (_, i) => (
          <Button
            key={i}
            variant={page === i + 1 ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(i + 1)}
          >
            {i + 1}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= meta.totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
