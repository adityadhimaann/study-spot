import { createFileRoute, Link } from "@tanstack/react-router";
import { API_URL } from "@/lib/api-config";
import { Button } from "@/components/ui/button";
import { Mail, Lock, ArrowRight, User, ArrowLeft, Sparkles } from "lucide-react";
import { Logo } from "@/components/Logo";
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

const illustrationPath = "/login-illustration.png";

function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Shake animation for error
  const [shake, setShake] = useState(false);
  useEffect(() => {
    if (error) {
      setShake(true);
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
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

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "39962002042-acubos9hbsrj9qsce5ptl86n59h12181.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="flex min-h-screen w-full bg-background selection:bg-primary/30 overflow-hidden">
        
        {/* Animated Background Particles */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-[160px] animate-pulse delay-700" />
        </div>

        {/* Left Side: Illustration */}
        <div className="relative hidden w-[45%] flex-col items-center justify-center overflow-hidden bg-black lg:flex">
           <motion.div 
             animate={{ scale: [1, 1.05, 1] }}
             transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
             className="absolute inset-0 z-0 opacity-80"
           >
             <img 
               src={illustrationPath} 
               alt="Study Illustration" 
               className="h-full w-full object-cover grayscale-[0.2]"
             />
             <div className="absolute inset-0 bg-black/40" />
           </motion.div>

           <div className="relative z-10 p-16 text-center">
             <motion.div
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-[2rem] bg-white/10 backdrop-blur-2xl border border-white/20"
             >
               <Sparkles className="h-10 w-10 text-white animate-bounce" />
             </motion.div>
             <motion.h2 
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="text-5xl font-black tracking-tighter text-white drop-shadow-2xl leading-[1.1]"
             >
               ELEVATE YOUR<br/>
               <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">STUDY FLOW.</span>
             </motion.h2>
             <motion.p 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.6 }}
               className="mt-6 text-xl text-white/70 font-medium max-w-md mx-auto leading-relaxed"
             >
               Join the next generation of students mastering their environment.
             </motion.p>
           </div>
        </div>

        {/* Right Side: Form Content */}
        <div className="relative flex w-full flex-col items-center justify-center px-6 lg:w-[55%]">
          
          {/* Back Button */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-8 right-8 z-50"
          >
            <Button variant="ghost" asChild className="group gap-2 rounded-full px-6 hover:bg-primary/10 transition-all">
              <Link to="/">
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Return Home
              </Link>
            </Button>
          </motion.div>

          <div className="w-full max-w-md relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12 flex justify-center lg:justify-start"
            >
              <Link to="/" className="inline-flex items-center gap-3 group">
                <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:rotate-6 transition-transform">
                  <Logo size="md" className="invert" />
                </div>
                <span className="text-xl font-black tracking-tighter uppercase italic">StudySpace</span>
              </Link>
            </motion.div>

            <motion.div
              animate={shake ? { x: [-5, 5, -5, 5, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isSignup ? "signup" : "login"}
                  initial={{ opacity: 0, x: isSignup ? 40 : -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isSignup ? -40 : 40 }}
                  transition={{ type: "spring", damping: 20, stiffness: 100 }}
                  className="space-y-8"
                >
                  <header>
                    <h1 className="text-4xl font-black tracking-tighter text-foreground">
                      {isSignup ? "CREATE ACCOUNT" : "WELCOME BACK"}
                    </h1>
                    <p className="mt-2 text-muted-foreground font-medium">
                      {isSignup ? "Start your focus journey today." : "Glad to see you again, let's get to work."}
                    </p>
                  </header>

                  <div className="space-y-6">
                    <div className="w-full group">
                      <div className="transition-transform group-hover:scale-[1.02] active:scale-[0.98]">
                        <GoogleLogin
                          onSuccess={handleGoogleSuccess}
                          onError={() => setError("Google Auth Failed")}
                          useOneTap
                          theme="filled_blue"
                          shape="circle"
                          width="100%"
                        />
                      </div>
                    </div>
                    
                    <div className="relative flex items-center py-2">
                      <div className="flex-grow border-t border-border/50" />
                      <span className="mx-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">OR SECURE LOGIN</span>
                      <div className="flex-grow border-t border-border/50" />
                    </div>
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm font-semibold text-destructive flex items-center gap-3"
                    >
                      <div className="h-2 w-2 rounded-full bg-destructive animate-ping" />
                      {error}
                    </motion.div>
                  )}

                  <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="grid gap-5">
                      {isSignup && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="group relative"
                        >
                          <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                          <input 
                            type="text" 
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Full Name" 
                            className="h-14 w-full rounded-2xl border-2 border-transparent bg-muted/50 pl-12 pr-4 text-sm font-semibold outline-none transition-all focus:border-primary/20 focus:bg-background focus:ring-[6px] focus:ring-primary/5" 
                          />
                        </motion.div>
                      )}

                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="group relative"
                      >
                        <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Email Address" 
                          className="h-14 w-full rounded-2xl border-2 border-transparent bg-muted/50 pl-12 pr-4 text-sm font-semibold outline-none transition-all focus:border-primary/20 focus:bg-background focus:ring-[6px] focus:ring-primary/5" 
                        />
                      </motion.div>

                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="group relative"
                      >
                        <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <input 
                          type="password" 
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Password" 
                          className="h-14 w-full rounded-2xl border-2 border-transparent bg-muted/50 pl-12 pr-4 text-sm font-semibold outline-none transition-all focus:border-primary/20 focus:bg-background focus:ring-[6px] focus:ring-primary/5" 
                        />
                        {!isSignup && (
                          <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-wider text-primary hover:text-primary/70">
                            Forgot?
                          </button>
                        )}
                      </motion.div>
                    </div>

                    <motion.div
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: 0.4 }}
                    >
                      <Button className="w-full h-14 rounded-2xl group relative overflow-hidden bg-primary shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all active:scale-[0.98]" variant="hero" type="submit" disabled={isLoading}>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        <span className="relative z-10 font-black tracking-[0.05em] uppercase">
                          {isLoading ? "AUTHENTICATING..." : (isSignup ? "CREATE ACCOUNT" : "ENTER PORTAL")}
                        </span>
                        {!isLoading && <ArrowRight className="relative z-10 ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />}
                      </Button>
                    </motion.div>
                  </form>

                  <footer className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                      {isSignup ? "ALREADY A MEMBER?" : "NEED AN ACCOUNT?"}{" "}
                      <button 
                        onClick={() => { setIsSignup(!isSignup); setError(""); }} 
                        className="font-black text-primary hover:text-primary/70 tracking-tighter uppercase transition-colors ml-1"
                      >
                        {isSignup ? "Sign In" : "Join Now"}
                      </button>
                    </p>
                  </footer>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
