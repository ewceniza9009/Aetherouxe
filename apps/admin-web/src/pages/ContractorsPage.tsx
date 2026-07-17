import { useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import {
  Plus,
  Search,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Building2,
  HardHat,
  Phone,
  Mail,
  Eye,
  DollarSign,
} from "lucide-react";
import { useContractors, useEngagements } from "@/hooks/use-contractors";
import type { Contractor } from "@/hooks/use-contractors";
import { formatCurrency } from "@/lib/agent-meta";

const columnHelper = createColumnHelper<Contractor>();

export default function ContractorsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [specFilter, setSpecFilter] = useState<string>("all");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [engagementFilter, setEngagementFilter] = useState<string>("");

  const query = useMemo(() => ({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: search || undefined,
    specialization: specFilter !== "all" ? specFilter : undefined,
  }), [pagination.pageIndex, pagination.pageSize, search, specFilter]);

  const { data, isLoading, isError } = useContractors(query);
  const { data: engagements } = useEngagements(
    engagementFilter ? { contractorId: engagementFilter } : {}
  );

  const columns = useMemo(() => [
    columnHelper.accessor("companyName", {
      header: "Company",
      cell: (info) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
            <HardHat className="h-4 w-4 text-primary" />
          </div>
          <span className="font-medium">{info.getValue()}</span>
        </div>
      ),
    }),
    columnHelper.accessor("contactName", {
      header: "Contact",
      cell: (info) => (
        <div>
          <p className="text-sm">{info.getValue()}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Mail className="h-3 w-3" /> {info.row.original.email}
          </p>
          {info.row.original.phone && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" /> {info.row.original.phone}
            </p>
          )}
        </div>
      ),
    }),
    columnHelper.accessor("specialization", {
      header: "Specialization",
      cell: (info) => (
        <Badge variant="secondary">{info.getValue()}</Badge>
      ),
    }),
    columnHelper.accessor("licenseNumber", {
      header: "License",
      cell: (info) => (
        <span className="text-sm text-muted-foreground">
          {info.getValue() || "—"}
        </span>
      ),
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => (
        <Badge variant={info.getValue() === "active" ? "success" : info.getValue() === "suspended" ? "destructive" : "secondary"}>
          {info.getValue()}
        </Badge>
      ),
    }),
    columnHelper.display({
      id: "expand",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            const id = row.original.id;
            setExpandedRow(expandedRow === id ? null : id);
            setEngagementFilter(expandedRow === id ? "" : id);
          }}
        >
          {expandedRow === row.original.id ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      ),
    }),
  ], [expandedRow, navigate]);

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    pageCount: data?.meta?.totalPages ?? -1,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
  });

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Contractors</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive font-medium">Failed to load contractors</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contractors</h1>
          <p className="text-muted-foreground">Manage contractors, engagements, and payments</p>
        </div>
        <Button onClick={() => navigate({ to: "/contractors" })}>
          <Plus className="mr-2 h-4 w-4" /> New Contractor
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contractors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={specFilter} onValueChange={setSpecFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Specializations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specializations</SelectItem>
                <SelectItem value="general_contractor">General Contractor</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="plumbing">Plumbing</SelectItem>
                <SelectItem value="hvac">HVAC</SelectItem>
                <SelectItem value="roofing">Roofing</SelectItem>
                <SelectItem value="concrete">Concrete</SelectItem>
                <SelectItem value="framing">Framing</SelectItem>
                <SelectItem value="painting">Painting</SelectItem>
                <SelectItem value="landscaping">Landscaping</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (data?.data ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="font-medium">No contractors found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {search || specFilter !== "all"
                  ? "Try adjusting your filters."
                  : "Add your first contractor."}
              </p>
            </div>
          ) : (
            <div className="rounded-md border scroll-grid">
              <table className="w-full">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="border-b bg-muted/50">
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                        >
                          {header.isPlaceholder ? null : (
                            <span className="flex items-center gap-1">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </span>
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-b">
                      <td
                        colSpan={row.getVisibleCells().length}
                        className="p-0"
                      >
                        <div
                          className="flex items-center hover:bg-muted/30 cursor-pointer px-4 py-3 transition-colors"
                          onClick={() => navigate({ to: `/contractors/${row.original.id}` })}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <div key={cell.id} className="flex-1 px-0 py-0 text-sm" style={{ minWidth: cell.column.getSize() }}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </div>
                          ))}
                        </div>
                        {expandedRow === row.original.id && engagements && (
                          <div className="bg-muted/20 px-4 py-3 border-t">
                            <p className="text-sm font-medium mb-2">Engagements</p>
                            {engagements.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No engagements found.</p>
                            ) : (
                              <div className="space-y-2">
                                {engagements.map((eng) => (
                                  <div key={eng.id} className="flex items-center justify-between bg-background rounded-md border p-3">
                                    <div>
                                      <p className="text-sm font-medium">{eng.projectName || `Project ${eng.projectId}`}</p>
                                       <p className="text-xs text-muted-foreground">{formatCurrency(Number(eng.contractAmount))} contract</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="text-right">
                                         <p className="text-sm">{formatCurrency(Number(eng.paidAmount))} paid</p>
                                        <p className="text-xs text-muted-foreground">
                                          {eng.contractAmount > 0
                                            ? `${((eng.paidAmount / eng.contractAmount) * 100).toFixed(0)}%`
                                            : "0%"}
                                        </p>
                                      </div>
                                      <Badge variant={
                                        eng.status === "active" ? "default" :
                                        eng.status === "completed" ? "success" :
                                        eng.status === "terminated" ? "destructive" : "secondary"
                                      }>
                                        {eng.status}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && (data?.data ?? []).length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-muted-foreground">
                {data?.meta?.total ?? 0} total contractors
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.pageIndex + 1} of {table.getPageCount()}
                </span>
                <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
