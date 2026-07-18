import { useMemo, useState } from "react";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Plus,
  Megaphone,
  Loader2,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Archive,
  Flag,
  MessageSquare,
} from "lucide-react";
import {
  usePosts,
  useCreatePost,
  useUpdatePost,
  useDeletePost,
  useModeratePost,
  useReports,
  useResolveReport,
  useComments,
  useModerateComment,
  useDeleteComment,
  type CommunityPost,
  type PostType,
  type PostAudience,
  type ModerationStatus,
} from "@/hooks/use-community";

const postTypeMeta: Record<string, { label: string; className: string }> = {
  announcement: {
    label: "Announcement",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  event: { label: "Event", className: "bg-purple-100 text-purple-700 border-purple-200" },
};

const audienceMeta: Record<string, { label: string; className: string }> = {
  all: { label: "All", className: "bg-slate-100 text-slate-700 border-slate-200" },
  building: { label: "Building", className: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  property: { label: "Property", className: "bg-amber-100 text-amber-700 border-amber-200" },
  unit: { label: "Unit", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

const moderationMeta: Record<
  ModerationStatus,
  { label: string; variant: "success" | "warning" | "secondary" }
> = {
  published: { label: "Published", variant: "success" },
  hidden: { label: "Hidden", variant: "warning" },
  archived: { label: "Archived", variant: "secondary" },
};

const META_FALLBACK = {
  label: "Unknown",
  className: "bg-slate-100 text-slate-700 border-slate-200",
};

type PostForm = {
  title: string;
  body: string;
  postType: PostType;
  audience: PostAudience;
  propertyId: string;
  scheduledAt: string;
};

const EMPTY_FORM: PostForm = {
  title: "",
  body: "",
  postType: "announcement",
  audience: "all",
  propertyId: "",
  scheduledAt: "",
};

export default function CommunityPostsPage() {
  return (
    <div className="space-y-6 flex flex-col min-h-[calc(100vh-6rem)]">
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight">Community</h1>
        <p className="text-muted-foreground">
          Manage posts and moderate community content
        </p>
      </div>
      <Tabs defaultValue="posts">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="posts" className="gap-2">
            <Megaphone className="h-4 w-4" /> Posts
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <Flag className="h-4 w-4" /> Reports
          </TabsTrigger>
          <TabsTrigger value="comments" className="gap-2">
            <MessageSquare className="h-4 w-4" /> Comments
          </TabsTrigger>
        </TabsList>
        <TabsContent value="posts">
          <PostsTab />
        </TabsContent>
        <TabsContent value="reports">
          <ReportsTab />
        </TabsContent>
        <TabsContent value="comments">
          <CommentsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PostsTab() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [audienceFilter, setAudienceFilter] = useState<string>("all");
  const [moderationFilter, setModerationFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const query = useMemo(
    () => ({
      page,
      limit: 10,
      postType: typeFilter !== "all" ? (typeFilter as PostType) : undefined,
      audience: audienceFilter !== "all" ? (audienceFilter as PostAudience) : undefined,
      moderationStatus:
        moderationFilter !== "all" ? (moderationFilter as ModerationStatus) : undefined,
    }),
    [page, typeFilter, audienceFilter, moderationFilter]
  );

  const { data, isLoading, isError, refetch } = usePosts(query);
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();
  const moderatePost = useModeratePost();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CommunityPost | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PostForm>(EMPTY_FORM);

  const posts = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (p: CommunityPost) => {
    setEditing(p);
    setForm({
      title: p.title,
      body: p.body,
      postType: p.postType,
      audience: p.audience,
      propertyId: p.propertyId ?? "",
      scheduledAt: p.scheduledAt ? p.scheduledAt.slice(0, 16) : "",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        body: form.body,
        postType: form.postType,
        audience: form.audience,
        propertyId: form.propertyId || undefined,
        scheduledAt: form.scheduledAt || undefined,
        isPublished: form.scheduledAt ? false : true,
      };
      if (editing) {
        await updatePost.mutateAsync({ id: editing.id, ...payload });
      } else {
        await createPost.mutateAsync(payload);
      }
      setOpen(false);
      setForm(EMPTY_FORM);
      setEditing(null);
      refetch();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: CommunityPost) => {
    if (!window.confirm(`Delete "${p.title}"? This also removes its comments and reports.`))
      return;
    await deletePost.mutateAsync(p.id);
  };

  const handleModerate = (p: CommunityPost, status: ModerationStatus) => {
    let reason: string | undefined;
    if (status === "hidden") {
      reason = window.prompt("Reason for hiding this post (optional):") ?? undefined;
    }
    moderatePost.mutate({ id: p.id, moderationStatus: status, reason });
  };

  return (
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
              <SelectTrigger className="w-full sm:w-40">
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
              <SelectTrigger className="w-full sm:w-40">
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
            <Select
              value={moderationFilter}
              onValueChange={(v) => {
                setModerationFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={openCreate} disabled={createPost.isPending}>
              <Plus className="mr-2 h-4 w-4" /> New Post
            </Button>
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
            <div className="rounded-md border scroll-grid">
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
                      Engagement
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium">{p.title}</div>
                        <div className="line-clamp-1 text-xs text-muted-foreground">
                          {p.body}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={(postTypeMeta[p.postType] ?? META_FALLBACK).className}>
                          {(postTypeMeta[p.postType] ?? META_FALLBACK).label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={(audienceMeta[p.audience] ?? META_FALLBACK).className}>
                          {(audienceMeta[p.audience] ?? META_FALLBACK).label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <MessageSquare className="h-3.5 w-3.5" /> {p.commentCount ?? 0}
                        </span>
                        {(p.openReportCount ?? 0) > 0 && (
                          <span className="ml-3 inline-flex items-center gap-1 text-destructive">
                            <Flag className="h-3.5 w-3.5" /> {p.openReportCount}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={moderationMeta[p.moderationStatus].variant}>
                          {moderationMeta[p.moderationStatus].label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {p.moderationStatus !== "published" ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Publish"
                              onClick={() => handleModerate(p, "published")}
                            >
                              <Eye className="h-4 w-4 text-emerald-600" />
                            </Button>
                          ) : (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Hide"
                              onClick={() => handleModerate(p, "hidden")}
                            >
                              <EyeOff className="h-4 w-4 text-amber-600" />
                            </Button>
                          )}
                          {p.moderationStatus !== "archived" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Archive"
                              onClick={() => handleModerate(p, "archived")}
                            >
                              <Archive className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Edit"
                            onClick={() => openEdit(p)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Delete"
                            onClick={() => handleDelete(p)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Post" : "New Post"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update this community post." : "Publish to the community feed."}
            </DialogDescription>
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
            <Button onClick={handleSave} disabled={saving || !form.title || !form.body}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editing ? "Save Changes" : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function ReportsTab() {
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const { data, isLoading, isError } = useReports(
    statusFilter !== "all" ? { status: statusFilter as any } : {}
  );
  const resolveReport = useResolveReport();
  const deletePost = useDeletePost();
  const deleteComment = useDeleteComment();
  const moderatePost = useModeratePost();

  const reports = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" /> Reported Content
          </CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
              <SelectItem value="actioned">Actioned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isError ? (
          <div className="py-12 text-center text-sm text-destructive">
            Failed to load reports.
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Flag className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No reports in this view.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={r.commentId ? "secondary" : "outline"}>
                        {r.commentId ? "Comment" : "Post"}
                      </Badge>
                      <span className="font-medium">{r.reason}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {r.postId ? `On post: ${r.postTitle ?? r.postId}` : ""}
                      {r.commentId ? `On comment: "${r.commentBody ?? ""}"` : ""}
                    </p>
                    {r.details && <p className="text-sm">{r.details}</p>}
                    <p className="text-xs text-muted-foreground">
                      Reported by {r.reporterName ?? "Anonymous"} ·{" "}
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {r.status === "open" ? (
                      <>
                        {r.postId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              moderatePost.mutate({
                                id: r.postId!,
                                moderationStatus: "hidden",
                                reason: `Report: ${r.reason}`,
                              })
                            }
                          >
                            <EyeOff className="mr-1 h-4 w-4" /> Hide Post
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            if (!window.confirm("Remove the reported content?")) return;
                            if (r.commentId) await deleteComment.mutateAsync(r.commentId);
                            else if (r.postId) await deletePost.mutateAsync(r.postId);
                            resolveReport.mutate({ id: r.id, status: "actioned" });
                          }}
                        >
                          <Trash2 className="mr-1 h-4 w-4" /> Remove
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            resolveReport.mutate({ id: r.id, status: "dismissed" })
                          }
                        >
                          Dismiss
                        </Button>
                      </>
                    ) : (
                      <Badge
                        variant={r.status === "dismissed" ? "secondary" : "success"}
                      >
                        {r.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CommentsTab() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data, isLoading, isError } = useComments(
    statusFilter !== "all" ? { moderationStatus: statusFilter as ModerationStatus } : {}
  );
  const moderateComment = useModerateComment();
  const deleteComment = useDeleteComment();

  const comments = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-accent" /> Comments
          </CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="hidden">Hidden</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isError ? (
          <div className="py-12 text-center text-sm text-destructive">
            Failed to load comments.
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No comments found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => (
              <div key={c.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm">{c.body}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.authorName ?? "Unknown"} ·{" "}
                      {c.postTitle ? `on "${c.postTitle}"` : ""} ·{" "}
                      {new Date(c.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={moderationMeta[c.moderationStatus].variant}>
                      {moderationMeta[c.moderationStatus].label}
                    </Badge>
                    {(c.openReportCount ?? 0) > 0 && (
                      <Badge variant="warning">
                        <Flag className="mr-1 h-3 w-3" /> {c.openReportCount}
                      </Badge>
                    )}
                    {c.moderationStatus === "published" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          moderateComment.mutate({ id: c.id, moderationStatus: "hidden" })
                        }
                      >
                        <EyeOff className="mr-1 h-4 w-4" /> Hide
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          moderateComment.mutate({
                            id: c.id,
                            moderationStatus: "published",
                          })
                        }
                      >
                        <Eye className="mr-1 h-4 w-4" /> Publish
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        if (!window.confirm("Delete this comment?")) return;
                        await deleteComment.mutateAsync(c.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
