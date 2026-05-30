import { createFileRoute } from "@tanstack/react-router";
import { API_URL } from "@/lib/api-config";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CalendarDays, Clock, MapPin, Search, Mail, X, 
  Loader2, Sparkles, AlertCircle, History, CalendarRange 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/bookings")({
  component: MyBookingsPage,
  head: () => ({ meta: [{ title: "My Bookings — StudySpace" }] }),
});

type TabType = "upcoming" | "history" | "all";

type Booking = {
  _id: string;
  room: { 
    name: string; 
    floor: string; 
    type: string; 
    capacity: number; 
    amenities: string | string[]; 
    status: string; 
  };
  date: string;
  slot: string;
  status: string;
};

function MyBookingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [editingBooking, setEditingBooking] = useState<string | null>(null);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ date: "", slot: "" });
  const [inviteModalOpen, setInviteModalOpen] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/bookings/my-bookings`, {
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.json())
      .then(data => setBookings(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  }, []);

  const handleCancel = async (id: string, roomName: string) => {
    try {
      const res = await fetch(`${API_URL}/api/bookings/${id}/cancel`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b._id === id ? { ...b, status: 'cancelled' } : b));
        toast.success(`Booking for ${roomName} cancelled successfully`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to cancel booking");
    }
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/bookings/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b._id === id ? { ...b, date: editForm.date, slot: editForm.slot } : b));
        toast.success(`Booking updated successfully!`);
        setEditingBooking(null);
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to update booking");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteModalOpen || !inviteEmail) return;
    
    setIsInviting(true);
    try {
      const res = await fetch(`${API_URL}/api/bookings/${inviteModalOpen}/invite`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ email: inviteEmail })
      });
      if (res.ok) {
        toast.success("Collaboration invitation sent!");
        setInviteModalOpen(null);
        setInviteEmail("");
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to send invitation");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while sending the invite");
    } finally {
      setIsInviting(false);
    }
  };

  // Advanced Multi-filter Search logic
  const filteredBookings = bookings.filter((b) => {
    // 1. Filter by Tab Type (Upcoming vs Past History)
    if (activeTab === "upcoming" && b.status !== "upcoming") return false;
    if (activeTab === "history" && b.status === "upcoming") return false;

    // 2. Filter by Search Query
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const roomName = b.room?.name?.toLowerCase() || "";
    const floorName = b.room?.floor?.toLowerCase() || "";
    const dateStr = b.date?.toLowerCase() || "";
    const slotStr = b.slot?.toLowerCase() || "";
    const statusStr = b.status?.toLowerCase() || "";

    return (
      roomName.includes(query) ||
      floorName.includes(query) ||
      dateStr.includes(query) ||
      slotStr.includes(query) ||
      statusStr.includes(query)
    );
  });

  // Calculate upcoming stats
  const upcomingCount = bookings.filter(b => b.status === "upcoming").length;
  const historyCount = bookings.filter(b => b.status !== "upcoming").length;

  return (
    <div className="space-y-6">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card/40 border p-4 rounded-2xl backdrop-blur-sm shadow-sm">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border w-fit">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all duration-300",
              activeTab === "upcoming" 
                ? "bg-primary text-primary-foreground shadow-md" 
                : "text-muted-foreground hover:bg-accent/40"
            )}
          >
            <CalendarDays className="h-3.5 w-3.5" /> Upcoming ({upcomingCount})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all duration-300",
              activeTab === "history" 
                ? "bg-primary text-primary-foreground shadow-md" 
                : "text-muted-foreground hover:bg-accent/40"
            )}
          >
            <History className="h-3.5 w-3.5" /> Past & History ({historyCount})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all duration-300",
              activeTab === "all" 
                ? "bg-primary text-primary-foreground shadow-md" 
                : "text-muted-foreground hover:bg-accent/40"
            )}
          >
            <CalendarRange className="h-3.5 w-3.5" /> All ({bookings.length})
          </button>
        </div>

        {/* Real-time Search Box */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search room name, floor, date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-xl border border-border/50 bg-background/50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Booking visual timeline cards for upcoming slots */}
      {activeTab === "upcoming" && filteredBookings.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/10 bg-gradient-to-r from-indigo-950/10 to-transparent p-4 sm:p-5 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3.5 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 animate-pulse text-primary" /> Study Schedule Timeline
          </h4>
          <div className="relative border-l-2 border-primary/20 ml-3.5 space-y-4 pt-1">
            {filteredBookings.slice(0, 3).map((b, idx) => (
              <div key={`tl-${b._id}`} className="relative pl-6">
                {/* Visual anchor dots */}
                <div className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-primary/10 border border-background shadow-md" />
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">{b.date} · {b.slot}</span>
                  <h5 className="text-sm font-bold text-foreground mt-0.5">{b.room?.name}</h5>
                  <p className="text-xs text-muted-foreground mt-0.5">Floor: {b.room?.floor || "1st Floor"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bookings cards lists */}
      {filteredBookings.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center border-2 border-dashed rounded-3xl bg-card/10">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No bookings found</h3>
          <p className="mt-1 text-sm text-muted-foreground px-4">
            {searchQuery 
              ? "We couldn't find matches for your search. Try another spelling." 
              : `You don't have any ${activeTab !== "all" ? activeTab : ""} bookings scheduled.`}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3.5">
          {filteredBookings.map((b, i) => {
            const isCompleted = b.status === "completed";
            const isCancelled = b.status === "cancelled";
            const isUpcoming = b.status === "upcoming";

            const statusLabel = isUpcoming ? "Active" : isCompleted ? "Completed" : "Cancelled";
            const badgeVariant = isUpcoming ? "success" : isCancelled ? "destructive" : "secondary";

            return (
              <motion.div
                key={b._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={cn(
                  "group border-border/50 bg-card/85 backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5",
                  expandedBooking === b._id && "ring-2 ring-primary/20 shadow-lg"
                )}>
                  <CardContent className="flex flex-col gap-4 p-5">
                    
                    {/* Header Row */}
                    <div 
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 cursor-pointer" 
                      onClick={() => setExpandedBooking(expandedBooking === b._id ? null : b._id)}
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-110",
                          isUpcoming ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          <CalendarDays className="h-5 w-5" />
                        </div>
                        <div onClick={(e) => { if (editingBooking === b._id) e.stopPropagation(); }}>
                          <h3 className="font-bold text-card-foreground group-hover:text-primary transition-colors">{b.room?.name || 'Study Cabin'}</h3>
                          
                          {editingBooking === b._id ? (
                            <div className="mt-2.5 flex flex-wrap items-center gap-2">
                              <input 
                                type="date" 
                                className="rounded-xl border border-border/50 bg-background px-3 py-1.5 text-xs font-bold" 
                                value={editForm.date} 
                                onChange={e => setEditForm({ ...editForm, date: e.target.value })} 
                              />
                              <select 
                                className="rounded-xl border border-border/50 bg-background px-3 py-1.5 text-xs font-bold" 
                                value={editForm.slot} 
                                onChange={e => setEditForm({ ...editForm, slot: e.target.value })}
                              >
                                <option value="08:00 - 10:00">08:00 - 10:00</option>
                                <option value="10:00 - 12:00">10:00 - 12:00</option>
                                <option value="12:00 - 14:00">12:00 - 14:00</option>
                                <option value="14:00 - 16:00">14:00 - 16:00</option>
                                <option value="16:00 - 18:00">16:00 - 18:00</option>
                                <option value="18:00 - 20:00">18:00 - 20:00</option>
                              </select>
                            </div>
                          ) : (
                            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground font-semibold">
                              <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5 text-indigo-400" />{b.date}</span>
                              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-indigo-400" />{b.slot}</span>
                              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-indigo-400" />{b.room?.floor || '1st Floor'}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right side controls / Badge */}
                      <div className="flex flex-wrap items-center gap-3 sm:ml-auto" onClick={(e) => e.stopPropagation()}>
                        {editingBooking !== b._id && <Badge variant={badgeVariant} className="px-2 py-0.5 text-[10px] font-black tracking-widest uppercase">{statusLabel}</Badge>}
                        
                        {isUpcoming && (
                          editingBooking === b._id ? (
                            <div className="flex gap-2">
                              <Button variant="default" size="sm" onClick={() => handleSaveEdit(b._id)} className="rounded-xl font-bold">Save</Button>
                              <Button variant="ghost" size="sm" onClick={() => setEditingBooking(null)} className="rounded-xl font-semibold">Cancel</Button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              <Button variant="outline" size="sm" onClick={() => setInviteModalOpen(b._id)} className="rounded-xl text-xs font-bold border-border/50 hover:bg-primary/5">Invite</Button>
                              <Button variant="outline" size="sm" onClick={() => { setEditingBooking(b._id); setEditForm({ date: b.date, slot: b.slot }); }} className="rounded-xl text-xs font-bold border-border/50">Edit</Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 border-border/50 hover:border-destructive/30" 
                                onClick={() => handleCancel(b._id, b.room?.name)}
                              >
                                Cancel
                              </Button>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Collapsible details drawer */}
                    <AnimatePresence>
                      {expandedBooking === b._id && !editingBooking && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: "auto", opacity: 1 }} 
                          exit={{ height: 0, opacity: 0 }} 
                          className="overflow-hidden"
                        >
                          <div className="mt-4 pt-4 border-t grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                            <div>
                              <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">Room Type</p>
                              <p className="font-bold capitalize text-foreground">{b.room?.type || "Quiet Zone"}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">Capacity Limit</p>
                              <p className="font-bold text-foreground">{b.room?.capacity || 4} {b.room?.capacity === 1 ? 'person' : 'people'}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">Amenities</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {Array.isArray(b.room?.amenities) ? (
                                  b.room.amenities.map((am, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-[10px] font-semibold bg-indigo-500/10 border-indigo-500/15 text-indigo-300 px-2 py-0.25">{am.trim()}</Badge>
                                  ))
                                ) : typeof b.room?.amenities === 'string' ? (
                                  b.room.amenities.split(',').map((am, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-[10px] font-semibold bg-indigo-500/10 border-indigo-500/15 text-indigo-300 px-2 py-0.25">{am.trim()}</Badge>
                                  ))
                                ) : <span className="text-muted-foreground">Power outlets, high-speed Wi-Fi</span>}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Collaboration Partner Invitation Modal */}
      <AnimatePresence>
        {inviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-card/95 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-bold text-card-foreground text-sm uppercase tracking-wider">Invite a Peer</h3>
                </div>
                <button
                  onClick={() => { setInviteModalOpen(null); setInviteEmail(""); }}
                  className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <form onSubmit={handleInviteSubmit} className="p-6">
                <p className="mb-4 text-xs text-muted-foreground font-medium leading-relaxed">
                  Send a collaboration invitation. They will receive booking coordinates and can check-in on their study app.
                </p>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                      University Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="partner@university.edu"
                      className="w-full rounded-xl border border-input bg-background/50 px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={() => { setInviteModalOpen(null); setInviteEmail(""); }} className="rounded-xl font-bold">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isInviting} className="rounded-xl font-bold">
                      {isInviting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Inviting...</> : "Send Invite"}
                    </Button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
