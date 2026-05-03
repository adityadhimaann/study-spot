import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, BookMarked, Users, Volume2, Sparkles, TrendingUp, Clock, Star } from "lucide-react";
import { motion } from "framer-motion";
import { FloorMap } from "@/components/FloorMap";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
  head: () => ({ meta: [{ title: "Dashboard — StudySpace" }] }),
});

const stats = [
  { label: "Available Rooms", value: "12", icon: CalendarDays, color: "text-primary", trend: "+2", bg: "bg-primary/10" },
  { label: "Quiet Zones", value: "8", icon: Volume2, color: "text-success", trend: "+1", bg: "bg-success/10" },
  { label: "Active Bookings", value: "3", icon: BookMarked, color: "text-warning", trend: "0", bg: "bg-warning/10" },
  { label: "Total Users", value: "1,240", icon: Users, color: "text-chart-2", trend: "+48", bg: "bg-chart-2/10" },
];

const recentBookings = [
  { room: "Quiet Zone A3", date: "May 5, 2026", time: "10:00 - 12:00", status: "Active" as const },
  { room: "Group Room B1", date: "May 4, 2026", time: "14:00 - 16:00", status: "Completed" as const },
  { room: "Quiet Zone C2", date: "May 3, 2026", time: "09:00 - 11:00", status: "Active" as const },
];

const recommended = [
  { name: "Quiet Zone A1", reason: "Based on your quiet study preference", type: "quiet", availability: "high" },
  { name: "Group Room C2", reason: "Great for your team project", type: "group", availability: "medium" },
  { name: "Quiet Zone C1", reason: "Less crowded at your preferred time", type: "quiet", availability: "high" },
];

const usageData = [
  { day: "Mon", hours: 3 },
  { day: "Tue", hours: 5 },
  { day: "Wed", hours: 2 },
  { day: "Thu", hours: 6 },
  { day: "Fri", hours: 4 },
  { day: "Sat", hours: 7 },
  { day: "Sun", hours: 1 },
];
const maxHours = Math.max(...usageData.map((d) => d.hours));

function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome back, Jane 👋</h1>
        <p className="mt-1 text-muted-foreground">Here's what's happening with your study spaces.</p>
      </div>

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
                <span className="text-2xl font-bold text-primary">{usageData.reduce((a, b) => a + b.hours, 0)}h</span>
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
            <FloorMap />
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
                {recentBookings.map((b, i) => (
                  <tr key={i} className="border-b last:border-0 transition-colors hover:bg-accent/30">
                    <td className="py-3 font-medium text-card-foreground">{b.room}</td>
                    <td className="py-3 text-muted-foreground">{b.date}</td>
                    <td className="py-3 text-muted-foreground">{b.time}</td>
                    <td className="py-3"><Badge variant={b.status === "Active" ? "success" : "secondary"}>{b.status}</Badge></td>
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
