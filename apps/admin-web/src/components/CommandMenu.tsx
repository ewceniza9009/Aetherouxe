import { useEffect, useState, useCallback } from "react";
import { Command } from "cmdk";
import { useNavigate } from "@tanstack/react-router";
import { Search, Loader2, Building, User, LayoutGrid, FolderRoot } from "lucide-react";
import debounce from "lodash.debounce";
import { useAuth } from "@elite-realty/shared-ui/hooks";

interface SearchResult {
  id: string;
  type: 'Tenant' | 'Property' | 'Unit' | 'Project';
  title: string;
  subtitle: string;
  url: string;
}

export function CommandMenu({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchResults = async (q: string) => {
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const payload = await res.json();
        setResults(payload.data || payload || []);
      } else {
        const errText = await res.text();
        console.error("API Search failed:", res.status, errText);
        setResults([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetch = useCallback(debounce(fetchResults, 300), []);

  useEffect(() => {
    debouncedFetch(query);
  }, [query, debouncedFetch]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      } else if (e.key === "Escape" && open) {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'Tenant': return <User className="h-5 w-5 text-primary" />;
      case 'Property': return <Building className="h-5 w-5 text-primary" />;
      case 'Unit': return <LayoutGrid className="h-5 w-5 text-primary" />;
      case 'Project': return <FolderRoot className="h-5 w-5 text-primary" />;
      default: return <Search className="h-5 w-5 text-primary" />;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-background/60 backdrop-blur-md transition-all">
      <div 
        className="fixed inset-0 z-0" 
        onClick={() => onOpenChange(false)} 
      />
      <Command 
        className="relative z-10 w-full max-w-3xl overflow-hidden rounded-2xl border border-primary/20 bg-card/95 backdrop-blur-xl shadow-2xl shadow-primary/10 animate-in fade-in zoom-in-95 duration-300 ease-out"
        shouldFilter={false}
      >
        <div className="flex items-center border-b border-primary/10 px-6 py-4 bg-gradient-to-r from-transparent via-primary/5 to-transparent">
          <Search className="mr-4 h-6 w-6 text-primary shrink-0" />
          <Command.Input
            autoFocus
            placeholder="Search properties, tenants, units... (Cmd+K)"
            className="flex h-12 w-full bg-transparent text-xl font-light outline-none placeholder:text-muted-foreground/70 text-foreground"
            value={query}
            onValueChange={setQuery}
          />
          {loading && <Loader2 className="h-5 w-5 animate-spin text-primary ml-2" />}
        </div>

        <Command.List className="max-h-[60vh] overflow-y-auto p-3">
          <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
            {query.length < 2 ? "Type at least 2 characters to search..." : loading ? "Searching..." : "No results found."}
          </Command.Empty>

          {results.length > 0 && (
            <Command.Group>
              {results.map((result) => (
                <Command.Item
                  key={`${result.type}-${result.id}`}
                  value={`${result.type}-${result.id}`}
                  onSelect={() => {
                    navigate({ to: result.url as any });
                    onOpenChange(false);
                  }}
                  className="group flex cursor-pointer select-none items-center rounded-xl px-4 py-4 text-sm aria-selected:bg-primary/10 aria-selected:text-primary hover:bg-primary/5 transition-all duration-200 border border-transparent aria-selected:border-primary/20 hover:border-primary/10"
                >
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 mr-4 group-hover:scale-110 transition-transform group-aria-selected:scale-110">
                    {getIcon(result.type)}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-foreground text-base tracking-tight">{result.title}</span>
                    <span className="text-xs text-muted-foreground/80 font-medium tracking-wide uppercase">{result.type} <span className="mx-1 text-primary/40">•</span> {result.subtitle}</span>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>
      </Command>
    </div>
  );
}
