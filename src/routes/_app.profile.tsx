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

import { toast } from "sonner";
import { useState, useEffect } from "react";

type UserProfile = {
  id?: string;
  name?: string;
  email?: string;
  department?: string;
  year?: string;
  studentId?: string;
};

type Booking = {
  _id: string;
  room: { name: string; floor: string; rating: number };
  date: string;
  slot: string;
  status: string;
};

function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UserProfile>({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("http://localhost:5000/api/auth/me", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setEditForm(data);
        localStorage.setItem("user", JSON.stringify({ ...data, id: data._id }));
      })
      .catch(console.error);

    fetch("http://localhost:5000/api/bookings/my-bookings", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setBookings(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const handleSaveProfile = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setIsEditing(false);
        toast.success("Profile updated successfully!");
      } else {
        toast.error("Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred.");
    }
  };

  const name = user?.name || "Student";
  const email = user?.email || "";
  const department = user?.department || "Unassigned";
  const year = user?.year || "1st Year";
  const studentId = user?.studentId || "STU-NEW";

  const initials = name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

  const totalHours = bookings.length * 2;
  const bookingsMade = bookings.length;
  
  // Calculate favorite rooms
  const roomVisits: Record<string, { visits: number, rating: number }> = {};
  bookings.forEach(b => {
    if (b.room) {
      if (!roomVisits[b.room.name]) roomVisits[b.room.name] = { visits: 0, rating: b.room.rating || 4.5 };
      roomVisits[b.room.name].visits += 1;
    }
  });
  const favoriteRooms = Object.keys(roomVisits)
    .map(name => ({ name, visits: roomVisits[name].visits, rating: roomVisits[name].rating }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 3);

  const usageStats = [
    { label: "Total Hours", value: `${totalHours}h`, icon: Clock },
    { label: "Bookings Made", value: bookingsMade.toString(), icon: BookMarked },
    { label: "Avg Rating", value: "4.8", icon: Star },
    { label: "This Month", value: `${bookings.filter(b => new Date(b.date).getMonth() === new Date().getMonth()).length * 2}h`, icon: TrendingUp },
  ];
  // removed old useeffect block

  return (
    <div className="space-y-6">
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary via-primary/80 to-primary/50" />
        <CardContent className="p-6 -mt-12">
          <div className="flex items-end gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-card bg-gradient-to-br from-primary to-primary/70 text-2xl font-bold text-primary-foreground shadow-xl uppercase">
              {initials}
            </div>
            <div className="pb-1">
              <h2 className="text-xl font-semibold text-card-foreground">{name}</h2>
              <p className="text-sm text-muted-foreground">Student · {department} · {year}</p>
            </div>
            {isEditing ? (
              <div className="ml-auto flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button size="sm" onClick={handleSaveProfile}>Save</Button>
              </div>
            ) : (
              <Button variant="outline" className="ml-auto" size="sm" onClick={() => setIsEditing(true)}>Edit Profile</Button>
            )}
          </div>

          {isEditing ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Full Name</label>
                <input type="text" value={editForm.name || ""} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full rounded-md border p-2 text-sm bg-background" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Student ID</label>
                <input type="text" value={editForm.studentId || ""} onChange={e => setEditForm({...editForm, studentId: e.target.value})} className="w-full rounded-md border p-2 text-sm bg-background" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Department</label>
                <input type="text" value={editForm.department || ""} onChange={e => setEditForm({...editForm, department: e.target.value})} className="w-full rounded-md border p-2 text-sm bg-background" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Year</label>
                <input type="text" value={editForm.year || ""} onChange={e => setEditForm({...editForm, year: e.target.value})} className="w-full rounded-md border p-2 text-sm bg-background" />
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                { icon: Mail, label: "Email", value: email },
                { icon: GraduationCap, label: "Student ID", value: studentId },
                { icon: Building, label: "Department", value: department },
                { icon: User, label: "Year", value: year },
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
          )}
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
              {bookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent bookings found.</p>
              ) : bookings.slice(0, 5).map((b, i) => (
                <div key={b._id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "h-3 w-3 rounded-full border-2",
                      b.status === "upcoming" ? "border-primary bg-primary" :
                      b.status === "cancelled" ? "border-destructive bg-destructive" :
                      "border-success bg-success"
                    )} />
                    {i < Math.min(bookings.length, 5) - 1 && <div className="w-0.5 flex-1 bg-border" />}
                  </div>
                  <div className="pb-5">
                    <p className="text-sm font-semibold text-card-foreground">{b.room?.name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{b.date} · {b.slot}</p>
                    <Badge variant={b.status === "upcoming" ? "default" : b.status === "cancelled" ? "destructive" : "success"} className="mt-1">
                      {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                    </Badge>
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
