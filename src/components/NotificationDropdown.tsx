import { Bell, CalendarCheck, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Notification {
  id: number;
  type: "booking" | "reminder" | "info";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const notifications: Notification[] = [
  { id: 1, type: "booking", title: "Booking Confirmed", message: "Your reservation for Group Room B1 has been confirmed.", time: "2 min ago", read: false },
  { id: 2, type: "reminder", title: "Upcoming Session", message: "Your booking at Quiet Zone A3 starts in 30 minutes.", time: "28 min ago", read: false },
  { id: 3, type: "info", title: "New Rooms Available", message: "3 new study rooms have been added on the 4th floor.", time: "1 hour ago", read: true },
  { id: 4, type: "booking", title: "Booking Cancelled", message: "Your reservation for Group Room C2 was cancelled.", time: "3 hours ago", read: true },
];

const iconMap = { booking: CalendarCheck, reminder: Clock, info: Info };

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="relative" onClick={() => setOpen(!open)}>
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground"
          >
            {unreadCount}
          </motion.span>
        )}
      </Button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-xl border bg-card/95 shadow-2xl backdrop-blur-xl"
            >
              <div className="border-b p-4">
                <h3 className="text-sm font-semibold text-card-foreground">Notifications</h3>
                <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.map((n) => {
                  const Icon = iconMap[n.type];
                  return (
                    <div
                      key={n.id}
                      className={cn(
                        "flex gap-3 border-b p-3 transition-colors last:border-0 hover:bg-accent/50",
                        !n.read && "bg-primary/5"
                      )}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-card-foreground">{n.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground/70">{n.time}</p>
                      </div>
                      {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    </div>
                  );
                })}
              </div>
              <div className="border-t p-2">
                <Button variant="ghost" size="sm" className="w-full text-xs">
                  Mark all as read
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
