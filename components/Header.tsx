"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV, SITE } from "@/lib/site";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <svg aria-hidden viewBox="0 0 40 40" className="h-9 w-9" fill="none" stroke="currentColor" strokeLinecap="round">
        <circle cx="20" cy="20" r="18.5" strokeWidth="1.3" />
        <path d="M8 24a12 12 0 0 1 24 0M12.5 24a7.5 7.5 0 0 1 15 0M17 24a3 3 0 0 1 6 0" strokeWidth="1.5" />
        <path d="M9 29h22" strokeWidth="1.5" />
        <circle cx="20" cy="11" r="1.6" fill="currentColor" stroke="none" />
      </svg>
      <span className="leading-none">
        <span className="block font-display text-[1.45rem] font-semibold tracking-[0.08em]">{SITE.name}</span>
      </span>
    </span>
  );
}

export function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href) || (href === "/archive" && path.startsWith("/search")));

  return (
    <header className={`on-ink fixed inset-x-0 top-0 z-50 text-paper transition-colors duration-300 ${solid || open ? "bg-ink/95 backdrop-blur" : "bg-ink"}`}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-paper focus:px-3 focus:py-2 focus:text-ink">Skip to content</a>
      <div className="wrap flex h-[4.5rem] items-center justify-between">
        <Link href="/" aria-label={`${SITE.name} home`}><Logo /></Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${active(n.href) ? "bg-paper text-ink" : "text-paper/80 hover:text-paper"}`}>
              {n.label}
            </Link>
          ))}
          <Link href="/search" className="ml-3 inline-flex items-center gap-2 rounded-full bg-clay px-4 py-2 text-sm font-semibold text-paper hover:bg-clay-deep">
            <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="9" r="6" /><path d="m14 14 4 4" strokeLinecap="round" /></svg>
            Search
          </Link>
        </nav>
        <button type="button" className="grid h-11 w-11 place-items-center rounded-full border border-paper/30 md:hidden" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>
          <svg aria-hidden viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            {open ? <path d="M5 5l10 10M15 5 5 15" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
          </svg>
        </button>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Main" className="wrap border-t border-paper/15 pb-6 pt-3 md:hidden">
          {[...NAV, { href: "/search", label: "Search" }].map((n) => (
            <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined} className="flex items-center justify-between border-b border-paper/10 py-4 font-display text-2xl">
              {n.label}
              <span aria-hidden className="text-ochre">→</span>
            </Link>
          ))}
        </nav>
      )}
      <div aria-hidden className="lines-arc h-[9px] opacity-25" style={{ backgroundSize: "36px 18px" }} />
    </header>
  );
}
