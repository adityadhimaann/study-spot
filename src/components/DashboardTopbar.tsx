import { Search } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationDropdown } from "@/components/NotificationDropdown";

export function DashboardTopbar() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/60 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search rooms, bookings..."
            className="h-10 w-64 rounded-xl border bg-muted/40 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NotificationDropdown />
        <div className="flex items-center gap-2.5 ml-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20">
            JD
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-foreground">Jane Doe</p>
            <p className="text-xs text-muted-foreground">Student</p>
          </div>
        </div>
      </div>
    </header>
  );
}
