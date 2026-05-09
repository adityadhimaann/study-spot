import { createFileRoute, redirect } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, CalendarDays, BookMarked, Building, TrendingUp, BarChart3, Clock, LogOut, Bell, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AdminSidebar } from "@/components/AdminSidebar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { FloorMap } from "@/components/FloorMap";
import { AdminStorage } from "@/components/AdminStorage";

import { API_URL } from "@/lib/api-config";

export const Route = createFileRoute("/admin")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw redirect({ to: "/admin-login" });
      const user = JSON.parse(userStr);
      if (user.role !== "admin") throw redirect({ to: "/admin-login" });
    }
  },
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin Dashboard — StudySpace" }] }),
});

type Booking = {
  _id: string;
  user: { name: string; email: string };
  room: { name: string; type: string; floor: string };
  date: string;
  slot: string;
  status: string;
};

type StatsData = {
  adminStats: { label: string; value: string }[];
  roomUsage: { name: string; usage: number }[];
  peakHours: { hour: string; pct: number }[];
};

type UserProfile = {
  _id: string;
  name: string;
  email: string;
  department: string;
  year: string;
  studentId: string;
  totalBookings: number;
};

type Room = {
  _id: string;
  name: string;
  type: string;
  capacity: number;
  floor: string;
  status: string;
};

function AdminPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "rooms" | "users" | "feedback" | "storage">("dashboard");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [feedbackItems, setFeedbackItems] = useState<any[]>([]);
  const [newRoom, setNewRoom] = useState({ name: '', type: 'quiet', capacity: 1, floor: '1st', amenities: 'Wi-Fi' });
  const [showNotifications, setShowNotifications] = useState(false);

  const upcomingBookings = bookings.filter(b => b.status === "upcoming");

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    fetch(`${API_URL}/api/admin/bookings`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setBookings(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));

    fetch(`${API_URL}/api/admin/stats`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setStatsData(data))
      .catch(err => console.error(err));

    fetch(`${API_URL}/api/admin/users`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
      
    fetch(`${API_URL}/api/rooms`)
      .then(res => res.json())
      .then(data => setRooms(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));

    fetch(`${API_URL}/api/admin/feedback`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setFeedbackItems(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  }, []);

  const adminStatsMap = statsData ? [
    { label: "Total Bookings", value: statsData.adminStats.find(s => s.label === "Total Bookings")?.value || "0", icon: BookMarked, trend: "+12%", bg: "bg-primary/10", color: "text-primary" },
    { label: "Active Rooms", value: statsData.adminStats.find(s => s.label === "Active Rooms")?.value || "0", icon: Building, trend: "+2", bg: "bg-success/10", color: "text-success" },
    { label: "Today's Bookings", value: statsData.adminStats.find(s => s.label === "Today's Bookings")?.value || "0", icon: CalendarDays, trend: "+5", bg: "bg-warning/10", color: "text-warning" },
    { label: "Registered Users", value: statsData.adminStats.find(s => s.label === "Registered Users")?.value || "0", icon: Users, trend: "+48", bg: "bg-chart-2/10", color: "text-chart-2" },
  ] : [];

  const roomUsage = statsData?.roomUsage || [];
  const peakHours = statsData?.peakHours || [];

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b._id === id ? { ...b, status } : b));
        toast.success(`Booking successfully ${status === 'completed' ? 'approved' : 'rejected'}!`);
      } else {
        toast.error("Failed to update booking status.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while updating the booking.");
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/admin/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ ...newRoom, amenities: newRoom.amenities.split(',').map(s=>s.trim()) })
      });
      if (res.ok) {
        const room = await res.json();
        setRooms([...rooms, room]);
        toast.success("Room created successfully!");
        setNewRoom({ name: '', type: 'quiet', capacity: 1, floor: '1st', amenities: 'Wi-Fi' });
      } else {
        toast.error("Failed to create room");
      }
    } catch(err) { toast.error("Error creating room"); }
  };

  const handleDeleteRoom = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/rooms/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        setRooms(rooms.filter(r => r._id !== id));
        toast.success("Room deleted!");
      }
    } catch(err) {}
  };

  const handleResolveFeedback = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'resolved' ? 'new' : 'resolved';
      const res = await fetch(`${API_URL}/api/admin/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setFeedbackItems(feedbackItems.map(f => f._id === id ? { ...f, status: newStatus } : f));
        toast.success(`Feedback marked as ${newStatus}`);
      }
    } catch(err) {}
  };

  if (!statsData) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading admin data...</div>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab as any} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background/80 px-6 backdrop-blur-xl">
          <div className="flex flex-col">
            <h1 className="text-lg font-bold leading-tight text-foreground">
              {activeTab === 'dashboard' ? 'Admin Dashboard' : 
               activeTab === 'rooms' ? 'Room Management' : 
               activeTab === 'users' ? 'Student Directory' : 
               activeTab === 'storage' ? 'Cloud Storage' : 'User Feedback'}
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              {activeTab === 'dashboard' ? 'Overview of library booking analytics and management.' : 
               activeTab === 'rooms' ? 'Manage rooms and their physical map layout.' : 
               activeTab === 'users' ? 'View registered students and their booking history.' : 
               activeTab === 'storage' ? 'Manage library assets and room images.' : 'Review and respond to feedback reports.'}
            </p>
          </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="relative cursor-pointer hover:bg-accent p-2 rounded-full transition-colors" onClick={() => setShowNotifications(!showNotifications)}>
              <Bell className="h-5 w-5 text-muted-foreground" />
              {upcomingBookings.length > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                </span>
              )}
            </div>
            
            <AnimatePresence>
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 rounded-xl border border-border/50 bg-card/95 p-4 shadow-2xl backdrop-blur-xl z-50 max-h-[400px] overflow-y-auto"
                  >
                    <div className="mb-3 flex items-center justify-between border-b pb-2">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        Notifications <Badge variant="secondary" className="px-1.5 py-0 min-w-[20px] text-center">{upcomingBookings.length}</Badge>
                      </h3>
                    </div>
                    {upcomingBookings.length === 0 ? (
                      <div className="py-6 text-center flex flex-col items-center text-muted-foreground">
                        <CheckCircle className="h-8 w-8 mb-2 opacity-20" />
                        <p className="text-sm">You're all caught up!</p>
                        <p className="text-xs">No pending requests.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {upcomingBookings.map(b => (
                          <div key={b._id} className="rounded-lg border bg-background/50 p-3 text-sm">
                            <div className="flex justify-between items-start mb-1.5">
                              <span className="font-semibold">{b.user?.name || "Student"}</span>
                              <Badge variant="destructive" className="text-[9px] px-1 py-0">NEW</Badge>
                            </div>
                            <p className="text-muted-foreground text-xs mb-2">Requested <span className="font-medium text-foreground">{b.room?.name}</span> for {b.date} at {b.slot}.</p>
                            <div className="flex gap-2">
                              <Button size="sm" variant="success" className="h-7 text-xs flex-1" onClick={() => { handleUpdateStatus(b._id, 'completed'); setShowNotifications(false); }}>Approve</Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => { handleUpdateStatus(b._id, 'cancelled'); setShowNotifications(false); }}>Reject</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); window.location.href = "/admin-login"; }}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-8 max-w-7xl mx-auto w-full">
      
      {activeTab === 'dashboard' && (
      <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {adminStatsMap.map((stat, i) => (
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
          <div className="overflow-x-auto overflow-y-auto max-h-[400px]">
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
                {bookings.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No bookings found.</td></tr>
                ) : bookings.map((b) => (
                  <tr key={b._id} className="border-b last:border-0 transition-colors hover:bg-accent/30">
                    <td className="py-3 font-medium text-card-foreground">
                      {b.user?.name || "Unknown User"} <span className="block text-xs text-muted-foreground">{b.user?.email}</span>
                    </td>
                    <td className="py-3 text-muted-foreground">{b.room?.name || "Unknown Room"}</td>
                    <td className="py-3 text-muted-foreground">{b.date}</td>
                    <td className="py-3 text-muted-foreground">{b.slot}</td>
                    <td className="py-3 flex items-center gap-2">
                      <Badge variant={b.status === "completed" ? "success" : b.status === "cancelled" ? "destructive" : "warning"}>
                        {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                      </Badge>
                      {b.status === "upcoming" && (
                        <Badge variant="destructive" className="animate-pulse text-[9px] px-1.5 py-0">NEW</Badge>
                      )}
                    </td>
                    <td className="py-3">
                      {b.status === "upcoming" && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="success" onClick={() => handleUpdateStatus(b._id, 'completed')} className="transition-transform hover:scale-105">Approve</Button>
                          <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(b._id, 'cancelled')} className="transition-transform hover:scale-105">Reject</Button>
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
      </>
      )}

      {activeTab === 'rooms' && (
        <div className="space-y-6">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-card-foreground mb-4">Create New Room</h2>
              <form onSubmit={handleCreateRoom} className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Name</label>
                  <input required value={newRoom.name} onChange={e=>setNewRoom({...newRoom, name: e.target.value})} className="w-full rounded-md border p-2 text-sm bg-background" placeholder="Room 101" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Type</label>
                  <select value={newRoom.type} onChange={e=>setNewRoom({...newRoom, type: e.target.value})} className="w-full rounded-md border p-2 text-sm bg-background">
                    <option value="quiet">Quiet Zone</option>
                    <option value="group">Group Room</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Capacity</label>
                  <input required type="number" min="1" value={newRoom.capacity} onChange={e=>setNewRoom({...newRoom, capacity: parseInt(e.target.value)})} className="w-full rounded-md border p-2 text-sm bg-background" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Amenities (comma separated)</label>
                  <input value={newRoom.amenities} onChange={e=>setNewRoom({...newRoom, amenities: e.target.value})} className="w-full rounded-md border p-2 text-sm bg-background" />
                </div>
                <Button type="submit" className="w-full">Create Room</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-card-foreground mb-4">Live Map Editor</h2>
              <p className="text-sm text-muted-foreground mb-4">Click any room on the map to edit its coordinates and dimensions.</p>
              <FloorMap isAdmin={true} />
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-card-foreground mb-4">Manage Rooms</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map(room => (
                  <div key={room._id} className="flex flex-col justify-between border rounded-xl p-4 bg-background">
                    <div>
                      <h3 className="font-semibold text-foreground">{room.name} <Badge variant="outline" className="ml-2">{room.type}</Badge></h3>
                      <p className="text-sm text-muted-foreground mt-1">Cap: {room.capacity} · Floor: {room.floor}</p>
                    </div>
                    <Button variant="destructive" size="sm" className="mt-4" onClick={() => handleDeleteRoom(room._id)}>Delete Room</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'users' && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-card-foreground">Student Directory</h2>
                <p className="text-sm text-muted-foreground">Manage and view all registered students.</p>
              </div>
              <input
                type="text"
                placeholder="Search by name, email, ID..."
                className="w-full sm:w-64 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Student ID</th>
                    <th className="pb-3 font-medium">Dept / Year</th>
                    <th className="pb-3 font-medium">Total Bookings</th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .filter((u) => {
                      const s = studentSearch.toLowerCase();
                      return (
                        u.name.toLowerCase().includes(s) ||
                        u.email.toLowerCase().includes(s) ||
                        u.studentId.toLowerCase().includes(s) ||
                        u.department.toLowerCase().includes(s) ||
                        u.year.toLowerCase().includes(s)
                      );
                    })
                    .map((u) => (
                    <tr key={u._id} className="border-b last:border-0 transition-colors hover:bg-accent/30">
                      <td className="py-3 font-medium text-card-foreground">{u.name}</td>
                      <td className="py-3 text-muted-foreground">{u.email}</td>
                      <td className="py-3 text-muted-foreground"><Badge variant="outline">{u.studentId}</Badge></td>
                      <td className="py-3 text-muted-foreground">{u.department} • {u.year}</td>
                      <td className="py-3 font-medium text-card-foreground">{u.totalBookings}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'feedback' && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">Student Feedback & Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {feedbackItems.length === 0 ? (
                <p className="text-muted-foreground">No feedback received yet.</p>
              ) : feedbackItems.map((f) => (
                <Card key={f._id} className={cn("border transition-colors", f.status === 'resolved' ? "bg-muted/30 opacity-70" : "bg-background")}>
                  <CardContent className="p-4 flex flex-col h-full justify-between gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={f.type === 'bug' ? 'destructive' : f.type === 'feature' ? 'default' : 'secondary'} className="uppercase text-[10px]">
                          {f.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{new Date(f.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm font-medium text-foreground whitespace-pre-wrap">{f.message}</p>
                    </div>
                    <div className="flex items-center justify-between border-t pt-3 mt-auto">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-card-foreground">{f.user?.name || "Anonymous"}</span>
                        <span className="text-[10px] text-muted-foreground">{f.user?.email}</span>
                      </div>
                      <Button variant={f.status === 'resolved' ? "outline" : "default"} size="sm" onClick={() => handleResolveFeedback(f._id, f.status)}>
                        {f.status === 'resolved' ? "Reopen" : "Resolve"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {activeTab === 'storage' && <AdminStorage />}
        </main>
      </div>
    </div>
  );
}

export default AdminPage;
