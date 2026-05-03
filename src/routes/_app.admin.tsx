import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, CalendarDays, BookMarked, Building } from "lucide-react";

export const Route = createFileRoute("/_app/admin")({
  component: AdminPage,
  head: () => ({
    meta: [{ title: "Admin Dashboard — StudySpace" }],
  }),
});

const allBookings = [
  { id: 1, user: "Jane Doe", room: "Group Room B1", date: "May 5, 2026", time: "14:00 - 16:00", status: "Pending" as const },
  { id: 2, user: "John Smith", room: "Quiet Zone A2", date: "May 5, 2026", time: "10:00 - 12:00", status: "Approved" as const },
  { id: 3, user: "Alice Chen", room: "Group Room C2", date: "May 6, 2026", time: "09:00 - 11:00", status: "Pending" as const },
  { id: 4, user: "Bob Wilson", room: "Quiet Zone A1", date: "May 4, 2026", time: "15:00 - 17:00", status: "Rejected" as const },
];

const adminStats = [
  { label: "Total Bookings", value: "342", icon: BookMarked },
  { label: "Active Rooms", value: "20", icon: Building },
  { label: "Today's Bookings", value: "18", icon: CalendarDays },
  { label: "Registered Users", value: "1,240", icon: Users },
];

function AdminPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {adminStats.map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
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
                  <tr key={b.id} className="border-b last:border-0">
                    <td className="py-3 font-medium text-card-foreground">{b.user}</td>
                    <td className="py-3 text-muted-foreground">{b.room}</td>
                    <td className="py-3 text-muted-foreground">{b.date}</td>
                    <td className="py-3 text-muted-foreground">{b.time}</td>
                    <td className="py-3">
                      <Badge variant={
                        b.status === "Approved" ? "success" :
                        b.status === "Rejected" ? "destructive" : "warning"
                      }>
                        {b.status}
                      </Badge>
                    </td>
                    <td className="py-3">
                      {b.status === "Pending" && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="success">Approve</Button>
                          <Button size="sm" variant="outline">Reject</Button>
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
