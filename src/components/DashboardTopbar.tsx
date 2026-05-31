import { Search } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { useRouterState, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { AppSidebar } from "@/components/AppSidebar";
import { useMediaQuery } from "@/hooks/use-media-query";

import { useState, useEffect } from "react";

export function DashboardTopbar({ collapsed }: { collapsed?: boolean }) {
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

  const name = user?.name || "";
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "";

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
  } else if (location === '/study-hub') {
    title = "Study & Focus Hub";
    subtitle = "Your focus companion: Pomodoro timer, ambient sounds, and session tasks.";
  } else if (location === '/bookings') {
    title = "My Bookings";
    subtitle = "Manage and review your room reservations.";
  } else if (location === '/profile') {
    title = "Student Profile";
    subtitle = "Manage your account and preferences.";
  }

  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const leftOffset = isMobile 
    ? "0px" 
    : (collapsed ? '68px' : '240px');

  return (
    <header className="fixed top-0 right-0 z-45 flex h-16 items-center justify-between border-b bg-background/60 px-6 backdrop-blur-xl transition-all duration-300" 
      style={{ left: leftOffset }}
    >
      <div className="flex items-center gap-4">
        <div className="flex flex-col min-w-0">
          <h1 className="text-base sm:text-lg font-bold leading-tight text-foreground whitespace-nowrap">{title}</h1>
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
        {user ? (
          <>
            <NotificationDropdown />
            <Link to="/profile" className="flex items-center gap-2.5 ml-2 group cursor-pointer">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 uppercase transition-transform duration-200 group-hover:scale-105">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-200">{name}</p>
                <p className="text-xs text-muted-foreground">{user?.role || 'Student'}</p>
              </div>
            </Link>
          </>
        ) : (
          <div className="ml-4">
             <Button variant="default" size="sm" asChild className="rounded-xl">
               <Link to="/login">Sign In</Link>
             </Button>
          </div>
        )}
      </div>
    </header>
  );
}
