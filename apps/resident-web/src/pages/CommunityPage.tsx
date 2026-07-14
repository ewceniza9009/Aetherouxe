import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Calendar, MessageSquare, Pin } from "lucide-react";

const announcements = [
  { title: "Pool Maintenance Scheduled", date: "Jul 15, 2026", author: "Property Management", pinned: true, body: "The swimming pool will be closed for routine maintenance on Saturday, July 20th from 8:00 AM to 5:00 PM. We apologize for any inconvenience." },
  { title: "Summer BBQ Event", date: "Jul 10, 2026", author: "Community Committee", pinned: true, body: "Join us for our annual Summer BBQ on July 25th from 2:00 PM - 6:00 PM in the courtyard. Food and drinks will be provided. Please RSVP by July 20th." },
  { title: "Parking Lot Repaving", date: "Jul 5, 2026", author: "Property Management", pinned: false, body: "The parking lot will be repaved July 22-24. All vehicles must be moved to the overflow lot on 5th Street during this time." },
  { title: "New Gym Equipment", date: "Jul 1, 2026", author: "Property Management", pinned: false, body: "We are excited to announce that new cardio machines have been installed in the fitness center." },
];

const boardPosts = [
  { author: "Alice M.", title: "Looking for a running buddy", date: "Jul 14, 2026", replies: 5 },
  { author: "Bob K.", title: "Selling dining table - $200", date: "Jul 12, 2026", replies: 3 },
  { author: "Carol S.", title: "Book club meeting this Friday", date: "Jul 10, 2026", replies: 8 },
];

export default function CommunityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Community</h1>
        <p className="text-muted-foreground">Announcements and resident bulletin board</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Announcements</CardTitle>
              <Badge variant="secondary">3 unread</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {announcements.map((a, i) => (
              <div key={i} className={`p-4 rounded-lg border ${a.pinned ? "bg-primary/5 border-primary/20" : ""}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {a.pinned && <Pin className="h-4 w-4 text-primary" />}
                    <h3 className="font-semibold text-sm">{a.title}</h3>
                  </div>
                  <span className="text-xs text-muted-foreground">{a.date}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{a.body}</p>
                <p className="text-xs text-muted-foreground">Posted by {a.author}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bulletin Board</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Post something..." className="text-sm" />
              <Button size="sm">Post</Button>
            </div>
            <div className="space-y-3">
              {boardPosts.map((post, i) => (
                <div key={i} className="border-b pb-3 last:border-0 last:pb-0">
                  <p className="text-sm font-medium">{post.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {post.author} &middot; {post.date} &middot; {post.replies} replies
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
