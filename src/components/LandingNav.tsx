import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState } from "react";

const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "Rooms", to: "/rooms" },
  { label: "About", href: "/#about" },
];

export function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="text-foreground">
          <Logo />
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

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Button variant="ghost" asChild><Link to="/login">Log in</Link></Button>
          <Button variant="default" asChild><Link to="/login">Sign up</Link></Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t bg-background/95 px-6 pb-4 pt-2 backdrop-blur-xl md:hidden">
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
            <Button variant="outline" size="sm" asChild><Link to="/login">Log in</Link></Button>
            <Button size="sm" asChild><Link to="/login">Sign up</Link></Button>
          </div>
        </div>
      )}
    </header>
  );
}
