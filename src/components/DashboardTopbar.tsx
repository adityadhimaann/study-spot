import { Search } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { useRouterState } from "@tanstack/react-router";

import { useState, useEffect } from "react";

export function DashboardTopbar() {
  const [user, setUser] = useState<{name?: string} | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from local storage");
      }
    }
  }, []);

  const name = user?.name || "Jane Doe";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const location = useRouterState({ select: (s) => s.location.pathname });
  let title = "";
  let subtitle = "";
  
  if (location === '/dashboard') {
    title = `Welcome back, ${name.split(" ")[0]} 👋`;
    subtitle = "Here's what's happening with your study sessions today.";
  } else if (location === '/rooms') {
    title = "Room Availability";
    subtitle = "Browse and book available study spaces.";
  } else if (location === '/floor-map') {
    title = "Live Floor Map";
    subtitle = "Interactive view of all study spaces and their current availability.";
  } else if (location === '/bookings') {
    title = "My Bookings";
    subtitle = "Manage and review your room reservations.";
  } else if (location === '/profile') {
    title = "Student Profile";
    subtitle = "Manage your account and preferences.";
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/60 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
          <h1 className="text-lg font-bold leading-tight text-foreground">{title}</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">{subtitle}</p>
        </div>
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search rooms, bookings..."
            className="h-9 w-64 rounded-xl border bg-muted/40 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NotificationDropdown />
        <div className="flex items-center gap-2.5 ml-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 uppercase">
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-foreground">{name}</p>
            <p className="text-xs text-muted-foreground">Student</p>
          </div>
        </div>
      </div>
    </header>
  );
}
