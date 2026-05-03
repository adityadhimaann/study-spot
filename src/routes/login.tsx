import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { BookOpen, Mail, Lock, ArrowRight } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Log In — StudySpace" },
      { name: "description", content: "Sign in to your StudySpace account to manage bookings." },
    ],
  }),
});

function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 font-heading text-xl font-bold text-foreground">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            StudySpace
          </Link>
        </div>

        <div className="rounded-2xl border bg-card p-8 shadow-lg">
          <h1 className="mb-1 text-2xl font-bold text-card-foreground">
            {isSignup ? "Create an account" : "Welcome back"}
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            {isSignup ? "Sign up to start booking study spaces." : "Log in to manage your bookings."}
          </p>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            {isSignup && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-card-foreground">Full Name</label>
                <input
                  type="text"
                  placeholder="Jane Doe"
                  className="h-11 w-full rounded-lg border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">Email or Student ID</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="you@university.edu"
                  className="h-11 w-full rounded-lg border bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="h-11 w-full rounded-lg border bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <Button className="w-full" size="lg" asChild>
              <Link to="/dashboard">
                {isSignup ? "Create Account" : "Log In"}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="font-medium text-primary hover:underline"
            >
              {isSignup ? "Log in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
