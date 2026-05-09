import { createFileRoute, Link } from "@tanstack/react-router";
import { API_URL } from "@/lib/api-config";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Volume2, Filter, Search, Wifi, Star, MapPin, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { LandingNav } from "@/components/LandingNav";

export const Route = createFileRoute("/_app/rooms")({
  component: RoomsPage,
  head: () => ({
    meta: [
      { title: "Room Availability — StudySpace" },
      { name: "description", content: "Browse available quiet zones and group study rooms." },
    ],
  }),
});

type RoomType = "all" | "quiet" | "group";
type Status = "available" | "almost-full" | "booked";

type Room = { _id: string; name: string; type: RoomType; capacity: number; status: Status; floor: string; amenities: string[]; rating: number };

const statusConfig: Record<Status, { badge: "success" | "warning" | "destructive"; label: string; dotClass: string }> = {
  available: { badge: "success", label: "Available", dotClass: "bg-success animate-pulse" },
  "almost-full": { badge: "warning", label: "Almost Full", dotClass: "bg-warning animate-pulse" },
  booked: { badge: "destructive", label: "Booked", dotClass: "bg-destructive" },
};

function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<RoomType>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/api/rooms`)
      .then(res => res.json())
      .then(data => { setRooms(data); setIsLoading(false); })
      .catch(err => { console.error(err); setIsLoading(false); });
  }, []);

  const filtered = rooms
    .filter((r) => filter === "all" || r.type === filter)
    .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search rooms..."
                className="h-9 w-48 rounded-lg border bg-muted/40 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Filter className="h-4 w-4 text-muted-foreground" />
            {(["all", "quiet", "group"] as RoomType[]).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  filter === t ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-accent"
                )}
              >
                {t === "all" ? "All" : t === "quiet" ? "Quiet" : "Group"}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No rooms found</h3>
            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filter criteria.</p>
          </motion.div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence>
              {filtered.map((room, i) => {
                const status = statusConfig[room.status];
                return (
                  <motion.div
                    key={room._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    layout
                  >
                    <Card className="group border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                      <CardContent className="p-5">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-110">
                            {room.type === "quiet" ? <Volume2 className="h-5 w-5 text-primary" /> : <Users className="h-5 w-5 text-primary" />}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={cn("h-2 w-2 rounded-full", status.dotClass)} />
                            <Badge variant={status.badge}>{status.label}</Badge>
                          </div>
                        </div>
                        <h3 className="text-base font-semibold text-card-foreground">{room.name}</h3>
                        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />{room.floor}
                          <span>·</span>
                          <Users className="h-3 w-3" />Cap: {room.capacity}
                        </div>
                        <div className="mt-2 flex items-center gap-1">
                          <Star className="h-3 w-3 fill-warning text-warning" />
                          <span className="text-xs font-medium text-muted-foreground">{room.rating}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {room.amenities.map((a) => (
                            <span key={a} className="inline-flex items-center gap-0.5 rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              {a === "Wi-Fi" && <Wifi className="h-2.5 w-2.5" />}{a}
                            </span>
                          ))}
                        </div>
                        <Button className="mt-4 w-full" size="sm" disabled={room.status === "booked"} asChild={room.status !== "booked"}>
                          {room.status !== "booked" ? (
                            <Link to="/booking" search={{ roomId: room._id }}>Book Now</Link>
                          ) : "Unavailable"}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
