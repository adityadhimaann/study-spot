import { createFileRoute, Link } from "@tanstack/react-router";
import { LandingNav } from "@/components/LandingNav";
import { Footer } from "@/components/Footer";
import { Shield, Clock, Users, Wifi, CalendarCheck, MapPin, ArrowRight, Star, CheckCircle, Zap, BookOpen } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { API_URL } from "@/lib/api-config";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "StudySpace — Book Quiet Zones & Study Rooms Easily" },
      { name: "description", content: "Reserve quiet zones and group study rooms in your library with ease. Simple booking, real-time availability." },
    ],
  }),
});

const features = [
  { icon: Clock, title: "Instant Booking", desc: "Reserve your perfect spot in seconds with our streamlined booking system.", gradient: "from-blue-500 to-cyan-500" },
  { icon: Shield, title: "Guaranteed Quiet", desc: "Monitored quiet zones engineered for deep focus and zero distractions.", gradient: "from-violet-500 to-purple-500" },
  { icon: Users, title: "Group Rooms", desc: "Premium collaborative spaces equipped for team projects and study groups.", gradient: "from-pink-500 to-rose-500" },
  { icon: Wifi, title: "Fast Wi-Fi", desc: "Gigabit internet in every room — stream, download, and collaborate seamlessly.", gradient: "from-amber-500 to-orange-500" },
  { icon: CalendarCheck, title: "Flexible Scheduling", desc: "Book by the hour or full-day sessions — total flexibility, zero hassle.", gradient: "from-emerald-500 to-teal-500" },
  { icon: MapPin, title: "Live Floor Map", desc: "Real-time visual floor map — see availability at a glance and book instantly.", gradient: "from-indigo-500 to-blue-500" },
];

const testimonials = [
  { name: "Sarah K.", role: "Computer Science", quote: "StudySpace completely changed how I study. Finding a quiet room used to take 20 mins — now it's instant.", rating: 5, avatar: "SK" },
  { name: "James L.", role: "Engineering", quote: "Our study group books rooms every week. The floor map is genius — we can see exactly what's free.", rating: 5, avatar: "JL" },
  { name: "Maya P.", role: "Literature", quote: "No more wandering the library! I booked a private room in 30 seconds. Absolute game changer.", rating: 5, avatar: "MP" },
  { name: "David R.", role: "Medicine", quote: "The real-time availability is spot on. Never had a booking conflict once since I started using this.", rating: 5, avatar: "DR" },
];

const stats = [
  { value: "1,200+", label: "Active Students", icon: Users },
  { value: "50+", label: "Study Rooms", icon: BookOpen },
  { value: "98%", label: "Satisfaction Rate", icon: Star },
  { value: "< 30s", label: "Avg. Booking Time", icon: Zap },
];

function AnimatedCounter({ value }: { value: string }) {
  return <span>{value}</span>;
}

