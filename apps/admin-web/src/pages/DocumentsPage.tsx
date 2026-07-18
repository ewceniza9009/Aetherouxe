import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useListQuery } from "@/hooks/use-list-query";
import { GridToolbar, GridState } from "@/components/GridToolbar";
import { ListPager } from "@/components/ListPager";
import { Card, CardContent, CardHeader, CardTitle } from "@elite-realty/shared-ui/components/ui";
import { Button } from "@elite-realty/shared-ui/components/ui";
import { Badge } from "@elite-realty/shared-ui/components/ui";
import { Input } from "@elite-realty/shared-ui/components/ui";
import { Label } from "@elite-realty/shared-ui/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@elite-realty/shared-ui/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@elite-realty/shared-ui/components/ui";
import {
  Plus,
  FileText,
  Loader2,
  Link2,
} from "lucide-react";
import {
  useDocuments,
  useUploadDocument,
  type DocumentVault,
  type DocumentOwnerType,
  type DocumentType,
} from "@/hooks/use-documents";

const ownerTypeMeta: Record<DocumentOwnerType, string> = {
  property: "Property",
  unit: "Unit",
  tenant: "Tenant",
  lease: "Lease",
  owner: "Owner",
  rto: "RTO",
  project: "Project",
  vendor: "Vendor",
};

const docTypeMeta: Record<DocumentType, { label: string; className: string }> = {
  lease_agreement: {
    label: "Lease Agreement",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  contract: {
    label: "Contract",
    className: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  id_proof: {
    label: "ID Proof",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  invoice: {
    label: "Invoice",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  statement: {
    label: "Statement",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  permit: {
    label: "Permit",
    className: "bg-violet-100 text-violet-700 border-violet-200",
  },
  insurance: {
    label: "Insurance",
    className: "bg-cyan-100 text-cyan-700 border-cyan-200",
  },
  title_deed: {
    label: "Title Deed",
    className: "bg-rose-100 text-rose-700 border-rose-200",
  },
  maintenance_record: {
    label: "Maintenance Record",
    className: "bg-orange-100 text-orange-700 border-orange-200",
  },
  other: { label: "Other", className: "bg-slate-100 text-slate-700 border-slate-200" },
};

export default function DocumentsPage() {
  const navigate = useNavigate();
  const listQuery = useListQuery(10);
  const { search, setSearch, page, setPage, resetPage, query, sortHeader, sortIndicator } = listQuery;
  const [ownerTypeFilter, setOwnerTypeFilter] = useState<string>("all");
  const [signedFilter, setSignedFilter] = useState<string>("all");

  const fullQuery = {
    ...query,
    ownerType:
      ownerTypeFilter !== "all" ? (ownerTypeFilter as DocumentOwnerType) : undefined,
    isSigned: signedFilter === "signed" ? true : signedFilter === "unsigned" ? false : undefined,
  };

  const { data, isLoading, isError, refetch } = useDocuments(fullQuery);
  const uploadDocument = useUploadDocument();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    ownerType: "property" as DocumentOwnerType,
    ownerId: "",
    documentType: "contract" as DocumentType,
    title: "",
    fileName: "",
    fileUrl: "",
    expiryDate: "",
  });

  const documents = data?.data ?? [];
  const meta = data?.meta;

  const handleUpload = async () => {
    setSaving(true);
    try {
      await uploadDocument.mutateAsync({
        ownerType: form.ownerType,
        ownerId: form.ownerId,
        documentType: form.documentType,
        title: form.title,
        fileName: form.fileName || undefined,
        fileUrl: form.fileUrl || undefined,
        expiryDate: form.expiryDate || undefined,
        isSigned: false,
      });
      setOpen(false);
      setForm({
        ownerType: "property",
        ownerId: "",
        documentType: "contract",
        title: "",
        fileName: "",
        fileUrl: "",
        expiryDate: "",
      });
      refetch();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 flex flex-col ">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">Centralized document vault</p>
        </div>
        <Button onClick={() => setOpen(true)} disabled={uploadDocument.isPending}>
          <Plus className="mr-2 h-4 w-4" /> Upload Document
        </Button>
      </div>

      <GridToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search documents…"
        action={{ label: "Upload Document", onClick: () => setOpen(true) }}
        filters={
          <>
            <Select
              value={ownerTypeFilter}
              onValueChange={(v) => { setOwnerTypeFilter(v); resetPage(); }}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Owner Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Owner Types</SelectItem>
                {(Object.keys(ownerTypeMeta) as DocumentOwnerType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {ownerTypeMeta[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={signedFilter}
              onValueChange={(v) => { setSignedFilter(v); resetPage(); }}
            >
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Signed" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="signed">Signed</SelectItem>
                <SelectItem value="unsigned">Unsigned</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <GridState
            isLoading={isLoading}
            isError={isError}
            isEmpty={documents.length === 0}
            onRetry={() => refetch()}
          >
            <div className="rounded-md border scroll-grid">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Owner
                    </th>
                    <th {...sortHeader("documentType", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Type{sortIndicator("documentType")}
                    </th>
                    <th {...sortHeader("title", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Title{sortIndicator("title")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      File
                    </th>
                    <th {...sortHeader("expiryDate", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Expiry{sortIndicator("expiryDate")}
                    </th>
                    <th {...sortHeader("isSigned", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Signed{sortIndicator("isSigned")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((d: DocumentVault) => (
                    <tr
                      key={d.id}
                      className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate({ to: `/documents/${d.id}` })}
                    >
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium">{ownerTypeMeta[d.ownerType]}</div>
                        <div className="text-xs text-muted-foreground">
                          {d.ownerId.slice(0, 8).toUpperCase()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={docTypeMeta[d.documentType].className}>
                          {docTypeMeta[d.documentType].label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{d.title}</td>
                      <td className="px-4 py-3 text-sm">
                        {d.fileUrl ? (
                          <a
                            href={d.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-accent hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link2 className="h-3.5 w-3.5" />
                            {d.fileName || "open"}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {d.isSigned ? (
                          <Badge variant="success">Signed</Badge>
                        ) : (
                          <Badge variant="warning">Unsigned</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ListPager meta={meta} page={page} onPageChange={setPage} />
          </GridState>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Add a document to the vault.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Owner Type</Label>
                <Select
                  value={form.ownerType}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, ownerType: v as DocumentOwnerType }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ownerTypeMeta) as DocumentOwnerType[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {ownerTypeMeta[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerId">Owner ID *</Label>
                <Input
                  id="ownerId"
                  value={form.ownerId}
                  onChange={(e) => setForm((f) => ({ ...f, ownerId: e.target.value }))}
                  placeholder="Related entity ID"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select
                  value={form.documentType}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, documentType: v as DocumentType }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(docTypeMeta) as DocumentType[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {docTypeMeta[t].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Document title"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fileName">File Name</Label>
                <Input
                  id="fileName"
                  value={form.fileName}
                  onChange={(e) => setForm((f) => ({ ...f, fileName: e.target.value }))}
                  placeholder="report.pdf"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fileUrl">File URL</Label>
              <Input
                id="fileUrl"
                value={form.fileUrl}
                onChange={(e) => setForm((f) => ({ ...f, fileUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={saving || !form.ownerId || !form.title}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


