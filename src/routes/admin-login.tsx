import { useState } from "react";
import { API_URL } from "@/lib/api-config";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Lock, Mail, ArrowRight, Shield } from "lucide-react";
import { Logo } from "@/components/Logo";
import { motion } from "framer-motion";

export const Route = createFileRoute("/admin-login")({
  component: AdminLoginPage,
  head: () => ({ meta: [{ title: "Admin Login — StudySpace" }] }),
});

function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      if (data.user.role !== "admin") {
        throw new Error("Access denied. Admin privileges required.");
      }
      
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      window.location.href = "/admin";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-destructive/5 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center justify-center text-foreground">
            <Logo size="lg" />
          </Link>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-destructive/20 bg-card/80 p-8 shadow-2xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 p-4">
            <Shield className="h-16 w-16 text-destructive/10" />
          </div>

          <h1 className="mb-1 text-2xl font-bold text-card-foreground">Admin Portal</h1>
          <p className="mb-6 text-sm text-muted-foreground">Authorized personnel only.</p>

          {error && (
            <div className="mb-4 rounded-lg bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@studyspace.com" 
                  className="h-11 w-full rounded-xl border bg-background/80 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/50 transition-all" 
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="h-11 w-full rounded-xl border bg-background/80 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/50 transition-all" 
                />
              </div>
            </div>

            <Button className="w-full group bg-destructive hover:bg-destructive/90 text-destructive-foreground" size="lg" type="submit" disabled={isLoading}>
              {isLoading ? "Authenticating..." : "Admin Login"}
              {!isLoading && <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Student?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Student Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
