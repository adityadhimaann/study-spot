import { Link } from "@tanstack/react-router";
import { BookOpen, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "Rooms", to: "/rooms" },
  { label: "About", href: "/#about" },
];

export function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5 font-heading text-lg font-bold text-foreground">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          StudySpace
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) =>
            link.to ? (
              <Link key={link.label} to={link.to} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                {link.label}
              </Link>
            ) : (
              <a key={link.label} href={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                {link.label}
              </a>
            )
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" asChild>
            <Link to="/login">Log in</Link>
          </Button>
          <Button variant="default" asChild>
            <Link to="/login">Sign up</Link>
          </Button>
        </div>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {mobileOpen && (
        <div className="border-t bg-background px-6 pb-4 pt-2 md:hidden">
          {navLinks.map((link) =>
            link.to ? (
              <Link key={link.label} to={link.to} className="block py-2 text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>
                {link.label}
              </Link>
            ) : (
              <a key={link.label} href={link.href} className="block py-2 text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>
                {link.label}
              </a>
            )
          )}
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/login">Log in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/login">Sign up</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
