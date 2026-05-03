import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { BookOpen, Mail, Lock, ArrowRight, Github, Chrome } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 font-heading text-xl font-bold text-foreground">
            <motion.div whileHover={{ rotate: 10 }} className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </motion.div>
            StudySpace
          </Link>
        </div>

        <div className="rounded-2xl border bg-card/80 p-8 shadow-2xl backdrop-blur-xl">
          <h1 className="mb-1 text-2xl font-bold text-card-foreground">
            {isSignup ? "Create an account" : "Welcome back"}
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            {isSignup ? "Sign up to start booking study spaces." : "Log in to manage your bookings."}
          </p>

          {/* Social login */}
          <div className="mb-6 grid grid-cols-2 gap-3">
            <Button variant="outline" className="gap-2 transition-all hover:shadow-md">
              <Chrome className="h-4 w-4" /> Google
            </Button>
            <Button variant="outline" className="gap-2 transition-all hover:shadow-md">
              <Github className="h-4 w-4" /> GitHub
            </Button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or continue with email</span></div>
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            {isSignup && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-card-foreground">Full Name</label>
                <input type="text" placeholder="Jane Doe" className="h-11 w-full rounded-xl border bg-background/80 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">Email or Student ID</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="email" placeholder="you@university.edu" className="h-11 w-full rounded-xl border bg-background/80 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="password" placeholder="••••••••" className="h-11 w-full rounded-xl border bg-background/80 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
              </div>
            </div>

            <Button className="w-full group" size="lg" variant="hero" asChild>
              <Link to="/dashboard">
                {isSignup ? "Create Account" : "Log In"}
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button onClick={() => setIsSignup(!isSignup)} className="font-medium text-primary hover:underline">
              {isSignup ? "Log in" : "Sign up"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
