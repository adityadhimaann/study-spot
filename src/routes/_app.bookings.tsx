import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, MapPin, Search, Filter, Mail, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/bookings")({
  component: MyBookingsPage,
  head: () => ({ meta: [{ title: "My Bookings — StudySpace" }] }),
});

type StatusFilter = "all" | "Active" | "Completed";

type Booking = {
  _id: string;
  room: { name: string; floor: string; type: string; capacity: number; amenities: string | string[]; status: string };
  date: string;
  slot: string;
  status: string;
};

function MyBookingsPage() {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [editingBooking, setEditingBooking] = useState<string | null>(null);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ date: "", slot: "" });
  const [inviteModalOpen, setInviteModalOpen] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/bookings/my-bookings", {
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.json())
      .then(data => setBookings(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  }, []);

  const handleCancel = async (id: string, roomName: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${id}/cancel`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b._id === id ? { ...b, status: 'cancelled' } : b));
        toast.success(`Booking for ${roomName} cancelled`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to cancel booking");
    }
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${id}`, {
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
      const res = await fetch(`http://localhost:5000/api/bookings/${inviteModalOpen}/invite`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ email: inviteEmail })
      });
      if (res.ok) {
        toast.success("Invitation sent successfully!");
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

  const filtered = bookings.filter((b) => {
    if (filter === "all") return true;
    if (filter === "Active" && b.status === "upcoming") return true;
    if (filter === "Completed" && b.status === "completed") return true;
    return false;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex items-center gap-2">
          {(["all", "Active", "Completed"] as StatusFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                filter === f ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <CalendarDays className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No bookings found</h3>
          <p className="mt-1 text-sm text-muted-foreground">You don't have any {filter !== "all" ? filter.toLowerCase() : ""} bookings yet.</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b, i) => {
            const statusLabel = b.status === "upcoming" ? "Active" : b.status === "completed" ? "Completed" : "Cancelled";
            const badgeVariant = statusLabel === "Active" ? "success" : statusLabel === "Cancelled" ? "destructive" : "secondary";
            
            return (
            <motion.div
              key={b._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card className={cn("group border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-200 hover:shadow-lg", expandedBooking === b._id && "ring-2 ring-primary/20 shadow-lg")}>
                <CardContent className="flex flex-col gap-4 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between cursor-pointer" onClick={() => setExpandedBooking(expandedBooking === b._id ? null : b._id)}>
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-110">
                        <CalendarDays className="h-5 w-5 text-primary" />
                      </div>
                      <div onClick={(e) => { if (editingBooking === b._id) e.stopPropagation(); }}>
                        <h3 className="font-semibold text-card-foreground hover:text-primary transition-colors">{b.room?.name || 'Unknown Room'}</h3>
                      {editingBooking === b._id ? (
                        <div className="mt-2 flex items-center gap-2">
                          <input type="date" className="rounded border bg-background px-2 py-1 text-sm" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} />
                          <select className="rounded border bg-background px-2 py-1 text-sm" value={editForm.slot} onChange={e => setEditForm({ ...editForm, slot: e.target.value })}>
                            <option value="08:00 - 10:00">08:00 - 10:00</option>
                            <option value="10:00 - 12:00">10:00 - 12:00</option>
                            <option value="12:00 - 14:00">12:00 - 14:00</option>
                            <option value="14:00 - 16:00">14:00 - 16:00</option>
                            <option value="16:00 - 18:00">16:00 - 18:00</option>
                            <option value="18:00 - 20:00">18:00 - 20:00</option>
                          </select>
                        </div>
                      ) : (
                        <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{b.date}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{b.slot}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{b.room?.floor || 'Unknown Floor'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-4 sm:mt-0">
                    {editingBooking !== b._id && <Badge variant={badgeVariant}>{statusLabel}</Badge>}
                    {b.status === "upcoming" && (
                      editingBooking === b._id ? (
                        <>
                          <Button variant="default" size="sm" onClick={(e) => { e.stopPropagation(); handleSaveEdit(b._id); }}>Save</Button>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditingBooking(null); }}>Cancel</Button>
                        </>
                      ) : (
                        <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button variant="outline" size="sm" onClick={() => setInviteModalOpen(b._id)}>Invite</Button>
                          <Button variant="outline" size="sm" onClick={() => { setEditingBooking(b._id); setEditForm({ date: b.date, slot: b.slot }); }}>Edit</Button>
                          <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleCancel(b._id, b.room?.name)}>Cancel</Button>
                        </div>
                      )
                    )}
                  </div>
                </div>

                  <AnimatePresence>
                    {expandedBooking === b._id && !editingBooking && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="mt-4 pt-4 border-t grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">Room Type</p>
                            <p className="font-medium capitalize">{b.room?.type}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">Capacity</p>
                            <p className="font-medium">{b.room?.capacity} {b.room?.capacity === 1 ? 'person' : 'people'}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">Amenities</p>
                            <div className="flex flex-wrap gap-1">
                              {Array.isArray(b.room?.amenities) ? (
                                b.room.amenities.map((am, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-[10px] font-normal">{am.trim()}</Badge>
                                ))
                              ) : typeof b.room?.amenities === 'string' ? (
                                b.room.amenities.split(',').map((am, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-[10px] font-normal">{am.trim()}</Badge>
                                ))
                              ) : <span className="text-muted-foreground">None</span>}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          )})}
        </div>
      )}

      {/* Invite Modal */}
      <AnimatePresence>
        {inviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md overflow-hidden rounded-2xl border border-border/50 bg-card/95 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-card-foreground">Invite a Study Partner</h3>
                </div>
                <button
                  onClick={() => { setInviteModalOpen(null); setInviteEmail(""); }}
                  className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <form onSubmit={handleInviteSubmit} className="p-6">
                <p className="mb-4 text-sm text-muted-foreground">
                  Send an email invitation to collaborate. They will receive a link with the booking details.
                </p>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Student Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="student@university.edu"
                      className="w-full rounded-xl border border-input bg-background/50 px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={() => { setInviteModalOpen(null); setInviteEmail(""); }}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isInviting}>
                      {isInviting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : "Send Invite"}
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
