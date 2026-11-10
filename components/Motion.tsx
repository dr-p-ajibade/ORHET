"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Smooth scrolling (Lenis) and gentle reveals (GSAP). Both switch off entirely
// when the visitor has asked their device for reduced motion.
export function Motion() {
  const path = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let lenis: { raf: (t: number) => void; destroy: () => void } | undefined;
    let raf = 0;
    let dead = false;
    import("lenis").then(({ default: Lenis }) => {
      if (dead) return;
      lenis = new Lenis({ duration: 0.9, anchors: true });
      const loop = (t: number) => { lenis!.raf(t); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
    });
    return () => { dead = true; cancelAnimationFrame(raf); lenis?.destroy(); };
  }, []);

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!els.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { document.documentElement.classList.add("reveal-off"); return; }
    let ctx: { revert: () => void } | undefined;
    let dead = false;
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (dead) return;
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        ScrollTrigger.batch(els, {
          start: "top 92%", once: true,
          onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", stagger: 0.06, overwrite: true }),
        });
      });
    }).catch(() => document.documentElement.classList.add("reveal-off"));
    return () => { dead = true; ctx?.revert(); };
  }, [path]);

  return null;
}
