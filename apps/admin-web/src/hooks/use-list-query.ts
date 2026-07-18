import { useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounce";

export type SortDir = "asc" | "desc";

/**
 * Shared state container for every server-driven grid. Owns the four things a
 * list endpoint needs: a debounced free-text `search`, the current `page`, and
 * the `sort`/`order` for clickable column headers. Filter dropdowns live in the
 * page (they vary per entity) but should call `resetPage()` on change — which
 * `useListQuery` also does automatically whenever the debounced search settles.
 */
export function useListQuery(initialLimit = 20) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<string | undefined>(undefined);
  const [order, setOrder] = useState<SortDir>("desc");
  const debouncedSearch = useDebouncedValue(search, 350);

  // Any time the search term settles, jump back to the first page so the user
  // is never left staring at an empty page 4 of stale results.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const resetPage = () => setPage(1);

  const query = useMemo(
    () => ({
      page,
      limit: initialLimit,
      search: debouncedSearch || undefined,
      sort,
      order,
    }),
    [page, initialLimit, debouncedSearch, sort, order]
  );

  /**
   * Header click handler factory. Pass it the backend column key; it toggles
   * asc/desc and resets paging. Returns props to spread onto a <th>. Merge any
   * extra class names via `cn`-style concatenation on the caller side.
   */
  const sortHeader = (key: string, extraClass = "") => ({
    className: `cursor-pointer select-none whitespace-nowrap ${extraClass}`.trim(),
    onClick: () => {
      if (sort === key) {
        setOrder((o) => (o === "asc" ? "desc" : "asc"));
      } else {
        setSort(key);
        setOrder("desc");
      }
      resetPage();
    },
    "aria-sort": (sort === key
      ? order === "asc"
        ? "ascending"
        : "descending"
      : undefined) as "none" | "ascending" | "descending" | "other" | undefined,
  });

  const sortIndicator = (key: string) =>
    sort === key ? (order === "asc" ? " ▲" : " ▼") : "";

  return {
    search,
    setSearch,
    debouncedSearch,
    page,
    setPage,
    sort,
    setSort,
    order,
    setOrder,
    resetPage,
    query,
    sortHeader,
    sortIndicator,
  };
}

export type ListQuery = ReturnType<typeof useListQuery>;
