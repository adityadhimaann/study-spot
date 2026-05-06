import { LayoutDashboard, Map, Users, MessageSquare, LogOut, ChevronLeft, ChevronRight, HardDrive } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: "dashboard" | "rooms" | "users" | "feedback" | "storage") => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "rooms", label: "Rooms & Map", icon: Map },
  { id: "users", label: "Students", icon: Users },
  { id: "feedback", label: "Feedback", icon: MessageSquare },
  { id: "storage", label: "Storage", icon: HardDrive },
] as const;

export function AdminSidebar({ activeTab, setActiveTab }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      "sticky top-0 flex h-screen flex-col border-r bg-sidebar/80 backdrop-blur-xl transition-all duration-300 z-40",
      collapsed ? "w-[68px]" : "w-60"
    )}>
      <div className="flex h-16 items-center border-b px-4 shrink-0">
        <Logo size="md" showText={!collapsed} />
      </div>

      <nav className="flex-1 space-y-1 p-3 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110", active && "text-primary")} />
              {!collapsed && <span>{item.label}</span>}
              {active && !collapsed && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="space-y-1 border-t p-3 shrink-0">
        <button 
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/admin-login";
          }}
          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-all hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-5 w-5 shrink-0 transition-transform group-hover:scale-110" />
          {!collapsed && <span>Log out</span>}
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="mx-auto flex"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
}
