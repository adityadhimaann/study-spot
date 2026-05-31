import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, CalendarDays, BookMarked, User, LogOut, ChevronLeft, ChevronRight, Map, Brain } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Book Room", to: "/rooms", icon: CalendarDays },
  { label: "Floor Map", to: "/floor-map", icon: Map },
  { label: "Study Hub", to: "/study-hub", icon: Brain },
  { label: "My Bookings", to: "/bookings", icon: BookMarked },
  { label: "Profile", to: "/profile", icon: User },
];

export function AppSidebar({ 
  collapsed, 
  setCollapsed, 
  forceShow = false,
  onItemClick
}: { 
  collapsed?: boolean; 
  setCollapsed?: (c: boolean) => void; 
  forceShow?: boolean; 
  onItemClick?: () => void;
}) {
  const [localCollapsed, setLocalCollapsed] = useState(false);
  const isCollapsed = collapsed !== undefined ? collapsed : localCollapsed;

  const currentPath = useRouterState({ select: (s) => s.location.pathname });

  return (
    <>
      {/* Sidebar for Desktop / Mobile */}
      <aside className={cn(
        "flex flex-col bg-sidebar transition-all duration-300",
        // Desktop layouts
        !forceShow && "fixed top-0 left-0 z-30 h-screen border-r bg-sidebar/80 backdrop-blur-xl hidden md:flex",
        !forceShow && (isCollapsed ? "w-[68px]" : "w-60"),
        // Mobile drawer layout
        forceShow && "h-full w-full bg-sidebar border-none"
      )}>
        <div className="flex h-16 items-center border-b px-4">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <Logo size="md" showText={!isCollapsed} />
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const active = currentPath === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onItemClick}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110", active && "text-primary")} />
                {!isCollapsed && <span>{item.label}</span>}
                {active && !isCollapsed && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t p-3">
          <button 
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              window.location.href = "/login";
            }}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-all hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-5 w-5 shrink-0 transition-transform group-hover:scale-110" />
            {!isCollapsed && <span>Log out</span>}
          </button>
          {!forceShow && (
            <Button
              variant="ghost"
              size="icon"
              className="mx-auto flex"
              onClick={() => {
                if (setCollapsed) {
                  setCollapsed(!isCollapsed);
                } else {
                  setLocalCollapsed(!isCollapsed);
                }
              }}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </aside>
    </>
  );
}
