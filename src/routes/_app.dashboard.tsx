import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, BookMarked, Users, Volume2 } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [{ title: "Dashboard — StudySpace" }],
  }),
});

const stats = [
  { label: "Available Rooms", value: "12", icon: CalendarDays, color: "text-primary" },
  { label: "Quiet Zones", value: "8", icon: Volume2, color: "text-success" },
  { label: "Active Bookings", value: "3", icon: BookMarked, color: "text-warning" },
  { label: "Total Users", value: "1,240", icon: Users, color: "text-chart-2" },
];

const recentBookings = [
  { room: "Quiet Zone A3", date: "May 5, 2026", time: "10:00 - 12:00", status: "Active" as const },
  { room: "Group Room B1", date: "May 4, 2026", time: "14:00 - 16:00", status: "Completed" as const },
  { room: "Quiet Zone C2", date: "May 3, 2026", time: "09:00 - 11:00", status: "Active" as const },
];

function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome back, Jane 👋</h1>
        <p className="mt-1 text-muted-foreground">Here's what's happening with your study spaces.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.08 }}
          >
            <Card className="border-border/50 transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card>
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
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-3 font-medium text-card-foreground">{b.room}</td>
                    <td className="py-3 text-muted-foreground">{b.date}</td>
                    <td className="py-3 text-muted-foreground">{b.time}</td>
                    <td className="py-3">
                      <Badge variant={b.status === "Active" ? "success" : "secondary"}>
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
