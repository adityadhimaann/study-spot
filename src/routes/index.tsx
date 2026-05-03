import { createFileRoute } from "@tanstack/react-router";
import { LandingNav } from "@/components/LandingNav";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import { Shield, Clock, Users, Wifi, CalendarCheck, MapPin } from "lucide-react";
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
  { icon: MapPin, title: "Multiple Locations", desc: "Find available spaces across all library branches." },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                📚 Library Booking Made Simple
              </span>
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground lg:text-5xl xl:text-6xl">
                Book Quiet Zones &{" "}
                <span className="text-primary">Study Rooms</span>{" "}
                Easily
              </h1>
              <p className="mt-5 max-w-lg text-lg text-muted-foreground">
                Find and reserve the perfect study space in your library. Whether you need a quiet corner or a group room, we've got you covered.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button variant="hero" size="lg" asChild>
                  <Link to="/login">Book Now</Link>
                </Button>
                <Button variant="hero-outline" size="lg" asChild>
                  <Link to="/rooms">View Availability</Link>
                </Button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="overflow-hidden rounded-2xl shadow-2xl">
                <img src={heroImage} alt="Students studying in a modern library" width={1280} height={800} className="w-full" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground">Everything You Need</h2>
            <p className="mt-3 text-muted-foreground">Designed to make your study experience seamless and productive.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-border/50 bg-card transition-shadow duration-200 hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                      <f.icon className="h-5 w-5 text-primary" />
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

      {/* CTA */}
      <section id="about" className="py-20">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-3xl font-bold text-foreground">Ready to Focus?</h2>
          <p className="mt-3 text-muted-foreground">
            Join thousands of students who use StudySpace to find their perfect study environment.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button variant="hero" size="lg" asChild>
              <Link to="/login">Get Started Free</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
