import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, Plus, Clock, CheckCircle2, AlertTriangle } from "lucide-react";

const requests = [
  { id: "SR-0042", type: "HVAC", description: "AC not cooling properly", status: "in_progress", submitted: "Jul 12, 2026", priority: "high" },
  { id: "SR-0041", type: "Plumbing", description: "Kitchen faucet leak", status: "scheduled", submitted: "Jul 8, 2026", priority: "medium" },
  { id: "SR-0039", type: "Electrical", description: "Outlet not working in bedroom", status: "completed", submitted: "Jun 28, 2026", priority: "low" },
  { id: "SR-0035", type: "Appliance", description: "Dishwasher not draining", status: "completed", submitted: "Jun 15, 2026", priority: "medium" },
];

export default function ServiceRequestsPage() {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Service Requests</h1>
          <p className="text-muted-foreground">Submit and track maintenance requests</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" /> New Request
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Submit a Service Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Issue Title</Label>
              <Input id="title" placeholder="e.g., Leaking pipe under sink" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <textarea
                id="desc"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Describe the issue in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={() => { setShowForm(false); setTitle(""); setDescription(""); }}>Submit Request</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Request History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30">
                <div className="flex items-start gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    req.status === "completed" ? "bg-green-100" :
                    req.status === "in_progress" ? "bg-blue-100" : "bg-yellow-100"
                  }`}>
                    <Wrench className={`h-4 w-4 ${
                      req.status === "completed" ? "text-green-600" :
                      req.status === "in_progress" ? "text-blue-600" : "text-yellow-600"
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{req.description}</p>
                      <Badge variant={req.priority === "high" ? "destructive" : req.priority === "medium" ? "warning" : "secondary"}>
                        {req.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{req.id} &middot; {req.type} &middot; Submitted {req.submitted}</p>
                  </div>
                </div>
                <Badge
                  variant={
                    req.status === "completed" ? "success" :
                    req.status === "in_progress" ? "default" : "warning"
                  }
                >
                  {req.status === "completed" ? <CheckCircle2 className="h-3 w-3 mr-1" /> :
                   req.status === "in_progress" ? <Clock className="h-3 w-3 mr-1" /> :
                   <AlertTriangle className="h-3 w-3 mr-1" />}
                  {req.status.replace("_", " ")}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
