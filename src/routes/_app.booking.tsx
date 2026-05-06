import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Volume2, CheckCircle, ChevronRight, ChevronLeft, MapPin, Sparkles, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { z } from "zod";

const bookingSearchSchema = z.object({ roomId: z.string().optional() });

export const Route = createFileRoute("/_app/booking")({
  component: BookingPage,
  validateSearch: bookingSearchSchema,
  head: () => ({ meta: [{ title: "Book a Room — StudySpace" }] }),
});

const zones = [
  { id: "quiet", label: "Quiet Zone", icon: Volume2, desc: "Individual silent study", color: "text-chart-2" },
  { id: "group", label: "Group Study", icon: Users, desc: "Collaborative team rooms", color: "text-primary" },
];

type Room = { _id: string; name: string; type: string; capacity: number; status: string; floor: string; amenities: string[]; rating: number };

const timeSlots = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00"];
const bookedSlots = ["09:00", "14:00", "15:00"];

const dates = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return d;
});

const steps = [
  { label: "Zone", desc: "Select type" },
  { label: "Room", desc: "Pick a room" },
  { label: "Time", desc: "Choose slot" },
  { label: "Confirm", desc: "Review" },
];

function BookingPage() {
  const { roomId } = Route.useSearch();
  const [step, setStep] = useState(0);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(roomId ?? null);
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [dbRooms, setDbRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("You must be logged in to book a room");
      
      const dateStr = dates[selectedDate].toISOString().split('T')[0];

      const res = await fetch("http://localhost:5000/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          room: selectedRoom,
          date: dateStr,
          slot: selectedSlot
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to book");
      
      setConfirmed(true);
      toast.success("Booking confirmed!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetch("http://localhost:5000/api/rooms")
      .then(res => res.json())
      .then(data => { setDbRooms(data); setIsLoading(false); })
      .catch(err => { console.error(err); setIsLoading(false); });
  }, []);

  const roomsByZone: Record<string, Room[]> = {
    quiet: dbRooms.filter(r => r.type === "quiet"),
    group: dbRooms.filter(r => r.type === "group"),
  };

  const rooms = selectedZone ? roomsByZone[selectedZone] ?? [] : [];
  const currentRoom = rooms.find((r) => r._id === selectedRoom) ?? (selectedZone ? rooms[0] : null);

  if (confirmed) {
    return (
      <div className="flex items-center justify-center py-20 px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, type: "spring" }} className="text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/15">
            <CheckCircle className="h-10 w-10 text-success" />
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground">Booking Confirmed!</h1>
          <p className="mt-3 text-muted-foreground">
            {currentRoom?.name} on {dates[selectedDate].toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at {selectedSlot}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-success/10 px-4 py-2 text-sm text-success">
            <Sparkles className="h-4 w-4" /> Confirmation sent to your email
          </div>
          <div className="mt-8">
            <Button size="lg" asChild><a href="/bookings">View My Bookings</a></Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-foreground">Book a Room</h1>
        <p className="mt-1 text-muted-foreground">Follow the steps to reserve your perfect study space.</p>

        {/* Stepper */}
        <div className="mt-8 mb-8 flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2">
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-300",
                i < step ? "bg-success text-success-foreground" :
                i === step ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" :
                "bg-muted text-muted-foreground"
              )}>
                {i < step ? "✓" : i + 1}
              </div>
              <div className="hidden sm:block">
                <p className={cn("text-xs font-semibold", i === step ? "text-foreground" : "text-muted-foreground")}>{s.label}</p>
                <p className="text-[10px] text-muted-foreground">{s.desc}</p>
              </div>
              {i < steps.length - 1 && <div className={cn("mx-2 h-0.5 w-8 rounded-full transition-colors sm:w-12", i < step ? "bg-success" : "bg-border")} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
            {/* Step 0: Zone */}
            {step === 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {zones.map((z) => (
                  <Card
                    key={z.id}
                    className={cn(
                      "cursor-pointer border-2 transition-all duration-200 hover:shadow-lg",
                      selectedZone === z.id ? "border-primary bg-primary/5 shadow-lg" : "border-border/50 hover:border-primary/30"
                    )}
                    onClick={() => setSelectedZone(z.id)}
                  >
                    <CardContent className="flex items-center gap-4 p-6">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                        <z.icon className={cn("h-7 w-7", z.color)} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-card-foreground">{z.label}</h3>
                        <p className="text-sm text-muted-foreground">{z.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Step 1: Room */}
            {step === 1 && (
              <div className="space-y-3">
                {rooms.map((room) => {
                  const isAvailable = room.status === "available";
                  return (
                  <Card
                    key={room._id}
                    className={cn(
                      "cursor-pointer border-2 transition-all duration-200 hover:shadow-md",
                      selectedRoom === room._id ? "border-primary bg-primary/5" : "border-border/50",
                      !isAvailable && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => isAvailable && setSelectedRoom(room._id)}
                  >
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        {selectedZone === "quiet" ? <Volume2 className="h-6 w-6 text-primary" /> : <Users className="h-6 w-6 text-primary" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-card-foreground">{room.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-3 w-3" />{room.floor} · Cap: {room.capacity}
                        </p>
                        <div className="mt-1 flex gap-1.5">
                          {room.amenities.map((a) => (
                            <span key={a} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{a}</span>
                          ))}
                        </div>
                      </div>
                      <Badge variant={isAvailable ? "success" : "secondary"}>{isAvailable ? "Available" : "Booked"}</Badge>
                    </CardContent>
                  </Card>
                )})}
              </div>
            )}

            {/* Step 2: Time */}
            {step === 2 && (
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-5">
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-card-foreground"><Calendar className="h-4 w-4" /> Select Date</h3>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {dates.map((d, i) => (
                        <button key={i} onClick={() => setSelectedDate(i)} className={cn(
                          "flex min-w-[72px] flex-col items-center rounded-xl border px-3 py-3 text-sm transition-all duration-200",
                          selectedDate === i ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:shadow-sm"
                        )}>
                          <span className="text-xs font-medium">{d.toLocaleDateString("en-US", { weekday: "short" })}</span>
                          <span className="text-lg font-bold">{d.getDate()}</span>
                          <span className="text-xs">{d.toLocaleDateString("en-US", { month: "short" })}</span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-card-foreground"><Clock className="h-4 w-4" /> Select Time</h3>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                      {timeSlots.map((slot) => {
                        const isBooked = bookedSlots.includes(slot);
                        return (
                          <button key={slot} disabled={isBooked} onClick={() => setSelectedSlot(slot)} className={cn(
                            "rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200",
                            isBooked && "cursor-not-allowed border-border bg-muted text-muted-foreground line-through",
                            !isBooked && selectedSlot === slot && "border-primary bg-primary text-primary-foreground shadow-md",
                            !isBooked && selectedSlot !== slot && "border-border bg-card text-card-foreground hover:border-primary/40 hover:shadow-sm"
                          )}>
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h3 className="mb-6 text-lg font-semibold text-card-foreground">Booking Summary</h3>
                  <div className="space-y-4 text-sm">
                    {[
                      { label: "Zone", value: zones.find((z) => z.id === selectedZone)?.label ?? "—" },
                      { label: "Room", value: currentRoom?.name ?? "—" },
                      { label: "Floor", value: currentRoom?.floor ?? "—" },
                      { label: "Date", value: dates[selectedDate].toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) },
                      { label: "Time", value: selectedSlot ? `${selectedSlot} — ${parseInt(selectedSlot) + 1}:00` : "—" },
                      { label: "Duration", value: "1 hour" },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between rounded-lg bg-muted/50 p-3">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-medium text-card-foreground">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <Button variant="outline" size="lg" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          {step < 3 ? (
            <Button size="lg" onClick={() => setStep(step + 1)} disabled={
              (step === 0 && !selectedZone) || (step === 1 && !selectedRoom) || (step === 2 && !selectedSlot)
            }>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button variant="hero" size="lg" onClick={handleConfirm} disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Confirming...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-1" /> Confirm Booking</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
