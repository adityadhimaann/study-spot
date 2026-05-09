import { Bell, CalendarCheck, Clock, Info } from "lucide-react";
import { API_URL } from "@/lib/api-config";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type NotificationType = "booking" | "reminder" | "info";

interface Notification {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

const iconMap = { booking: CalendarCheck, reminder: Clock, info: Info };

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/api/notifications`, {
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.json())
      .then(data => setNotifications(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    for (const n of unread) {
       await handleMarkAsRead(n._id);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
                {notifications.length === 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
                )}
                {notifications.map((n) => {
                  const type = n.title.toLowerCase().includes("booking") ? "booking" : "info";
                  const Icon = iconMap[type];
                  return (
                    <div
                      key={n._id}
                      onClick={() => !n.isRead && handleMarkAsRead(n._id)}
                      className={cn(
                        "flex gap-3 border-b p-3 transition-colors last:border-0 hover:bg-accent/50 cursor-pointer",
                        !n.isRead && "bg-primary/5"
                      )}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-card-foreground">{n.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground/70">{new Date(n.createdAt).toLocaleDateString()}</p>
                      </div>
                      {!n.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    </div>
                  );
                })}
              </div>
              <div className="border-t p-2">
                <Button variant="ghost" size="sm" className="w-full text-xs" onClick={handleMarkAllAsRead}>
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
