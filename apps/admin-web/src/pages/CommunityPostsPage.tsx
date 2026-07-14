import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Plus,
  Megaphone,
  Loader2,
} from "lucide-react";
import {
  usePosts,
  useCreatePost,
  type CommunityPost,
  type PostType,
  type PostAudience,
} from "@/hooks/use-community";

const postTypeMeta: Record<PostType, { label: string; className: string }> = {
  announcement: {
    label: "Announcement",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  event: { label: "Event", className: "bg-purple-100 text-purple-700 border-purple-200" },
  maintenance: {
    label: "Maintenance",
    className: "bg-orange-100 text-orange-700 border-orange-200",
  },
  general: { label: "General", className: "bg-slate-100 text-slate-700 border-slate-200" },
  emergency: { label: "Emergency", className: "bg-red-100 text-red-700 border-red-200" },
};

const audienceMeta: Record<PostAudience, { label: string; className: string }> = {
  all: { label: "All", className: "bg-slate-100 text-slate-700 border-slate-200" },
  tenants: { label: "Tenants", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  owners: { label: "Owners", className: "bg-amber-100 text-amber-700 border-amber-200" },
  staff: { label: "Staff", className: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  property: { label: "Property", className: "bg-cyan-100 text-cyan-700 border-cyan-200" },
};

export default function CommunityPostsPage() {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [audienceFilter, setAudienceFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const query = useMemo(
    () => ({
      page,
      limit: 10,
      postType: typeFilter !== "all" ? (typeFilter as PostType) : undefined,
      audience: audienceFilter !== "all" ? (audienceFilter as PostAudience) : undefined,
    }),
    [page, typeFilter, audienceFilter]
  );

  const { data, isLoading, isError, refetch } = usePosts(query);
  const createPost = useCreatePost();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    body: "",
    postType: "announcement" as PostType,
    audience: "all" as PostAudience,
    propertyId: "",
    scheduledAt: "",
  });

  const posts = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createPost.mutateAsync({
        title: form.title,
        body: form.body,
        postType: form.postType,
        audience: form.audience,
        propertyId: form.propertyId || undefined,
        scheduledAt: form.scheduledAt || undefined,
        published: form.scheduledAt ? false : true,
        status: form.scheduledAt ? "scheduled" : "published",
      });
      setOpen(false);
      setForm({
        title: "",
        body: "",
        postType: "announcement",
        audience: "all",
        propertyId: "",
        scheduledAt: "",
      });
      refetch();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Community Posts</h1>
          <p className="text-muted-foreground">Announcements, events and notices</p>
        </div>
        <Button onClick={() => setOpen(true)} disabled={createPost.isPending}>
          <Plus className="mr-2 h-4 w-4" /> New Post
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-accent" /> Posts
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Select
                value={typeFilter}
                onValueChange={(v) => {
                  setTypeFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {(Object.keys(postTypeMeta) as PostType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {postTypeMeta[t].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={audienceFilter}
                onValueChange={(v) => {
                  setAudienceFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Audiences</SelectItem>
                  {(Object.keys(audienceMeta) as PostAudience[]).map((a) => (
                    <SelectItem key={a} value={a}>
                      {audienceMeta[a].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground">Failed to load posts.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <Megaphone className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No posts found.</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Title
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Audience
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Scheduled
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((p: CommunityPost) => (
                      <tr
                        key={p.id}
                        className="border-b hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium">{p.title}</div>
                          <div className="line-clamp-1 text-xs text-muted-foreground">
                            {p.body}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={postTypeMeta[p.postType].className}>
                            {postTypeMeta[p.postType].label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={audienceMeta[p.audience].className}>
                            {audienceMeta[p.audience].label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {p.scheduledAt
                            ? new Date(p.scheduledAt).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {p.published ? (
                            <Badge variant="success">Published</Badge>
                          ) : (
                            <Badge variant="warning">Scheduled</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages} · {meta?.total ?? 0} total
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Post</DialogTitle>
            <DialogDescription>Publish to the community feed.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Post title"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.postType}
                  onValueChange={(v) => setForm((f) => ({ ...f, postType: v as PostType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(postTypeMeta) as PostType[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {postTypeMeta[t].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Audience</Label>
                <Select
                  value={form.audience}
                  onValueChange={(v) => setForm((f) => ({ ...f, audience: v as PostAudience }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(audienceMeta) as PostAudience[]).map((a) => (
                      <SelectItem key={a} value={a}>
                        {audienceMeta[a].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="propertyId">Property ID</Label>
                <Input
                  id="propertyId"
                  value={form.propertyId}
                  onChange={(e) => setForm((f) => ({ ...f, propertyId: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Schedule (optional)</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Body *</Label>
              <Textarea
                id="body"
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Post content..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving || !form.title || !form.body}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
