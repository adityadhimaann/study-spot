import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardTopbar } from "@/components/DashboardTopbar";
import { Toaster } from "@/components/ui/sonner";
import { AnimatePresence, motion } from "framer-motion";

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
  const currentPath = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen w-full bg-background overflow-x-hidden">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <DashboardTopbar />
        <main className="flex-1 p-6 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPath}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <FeedbackWidget />
      <Toaster position="bottom-right" />
    </div>
  );
}
