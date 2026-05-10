import { createFileRoute, Link } from "@tanstack/react-router";
import { API_URL } from "@/lib/api-config";
import { Button } from "@/components/ui/button";
import { Mail, Lock, ArrowRight, User, Sparkles, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useState } from "react";
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

const illustrationPath = "/login-illustration.png";

function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "39962002042-acubos9hbsrj9qsce5ptl86n59h12181.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="flex min-h-screen w-full bg-background selection:bg-primary/30">
        {/* Left Side: Illustration (Desktop Only) */}
        <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-muted/30 lg:flex">
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 1.2, ease: "easeOut" }}
             className="absolute inset-0 z-0"
           >
             <img 
               src={illustrationPath} 
               alt="Study Illustration" 
               className="h-full w-full object-cover"
             />
             <div className="absolute inset-0 bg-black/40" />
           </motion.div>

           <div className="relative z-10 p-12 text-center">
             <motion.h2 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.7 }}
               className="text-4xl font-bold tracking-tight text-white drop-shadow-2xl"
             >
               Focused Environment,<br/> Better Results.
             </motion.h2>
             <motion.p 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.9 }}
               className="mt-4 text-lg text-white/90 font-medium drop-shadow-lg"
             >
               Join thousands of students optimizing their study time.
             </motion.p>
           </div>

           {/* Floating badges for visual flair */}
           <motion.div 
             animate={{ y: [0, -10, 0] }}
             transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
             className="absolute bottom-12 left-12 flex items-center gap-3 rounded-2xl border bg-background/40 p-4 backdrop-blur-xl"
           >
             <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/20 text-success">
               <ShieldCheck className="h-5 w-5" />
             </div>
             <div>
               <p className="text-xs font-bold uppercase text-muted-foreground">Trusted by</p>
               <p className="text-sm font-bold text-foreground">15+ Universities</p>
             </div>
           </motion.div>
        </div>

        {/* Right Side: Form */}
        <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
          <div className="w-full max-w-md">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-10"
            >
              <Link to="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Logo size="lg" />
              </Link>
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div
                key={isSignup ? "signup" : "login"}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    {isSignup ? "Start your journey" : "Welcome back"}
                  </h1>
                  <p className="mt-2 text-muted-foreground">
                    {isSignup ? "Create an account to access premium features." : "Log in to your dashboard to manage your spots."}
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="w-full">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => setError("Google Auth Failed")}
                      useOneTap
                      theme="outline"
                      shape="pill"
                      width="100%"
                    />
                  </div>
                  
                  <div className="relative flex items-center">
                    <span className="w-full border-t" />
                    <span className="bg-background px-3 text-xs uppercase text-muted-foreground">or email</span>
                    <span className="w-full border-t" />
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive"
                  >
                    {error}
                  </motion.div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>
                  {isSignup && (
                    <div className="group space-y-1.5">
                      <label className="text-sm font-semibold text-muted-foreground transition-colors group-focus-within:text-primary">Name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input 
                          type="text" 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your Name" 
                          className="h-12 w-full rounded-2xl border bg-muted/30 pl-11 pr-4 text-sm outline-none ring-primary/20 transition-all focus:border-primary focus:ring-4" 
                        />
                      </div>
                    </div>
                  )}

                  <div className="group space-y-1.5">
                    <label className="text-sm font-semibold text-muted-foreground transition-colors group-focus-within:text-primary">Email or ID</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@university.edu" 
                        className="h-12 w-full rounded-2xl border bg-muted/30 pl-11 pr-4 text-sm outline-none ring-primary/20 transition-all focus:border-primary focus:ring-4" 
                      />
                    </div>
                  </div>

                  <div className="group space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-muted-foreground transition-colors group-focus-within:text-primary">Password</label>
                      {!isSignup && <Link to="/login" className="text-xs text-primary hover:underline">Forgot password?</Link>}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••" 
                        className="h-12 w-full rounded-2xl border bg-muted/30 pl-11 pr-4 text-sm outline-none ring-primary/20 transition-all focus:border-primary focus:ring-4" 
                      />
                    </div>
                  </div>

                  <Button className="w-full h-12 rounded-2xl group shadow-lg shadow-primary/20" variant="hero" type="submit" disabled={isLoading}>
                    {isLoading ? "Verifying..." : (isSignup ? "Create free account" : "Log in to portal")}
                    {!isLoading && <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />}
                  </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground">
                  {isSignup ? "Already a member?" : "New to StudySpace?"}{" "}
                  <button 
                    onClick={() => { setIsSignup(!isSignup); setError(""); }} 
                    className="font-bold text-primary hover:underline transition-all"
                  >
                    {isSignup ? "Sign in" : "Register now"}
                  </button>
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
