import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, CalendarDays, Map, BookMarked, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Book Room", to: "/rooms", icon: CalendarDays },
  { label: "Floor Map", to: "/floor-map", icon: Map },
  { label: "Study Hub", to: "/study-hub", icon: Sparkles },
  { label: "Bookings", to: "/bookings", icon: BookMarked },
];

export function MobileBottomNav() {
  const currentPath = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 border-t bg-background/80 backdrop-blur-xl px-1 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex h-full items-center justify-around">
        {navItems.map((item) => {
          const active = currentPath === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all duration-200 gap-1",
                active 
                  ? "text-primary" 
                  : "text-muted-foreground/80 hover:text-foreground"
              )}
            >
              <div className={cn(
                "flex items-center justify-center rounded-2xl transition-all duration-200 px-3.5 py-1",
                active ? "bg-primary/10" : "bg-transparent"
              )}>
                <item.icon className="h-5 w-5 shrink-0" />
              </div>
              <span className="text-[10px] font-black tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
