import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, CalendarDays, BookMarked, Building, TrendingUp, BarChart3, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin Dashboard — StudySpace" }] }),
});

const allBookings = [
  { id: 1, user: "Jane Doe", room: "Group Room B1", date: "May 5, 2026", time: "14:00 - 16:00", status: "Pending" as const },
  { id: 2, user: "John Smith", room: "Quiet Zone A2", date: "May 5, 2026", time: "10:00 - 12:00", status: "Approved" as const },
  { id: 3, user: "Alice Chen", room: "Group Room C2", date: "May 6, 2026", time: "09:00 - 11:00", status: "Pending" as const },
  { id: 4, user: "Bob Wilson", room: "Quiet Zone A1", date: "May 4, 2026", time: "15:00 - 17:00", status: "Rejected" as const },
];

const adminStats = [
  { label: "Total Bookings", value: "342", icon: BookMarked, trend: "+12%", bg: "bg-primary/10", color: "text-primary" },
  { label: "Active Rooms", value: "20", icon: Building, trend: "+2", bg: "bg-success/10", color: "text-success" },
  { label: "Today's Bookings", value: "18", icon: CalendarDays, trend: "+5", bg: "bg-warning/10", color: "text-warning" },
  { label: "Registered Users", value: "1,240", icon: Users, trend: "+48", bg: "bg-chart-2/10", color: "text-chart-2" },
];

const roomUsage = [
  { name: "Group Room B1", usage: 92 },
  { name: "Quiet Zone A3", usage: 87 },
  { name: "Group Room C2", usage: 76 },
  { name: "Quiet Zone A1", usage: 65 },
  { name: "Group Room B3", usage: 54 },
];

const peakHours = [
  { hour: "8am", pct: 20 },
  { hour: "9am", pct: 45 },
  { hour: "10am", pct: 80 },
  { hour: "11am", pct: 95 },
  { hour: "12pm", pct: 60 },
  { hour: "1pm", pct: 40 },
  { hour: "2pm", pct: 75 },
  { hour: "3pm", pct: 90 },
  { hour: "4pm", pct: 85 },
  { hour: "5pm", pct: 50 },
  { hour: "6pm", pct: 30 },
];

function AdminPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Overview of library booking analytics and management.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {adminStats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="group border-border/50 bg-card/80 backdrop-blur-sm transition-all hover:shadow-xl hover:-translate-y-1">
              <CardContent className="flex items-center gap-4 p-5">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-110", stat.bg)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
                </div>
                <div className="flex items-center gap-0.5 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                  <TrendingUp className="h-3 w-3" />{stat.trend}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Most Used Rooms */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm h-full">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-card-foreground">Most Used Rooms</h2>
              </div>
              <div className="space-y-4">
                {roomUsage.map((room, i) => (
                  <div key={room.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-card-foreground">{room.name}</span>
                      <span className="text-muted-foreground">{room.usage}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${room.usage}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className={cn("h-full rounded-full", room.usage > 85 ? "bg-destructive" : room.usage > 60 ? "bg-warning" : "bg-primary")}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Peak Hours */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm h-full">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-card-foreground">Peak Hours</h2>
              </div>
              <div className="flex items-end gap-2 h-40">
                {peakHours.map((h) => (
                  <div key={h.hour} className="flex flex-1 flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${h.pct}%` }}
                      transition={{ duration: 0.6 }}
                      className={cn("w-full rounded-t-md", h.pct > 80 ? "bg-destructive/80" : h.pct > 50 ? "bg-warning/80" : "bg-primary/60")}
                    />
                    <span className="text-[9px] text-muted-foreground whitespace-nowrap">{h.hour}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bookings Table */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-card-foreground">All Bookings</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Room</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Time</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allBookings.map((b) => (
                  <tr key={b.id} className="border-b last:border-0 transition-colors hover:bg-accent/30">
                    <td className="py-3 font-medium text-card-foreground">{b.user}</td>
                    <td className="py-3 text-muted-foreground">{b.room}</td>
                    <td className="py-3 text-muted-foreground">{b.date}</td>
                    <td className="py-3 text-muted-foreground">{b.time}</td>
                    <td className="py-3">
                      <Badge variant={b.status === "Approved" ? "success" : b.status === "Rejected" ? "destructive" : "warning"}>{b.status}</Badge>
                    </td>
                    <td className="py-3">
                      {b.status === "Pending" && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="success" className="transition-transform hover:scale-105">Approve</Button>
                          <Button size="sm" variant="outline" className="transition-transform hover:scale-105">Reject</Button>
                        </div>
                      )}
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
