import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye, FolderOpen, File } from "lucide-react";

const documents = [
  { id: "DOC-001", name: "Q2 2026 Portfolio Statement", type: "PDF", size: "2.4 MB", date: "Jul 5, 2026", category: "Financial", property: "All Properties" },
  { id: "DOC-002", name: "Maple Towers - Annual Report", type: "PDF", size: "4.8 MB", date: "Jun 30, 2026", category: "Report", property: "Maple Towers" },
  { id: "DOC-003", name: "Tax Documents 2025", type: "PDF", size: "6.2 MB", date: "Apr 15, 2026", category: "Tax", property: "All Properties" },
  { id: "DOC-004", name: "Pine Valley Ranch - Site Plan", type: "PDF", size: "8.1 MB", date: "Mar 20, 2026", category: "Development", property: "Pine Valley Ranch" },
  { id: "DOC-005", name: "Oakwood Estates - Deed", type: "PDF", size: "1.2 MB", date: "Jan 10, 2026", category: "Legal", property: "Oakwood Estates" },
  { id: "DOC-006", name: "Riverfront Plaza - Lease Agreement", type: "PDF", size: "3.5 MB", date: "Jan 5, 2026", category: "Lease", property: "Riverfront Plaza" },
];

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Document Vault</h1>
        <p className="text-muted-foreground">Access financial reports, legal documents, and statements</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <File className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{doc.name}</p>
                      <Badge variant="secondary" className="text-xs">{doc.type}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{doc.category}</span>
                      <span>&middot;</span>
                      <span>{doc.property}</span>
                      <span>&middot;</span>
                      <span>{doc.size}</span>
                      <span>&middot;</span>
                      <span>{doc.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Financial Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Legal Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">186 MB</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
