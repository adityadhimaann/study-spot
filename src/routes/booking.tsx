import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Volume2, CheckCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { z } from "zod";

const bookingSearchSchema = z.object({
  roomId: z.number().optional(),
});

export const Route = createFileRoute("/booking")({
  component: BookingPage,
  validateSearch: bookingSearchSchema,
  head: () => ({
    meta: [{ title: "Book a Room — StudySpace" }],
  }),
});

const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00",
];

const bookedSlots = ["09:00", "14:00", "15:00"];

const dates = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return d;
});

function BookingPage() {
  const { roomId } = Route.useSearch();
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const roomName = roomId ? `Room #${roomId}` : "Group Room B1";

  if (confirmed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Booking Confirmed!</h1>
          <p className="mt-2 text-muted-foreground">
            {roomName} on {dates[selectedDate].toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at {selectedSlot}
          </p>
          <Button className="mt-6" asChild>
            <a href="/bookings">View My Bookings</a>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-bold text-foreground">Book a Room</h1>
        <p className="mt-1 text-muted-foreground">Select a date and time slot to reserve your space.</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Room Info */}
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-card-foreground">{roomName}</h2>
                  <p className="text-sm text-muted-foreground">2nd Floor · Capacity: 6</p>
                </div>
                <Badge variant="success" className="ml-auto">Available</Badge>
              </CardContent>
            </Card>

            {/* Date */}
            <Card>
              <CardContent className="p-5">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-card-foreground">
                  <Calendar className="h-4 w-4" /> Select Date
                </h3>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {dates.map((d, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(i)}
                      className={cn(
                        "flex min-w-[72px] flex-col items-center rounded-xl border px-3 py-3 text-sm transition-all",
                        selectedDate === i
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      <span className="text-xs font-medium">{d.toLocaleDateString("en-US", { weekday: "short" })}</span>
                      <span className="text-lg font-bold">{d.getDate()}</span>
                      <span className="text-xs">{d.toLocaleDateString("en-US", { month: "short" })}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Time Slots */}
            <Card>
              <CardContent className="p-5">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-card-foreground">
                  <Clock className="h-4 w-4" /> Select Time Slot
                </h3>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                  {timeSlots.map((slot) => {
                    const isBooked = bookedSlots.includes(slot);
                    return (
                      <button
                        key={slot}
                        disabled={isBooked}
                        onClick={() => setSelectedSlot(slot)}
                        className={cn(
                          "rounded-lg border px-3 py-2.5 text-sm font-medium transition-all",
                          isBooked && "cursor-not-allowed border-border bg-muted text-muted-foreground line-through",
                          !isBooked && selectedSlot === slot && "border-primary bg-primary text-primary-foreground",
                          !isBooked && selectedSlot !== slot && "border-border bg-card text-card-foreground hover:border-primary/40"
                        )}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div>
            <Card className="sticky top-24">
              <CardContent className="p-5">
                <h3 className="mb-4 font-semibold text-card-foreground">Booking Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Room</span>
                    <span className="font-medium text-card-foreground">{roomName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium text-card-foreground">
                      {dates[selectedDate].toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-medium text-card-foreground">{selectedSlot ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium text-card-foreground">1 hour</span>
                  </div>
                </div>
                <Button
                  className="mt-6 w-full"
                  size="lg"
                  disabled={!selectedSlot}
                  onClick={() => setConfirmed(true)}
                >
                  Confirm Booking
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
