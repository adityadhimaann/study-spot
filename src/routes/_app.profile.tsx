import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Mail, GraduationCap, Building, Clock, Star, CalendarDays, BookMarked, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profile — StudySpace" }] }),
});

const bookingHistory = [
  { room: "Quiet Zone A3", date: "May 5, 2026", time: "10:00 - 12:00", status: "Upcoming" },
  { room: "Group Room B1", date: "May 4, 2026", time: "14:00 - 16:00", status: "Completed" },
  { room: "Group Room C2", date: "May 3, 2026", time: "09:00 - 11:00", status: "Completed" },
  { room: "Quiet Zone A1", date: "May 1, 2026", time: "16:00 - 18:00", status: "Completed" },
  { room: "Group Room B3", date: "Apr 30, 2026", time: "13:00 - 15:00", status: "Cancelled" },
];

const favoriteRooms = [
  { name: "Quiet Zone A3", visits: 12, rating: 4.9 },
  { name: "Group Room B1", visits: 8, rating: 4.7 },
  { name: "Group Room C2", visits: 5, rating: 4.6 },
];

const usageStats = [
  { label: "Total Hours", value: "128h", icon: Clock },
  { label: "Bookings Made", value: "47", icon: BookMarked },
  { label: "Avg Rating", value: "4.8", icon: Star },
  { label: "This Month", value: "18h", icon: TrendingUp },
];

function ProfilePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Profile</h1>

      <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary via-primary/80 to-primary/50" />
        <CardContent className="p-6 -mt-12">
          <div className="flex items-end gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-card bg-gradient-to-br from-primary to-primary/70 text-2xl font-bold text-primary-foreground shadow-xl">
              JD
            </div>
            <div className="pb-1">
              <h2 className="text-xl font-semibold text-card-foreground">Jane Doe</h2>
              <p className="text-sm text-muted-foreground">Student · Computer Science · 3rd Year</p>
            </div>
            <Button variant="outline" className="ml-auto" size="sm">Edit Profile</Button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              { icon: Mail, label: "Email", value: "jane.doe@university.edu" },
              { icon: GraduationCap, label: "Student ID", value: "STU-2024-0892" },
              { icon: Building, label: "Department", value: "Computer Science" },
              { icon: User, label: "Year", value: "3rd Year" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-xl border border-border/50 p-4 transition-all hover:shadow-sm hover:bg-accent/30">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium text-card-foreground">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {usageStats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="group border-border/50 bg-card/80 backdrop-blur-sm transition-all hover:shadow-lg hover:-translate-y-0.5">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-110">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold text-card-foreground">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Favorite Rooms */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-warning" />
              <h2 className="text-lg font-semibold text-card-foreground">Favorite Rooms</h2>
            </div>
            <div className="space-y-3">
              {favoriteRooms.map((room) => (
                <div key={room.name} className="flex items-center justify-between rounded-xl border border-border/50 p-3 transition-all hover:bg-accent/30">
                  <div>
                    <p className="text-sm font-semibold text-card-foreground">{room.name}</p>
                    <p className="text-xs text-muted-foreground">{room.visits} visits</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-warning text-warning" />
                    <span className="text-sm font-medium text-card-foreground">{room.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Booking Timeline */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-card-foreground">Booking Timeline</h2>
            </div>
            <div className="space-y-0">
              {bookingHistory.map((b, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "h-3 w-3 rounded-full border-2",
                      b.status === "Upcoming" ? "border-primary bg-primary" :
                      b.status === "Cancelled" ? "border-destructive bg-destructive" :
                      "border-success bg-success"
                    )} />
                    {i < bookingHistory.length - 1 && <div className="w-0.5 flex-1 bg-border" />}
                  </div>
                  <div className="pb-5">
                    <p className="text-sm font-semibold text-card-foreground">{b.room}</p>
                    <p className="text-xs text-muted-foreground">{b.date} · {b.time}</p>
                    <Badge variant={b.status === "Upcoming" ? "default" : b.status === "Cancelled" ? "destructive" : "success"} className="mt-1">{b.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
