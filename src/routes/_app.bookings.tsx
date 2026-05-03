import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, MapPin, Search, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/bookings")({
  component: MyBookingsPage,
  head: () => ({ meta: [{ title: "My Bookings — StudySpace" }] }),
});

type StatusFilter = "all" | "Active" | "Completed";

const bookings = [
  { id: 1, room: "Quiet Zone A3", date: "May 5, 2026", time: "10:00 - 12:00", floor: "1st Floor", status: "Active" as const },
  { id: 2, room: "Group Room B1", date: "May 4, 2026", time: "14:00 - 16:00", floor: "2nd Floor", status: "Completed" as const },
  { id: 3, room: "Group Room C2", date: "May 3, 2026", time: "09:00 - 11:00", floor: "3rd Floor", status: "Active" as const },
  { id: 4, room: "Quiet Zone A1", date: "May 1, 2026", time: "16:00 - 18:00", floor: "1st Floor", status: "Completed" as const },
  { id: 5, room: "Group Room B3", date: "Apr 30, 2026", time: "13:00 - 15:00", floor: "2nd Floor", status: "Completed" as const },
];

function MyBookingsPage() {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Bookings</h1>
          <p className="mt-1 text-muted-foreground">Manage and review your room reservations.</p>
        </div>
        <div className="flex items-center gap-2">
          {(["all", "Active", "Completed"] as StatusFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                filter === f ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <CalendarDays className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No bookings found</h3>
          <p className="mt-1 text-sm text-muted-foreground">You don't have any {filter !== "all" ? filter.toLowerCase() : ""} bookings yet.</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card className="group border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-110">
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive transition-all"
                        onClick={() => toast.error(`Booking for ${b.room} cancelled`)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
