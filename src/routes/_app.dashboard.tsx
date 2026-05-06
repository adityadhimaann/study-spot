import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, BookMarked, Users, Volume2, Sparkles, TrendingUp, Clock, Star } from "lucide-react";
import { motion } from "framer-motion";
import { FloorMap } from "@/components/FloorMap";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
  head: () => ({ meta: [{ title: "Dashboard — StudySpace" }] }),
});

type Room = {
  _id: string;
  name: string;
  type: string;
  floor: string;
};

type Booking = {
  _id: string;
  room: { name: string; floor: string };
  date: string;
  slot: string;
  status: string;
};

function DashboardPage() {
  const [user, setUser] = useState<{name?: string} | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {}
    }

    const token = localStorage.getItem("token");

    // Fetch rooms
    fetch("http://localhost:5000/api/rooms")
      .then(res => res.json())
      .then(data => setRooms(Array.isArray(data) ? data : []))
      .catch(console.error);

    // Fetch user bookings
    fetch("http://localhost:5000/api/bookings/my-bookings", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setBookings(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (bookings.length === 0) return;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const active = bookings.find(b => {
      if (b.status === 'cancelled') return false;
      if (b.date !== todayStr) return false;
      try {
        const [start, end] = b.slot.split(' - ');
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        const startDt = new Date(now); startDt.setHours(sh, sm, 0);
        const endDt = new Date(now); endDt.setHours(eh, em, 0);
        return now >= startDt && now < endDt;
      } catch(e) { return false; }
    });
    
    if (active) {
      setActiveBooking(active);
      const interval = setInterval(() => {
        const now2 = new Date();
        const [_, end] = active.slot.split(' - ');
        const [eh, em] = end.split(':').map(Number);
        const endDt = new Date(now2); endDt.setHours(eh, em, 0);
        
        const diffMs = endDt.getTime() - now2.getTime();
        if (diffMs <= 0) {
          setTimeLeft("Session Ended");
          clearInterval(interval);
        } else {
          const hrs = Math.floor(diffMs / 3600000);
          const mins = Math.floor((diffMs % 3600000) / 60000);
          const secs = Math.floor((diffMs % 60000) / 1000);
          setTimeLeft(`${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        }
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setActiveBooking(null);
    }
  }, [bookings]);

  const stats = [
    { label: "Available Rooms", value: rooms.length.toString(), icon: CalendarDays, color: "text-primary", trend: "+0", bg: "bg-primary/10" },
    { label: "Quiet Zones", value: rooms.filter(r => r.type.toLowerCase().includes('quiet')).length.toString(), icon: Volume2, color: "text-success", trend: "+0", bg: "bg-success/10" },
    { label: "Active Bookings", value: bookings.filter(b => b.status === 'upcoming').length.toString(), icon: BookMarked, color: "text-warning", trend: "+0", bg: "bg-warning/10" },
    { label: "Total Bookings", value: bookings.length.toString(), icon: Users, color: "text-chart-2", trend: "+0", bg: "bg-chart-2/10" },
  ];

  const recentBookings = bookings.slice(0, 3).map(b => ({
    id: b._id,
    room: b.room?.name || 'Unknown',
    date: b.date,
    time: b.slot,
    status: b.status === 'upcoming' ? 'Active' : b.status === 'completed' ? 'Completed' : 'Cancelled'
  }));

  const recommended = rooms.slice(0, 3).map(r => ({
    name: r.name,
    reason: r.type.includes('quiet') ? "Great for focused study" : "Perfect for collaboration",
    type: r.type,
    availability: "high"
  }));

  // Generate basic usage data from bookings
  const usageMap: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
  bookings.forEach(b => {
    if (b.status === 'cancelled') return;
    const day = new Date(b.date).toLocaleDateString('en-US', { weekday: 'short' });
    if (usageMap[day] !== undefined) {
      try {
        const [start, end] = b.slot.split(' - ');
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        const diffHours = (eh - sh) + (em - sm) / 60;
        usageMap[day] += diffHours;
      } catch(e) {
        usageMap[day] += 2;
      }
    }
  });
  const usageData = Object.keys(usageMap).map(day => ({ day, hours: usageMap[day] }));
  const maxHours = Math.max(...usageData.map((d) => d.hours), 1); // fallback to 1 to avoid NaN

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.08 }}>
            <Card className="group border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <CardContent className="flex items-center gap-4 p-5">
                <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-110", stat.bg)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
                </div>
                {stat.trend !== "0" && (
                  <div className="ml-auto flex items-center gap-0.5 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                    <TrendingUp className="h-3 w-3" />{stat.trend}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {activeBooking && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="border-primary/50 bg-primary/10 overflow-hidden relative shadow-lg shadow-primary/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between relative z-10 gap-6">
              <div className="flex items-center gap-5 text-center sm:text-left">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary animate-pulse">
                  <Clock className="h-8 w-8" />
                </div>
                <div>
                  <Badge variant="success" className="mb-2">Session In Progress</Badge>
                  <h2 className="text-2xl font-bold text-primary-foreground">{activeBooking.room?.name}</h2>
                  <p className="text-sm text-muted-foreground mt-1">Booked for {activeBooking.slot}</p>
                </div>
              </div>
              <div className="text-center bg-background/50 rounded-2xl p-4 min-w-[200px] border border-border/50">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Time Remaining</p>
                <p className="text-4xl font-mono font-bold text-foreground tracking-tight tabular-nums">{timeLeft || "--:--:--"}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Recommendations */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm h-full">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-card-foreground">Recommended for You</h2>
              </div>
              <div className="space-y-3">
                {recommended.map((r) => (
                  <div key={r.name} className="group flex items-center gap-3 rounded-xl border border-border/50 p-3 transition-all hover:bg-accent/50 hover:shadow-sm cursor-pointer">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      {r.type === "quiet" ? <Volume2 className="h-5 w-5 text-primary" /> : <Users className="h-5 w-5 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-card-foreground">{r.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.reason}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={cn("h-2 w-2 rounded-full animate-pulse", r.availability === "high" ? "bg-success" : "bg-warning")} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Weekly Usage */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="xl:col-span-2">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm h-full">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-card-foreground">Study Hours This Week</h2>
                </div>
                <span className="text-2xl font-bold text-primary">{usageData.reduce((a, b) => a + b.hours, 0).toFixed(1)}h</span>
              </div>
              <div className="flex items-end gap-3 h-40">
                {usageData.map((d) => (
                  <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(d.hours / maxHours) * 100}%` }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                      className="w-full rounded-t-lg bg-gradient-to-t from-primary to-primary/60"
                    />
                    <span className="text-xs text-muted-foreground">{d.day}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Floor Map */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-card-foreground">Live Floor Map</h2>
              <Link to="/floor-map" className="text-sm font-medium text-primary hover:underline">Full view</Link>
            </div>
            <FloorMap onRoomSelect={(id, name) => {
              toast.success(`Selected room ${name} — redirecting to booking...`);
              setTimeout(() => {
                navigate({ to: "/booking", search: { roomId: id } });
              }, 800);
            }} />
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Bookings */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-card-foreground">Recent Bookings</h2>
            <Link to="/bookings" className="text-sm font-medium text-primary hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Room</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Time</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No recent bookings.</td></tr>
                ) : recentBookings.map((b) => (
                  <tr key={b.id} className="border-b last:border-0 transition-colors hover:bg-accent/30">
                    <td className="py-3 font-medium text-card-foreground">{b.room}</td>
                    <td className="py-3 text-muted-foreground">{b.date}</td>
                    <td className="py-3 text-muted-foreground">{b.time}</td>
                    <td className="py-3">
                      <Badge variant={b.status === "Active" ? "success" : b.status === "Cancelled" ? "destructive" : "secondary"}>
                        {b.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
