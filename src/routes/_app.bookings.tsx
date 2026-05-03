import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, MapPin } from "lucide-react";

export const Route = createFileRoute("/_app/bookings")({
  component: MyBookingsPage,
  head: () => ({
    meta: [{ title: "My Bookings — StudySpace" }],
  }),
});

const bookings = [
  { id: 1, room: "Quiet Zone A3", date: "May 5, 2026", time: "10:00 - 12:00", floor: "1st Floor", status: "Active" as const },
  { id: 2, room: "Group Room B1", date: "May 4, 2026", time: "14:00 - 16:00", floor: "2nd Floor", status: "Completed" as const },
  { id: 3, room: "Group Room C2", date: "May 3, 2026", time: "09:00 - 11:00", floor: "3rd Floor", status: "Active" as const },
  { id: 4, room: "Quiet Zone A1", date: "May 1, 2026", time: "16:00 - 18:00", floor: "1st Floor", status: "Completed" as const },
  { id: 5, room: "Group Room B3", date: "Apr 30, 2026", time: "13:00 - 15:00", floor: "2nd Floor", status: "Completed" as const },
];

function MyBookingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Bookings</h1>
        <p className="mt-1 text-muted-foreground">Manage and review your room reservations.</p>
      </div>

      <div className="space-y-4">
        {bookings.map((b) => (
          <Card key={b.id} className="border-border/50 transition-shadow hover:shadow-md">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">{b.room}</h3>
                  <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{b.date}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{b.time}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{b.floor}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={b.status === "Active" ? "success" : "secondary"}>{b.status}</Badge>
                {b.status === "Active" && (
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
