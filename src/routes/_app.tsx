import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardTopbar } from "@/components/DashboardTopbar";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/_app")({
  beforeLoad: ({ location }) => {
    const isPublicPath = location.pathname === "/rooms";
    if (typeof window !== "undefined" && !localStorage.getItem("token") && !isPublicPath) {
      throw redirect({
        to: "/login",
      });
    }
  },
  component: AppLayout,
});

import { FeedbackWidget } from "@/components/FeedbackWidget";

function AppLayout() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <DashboardTopbar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
      <FeedbackWidget />
      <Toaster position="bottom-right" />
    </div>
  );
}