function LandingPage() {
  const [availableCount, setAvailableCount] = useState<number | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    fetch(`${API_URL}/api/rooms`)
      .then(res => res.json())
      .then(data => {
        const count = Array.isArray(data) ? data.filter((r: any) => r.status === "available").length : 0;
        setAvailableCount(count);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <LandingNav />

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden bg-[#050510]">
        {/* Animated background orbs */}
        <div className="absolute inset-0 z-0">
          <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 8, repeat: Infinity }} className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-primary/30 blur-[140px]" />
          <motion.div animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 10, repeat: Infinity, delay: 2 }} className="absolute bottom-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-violet-600/25 blur-[160px]" />
          <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 12, repeat: Infinity, delay: 4 }} className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[120px]" />
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M0%200h60v60H0z%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%200v60M60%200v60M0%200h60M0%2060h60%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.03)%22%20stroke-width%3D%221%22%2F%3E%3C%2Fsvg%3E')] opacity-60" />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 mx-auto max-w-7xl w-full px-6 py-24 lg:py-32">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Left: Text */}
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2 text-sm font-semibold text-primary backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                {availableCount !== null ? `${availableCount} Rooms Available Right Now` : "Real-Time Room Availability"}
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="text-5xl font-black leading-[1.05] tracking-tighter text-white lg:text-6xl xl:text-7xl">
                Your Perfect{" "}
                <span className="relative">
                  <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">Study Space</span>
                  <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1, duration: 0.8 }} className="absolute -bottom-1 left-0 h-1 w-full origin-left rounded-full bg-gradient-to-r from-primary to-violet-400" />
                </span>
                {" "}Awaits.
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }} className="mt-6 max-w-xl text-lg font-medium leading-relaxed text-white/60">
                Find and reserve the perfect study room in your library — instantly. Quiet zones, group rooms, and everything in between, all in one place.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link to="/login" className="group relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-primary px-8 text-base font-bold text-white shadow-2xl shadow-primary/40 transition-all hover:shadow-primary/60 hover:scale-105 active:scale-95">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="relative z-10">Book a Room Now</span>
                  <ArrowRight className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link to="/rooms" className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/15 px-8 text-base font-bold text-white/80 backdrop-blur-sm transition-all hover:bg-white/5 hover:border-white/30 active:scale-95">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  View Availability
                </Link>
              </motion.div>

              {/* Social proof */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-8 flex items-center gap-4">
                <div className="flex -space-x-3">
                  {["SK", "JL", "MP", "DR"].map((i) => (
                    <div key={i} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#050510] bg-gradient-to-br from-primary to-violet-600 text-[10px] font-black text-white shadow-lg">{i}</div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-sm font-medium text-white/50">Loved by 1,200+ students</p>
                </div>
              </motion.div>
            </div>

            {/* Right: Dashboard Mockup */}
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9, delay: 0.2 }} className="relative">
              <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_80px_rgba(99,102,241,0.3)]">
                <img src="/hero-mockup.png" alt="StudySpace Dashboard" className="w-full h-auto" />
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-[#050510]/60 via-transparent to-transparent" />
              </div>
              {/* Floating badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                animate2={{ y: [0, -8, 0] }}
                className="absolute -left-6 bottom-16 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl shadow-2xl"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">LIVE</p>
                  <p className="text-sm font-bold text-white">{availableCount !== null ? `${availableCount} Rooms Free` : "12 Rooms Free"}</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ─── STATS BAR ────────────────────────────────────────── */}
      <section className="border-y border-border/40 bg-muted/20 py-12 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="group text-center">
                <div className="mb-2 flex justify-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 transition-all group-hover:bg-primary/20 group-hover:scale-110">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <p className="text-3xl font-black tracking-tighter text-foreground">{stat.value}</p>
                <p className="mt-1 text-sm font-medium text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─────────────────────────────────────────── */}
      <section id="features" className="py-28">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16 text-center">
            <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-bold text-primary">WHY STUDYSPACE</span>
            <h2 className="text-4xl font-black tracking-tighter text-foreground lg:text-5xl">Everything You Need<br />to Study Smarter</h2>
            <p className="mt-4 text-lg text-muted-foreground">Built by students, for students. Every feature designed to save you time and maximize focus.</p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group relative overflow-hidden rounded-3xl border border-border/50 bg-card/60 p-7 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 cursor-default"
              >
                {/* Hover glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
                <div className={`mb-5 inline-flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-br ${f.gradient} p-3 shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                  <f.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-card-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─────────────────────────────────────── */}
      <section className="overflow-hidden border-t bg-muted/10 py-28">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16 text-center">
            <span className="mb-4 inline-block rounded-full bg-amber-500/10 px-4 py-1.5 text-sm font-bold text-amber-500">STUDENT REVIEWS</span>
            <h2 className="text-4xl font-black tracking-tighter text-foreground lg:text-5xl">What Students Say</h2>
            <p className="mt-4 text-lg text-muted-foreground">Real experiences from students who transformed their study habits.</p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="group flex flex-col justify-between rounded-3xl border border-border/50 bg-card/60 p-6 backdrop-blur-sm transition-all hover:border-primary/20 hover:shadow-xl hover:-translate-y-1"
              >
                <div>
                  <div className="mb-3 flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">"{t.quote}"</p>
                </div>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-600 text-xs font-black text-white">{t.avatar}</div>
                  <div>
                    <p className="text-sm font-bold text-card-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────── */}
      <section id="about" className="relative overflow-hidden bg-[#050510] py-32">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-violet-600/10 to-transparent" />
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 8, repeat: Infinity }} className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/20 blur-[120px] rounded-full" />
        </div>
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="mb-6 inline-block rounded-full border border-primary/30 bg-primary/10 px-5 py-2 text-sm font-bold text-primary">GET STARTED FREE</span>
            <h2 className="text-5xl font-black tracking-tighter text-white lg:text-6xl">Ready to Find Your<br />
              <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">Focus Zone?</span>
            </h2>
            <p className="mt-6 text-xl text-white/60 font-medium">Join 1,200+ students who book smarter. It takes less than 30 seconds to get started.</p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/login" className="group relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-primary px-10 text-base font-bold text-white shadow-2xl shadow-primary/40 transition-all hover:scale-105 hover:shadow-primary/60 active:scale-95">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative z-10">Start For Free</span>
                <ArrowRight className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/rooms" className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/20 px-8 text-base font-bold text-white/70 backdrop-blur-sm transition-all hover:bg-white/5 hover:text-white">
                Explore Rooms
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
