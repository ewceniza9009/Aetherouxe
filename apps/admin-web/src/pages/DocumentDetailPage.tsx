import { useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  Link2,
  PenLine,
  CheckCircle2,
  CalendarClock,
} from "lucide-react";
import {
  useDocument,
  useRequestSignature,
  useMarkSignatureSigned,
  type DocumentSignature,
  type SignatureStatus,
} from "@/hooks/use-documents";

const ownerTypeLabel: Record<string, string> = {
  property: "Property",
  unit: "Unit",
  tenant: "Tenant",
  lease: "Lease",
  owner: "Owner",
  rto: "RTO",
  project: "Project",
  vendor: "Vendor",
};

const docTypeLabel: Record<string, string> = {
  lease_agreement: "Lease Agreement",
  contract: "Contract",
  id_proof: "ID Proof",
  invoice: "Invoice",
  statement: "Statement",
  permit: "Permit",
  insurance: "Insurance",
  title_deed: "Title Deed",
  maintenance_record: "Maintenance Record",
  other: "Other",
};

const signatureStatusMeta: Record<SignatureStatus, { label: string; variant: any }> = {
  pending: { label: "Pending", variant: "secondary" },
  sent: { label: "Sent", variant: "warning" },
  signed: { label: "Signed", variant: "success" },
  declined: { label: "Declined", variant: "destructive" },
};

export default function DocumentDetailPage() {
  const { id } = useParams({ from: "/protected/documents/$id" });
  const navigate = useNavigate();
  const { data: doc, isLoading, isError } = useDocument(id);
  const requestSignature = useRequestSignature();
  const markSigned = useMarkSignatureSigned();

  const [sigOpen, setSigOpen] = useState(false);
  const [sigForm, setSigForm] = useState({
    signerName: "",
    signerEmail: "",
    signatureUrl: "",
  });

  if (isError) {
    return (
      <div className="space-y-6">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/documents" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
            <p className="mt-3 font-semibold">Failed to load document</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !doc) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const signatures: DocumentSignature[] = doc.signatures ?? [];

  const handleRequest = async () => {
    await requestSignature.mutateAsync({
      id: doc.id,
      signerName: sigForm.signerName,
      signerEmail: sigForm.signerEmail,
      signatureUrl: sigForm.signatureUrl || undefined,
    });
    setSigOpen(false);
    setSigForm({ signerName: "", signerEmail: "", signatureUrl: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate({ to: "/documents" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl font-bold tracking-tight">{doc.title}</h1>
              <Badge>{docTypeLabel[doc.documentType] ?? doc.documentType}</Badge>
              {doc.isSigned ? (
                <Badge variant="success">Signed</Badge>
              ) : (
                <Badge variant="warning">Unsigned</Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              {ownerTypeLabel[doc.ownerType] ?? doc.ownerType} · {doc.ownerId.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>
        {!doc.isSigned && (
          <Button onClick={() => markSigned.mutateAsync(doc.id)} disabled={markSigned.isPending}>
            {markSigned.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Mark Signed
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {doc.fileUrl ? (
            <a
              href={doc.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium text-accent hover:bg-accent/5"
            >
              <Link2 className="h-4 w-4" />
              {doc.fileName || "Open file"}
            </a>
          ) : (
            <p className="text-sm text-muted-foreground">No file attached.</p>
          )}
          {doc.expiryDate && (
            <div className="flex items-center gap-2 text-sm">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Expires</span>
              <span className="font-medium">
                {new Date(doc.expiryDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="signatures">
        <TabsList>
          <TabsTrigger value="signatures">Signatures</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="signatures" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <PenLine className="h-4 w-4" /> Signatures
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Signature requests for this document
                  </p>
                </div>
                <Button size="sm" onClick={() => setSigOpen(true)}>
                  Request Signature
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {signatures.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No signature requests yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Signer</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Signed At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {signatures.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.signerName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {s.signerEmail}
                        </TableCell>
                        <TableCell>
                          <Badge variant={signatureStatusMeta[s.status].variant}>
                            {signatureStatusMeta[s.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {s.signedAt
                            ? new Date(s.signedAt).toLocaleDateString()
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => setSigOpen(true)}
                disabled={requestSignature.isPending}
              >
                <PenLine className="mr-2 h-4 w-4" /> Request Signature
              </Button>
              {!doc.isSigned && (
                <Button
                  onClick={() => markSigned.mutateAsync(doc.id)}
                  disabled={markSigned.isPending}
                >
                  {markSigned.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Mark Signed
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={sigOpen} onOpenChange={setSigOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Signature</DialogTitle>
            <DialogDescription>Send a signature request for this document.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signerName">Signer Name *</Label>
              <Input
                id="signerName"
                value={sigForm.signerName}
                onChange={(e) => setSigForm((f) => ({ ...f, signerName: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signerEmail">Signer Email *</Label>
              <Input
                id="signerEmail"
                type="email"
                value={sigForm.signerEmail}
                onChange={(e) => setSigForm((f) => ({ ...f, signerEmail: e.target.value }))}
                placeholder="name@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signatureUrl">Signature URL</Label>
              <Input
                id="signatureUrl"
                value={sigForm.signatureUrl}
                onChange={(e) => setSigForm((f) => ({ ...f, signatureUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSigOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRequest}
              disabled={
                requestSignature.isPending || !sigForm.signerName || !sigForm.signerEmail
              }
            >
              {requestSignature.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

