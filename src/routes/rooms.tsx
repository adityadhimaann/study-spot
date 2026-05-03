import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Volume2, Filter } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/rooms")({
  component: RoomsPage,
  head: () => ({
    meta: [
      { title: "Room Availability — StudySpace" },
      { name: "description", content: "Browse available quiet zones and group study rooms." },
    ],
  }),
});

type RoomType = "all" | "quiet" | "group";

const rooms = [
  { id: 1, name: "Quiet Zone A1", type: "quiet" as const, capacity: 1, available: true, floor: "1st Floor" },
  { id: 2, name: "Quiet Zone A2", type: "quiet" as const, capacity: 1, available: true, floor: "1st Floor" },
  { id: 3, name: "Quiet Zone A3", type: "quiet" as const, capacity: 1, available: false, floor: "1st Floor" },
  { id: 4, name: "Group Room B1", type: "group" as const, capacity: 6, available: true, floor: "2nd Floor" },
  { id: 5, name: "Group Room B2", type: "group" as const, capacity: 8, available: false, floor: "2nd Floor" },
  { id: 6, name: "Group Room B3", type: "group" as const, capacity: 4, available: true, floor: "2nd Floor" },
  { id: 7, name: "Quiet Zone C1", type: "quiet" as const, capacity: 1, available: true, floor: "3rd Floor" },
  { id: 8, name: "Group Room C2", type: "group" as const, capacity: 10, available: true, floor: "3rd Floor" },
];

function RoomsPage() {
  const [filter, setFilter] = useState<RoomType>("all");
  const filtered = filter === "all" ? rooms : rooms.filter((r) => r.type === filter);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Room Availability</h1>
            <p className="mt-1 text-muted-foreground">Browse and book available study spaces.</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {(["all", "quiet", "group"] as RoomType[]).map((t) => (
              <Button
                key={t}
                variant={filter === t ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(t)}
              >
                {t === "all" ? "All" : t === "quiet" ? "Quiet Zones" : "Group Rooms"}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((room, i) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Card className="border-border/50 transition-all duration-200 hover:shadow-lg">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      {room.type === "quiet" ? (
                        <Volume2 className="h-5 w-5 text-primary" />
                      ) : (
                        <Users className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <Badge variant={room.available ? "success" : "secondary"}>
                      {room.available ? "Available" : "Booked"}
                    </Badge>
                  </div>
                  <h3 className="text-base font-semibold text-card-foreground">{room.name}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{room.floor}</p>
                  <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>Capacity: {room.capacity}</span>
                  </div>
                  <Button
                    className="mt-4 w-full"
                    size="sm"
                    disabled={!room.available}
                    asChild={room.available}
                  >
                    {room.available ? (
                      <Link to="/booking" search={{ roomId: room.id }}>Book Now</Link>
                    ) : (
                      "Unavailable"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
