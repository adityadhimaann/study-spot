import { createFileRoute } from "@tanstack/react-router";
import { LandingNav } from "@/components/LandingNav";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import { Shield, Clock, Users, Wifi, CalendarCheck, MapPin, ArrowRight, Sparkles, Star, CheckCircle } from "lucide-react";
import heroImage from "@/assets/hero-illustration.jpg";
import { motion } from "framer-motion";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "StudySpace — Book Quiet Zones & Study Rooms Easily" },
      { name: "description", content: "Reserve quiet zones and group study rooms in your library with ease. Simple booking, real-time availability." },
      { property: "og:title", content: "StudySpace — Book Quiet Zones & Study Rooms Easily" },
      { property: "og:description", content: "Reserve quiet zones and group study rooms in your library with ease." },
    ],
  }),
});

const features = [
  { icon: Clock, title: "Instant Booking", desc: "Reserve your spot in seconds with our streamlined booking flow." },
  { icon: Shield, title: "Guaranteed Quiet", desc: "Quiet zones are monitored to ensure a distraction-free environment." },
  { icon: Users, title: "Group Rooms", desc: "Collaborative spaces for team projects and study groups." },
  { icon: Wifi, title: "Fast Wi-Fi", desc: "All rooms equipped with high-speed internet connectivity." },
  { icon: CalendarCheck, title: "Flexible Scheduling", desc: "Book by the hour or full day — whatever fits your schedule." },
  { icon: MapPin, title: "Interactive Map", desc: "Visual floor map to find and book rooms instantly." },
];

const testimonials = [
  { name: "Sarah K.", role: "CS Student", quote: "StudySpace made finding quiet study spots so much easier. I love the floor map feature!", rating: 5 },
  { name: "James L.", role: "Engineering", quote: "Our study group uses this every week. The booking wizard is super intuitive.", rating: 5 },
  { name: "Maya P.", role: "Literature", quote: "Finally, no more wandering around the library looking for an empty room!", rating: 4 },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
              >
                 Library Booking Made Simple
              </motion.span>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground lg:text-5xl xl:text-6xl">
                Book Quiet Zones &{" "}
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Study Rooms</span>{" "}
                Easily
              </h1>
              <p className="mt-5 max-w-lg text-lg text-muted-foreground">
                Find and reserve the perfect study space in your library. Whether you need a quiet corner or a group room, we've got you covered.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button variant="hero" size="lg" asChild className="group">
                  <Link to="/login">
                    Book Now
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button variant="hero-outline" size="lg" asChild>
                  <Link to="/rooms">View Availability</Link>
                </Button>
              </div>
              <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex -space-x-2">
                  {["JD", "SK", "JL", "MP"].map((initials) => (
                    <div key={initials} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary/20 text-[10px] font-bold text-primary">
                      {initials}
                    </div>
                  ))}
                </div>
                <span>1,200+ students already booking</span>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.92 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ duration: 0.7, delay: 0.2 }} 
              className="relative group"
            >
              {/* Glass decorative background */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-primary/0 rounded-[3rem] blur-2xl opacity-50 group-hover:opacity-80 transition-opacity" />
              
              <div className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/5 p-1 shadow-2xl backdrop-blur-sm">
                <img 
                  src={heroImage} 
                  alt="Students studying in a modern library" 
                  width={1280} 
                  height={800} 
                  className="w-full h-full object-cover rounded-[2.2rem] mix-blend-multiply dark:brightness-110 dark:contrast-110" 
                />
              </div>

              {/* Floating badges for extra 'WOW' factor */}
              <motion.div 
                animate={{ y: [0, -10, 0] }} 
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 -right-6 rounded-2xl bg-card/90 p-4 shadow-xl border border-border/50 backdrop-blur-md hidden sm:block"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center text-success">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Availability</p>
                    <p className="text-sm font-bold">12 Rooms Free</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t bg-muted/20 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground">Everything You Need</h2>
            <p className="mt-3 text-muted-foreground">Designed to make your study experience seamless and productive.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.08 }} viewport={{ once: true }}>
                <Card className="group h-full border-border/40 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 transition-transform group-hover:scale-110">
                      <f.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-1.5 text-base font-semibold text-card-foreground">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground">What Students Say</h2>
            <p className="mt-3 text-muted-foreground">Hear from fellow students who use StudySpace daily.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
                <Card className="h-full border-border/40 bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="mb-3 flex gap-0.5">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                      ))}
                    </div>
                    <p className="mb-4 text-sm text-muted-foreground italic">"{t.quote}"</p>
                    <div>
                      <p className="text-sm font-semibold text-card-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="about" className="border-t bg-gradient-to-b from-primary/5 to-transparent py-20">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-3xl font-bold text-foreground">Ready to Focus?</h2>
          <p className="mt-3 text-muted-foreground">
            Join thousands of students who use StudySpace to find their perfect study environment.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button variant="hero" size="lg" asChild className="group">
              <Link to="/login">
                Get Started Free
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
