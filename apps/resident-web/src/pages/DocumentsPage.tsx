import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye, File } from "lucide-react";

const documents = [
  { name: "Lease Agreement - Unit 4B", type: "PDF", size: "2.8 MB", date: "Jan 1, 2026", category: "Lease" },
  { name: "Move-In Inspection Report", type: "PDF", size: "1.5 MB", date: "Jan 1, 2026", category: "Inspection" },
  { name: "Building Rules & Regulations", type: "PDF", size: "0.8 MB", date: "Jan 1, 2026", category: "Policy" },
  { name: "Parking Permit Application", type: "PDF", size: "0.3 MB", date: "Jan 5, 2026", category: "Form" },
  { name: "Rent Payment Receipts (2026)", type: "PDF", size: "4.2 MB", date: "Jul 1, 2026", category: "Financial" },
  { name: "Pet Agreement Addendum", type: "PDF", size: "0.5 MB", date: "Feb 1, 2026", category: "Addendum" },
];

export default function ResidentDocumentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground">Access your lease documents and forms</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {documents.map((doc, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors">
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
    </div>
  );
}
