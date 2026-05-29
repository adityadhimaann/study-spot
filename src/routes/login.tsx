import { createFileRoute, Link } from "@tanstack/react-router";
import { API_URL } from "@/lib/api-config";
import { Button } from "@/components/ui/button";
import { Mail, Lock, ArrowRight, User, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Authentication — StudySpace" },
      { name: "description", content: "Join StudySpace to find and book the best study spots on campus." },
    ],
  }),
});

function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (error) {
      setShake(true);
      const t = setTimeout(() => setShake(false), 600);
      return () => clearTimeout(t);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const endpoint = isSignup ? "/register" : "/login";
      const payload = isSignup ? { name, email, password } : { email, password };
      const res = await fetch(`${API_URL}/api/auth${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Google auth failed");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "343096565644-j7g71nk3hitaieoic2o4hv01e6a9kn6s.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="relative flex min-h-screen w-full overflow-hidden bg-slate-50 dark:bg-[#060614]">

        {/* ── Ambient background glows ── */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 10, repeat: Infinity }}
            className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-violet-600/30 blur-[130px]" />
          <motion.div animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 14, repeat: Infinity, delay: 3 }}
            className="absolute -bottom-32 -right-32 h-[600px] w-[600px] rounded-full bg-cyan-500/20 blur-[150px]" />
          <motion.div animate={{ y: [-20, 20, -20] }} transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[100px]" />
        </div>

        {/* ── Left: 3D Visual Panel ── */}
        <div className="relative hidden w-[48%] flex-col items-center justify-center overflow-hidden lg:flex">
          {/* 3D image with depth effect */}
          <motion.div
            animate={{ scale: [1, 1.04, 1], rotateZ: [0, 1, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <img src="/login-3d.png" alt="3D Space" className="h-full w-full object-cover opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#060614]/80" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#060614]/40 via-transparent to-[#060614]/60" />
          </motion.div>

          {/* Floating 3D cards */}
          <div className="relative z-10 w-full px-12">
            {/* Top-left floating card */}
            <motion.div
              animate={{ y: [0, -12, 0], rotateX: [0, 5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-16 left-8 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4 backdrop-blur-xl shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/30 flex items-center justify-center text-lg">📚</div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Available Now</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">12 Rooms Free</p>
                </div>
              </div>
            </motion.div>

            {/* Bottom-right floating card */}
            <motion.div
              animate={{ y: [0, 10, 0], rotateX: [0, -3, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-24 right-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4 backdrop-blur-xl shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/30 flex items-center justify-center text-lg">⚡</div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Booking</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Under 30 seconds</p>
                </div>
              </div>
            </motion.div>

            {/* Center text overlay */}
            <div className="text-center" style={{ marginTop: '45vh', transform: 'translateY(-50%)' }}>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-5xl font-black leading-tight tracking-tighter text-white drop-shadow-2xl"
              >
                UNLOCK YOUR<br />
                <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  FOCUS MODE.
                </span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-4 text-base font-medium text-white/80 dark:text-white/50"
              >
                The smarter way to study.
              </motion.p>
            </div>
          </div>
        </div>

        {/* ── Right: Form Panel ── */}
        <div className="relative z-10 flex w-full flex-col items-center justify-center px-6 py-12 lg:w-[52%]">

          {/* Back button */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="absolute top-8 right-8 flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" asChild className="group gap-2 rounded-full border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 px-5 text-slate-600 dark:text-white/60 backdrop-blur-sm hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white">
              <Link to="/"><ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Home</Link>
            </Button>
          </motion.div>

          <div className="w-full max-w-[400px]">
            {/* Logo */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex justify-center lg:justify-start">
              <Link to="/"><Logo size="lg" /></Link>
            </motion.div>

            {/* Shake wrapper */}
            <motion.div animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}} transition={{ duration: 0.5 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={isSignup ? "signup" : "login"}
                  initial={{ opacity: 0, x: isSignup ? 50 : -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isSignup ? -50 : 50 }}
                  transition={{ type: "spring", stiffness: 120, damping: 18 }}
                >
                  {/* Header */}
                  <div className="mb-8">
                    <motion.h1
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white"
                    >
                      {isSignup ? "Join StudySpace" : "Welcome Back"}
                    </motion.h1>
                    <p className="mt-2 text-sm font-medium text-slate-500 dark:text-white/40">
                      {isSignup ? "Create your account and start booking instantly." : "Sign in to access your dashboard and bookings."}
                    </p>
                  </div>

                  {/* Google Login */}
                  <div className="mb-6 flex justify-center">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => setError("Google Auth Failed")}
                      useOneTap
                      theme="filled_black"
                      shape="pill"
                      width="368"
                    />
                  </div>

                  {/* Divider */}
                  <div className="relative mb-6 flex items-center">
                    <div className="flex-grow border-t border-slate-200 dark:border-white/10" />
                    <span className="mx-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/30">or continue with email</span>
                    <div className="flex-grow border-t border-slate-200 dark:border-white/10" />
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="mb-5 flex items-center gap-3 overflow-hidden rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400"
                      >
                        <span className="h-2 w-2 shrink-0 rounded-full bg-red-400 animate-ping" />
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Form */}
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    {isSignup && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="relative">
                        <User className="absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-white/60" />
                        <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Full Name"
                          className="h-13 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 pl-11 pr-4 py-3.5 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 outline-none transition-all focus:border-primary/50 focus:bg-slate-50 dark:focus:bg-white/8 focus:ring-4 focus:ring-primary/10 backdrop-blur-sm" />
                      </motion.div>
                    )}

                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-white/60" />
                      <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address"
                        className="h-13 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 pl-11 pr-4 py-3.5 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 outline-none transition-all focus:border-primary/50 focus:bg-slate-50 dark:focus:bg-white/8 focus:ring-4 focus:ring-primary/10 backdrop-blur-sm" />
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-white/60" />
                      <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"
                        className="h-13 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 pl-11 pr-4 py-3.5 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 outline-none transition-all focus:border-primary/50 focus:bg-slate-50 dark:focus:bg-white/8 focus:ring-4 focus:ring-primary/10 backdrop-blur-sm" />
                      {!isSignup && (
                        <button type="button" className="absolute right-4 top-1/2 z-10 -translate-y-1/2 text-[10px] font-black uppercase tracking-wider text-primary hover:text-primary/70">Forgot?</button>
                      )}
                    </div>

                    <button type="submit" disabled={isLoading}
                      className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-violet-600 py-4 text-sm font-black uppercase tracking-[0.08em] text-white shadow-2xl shadow-primary/30 transition-all hover:shadow-primary/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {isLoading ? "Verifying..." : (isSignup ? "Create Account" : "Enter Portal")}
                        {!isLoading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                      </span>
                    </button>
                  </form>

                  <p className="mt-6 text-center text-sm font-medium text-slate-500 dark:text-white/30">
                    {isSignup ? "Already a member? " : "New to StudySpace? "}
                    <button onClick={() => { setIsSignup(!isSignup); setError(""); }}
                      className="font-black text-primary transition-colors hover:text-violet-400"
                    >
                      {isSignup ? "Sign in" : "Join free"}
                    </button>
                  </p>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
