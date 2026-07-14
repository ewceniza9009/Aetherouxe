import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, FileText, Eye, Download, CheckCircle2, Clock, FileSearch, AlertCircle } from "lucide-react";
import {
  useMyDocuments,
  formatDate,
  DOCUMENT_TYPE_STYLES,
  type OwnerDocument,
} from "@/hooks/use-owner-portal";

function DocumentRow({ doc }: { doc: OwnerDocument }) {
  const type = DOCUMENT_TYPE_STYLES[doc.documentType];
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm">{doc.title}</p>
            <Badge variant="outline" className={type.className}>
              {type.label}
            </Badge>
            {doc.isSigned ? (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="h-3 w-3" /> Signed
              </Badge>
            ) : (
              <Badge variant="warning" className="gap-1">
                <Clock className="h-3 w-3" /> Pending
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {doc.propertyName && <span>{doc.propertyName}</span>}
            {doc.propertyName && <span>&middot;</span>}
            <span>Added {formatDate(doc.createdAt)}</span>
            {doc.expiryDate && (
              <>
                <span>&middot;</span>
                <span className={new Date(doc.expiryDate).getTime() < Date.now() ? "text-rose-600 font-medium" : ""}>
                  Expires {formatDate(doc.expiryDate)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {doc.fileUrl ? (
          <Button variant="ghost" size="icon" asChild>
            <a href={doc.fileUrl} target="_blank" rel="noreferrer">
              <Eye className="h-4 w-4" />
            </a>
          </Button>
        ) : (
          <Button variant="ghost" size="icon" disabled>
            <Eye className="h-4 w-4" />
          </Button>
        )}
        {doc.fileUrl && (
          <Button variant="ghost" size="icon" asChild>
            <a href={doc.fileUrl} download>
              <Download className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

function DocSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

export default function DocumentsPage() {
  const navigate = useNavigate();
  const { data: documents, isLoading, isError } = useMyDocuments();

  const signedCount = (documents ?? []).filter((d) => d.isSigned).length;
  const expiringSoon = (documents ?? []).filter(
    (d) => d.expiryDate && new Date(d.expiryDate).getTime() < Date.now() + 1000 * 60 * 60 * 24 * 30
  ).length;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate({ to: "/dashboard" })}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
      </Button>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Document Vault</h1>
        <p className="text-muted-foreground">Access financial reports, legal documents, and statements</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(documents ?? []).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Signed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{signedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{expiringSoon}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Documents</CardTitle>
          <CardDescription>Documents linked to your ownership profile</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <DocSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="font-medium">Unable to load documents</p>
              <p className="text-sm text-muted-foreground">Please try again later.</p>
            </div>
          ) : !documents || documents.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <FileSearch className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-semibold">No documents yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Your statements, deeds, and legal documents will appear here once they are uploaded.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <DocumentRow key={doc.id} doc={doc} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
