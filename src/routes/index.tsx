import { createFileRoute, Link } from "@tanstack/react-router";
import { LandingNav } from "@/components/LandingNav";
import { Footer } from "@/components/Footer";
import { 
  Shield, Clock, Users, Wifi, CalendarCheck, MapPin, ArrowRight, 
  Star, CheckCircle, Zap, BookOpen, ChevronDown, Activity, 
  Sparkles, ShieldCheck 
} from "lucide-react";
import heroImage from "@/assets/hero-illustration.jpg";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { API_URL } from "@/lib/api-config";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

const faqs = [
  {
    q: "How does the library room booking work?",
    a: "You can browse and filter study rooms by capacity, floor, or amenities directly inside your student dashboard. Select your preferred spot from the live blueprint floor map, pick an open date/time slot, and reserve instantly in less than 30 seconds!"
  },
  {
    q: "Can I invite other university partners to my study room?",
    a: "Yes! Once you make a study spot reservation, simply open your booking inside the 'My Bookings' tab, click 'Invite', and type their university email. They will receive the reservation check-in link and location instantly."
  },
  {
    q: "What is the Peer Study Collaboration Board?",
    a: "The Peer Collaboration Board lets students open up their bookings to other library peers. You can publish your scheduled slot as an open session (e.g., 'CS Final exam review'), and other students can browse the board and join your roster!"
  },
  {
    q: "Are the study rooms equipped with amenities?",
    a: "All group rooms are fully equipped with presentation monitors, electrical outlets, double-pane privacy soundproofing, and glass whiteboards. Quiet zones offer personal carrel desks, study partitions, adjustable lamps, and high-speed Wi-Fi."
  },
  {
    q: "Is there a usage limit or booking cost?",
    a: "No! The StudySpace booking service is 100% free and provided by your university library. Focus blocks can be scheduled in 2-hour increments to ensure fair seat utilization for all active students."
  }
];

