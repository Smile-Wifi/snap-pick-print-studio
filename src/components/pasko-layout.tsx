import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BrandLockup({ footer = false }: { footer?: boolean }) {
  return (
    <Link to="/" className={`brand-lockup${footer ? " footer-brand" : ""}`} aria-label="Pasko Photo Magic home">
      <span className="brand-mark" aria-hidden="true">🎄</span>
      <span>Pasko <span className="brand-color">Photo</span> <span className="brand-gold">Magic</span></span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <BrandLockup />
        <nav className="site-nav" aria-label="Main navigation">
          <Link to="/">⌂ Home</Link>
          <Link to="/" hash="how-it-works">How It Works</Link>
          <Link to="/" hash="sample-photos">Sample Photos</Link>
          <Link to="/" hash="pricing">Pricing</Link>
          <Link to="/" hash="faq">FAQ</Link>
          <Link to="/" hash="track-order">Track Order</Link>
        </nav>
        <span className="language-label">EN · FIL</span>
        <Button size="sm" asChild><Link to="/create">Create</Link></Button>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer" id="track-order">
      <div className="site-footer-inner">
        <div className="footer-top">
          <div>
            <BrandLockup footer />
            <p className="mt-3 text-sm">Capture · Create · Share the Christmas Joy!</p>
          </div>
          <nav className="footer-nav" aria-label="Footer navigation">
            <Link to="/">Home</Link>
            <Link to="/" hash="how-it-works">How It Works</Link>
            <Link to="/" hash="pricing">Pricing</Link>
            <Link to="/" hash="sample-photos">Sample Photos</Link>
            <Link to="/" hash="faq">FAQ</Link>
            <a href="mailto:hello@paskophotomagic.com">Contact Us <ArrowUpRight size={12} className="inline-block" /></a>
          </nav>
        </div>
        <p className="footer-note">Made with ❤️ in the Philippines 🇵🇭 · © 2026 Pasko Photo Magic</p>
      </div>
    </footer>
  );
}