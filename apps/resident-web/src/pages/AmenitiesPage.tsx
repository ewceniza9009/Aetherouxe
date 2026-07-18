import { Card, CardContent, CardHeader, CardTitle } from "@elite-realty/shared-ui/components/ui";
import { Button } from "@elite-realty/shared-ui/components/ui";
import { Badge } from "@elite-realty/shared-ui/components/ui";
import { Calendar, Clock, Dumbbell, Waves, Trees, Tv } from "lucide-react";

const amenities = [
  {
    name: "Fitness Center",
    icon: Dumbbell,
    description: "State-of-the-art gym with cardio and strength equipment",
    capacity: "15 people",
    hours: "5:00 AM - 10:00 PM",
    available: true,
  },
  {
    name: "Swimming Pool",
    icon: Waves,
    description: "Heated outdoor pool with lounge area",
    capacity: "30 people",
    hours: "8:00 AM - 8:00 PM",
    available: true,
  },
  {
    name: "Rooftop Terrace",
    icon: Trees,
    description: "Scenic rooftop with BBQ grills and seating",
    capacity: "25 people",
    hours: "6:00 AM - 10:00 PM",
    available: false,
  },
  {
    name: "Media Room",
    icon: Tv,
    description: "Home theater with 85\" screen and surround sound",
    capacity: "10 people",
    hours: "9:00 AM - 11:00 PM",
    available: true,
  },
];

const bookings = [
  { amenity: "Fitness Center", date: "Jul 15, 2026", time: "7:00 AM - 8:00 AM", status: "confirmed" },
  { amenity: "Swimming Pool", date: "Jul 16, 2026", time: "2:00 PM - 4:00 PM", status: "pending" },
];

export default function AmenitiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Amenities</h1>
        <p className="text-muted-foreground">Browse and book building amenities</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {amenities.map((amenity) => {
          const Icon = amenity.icon;
          return (
            <Card key={amenity.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Icon className="h-8 w-8 text-primary" />
                  <Badge variant={amenity.available ? "success" : "secondary"}>
                    {amenity.available ? "Available" : "Maintenance"}
                  </Badge>
                </div>
                <CardTitle className="text-lg mt-2">{amenity.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{amenity.description}</p>
                <div className="space-y-1 text-xs text-muted-foreground mb-4">
                  <p className="flex items-center gap-1"><Clock className="h-3 w-3" /> {amenity.hours}</p>
                  <p className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Capacity: {amenity.capacity}</p>
                </div>
                <Button className="w-full" disabled={!amenity.available}>Book Now</Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bookings.map((b, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">{b.amenity}</p>
                  <p className="text-xs text-muted-foreground">{b.date} &middot; {b.time}</p>
                </div>
                <Badge variant={b.status === "confirmed" ? "success" : "warning"}>{b.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