function LandingPage() {
  const [availableCount, setAvailableCount] = useState<number | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    fetch(`${API_URL}/api/rooms`)
      .then((res) => res.json())
      .then((data) => {
        const count = Array.isArray(data) ? data.filter((r: any) => r.status === "available").length : 0;
        setAvailableCount(count);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden pt-16">
      <LandingNav />

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden bg-[#050510]">
        {/* Animated background composite blurs */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-primary/20 blur-[140px] will-change-transform"
          />
          <motion.div
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, delay: 2 }}
            className="absolute bottom-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-violet-600/20 blur-[160px] will-change-transform"
          />
          {/* Engineering coordinate grids */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M0%200h60v60H0z%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%200v60M60%200v60M0%200h60M0%2060h60%22%20stroke%3D%22rgba(99,102,241,0.03)%22%20stroke-width%3D%221%22%2F%3E%3C%2Fsvg%3E')] opacity-75" />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 mx-auto max-w-7xl w-full px-6 py-24 lg:py-32 will-change-transform">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            
            {/* Left Column Text details */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2 text-sm font-bold text-primary backdrop-blur-sm shadow-inner animate-pulse"
              >
                <span className="h-2 w-2 rounded-full bg-primary" />
                {availableCount !== null ? `${availableCount} Private Study Rooms Open Now` : "Live Seat Allocation Nominal"}
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-5xl font-black leading-[1.05] tracking-tighter text-white lg:text-6xl xl:text-7xl uppercase"
              >
                Find Your{" "}
                <span className="relative">
                  <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">Optimal Spot</span>
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 1, duration: 0.8 }}
                    className="absolute -bottom-1 left-0 h-1.5 w-full origin-left rounded-full bg-gradient-to-r from-primary to-violet-400"
                  />
                </span>
                {" "}Today.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="mt-6 max-w-xl text-base font-semibold leading-relaxed text-white/50"
              >
                Instantly secure state-of-the-art quiet zones, soundproof group study hubs, and collaboration suites inside your university library. All linked in one premium check-in system.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-10 flex flex-col sm:flex-row items-start gap-4"
              >
                <Link
                  to="/login"
                  className="group relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-primary px-8 text-sm font-extrabold uppercase tracking-wide text-white shadow-2xl shadow-primary/30 transition-all hover:scale-105 hover:shadow-primary/50"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="relative z-10">Reserve My Workspace</span>
                  <ArrowRight className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/rooms"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/15 px-8 text-sm font-bold text-white/80 backdrop-blur-sm transition-all hover:bg-white/5 hover:border-white/30"
                >
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Browse Maps
                </Link>
              </motion.div>

              {/* Social ratings */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-8 flex items-center gap-4 border-t border-white/5 pt-6 w-fit"
              >
                <div className="flex -space-x-3">
                  {["SK", "JL", "MP", "DR"].map((i) => (
                    <div key={i} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#050510] bg-gradient-to-br from-primary to-violet-600 text-[10px] font-black text-white shadow-lg">{i}</div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-xs font-bold text-white/40">Highly trusted by 1,200+ library scholars</p>
                </div>
              </motion.div>
            </div>

            {/* Right Column Dashboard & Live Occupancy widget */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.2 }}
              className="relative space-y-6"
            >
              {/* Graphic Mockup Frame */}
              <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(99,102,241,0.25)]">
                <img src={heroImage} alt="Students studying" className="w-full h-auto mix-blend-luminosity brightness-110" />
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-[#050510]/80 via-transparent to-transparent" />
                <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-primary/30 via-transparent to-violet-500/30 blur-sm" />
              </div>

              {/* High-End Real-Time Occupancy Card widget */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="absolute -left-6 bottom-10 flex flex-col gap-3 rounded-3xl border border-white/10 bg-slate-950/90 p-5 shadow-2xl backdrop-blur-xl max-w-sm w-80"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Library Live Stats</span>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-300 text-[8px] font-bold">
                    SYSTEM NOMINAL
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                  <div>
                    <p className="text-white/40 text-[9px] uppercase tracking-wider">Occupancy Rate</p>
                    <p className="text-base font-black text-white mt-0.5">78% Capacity</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-[9px] uppercase tracking-wider">Active Bookings</p>
                    <p className="text-base font-black text-white mt-0.5">420 Allocated</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-white/5 overflow-hidden rounded-full p-0.25 border border-white/5 flex">
                    <div style={{ width: "78%" }} className="h-full rounded-full bg-emerald-500 animate-pulse" />
                  </div>
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
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group text-center"
              >
                <div className="mb-2 flex justify-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 transition-all group-hover:bg-primary/20 group-hover:scale-110">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <p className="text-3xl font-black tracking-tighter text-foreground uppercase">{stat.value}</p>
                <p className="mt-1 text-sm font-semibold text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─────────────────────────────────────────── */}
      <section id="features" className="py-28">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary tracking-widest uppercase">Why Choose Us</span>
            <h2 className="text-4xl font-black tracking-tighter text-foreground lg:text-5xl uppercase">Everything Engineered<br />For Your Focus</h2>
            <p className="mt-4 text-sm font-semibold text-muted-foreground max-w-lg mx-auto">
              Every detail and system is optimized to eliminate study bottlenecks so you can dedicate 100% of your energy to learning.
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group relative overflow-hidden rounded-3xl border border-border/50 bg-card/60 p-7 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 cursor-default"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
                <div className={`mb-5 inline-flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-br ${f.gradient} p-3 shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                  <f.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-card-foreground">{f.title}</h3>
                <p className="text-xs leading-relaxed font-semibold text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─────────────────────────────────────── */}
      <section className="overflow-hidden border-t bg-muted/10 py-28">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <span className="mb-4 inline-block rounded-full bg-amber-500/10 px-4 py-1.5 text-xs font-bold text-amber-500 tracking-widest uppercase">Student Reviews</span>
            <h2 className="text-4xl font-black tracking-tighter text-foreground lg:text-5xl uppercase">What Scholars Say</h2>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group flex flex-col justify-between rounded-3xl border border-border/50 bg-card/60 p-6 backdrop-blur-sm transition-all hover:border-primary/20 hover:shadow-xl hover:-translate-y-1"
              >
                <div>
                  <div className="mb-3 flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-xs font-semibold leading-relaxed text-muted-foreground">"{t.quote}"</p>
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

      {/* ─── FAQ ACCORDION SECTION ─────────────────────────────────── */}
      <section className="py-24 border-t bg-muted/5">
        <div className="mx-auto max-w-3xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary tracking-widest uppercase">FAQ Support</span>
            <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase">Frequently Asked Questions</h2>
            <p className="mt-3 text-xs font-bold text-muted-foreground">Everything you need to know about quiet study spots and collaborations.</p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "rounded-2xl border transition-all duration-300 overflow-hidden bg-card/60 backdrop-blur-sm",
                    isOpen ? "border-primary/30 ring-1 ring-primary/15" : "border-border/50"
                  )}
                >
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-accent/15"
                  >
                    <span className="text-sm font-bold text-foreground pr-4">{faq.q}</span>
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-300", isOpen && "transform rotate-180 text-primary")} />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden bg-[#080816]/30 border-t border-border/10"
                      >
                        <p className="p-5 text-xs leading-relaxed font-semibold text-muted-foreground">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────── */}
      <section id="about" className="relative overflow-hidden bg-[#050510] py-32">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-violet-600/10 to-transparent" />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/20 blur-[120px] rounded-full will-change-transform"
          />
        </div>
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="mb-6 inline-block rounded-full border border-primary/30 bg-primary/10 px-5 py-2 text-sm font-bold text-primary tracking-widest uppercase">Start For Free</span>
            <h2 className="text-5xl font-black tracking-tighter text-white lg:text-6xl uppercase">Ready to Secure Your<br />
              <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">Private Spot?</span>
            </h2>
            <p className="mt-6 text-base text-white/50 font-semibold max-w-lg mx-auto">
              Unlock gigabit Wi-Fi, acoustically insulated walls, and lofi focus hubs. Bookings take less than 30 seconds.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/login"
                className="group relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-primary px-10 text-sm font-extrabold uppercase tracking-widest text-white shadow-2xl shadow-primary/40 transition-all hover:scale-105 hover:shadow-primary/60"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative z-10">Start booking</span>
                <ArrowRight className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/rooms"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/20 px-8 text-sm font-bold text-white/70 backdrop-blur-sm transition-all hover:bg-white/5 hover:text-white"
              >
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
export default LandingPage;
